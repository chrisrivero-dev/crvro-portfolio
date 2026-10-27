# Iteration 04B: the 3D-first homepage (isolated worktree, not production)

Branch `feature/crvro-3d-m1-still-life`. Nothing here is pushed, merged or deployed. Iteration 03 is tagged `m15-iter-03-approved` and `m15/` is untouched.

## What the homepage is now
`/` is the approved D2 Cinematic Archive room (restrained D1 fill) with one visible computer, the 3D CRT. The old CSS `RetroComputer` hero is not rendered on the redesigned home page; the code is kept and the whole old stacked page is still available at `/?classic=1`.

| Piece | File |
|---|---|
| Engine (scene, camera tweens, suspend/resume, context loss, low-quality tier) | `src/workspace3d/engine.js` (production port of `m15/src/workspace.js`) |
| Floppy + camera choreography, no DOM | `src/workspace3d/controller.js` |
| React mount, dock, focus, dormancy, fallback signalling | `src/workspace3d/Workspace3D.jsx` (lazy chunk) |
| CRT screen UI (home / menu / disk directory), portalled into the CSS3D screen | `src/workspace3d/CrtScreen.jsx` |
| Room, props, mug, steam, survey drawing | `src/workspace3d/{env,props,textures,drafting,steam,env-common}.js` |
| Full-page experiences | `src/components/ExperienceShell.jsx` (wraps the **unchanged** ProjectWorld, PortfolioNavigator, About, Skills, AIConsultation, Contact) |
| Plain 2D home | `src/components/FlatHome.jsx` |
| Old stacked home | `src/components/LegacyHome.jsx` (`/?classic=1`) |
| Location store, scroll restoration | `src/lib/location.js`; experience table `src/lib/experiences.js` |
| Case IDs | `src/data/caseIds.js`, `docs/case-ids.md`, `npm run case-ids:test` |

Unchanged (zero diff): `ProjectWorld.jsx`, `projectWorld/*`, `PortfolioNavigator.jsx`, `data/portfolioNavigator.js`, `data/projects.js`, the case-study components, `api/`, `server/`, `worker/`, `m15/`. Changed: `App.jsx` (routing/shell), `Header.jsx` (optional `links` prop), `package.json` (+`three@0.170.0`).

## Navigation model
- The hash on `/` is the route: `/#work` Project World (followed by the Destination Lookup, its original post-journey placement), `/#navigator` the lookup alone, `/#about`, `/#skills`, `/#ai-consultation`, `/#contact`. These are the existing anchor ids, so every old link, every lookup result link and every in-component `href="#about"` still lands. Case studies stay `/projects/<slug>`.
- CRT menu (WORLD.MAP, ASK.EXE, ABOUT.TXT, SKILLS.TXT, CONSULT.EXE, CONTACT.TXT): picking one flies the camera to the screen-fills-viewport pose (`crtFill`), then `navigate('/#id')` swaps the room for the real page (a short phosphor flash). Deep links skip the room entirely and never load Three.js.
- Floppies: click, tap or use the dock; the disk lifts, crosses the desk, seats in the drive; the CRT shows a registry-built directory; `CASE.LNK` is the real `/projects/<slug>` route.
- Return: the fixed "Computer" link (and browser Back) go to `/`; the room resumes at the CRT menu with focus on the entry that was opened. Esc at the screen returns to the room; the disk can be ejected at any time, including mid-load.

## State and return
- Every history entry stores its own `scrollY` (`history.state`, saved on scroll settle and before a push); Back/Forward restore it, with retries while layout settles. A new page starts at the top. `history.scrollRestoration = 'manual'`.
- Project World progress is its scroll position (its band is derived from `window.scrollY`), so restoring `scrollY` restores the journey stop. Verified on desktop and on the phone journey.
- The room stays mounted but suspended once shown (case studies and experiences included): no frames, steam timer stopped. Disk state, camera pose and menu survive the round trip.

## Failure handling
- No WebGL2, init failure, or a lost context that does not return within 4 s: the plain 2D home with a one-line explanation. A short context loss shows "Graphics reset. Restoring..." and recovers.
- Visitor choice: "2D view" (persisted in `localStorage crvro.view`) and `/?view=2d`; "Try the 3D workspace" returns.
- Phones/coarse pointers get a LOW tier: 2048/1024 shadow maps (4096/2048 on desktop) and pixel ratio 1.5.

## Destination Lookup: verified facts
Source: `PortfolioNavigator.jsx`, `data/portfolioNavigator.js`, `api/*`, `server/*`, `worker/*`, `docs/PUBLIC_CAPTAIN.md`, `vercel env ls` (names only; values are Sensitive and not read).
- Pipeline: deterministic `matchQuery()` in the browser first (no network). Otherwise `POST /api/ask` -> `{request_id}`, then `GET /api/result/:id` every 1.5 s, at most 112 polls (about 168 s), through Vercel Queues + Upstash Redis to a worker on the owner's Mac running local Ollama models.
- Reuse: the component is mounted unchanged in `ExperienceShell`; there is no second engine. `npm run verify:lookup` drives its states against a simulated backend (test doubles, not the real service): 429, 500, HTML (no backend), queued/processing, answered (renders the answer and destination links), unresolved, expired. 7/7 behave as the code reads. In a production build the calls are same-origin relative paths; under `vite dev` they go to `http://localhost:8787`.
- Offline: with no reachable backend the page shows "portfolio intelligence temporarily offline" with manual categories [AI] [GIS] [Support] [About] [Contact], which resolve deterministically. Verified in the browser through the CRT path.
- Rate limits (`server/config.mjs`): 6 asks and 60 polls per IP per minute, 12 jobs in flight, one concurrent worker job. **Finding:** a 429 is shown as the generic "temporarily offline" message, not as "too many requests". Not changed here.
- Origins: `ALLOWED_ORIGINS` exists in Vercel for **Production only** (not Preview), value hidden. Same-origin requests need no CORS, so production and preview both work same-origin; the code default (`localhost:5183`) does not match the Vite dev port (5173), so a local broker needs `ALLOWED_ORIGINS` set. Cross-origin hosting would be blocked unless the origin is added. Also present in Vercel and unused by any code on this branch: `GROQ_API_KEY`, `PUBLIC_CAPTAIN_GROQ_ENABLED`, `PUBLIC_CAPTAIN_INFERENCE_ENABLED`.
- **Proof First is missing from the backend corpus.** `server/corpus.json` (generated 2026-09-06) has no `proof-first` entries and no `proof-first` destination, so the worker cannot route to it and `server/validate.mjs` would strip it from a model answer. The browser's own `DESTINATIONS` and keyword rules do include it (so deterministic routing works). Cause: `scripts/build-corpus.mjs` loops every registry project, but its hand-copied `DESTINATIONS` allowlist lacks `proof-first`, and the snapshot predates the project. To correct it: add `'proof-first': { label: 'Proof First', href: '/projects/proof-first' }` to that allowlist, run `npm run corpus:build`, redeploy the broker and restart the worker. The content needed already exists as verified public copy in `src/data/projects.js` (`desc`, `problem`, `built`, `outcome`, `learned`, `stack`, status "Active product, workflow built and tested on bugs from my own projects, checkout not built"). One gap to decide: the corpus script emits a `status` entry only from `publicStatus`, which Proof First does not have, so the worker would have nothing grounded about availability/payment; the existing `status` string should be added as `publicStatus` (or emitted directly). Not done: it is a backend change.

## Verification
`npm run verify:04b` (needs `vite` on :5190, or `BASE=<url>`): 69 checks with real pointer, keyboard and touch input on the dev server and on the production build (`vite preview`). Screenshots and `report.json` are in `captures/iter-04b/`.

## Known limitations
- Tested in Chromium (headless, Metal GPU) only. Safari, Firefox and a real phone are untested; the alpha-hole screen technique and CSS3D inside WebGL are the main compatibility risks. Memory pressure on iOS may lose the context; the fallback is implemented but only exercised with a forced loss.
- No server rendering or prerender: crawlers see the same empty `#app` as before, plus the 3D page's real heading, text and links after JavaScript runs (same CSR limitation as the existing site).
- The room is kept in GPU memory while the visitor reads experiences or case studies; it is suspended (no CPU/GPU work) but not freed.
- Disk numbering is the case ID (C-06 etc.), never the Project World stop number; Help Nearby now has a disk, Predmkt Bot deliberately does not.
- "Skip journey" and the Project World landfall link now open the About experience (previously they scrolled to the About section below).
- Frame timing and GPU memory were not measured on low-end hardware.

## Deferred (own iteration)
Notebook -> About, systems diagram -> Skills, communication device -> Contact (physical objects; kept on the roadmap, not built); typed lookup inside the 3D screen; Safari/iOS/Firefox pass; 429 wording; the corpus/destination correction above; `sitemap.xml` is missing `zarvin-one`; prerender/SEO work; freeing GPU memory when dormant for long; Iteration 05.
