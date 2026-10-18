import { lilyDefs } from "./glass-lily";
import { tabletDial, type HeroLayout } from "./hero-layout";
import { drawBackLilies, drawFrontLilies } from "./hero-lilies";
import { drawGlints, skyDefs } from "./hero-sky";
import { fit, foldOpacity, liftGlints, liftLilies, liftPanes, liftPhases, type Box } from "./hero-layers";
import { createLoop, pulseFade, pulseStep, type LoopEvent, type LoopMessage, type LoopState } from "./hero-loop";
import { drawStrings } from "./hero-strings";
import { hourHand, minuteHand } from "./iron-hands";
import { seeded } from "./space";
import { draw } from "./svg";

// The hero's scene: a twenty-five hour dial of stained glass keeping Manila
// time, a glass lily at its heart, and the records flowing into it, under a
// night sky. Keyboard strings cross the scene in space, and a bed of glass
// lilies fills a band round the dial. On a tablet the dial sits below the
// copy, and every string runs under every lily.

const reducedMotion = "(prefers-reduced-motion: reduce)";
const manilaTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Manila",
  minute: "2-digit",
  second: "2-digit",
});
const paneTones = ["#2b2436", "#3a2d4d", "#4a3a63", "#33293f"];
const defs = `<defs>
  ${lilyDefs}${skyDefs}
</defs>`;

const petalPath = "M0,0 C-34,-16 -40,-56 -8,-80 C-2,-85 4,-92 9,-100 C9,-88 31,-64 28,-34 C26,-16 12,-5 0,0 Z";
const petalShade = "M0,0 C-34,-16 -40,-56 -8,-80 C-2,-85 4,-92 9,-100 C2,-70 1,-40 0,0 Z";

// The lily at the dial's heart, in the dial's plum glass and bronze leading:
// two rings of broad pointed petals, a vein down each, glitter gathered at
// the heart. Its seed makes it the same on every load.
function heartLily(parent: Element, scale: number) {
  const random = seeded(5);
  const group = draw("g", { transform: `scale(${scale})` }, parent);
  const line = { fill: "none", stroke: "#9b8794", "vector-effect": "non-scaling-stroke" };
  const ring = (count: number, size: number, fill: string, turn: number, veins: boolean) => {
    for (let i = 0; i < count; i++) {
      const angle = i * (360 / count) + turn + (random() - 0.5) * 12;
      const petal = draw(
        "g",
        { transform: `rotate(${angle.toFixed(1)}) scale(${(size * (0.86 + random() * 0.22)).toFixed(2)})` },
        group,
      );
      draw(
        "path",
        {
          d: petalPath,
          fill,
          stroke: "#9b8794",
          "stroke-width": 1,
          "stroke-opacity": 0.55,
          "vector-effect": "non-scaling-stroke",
        },
        petal,
      );
      // One half of each petal in shadow, folded along its vein.
      draw("path", { d: petalShade, fill: "#12142a", opacity: 0.3 }, petal);
      draw("path", { d: "M0,-5 C1,-40 2,-70 8,-94", ...line, "stroke-width": 0.7, opacity: 0.4 }, petal);
      if (veins) {
        draw(
          "path",
          { d: "M1,-28 C-6,-36 -12,-42 -17,-50 M2,-44 C8,-52 13,-58 16,-64", ...line, "stroke-width": 0.5, opacity: 0.2 },
          petal,
        );
      }
    }
  };
  ring(7, 1, "rgba(74,58,99,.2)", 0, true);
  ring(5, 0.56, "rgba(74,58,99,.3)", 180 / 7, false);
  for (let i = 0; i < 24; i++) {
    const angle = random() * Math.PI * 2;
    const r = 3 + 82 * random() ** 1.7;
    draw(
      "circle",
      {
        cx: (Math.cos(angle) * r).toFixed(1),
        cy: (Math.sin(angle) * r).toFixed(1),
        r: (random() * 1.1 + 0.35).toFixed(2),
        fill: "#cfc8de",
        opacity: (random() * 0.6 + 0.25).toFixed(2),
      },
      group,
    );
  }
  return group;
}

// The dial's panes, numerals, rings, and ticks.
function dial(parent: Element, radius: number) {
  const r1 = radius * 0.79;
  const r2 = radius * 0.95;
  const step = (2 * Math.PI) / 25;
  const up = -Math.PI / 2;
  const at = (r: number, a: number) => [r * Math.cos(a), r * Math.sin(a)];
  for (let k = 0; k < 25; k++) {
    const a0 = (k - 0.5) * step + up;
    const a1 = (k + 0.5) * step + up;
    const [x0, y0] = at(r1, a0);
    const [x1, y1] = at(r2, a0);
    const [x2, y2] = at(r2, a1);
    const [x3, y3] = at(r1, a1);
    // Every fifth pane is violet glass, and 25 burns rose.
    const fill = k === 0 ? "#7a4870" : k % 5 ? paneTones[k % 4] : "#5b4680";
    const pane = draw(
      "path",
      {
        d: `M${x0},${y0} L${x1},${y1} A${r2},${r2} 0 0 1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 0 0 ${x0},${y0} Z`,
        class: k % 3 ? "dial-pane" : "dial-pane glass",
        "data-pane": k,
        fill,
        opacity: 0.78,
        stroke: "#9b8794",
        "stroke-width": 0.8,
      },
      parent,
    );
    if (k % 3 === 0) pane.style.animationDelay = `${-k * 0.6}s`;
    // A facet line through each pane, like leaded glass.
    const [fx0, fy0] = at(r1, a0 + (a1 - a0) * (0.3 + ((k * 37) % 40) / 100));
    const [fx1, fy1] = at(r2, a0 + (a1 - a0) * 0.7);
    draw("path", { d: `M${fx0},${fy0} L${fx1},${fy1}`, stroke: "#9b8794", "stroke-width": 0.5, opacity: 0.6 }, parent);
    // A diamond on the outer ring between panes.
    const [dx, dy] = at(radius, a0);
    draw(
      "path",
      { d: "M0 -5 L3 0 L0 5 L-3 0 Z", transform: `translate(${dx} ${dy}) rotate(${(a0 * 180) / Math.PI})`, fill: "#9b8794" },
      parent,
    );
    // The hour numerals, with 25 at the top.
    const hour = k === 0 ? 25 : k;
    const [tx, ty] = at(radius * 0.87, k * step + up);
    draw(
      "text",
      {
        class: "dial-numeral",
        x: tx,
        y: ty,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-family": "Shippori Mincho, serif",
        "font-size": (radius * (hour === 25 ? 0.05 : 0.034)).toFixed(1),
        fill: hour === 25 ? "#f0b4dc" : "#cfc8de",
        opacity: hour === 25 ? 1 : 0.7,
      },
      parent,
    ).textContent = String(hour);
  }
  [radius, radius * 1.03, r1, radius * 0.7].forEach((r, i) =>
    draw(
      "circle",
      { class: "dial-ring", r, fill: "none", stroke: "#9b8794", "stroke-width": i === 3 ? 0.6 : 1, opacity: i === 3 ? 0.5 : 0.8 },
      parent,
    ),
  );
  for (let k = 0; k < 125; k++) {
    const a = (k * 2 * Math.PI) / 125;
    const [x0, y0] = at(radius * 0.7, a);
    const [x1, y1] = at(radius * (k % 5 ? 0.725 : 0.745), a);
    draw("path", { class: "dial-tick", d: `M${x0},${y0} L${x1},${y1}`, stroke: "#9b8794", "stroke-width": 0.7, opacity: 0.7 }, parent);
  }
}

// The hour and minute hands, for the clock to turn. The second hand and the
// boss over it are drawn by the loop (hero-loop.ts).
function clockHands(parent: Element, radius: number) {
  return { hour: hourHand(parent, radius * 0.56), minute: minuteHand(parent, radius * 0.72) };
}

// The scene's depth bands, bottom to top, each drawn into a layer of its own:
// an <svg> in the hero's coordinates, so a change inside one band repaints
// only that band (ADR 0001, Layered scenes; the plans are on #81). On desktop
// and phones the far lilies lie behind the strings and the near lilies among
// them; on a tablet every string runs under every lily, and the mid and near
// strings share a layer. What the animation loop moves every frame is drawn
// on canvases, in a worker (ADR 0002): the clockwork (the second hand, the
// boss, the records, and the glow) and each depth's lamps over its keys. The
// hour and minute hands turn in a layer of their own, under the clockwork.
// What CSS moves is lifted into layers the compositor moves (hero-layers.ts):
// the far lilies' twinkles, a layer per phase; the dial's glass, a layer per
// pane; the near lilies, a wrapper each with a layer per pace of twinkles;
// and a layer per glint. The glass goes under the rest of the dial rather
// than over it (#81 has it over), as over it would cover each pane's facet
// and numeral.
type Band = (typeof stacks)[keyof typeof stacks][number];
const stacks = {
  desktop: [
    "back-lilies",
    "back-twinkles",
    "back-strings",
    "back-lamps",
    "heart",
    "bloom",
    "shimmer",
    "dial",
    "hands",
    "clockwork",
    "mid-strings",
    "mid-lamps",
    "sprigs",
    "near-lilies",
    "near-strings",
    "near-lamps",
    "glints",
  ],
  tablet: [
    "back-strings",
    "back-lamps",
    "heart",
    "bloom",
    "shimmer",
    "dial",
    "hands",
    "clockwork",
    "front-strings",
    "front-lamps",
    "back-lilies",
    "back-twinkles",
    "sprigs",
    "near-lilies",
    "glints",
  ],
} as const;
// Each layer's kind, as data-layer: nothing in a still layer changes once
// drawn; the compositor moves the lifted layers whole, and fades the heart's
// lily (bloom) when a record arrives; the rest repaint.
const still = new Set<Band>(["back-lilies", "back-strings", "heart", "dial", "mid-strings", "sprigs", "near-strings", "front-strings"]);
const lifted = new Set<Band>(["back-twinkles", "shimmer", "near-lilies", "glints"]);
const moved = new Set<Band>([...lifted, "bloom"]);
const painted = new Set<Band>(["clockwork", "back-lamps", "mid-lamps", "near-lamps", "front-lamps"]);
// How far a layer reaches past what it holds, as lines have width. Bands not
// listed fill the hero, or are sized as they are drawn.
const reach: Partial<Record<Band, number>> = {
  "back-lilies": 4,
  "back-strings": 4,
  heart: 4,
  bloom: 4,
  dial: 4,
  "mid-strings": 4,
  sprigs: 4,
  "near-strings": 4,
  "front-strings": 4,
};
// The heart's lily rests at 0.85 and a pulse lights it to 1, fading as the
// pulse does: sampled every 150 ms for 3 s, by when it is back at rest.
const bloomPulse = Array.from({ length: 21 }, (_, k) => ({
  offset: k / 20,
  opacity: 0.85 + 0.15 * pulseFade ** ((k * 150) / pulseStep),
}));

// Runs the loop in a worker, handing it the canvases, or where a canvas
// can't be handed to a worker, on the main thread. Scripts and tests that
// drive the page's frames themselves set window.heroLoopOnMain. Events go to
// onEvent; state asks the loop what it shows.
function loopHost(onEvent: (event: LoopEvent) => void) {
  const asked = new Map<number, (state: LoopState) => void>();
  let id = 0;
  const receive = (event: LoopEvent) => {
    if (event.type !== "state") return onEvent(event);
    asked.get(event.id)?.(event.state);
    asked.delete(event.id);
  };
  const onMain =
    (window as unknown as { heroLoopOnMain?: boolean }).heroLoopOnMain || !("transferControlToOffscreen" in HTMLCanvasElement.prototype);
  const worker = onMain ? null : new Worker(new URL("./hero-loop.worker.ts", import.meta.url), { type: "module" });
  const loop = onMain ? createLoop(receive) : null;
  if (worker) worker.onmessage = (event: MessageEvent<LoopEvent>) => receive(event.data);
  return {
    inWorker: !onMain,
    // measure-hero.mjs sets window.heroLoopSlowdown to its CPU throttle,
    // which only the main thread feels.
    slowdown: onMain ? 1 : ((window as unknown as { heroLoopSlowdown?: number }).heroLoopSlowdown ?? 1),
    // Hands the loop a canvas: in a worker, the canvas's control.
    canvas: (canvas: HTMLCanvasElement) => (worker ? canvas.transferControlToOffscreen() : canvas),
    send(message: LoopMessage, transfer: Transferable[] = []) {
      if (worker) worker.postMessage(message, transfer);
      else loop!(message);
    },
    state() {
      return new Promise<LoopState>((resolve) => {
        asked.set(++id, resolve);
        this.send({ type: "state", id });
      });
    },
    end() {
      this.send({ type: "stop" });
      worker?.terminate();
    },
  };
}

// Draws the scene into container, sized to its parent, as a stack of layers.
// Returns a cleanup function.
export function drawHeroDial(container: HTMLElement) {
  const hero = container.parentElement!;
  const reduce = window.matchMedia(reducedMotion).matches;
  let width = 0;
  let height = 0;
  let hands: ReturnType<typeof clockHands>;
  let bloom: SVGSVGElement;
  let pulse: Animation | undefined;
  let lamps: HTMLCanvasElement[] = [];
  let visible = false;
  const host = loopHost((event) => {
    if (event.type === "run") for (const canvas of lamps) canvas.style.display = event.on ? "" : "none";
    else {
      // The compositor fades the heart's lily as the pulse fades.
      pulse?.cancel();
      pulse = bloom.animate(bloomPulse, { duration: 3000 });
      if (!visible) pulse.pause();
    }
  });
  // Tests and scripts read what the loop shows from here.
  Object.assign(container, { heroLoop: { state: () => host.state(), inWorker: host.inWorker } });

  // Sizes a layer to the box l, t, r, b, kept within the hero and to whole
  // pixels, so its drawing lands on the same pixels as in the hero. Returns
  // the box.
  function bound(layer: SVGSVGElement | HTMLCanvasElement, l: number, t: number, r: number, b: number): Box {
    [l, t] = [Math.max(0, Math.floor(l)), Math.max(0, Math.floor(t))];
    [r, b] = [Math.max(l, Math.min(width, Math.ceil(r))), Math.max(t, Math.min(height, Math.ceil(b)))];
    fit(layer, { l, t, r, b });
    return { l, t, r, b };
  }

  // A canvas for band, sized to box at the screen's pixel ratio.
  function canvas(band: Band, box: Box) {
    const layer = document.createElement("canvas");
    Object.assign(layer, { className: "hero-layer" });
    Object.assign(layer.dataset, { band, layer: "repaints" });
    layer.setAttribute("aria-hidden", "true");
    const ratio = window.devicePixelRatio;
    const fitted = bound(layer, box.l, box.t, box.r, box.b);
    layer.width = Math.round((fitted.r - fitted.l) * ratio);
    layer.height = Math.round((fitted.b - fitted.t) * ratio);
    return { layer, box: fitted };
  }

  function build() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const mobile = width < 760;
    const tablet = !mobile && width < 1280;
    let heart = mobile ? { x: width * 0.7, y: 196 } : { x: width * 0.79, y: height * 0.52 };
    let radius = mobile ? Math.min(width * 0.36, 150) : Math.min(300, height * 0.36, width * 0.22);
    if (tablet) ({ heart, radius } = tabletDial(hero, width, height));
    const layout: HeroLayout = { width, height, heart, radius, mobile, tablet, reduce, hero };
    // Every layer starts the size of the hero, so the drawing code measures
    // in the hero's coordinates, and is fitted to its contents once drawn.
    // The loop's bands hold a placeholder until their canvases are sized.
    container.replaceChildren();
    const layers = Object.fromEntries(
      stacks[tablet ? "tablet" : "desktop"].map((band) => [
        band,
        draw(
          "svg",
          {
            class: "hero-layer",
            "data-band": band,
            "data-layer": still.has(band) ? "still" : moved.has(band) ? "compositor" : "repaints",
            "aria-hidden": "true",
          },
          container,
        ),
      ]),
    ) as Record<Band, SVGSVGElement>;
    for (const layer of Object.values(layers)) bound(layer, 0, 0, width, height);
    container.firstElementChild!.innerHTML = defs;
    // Far lilies and strings behind the dial, whose face is faintly smoked
    // glass so what runs behind it reads as behind.
    drawBackLilies(layers["back-lilies"], layout);
    const strings = drawStrings(layout);
    strings.paint(layers["back-strings"], "back-lamps", "back");
    // The dial over its heart, and the hands over both.
    const centre = `translate(${heart.x} ${heart.y})`;
    draw("circle", { class: "dial-face", cx: heart.x, cy: heart.y, r: radius * 1.03, fill: "#06060b", opacity: 0.42 }, layers.heart);
    heartLily(draw("g", { class: "dial-heart", transform: centre }, layers.bloom), radius * 0.0048);
    bloom = layers.bloom;
    bloom.style.opacity = "0.85";
    pulse = undefined;
    dial(draw("g", { class: "dial", transform: centre }, layers.dial), radius);
    hands = clockHands(draw("g", { class: "dial-hands", transform: centre }, layers.hands), radius);
    // Nearer strings among the near lilies, and glints over all.
    const mid = tablet ? "front" : "mid";
    const near = tablet ? "front" : "near";
    strings.paint(layers[`${mid}-strings`], `${mid}-lamps`, "mid");
    drawFrontLilies(layers.sprigs, layout);
    strings.paint(layers[`${near}-strings`], `${near}-lamps`, "near");
    const glints = strings.finish(layers.glints);
    const places = [glints.place, drawGlints(layers.glints, layout)];
    // Each part CSS moves takes the place of its band's layer, in a layer of
    // its own; a glint on the copy stays hidden, layer and all.
    const parts: Partial<Record<Band, (HTMLElement | SVGSVGElement)[]>> = {
      "back-twinkles": liftPhases(layers["back-lilies"]),
      shimmer: liftPanes(layers.dial),
      "near-lilies": liftLilies(layers.sprigs),
      glints: liftGlints(layers.glints),
    };
    for (const place of places) place();
    for (const glint of parts.glints!) glint.style.display = glint.querySelector("[display=none]") ? "none" : "";
    for (const [band, elements] of Object.entries(parts) as [Band, (HTMLElement | SVGSVGElement)[]][]) {
      for (const element of elements) element.dataset.band = band;
      layers[band].replaceWith(...elements);
    }
    // A shape's own opacity would make it a paint chunk of its own; what
    // doesn't move draws it in its fill or stroke instead (#80).
    for (const layer of container.querySelectorAll("[data-layer=still], [data-layer=compositor]")) foldOpacity(layer);
    turn();
    for (const [band, layer] of Object.entries(layers) as [Band, SVGSVGElement][]) {
      if (lifted.has(band) || painted.has(band)) continue;
      const pad = reach[band];
      // The hands reach round the dial as they turn.
      if (band === "hands") bound(layer, heart.x - radius * 0.75, heart.y - radius * 0.75, heart.x + radius * 0.75, heart.y + radius * 0.75);
      else if (pad === undefined) bound(layer, 0, 0, width, height);
      else {
        const { x, y, width: w, height: h } = layer.getBBox();
        bound(layer, x - pad, y - pad, x + w + pad, y + h + pad);
      }
    }
    // The loop's canvases take their bands' places: the clockwork fills the
    // hero, and each lamps band reaches as far as its keys. Lamps are hidden
    // until a run plays.
    const clockwork = canvas("clockwork", { l: 0, t: 0, r: width, b: height });
    layers.clockwork.replaceWith(clockwork.layer);
    const bands = (Object.keys(layers) as Band[]).filter((band) => band !== "clockwork" && painted.has(band));
    const lit = bands.map((band) => {
      const made = canvas(band, glints.boxes[band] ?? { l: 0, t: 0, r: 0, b: 0 });
      made.layer.style.display = "none";
      layers[band].replaceWith(made.layer);
      return { band, ...made };
    });
    lamps = lit.map(({ layer }) => layer);
    const handed = [clockwork, ...lit].map(({ layer }) => host.canvas(layer));
    host.send(
      {
        type: "layout",
        layout: { width, height, heart, radius, mobile, reduce, dpr: window.devicePixelRatio, slowdown: host.slowdown },
        clockwork: { canvas: handed[0], box: clockwork.box },
        lamps: lit.map(({ band, box }, i) => ({ band, canvas: handed[i + 1], box })),
        ribbons: glints.lamps,
      },
      host.inWorker ? (handed as OffscreenCanvas[]) : [],
    );
  }

  // The dial keeps Manila minutes and seconds; the hour hand stays near 25,
  // creeping one pane an hour, so its heart stays upright. Each hand is
  // written only when it moves.
  function turn() {
    const parts = Object.fromEntries(
      manilaTime.formatToParts(new Date()).map((part) => [part.type, Number(part.value)]),
    );
    const set = (hand: SVGGElement, degrees: number) => {
      const value = `rotate(${degrees.toFixed(2)})`;
      if (hand.getAttribute("transform") !== value) hand.setAttribute("transform", value);
    };
    set(hands.hour, -90 + (parts.minute / 60) * (360 / 25));
    set(hands.minute, -90 + ((parts.minute + parts.second / 60) / 60) * 360);
  }

  build();
  // The strings and the bed are laid from the copy, so lay them again once
  // its fonts have settled.
  let live = true;
  document.fonts.ready.then(() => live && build());

  // Redraw once the hero settles at a new size.
  let pending = 0;
  const resize = new ResizeObserver(() => {
    if (hero.clientWidth === width && hero.clientHeight === height) return;
    if (reduce) return build();
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      pending = 0;
      build();
    });
  });
  resize.observe(hero);

  // Run only while the hero is on screen: the loop, the hands on the second,
  // and the heart's pulse. Reduced motion keeps the time on a timer, and
  // runs no frames.
  let timer = 0;
  const everySecond = () => {
    turn();
    timer = window.setTimeout(everySecond, 1000 - (Date.now() % 1000));
  };
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    container.classList.toggle("is-paused", !visible);
    if (reduce) return;
    host.send({ type: "visible", on: visible });
    window.clearTimeout(timer);
    if (visible) everySecond();
    // A finished pulse stays finished: playing it again would rewind it.
    if (!visible && pulse?.playState === "running") pulse.pause();
    else if (visible && pulse?.playState === "paused") pulse.play();
  });
  visibility.observe(hero);
  const slow = reduce ? window.setInterval(turn, 15_000) : 0;

  return () => {
    live = false;
    resize.disconnect();
    visibility.disconnect();
    cancelAnimationFrame(pending);
    window.clearTimeout(timer);
    window.clearInterval(slow);
    host.end();
    container.replaceChildren();
  };
}
