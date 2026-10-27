# Iteration 05A: the studio as the navigation (desk, computer, disk-tray stations)

Builds on 04D (`ce94df4`, kept as the recoverable checkpoint). Local only: nothing pushed, merged or deployed. No backend or corpus change; HeyHab untouched. 05B and 05C are not started.

## What changed
**The room is the primary navigation.**
- **Desk station (`/`):** drag with the mouse or a finger to look around, within limits of about ±26° sideways and -7° to +9° up and down. This is controlled look-around, not free flight or first-person movement. Clicking the CRT glass or the computer moves to it, and clicking the floppy organizer moves to it. Hover labels name every object.
- **Computer station (`/#computer`):** the camera moves to the physical screen. The CRT shows the menu, and **ASK.EXE and CONTACT.TXT run on the CRT itself**, using the existing `PortfolioNavigator` and `Contact` components unchanged. FULL SCREEN expands them into the existing interface for longer content. WORLD.MAP, ABOUT, SKILLS and CONSULT still open the expanded interface. A loaded disk's directory shows here.
- **Disk-tray station (`/#disks`):** the camera moves to the organizer. Clicking a disk **lifts the existing 3D disk out of its slot and holds it up to the camera** (`/#disk/<slug>`), with its label (case ID, title, line) readable. From there:
  - **Insert into drive:** the disk travels physically to the drive, and the project shows on the CRT.
  - **Read case study:** opens the expanded interface; returning lands back on the held disk.
  - **Put back** (or Escape, or a click away): the disk returns to its exact slot.
- **Return keeps the viewpoint:** going back to the desk restores the exact look direction the visitor left. Only a settled view is remembered, never a half-finished flight. "Return to workspace" in the expanded interface goes back to the station that opened it.
- **URLs and history:** every settled station is a URL. Back and Forward retrace the visit without resets, deep links open the station directly, and nothing is written to the URL while the camera is moving.
- **Secondary aids, not replacements:**
  - A station switcher (Desk, Computer, Disk tray), with the current station marked.
  - Contextual actions for the current station.
  - A hint bar: "Drag to look around · click an object · C computer · D disk tray · ←/→ stations · Esc back".
  - Shift+←/→ looks around for keyboard users.
  - Focus moves to the current station control when the camera leaves the screen.
- **HI-FI / LO-FI:** the 3D page has a visible "HI-FI · LO-FI" switch to the existing plain portfolio, and the plain page offers "Switch to HI-FI". The fallback itself is unchanged: no WebGL2 or a lost context still lead to LO-FI automatically, with an explanation.
- **Loading:** no entry gate and no artificial delay. The existing real "Loading the workspace…" status remains.

## Evidence
- **Recorded journeys** (sequential frames with assertions at each step), in `captures/iter-05a/`:
  - `mouse/`, `mouse-journey.gif`, `mouse-sequence.png` (21 frames): enter, look left, look right, hover the computer, camera moving to the CRT, at the CRT, back in the room, camera moving to the organizer, hover a disk, disk lifting, disk rising to the camera, disk in hand, travelling to the drive, entering the slot, project on the CRT, back in the room (disk still seated), Ask on the CRT, Contact on the CRT, case study expanded, returned to the held disk.
  - `keyboard/`, `keyboard-journey.gif` (8 frames): Shift+arrows look, C, Esc, D, Enter lifts, Insert, arrow keys read files, Esc.
  - `touch/`, `touch-journey.gif` (8 frames, 390×844 emulation): finger drag to look, tap the computer, Back, tap the organizer, tap a disk, Insert, Desk.
- **05A suite** (`npm run verify:05a`): 39/39 on the dev server and 39/39 on the production build (`vite preview`). It also covers the direct links `/#computer`, `/#disks` and `/#disk/proof-first`, and Back/Forward.
- **Regression suite** (`scripts/verify-regression.cjs`, the 04B–04D checks ported to the station model): 109/109 on the dev server and 109/109 on the production build. Behaviour that changed on purpose, so the checks were updated rather than dropped:
  - Clicking a disk now lifts it first; inserting is a separate action.
  - Eject ends at the organizer, not the desk.
  - The expanded interface returns to `/#computer`.
  - ASK.EXE and CONTACT.TXT open on the CRT first; FULL SCREEN reaches the old full-page path, which is still tested.
  - The hover label is now "Floppy organizer".
  - The mobile control area now holds the station switcher plus the action row, so its height limit was raised from 10% to 16% of the viewport. This is a real cost to note.

**Emulation, not real devices.** Everything ran in one automated Chromium (headless, Mac GPU). Touch means Puppeteer touch events in a 390×844 emulated viewport.

**Not verified:**
- Real iPhone or Android touch and scrolling, Safari or Firefox rendering, real performance and GPU memory, iOS context loss.
- Real screen readers.
- Typing in ASK.EXE on a real phone keyboard, inside the 3D screen.
- The production backend, which still has the routing issue in `docs/backend-proposal-04d.md`; nothing here claims it works.

## Bundle (gzip)
| | 04D | 05A |
|---|---|---|
| main JS | 156.36 KB | 156.82 KB |
| lazy 3D JS | 199.96 KB | 202.23 KB |
| lazy 3D CSS | 2.72 KB | 3.44 KB |

## Known limitations
- The mobile control area is taller than in 04D: station switcher plus actions, about 15% of the viewport.
- ASK.EXE on the CRT is the existing component in a 600×400 screen. Long answers scroll inside it, and FULL SCREEN is the better reading surface.
- Look-around is limited to the desk station; the computer and tray stations are fixed views.
- The weak-device heuristic that would offer LO-FI first is not implemented, only the manual switch and the failure fallbacks.
