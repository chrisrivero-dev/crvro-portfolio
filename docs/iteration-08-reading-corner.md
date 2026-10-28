# 08 — Reading corner redesign

Replaces the 07 generic wooden lounge chair with a composed reading/listening corner. Not deployed; awaiting review.

## What changed
- **Chair + ottoman** (`src/workspace3d/lounge.js`): moulded-plywood lounge type built from bent slabs — rosewood-veneer seat tray with wings, back and headrest shells, puffy espresso-leather cushions with pleats/buttons, padded arms, black cast five-star swivel base; matching ottoman on a four-star base, 1380 units in front. Generic model; nothing names a brand.
- **Record console**: low walnut cabinet on tapered legs, open LP bay (plain-colour spines), slatted door with brass pull; record player on the chair end (same silent behaviour), two books and a small trailing pothos at the far end.
- **Monstera** on a walnut stand (14 split leaves, one 256² alpha texture shared with the pothos; leaves fan away from the wall and the chair).
- **Arc lamp**: weighted base behind the chair, brass arc, amber dome over the reader's right shoulder; one non-shadow point light.
- **Rug**: low-contrast rust/ochre/cream wool under chair and ottoman.
- **Layout** (`env.loungePlaces`): console z 1820 (out of the desk view, 0.3 % ray coverage), chair (-900, 3700) rot 1.95 facing the desk, lamp z 4450, plant z 5480.
- **Cameras**: `corner` yaw 1.3 / 6700; `cornerPortrait` (fitW 3900); new `cornerShort` for landscape phones (vh < 500, resolved in `resolveView`); `seat` re-aimed from the new eye point; `record` re-targeted. The corner views thin the dusk fog while there (`cornerHaze` in controller.js); camera far plane 12000 → 18000.
- **Tests**: verify-corner 41 → 47 (plant/lamp clearance, ottoman ahead + rug under, ottoman and plant on screen at desktop, portrait and landscape).

## Evidence
`captures/career/after/{1920,1280,390,844}-07*.png` (07 corner, 07b overview with desk, 07c chair+ottoman, 07d plant), 08 seat, 10/11 record, 09/12 desk restored. Before/after: `captures/corner/after/compare-before-after.png` (before frames in `captures/corner/before/`).
