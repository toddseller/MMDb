# Design

## Context

`#search-boxes` is `position: fixed` at `top: 50px` on desktop, and `#preview` opens inside it: 350px tall on the movies pages, 300px on the shows page (set inline by `applyLayout` in `preview.js`). Because the band is out of the page flow, opening the panel grows the band down over the collection without moving anything; measured at 1500px, the open panel spans y=189 to 539, and the first row (y=170 to 431 at the top of the page) is under it at every scroll position. Below 768px wide or 500px tall, `responsive.css` makes the band `position: static`, so there the panel already pushes the grid down.

`showPanel` opens the panel with `slideDown` (a 300ms height animation from `motion.js`) and `close` shuts it with `slideUp`. Opening a poster's details calls `close` from `togglePoster` in `drawer.js`, then awaits the details request, then opens and glides the drawer, which measures the poster's position at that point.

## Goals / Non-Goals

**Goals:**
- With the panel open on desktop, scrolling to the top shows the whole first row below it.
- Opening or closing the panel while scrolled down leaves the posters on screen where they are, in every browser.

**Non-Goals:**
- Changing the panel's size, the band, or phone behaviour.
- Keeping the first row in view while the owner stays scrolled down; the panel still covers the top of the window there, as today.

## Decisions

**An in-flow spacer that mirrors the band's growth.** Each collection view gets an empty `<div id="panel-room">` right after `#search-boxes`, hidden by a stylesheet rule (views can't carry `style` attributes under the content security policy). When the panel opens and the band is fixed, `preview.js` measures how much the band grew (its height before and after the panel is shown) and gives the spacer that height. Measuring covers both panel heights (350px and 300px) and any later change to the panel's CSS without a second number to keep in step.

Alternative considered: making the desktop band `position: sticky`, so it is in the flow like the phone band. It's mostly CSS, but a stuck band that grows pushes the posters on screen down; Chrome and Firefox hide that with scroll anchoring, Safari has none. The user chose "nothing moves" over that.

Alternative considered: growing `body`'s top padding instead of a spacer element. It works the same, but the padding already holds the navbar's 70px, and `slideDown`/`slideUp` animate an element's own height, so a spacer reuses them as they are.

**At the top it slides, scrolled down it jumps with a matching scroll.** On opening: if `window.scrollY` is 0, the spacer slides open with `slideDown` over the same 300ms, so the grid moves down with the panel. Otherwise the spacer is shown at full height at once, and the page scrolls by however far the content below the spacer actually moved, so nothing on screen moves. Closing mirrors it: at the top the spacer slides shut with the panel; scrolled down it is hidden at once with the same measured scroll (the browser clamps at the top). Measuring, as `holdStill` in `drawer.js` does, matters because Chrome and Firefox's scroll anchoring already holds the visible posters still when the spacer appears above them, and a blind `scrollBy` of the spacer's height on top of that scrolled twice as far (found by the e2e test); Safari has no anchoring, and there the measured movement is the spacer's height.

**The band's position decides, not the window width.** The spacer is only used when `getComputedStyle(band).position` is `fixed`, so the phone and short-window rules in `responsive.css` stay the single place that decides which layout applies.

**A poster open removes the room at once.** `togglePoster` closes the panel before awaiting the details request. If the spacer slid shut there, a fast response could measure the poster mid-slide and glide to the wrong place. So `togglePoster` closes the panel with no duration: the spacer is hidden at once, with the same matching scroll as the scrolled-down case, and the panel goes with it rather than sliding over a grid that has already moved.

## Risks / Trade-offs

- [Resizing across the breakpoint with the panel open leaves the spacer's room on a phone layout, or none on desktop] → It is corrected the next time the panel closes or opens. Turning a phone with search results up is rare, and nothing becomes unreachable.
- [At the top of the page the grid now moves when the panel opens, where it used to stay still] → That's the point of the change: the posters move to where they can be seen. The motion matches the panel's, and is skipped under reduced motion like the panel's.
- [A first-row poster near the top, scrolled down less than the panel's height, moves when the panel closes] → The browser can't scroll above the top, so the clamped scroll leaves the grid nearer the top by the difference. The poster stays visible and nothing is covered.

## Migration Plan

Ship as one PR and release with a `vYYYY.MM.DD.N` tag. To roll back, revert the PR and release again; there is no data or server change.
