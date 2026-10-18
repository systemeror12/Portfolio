import { lilyDefs } from "./glass-lily";
import { tabletDial, type HeroLayout } from "./hero-layout";
import { drawBackLilies, drawFrontLilies } from "./hero-lilies";
import { drawHeroRecords } from "./hero-records";
import { drawGlints, skyDefs } from "./hero-sky";
import { fit, foldOpacity, liftGlints, liftLilies, liftPanes, liftPhases, pin } from "./hero-layers";
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
// The heart's pulse keeps 96% of itself every sixtieth of a second.
const pulseFade = 0.96;
const pulseStep = 1000 / 60;
const paneTones = ["#2b2436", "#3a2d4d", "#4a3a63", "#33293f"];
const defs = `<defs>
  <radialGradient id="hero-glow"><stop offset="0" stop-color="#f0b4dc" stop-opacity=".9"/><stop offset=".25" stop-color="#bb6688" stop-opacity=".42"/><stop offset=".55" stop-color="#4a3a63" stop-opacity=".2"/><stop offset="1" stop-color="#4a3a63" stop-opacity="0"/></radialGradient>
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

// The hands, with the bronze boss on top. Returns the hands for the clock
// to turn.
function clockHands(parent: Element, radius: number, reduce: boolean) {
  const hour = hourHand(parent, radius * 0.56);
  const minute = minuteHand(parent, radius * 0.72);
  // The second hand moves every frame, so it is drawn by its ends rather than
  // turned: a turning transform makes the browser sort every layer of the
  // hero again, every frame (#80).
  const second = draw("g", reduce ? { class: "dial-second-hand", display: "none" } : { class: "dial-second-hand" }, parent);
  draw("path", { stroke: "#f0b4dc", "stroke-width": 0.9, "stroke-opacity": 0.8 }, second);
  // The bronze boss, with a thin ring.
  draw("circle", { class: "dial-boss", r: 7, fill: "#9b8794" }, parent);
  draw("circle", { r: 10, fill: "none", stroke: "#9b8794", "stroke-width": 0.9, opacity: 0.8 }, parent);
  draw("circle", { r: 2.5, fill: "#06060b" }, parent);
  return { hour, minute, second: second.firstElementChild as SVGPathElement };
}

// The scene's depth bands, bottom to top, each drawn into a layer of its own:
// an <svg> in the hero's coordinates, so a change inside one band repaints
// only that band (ADR 0001, Layered scenes; the plans are on #81). On desktop
// and phones the far lilies lie behind the strings and the near lilies among
// them; on a tablet every string runs under every lily, and the mid and near
// strings share a layer. What the animation loop moves has layers of its
// own: the heart (the dial's smoked face and its lily), the clockwork (the
// hands, the records, and the glow), and each depth's lamps over its keys.
// What CSS moves is lifted into layers the compositor moves (hero-layers.ts):
// the far lilies' twinkles, a layer per phase; the dial's glass, a layer per
// pane; the near lilies, a wrapper each with a layer per twinkle; and a layer
// per glint. The glass goes under the rest of the dial rather than over it
// (#81 has it over), as over it would cover each pane's facet and numeral.
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
// lily (bloom) as the loop sets its opacity; the rest repaint.
const still = new Set<Band>(["back-lilies", "back-strings", "heart", "dial", "mid-strings", "sprigs", "near-strings", "front-strings"]);
const lifted = new Set<Band>(["back-twinkles", "shimmer", "near-lilies", "glints"]);
const moved = new Set<Band>([...lifted, "bloom"]);
// How far a layer reaches past what it holds, as lines have width. Bands not
// listed fill the hero.
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

// Draws the scene into container, sized to its parent, as a stack of layers.
// Returns a cleanup function.
export function drawHeroDial(container: HTMLElement) {
  const hero = container.parentElement!;
  const reduce = window.matchMedia(reducedMotion).matches;
  const start = performance.now();
  let width = 0;
  let height = 0;
  let hands: ReturnType<typeof clockHands>;
  let bloom: SVGSVGElement;
  let radius = 0;
  let glowing = "";
  let glow: SVGCircleElement;
  let ring: SVGCircleElement;
  let core: SVGCircleElement;
  let records: ReturnType<typeof drawHeroRecords>;
  let play: (now: number, arrived: boolean) => void;
  let pulse = 0;
  // When the loop last ran a frame; unset until it runs, and while it's paused.
  let last: number | undefined;

  // Sizes a layer to the box l, t, r, b, kept within the hero and to whole
  // pixels, so its drawing lands on the same pixels as in the hero.
  function bound(layer: SVGSVGElement, l: number, t: number, r: number, b: number) {
    [l, t] = [Math.max(0, Math.floor(l)), Math.max(0, Math.floor(t))];
    [r, b] = [Math.max(l, Math.min(width, Math.ceil(r))), Math.max(t, Math.min(height, Math.ceil(b)))];
    fit(layer, { l, t, r, b });
  }

  function build() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const mobile = width < 760;
    const tablet = !mobile && width < 1280;
    let heart = mobile ? { x: width * 0.7, y: 196 } : { x: width * 0.79, y: height * 0.52 };
    radius = mobile ? Math.min(width * 0.36, 150) : Math.min(300, height * 0.36, width * 0.22);
    if (tablet) ({ heart, radius } = tabletDial(hero, width, height));
    const layout: HeroLayout = { width, height, heart, radius, mobile, tablet, reduce, hero };
    // Every layer starts the size of the hero, so the drawing code measures
    // in the hero's coordinates, and is fitted to its contents once drawn.
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
    strings.paint(layers["back-strings"], layers["back-lamps"], "back");
    // The dial over its heart, and the hands, records and glow over both.
    const centre = `translate(${heart.x} ${heart.y})`;
    draw("circle", { class: "dial-face", cx: heart.x, cy: heart.y, r: radius * 1.03, fill: "#06060b", opacity: 0.42 }, layers.heart);
    heartLily(draw("g", { class: "dial-heart", transform: centre }, layers.bloom), radius * 0.0048);
    bloom = layers.bloom;
    glowing = "";
    dial(draw("g", { class: "dial", transform: centre }, layers.dial), radius);
    hands = clockHands(draw("g", { class: "dial-hands", transform: centre }, layers.clockwork), radius, reduce);
    records = drawHeroRecords(layers.clockwork, layout);
    glow = draw("circle", { fill: "url(#hero-glow)", cx: heart.x, cy: heart.y }, layers.clockwork);
    ring = draw("circle", { class: "heart-ring", fill: "none", stroke: "#f0b4dc", cx: heart.x, cy: heart.y }, layers.clockwork);
    core = draw("circle", { fill: "#fff4fb", cx: heart.x, cy: heart.y }, layers.clockwork);
    // Nearer strings among the near lilies, and glints over all.
    const mid = tablet ? "front" : "mid";
    const near = tablet ? "front" : "near";
    strings.paint(layers[`${mid}-strings`], layers[`${mid}-lamps`], "mid");
    drawFrontLilies(layers.sprigs, layout);
    strings.paint(layers[`${near}-strings`], layers[`${near}-lamps`], "near");
    const glints = strings.finish(layers.glints);
    play = glints.play;
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
    tick(start);
    for (const [band, layer] of Object.entries(layers) as [Band, SVGSVGElement][]) {
      if (lifted.has(band)) continue;
      const pad = reach[band];
      if (pad === undefined) bound(layer, 0, 0, width, height);
      else {
        const { x, y, width: w, height: h } = layer.getBBox();
        bound(layer, x - pad, y - pad, x + w + pad, y + h + pad);
      }
    }
    // The second hand is pinned to the round it sweeps (#80).
    const sweep = Math.ceil(radius * 0.76) + 2;
    pin(hands.second.parentElement as unknown as SVGGElement, { l: -sweep, t: -sweep, r: sweep, b: sweep });
  }

  // The dial keeps Manila minutes and seconds; the hour hand stays near 25,
  // creeping one pane an hour, so its heart stays upright. The pulse fades by
  // the time since the last frame, elapsed.
  function tick(now: number, elapsed = 0) {
    const parts = Object.fromEntries(
      manilaTime.formatToParts(new Date()).map((part) => [part.type, Number(part.value)]),
    );
    const millis = reduce ? 0 : (Date.now() % 1000) / 1000;
    // Each hand is written only when it moves, and the second hand by its
    // ends, so a frame changes no transform (#80).
    const turn = (hand: SVGGElement, degrees: number) => {
      const value = `rotate(${degrees.toFixed(2)})`;
      if (hand.getAttribute("transform") !== value) hand.setAttribute("transform", value);
    };
    turn(hands.hour, -90 + (parts.minute / 60) * (360 / 25));
    turn(hands.minute, -90 + ((parts.minute + parts.second / 60) / 60) * 360);
    const a = ((-90 + ((parts.second + millis) / 60) * 360) * Math.PI) / 180;
    const at = (r: number) => `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
    hands.second.setAttribute("d", `M${at(-radius * 0.1)} L${at(radius * 0.76)}`);
    // Each record that reaches the heart pulses it and lights the lily a
    // little, and sets a run playing along the strings. A frame after a pause
    // takes no arrival it didn't see, so the heart doesn't flash as the hero
    // comes back on screen.
    const arrived = records.advance(now);
    pulse *= pulseFade ** (elapsed / pulseStep);
    if (arrived && last !== undefined) pulse = 1;
    if (!reduce) play(now, arrived);
    const breathe = reduce ? 0 : (Math.sin(((now - start) / 1000) * 1.4) + 1) / 2;
    glow.setAttribute("r", String(130 + breathe * 18 + pulse * 30));
    ring.setAttribute("r", String(10 + (1 - pulse) * 30));
    ring.setAttribute("stroke-opacity", (pulse * 0.6).toFixed(2));
    core.setAttribute("r", String(3.2 + pulse * 1.4));
    const lit = (0.85 + pulse * 0.15).toFixed(2);
    if (lit !== glowing) bloom.style.opacity = glowing = lit;
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

  // Run only while the hero is on screen. Reduced motion keeps the time on a
  // timer, without a sweeping second hand.
  let frame = 0;
  const loop = (now: number) => {
    tick(now, last === undefined ? 0 : Math.max(0, now - last));
    last = now;
    frame = requestAnimationFrame(loop);
  };
  const visible = new IntersectionObserver(([entry]) => {
    container.classList.toggle("is-paused", !entry.isIntersecting);
    if (reduce) return;
    if (entry.isIntersecting && !frame) frame = requestAnimationFrame(loop);
    else if (!entry.isIntersecting) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = undefined;
    }
  });
  visible.observe(hero);
  const timer = reduce ? window.setInterval(() => tick(performance.now()), 15_000) : 0;

  return () => {
    live = false;
    resize.disconnect();
    visible.disconnect();
    cancelAnimationFrame(pending);
    cancelAnimationFrame(frame);
    window.clearInterval(timer);
    container.replaceChildren();
  };
}
