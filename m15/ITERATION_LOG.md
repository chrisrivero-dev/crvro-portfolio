# CRVRO M1.5: iteration log

| Iter | Date | What changed | Status |
|---|---|---|---|
| 00 | 2026-10-26 | M1 r2 baseline frozen: local commit e2168e8, tag `m1-r2-baseline`. `m1/` is left untouched. | Approved baseline |
| 01 | 2026-10-26 | Three workspace compositions (A, B, C) built in the browser around the M1 computer. All three share one camera rig and one lighting rig: cool daylight key from the left with shadows, a warm off-frame desk-lamp spot, and a weak fill and rim light. The computer gains a 3.5" drive in place of its front vent ribs. Disk labels use real registry titles and slugs. | Awaiting selection |

## Iteration 01: notes

- **Rejected during the iteration:** the first framing (camera too far away, desk floating like a shelf). Moved the camera in and widened the desk so its edges leave the frame.
- **Disk labels:** taken from `src/data/projects.js`: Zarvin One, Proof First, Parcel Engine, OpenClaw / Hermes, Sidecar and GroundRules, each with its registry `titleEm` line.
- **Labels not used:** "HEYHAB" and "GIS AUTOMATION" are not in the registry, so they were left out.
- **Captures:** saved in `captures/iter-01/` at full resolution (1600×1000): three-quarter, front, top and destination-overlay views for each variant, plus `compare.png`.

## Iteration 02 — Option D hybrid, two light treatments (awaiting approval)
- New: `src/env-d.js` (shared geometry), `env-d1.js` / `env-d2.js` (light grade only), `d1.html`, `d2.html`, `tools/capture-02.cjs`, `captures/iter-02/`.
- `workspace.js` gained two optional hooks (`env.target`/`env.views`, `env.lighting`); A/B/C export neither, so they render unchanged.
- Geometry: C's flat-file cabinet base (to the floor, recessed plinth) + A's oak drafting top, taped survey sheet, scale, rolled plans; B's detached keyboard on a lead. Stepped index organizer beside the drive, six real projects, one disk out. Architecture: corner window wall, wainscot, binder shelf, framed plat, plan bin, articulated lamp as the real warm source.
- D1: daylight through the window, warm bounce, lamp as accent. D2: dusk window, fog, strong lamp pool, screen spill, faint additive lamp cone.
- Views: rest ¾, front, side, top, Room (wide), Drive + disks (close-up).
- Verified: desktop 1600×1000 loads in about 1 s with no page errors. Mobile 390×844 renders and the CTA is visible, but the HUD overlaps the buttons and the organizer is cropped at the left edge (no mobile composition yet).
