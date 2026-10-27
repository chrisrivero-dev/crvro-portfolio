# Iteration 05A.1: refinement pass on the station foundation

Builds on 05A (`1342c43`, preserved). Local only: no push, merge, deploy, backend or HeyHab change. 05B not started. Evidence: `captures/iter-05a1/` (`before/`, `after/`, `compare-desktop.png`, `compare-mobile.png`, `audit-before.json`, `audit-after.json`) from `scripts/capture-05a1.cjs` (`MODE=before|after`).

## 1. Coffee mug
Moved from the far-right edge (x 1260) to beside the right end of the keyboard and slightly toward the visitor (x 520, z 575). It sits on bare oak just in front of the survey sheet, clear of the plans, the disk organizer and the computer. Steam and the mug camera view follow it. No interaction added. Checked in the desk, tray and held-disk shots.

## 2. Mobile controls (audited at 390×844, worst-case backdrop = bright wall behind the translucent panels)
| | before | after |
|---|---|---|
| Smallest button height | **28 px** (HI-FI/LO-FI) | **44 px** |
| Smallest button text | **10 px** | **12 px** |
| Worst text contrast | 8.3:1 | 8.3:1 (already above 4.5:1) |
| Control area, % of viewport | 11.4 desk · 14 menu · 16.2 tray · 16.5 held | 11.4 desk · 13 menu · 15.8 tray · 13.3 held |
Changes: the mode switch is now a segmented HI-FI | LO-FI control (current mode highlighted, 44 px, sub-labels on desktop only); station and action text 12 px; hint labels brighter and 12 px; tighter padding; the held-disk caption is hidden on phones because the lifted disk's own label already says it. Tray and directory states are still about 16%, because they carry a label row, an action row and the station row; that is the remaining cost.

## 3. Physical CRT readability on mobile
Rendered text size on the phone (CSS px times screen scale):
| | before | after |
|---|---|---|
| CRT menu | 8.2 px | 10.1 px |
| Ask | **7.2 px** | 10.7 px |
| Contact | **7.8 px** | 10.1 px |
| Disk directory body | 11.4 px | 12 px |
How: the computer station frames the screen a little tighter on portrait (`fitW` 650 to 618) and the CRT's Ask, Contact and menu type is larger at phone width (17–19 px CSS). **One tap to a readable view:** whenever the CRT shows Ask, Contact or a loaded disk, the action row has "Expanded view ↗" (Ask and Contact to the full interface; a disk to its case study, returning to the computer station). In-world presentation stays the default. Honest limit: 10–12 px rendered is readable but small; the expanded view is the comfortable reading surface. Typing into Ask on a real phone keyboard is still untested.

## 4. Camera framing
- **Desk** (desktop): distance 3500 to 3200, so the computer, tray and plans fill more of the frame while the cabinet, wall and window keep the room feeling physical. Portrait desk framing unchanged.
- **Computer** (portrait): tighter, as above.
- **Disk tray**: reviewed, unchanged (organizer left, computer right, both prominent).

## 5. Disk interaction safety
Measured with bounding boxes at the held pose, desktop and phone: the lifted disk does not intersect the CRT, the keyboard (now tagged for the check) or the organizer, and sits 659 units (desktop) / 944 units (phone) from the camera, in front of everything. Putting it back restores its exact world position and orientation (compared to four decimals, both viewports). Animation and state behaviour unchanged.

## 6. HI-FI / LO-FI
Both modes work and are discoverable: the studio shows the segmented switch top-right; the LO-FI page shows the mirror switch at the top of its content; the expanded interface footer has "LO-FI version". The LO-FI portfolio itself is untouched. Failure recovery is unchanged: no WebGL2, init failure or a lost context fall back to LO-FI with an explanation and a way back.

## 7. Deferred content item (documented, not done)
**Project visuals on the expanded case-study pages.** Every case study shows a generic registry "identity mark" (Zarvin One: teal circle; Proof First: blue square; others half, stack, arc) in `.case-hero .mark-row`. It is intentional placeholder-level branding, not project artwork. A later content pass should replace or supplement it with **verified** visuals per project (real screenshots, diagrams or records from each project's own repository), chosen with you; none was invented here. See also the provenance notes in `docs/iteration-04d.md`.

## Verification
- 05A suite: 39/39 dev, 39/39 production build.
- Regression suite: 111/111 dev, 111/111 production build.
- Browser emulation only (one automated Chromium, 390×844 emulated viewport and touch events). **No real iPhone, Android, Safari or Firefox testing**, no screen reader, no real-device performance or memory measurement.
- Bundle (gzip): main JS 156.86 KB (05A 156.82), lazy 3D JS 202.34 KB (202.23), lazy 3D CSS 3.71 KB (3.44).
