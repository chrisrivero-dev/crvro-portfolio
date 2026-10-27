# Iteration 04C: the CRT as an immersive application shell

Continues `6054572` (04B, kept intact). Local only: nothing pushed, merged or deployed. `m15-iter-03-approved` is untouched.

## What changed, and why
04B opened Project World and the Lookup as ordinary bright pages. In 04C the physical CRT "becomes" the interface:

- **Immersive shell** (`src/components/OsShell.jsx`, `src/styles/os.css`): a phosphor-dark frame (the site's own dark tokens retuned from slate to the CRT's amber), the screen's scanline texture, a copper-rimmed bezel, and a bar with the file tabs (WORLD.MAP, ASK.EXE, ABOUT.TXT, SKILLS.TXT, CONSULT.EXE, CONTACT.TXT) and an obvious **Return to workspace**. The existing components render **unchanged** inside it, and scrolling stays the document's, so Project World's scroll-driven journey, its sticky stage (the bar is the same 64px as the old header) and scroll restoration behave as before.
- **Continuous hand-off:** the camera fills the viewport with the screen; the shell then fades in from the same dark phosphor while the room fades out underneath (`.ws3d--leaving`), instead of cutting to a bright page. Return reverses it: the room resumes at the screen-filling pose and pulls back to the CRT.
- **Case studies** use the same shell for visitors who have the 3D front door (`/projects/<slug>` is unchanged; the content, URL and SEO text are the same). Visitors on the 2D page, without WebGL2, or who chose 2D get the original light pages. "Back to all work" now returns to Project World (`history.back()` when the visitor came from it, so the stop and scroll are restored).
- **Skip Journey** now skips the journey: it scrolls, in place, to the Destination Lookup that follows the voyage (it used to open About). Implemented in the link handler, not by editing Project World. The decorative aria-hidden caption "MAKE LANDFALL: § 02 ABOUT" is re-worded by CSS inside the shell.
- **Physical targets:** the computer body and the tray are pointer targets with hover labels (the dock stays as the keyboard/touch equivalent). Clicking the tray frames the disks and the drive (`Back to room` returns); clicking a disk there loads it.
- **Mobile dock:** one slim row ([Use the computer] [Floppy disks]) instead of a two-row panel; the seven disks (with case IDs) open on demand. The resting dock is 58 px on a 844 px viewport (was 110).
- **No fake terminal activity:** the CRT menu and disk directory appear at once (no typed `DIR`, staged rows or `TYPE` animation). The only motion is the cursor blink and the disk's real travel in the room.
- **Lookup:** ASK.EXE opened directly no longer says "journey complete" (the Lookup after Project World keeps its original intro). HTTP 429 now shows "too many questions in a short time... wait about a minute" with the manual categories, not the offline message. Both are small edits to `PortfolioNavigator.jsx` (copy and a new state); matching, API calls, polling and offline handling are unchanged.

## Destination Lookup backend: what could actually be verified
Read-only probes of the deployed site (`scripts/probe-backend.mjs`: only OPTIONS and GETs; **no POST /api/ask**, so no job was queued on the owner's worker), plus code and `vercel env ls` (names only).

| Observation (2026-10-27) | Meaning |
|---|---|
| `https://crvro.com` redirects (307) to `https://www.crvro.com` | the canonical host is `www` |
| `OPTIONS /api/ask` with `Origin: https://www.crvro.com` and `https://crvro.com` -> 204 and `Access-Control-Allow-Origin` echoes the origin; with `https://crvro.vercel.app`, `http://localhost:5173`, `https://example.invalid` -> 204 with no allow-origin | the production allow-list is exactly those two origins (matches `ALLOWED_ORIGINS` existing in Production only). Vercel preview URLs are not allowed cross-origin; same-origin calls need no CORS |
| `GET /api/ask` -> `404 {"error":"not_found"}`; `GET /api/worker/claim` -> `404 {"error":"not_found"}` (JSON from the handler) | the broker functions `api/ask` and `api/worker/*` are deployed and answering |
| `GET /api/result/<any id>` -> **200 text/html, the site's index.html** (`x-vercel-cache: HIT`) | the result route is served by the SPA fallback, not by the function. Consequence: even if a job were processed, the browser's poll would receive HTML, `res.json()` would throw, and the visitor would see the offline message |

Likely cause (unproven): `vercel.json` rewrites `/(.*)` to `/index.html`; static functions like `/api/ask` match first but the dynamic `api/result/[id].mjs` apparently does not. The usual fix is to exclude `api/` from the rewrite (for example `"source": "/((?!api/).*)"`). I did **not** change `vercel.json` or anything deployed: that is a production routing change for you to decide. What cannot be verified from here: whether the Mac worker or queue is up, whether a job would be claimed, the Preview environment's behaviour, and the value of `ALLOWED_ORIGINS` beyond what the CORS responses show. The simulated checks (`npm run verify:lookup`, request interception) prove the front end's handling only and say nothing about the real service. `GROQ_*` / `PUBLIC_CAPTAIN_*_ENABLED` variables exist in Vercel but no code on this branch reads them.

### Proof First corpus (investigated, not changed)
`server/corpus.json` (generated 2026-09-06) has no `proof-first` entries and no `proof-first` destination. A dry run of `scripts/build-corpus.mjs` with `proof-first` added to its hand-copied allowlist (output to a scratch file, nothing written to the repo) generates exactly six entries, all straight from `src/data/projects.js`: summary, problem, built, outcome, learned, stack. Nothing is invented. **No status/availability entry is generated**, because the script only reads `publicStatus`, which Proof First does not have. The registry already has a verified `status` string ("Active product · workflow built and tested on bugs from my own projects · checkout not built"); using it needs a decision (add `publicStatus` to the registry, or emit `status` in the script). The same dry run shows the committed corpus is also stale for Zarvin One (3 entries, from the later case-study rebuild) and GroundRules (1 entry). Applying it also needs a broker redeploy and a worker restart.

## Validation
Run `npm run verify:04c` (dev server on :5190; `BASE=<url>` for another host), `npm run verify:lookup`, `npm run case-ids:test`. Screenshots and `report.json` are in `captures/iter-04c/`.

**What browser automation verified** (Puppeteer-driven Chromium, headless, Mac GPU via Metal; mobile = 390x844 emulation with touch events): 92 checks on the dev server and the same 92 on the production build (`vite preview`), covering the 3D room, hover/click/tap on CRT, tray and disks, disk travel and directory, the CRT menu appearing at once, the crossfade hand-off, Project World/Lookup/About/Skills/Consult/Contact inside the shell, Skip Journey, the Lookup's direct intro, the 429 message (simulated), Back/Forward and scroll restoration (including "Back to all work" and Project World stop), keyboard path and focus, reduced motion, deep links, `/?classic=1`, the 2D mode, context loss and restore, and a browser without WebGL2.

**Real devices or browsers actually tested:** none. Everything ran in one automated Chromium. No Safari, Firefox, iOS or Android device; touch is simulated events, not a finger.

**Remains unverified:** Safari/WebKit and Firefox rendering (the alpha-hole screen over CSS3D is the main risk); real-device performance, GPU memory and iOS context-loss behaviour; the real broker, queue and worker (see above); the production `ALLOWED_ORIGINS` value; screen readers (no AT was run; only DOM semantics and focus were checked); visual review on real high-DPI displays.

## Bundle and performance
| gz | before 3D (Oct 15 dist) | 04B | 04C |
|---|---|---|---|
| main JS | 151.85 KB | 155.05 KB | 155.99 KB |
| main CSS | 21.08 KB | 21.57 KB | 22.49 KB |
| lazy 3D chunk JS (Three + engine) | n/a | 199.86 KB | 199.97 KB |
| lazy 3D chunk CSS | n/a | 2.52 KB | 2.69 KB |
Deep links to experiences and case studies never download the 3D chunk. Not measured: frame time and GPU memory on low-end hardware. Idle frames: 0 while the room is idle without steam in view, 0 while suspended; steam about 15 fps only while the mug is on screen.

## Regressions and behaviour changes
- No test regressions: the 04B suite's checks carry over (92 now). Project World, the registry and the case-study components have zero diff.
- Changed on purpose: case studies and experiences look different (dark phosphor) for visitors with the 3D front door; the immersive interface has no light/dark toggle (the 2D pages keep it); "Back to all work" goes to Project World; Skip Journey goes to the Lookup; the CRT no longer types.
- `PortfolioNavigator.jsx` is no longer byte-identical to 04B: two additive edits listed above.

## Limitations and deferred
Unverified items above; the production `/api/result/:id` and corpus issues are findings, not fixes; the physical notebook (About), systems diagram (Skills) and communication device (Contact) remain on the roadmap, deliberately not built; `sitemap.xml` still omits `zarvin-one`; no server rendering or prerender; the room stays in GPU memory (suspended) while experiences are open; Iteration 05 not started.

## The unrelated HeyHab commit (2aa5117), for your decision only
It is in `/Users/christopher/Projects/heyhab-harness`, a different project, made before the correction that said the HeyHab prompt was sent here by mistake. It changes `src/answer-fit.mjs` and `tests/answer-fit.test.mjs` so the answer-selection logic matches the asked attribute (a price question is no longer answered with a size or capacity sentence). The full test suite there passed (262/262) when it was made. It is local, unpushed, and independent of CRVRO. I have not touched it again. If you do not want it, `git revert 2aa5117` in that repo undoes it; otherwise nothing is required.
