# 09 — Complete room, 360° look-around, task chair

Not deployed; awaiting review and a real-iPhone test.

## Camera
- Look-around at the desk now turns a full 360° (mouse drag, touch swipe, Shift+arrows). Up to ±1 rad it is the approved orbit round the desk; beyond that the camera stops and turns in place (first-person), easing back to the rest position as the view comes round behind, so 360° lands exactly on the default desk view.
- The orbit part is shortened if it would leave the room or enter the reading-corner furniture (`env.bounds`, `keepOut` in engine.js).
- Pitch: −0.45 … +0.45 (a little above level, to the door head, down to the desk top); never inverts.
- The 34° station lens widens to 54° while turned away; it returns to 34° facing the desk. Stations, fitW and the book fit still use 34°.
- The dusk haze thins as the view turns away (`applyFog`); the corner views use `engine.setHaze` (replaces 08's fog tween).

## Room (`src/workspace3d/room.js`)
Room: x −2300 (window wall) … 6200, z −900 (back wall) … 7400 (front wall), ceiling 5200 above the floor (≈ 4.0 × 3.9 × 2.44 m).
- Right wall: walnut bookcase with books, brass clock and a ceramic bowl; framed contour-map print; brass sconce (one non-shadow point light) by the door.
- Front wall: office door (≈ 94 × 208 cm) opposite the workstation — casing, jambs, flush walnut leaf with two beaded panels, frosted vision panel with gold-leaf "CRVRO · GIS · CAD · SUPPORT SYSTEMS" sign-writing, brass lever, hinges, kick plate; light switch; framed survey plat; walnut peg rail with a leather satchel.
- Ceiling with cornice; wainscot, chair rail and skirting on every wall; window reveal.
- Floor resized to the room.

## Workstation
- The flat-file base is now a pedestal desk: drawers left (−1700…−560) and right (540…1200), a pencil drawer and a modesty panel, and a knee space under the computer ≈ 52 cm wide, 64 cm clear, full depth. Computer, disks, tray, plans, mug and notebook are unchanged.
- Task chair: late-70s, five-star base on twin-wheel casters, chrome gas column, tilt mechanism, brown-leather seat (≈ 46 cm) and curved back on a bent chrome spine, no arms; pushed into the knee space at (−40, 1000), seat front under the desk edge. It hides neither the tray nor the computer in the desk view (tested). No sit-at-desk station was added.

## Tests
New `scripts/verify-room.cjs` (16): default view unchanged; door; knee space; task chair placement; chair doesn't hide tray/computer; full turn by mouse (all quadrants), every heading finished and camera inside the room and clear of furniture; 8 headings × level/up/down with no void ray; pitch clamp; station round trip from behind; 34° lens on return; full turn by touch on 390×844 and 844×390.
Changed assertions (intended behaviour change): 05a "mouse 2b" (yaw unlimited), 05b1 "mouse 14" (pitch −0.45), 05b3 swipe/keyboard yaw-limit and pitch checks.

## Evidence
`captures/room/after/{1920,1280,390,844}-*.png` (headings 000/090/180/270/360, door wall, wide office, workstation chair, corner from room, lounge chair, seated, desk restored). Before/after: `captures/room/compare-before-after.png`.
