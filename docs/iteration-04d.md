# Iteration 04D: refinement of the immersive interface (local only)

Builds on `45443c7` (04C, architecture approved; production **not** approved) and `6054572` (04B). Nothing is pushed, merged or deployed; `m15-iter-03-approved` is untouched. The backend work is **investigation and proposal only** and lives in `docs/backend-proposal-04d.md` with patches in `docs/proposals/` (none applied).

## 1. Visual and interaction changes
- **The expanded interface is now the monitor, not a bordered website** (`OsShell.jsx`, `os.css`): rounded glass with a vignette and a faint highlight, a moulded bezel with the copper ring of the 3D screen opening, a dark moulding line, the CRVRO badge and power LED in the lower bezel, and the bar inside the glass. Content stays flat, full-size, selectable HTML: no distortion, no filter or transform on the page, only a very faint glow on headings. Project World's sticky stage was re-offset (CSS only) for the bezel.
- **Desktop dock simplified** (`Workspace3D.jsx`): "Use the computer" leads; one "Floppy disks" toggle opens the seven disks (with case IDs) on demand. Opening moves focus into the list, Escape closes it and returns focus to the toggle. The physical tray and disks remain clickable in the room (hover labels, tray close-up, load/eject unchanged).
- **Mobile Project World**: heading now starts 14px below the bar (was 96px), the first island starts at 410px (was 537px) through trimmed `.work`, section-head, intro and stop padding, scoped to the interface. The floating **WORLD MAP** control now lives in the lower bezel, below the glass, so it can never cover content (it had been trapped under the frame by a stacking context on `<main>`, which is removed).
- **Discoverable, accessible file tabs on phones**: a 44px `FILES <current file>` button replaces the horizontally scrolling tabs. It is a disclosure (`aria-expanded`, `aria-controls`), opens a panel of the six files with descriptions and 48px+ targets, marks the current page (`aria-current`), takes focus on open, closes on Escape (focus returns to the button), on an outside tap, and on choosing a file.

## 2. The plain teal circle in the classic Zarvin One case study: intentional
It is the project's **identity mark**, not a missing image. `CaseStudy.jsx:278` renders `<ProjectMark shape={p.shape} color={p.accent} size={120} />` in `.case-hero .mark-row` for every case study, from the registry fields `shape` and `accent` (`projects.js`: zarvin-one `circle`/teal, proof-first `square`/blue, sidecar `half`, openclaw `stack`, help-nearby `circle`/terracotta, groundrules/predmkt/parcel `arc`). The component, the row and the field date from the first commit of the site (2026-05-05) and the same marks are used on Project World cards and home rows; it is `aria-hidden`. It reads as stark because it sits alone in a bordered row at 120px. Not changed. If you want it richer, that is a design decision (for example scale it down into the meta column).

## 3. Provenance: where each fact on the floppy, the expanded page and the classic page comes from
Checked with `scripts/verify-claims.cjs` against the live DOM (`captures/iter-04d/claims.json`) and the source.
- **Expanded (immersive) and classic case-study pages carry identical text** for all seven disk projects (same `CaseStudy` component; only the frame differs).
- **Floppy files are registry fields, never typed**: README = `desc` (+`titleEm`), STATUS = `status`, ROLE = `role`/`year`, STACK = `tags` + `stack`, CASE/DEMO/SITE/REPO = `/projects/<slug>`, `demo`, `site`, `repo`.
- **Found on both the floppy and the case page, verbatim:** `titleEm`, `kind`, `year`, `status`, `role`, and every `demo`/`site`/`repo` link, for all seven.
- **Only on the floppy (registry fields the page body does not print):** `desc` (the README; it is the page's `<meta description>`/Open Graph text, from the same field) and `tags` (shown on Project World cards and home rows) for all seven; and **Proof First's `stack`** (JavaScript, Vercel, Private Blob storage; Python, Docker sandbox, Local models via Ollama), because Proof First's bespoke body (`ProofFirstCaseStudy.jsx`) does not render a stack section. Zarvin One's STACK.TXT is its registry `tags` ("react native · expo · typescript · python · fastapi · local models"); its bespoke page mentions Expo, FastAPI, Python and local models but not React Native or TypeScript. These are additional registry claims on the floppy, not contradictions; nothing on the floppy contradicts the page.
- **Only on the page:** `outcome` (the floppy has no OUTCOME file by design).
- **Other sources, named in the code:** Project World card sentences are `DESCRIPTIONS` in `worldData.jsx` ("approved short form of each case study"), with kind, badge, tags, accent and slug from the registry. The Zarvin One and Proof First bodies are hand-written with their provenance in the file headers (Zarvin: reconciled 2026-10-24 against the named repositories and commits; Proof First: the proof-first and proof-first-worker repos and a published case record). **I changed none of this copy, invented no status, accomplishment or demo.** Decision for you: whether the floppy should also show only what the page shows (drop Proof First's stack line, Zarvin's tags), or the page should gain a Proof First stack section.

## 4. Backend follow-up (proposal only; see `docs/backend-proposal-04d.md`)
- **Root cause confirmed:** `/api/result/<id>` is captured by the SPA catch-all rewrite. The function **is deployed** (the literal `/api/result/[id]` path reaches it and throws a 500), and Vercel's own route-merge, reproduced offline with `@vercel/fs-detectors` and `@vercel/routing-utils`, places the generated dynamic route *after* the site's `/(.*)` rewrite, so `index.html` wins. The offline model of the current config reproduces every production observation.
- **Fix:** `"source": "/((?!api/).*)"`. Across 14 request shapes only three change (`/api/result/<id>` now reaches the function; `/api/nothing` becomes a 404; the rest, including `/api/ask`, `/api/worker/*`, `/projects/*`, `/`, `/robots.txt`, `/assets/*`, are identical). Client-side navigation never touches the server.
- **Corpus:** patches that derive the worker allowlist from the site's own `DESTINATIONS`, add a drift test, and regenerate `corpus.json` (adds six verbatim registry entries for Proof First and refreshes Zarvin One and GroundRules). One decision remains on a Proof First status entry.
- No POST was sent; no job was triggered; nothing deployed or changed.

## 5. Verification
Run `npm run verify:04d` (dev server on :5190, or `BASE=<url>`); also `npm run case-ids:test`, `npm run verify:lookup`, `node scripts/verify-claims.cjs`. Screenshots, `report.json` (including the recorded focus orders) and `claims.json` are in `captures/iter-04d/`; the 04C "before" set is `captures/iter-04c/`.

**What browser automation verified** (one automated Chromium, headless, Mac GPU; mobile = 390x844 emulation with touch events): 110 checks on the dev server and the same 110 on the production build (`vite preview`). They cover the room, hover/click/tap on the CRT, tray and disks, disk travel and directory, the collapsed dock, room -> computer -> World/Ask -> return, room -> floppy -> case study -> Back / eject, the bezel/monitor structure, mobile World spacing and the lower-bezel map control, the FILES menu (open, Escape, outside tap, navigate), Skip Journey, the Lookup states (429 simulated), Back/Forward and scroll restoration, deep links, `/?classic=1`, 2D mode, context loss, no-WebGL2, reduced motion, and keyboard focus orders.
**Focus orders recorded** (screen-reader-relevant): room: Browse without 3D, Project World, Ask about my work, About, Skills, AI consultation, Contact, 2D view, the CRT's "USE THE COMPUTER", the dock's "Use the computer", "Floppy disks". Phone interface: focus lands on `<main>` after a page opens; Shift+Tab reaches Return to workspace then FILES; forward Tab goes back through Return into the content.
**Real devices or browsers actually tested: none.** Automated Chromium is not evidence of Safari or iPhone behaviour. Unverified: Safari/WebKit and Firefox (the alpha-hole screen over CSS3D is the main risk), real iPhone/Android touch, scrolling and GPU memory, iOS context loss, real screen readers (VoiceOver/TalkBack/NVDA were not run; only DOM semantics and focus order were checked), high-DPI visual review, the real broker/queue/worker, and anything about production deployment.

## 6. Bundle and performance (gzip)
| | 04C | 04D |
|---|---|---|
| main JS | 155.99 KB | 156.36 KB |
| main CSS | 22.49 KB | 23.22 KB |
| lazy 3D JS | 199.97 KB | 199.96 KB |
| lazy 3D CSS | 2.69 KB | 2.72 KB |
Rendering behaviour is unchanged (on demand; zero frames suspended or idle apart from steam in view). The bezel uses one static large-spread box-shadow; frame cost was not measured on real hardware.

## 7. Regressions and behaviour changes
No check regressed (04C's 92 checks carry over; 04D adds 18). Intentional changes: the desktop dock no longer lists seven disk buttons inline; phone tabs became a FILES menu; page chrome is inset by the bezel (16px desktop, 7px phone) so very wide content has a little less room.

## 8. Remaining
Items under "Unverified"; the backend patches await your decision; the physical notebook, systems diagram and communication device stay deferred; Iteration 05 not started.
