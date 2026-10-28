# Iteration 07: notebook fixes, reading corner (lounge chair, record player)

Branch `feature/crvro-3d-career-notebook`, worktree `~/Projects/crvro-3d-career`, on top of `5869bf8`. Not merged, pushed or deployed.

## Notebook
- **Ink.** Every line on the paper is a solid dark ink (`--career-ink #1a140d`, `--career-soft #4d4134`, accent `#8a3e22`); no text uses opacity any more (the employer line was 85 % opacity, contact notes 78 %). The text no longer fades in (only the paper does, in 0.18 s), so a screenshot taken as the page appears cannot catch half-transparent words. `-webkit-text-fill-color: currentColor` and `color-scheme: light` on the paper guard against an inherited fill colour or a dark-mode form style on iOS.
- **Order and spacing.** Each role reads employer → title → dates (with part-time / place) → summary → responsibilities → strengths, in normal flow; no fixed heights.
- **Two pages on wide screens.** On a landscape screen at least 560 px tall the left-hand page carries an overview (County of Orange since 2007, specialization) and an index of the facing page; a tap on an entry scrolls the right page to it and focuses its heading. Portrait phones and short landscape phones read the right-hand page alone, larger.
- **Short landscape phones** (under 500 px tall, e.g. an iPhone turned sideways): the open book is too small to read, so the page opens as a full-width paper sheet above the dock.
- **Overflow.** The page scrolls inside itself (keyboard focusable, labelled); a "Continued below ↓" button and a soft fade at the foot appear only while there is more text below.

## Reading corner (new)
- `src/workspace3d/lounge.js`: an original mid-century lounge chair (four splayed tapered walnut legs, walnut frame and open arms, loose dark-leather seat and back cushions with a head roll), a walnut side table with a shelf of plain record sleeves, and a record player (walnut plinth, brushed plate, platter, vinyl with a plain amber label, tonearm on a post with counterweight, one toggle and a pilot light). No brand forms, no artwork, no text on the label.
- **Where:** in front of the window wall, beside the desk's left end and outside the desk's rest frame (the test checks they cover under 1 % of it, so no drawer is hidden). The left wall now runs on past the corner and the floor is deeper, so the corner views never see an edge.
- **Reaching it:** the station switcher and the phone Stations menu ("Reading corner"), the L key, the quick links, `/#corner`. It is not in the ←/→ cycle (like the mug), so the five-station cycle is unchanged.
- **Chair:** tap or click it → seated view (`/#corner/seat`, the camera at the chair at a seated eye height looking across at the desk). "Stand up · back to the desk", Esc, or a tap returns to the desk at the viewpoint the visitor left.
- **Record player:** tap → close-up (`/#corner/record`); tap it again, Play, or Space → the tonearm swings onto the record, the pilot light comes on, the platter turns at 33⅓ rpm; tap / Stop / Space again stops it. Leaving the close-up stops it. **Silent**: no audio element, no AudioContext (the test checks). The spin is a rAF loop that exists only while playing and the page is visible; reduced motion sets the arm down and lights the lamp but does not turn the platter.
- **Light:** a slim brass floor lamp between the table and the window carries the corner's own warm light (no shadows).
- **Camera:** three new poses through the existing `flyTo` (corner, seat, record, plus portrait framings); no free movement, look-around limits unchanged.

## Tests
`scripts/verify-corner.cjs` (new) and the existing suites. See the delivery report for numbers.
