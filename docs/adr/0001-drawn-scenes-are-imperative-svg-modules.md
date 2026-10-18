# Drawn scenes are imperative SVG modules mounted by thin components

Status: accepted (#29, resolves D3 of #27), amended (#81, resolves D3 and D4 of #77),
amended by ADR 0002 (#80) for the hero's animation loop

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
draws into an element it is given. React never renders the scene's contents. A
thin component owns that element and runs the scene in an effect. Most scenes
are given one `<svg>`. A layered scene is given one container, and the scene
creates its layers inside it (see Layered scenes).

Shared pieces, such as the iron hands, the staff divider, and the reveal, live
in one file each. Scenes import them from there.

Every scene follows the same lifecycle, and a layered scene applies it to
every layer:

1. **Mount.** The component's effect calls the scene with its element. The
   scene measures the boxes it depends on and draws.
2. **Redraw on resize.** A `ResizeObserver` on the measured element schedules
   one redraw on the next animation frame. The redraw replaces the previous
   drawing, every layer included, so no second copy is left behind.
3. **Pause off-screen.** An `IntersectionObserver` starts the animation loop
   while the scene is on screen and cancels the pending animation frame when it
   leaves. A layered scene marks its container as paused, so every layer's CSS
   animations stop too. Nothing animates off-screen.
4. **Honour reduced motion.** Under `prefers-reduced-motion: reduce`, the scene
   draws a still state, hides moving parts, and runs no animation frames. Any
   time-based update, such as the dial's hands, uses a timer instead.
5. **Clean up.** The scene returns a cleanup function. The effect calls it on
   unmount, and it disconnects every observer, cancels frames and timers, and
   removes what it drew, every layer included.

All scene output is decoration and is `aria-hidden`, every layer included.
Text a reader needs stays in the React markup.

## Layered scenes

In Chromium, any change inside an `<svg>` repaints the whole `<svg>`. The
hero dial was one `<svg>` of over 5,000 nodes, and its moving parts repainted
all of it every frame (#76). A scene this heavy is split into a stack of
layers, each its own `<svg>`, so a change repaints only its own layer.

We considered rastering the still scene once instead, and rejected it: the
moving parts would still need layers of their own between the still ones, and
the browser already keeps a still vector layer's pixels from frame to frame.

A layered scene follows these rules:

1. **Depth order.** Layers keep the scene's depth bands in order. Within a
   band, the moving parts sit above the band's still parts. A part whose move
   would show in the still screenshots gets its own layer at its exact depth.
2. **Moving layers.** A part moved by CSS gets an `<svg>` of its own, and the
   animation runs on that `<svg>` itself (opacity or transform), so the
   compositor moves it without a repaint. Where a moving part holds its own
   moving parts, such as a swaying lily with twinkling glitter, an HTML wrapper
   carries the outer motion and holds the inner `<svg>`s. Parts moved by the
   animation loop go in layers that repaint; in the hero, those layers are
   canvases drawn in a worker (ADR 0002).
3. **Still parts in moving layers.** A small still part next to a moving layer
   may go in that layer, rather than a layer of its own. A large still area
   never goes in a layer that repaints.
4. **Idle layers.** A moving layer with nothing showing, such as the string
   lamps between runs, is hidden, so it holds no GPU memory.
5. **Bounds.** Each layer is sized to its contents, not to the whole scene.
6. **Budget.** A layered scene sets a cap on its layers' total area and their
   count, checked by a browser test. A change that can't fit stops and goes
   back to the decision that set the cap; the cap is never raised in the same
   change.
7. **Per layout.** Each layout keeps its own depth order, so the stack may
   differ between layouts.

The hero's layer plans and its budget are recorded on #81, and in a comment
beside the code that builds the stack.

## Consequences

- The approved drawing code carries over from the prototype almost unchanged.
- React does not re-render on every frame, so scenes cost no more than they did
  in the prototype.
- Scene modules are tested through the browser with Playwright: boxes, frame
  counts, layers, and reduced motion. They are not tested as React components.
- Option (b) would have moved per-frame updates into React state. Option (c)
  could not express the measured layouts or the clock-driven hands.
- A layered scene trades GPU memory and compositor work for paint. Its budget
  caps that trade, and its frame rate is measured on real integrated graphics,
  not in headless software compositing.
