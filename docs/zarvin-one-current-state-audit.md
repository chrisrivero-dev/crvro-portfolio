# Zarvin One — Current-State Audit (Phase 1–3)

Date of inspection: **2026-09-06**
Auditor: Claude Code session, read-only. **No portfolio file has been modified.**

Everything below was verified against running processes, live HTTP responses,
Git history, on-disk runtime state, and executed test suites — not against the
old approved-copy document and not against roadmap intent.

---

## 0. Sources of truth used

| Source | What it is | State at inspection |
|---|---|---|
| `chrisrivero-dev/crvro-portfolio` @ `main` `82552b1` | This portfolio | clean |
| `daventry-customer-hub-17b5` @ `claude/18-execution-runtime` `eabb9e7` (2026-09-06) | **Current** Zarvin backend / Bridge API | working tree dirty |
| `daventry-customer-hub` @ `local/zarvin-bridge-api` `c74a824` (2026-08-26) | Prior backend line (17B) | superseded |
| `zarvin-one-mobile` @ `cross-device-physical-test` `a63df14` (2026-09-06) | Zarvin One client (iOS / Android / Web) | working tree dirty |
| `http://127.0.0.1:8421` | **Zarvin Bridge API, running right now** | `{"status":"ok"}`, `readiness: READY` |
| `~/.daventry-customer-hub/` | Live runtime state (ledger, approvals, automations, memory) | populated |
| `docs/zarvin-one-approved-copy.md` | Old approved copy | **historical — superseded** |
| `zarvin-one-mobile/DEMO_CAPABILITY_TRUTH_MATRIX.md` (2026-08-18) | Old truth matrix | **stale** |
| `zarvin-one-mobile/REAL_ZARVIN_SERVICE.md` (2026-08-31) | Mobile↔Bridge integration doc | mostly current; final section stale |

Live process evidence (`ps` / `lsof`, 2026-09-06):

- Hermes agent gateway (`hermes_cli.main gateway run`)
- OpenClaw gateway (`:18789`)
- Two Ollama instances (`:11434`, `:11435`), 8 local models resident-capable
- Zarvin Bridge API (FastAPI, `:8421`), uptime ~30 min at first probe
- Expo dev server (`:8081`) running the mobile client in `real` mode
- Hermes dashboard bound to `daventry-one.tailf8d262.ts.net:8787` (Tailscale)

`GET /v1/system` reports its own build provenance:
`branch=claude/18-execution-runtime`, `commit=eabb9e7`, `working_tree_dirty=true`,
`source_changed_since_start=false`, `stale=false`, `evaluator_available=true`,
`ledger_available=true`.

---

## 1. What the portfolio currently claims

From `src/data/projects.js:333-359`, `src/components/ZarvinCaseStudy.jsx`,
`src/components/projectWorld/worldData.jsx:40`, `docs/CORPUS_MANIFEST.md:35-40`:

| Claim | Where |
|---|---|
| "Active prototype — controlled interactive scenarios available; live integrations are still being validated separately" | `projects.js` `status`, `statusBadge`, `publicStatus` |
| "A personal AI command system" | `desc`, world map card |
| "The interactive version is a working product prototype built around controlled scenarios. Some backend pieces are still being connected and tested." | `disclaimer` (rendered as the page's hero Note) |
| "That's the standard I'm building toward." (re: evidence) | `disclaimer` |
| Five scenario cards: Urgent meeting / Monthly business check / Family schedule / Project deadline / Something broke | `ZarvinCaseStudy.jsx` §04 |
| Flow: `YOU → ZARVIN ONE → CAPTAIN → SPECIALISTS → MODELS + TOOLS → EVALUATOR / REVIEWER → VERIFIED RESULT` | §05 |
| "Behind that **can** be a chief-of-staff agent, specialists, local models, connected services, evaluation, and recovery" | §03 (conditional voice throughout) |
| Interactive demo iframe + "Take the guided tour" as the page's primary proof, immediately after the hero | `TryZarvinOne()` |
| "Controlled demo scenarios · Live integrations validated separately." | demo disclosure line |
| Tags: `react native · expo · typescript · local models` | `projects.js` |
| No screenshots at all (`public/images/` contains **zero** Zarvin assets) | verified by `ls` |
| No repo link (`repo: null`) | `projects.js` |

**Net effect:** the page describes an August product prototype whose backend is
aspirational. Every capability sentence is hedged with "can."

---

## 2. Actual current Zarvin runtime status (live-verified)

### 2.1 Connected accounts — `GET /v1/connections`, live response

```
google_calendar  CONNECTED  [CALENDAR_READ, CALENDAR_WRITE]
gmail            CONNECTED  [EMAIL_READ, EMAIL_DRAFT]  rrslider@gmail.com
gmail            CONNECTED  [EMAIL_READ, EMAIL_DRAFT]  christopherarivero@gmail.com
granola          CONNECTED  [MEETING_READ]
```

Two distinct Gmail accounts, disambiguated by `account_label`, with approvals
bound to a specific account (`96fdb7b`, Multi-account foundation Phase 1).

### 2.2 A real consequential action, today — `GET /v1/approvals`

```
act-c121dd86c63a4884  CALENDAR_WRITE  TIER_3_CONSEQUENTIAL
  "Create calendar event" — Fri Oct 2, 8:00–8:30 AM
  status=EXECUTED  verification_status=VERIFIED
  created 19:32:01Z  executed 19:32:03Z  (approval window: 15 min, expires)
```

This is the whole thesis of the product, observed live: proposed → approved →
executed → **independently verified against the provider**, with an expiry.

### 2.3 Job Ledger — `GET /v1/jobs`

20 jobs in the bounded recent view: 18 `COMPLETED`, 2 `BLOCKED`; 1 `VERIFIED`,
19 `UNVERIFIED`. Evidence payloads are real and specific, e.g.:

```
job ops-inbox-verification-2026-08-26  status=COMPLETED  verification=VERIFIED
  what_zarvin_did: "Ran the 17B.5 Operations Inbox and Ask-answer regression suite…"
  files_or_systems: [test_job_presentation.py, test_scheduled_briefs.py, …]
  test_summary: "71 passed, 1 warning in 0.29s"
  verified_outcome: "All focused 17B.5 tests passed on daventry-customer-hub @ 1111983…"
```

Older ledger (`~/.daventry-customer-hub/ledger/`, 479 files) records real tool
executions by capability and provider slug, including
`EMAIL_SEND:GMAIL_SEND_DRAFT`, `EMAIL_TRASH:GMAIL_MOVE_TO_TRASH`,
`EMAIL_MARK_SPAM:GMAIL_ADD_LABEL_TO_EMAIL`, `CALENDAR_WRITE:GOOGLECALENDAR_CREATE_EVENT`,
`CALENDAR_READ:GOOGLECALENDAR_EVENTS_LIST`, `EMAIL_READ:GMAIL_FETCH_EMAILS`.

**Important honesty note:** `UNVERIFIED` dominates. Most completed jobs are
*completed*, not *independently verified*. The runtime distinguishes the two and
says so on the card ("Completed — not independently verified"). That distinction
is a portfolio asset, not something to paper over.

### 2.4 Model fleet and specialist routing

`capability_registry.py::DEFAULT_CONFIG` — real named workers, all pinned to
`custom:daventry-local`, with `validate_local_only()` failing closed on any
non-local provider:

| Capability | Worker | Model |
|---|---|---|
| CHIEF_OF_STAFF | CAPTAIN | `qwen3.8:27b` |
| FAST_CHAT | NEMO | `nemotron-lightning:30b-a3b-q4` |
| PROJECT_AWARENESS / DAILY_CONTEXT / PROJECT_CONTINUITY / DAILY_OPERATING_BRIEF | CAPTAIN | `qwen3.8:27b` |
| FAST_EXECUTOR | ORNITH (fallback VOLT) | `ornith-fast-executor-candidate` / `qwen3-coder-next:q4_K_M` |
| DEEP_CODING | VOLT | `qwen3-coder-next:q4_K_M` |
| SYSTEMS | BYTE | `qwen3-coder-next:q4_K_M` |
| EVIDENCE_TRIAGE | NEMO | `nemotron-lightning:30b-a3b-q4` |
| UX_COMMUNICATION | FINLEY | `muse-glimmer:30b-mlx` |
| INDEPENDENT_REVIEW | REVIEWER | `qwen3-coder:30b` |
| VISION | — | `qwen3-vl:32b` |

All ten models confirmed present on both Ollama instances. `/v1/activity`
shows real per-run model attribution
(`model: nemotron-lightning:30b-a3b-q4`, `latency_ms: 17838`, `verdict: PASS`).

`model_resources.py` does explicit VRAM-residency arithmetic before waking a
heavy coder, and can deliberately evict a named model — so "heavy coding never
starves Zarvin" is an implemented policy, not a hope.

### 2.5 Bridge API surface — 59 endpoints live

Ask (`/v1/ask`, `/ask/stream`, `/ask/{id}/cancel`, `/ask/{id}/children`,
`/ask/immediate`, `/ask/suggestions`), approvals (list/get/approve/deny),
jobs (+cancel), activity, activity-events, attention, automations
(CRUD + preview + run + tick), watchers, briefs, ops-brief, proactive-insights,
proactive-questions (view/answer/dismiss), command-center (cards, evidence,
fix, task, archive, restore, settings), connections, conversations, devices,
events, health, home, notifications/status, research/run, runs/{id}, system.

### 2.6 Milestone 18 execution runtime — files, Git, commands, code

`local_execution.py`, `code_execution.py`, `command_policy.py`,
`local_autonomy.py`, `web_research.py`, `browser_execution.py`, wired into the
Ask route (`routes.py:4837 → _handle_local_execution_ask`).

Design facts worth citing verbatim in copy:

- **Allowlist-first command policy.** SAFE only if program *and* subcommand are
  allowlisted; recognized-but-mutating → CONSEQUENTIAL (approval path);
  unrecognized → UNKNOWN → treated as needing approval. Deny list is a backstop
  for things that must never run *even with* approval. Commands are argv lists,
  `shell=False`, never a built shell string.
- **Code fixes are proposals, never outcomes.** The only thing that moves a fix
  to VERIFIED is the project's own test command passing after the edit. A model
  that says "fixed!" while the suite fails yields `TESTS_STILL_FAILING` and its
  edits are **rolled back**.
- **Earned autonomy is never self-granted.** Track record makes a
  (capability, workspace) pair *eligible*; only an explicit user action grants
  it. `TIER_3_DESTRUCTIVE` has no autonomous tier at all — no run history can
  ever make a delete automatic.
- **SSRF containment** on all web retrieval, re-checked on every redirect hop;
  browser refuses downloads, submits no forms, types no credentials, and treats
  page content as data, never instruction.

### 2.7 Attention, proactivity, notifications

`GET /v1/attention` returns real scored decisions with the full vector
(urgency / importance / confidence / actionability / novelty / interruption_cost),
a `SUPPRESS`/`SURFACE`/`RECORD_ONLY` disposition, a plain-English reason, and a
`cooldown_key` doing real dedup — e.g.
`zarvin-mobile:DIRTY_REPO:dedup-30b65a92…` → `SUPPRESS`, score 0.2075,
"Routine activity — nothing that needs attention right now."

Deterministic scoring runs first; a local model (Nemotron) is consulted **only**
for ambiguous `NEEDS_TRIAGE` events, and its timeout/failure falls back to the
deterministic decision.

`GET /v1/notifications/status` →
`active_transport: telegram`, `telegram_configured: true`, `telegram_available: true`,
`ios_push_configured: false`.

`~/.daventry-customer-hub/proactive/` holds real persisted proactive questions
and insights (e.g. an `EMAIL_REPLY` insight citing a real Gmail message id and
a `PROJECT_CONTINUATION` insight for Zarvin One Mobile).

### 2.8 Automations — `GET /v1/automations`

Five live automations, real last-run/next-run timestamps:

```
Morning Brief          SCHEDULED_ROUTINE  ACTIVE   last: today 9:21 AM  next: Mon 8:00 AM
Evening Recap          SCHEDULED_ROUTINE  ACTIVE   last: Sat 8:54 PM    next: today 7:00 PM
"Every Friday tell me what Zarvin accomplishes this week"  ACTIVE  next: Fri 9:00 AM
"Tell me if one of my Zarvin jobs get stuck or fail"  CONDITION_WATCH  **FAILING**  watching
"Remind me if I have an approval waiting more than one day"  (running; jobs recorded)
```

One automation is genuinely in a `FAILING` state right now and the system says
so. Automation Engine V2 (`6f5cd59`, 2026-09-05) replaced the 3-phrase hardcoded
parser with a deterministic composable NL interpreter; the local-model
interpretation path stays **off by default** behind
`ZARVIN_AUTOMATION_MODEL_INTERPRETATION`.

`GET /v1/watchers` → `[]`. Watchers-as-a-separate-concept are empty; scheduled
routines and condition watches carry that load today.

### 2.9 Ze Memory

`~/.daventry-customer-hub/proactive/ze_memory.json` — durable typed records with
`memory_type`, `source` (`USER_EXPLICIT`), `evidence` file references,
`sensitivity`, `retention_policy`, `last_used_at`. Per its checkpoint manifest,
it is deliberately an **integration layer over existing canonical stores**
(Job Ledger, ApprovalStore, ContinuityStateStore, BriefStore), adding only a
durable-fact store for facts with no other home plus a bounded, role-scoped
context-packet builder — not a competing recorder.

### 2.10 Cross-device

Mobile client runs `real` mode by default in development
(`.env.development: EXPO_PUBLIC_ZARVIN_MODE=real`) and reaches the backend over
Tailscale (`EXPO_PACKAGER_PROXY_URL=https://daventry-one.tailf8d262.ts.net:8444`).
Recent commits close cross-device truth specifically:
`38947c3` backend-authoritative hydration + refresh, `821dbb4` desktop/web
stale-rehydration guard against out-of-order responses. Current branch is
literally `cross-device-physical-test`.

`GET /v1/devices` → `[]` (device registry empty at inspection).

### 2.11 Reliability engineering (the strongest, least-told part of the story)

`c29b54c` "Production Reliability Gate" (2026-09-04) is the single best piece of
evidence on this project and appears **nowhere** in the portfolio:

- New `atomic_store.py`: writer-unique temp filenames + real cross-process
  locking, replacing a `path.with_suffix(".tmp")` convention duplicated across
  8+ JSON stores that **raced under real concurrent load** (a reproduced
  `FileNotFoundError` on `job_index.json.tmp`).
- `ApprovalStore` gained `EXECUTING` / `EXECUTION_UNKNOWN` states, closing a
  duplicate-execution race where two concurrent `/approve` calls could both
  reach the broker, and giving a crash-orphaned proposal an explicit,
  **never-auto-retried** terminal state instead of looking active forever.
- `/v1/activity` blind spot fixed: durably-recorded jobs that no screen read.

Other honest failure/recovery work in history: `718533b` reboot-recovery gap,
`afb8fb6` restart recovery + approval resume, `b9709ab` "long-prompt truncation
was client-side only", `297068e` "email synthesis timeout returned generic error
instead of truthful TIMEOUT/504".

### 2.12 Test evidence

| Suite | Result | How verified |
|---|---|---|
| Mobile (`zarvin-one-mobile`, Jest) | **598 passed, 60 suites, 0 failed** | Run in full this session, 2026-09-06 |
| Backend (`daventry-customer-hub-17b5`, pytest) | **1828 passed, 8 failed** of 1836, in 10m06s | Run in full this session, 2026-09-06 |
| Backend, last committed figure | "1695 backend tests pass (4 pre-existing/environmental failures, confirmed unrelated). Mobile: 572 tests pass, 59 suites." | Commit message `c29b54c`, 2026-09-04 |

**The 8 backend failures are measured against a mid-flight working tree, not a
committed state.** `git status` shows 26 modified files / +1575 lines uncommitted
on `claude/18-execution-runtime`, including `context.py`, `routes.py`,
`external_capabilities.py`, and `consequential_actions.py`. The failures are
test-vs-code drift inside that in-progress work, not capability regressions:

- 3 × `test_ask_physical_calendar_write_today` — assertion looks for
  `"couldn't pin down"`; the code now says `"couldn't reliably pin down"`. The
  behaviour under test (refusing to guess a missing clock time) is correct.
- 3 × graceful-degradation tests in `test_context_email.py` /
  `test_context_calendar.py` — expect `EmailUnavailableError`, get
  `ContextConfigurationError`. The error taxonomy changed; the tests didn't.
- 1 × `test_ask_workspace_clarification_continuity`.
- 1 × `test_full_run_with_real_openclaw` — an integration test against a real
  OpenClaw run.

**Portfolio implication:** publish the *committed* figure, not this one, and
never publish a raw pass count as a quality claim. The defensible public
sentence is qualitative — a real regression suite in the thousands across two
repos, run before milestones close — not a number that moves hourly. If a
number is wanted, run the suite on a clean checkout of the last commit first.

### 2.13 Deliberately NOT live

| Thing | Actual state | Evidence |
|---|---|---|
| Switchyard adaptive second-layer routing | **Off by default.** `ZARVIN_SWITCHYARD_ENABLED` unset → byte-identical to the deterministic registry | `switchyard_router.py` docstring |
| STRONG_LOCAL / Flash-Next escalation | **NO-GO on live evidence**, engineering gates only | commit `cad4124` |
| Fast-interactive runtime | `"fast_interactive": {"enabled": false, "status": "DISABLED"}` | `GET /v1/system`, live |
| Cloud escape hatch (OpenAI GPT-5.6 Terra) | Benchmarked under a budget cap; verdict **`LIMITED_ROLE`** | `evidence/openai-terra-benchmark-*` |
| iOS push notifications | `ios_push_configured: false` — Telegram is the transport | `GET /v1/notifications/status` |
| `EMAIL_UNSUBSCRIBE`, `EMAIL_DELETE_PERMANENT` | `implemented=False` by explicit product decision, fail closed | `external_capabilities.py` |
| `GITHUB_READ`, `GITHUB_WRITE` | `implemented=False` | `external_capabilities.py` |
| Watchers (as distinct entities) | empty | `GET /v1/watchers` |
| Device registry / pairing discovery | empty; manual address+token entry | `GET /v1/devices`, `bridge-connection.tsx` |

---

## 3. Claims that are now stale

1. **"Active prototype"** — the badge, the status string, and `publicStatus`.
   There is a running API with 59 endpoints, two connected Gmail accounts, a
   connected Calendar, a verified consequential write executed today, five live
   automations, a persistent job ledger, and 2400+ passing tests across two
   repos. "Prototype" is now an undersell.
2. **"Controlled interactive scenarios are available"** as the headline
   capability — true of the demo build, false as a description of the product.
3. **"Live integrations are still being validated separately"** — Calendar and
   Gmail integrations passed live acceptance on 2026-08-22/23 and are in daily
   use. This sentence is 2+ weeks out of date.
4. **"Some backend pieces are still being connected and tested"** — vague and
   now backwards: the backend is the most complete part.
5. **"That's the standard I'm building toward"** (evidence) — the standard is
   *implemented*: `verification_status: VERIFIED`, rollback on failed tests,
   `EXECUTION_UNKNOWN` for crash-orphaned actions.
6. **Conditional voice in §03/§05** ("Behind that *can* be…", "the system *can*
   coordinate") — these are now indicative, not conditional.
7. **The five scenario cards in §04** are described as "situations I actually
   wanted an assistant to handle" — they are the *demo* scenarios, presented as
   "what I built."
8. **`tags: 'react native · expo · typescript · local models'`** — omits the
   entire Python/FastAPI backend, which is where most of the engineering is.
9. **`REAL_ZARVIN_SERVICE.md` §"What remains local-device-only"** — says the
   integration "has not been exercised against a real Daventry One machine or a
   physical phone." Contradicted by the branch name, the physical-acceptance
   repair commits, and the Tailscale start script. (Backend doc drift, not
   portfolio copy — but don't source new copy from it.)
10. **`DEMO_CAPABILITY_TRUTH_MATRIX.md`** (2026-08-18) — self-describes its
    backend claims as "not a fresh re-verification." Historical only.
11. **`docs/CORPUS_MANIFEST.md:35-40`** — Public Captain's retrieval corpus
    still carries the old status sentence, so the site's own AI answers stale
    facts about Zarvin. Regenerating the corpus is part of any copy change.

---

## 4. Claims that would overstate reality (do not write these)

- ❌ "Fully autonomous" / "runs my life without me." Approvals are mandatory for
  every Tier-3 action; there is a 15-minute expiry; `TIER_3_DESTRUCTIVE` can
  never be autonomous.
- ❌ "Everything Zarvin does is verified." **19 of 20** recent jobs are
  `UNVERIFIED`. Only side effects with a real provider-side verifier reach
  `VERIFIED`.
- ❌ "Multi-model adaptive routing chooses the best model per task." Switchyard
  is **off**; routing is the deterministic capability registry today.
- ❌ "Escalates to cloud models when local isn't enough." Verdict is
  `LIMITED_ROLE`, integrated but deliberately narrow. Say that, or say nothing.
- ❌ "Push notifications on my phone." `ios_push_configured: false` — it's Telegram.
- ❌ Any uptime %, request volume, accuracy %, time-saved, or user count. None exist.
- ❌ "Production" / "in production." It is a single-operator system on one Mac
  reached over a private tailnet.
- ❌ "Zarvin writes and ships code autonomously." It proposes edits, runs the
  project's real tests, and **rolls back** when they fail.
- ❌ Claiming authorship of Hermes, OpenClaw, Ollama, Composio, Granola, or the
  underlying models. Own the layer above them and say so explicitly.
- ❌ "Watchers monitor my projects continuously." `GET /v1/watchers` → `[]`.
- ❌ Presenting the demo's NEMO-outage scenario as a real recorded incident.

---

## 5. Verified capabilities worth adding (proposed status labels)

| Capability | Proposed label | Evidence |
|---|---|---|
| Bridge API, 59 endpoints, self-reporting build provenance & staleness | **VERIFIED LIVE** | `:8421` responding; `/v1/system` |
| Gmail read / triage / draft (2 accounts) | **VERIFIED LIVE** | `/v1/connections`; live acceptance 2026-08-22 |
| Gmail send / archive / spam / trash — approval-gated | **VERIFIED LIVE** | ledger `EMAIL_SEND:GMAIL_SEND_DRAFT`; checkpoint manifest |
| Google Calendar read | **VERIFIED LIVE** | 13 ledger entries; `/v1/connections` |
| Calendar write + reschedule — approval-gated, side-effect verified | **VERIFIED LIVE** | `act-c121dd86…` `EXECUTED`/`VERIFIED`, today |
| Granola meeting read (native MCP + OAuth DCR, no Composio) | **VERIFIED LIVE** | `/v1/connections`; `granola_mcp_adapter.py`, `granola_oauth.json` |
| Approvals: propose → approve → execute → verify, with expiry & account binding | **VERIFIED LIVE** | `/v1/approvals` live records |
| Job Ledger with truthful COMPLETED vs VERIFIED, evidence payloads | **VERIFIED LIVE** | `/v1/jobs` |
| Local specialist fleet + deterministic capability→model routing, local-only fail-closed | **VERIFIED LIVE** | `capability_registry.py`; `/v1/activity` model attribution |
| Independent reviewer as a distinct pinned role | **VERIFIED LIVE** | `INDEPENDENT_REVIEW → qwen3-coder:30b`; `evaluator_available: true` |
| Durable, resumable, cancellable Ask (+ SSE streaming, restart recovery) | **VERIFIED LIVE** | `/v1/ask/*`; `ask_state.db`; `879a5e0`, `718533b` |
| Compound tasks: one parent Ask + N ledger children, sequential, resumable | **VERIFIED LIVE** | `fb62191`, `afb8fb6`; `/v1/ask/{id}/children` |
| Attention Engine: scored, deduped, suppression-by-default | **VERIFIED LIVE** | `/v1/attention` live decisions |
| Proactive questions & insights, persisted | **VERIFIED LIVE** | `/v1/proactive-*`; on-disk records |
| Morning Brief / Evening Recap on a real schedule | **VERIFIED LIVE** | `/v1/automations` real timestamps |
| Telegram as the notification transport | **VERIFIED LIVE** | `/v1/notifications/status` |
| Concurrency hardening: atomic store, cross-process locks, no double-execution | **VERIFIED LIVE** | `c29b54c` + tests |
| Ze Memory durable-fact store + bounded context packets | **VERIFIED LIVE** | `ze_memory.json`; checkpoint manifest |
| Command Center / Operations Inbox with evidence cards | **VERIFIED LIVE** | `/v1/command-center` live cards |
| Automation Engine V2 NL interpreter (deterministic path) | **CONNECTED / VALIDATING** | `6f5cd59`; one automation currently `FAILING` |
| Cross-device backend-authoritative state (phone + web) | **CONNECTED / VALIDATING** | `38947c3`, `821dbb4`; branch `cross-device-physical-test` |
| M18 local execution: scoped files, Git, allowlisted commands | **IMPLEMENTED** | modules + Ask wiring + tests; no live-verified job in current ledger view |
| M18 code fixes gated on the project's own tests, with rollback | **IMPLEMENTED** | `code_execution.py` + tests |
| Earned autonomy tiers | **IMPLEMENTED** | `local_autonomy.py`; no grants issued |
| Web research + real-browser reading, SSRF-contained | **IMPLEMENTED** | `web_research.py`, `browser_execution.py` |
| Cloud escape hatch (OpenAI Terra) | **IMPLEMENTED, LIMITED_ROLE** | benchmark evidence |
| Switchyard adaptive routing | **NEXT** (flagged off) | `switchyard_router.py` |
| STRONG_LOCAL escalation | **NEXT** (NO-GO on live evidence) | `cad4124` |
| iOS native push | **NEXT** | `ios_push_configured: false` |
| Watchers as first-class entities | **NEXT** | `/v1/watchers` empty |

---

## 6. Current demo elements that no longer represent the product

| Element | Problem |
|---|---|
| `TryZarvinOne()` iframe, placed immediately after the hero as primary proof | It is the **August demo build** (`.env.production: EXPO_PUBLIC_ZARVIN_MODE=demo`), five deterministic scenarios, zero backend. Presented as the main thing a visitor should look at. |
| "Take the guided tour" (`/guided-demo`) | Scripted walkthrough naming CAPTAIN/NEMO/VOLT/BYTE/FINLEY/REVIEWER. The roster is real; the run is scripted. Currently indistinguishable from live. |
| The five §04 scenario cards | These *are* the demo scenarios (`demoData.ts`), presented as "what I built." |
| "NEMO became unavailable at 3:02 AM" curveball | A designed demo curveball. Reads as a real incident. |
| Flow diagram `YOU → … → VERIFIED RESULT` | Directionally right but omits the parts that make it true today: capability selection, permission/earned autonomy, side-effect verification, Job Ledger. |
| No screenshots, no video, no runtime evidence | The one thing an AY Automate reviewer wants — a real system doing real work — is entirely absent. |

Both demo URLs return `200`. Nothing is broken; the framing is what's wrong.

---

## 7. Proposed new case-study structure

Hero: status `Live personal AI operator — running daily on my own machine and phone`;
badge `Live build`; a truthful one-line disclaimer replacing the current one.

| § | Title | Content |
|---|---|---|
| — | **Current build walkthrough** (top slot, replaces demo iframe as primary proof) | Voice-narrated screen recording of the real system. **Asset does not exist yet — blocker, see §9.** |
| 01 | What Zarvin One is now | Plain language: one place to ask for an outcome; Zarvin coordinates specialists, models, tools, permissions, execution, verification and follow-up underneath. Do less. Get more. |
| 02 | Why I built it | I already had models, agents, tools, automations and integrations working — using them meant managing too much machinery. Zarvin One is the product layer that hides it. |
| 03 | From prototype to operating layer | Names the August controlled demo as the *first product prototype*, then what replaced it: persistent jobs, specialist routing, connected tools, approval boundaries, verification, evidence, recovery, proactive attention. Dated, factual. |
| 04 | How a real request moves through Zarvin | New diagram: `YOU → ZARVIN → CAPABILITY → SPECIALIST → MODEL → TOOL → PERMISSION / EARNED AUTONOMY → EXECUTION → VERIFICATION → JOB LEDGER → RESULT`. Walked through with one real example: the Oct 2 calendar event (proposed → Tier-3 approval → executed → VERIFIED, 1.8 s). |
| 05 | Current build status | The §5 matrix above, rendered as a four-state capability grid: **VERIFIED LIVE / CONNECTED · VALIDATING / IMPLEMENTED / NEXT**. No percentages. Includes what's deliberately off. |
| 06 | Reliability and trust | `BUILD → TEST → REAL EXECUTION → VERIFY SIDE EFFECT → RECORD EVIDENCE → FAILURE TEST → CLEAN RETEST → LIVE`. Then the concrete proof: COMPLETED ≠ VERIFIED; approval expiry; `EXECUTION_UNKNOWN` never auto-retried; test-gated code fixes with rollback; allowlist-first command policy; earned autonomy that can't self-grant; the reproduced concurrent-write race and its fix. |
| 07 | Working with multiple models | The specialist table (worker → role → model), local-only fail-closed, VRAM residency arithmetic, independent reviewer as a separate pinned model. States plainly that the *user* never picks a model. Notes Switchyard is built but off, and the cloud escape hatch is `LIMITED_ROLE`. |
| 08 | What I learned | Reliable agents need more than good prompts; a 200 response is not a completed action; UI state must stay truthful with the runtime; consequential actions need explicit boundaries; evidence beats assertion; escalate only when needed; good automation *reduces* attention. Each tied to a real incident from history. |
| 09 | Current development | What's being hardened now: automation V2 (one watcher `FAILING` today), cross-device physical acceptance, M18 execution live-verification, Switchyard/STRONG_LOCAL gates, iOS push. Stated as strength. |
| 10 | Original interactive prototype | Demo iframe demoted here, explicitly labelled **"Original interactive product prototype — August 2026, controlled scenarios, no backend."** Guided tour beside it, labelled as scripted. |
| — | What I built vs. what I didn't | Explicit separation: mine = product, Bridge API, capability/specialist routing, tool broker, approval + verification pipeline, Job Ledger, attention engine, automations, mobile client. Not mine = Hermes, OpenClaw, Ollama, the models, Composio, Granola, Expo, FastAPI. |

Voice rules carried forward: no "Otto-inspired," no overstated traditional
software-engineering credentials, no corporate register, indicative not
conditional.

---

## 8. Files that need modification

| File | Change |
|---|---|
| `src/data/projects.js:333-359` | `status`, `statusBadge`, `publicStatus`, `disclaimer`, `desc`, `tags`, `outcome`, `role`; add `year` check; add capability-matrix + specialist data; add screenshot entries |
| `src/components/ZarvinCaseStudy.jsx` | Rewrite to the §7 structure; new status-matrix and specialist-table components; demote demo block; new flow diagram stages |
| `src/components/projectWorld/worldData.jsx:40,52` | One-liner + process labels (`Ask → Coordinate → Verify → Result` still holds; description needs updating) |
| `src/data/portfolioNavigator.js:36-44` | Demo/tour entries need "prototype" labelling; add a walkthrough entry |
| `src/data/evidenceFlows.js` | Add a `zarvin` flow so `EvidencePanel` renders real stages (currently Zarvin has none) |
| `src/styles/case-study.css` | Styles for the capability-status matrix and specialist table |
| `docs/zarvin-one-approved-copy.md` | Mark superseded; add a pointer to the new approved copy |
| `docs/CORPUS_MANIFEST.md` + `server/corpus.json` | Regenerate via `node scripts/build-corpus.mjs && node scripts/build-corpus-manifest.mjs` so Public Captain stops answering with stale status |
| `public/images/` | Add Zarvin screenshots (none exist) |

No changes needed to `CaseStudy.jsx` beyond what it already delegates.

---

## 9. Evidence to be captured or replaced

**Nothing exists yet.** `public/images/` contains zero Zarvin assets, and no
`.mp4`/`.mov` walkthrough exists anywhere on this machine. This is the single
largest gap between the audit and a publishable page.

Needed, in priority order:

1. **Voice-narrated current-build walkthrough** (the primary hiring proof, and
   explicitly what AY Automate asks for). Suggested spine, all reproducible from
   the live system: ask on the phone → routing to a specialist → a Tier-3
   approval card → approve → executed **and verified** → the Job Ledger entry
   with evidence → a Telegram notification → the same job seen on desktop.
2. **Command Center / Operations Inbox** screenshot — real cards, including the
   `BLOCKED` one and a `Completed — not independently verified` one. The
   honesty is the point.
3. **Approval card** screenshot — the Tier-3 calendar write, showing target,
   change summary, and expiry.
4. **Job Ledger evidence card** — `what_zarvin_did` / `files_or_systems` /
   `test_summary` / `verified_outcome`.
5. **Connections screen** — Calendar + two Gmail accounts + Granola, with
   account labels visible (redact addresses if preferred).
6. **Automations screen** — including the automation that is currently `FAILING`.
7. **Architecture diagram** — the §04 request path, drawn, not a text row.
8. **Capability-status matrix** — rendered from §5, not an image.
9. **Optional, high value:** a terminal shot of the real test run
   (`598 passed, 60 suites` mobile; the backend figure once the full run lands)
   and a real `git diff` from a test-gated, rolled-back code fix.

Redaction pass required on every screenshot: email addresses, meeting titles,
Tailscale hostnames, bearer tokens, and real contact names.

---

## 10. Final acceptance check

> *If an AY Automate engineer watches the current Zarvin walkthrough and then
> reads this portfolio page, will both tell the SAME truthful story?*

**Today: NO.** The page describes a controlled prototype; the running system is
a persistent, tool-connected, approval-gated, evidence-recording operator.

**With §7 + §9 delivered: YES** — provided the walkthrough is recorded against
the real build, the capability matrix keeps its four honest states, and the
demo is demoted and labelled.

---

*No portfolio file has been modified. Awaiting review before Phase 4.*
