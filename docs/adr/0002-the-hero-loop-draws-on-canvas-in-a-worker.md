# The hero's animation loop draws on canvas in a worker

Status: accepted (#80), amends ADR 0001's Layered scenes for the parts the
hero's animation loop moves

## Context

After #80 gave each moving part a layer of its own, the hero met #83's D1 at
1× on the Reference Laptop, but not at 4×. There it ran 34–45 fps against a
target of 50, with the main thread busy for about 970 ms of every second.
That time had two sources. Each frame the loop drew, the browser restyled,
repainted and re-layered what the loop moved in its SVG layers. And because
the loop asked the main thread for a frame 60 times a second, Blink stepped
the hero's CSS animations on that thread too, though the compositor runs
them. With the CSS animations paused, the hero reached 58 fps at 4×; with
the loop's writes stopped, it reached 60. No tuning of the SVG removes
either cost, and the hero only reaches 50 fps if both go.

Options considered:

- (a) the loop draws on canvas, in a Web Worker;
- (b) the loop draws on canvas, on the main thread;
- (c) less motion: shared paces for the glints, fewer for the twinkles, and
  simpler staves;
- (d) merge below the target, with a follow-up.

## Decision

We chose (a). The parts the loop moves every frame are drawn on
`<canvas>` layers, which the scene hands to one Web Worker with
`transferControlToOffscreen`. The worker runs the loop on its own animation
frames, so the main thread draws no frames and the CSS animations run on the
compositor alone.

- **On canvas, in the worker:** the second hand, the records (staves,
  threads, notes and dots), the heart's glow, ring and core, and the string
  lamps. The clockwork band is one canvas, which also draws the boss over the
  second hand. Each lamps band is a canvas of its own.
- **On the main thread:** everything still and everything CSS moves stays in
  SVG layers, as ADR 0001 sets out. The hour and minute hands stay in SVG,
  in a layer under the clockwork canvas, and turn on a one-second timer. The
  heart's lily (bloom) fades with a Web Animation the scene starts when the
  worker reports that a record has arrived, so the compositor runs it.
- **Layer rules:** a canvas is a layer like any other. It keeps its band's
  depth, is sized to its band's bounds, is hidden while idle, and counts
  towards the scene's budget.
- **Lifecycle:** the scene tells the worker when the hero leaves or returns
  to the screen and when the layout is redrawn, and ends the worker in its
  cleanup. Under reduced motion no frames run, as before.
- **Fallback:** where a browser can't hand a canvas to a worker, the same
  drawing code runs on the main thread, on the main thread's animation
  frames.

## Consequences

- The loop's parts are drawn by canvas code rather than SVG, so their edges
  raster a little differently. #82's still screenshots record the change,
  and the Site Owner approves it.
- The loop's drawing code may not touch the DOM: it gets the layout, the
  keys' outlines and the time from the scene in messages.
- Browser tests can no longer read what the loop draws from SVG attributes.
  The loop reports its state, the hands' angles and the pulse among it, and
  the tests read that, and the canvas's pixels.
- (b) would have removed the restyling and repainting, but the main thread
  would still step the CSS animations every frame. (c) changes the look
  #82 decided to keep, and might still fall short at 1920×1080.
