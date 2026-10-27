# Felix Rieseberg reference analysis, CRVRO gap assessment, explorable-studio proposal

Observed on 2026-10-27 in a real browser (Chromium in the Claude desktop app, desktop viewport plus a 375×812 phone emulation) at https://felixrieseberg.com/. No implementation was started. Checkpoint 04D (`ce94df4`) is untouched.

## Phase 1: what the reference actually does

### Observed
| Topic | Evidence |
|---|---|
| **Entry** | The page opens on one rendered 3D desk scene with an HTML nav overlay (ABOUT, WORK, POSTS, ONLINE). The scene's own CRT shows a loading bar, then "CLICK TO ENTER" with a SOUND ON/OFF toggle. Clicking the CRT enters: the TV shows a title card ("FELIX RIESEBERG"), then plays a video clip. A hint bar appears: "C use computer · M use CD player · Z zoom TV · 1–6 monitor buttons", plus CREDITS, SOUND, LO-FI pills. |
| **Static fallback** | The full static site (Work, Projects, Podcasts, Posts as plain HTML) is in the DOM alongside the canvas. Its note says devices judged weak are routed to the static version, with a link to try the interactive version anyway. |
| **Navigation** | Nav items are **camera stations in one room**, not pages. WORK moves the camera to the right and **lifts a handwritten notepad toward the camera** (the work list). ABOUT and ONLINE **turn the camera around the room** to a second station: a beige PC with a green terminal, a postcard wall and a chair. POSTS **moves the camera to the TV**, which shows a teletext-style index ("↑↓ pick · Enter reads · ←→ turns the page"). The URL and tab title follow each state: `/#work`, `/about-me/`, `#online`, `#posts`. |
| **Interactive objects** | Hovering shows an object label (for example "TAPE · ANTHROPIC" over a tape spine). Tape spines, the notepad, the TV ("Z zoom", "C use computer"), the CD player ("M") and the monitor buttons ("1–6") are offered. Clicking the Anthropic tape opened the WORK state with the notepad's Anthropic entry expanded. |
| **On selection** | The camera animates to a new viewpoint, and the content is presented **inside the world**: a physical prop is brought to the camera (the notepad), or a screen in the room shows it (the TV teletext). I saw no flat page replacing the scene. |
| **Camera** | Smooth, director-controlled moves between fixed viewpoints. The scene keeps living (rain on the window, TV video). |
| **Return** | A pill names the way back for the current state: "PUT DOWN NOTEPAD · ESC" or "BACK TO THE DESK · ESC". Escape works, and the nav jumps directly between stations. |
| **Mobile** | At 375×812 the canvas loads with "TAP TO ENTER" on the CRT and a menu icon top-right. |

### Not verified
- Free drag/orbit (I did not test it).
- What the monitor buttons 1–6 and the CD player do.
- Sound.
- Mobile interaction after entering.
- The exact rule that sends a visitor to the static site.
- Whether every tape opens its own entry: I saw Anthropic only.

## Phase 2: gap assessment, CRVRO 04D against the reference
| Reference capability | CRVRO 04D | Status |
|---|---|---|
| One explorable room, director camera with smooth tweens | D2 studio, rest, tray and CRT poses, tweened, on-demand rendering | **Implemented** |
| A CRT that is the entry and shows content in-world | CRT home, menu and floppy directory are real DOM on the 3D screen | **Implemented** |
| Physical objects that carry content | Floppies lift, travel and seat in the drive, and the directory shows on the CRT | **Implemented** (one object type) |
| Hover labels on objects | Computer, tray and disks | **Partial**: other objects are inert |
| Escape and a named way back | Esc at the CRT, "Return to workspace", eject | **Implemented** |
| Several stations around the room | Desk, tray close-up and CRT only. The survey sheet, flat-file drawers, binder shelf, framed plat and mug can't be selected | **Missing** |
| Nav items as camera stations | The nav exists only inside the OS shell, and every item **leaves the room** for a full page | **Missing / contrary** |
| Content stays in the world | The floppy directory does. Project World, Ask, About, Skills, Consult, Contact and case studies replace the room with the full-page OS shell | **Partial** |
| Props brought to the camera | None. Disks travel to the drive, never to the viewer | **Missing** |
| URL per world state | Experiences use hashes; tray, CRT and loaded-disk states have no URL | **Partial** |
| Entry gate with loading on the CRT | The scene loads straight in, with a text "Loading the workspace…" | **Missing** (deliberately simple so far) |
| Keyboard shortcuts with a visible hint bar | Dock buttons, arrow keys in menus, Esc; no shortcut hints | **Partial** |
| Ambient life | Steam, cursor blink | **Partial** (no window life or sound; fine to keep restrained) |
| Static fallback in the DOM, plus a device heuristic | 2D home, no-WebGL2 and context-loss fallback, "2D view" choice | **Implemented** (no weak-device heuristic) |
| Mobile entry and controls | Slim dock, FILES menu, touch tested in emulation only | **Partial** |

The core gap: CRVRO navigates **out of** the world, while the reference navigates **within** it.

## Phase 3: proposed explorable CRVRO studio

### Principle
The studio is the navigation. Every top-level destination is a **station**: a camera viewpoint at a real object, with a URL and a named way back. Content is read **in the world** first: on the CRT, on a sheet of paper, on a disk label, on a drawer card. The expanded computer interface stays, but only as **one destination**, for long-form content (the Project World journey, full case studies, the Lookup conversation). It always returns to the station it was opened from.

### Stations (existing objects only; nothing new to the room unless approved)
| Station (URL) | Object | What the visitor does | Content and where it shows |
|---|---|---|---|
| Desk `/` | The whole studio | Hover labels on every station object; Tab or ←/→ cycles stations | Overview. The CRT shows the hero line |
| Computer `/#computer` | CRT + keyboard | "Use the computer" (key C) | CRT menu: ASK.EXE runs **on the CRT** for short answers; WORLD.MAP, case studies and long answers expand into the OS shell |
| Disk tray `/#disks`, `/#disk/<slug>` | Floppy organizer | Pick a disk: it is **lifted to the camera** with its label readable (case ID, title, one-line). Then "Insert" (into the drive: directory on the CRT) or "Read the case study" (expanded interface) | Label in-world; directory on the CRT; full study in the shell |
| Drafting plans `/#plans` | The taped survey sheet and rolled plans | The camera tilts over the sheet. The GIS/CAD projects with real registry entries (Parcel Engine, GroundRules) are drawn as **labelled sheets/tabs**; picking one shows its summary on the paper and offers its case study | In-world paper (CSS3D on the sheet) |
| Chart archive `/#archive` → Project World | Flat-file cabinet | A drawer slides out; the **chart** (Project World) is lifted. "Unroll the chart" expands into the existing Project World journey; Back returns to the open drawer. Drawer cards list every case study as a second path | Drawer cards in-world; journey in the shell (unchanged component) |
| Records `/#about`, `/#skills` | Binder shelf (two labelled binders) | A binder is pulled and opened toward the camera (like Felix's notepad) | About and Skills text on the binder pages, from the existing components' copy |
| Contact `/#contact` | **Needs a decision**: roadmap §7 names a "communication device", which the room doesn't have. Options: a desk telephone (new object), the keyboard, or the CRT only | — | — |
| AI consultation | CRT menu (CONSULT.EXE) | — | Shell |

### Movement and continuity
- **Director camera only, no free fly.** Each station has a desktop pose and a portrait pose (the `fitW` approach already in the engine). Moves take 700–1100 ms; under reduced motion they become cuts.
- **One state machine** of station → object-in-hand → expanded. It is mirrored in the URL, so Back/Forward and deep links land in the same 3D state. Example: `/#disk/zarvin-one` opens with the disk lifted, and `/projects/zarvin-one` stays the SEO page and the expanded view.
- **Return is always named:** "Put the disk back · Esc", "Close the drawer · Esc", "Back to the desk · Esc". Expanded views return to the station that opened them. This reuses the existing scroll and focus restoration.
- **Discoverability:** hover labels on every station object; a hint bar ("C computer · D disks · P plans · A archive · ←/→ stations · Esc back"); a subtle first-visit cue on the CRT.

### Mobile, loading, fallback
- **Mobile:** the same stations. A bottom station switcher (previous / current name / next, plus a "Stations" sheet) replaces hover labels, and objects are tap targets. Every station pose is framed for portrait.
- **Entry gate (proposed, needs a decision):** the CRT shows real load progress, then "Enter"; deep links skip the gate.
- **Fallback:** the existing 2D home and classic pages stay, plus an optional weak-device heuristic that offers 2D first.

### Phased plan (each phase stops for review)
1. **05A, the station system.** Station and URL state machine; Desk, Computer and Disk tray stations; pick-up-to-camera for disks with Insert / Read; ASK.EXE on the CRT; hint bar; mobile station switcher. Expanded views return to their origin.
2. **05B, plans and archive.** Survey-sheet station for the GIS/CAD projects; flat-file drawer station with drawer cards and "unroll the chart" into Project World.
3. **05C, records and contact.** Binder About/Skills; the Contact object per your decision; optional entry gate.

**Acceptance, per your new standard:**
- Every project is reachable by **at least two physical paths** (disk, and chart or drawer or plans) without opening a menu.
- Every station is deep-linkable and restores on Back/Forward.
- No full-page view opens except for long-form content, and every one returns to its station.
- Everything is keyboard- and touch-operable, and the 2D fallback still lists everything.
- Each phase is verified with automation, **and with a real iPhone/Safari pass before production is considered**.

### Decisions needed
1. Approve the station model, and that the expanded interface is used only for long-form content.
2. Contact object: add a desk telephone, use the keyboard, or keep Contact on the CRT only?
3. Should ASK.EXE (short answers) run directly on the CRT?
4. Add the entry gate ("Enter" after CRT load progress), or keep loading straight in?
5. Start with 05A only?
