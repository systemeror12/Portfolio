# Drawn scenes are imperative SVG modules mounted by thin components

Status: accepted (#29, resolves D3 of #27)

## Context

The Nocturne prototype draws four scenes in the browser: the hero dial, the
rose window, the After hours ironwork, and the contact window. Each one is
measured against the laid-out page and updated every frame. We had to decide
how these scenes live in the React app.

Options considered:

- (a) each scene is a plain TypeScript module that draws into an `<svg>` it is
  given, mounted by a thin component;
- (b) each scene is rebuilt as JSX, with animation driven by React state;
- (c) each scene is exported as static SVG and animated with CSS only.

## Decision

We chose (a). Each scene is a plain TypeScript module, one file per scene, that
draws into an `<svg>` it is given. React never renders the scene's contents. A
thin component owns the `<svg>` element and runs the scene in an effect.

Shared pieces, such as the iron hands, the staff divider, and the reveal, live
in one file each. Scenes import them from there.

Every scene follows the same lifecycle:

1. **Mount.** The component's effect calls the scene with its `<svg>`. The
   scene measures the boxes it depends on and draws.
2. **Redraw on resize.** A `ResizeObserver` on the measured element schedules
   one redraw on the next animation frame. The redraw replaces the previous
   drawing, so no second copy is left behind.
3. **Pause off-screen.** An `IntersectionObserver` starts the animation loop
   while the scene is on screen and cancels the pending animation frame when it
   leaves. Nothing animates off-screen.
4. **Honour reduced motion.** Under `prefers-reduced-motion: reduce`, the scene
   draws a still state, hides moving parts, and runs no animation frames. Any
   time-based update, such as the dial's hands, uses a timer instead.
5. **Clean up.** The scene returns a cleanup function. The effect calls it on
   unmount, and it disconnects every observer, cancels frames and timers, and
   removes what it drew.

All scene output is decoration and is `aria-hidden`. Text a reader needs stays
in the React markup.

## Consequences

- The approved drawing code carries over from the prototype almost unchanged.
- React does not re-render on every frame, so scenes cost no more than they did
  in the prototype.
- Scene modules are tested through the browser with Playwright: boxes, frame
  counts, and reduced motion. They are not tested as React components.
- Option (b) would have moved per-frame updates into React state. Option (c)
  could not express the measured layouts or the clock-driven hands.
