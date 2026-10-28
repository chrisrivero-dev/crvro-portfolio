# Release polish (after 05B.1)

All captures and tests ran in headless Chromium; 390×844 is phone **emulation**. Nothing was tested on a real device.

## Changes
| Issue | Change |
|---|---|
| Stations menu too tall on phones | 2×2 grid instead of a 4-row list. Dock height when open drops from 292 to 196 px; every button is still 44 px tall. |
| Drafting notes | Reading pose distance 860 → 1080 and target offset 40 → 60. At 1280×800 the note was clipped and the dock covered its lower part; now the whole note sits above the dock. Phones are unchanged (width-fitted). |
| CRT intro | Idle-screen type enlarged. Headline 20 → 33 px, summary 11.5 → 21 px, CTA 12 → 18 px, and the other lines raised to match. |
| Shortcut hint | Moved to the top-left on one line. It used to wrap at the bottom-left and crowd the dock at 1280 px. |
| Bundle (766 kB / 205 kB gzip) | Investigated, not changed. It is mostly three.js core, lazy-loaded after first paint, and never fetched in LO-FI. Splitting it would not reduce bytes, so there is no measurable benefit. |

## Results (dev :5190 and production build :5191)
| Suite | Dev | Production |
|---|---|---|
| 05B.1 | 36/36 | 36/36 |
| 05A | 39/39 | 39/39 |
| Regression (includes HI-FI/LO-FI) | 111/111 | 111/111 |

- case-ids: OK (7 disks mapped).
- Content-claims check: exit 0.

Screenshots: `captures/polish/before/` and `captures/polish/after/`, each at 1280, 1920 and 390.
