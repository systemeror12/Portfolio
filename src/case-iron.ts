import { at, type Box, chain, curl, hang, iron, ironDefs, ironFill, line, petal, star } from "./iron-pieces";
import { draw } from "./svg";

// The full case studies hang on After hours' iron. A wrought-iron chain hangs
// down the case from a scrolled hook above its kind line. A crystal is
// threaded on it where each section joins, and a small glass flower at each
// step of the flow; the records join it on fine wires. The facts and the flow
// hang as iron-glass plaques from brackets off the chain, a chain of iron
// stars sags in behind each of them, and the chain ends in the open crystal
// lotus beside who the system was for. Whatever the reader has passed lights,
// and a glow runs down the chain to the reading line, a little below the middle
// of the screen. Over the last stretch of the page the line sinks to the foot
// of the screen, so the lotus lights when the reader reaches the end.

const reducedMotion = "(prefers-reduced-motion: reduce)";
const readingLine = 0.55;
const narrowScreen = "(max-width: 900px)";

// A crystal threaded on the chain: dark glass until it is read, then rose.
function crystal(parent: Element, x: number, y: number) {
  const group = draw("g", { class: "case-crystal", transform: at(x, y) }, parent);
  draw("circle", { class: "case-glow", r: 22, fill: "url(#after-glow)" }, group);
  const shape = "M0,-10 L5,-3.5 L2.6,8 L0,11 L-2.6,8 L-5,-3.5 Z";
  draw("path", { d: shape, fill: "#2b2436", stroke: iron, "stroke-width": 1 }, group);
  draw("path", { class: "case-crystal-lit", d: shape, fill: "url(#after-petal)", stroke: "#ffe3f2", "stroke-width": 0.7, "stroke-opacity": 0.7 }, group);
  draw("path", { d: "M-5,-3.5 H5 M0,-10 V11", stroke: "#fff4fb", "stroke-width": 0.5, opacity: 0.45 }, group);
  return group;
}

// A small glass flower caught on the chain, as in the After hours frieze, level
// with each step of the flow or each theme of the fork.
function flower(parent: Element, x: number, y: number) {
  const group = draw("g", { class: "case-flower", transform: at(x, y) }, parent);
  draw("circle", { class: "case-glow", r: 16, fill: "url(#after-glow)" }, group);
  for (let k = 0; k < 5; k++) {
    draw("ellipse", { class: "case-flower-petal", cy: -3.6, rx: 2.3, ry: 4, transform: `rotate(${k * 72})` }, group);
  }
  draw("circle", { r: 1.5, fill: "#f0b4dc" }, group);
  return group;
}

// The open lotus at the end of the chain, with a crystal drop on two beads
// beneath it, swaying a little from where it hangs.
function lotus(parent: Element, x: number, y: number, scale: number, still: boolean) {
  const charm = draw(
    "g",
    still
      ? { class: "case-charm" }
      : { class: "case-charm case-sway", style: `transform-origin:${x.toFixed(1)}px ${(y - 60 * scale).toFixed(1)}px` },
    parent,
  );
  const flowerGroup = draw("g", { transform: `${at(x, y)} scale(${scale})` }, charm);
  draw("circle", { class: still ? "case-lotus-glow" : "case-lotus-glow case-ember", r: 54, fill: "url(#after-glow)" }, flowerGroup);
  const crystal = draw("g", { class: "case-lotus" }, flowerGroup);
  for (let i = 0; i < 8; i++) petal(crystal, i * 45 + 22.5, 1);
  for (let i = 0; i < 6; i++) petal(crystal, i * 60, 0.62);
  for (let i = 0; i < 3; i++) petal(crystal, i * 120 + 30, 0.32);
  draw("circle", { r: 2.4, fill: "#fff4fb" }, crystal);
  draw("path", { d: "M0,26 V40", stroke: iron, "stroke-width": 0.8 }, crystal);
  for (const cy of [30, 37]) draw("circle", { cy, r: 2, fill: "#f0b4dc" }, crystal);
  const drop = draw("g", { transform: "translate(0 40)" }, crystal);
  draw("path", { d: "M0,0 L5,8 L2.6,23 L0,27 L-2.6,23 L-5,8 Z", fill: "url(#after-petal)", stroke: "#ffe3f2", "stroke-width": 0.7, "stroke-opacity": 0.7 }, drop);
  draw("path", { d: "M-5,8 H5 M0,0 V27", stroke: "#fff4fb", "stroke-width": 0.5, opacity: 0.5 }, drop);
  return charm;
}

// A bracket off the chain: an arm out to the plaque's far side, ending in a
// scroll, with a brace curling up beneath it from the chain. The plaque hangs
// from the arm on two chains.
function bracket(parent: Element, x: number, plaque: Box) {
  const y = plaque.t - 46;
  const group = draw("g", { class: "case-bracket" }, parent);
  const end = plaque.r - 8;
  draw("path", { d: `M${x + 2},${y + 40} C${x + 6},${y + 18} ${x + 24},${y + 6} ${x + 58},${y + 3.4}`, ...line(1.4) }, group);
  draw("path", { d: `M${x + 2},${y + 40}` + curl(x + 2, y + 40, 4, 1, 1), ...line(1.2) }, group);
  draw("rect", { class: "case-arm", x, y: y - 1.7, width: end - x, height: 3.4, rx: 1.7, fill: ironFill, stroke: iron, "stroke-width": 1 }, group);
  draw("path", { d: `M${end},${y}` + curl(end, y, 6, 1, 1), ...line(1.5) }, group);
  draw("circle", { cx: x, cy: y, r: 4, ...line(1.4), fill: ironFill }, group);
  hang(group, plaque, y + 1.7, 6);
}

// A chain of iron stars sagging in from the right edge of the screen and
// passing behind a plaque, so it never runs behind text.
function sag(parent: Element, x0: number, plaque: Box) {
  const y0 = plaque.t - 90;
  const x1 = plaque.l + plaque.w * 0.6;
  const y1 = plaque.t + 40;
  const path = draw("path", { d: `M${x0},${y0} Q${(x0 + x1) / 2},${plaque.t + 110} ${x1},${y1}` }, parent);
  const length = path.getTotalLength();
  const links = draw("g", { class: "case-sag", opacity: 0.38 }, parent);
  for (let s = 0, i = 0; s < length; s += 6.4, i++) {
    const p = path.getPointAtLength(s);
    const q = path.getPointAtLength(Math.min(length, s + 1));
    const a = Math.atan2(q.y - p.y, q.x - p.x);
    if (i % 10 === 5) star(links, p.x, p.y, 8.5, a);
    else if (i % 2) draw("path", { d: "M-4,0 H4", transform: at(p.x, p.y, (a * 180) / Math.PI), ...line(1.8) }, links);
    else draw("ellipse", { rx: 4.4, ry: 2.3, transform: at(p.x, p.y, (a * 180) / Math.PI), ...line(1.1) }, links);
  }
  path.remove();
}

type Light = { y: number; node: Element; target?: Element };

// Draws the iron into back (behind the case) and front (over it), both filling
// main. Returns a cleanup function.
export function drawCaseIron(back: SVGSVGElement, front: SVGSVGElement, main: HTMLElement) {
  const still = window.matchMedia(reducedMotion).matches;
  const narrow = window.matchMedia(narrowScreen);
  const title = main.querySelector<HTMLElement>(".case-hero h1")!;
  const kind = main.querySelector<HTMLElement>(".case-kind")!;
  const end = main.querySelector<HTMLElement>(".case-end")!;
  const labels = Array.from(main.querySelectorAll<HTMLElement>(".section-label, .case-study-flow figcaption > span"));
  const records = Array.from(main.querySelectorAll<HTMLElement>(".case-records li"));
  const steps = Array.from(
    main.querySelectorAll<HTMLElement>(".case-study-flow .flow-lane > div, .personal-contributions li"),
  );
  const plaques = Array.from(
    main.querySelectorAll<HTMLElement>(".case-hero-meta, .case-study-flow .flow-lane, .personal-contributions ol"),
  );
  const tracked = [title, kind, end, ...labels, ...records, ...steps, ...plaques];

  let lights: Light[] = [];
  let glow: SVGRectElement | null = null;
  let top = 0;
  let bottom = 0;
  let drawn = "";

  const rel = (element: Element): Box => {
    const m = main.getBoundingClientRect();
    const r = element.getBoundingClientRect();
    return { l: r.left - m.left, t: r.top - m.top, r: r.right - m.left, b: r.bottom - m.top, w: r.width, h: r.height };
  };
  const layout = () =>
    JSON.stringify([main.clientWidth, tracked.map((element) => Object.values(rel(element)).slice(0, 2).map(Math.round))]);

  function build() {
    drawn = layout();
    back.replaceChildren();
    front.innerHTML = ironDefs;
    const gap = parseFloat(getComputedStyle(main).getPropertyValue("--gap")) || 80;
    const x = rel(title).l - gap / 2;
    // The kind's crystal sits level with its words, under the numeral on wide
    // screens and beside it on narrow ones.
    const k = rel(kind);
    top = narrow.matches ? k.t + k.h / 2 : k.b - 11;
    const close = rel(end);
    const scale = narrow.matches ? 0.62 : 0.85;
    const lotusY = close.t + 45;
    bottom = lotusY - 26 * scale;

    // The glow runs behind the chain, showing through its links.
    glow = draw("rect", { class: "case-iron-glow", x: x - 1.2, y: top, width: 2.4, height: 0, rx: 1.2, fill: "#f0b4dc" }, front);

    // The hook the chain hangs from, and the chain.
    const hook = top - 36;
    const thread = draw("g", { class: "case-chain" }, front);
    draw("rect", { class: "case-hook", x: x - 18, y: hook - 1.7, width: 36, height: 3.4, rx: 1.7, fill: ironFill, stroke: iron, "stroke-width": 1 }, thread);
    draw("path", { d: `M${x - 18},${hook}` + curl(x - 18, hook, 5, -1, 1), ...line(1.4) }, thread);
    draw("path", { d: `M${x + 18},${hook}` + curl(x + 18, hook, 5, 1, 1), ...line(1.4) }, thread);
    chain(thread, x, hook + 2, bottom);

    // The records join the chain on fine wires, where they sit beside it.
    for (const record of records.map(rel)) {
      if (record.r > x - 12) continue;
      const y = record.t + record.h / 2;
      draw("path", { class: "case-wire", d: `M${record.r + 10},${y} H${x - 3}`, ...line(0.9) }, front);
      draw("circle", { cx: x, cy: y, r: 3.2, ...line(1.1) }, front);
    }

    const margin = window.innerWidth - main.getBoundingClientRect().right;
    for (const plaque of plaques.map(rel)) {
      bracket(front, x, plaque);
      if (!narrow.matches) sag(back, main.clientWidth + margin - 4, plaque);
    }

    lights = [
      { y: top, node: crystal(front, x, top), target: kind },
      ...labels.map((label) => {
        const y = rel(label).t + 11;
        return { y, node: crystal(front, x, y), target: label };
      }),
      ...steps.map((step) => {
        const y = rel(step).t + parseFloat(getComputedStyle(step).paddingTop) + 12;
        return { y, node: flower(front, x, y), target: step };
      }),
      { y: lotusY - 10, node: lotus(front, x, lotusY, scale, still), target: end },
    ];
    follow();
  }

  let frame = 0;
  function follow() {
    frame = 0;
    const left = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    const reading =
      Math.max(window.innerHeight * readingLine, window.innerHeight - left) - main.getBoundingClientRect().top;
    glow?.setAttribute("height", Math.max(0, Math.min(reading, bottom) - top).toFixed(1));
    for (const light of lights) {
      const lit = light.y < reading;
      light.node.classList.toggle("is-lit", lit);
      light.target?.classList.toggle("is-passed", lit);
    }
  }
  // Under reduced motion the lights follow at once, with no animation frames.
  const scroll = () => {
    if (still) follow();
    else if (!frame) frame = requestAnimationFrame(follow);
  };

  build();

  // Redraw once the case settles at a new size, or the fonts arrive.
  let pending = 0;
  let live = true;
  const schedule = () => {
    if (!live || layout() === drawn) return;
    if (still) return build();
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      pending = 0;
      build();
    });
  };
  const resize = new ResizeObserver(schedule);
  resize.observe(main);
  document.fonts.ready.then(schedule);
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("resize", scroll);

  // The lotus sways and glows only while it is on screen.
  front.classList.add("is-paused");
  const visible = new IntersectionObserver(([entry]) => front.classList.toggle("is-paused", !entry.isIntersecting));
  visible.observe(end);

  return () => {
    live = false;
    resize.disconnect();
    visible.disconnect();
    window.removeEventListener("scroll", scroll);
    window.removeEventListener("resize", scroll);
    cancelAnimationFrame(frame);
    cancelAnimationFrame(pending);
    back.replaceChildren();
    front.replaceChildren();
    front.classList.remove("is-paused");
    for (const light of lights) light.target?.classList.remove("is-passed");
  };
}
