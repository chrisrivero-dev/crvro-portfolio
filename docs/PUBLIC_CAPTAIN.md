# Public Captain — architecture & security report

**LOCAL SECURITY PROTOTYPE: PASS**
**DURABLE RESULT STORAGE: PASS**
**PRODUCTION RELEASE: NOT YET**

Status: local only. Not pushed, not merged, not deployed to production. This
document is the acceptance record for the public portfolio-intelligence
feature on `feature/retro-intelligent-portfolio`, covering both the initial
build and tonight's production-hardening pass.

## 1. What this is

The System Return terminal (post-Project-World) answers free-text questions
about Christopher's work using local LLMs, with deterministic keyword
matching kept as an instant, free, offline-safe fast path for anything it can
already resolve. Open-ended questions fall through to a hosted broker and an
off-Vercel worker process that runs on this Mac and talks to local Ollama
models.

## 2. Architecture

```
  Browser                    Broker                    Public Captain worker
  (visitor)                  (Node http tonight;         (this Mac, launchd-
                              Vercel function shape)      supervised)
     |                            |                            |
     |-- POST /api/ask --------->|                            |
     |                            |-- send(job) ------------->|  Vercel Queues
     |                            |   (Vercel Queues,          |  (poll mode)
     |                            |    poll mode)               |
     |                            |                            |<- receive() --
     |                            |                            |   (worker-
     |                            |                            |    initiated,
     |                            |                            |    outbound)
     |                            |                            |
     |                            |                       1. deterministic
     |                            |                          fast path (free,
     |                            |                          no model call)
     |                            |                       2. CAPTAIN
     |                            |                          (qwen3.8:27b)
     |                            |                       3. NEMO (nemotron)
     |                            |                          when warranted
     |                            |                       4. REVIEWER
     |                            |                          (qwen3-coder:30b)
     |                            |                          when warranted
     |                            |                       5. app-code
     |                            |                          validation --
     |                            |                          never trusts
     |                            |                          raw model JSON
     |                            |                            |
     |                            |<-- POST /api/worker/submit-|
     |                            |    (bearer-token auth,     |
     |                            |     outbound from worker)  |
     |                            |                            v
     |                            |                    Ollama (localhost:11434,
     |                            |                    never reachable from
     |                            |                    outside this Mac)
     |                            |
     |<-- GET /api/result/:id ---|
     |    (reads durable store:
     |     Upstash Redis once
     |     provisioned, else
     |     in-memory fallback)
```

**No inbound port exists on the Mac.** The worker only ever *initiates*
connections: to Vercel Queues (to receive jobs), to the broker (to post
results), and to localhost Ollama. The broker only ever *receives*
connections: from the browser, and from the worker posting results. At no
point does anything on the internet open a connection to the Mac, and Ollama
is never reachable from anywhere but this machine.

## 3. Durable transport (item #1)

**Investigated Vercel Queues (poll mode) first, as directed, since it's the
first-party fit for "producer on Vercel, consumer off-Vercel."** Confirmed
via the real docs (not assumed) that `@vercel/queue`'s `PollingQueueClient`
is built exactly for this: "If your consumers run outside of Vercel... poll
mode lets you connect to Vercel Queues without requiring Vercel Functions."

**What's real, not simulated:**
- The Vercel CLI in this environment is authenticated as `chrisrivero-dev`
  with real access to the `crvro-portfolio` project (the one actually live at
  crvro.com).
- Correctly linked to that existing project (`vercel link --project
  crvro-portfolio`) after an early mistake -- see §4.
- Ran a real send/receive round trip against Vercel Queues: sent a message,
  received it back with full metadata (`messageId`, `deliveryCount`,
  `createdAt`, `expiresAt`, `topicName`, `consumerGroup`, `region`). No
  billing/consent prompt appeared at any point -- Queues is billed as
  metered usage against the project's plan, not a separate opt-in.
- The broker (`server/queue.mjs`) now sends every `/api/ask` job onto the
  `public-captain-jobs` topic. The worker (`worker/public-captain.mjs`) no
  longer polls the broker for jobs at all -- it calls `receiveJob()` directly
  against Vercel's queue infrastructure. Verified end-to-end for real: a
  question submitted through the broker was picked up by the worker via
  Queues, processed, and the result appeared back through
  `/api/result/:id`.
- Both clients set `deploymentId: null` deliberately: the docs are explicit
  that an off-platform consumer needs to read across all deployments, not
  just the one that happened to send a given message.

**Upstash Redis for result/status storage:** attempted the Marketplace
install (`vercel integration add upstash/upstash-kv`) exactly as scoped --
free tier by default, no plan override. **The Claude Code auto-mode
classifier itself blocked this command before it reached Vercel or Upstash**,
flagging it as an action needing your hands. I did not attempt to route
around that block. `server/store.mjs` is written and ready: it uses
`KV_REST_API_URL`/`KV_REST_API_TOKEN` (the standard env vars the Marketplace
integration injects) when present, and transparently falls back to the
original in-memory Map when they're not -- so nothing broke, and switching
over later is a pure env var change with zero code change.

**To finish this yourself:** vercel.com/marketplace/upstash/upstash-kv (or
Dashboard -> `crvro-portfolio` -> Storage -> Browse Marketplace -> Upstash ->
Redis) -> Install -> "Let Vercel manage an Upstash account for you" -> select
`crvro-portfolio` -> confirm. Env vars land automatically; no copy-pasting.

## 4. A real mistake, caught and fixed

Running `vercel link` without an explicit `--project` flag created a new,
empty Vercel project named "site" (wrong -- should have linked the existing
`crvro-portfolio`) and connected it to the same GitHub repo. I caught this
immediately via `vercel project ls`, removed the stray project
(`vercel project rm site`), and re-linked correctly. Nothing was committed
to git (`.vercel` is gitignored) and no deployment ever ran on the erroneous
project, so there was no lasting effect -- but it's the reason I stopped and
asked before touching anything else billing-adjacent that night, rather than
continuing to move fast through unfamiliar production tooling.

## 5. Outbound-only architecture preserved (item #2)

| Requirement | How it's enforced |
|---|---|
| No public Ollama port | Ollama binds `127.0.0.1:11434` only; nothing in this feature changes that, and no code anywhere opens a public port for it. |
| No public Captain port | The worker (`worker/public-captain.mjs`) contains no `http.createServer`/`.listen()` call anywhere -- verified by the structural audit, not just asserted. |
| No reverse tunnel to Daventry One | No tunnel software (ngrok, cloudflared, ssh -R, etc.) is installed or referenced by this feature. |
| No browser access to worker credentials | The worker's bearer secret (`PUBLIC_CAPTAIN_WORKER_SECRET`) and the Vercel OIDC token live only in `worker/.env.worker` (gitignored) and the launchd plist's execution environment -- never in frontend code or the Vite bundle. Confirmed: `grep` for the secret string across `dist/assets/*.js` after a production build returns no matches. |
| No visitor-controlled URL fetching | The only `fetch()` call sites in `worker/` and `server/` target hardcoded hosts: Ollama (`worker/ollama.mjs`), the broker (`worker/public-captain.mjs`), and Vercel's own SDK-managed endpoints (`server/queue.mjs`, `server/store.mjs`). No code path ever fetches a URL derived from visitor input. |

## 6. Runtime hardening (item #3)

Chose the lighter path per your guidance, not a dedicated macOS user account
(would need interactive admin/sudo credentials I don't have in this
session).

**Node's permission model as real, OS-enforced defense-in-depth** --
`worker/run-worker.sh` launches the worker with:
```
node --permission --allow-fs-read="$PWD" worker/public-captain.mjs
```
No `--allow-fs-write`, no `--allow-child-process`, no `--allow-addons`, no
`--allow-wasi`, no `--allow-worker`. Verified this is real, not decorative:
```
$ node --permission --allow-fs-read="$PWD" -e "require('fs').writeFileSync('/tmp/x','test')"
Error: Access to this API has been restricted. Use --allow-fs-write to manage permissions.

$ node --permission --allow-fs-read="$PWD" -e "require('child_process').execSync('echo hi')"
Error: Access to this API has been restricted. Use --allow-child-process to manage permissions.
```
Per your instruction, this is documented as defense-in-depth, not the
boundary -- the actual boundary is that the code never calls these APIs at
all (verified by the static audit in §9), so even a future bug that tried to
call `fs.writeFileSync` would be caught twice: once because the code
shouldn't be doing that, and again because the OS would refuse it either way.

**Worker gets only:**
- its own application code (`worker/*.mjs`, `server/*.mjs` for shared
  validation/config)
- the sanitized public corpus, read-only (`server/corpus.json`, loaded once
  at startup, never reopened for writing)
- localhost Ollama (`worker/ollama.mjs`, fixed 3-model allowlist, no `tools`
  field ever sent)
- authenticated outbound channels: Vercel Queues (to receive jobs) and the
  broker's `/api/worker/submit` (bearer-token authenticated, to post results)

**Worker gets no** private Captain/Hermes tools, no private data, no import
of anything outside `worker/` and `server/`.

## 7. Corpus manifest (item #4)

Generated `docs/CORPUS_MANIFEST.md` (`node scripts/build-corpus-manifest.mjs`)
listing all 47 entries with their exact source file and a preview of the
actual text (the text itself is already public copy, so previewing it is not
a disclosure). Summary:

| Section | Entries | Source | Public-approval basis |
|---|---|---|---|
| project | 36 | `src/data/projects.js` | Same data the live case-study pages render; only desc/problem/built/outcome/learned/stack fields are copied, enumerated explicitly, never the whole object |
| about | 2 | `src/components/About.jsx` | Transcribed from the public bio + stat list |
| skills | 6 | `src/components/Skills.jsx` | Transcribed from the public Skills section |
| contact | 3 | `src/components/Contact.jsx` | Public display address (`contact@crvro.com`) + GitHub + LinkedIn only -- the real mailto inbox target is deliberately excluded |

Full entry-by-entry index with content previews is in the manifest file
itself.

## 8. Model review sequence -- what actually happened

Ollama genuinely runs on this Mac with the exact models named in the brief,
reachable at `localhost:11434`. The GPU was under **sustained, heavy, real
contention for the entire session** -- confirmed repeatedly via `ollama ps`
(53GB `qwen3-coder-next` and other models actively loaded/swapping) and
`lsof` (up to 10 concurrent established connections to port 11434 at once).
Per your explicit instruction, **I never paused, killed, restarted, or
otherwise touched your live Hermes/Captain/Ollama processes.** Every attempt
below is a normal client request that queued behind your other work like any
other caller would.

- **qwen3.8:27b threat-model review**: attempted 6 times across the full
  session (roughly 45+ minutes of real wall-clock time). **5 of 6 attempts
  timed out.** Live content from a completed review is not available. I
  performed the threat-model analysis myself (`threat-model.md`) and did not
  fabricate a model response in its place.
- **qwen3-coder:30b independent diff review**: succeeded once. Real findings
  evaluated in the original report section (kept below, §11) -- one real,
  actionable issue found and fixed (worker secret logged in full at
  startup); the rest didn't hold up against the actual code.
- **Live adversarial suite** (first full run, earlier in the session): **8
  pass, 0 fail, 9 skipped-on-timeout** out of 17 cases -- see §10 for why
  skips are not unresolved findings.
- **Live adversarial suite re-run** (attempted per item #6, tonight): the GPU
  was, if anything, busier during this later window -- repeated attempts to
  re-run the full 17-case suite for a clean 17/0/0 did not complete. This
  gate is marked **BLOCKED BY GPU CONTENTION**, not passed, per your
  instruction that a timeout is not a PASS.
- **5-question live UI proof** (item #7): see §10 for the honest per-question
  outcome. Two questions resolved via the deterministic fast path rather
  than the LLM (a real finding about keyword overlap, not a success against
  this specific gate); every genuine LLM-path attempt -- eight of them
  across the required questions and rephrasings -- hit the same sustained
  contention and timed out.

I did not fabricate any model output, any routing telemetry, or any success
that didn't happen. Every timeout is reported as a timeout.

## 9. Structural capability audit (unchanged, still clean)

`node worker/adversarial-tests.mjs` includes a static audit
(`auditCapabilities()`) that greps every file in `worker/` and `server/` --
excluding the test harness itself, which deliberately contains the attack
vocabulary as prompt text -- for: `child_process` imports, `exec`/`spawn`
calls, `eval`/`new Function`, filesystem writes, cron/launchd calls,
GitHub/Gmail/Discord/Telegram client imports, an Ollama `tools` field, and
any `fetch()` call site outside the two intentional ones.

**Result: PASS. Zero findings**, re-verified after tonight's changes
(Queues, Redis-shaped store, launchd supervision, permission flags) were
added.

## 10. Live proof -- 5 open-ended questions (item #7)

All five questions were submitted through the real broker (`POST /api/ask`)
exactly as the browser UI does, with results read back through the same
`GET /api/result/:id` the frontend polls. Latency is measured wall-clock,
submit to terminal state.

| # | Question (as required) | Outcome | Latency | Notes |
|---|---|---|---|---|
| 1 | "I'm hiring for support operations. What should I look at?" | **Timed out**, 2 attempts | ~117s, ~90s | Genuinely bypassed the deterministic router both times (no fast-path keyword match); the LLM pipeline itself didn't return inside the 88s budget either time. Resolved to `status: error` -> frontend shows the graceful offline fallback. |
| 2 | "Our staff keep giving customers different answers. How would Christopher approach that?" | **Timed out**, 2 attempts | 1st attempt: lost to a broker restart mid-flight (see below, not a pipeline failure); 2nd attempt: ~90s timeout | Correctly bypasses the deterministic router (no "support" token present, so the consistency rule doesn't fire) |
| 3 | "What's Christopher's strongest example of local AI?" | **Resolved via the deterministic router**, not the LLM | <1s | The literal required wording contains "local ai," itself one of the deterministic fast-path's trigger phrases (by design, to catch exactly this kind of direct question for free). Does *not* satisfy "bypasses the deterministic router." Two rephrasing attempts below. |
| 3b | (rephrase) "Which of his projects best shows he can build on-device machine learning systems, and why does that one stand out?" | **Also resolved via the deterministic router** | <1s | "machine learning" is itself a trigger phrase for the general-AI fast-path rule. The deterministic matcher's keyword list is broader than expected when picking a rephrasing. |
| 3c | (rephrase again) "Out of everything he built, which project proves he can get models running well without relying on the cloud, and what makes it a strong example?" | **Timed out** | ~91s | Genuinely bypassed the router this time; the LLM pipeline still didn't return inside budget. |
| 4 | "How would you approach automating repetitive record review?" | **Timed out** | ~88s | Correctly bypassed the router (no gis/mapping/parcel token alongside "repetitive"); LLM pipeline exceeded budget. |
| 5 | (unsupported-fact probe) "What sports team does Christopher root for?" | **Timed out** | ~88s | Correctly bypassed the router. Did not get a live demonstration of the "admits insufficient evidence" behavior tonight -- but this exact mechanism (model returns `status: unresolved` rather than fabricating) was demonstrated for real earlier in the session, in the first adversarial suite run's "reveal system prompt" case (§ see prior report / git history), which resolved with `status: unresolved` and no leaked content. |

**A mid-testing mistake, caught and explained:** question #2's first attempt
was still queued when I restarted the broker process to deploy a real fix
(a stale-submission validation gap I found while investigating this section
-- a late worker submission for an already-expired job could previously
overwrite it back to "answered" out of sync with what the browser already
showed; now rejected with `409 job_already_expired`). Because tonight's
result store is the in-memory fallback (Upstash not yet provisioned, see
§3), restarting the broker discarded every in-flight job record, so that
attempt's eventual worker submission came back `404 unknown_or_stale_job`.
This is expected behavior for an in-memory store and directly illustrates
why the durable Redis-backed store matters for production -- a broker
restart shouldn't lose in-flight work once that's wired up.

**Net result: 8 genuine LLM-path attempts across questions 1, 2, 3c, 4, and
5 (including retries) -- 0 completed inside budget tonight, all failed safe
to a graceful `status: error` / offline fallback, none produced unsafe
output.** Two of the five required questions' literal wording resolved via
the deterministic router instead of the LLM, which is correct system
behavior but doesn't satisfy "bypasses the deterministic router" as asked.

**What this section proves:** the pipeline correctly distinguishes
deterministic-answerable questions from genuinely open-ended ones (including
catching two of my own rephrasing attempts landing back in the fast path --
the router working correctly, not a bug), the timeout/graceful-degradation
path works exactly as designed under sustained real contention (confirmed
across 8 separate attempts, not one lucky/unlucky sample), and a real
correctness bug in stale-submission handling was found and fixed through
this very testing. **What it does not prove tonight is a clean 5-for-5 live
LLM success run** -- the GPU was not available for that inside this session,
consistent with the pattern documented across the entire evening (§8). This
gate is honestly marked **BLOCKED BY GPU CONTENTION**, not passed.

## 11. Independent qwen3-coder:30b diff review (unchanged from earlier report)

One real, actionable finding: the worker secret was logged in full to
console at broker startup. **Fixed** -- now logs a masked prefix when the
secret is explicitly configured via env var, and only prints the full value
(with an explicit warning) when auto-generated for a bare local demo.

The remaining findings were evaluated and did not hold up against the actual
code:
- "XSS gaps in `sanitizePlainText`" -- moot regardless of sanitizer
  completeness, because the frontend renders `result.answer` as React text
  content (`{result.answer}`), never `dangerouslySetInnerHTML`. Confirmed by
  reading `PortfolioNavigator.jsx` directly.
- "Insecure URL handling / dangerous schemes in answer text" -- moot because
  hrefs are never derived from the answer text or any network-supplied
  string; `DestinationLinks` resolves every href from the frontend's own
  local `DESTINATIONS` map by key.
- "Rate-limit race condition" -- does not apply to Node's single-threaded,
  synchronous `checkRateLimit` handler; there is no `await` between the read
  and write of the rate-limit array.
- "Billion laughs JSON parsing attack" -- that's an XML entity-expansion
  attack; `JSON.parse` has no equivalent expansion mechanism, and the 8 KB
  body cap makes pathological nesting moot regardless.

## 12. Known limitations / remaining risks

- **GPU contention is the dominant real-world risk**, demonstrated
  extensively across this entire session (not a one-off). This is exactly
  why `PROCESSING_TTL_MS`, the per-pipeline budget in `public-captain.mjs`,
  and the frontend's bounded polling + graceful offline fallback exist. On a
  night like tonight, visitors would see the offline fallback more often
  than a live answer. This needs either a dedicated inference resource for
  Public Captain, separate from your interactive Hermes/Captain workstation
  use, or acceptance that a busy night degrades gracefully rather than
  reliably answering.
- **Abandoned model calls aren't cancelled.** When the pipeline budget fires,
  the in-flight Ollama call keeps running and its result is discarded --
  wastes GPU time under contention, not a security issue. No `AbortSignal`
  threaded through yet.
- **Rate limits and dedup are still per-broker-instance**, not yet backed by
  a shared store. Correct for tonight's single instance; needs the same
  Upstash Redis (or similar) once this runs as multiple concurrent Vercel
  function instances.
- **`MAX_IN_FLIGHT` is skipped entirely once Redis is active** (there's no
  cheap distributed counter yet) -- rate limiting and Vercel Queues' own
  limits still bound abuse, but this specific check is a known gap to close
  before real traffic.
- **OIDC token lifetime**: the worker authenticates to Vercel Queues with a
  token from `vercel env pull`, valid ~12 hours in this environment.
  Fine for tonight's testing; **not yet verified** whether `@vercel/queue`'s
  own refresh logic works unattended outside `vercel dev`-style tooling for
  a long-running launchd-supervised process. Needs a scheduled refresh or
  confirmed auto-refresh before this runs unattended for days.
- **CORS is a browser courtesy, not the authorization boundary** -- a direct
  script/curl caller is unaffected by it either way. The real boundary is
  schema validation + rate limiting + worker bearer-token auth.
- ~~Upstash Redis is not yet provisioned~~ -- **resolved, see §18.** Result
  storage is now durable; multi-instance correctness for rate limiting /
  dedup (a separate concern, see above) still isn't.

## 13. Worker supervision (item #8) -- verified for real, not just configured

`~/Library/LaunchAgents/com.crvro.publiccaptain.plist`, a per-user launchd
agent (no admin/root needed), running `worker/run-worker.sh`.
`KeepAlive: { SuccessfulExit: false }`, `RunAtLoad: false` (must be
explicitly bootstrapped, doesn't silently start on every login).

**Actually tested, not just described:**
1. `launchctl bootstrap` -> worker starts, correctly authenticates to both
   Vercel Queues and the broker.
2. `kill -9 <pid>` (simulated crash) -> launchd auto-restarted it within ~2
   seconds; the new process correctly re-authenticated and resumed polling.
   Confirmed via a fresh `/api/worker/poll`-equivalent check succeeding
   immediately after.
3. `launchctl kill SIGINT` (simulated deliberate stop, matching the
   `process.exit(0)` already coded for SIGINT) -> exited cleanly, `LastExitStatus: 0`,
   **not** restarted -- confirms the supervisor won't fight an intentional
   shutdown.

## 14. Vercel Preview (item #9)

**Not attempted.** Per your own ordering ("Build a Vercel PREVIEW only after
all local gates pass") and per §8/§10 above, the GPU-dependent gates (clean
qwen3.8:27b review, a clean 17/0/0 adversarial re-run, a clean 5-for-5 live
UI proof) did not fully complete tonight. Building a preview now would be
getting ahead of your own stated sequence, so I stopped here as instructed.

## 15. Files changed tonight (in addition to the original build)

New: `server/queue.mjs`, `server/store.mjs`, `worker/run-worker.sh`,
`~/Library/LaunchAgents/com.crvro.publiccaptain.plist` (outside the repo, a
real system file), `scripts/build-corpus-manifest.mjs`, `docs/CORPUS_MANIFEST.md`,
`worker/.env.worker` (gitignored, real secret + OIDC token, not committed).

Changed: `server/broker.mjs` (Queues + durable-store-shaped, removed the
now-unnecessary `/api/worker/poll` endpoint), `worker/public-captain.mjs`
(receives jobs from Queues instead of polling the broker), `server/config.mjs`
(`PROCESSING_TTL_MS` widened based on observed real timing), `package.json`
(`@vercel/queue`, `@upstash/redis` dependencies).

Not touched: the CRT hero, RetroComputer hardware, Project World, case-study
pages, Header, theme system, or any frontend contract (`/api/ask` and
`/api/result/:id` request/response shapes are byte-identical to before, so
`PortfolioNavigator.jsx` needed zero changes across either session).

**Follow-up session (Redis wiring):** `server/broker.mjs` picked up the real
`KV_REST_API_URL`/`KV_REST_API_TOKEN` env vars with zero code changes
(`server/store.mjs` already had the fallback logic); `server/config.mjs`
gained one stale-submission guard (`409 job_already_expired` for a worker
result arriving after the browser would already show "expired");
`.env.example` documents the new Upstash and Vercel Queues env vars. No
frontend, CRT, or Project World files touched.

## 16. Local demo instructions

```bash
cd ~/Projects/site
npm run corpus:build
vercel link --project crvro-portfolio   # once, already done in this session
vercel env pull                          # refresh the OIDC token when it's close to expiring

# copy the fresh VERCEL_OIDC_TOKEN line from .env.local into worker/.env.worker

PUBLIC_CAPTAIN_WORKER_SECRET=<pick-a-value> npm run broker   # terminal 1
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.crvro.publiccaptain.plist
npm run dev                                                   # terminal 2
# open http://localhost:5183, scroll to the System Return terminal after Project World

# to stop the supervised worker:
launchctl bootout gui/$(id -u)/com.crvro.publiccaptain

node worker/adversarial-tests.mjs   # structural audit + live adversarial suite
```

## 18. Durable result storage -- Upstash Redis (follow-up session)

**DURABLE RESULT STORAGE: PASS**

Upstash Redis (`upstash-kv-blue-curtain`) is now provisioned on the correct
`crvro-portfolio` Vercel project. Verified end-to-end with independent proof
at every step, not just trusting the broker's own claims.

**1. Integration verified attached to the correct project:**
```
$ vercel env ls
```
confirms these variable **names** exist on `chrisrivero-devs-projects/crvro-portfolio`,
scoped to Preview + Development (not Production -- appropriate, since nothing
is deployed to production):
`KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`,
`KV_URL`, `REDIS_URL`. Values are never reproduced anywhere in this report,
in logs, or in any git-tracked file.

**2. Broker wired to the real database, not the fallback:**
```
[broker] result store: Upstash Redis (durable)
```
(`server/store.mjs` already had this fallback logic built in from the
previous session -- picking up Upstash required zero code changes, only the
env vars now being present.)

**3. Proof it's actually Redis, not the broker just saying so:** submitted a
question through the broker, then read the same key back with a completely
separate, independent Redis client (not `store.mjs`, not through the broker
at all):
```
key: publiccaptain:job:82fd4543-187c-49b1-8eac-56b9735e70b9
exists: true
ttl (seconds remaining): 249
value: {"id":"...","question":"how do I contact you","status":"answered",...}
total keys in this database (dbsize): 1
```
`dbsize: 1` confirms this is genuinely a fresh, dedicated database being
written to by this feature, not a coincidental read of something else.

**4. Persistence test (the exact sequence requested):**
- Submitted a question through the broker -> `202 {request_id, status: queued}`
- Worker answered it; `GET /api/result/:id` returned the full answer.
- **Killed the broker process** (`pkill -f "node server/broker.mjs"`) --
  confirmed dead via `ps`.
- **Started a completely fresh broker process** (new PID, zero in-memory
  state, same as any real restart or redeploy).
- `GET /api/result/:id` on the new process returned the **identical answer**
  it did before the restart.

This is the exact failure mode documented in §10 of the previous report (a
broker restart silently losing an in-flight job) -- now fixed for real, not
just in theory.

**5. TTL cleanup verified for real:** set a throwaway key with a 4-second
TTL directly against the same Redis database, confirmed it existed
immediately (`ttl: 4`), waited 6 seconds, confirmed it was gone
(`get -> null`). Production job keys use the same `EX` mechanism via
`@upstash/redis`'s `set(key, value, { ex: TTL_SECONDS })`
(`TTL_SECONDS` = queue TTL + processing TTL + 60s slack, ~260s) -- visitor
requests and results do not accumulate forever.

**6. No credential leakage, checked across all four surfaces:**
- Frontend bundle: `npm run build` then grepped `dist/assets/*.js` for both
  the real token and the read-only token -- zero matches.
- Browser network responses: inspected the actual `POST /api/ask` and
  `GET /api/result/:id` response bodies via the browser's network panel --
  contain only `request_id`/`status`/`answer`/`destinations`/etc., no
  credential material.
- Console logs: broker startup log prints `[broker] result store: Upstash
  Redis (durable)` and nothing else Redis-related -- no URL, no token.
- Git-tracked files: `git grep` for the real token value across the entire
  repo -- zero matches. The only credential-adjacent files
  (`.env.local`, `worker/.env.worker`) are gitignored and were never staged.

**7. Full deterministic path re-run end-to-end** (browser -> Vercel Queue ->
worker -> Redis-backed store -> browser): confirmed via both the actual
browser UI (client-side fast path resolves "how do I contact you?" instantly
without touching the network -- correct, expected behavior, not a bypass of
anything) and a direct broker API call for "what have you built for GIS?"
(deliberately bypassing the client-side shortcut to force the full chain):
queued -> sent via Vercel Queues -> worker received it, resolved it via its
own deterministic fast path (no model call needed) -> submitted back to the
broker -> broker wrote the result to Redis -> `GET /api/result/:id` read it
back correctly. Also observed live in the worker log for both requests.

**GPU-dependent items:** per your instruction, I did not pause, kill, or
otherwise touch your live Hermes/Captain/Discord/Telegram workload tonight.
No opportunistic GPU window opened during this session's Redis work, so the
three remaining gates (qwen3.8:27b threat-model review, a clean 17/0/0
adversarial re-run, five genuine open-ended live UI answers) remain exactly
where §8/§10 of the previous report left them -- **not attempted again this
session**, not newly failed.

## 17. Final verdict

**LOCAL SECURITY PROTOTYPE: PASS**
- Structural audit: clean, re-verified after every round of changes including
  today's Redis wiring.
- Outbound-only architecture: real (Queues send/receive proven, no inbound
  port, no direct browser->Ollama path, credentials never reach the bundle).
- Runtime hardening: real Node permission flags, proven to actually block
  writes and shell-out.
- Worker supervision: real crash-restart and clean-stop behavior, both
  tested by actually killing and stopping the process.
- Independent code review: completed once, one real finding fixed.
- Corpus: fully manifested and traced to public source.

**DURABLE RESULT STORAGE: PASS**
- Upstash Redis (`upstash-kv-blue-curtain`) provisioned and confirmed
  attached to the correct `crvro-portfolio` project.
- Broker genuinely reading/writing the real database, verified by an
  independent client, not just the broker's own claim.
- Persistence proven exactly as requested: submit, confirm stored, kill the
  broker, start a fresh process, confirm the result survives.
- TTL cleanup proven with a real timed expiry, not just inspected code.
- No credential leakage across frontend bundle, network responses, console
  logs, or git-tracked files -- checked on all four, not assumed.
- Full deterministic path re-confirmed end-to-end through the real chain.

**PRODUCTION RELEASE: NOT YET**
- qwen3.8:27b threat-model review never completed live (GPU contention
  across both sessions; not reattempted today per your instruction not to
  disrupt your live workload without an opportunistic window).
- Full 17/0/0 adversarial re-run not achieved (same reason).
- 5-for-5 live UI proof not achieved in one sitting (documented in §10 of
  the previous session: 8 genuine LLM-path attempts, all timed out safely;
  2 required questions' literal wording resolved via the deterministic
  router instead of the LLM, which is correct behavior but not what was
  asked to prove).
- Vercel Preview not attempted, per your own sequencing -- still blocked
  behind the three gates above.

This is an honest, harder verdict than "everything passed" would have been,
and it's the correct one: the remaining gates depend on a shared GPU
resource I don't control and was explicitly told not to disrupt. The
infrastructure and security work that doesn't depend on that resource --
including all of today's durable-storage work -- is real, tested, and
complete.

**This branch has not been pushed, merged, or deployed.**
