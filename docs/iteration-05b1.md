# Iteration 05B.1: Drafting Plans station

Built on `1ded8c4` (05A.1). 05B.2 (Flat-File Archive, INDEX drawer) is not started. No push, merge, deploy, backend or HeyHab changes.

## Decisions applied (from the 05B review)
| # | Decision | Applied as |
|---|---|---|
| 1 | INDEX drawer deferred to 05B.2 | Not built. |
| 2 | Phones: one "Stations" button | At ≤700 px or coarse pointers, the station row is replaced by **Stations · <current> ▴**. It opens an accessible list (four 44 px rows, current marked, focus moves in, Esc closes and returns focus). Desktop keeps the row of four. |
| 3 | Contextual pointers, text only | Desk label and hint mention the drafting plans. The Parcel Engine and GroundRules floppy directories gain *"A note on this project is pinned to the drafting plans: SHOW ME"*. No arrows, glows or overlays. |
| 4 | Split delivery | This is 05B.1 only. |
| 5 | Look-down ≈ -0.2 rad | `LOOK.pitchDown` 0.12 → 0.2, with a collision check and before/after frames. |

## What was built
- **Pinned notes (`src/workspace3d/plans.js`).**
  - There is one paper note per project with a GIS/CAD basis. The list is derived from the registry (`src/data/planNotes.js`: every `GIS_PROJECTS` entry plus any project tagged GIS). Today that is Parcel Engine (G-01) and GroundRules (C-05).
  - Each note is a WebGL paper mesh with a canvas texture, taped to the existing survey sheet by one strip of drafting tape.
  - It prints only registry fields: case ID, `title`, `titleEm`, `desc`, `kind`, `year`, `status` and `tags`.
  - It carries printed stamps: **CASE STUDY →** on every note, and **REPOSITORY ↗** only where the registry has a `repo` (Parcel Engine).
  - Each note's footer reads: *"Pinned note. The drawing underneath is studio decoration, not project documentation."* The sheet's hover label says the same ("project notes pinned to a studio drawing").
- **Why WebGL and not DOM:** the CSS3D layer sits behind the canvas and shows only through the CRT's glass. A DOM note on the sheet would be hidden. Stamps are therefore hit-tested by texture coordinate. The same actions exist as real buttons and links in the dock, and a visually hidden copy of the note text is provided for screen readers.
- **Stations and camera:**
  - `plans`: over the sheet, looking down, framed so both notes fit on a phone.
  - `note`: square-on to one note from its lower edge so the text reads upright. The pose is computed from the note's own transform.
  - Every move is a single tween from the current pose; under reduced motion it becomes a cut.
- **URLs:**
  - `/#plans` and `/#plans/<slug>`. An unknown slug falls back to `/#plans`, so no note is invented.
  - Deep links, Back/Forward and return from the case study all land in the same state.
  - "Read case study" remembers `/#plans/<slug>` as its origin.
- **Interaction:**
  - Desk:
    - Click the sheet → plans.
    - Click a note → straight to that note.
    - Hover names the sheet and each note.
  - Plans: click a note → read it.
  - Note view:
    - Press a printed stamp → case study (expanded) or repository (new tab).
    - Click the other note → move to it.
    - Click off the paper → back to the sheet.
  - Keyboard:
    - P goes to the plans; ←/→ cycling includes them.
    - Esc steps back one level: note → plans → desk.
    - The dock offers "<Title> note", "Read case study", "Repository ↗" and "Back to the sheet".
- **One object in hand:** going to the plans with a disk held returns the disk to its slot first. A disk loaded in the drive stays there.
- **Scene change:** the existing pencil on the sheet moved to the sheet's lower right so it no longer lies across a note. No props were added apart from the two notes and their tape strips.

## Evidence (`captures/iter-05b1/`, `report.json`)
All automated runs used headless Chromium (Puppeteer) with phone **emulation** at 390×844. **Nothing was tested on a real device.**

| Suite | Dev (:5190) | Production build (:5191) |
|---|---|---|
| `scripts/verify-05b1.cjs` (new) | 36/36 | 36/36 |
| `scripts/verify-05a.cjs` | 39/39 | 39/39 |
| `scripts/verify-regression.cjs` | 111/111 | 111/111 |
| `npm run case-ids:test` | 8 IDs unique, 7 disks mapped | n/a |
| `scripts/verify-claims.cjs` | exit 0 | n/a |

The 05A and regression suites were updated only for intended changes:
- The station list now includes "Drafting plans".
- Phone station taps go through the Stations menu.
- The 44 px check measures visible controls only, because the hidden desktop row measures 0 px.

**Journeys recorded:**
- `mouse/`: desk → hover sheet → in-flight frame → plans → hover note → note → repository stamp (new tab: github.com/chrisrivero-dev/parcel-engine) → case-study stamp → Back to the note → other note → off the paper → Esc to the desk at the remembered viewpoint → a note straight from the desk → exact home poses → look-down limit.
- `keyboard/`: P → Tab/Enter on a note button → dock controls verified → Esc → Esc → ←/→ cycling.
- `touch/`: Stations menu → Drafting plans → tap a note → tap the printed case-study stamp → Back → Back to the sheet → Stations → Desk.
- `pointer/`: Parcel Engine disk in the drive → SHOW ME → camera to its note, disk still seated.

**Direct links and history:**
- `/#plans`, `/#plans/parcel-engine` and `/#plans/groundrules` deep-link correctly; `/#plans/not-a-project` falls back to the plans.
- Back ×3 then Forward ×2 gives `/#plans/parcel-engine → /#plans → / → /#plans → /#plans/parcel-engine`, with the room following each step.

**Measurements:**

| | Desktop 1500×950 | Phone 390×844 |
|---|---|---|
| Note on screen, reading pose | 501×639 px | 328×421 px |
| Note body text | about 16 px | about 10.6 px (05A.1 CRT standard: 10–12) |
| Printed stamp height | 89 px | 57 px (≥44) |
| Each note as a tap target at the plans pose | — | about 143×130 px |
| Camera inside any object; prop between camera and note | none | none |

The look-down limit of -0.2 was also checked for collisions: the camera stays clear of every object.

**Framing, before and after:**
- `framing/01-before-lookdown-0.12.png` vs `02-after-lookdown-0.20.png`: the lower limit now shows the PLATS, SURVEY and RECORDS drawer fronts.
- `framing/03-desk-rest.png`: both notes are visible on the sheet from the desk.
- `framing/04-plans.png`: the plans station.
- `framing-phone/`: the same at 390 px.

## Known problems and limits
1. **The phone rest pose does not show the sheet.** The portrait framing (05A.1) crops it, so on a phone the plans are discovered through the desk label, dragging to look right, or the Stations menu.
2. **The plans pose is an overview, not a reading pose.** Stamps are too small to press there (16 px and 3 px tall on a phone), so a press on a note always opens the note first. This is by design, but it costs one extra step for a visitor who aims at a stamp.
3. **Note text is a texture.** It is not selectable or searchable on the page. Screen readers get a hidden copy plus the case-study link, and the case study remains the full, indexable text.
4. **Lamp exposure warms and flattens the paper at a distance.** Notes are legible only at the reading pose, which is where they are meant to be read.
5. **On desktop at 1500 px the shortcut hint wraps to two lines** at the bottom-left of the desk view. This is cosmetic.
6. **The repository stamp uses `window.open` from the click.** Chromium allowed it; strict popup blockers are untested. The dock's Repository link is a real `<a target="_blank">`.
7. **Real devices are untested**, including iPhone Safari touch, texture memory and text crispness. This must be done before any production decision.

## Files
- **New:** `src/data/planNotes.js`, `src/workspace3d/plans.js`, `scripts/verify-05b1.cjs`, `captures/iter-05b1/`
- **Changed:** `src/workspace3d/controller.js`, `Workspace3D.jsx`, `CrtScreen.jsx`, `engine.js`, `env.js`, `src/lib/stations.js`, `src/styles/workspace3d.css`, `scripts/verify-05a.cjs`, `scripts/verify-regression.cjs`
