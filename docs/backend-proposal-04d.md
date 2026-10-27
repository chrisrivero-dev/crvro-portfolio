# Backend proposal (investigation only; nothing is applied, deployed or changed)

Scope per review: trace the `/api/result/<id>` routing problem, propose the exact fix and show other routes and client navigation are unaffected, propose the corpus correction. **No POST was sent to the production worker and no job was triggered.** Only read-only GETs/OPTIONS against the public site were used.

## 1. Root cause: `/api/result/<id>` is swallowed by the SPA catch-all rewrite

**Observed on production (read-only GETs, 2026-10-27)**
| Request | Result |
|---|---|
| `GET /api/ask`, `GET /api/worker/claim` | `404 {"error":"not_found"}` from the handler (function deployed and reached) |
| `GET /api/result/abc`, `/api/result/<uuid>`, `/api/result/abc?id=abc` | **200 `text/html`, the site's `index.html`** (`x-vercel-cache: HIT`) |
| `GET /api/result/%5Bid%5D` (the literal file name `[id]`) | **500 `FUNCTION_INVOCATION_FAILED`** from the function itself |
The last row proves `api/result/[id].mjs` **is deployed and invocable** (the literal path reaches it and it throws because `req.query.id` is undefined). The dynamic URL `/api/result/<id>` simply never reaches it.

**Why (reproduced offline with Vercel's own libraries, `scripts/trace-vercel-routing.cjs`)**
- `@vercel/fs-detectors` `detectBuilders` for this repo generates the dynamic route `^/api/result/([^/]+)$ -> /api/result/[id]?id=$1 (check: true)`.
- The CLI appends those builder routes to the **end of the filesystem phase** (`appendRoutesToPhase`), i.e. **after** the user's own `rewrites`.
- `vercel.json` has `{ "source": "/(.*)", "destination": "/index.html" }`, which becomes `^(?:/(.*))$ -> /index.html (check: true)`. That route is earlier in the phase and `/index.html` exists, so it terminates the request. The merged table:
```
0 ^/(.*)/$ -> 308 redirect
1 handle: miss
2 ^/api/(.+)\.mjs$ -> /api/$1 (check)
3 handle: filesystem
4 ^(?:/(.*))$ -> /index.html (check)           <- the SPA catch-all wins here
5 ^/api/result/([^/]+)$ -> /api/result/[id]?id=$1   <- never reached
6 ^/api(/.*)?$ -> 404
```
- Static function paths (`/api/ask`, `/api/worker/*`) are matched by the filesystem handle **before** step 4, which is why they work and the dynamic one does not.
- The offline model of the CURRENT config reproduces every production observation above (functions reached, `/api/result/abc` and `/api/nothing` served as the SPA). That agreement is the evidence; it is not a deployed test.

**Consequence for visitors:** an open-ended Lookup question can POST successfully, then every poll receives HTML, `res.json()` throws, and the visitor sees "temporarily offline", whether or not the Mac worker is up.

## 2. Proposed fix (one line) and what it changes
`docs/proposals/vercel-json.patch`:
```diff
-    { "source": "/(.*)", "destination": "/index.html" }
+    { "source": "/((?!api/).*)", "destination": "/index.html" }
```
Offline request matrix through Vercel's merged route table (current vs proposed):
| Request | Current | Proposed |
|---|---|---|
| `/api/ask`, `/api/worker/claim`, `/api/worker/extend`, `/api/worker/submit` | function | function (unchanged) |
| `/api/result/<id>` | SPA `index.html` | **function `/api/result/[id]` (id passed)** |
| `/api/nothing` (no such route) | SPA `index.html` (200) | `404` |
| `/`, `/projects/<slug>`, `/some/spa/route` | SPA | SPA (unchanged) |
| `/robots.txt`, `/assets/*` | static | static (unchanged) |
Exactly three requests change; client-side navigation never hits the server (the app uses `history.pushState`), and every non-`/api/` path is still served by the SPA fallback, so deep links `/projects/<slug>` and `/#anchors` are unaffected. The bare path `/api` (no trailing slash) still falls to the SPA; nothing links to it.

**Verification plan before any production change** (needs your approval; none of it has been done)
1. Deploy the one-line patch to a Vercel **Preview** from a branch (not production).
2. On the preview URL, read-only GETs only: `/api/result/<random-uuid>` must return handler JSON (the handler's "expired"/404 body), not HTML; `/api/ask` GET must still return `{"error":"not_found"}`; `/projects/zarvin-one`, `/`, `/robots.txt`, a hashed `/assets/*.js` must be unchanged; `/api/nothing` must be a 404.
3. Only then promote. A POST end-to-end test needs the worker and queue to be up and is a separate decision.
Side note: the handler throws (500) when `id` is missing (seen with the literal `[id]` request); with the fix real ids always arrive, so this is cosmetic, but returning 400 would be tidier.
Preview caveat: `ALLOWED_ORIGINS` and the KV variables exist for Production only, so a preview exercises routing but not the durable store.

## 3. Corpus: missing Proof First, stale Zarvin One / GroundRules
Facts: `server/corpus.json` (2026-09-06) has no `proof-first` entries or destination; its Zarvin One (3) and GroundRules (1) entries no longer match `src/data/projects.js`. Cause: `scripts/build-corpus.mjs` loops every registry project, but (a) its `DESTINATIONS` allowlist is a hand-copied list that never got `proof-first`, and (b) the snapshot simply was not regenerated after the registry changed. The server (`server/validate.mjs`) drops any destination not in the corpus allowlist, so Proof First cannot be returned by the model path even though the browser's own matcher can route to it.

Proposed patches (all `git apply --check` clean against HEAD, **not applied**):
- `docs/proposals/corpus-script.patch`: derive the allowlist from the site's own `DESTINATIONS` (`src/data/portfolioNavigator.js`) so it cannot drift again, add `scripts/test-corpus.mjs` (fails if a browser-routable destination, a registry project, or a current registry summary is missing from the corpus). It is run as `node scripts/test-corpus.mjs`; wiring it as `"corpus:test"` in `package.json` is a one-line addition left out of the patch.
- `docs/proposals/corpus-data.generated.patch`: the regenerated `server/corpus.json` (59 entries, was 54; 13 destinations, was 12). Proof First gets six entries, all verbatim registry text: summary, problem, built, outcome, learned, stack. Nothing is invented.
Checked in a throwaway worktree: `corpus:test` fails on the current corpus ("corpus.destinations is missing proof-first") and passes after regeneration.

**One decision needed (not included in the patches):** the script emits a `status` entry only from `publicStatus`, which Proof First does not have, so the worker would have nothing grounded about availability (for example "can I buy it?"). The registry already holds a verified `status` string ("Active product · workflow built and tested on bugs from my own projects · checkout not built"). Options: (A) leave it out; (B) emit `status` for every project that has it but no `publicStatus` (adds about seven short entries, all existing registry text); (C) add `publicStatus` to Proof First only. I recommend B, but it is your call, and no wording would be new.

**Deployment steps for the corpus** (also not done): apply the patches, run `npm run corpus:build && npm run corpus:test`, redeploy the broker (it reads the corpus at import time), restart the worker. Both the proposal for `vercel.json` and for the corpus are independent and can be taken separately.

## Reproduce
`scripts/probe-backend.mjs` (read-only probes), `scripts/trace-vercel-routing.cjs` (offline routing model; needs `@vercel/fs-detectors` and `@vercel/routing-utils` installed in a scratch directory, which is deliberately not a repo dependency).
