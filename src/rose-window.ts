import { hourHand } from "./iron-hands";
import { draw } from "./svg";

// The Work section's scene: a rose window of four panes, one per case, held
// beside the cases as they scroll. The pane of the case being read lights, the
// iron hour hand swings to it, and its records travel inward along threads.

export const reducedMotion = "(prefers-reduced-motion: reduce)";
const paneTones = ["#2b2436", "#3a2d4d", "#4a3a63", "#33293f"];
const numerals = ["I", "II", "III", "IV"];
const glow = (id: string) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="#f0b4dc" stop-opacity=".9"/><stop offset=".28" stop-color="#bb6688" stop-opacity=".4"/><stop offset=".6" stop-color="#4a3a63" stop-opacity=".18"/><stop offset="1" stop-color="#4a3a63" stop-opacity="0"/></radialGradient>`;
// Each window on the page names its gradients and rim arcs with its own
// prefix, so no window borrows another's.
export const roseDefs = (prefix: string) => `<defs>
  ${glow(`${prefix}-glow`)}
  <radialGradient id="${prefix}-pane" cx="0" cy="0" r="200" gradientUnits="userSpaceOnUse"><stop offset=".3" stop-color="#f0b4dc" stop-opacity=".04"/><stop offset=".75" stop-color="#d98fbf" stop-opacity=".3"/><stop offset="1" stop-color="#f0b4dc" stop-opacity=".55"/></radialGradient>
</defs>`;
const defs = roseDefs("rose");

const at = (r: number, a: number) => [r * Math.cos(a), r * Math.sin(a)];
const radians = (degrees: number) => (degrees * Math.PI) / 180;
// A band of a ring between radii r1 and r2, from angle a0 to a1.
function sector(r1: number, r2: number, a0: number, a1: number) {
  const [x0, y0] = at(r1, a0);
  const [x1, y1] = at(r2, a0);
  const [x2, y2] = at(r2, a1);
  const [x3, y3] = at(r1, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0},${y0} L${x1},${y1} A${r2},${r2} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 ${large} 0 ${x0},${y0} Z`;
}

// The 25-hour ring around the panes, as in the hero, with ticks at the heart.
export function ring(parent: Element) {
  const step = (2 * Math.PI) / 25;
  for (let k = 0; k < 25; k++) {
    const a0 = (k - 0.5) * step - Math.PI / 2;
    const a1 = (k + 0.5) * step - Math.PI / 2;
    draw("path", { d: sector(222, 244, a0, a1), fill: paneTones[k % 4], opacity: 0.8, stroke: "#9b8794", "stroke-width": 0.7 }, parent);
    const [dx, dy] = at(250, a0);
    draw(
      "path",
      { d: "M0 -4 L2.4 0 L0 4 L-2.4 0 Z", transform: `translate(${dx} ${dy}) rotate(${(a0 * 180) / Math.PI})`, fill: "#9b8794" },
      parent,
    );
  }
  const [tx, ty] = at(233, -Math.PI / 2);
  draw(
    "text",
    { x: tx, y: ty, "text-anchor": "middle", "dominant-baseline": "central", "font-family": "Shippori Mincho, serif", "font-size": 14, fill: "#f0b4dc" },
    parent,
  ).textContent = "25";
  for (const r of [200, 218, 248, 254]) {
    draw("circle", { r, fill: "none", stroke: "#9b8794", "stroke-width": 0.9, opacity: 0.8 }, parent);
  }
  for (let k = 0; k < 100; k++) {
    const a = (k * Math.PI) / 50;
    const [x0, y0] = at(52, a);
    const [x1, y1] = at(k % 5 ? 56 : 59, a);
    draw("path", { d: `M${x0},${y0} L${x1},${y1}`, stroke: "#9b8794", "stroke-width": 0.7, opacity: 0.7 }, parent);
  }
}

export type Thread = { path: SVGPathElement; dot: SVGCircleElement; offset: number; length: number; progress: number };

// One pane of leaded glass for case q, with its numeral, its records written
// around the rim, and four threads from the rim into the heart. Only the glass
// dims when the pane is unlit; the rim text keeps its own colour. A window
// that turns (the phone prototype) writes every rim clockwise, so the pane
// turned to the top always reads upright.
export function pane(
  parent: Element,
  q: number,
  records: string,
  { clockwise = false, prefix = "rose" }: { clockwise?: boolean; prefix?: string } = {},
) {
  const group = draw("g", { class: "rose-pane" }, parent);
  const glass = draw("g", { class: "rose-glass" }, group);
  const a0 = radians(q * 90 - 90 + 2.5);
  const a1 = radians((q + 1) * 90 - 90 - 2.5);
  const bands = [66, 108, 150, 192];
  for (let b = 0; b < 3; b++) {
    for (let s = 0; s < 3; s++) {
      const s0 = a0 + ((a1 - a0) * s) / 3;
      const s1 = a0 + ((a1 - a0) * (s + 1)) / 3;
      draw("path", { d: sector(bands[b], bands[b + 1], s0, s1), fill: paneTones[(b + s + q) % 4], stroke: "#9b8794", "stroke-width": 1 }, glass);
      // A facet line through each piece, like leaded glass.
      const [fx0, fy0] = at(bands[b], s0 + (s1 - s0) * 0.35);
      const [fx1, fy1] = at(bands[b + 1], s0 + (s1 - s0) * 0.7);
      draw("path", { d: `M${fx0},${fy0} L${fx1},${fy1}`, stroke: "#9b8794", "stroke-width": 0.6, opacity: 0.7 }, glass);
    }
  }
  draw("path", { d: sector(66, 192, a0, a1), fill: `url(#${prefix}-pane)`, class: "rose-lit" }, glass);
  const [nx, ny] = at(171, (a0 + a1) / 2);
  draw("text", { x: nx, y: ny, class: "rose-numeral", "text-anchor": "middle", "dominant-baseline": "central" }, group).textContent =
    numerals[q];
  // The lower panes (II and III) run counter-clockwise so every label reads
  // upright, and sit a little further out so the text clears the glass.
  const low = !clockwise && (q === 1 || q === 2);
  const r = low ? 213 : 208;
  const [x0, y0] = at(r, low ? a1 - radians(1) : a0 + radians(1));
  const [x1, y1] = at(r, low ? a0 + radians(1) : a1 - radians(1));
  const id = `${prefix}-rim-${q}`;
  draw("path", { id, d: `M${x0},${y0} A${r},${r} 0 0 ${low ? 0 : 1} ${x1},${y1}`, fill: "none" }, group);
  const text = draw("text", { class: "rose-records", dy: low ? 0 : 4 }, group);
  draw("textPath", { href: `#${id}`, startOffset: "50%", "text-anchor": "middle" }, text).textContent = records;
  const lit = draw("g", { class: "rose-lit" }, group);
  const threads: Thread[] = [0, 1, 2, 3].map((i) => {
    const a = a0 + (a1 - a0) * (0.14 + i * 0.24);
    const [sx, sy] = at(192, a);
    const [cx, cy] = at(110, a + (i - 1.5) * 0.14);
    const path = draw("path", { d: `M${sx},${sy} Q${cx},${cy} 0,0`, fill: "none", stroke: "#f0b4dc", "stroke-width": 0.8 }, lit);
    const dot = draw("circle", { r: 2.4, fill: "#ece8f4", class: "rose-record", opacity: 0 }, lit);
    return { path, dot, offset: i * 0.27, length: 0, progress: 0 };
  });
  return { group, threads };
}

// Draws the window into svg and lights the pane of whichever case crosses the
// middle of the viewport, telling onLight its index. Returns a cleanup
// function. The window scales with its viewBox, so a resize needs no redraw.
export function drawRoseWindow(
  svg: SVGSVGElement,
  cases: HTMLElement[],
  records: string[],
  onLight: (index: number) => void,
) {
  const reduce = window.matchMedia(reducedMotion).matches;
  svg.setAttribute("viewBox", "-262 -262 524 524");
  svg.innerHTML = defs;
  ring(draw("g", {}, svg));
  const panes = records.map((text, q) => pane(svg, q, text));
  // The hero's hour hand, pointing up at rest.
  const hand = draw("g", { class: "rose-hand" }, svg);
  hourHand(hand, 150, -90);
  const heart = draw("circle", { r: 60, fill: "url(#rose-glow)" }, svg);
  draw("circle", { r: 7, fill: "#9b8794" }, svg);
  draw("circle", { r: 10, fill: "none", stroke: "#9b8794", "stroke-width": 0.9, opacity: 0.8 }, svg);
  const core = draw("circle", { r: 3.4, fill: "#fff4fb" }, svg);

  let active = -1;
  let pulse = 0;
  function light(index: number) {
    if (index === active) return;
    active = index;
    panes.forEach((p, q) => p.group.classList.toggle("is-lit", q === index));
    hand.style.transform = `rotate(${index * 90 + 45}deg)`;
    onLight(index);
  }
  light(0);
  const reading = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) light(cases.indexOf(entry.target as HTMLElement));
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );
  cases.forEach((item) => reading.observe(item));

  // Each record eases in from the rim; as one arrives the heart swells.
  function tick(now: number) {
    for (const thread of panes[active].threads) {
      if (!thread.length) thread.length = thread.path.getTotalLength();
      const progress = (now / 3200 + thread.offset) % 1;
      if (progress < thread.progress) pulse = 1;
      thread.progress = progress;
      const point = thread.path.getPointAtLength(thread.length * progress * progress);
      thread.dot.setAttribute("cx", point.x.toFixed(2));
      thread.dot.setAttribute("cy", point.y.toFixed(2));
      thread.dot.setAttribute("opacity", Math.min(1, progress * 6, (1 - progress) * 10).toFixed(2));
    }
    pulse *= 0.95;
    heart.setAttribute("r", (58 + pulse * 18 + Math.sin(now / 700) * 4).toFixed(2));
    core.setAttribute("r", (3.4 + pulse * 1.6).toFixed(2));
  }

  // Run only while the window is on screen. Reduced motion keeps the records
  // hidden and still.
  let frame = 0;
  const loop = (now: number) => {
    tick(now);
    frame = requestAnimationFrame(loop);
  };
  const visible = new IntersectionObserver(([entry]) => {
    svg.classList.toggle("is-paused", !entry.isIntersecting);
    if (reduce) return;
    if (entry.isIntersecting && !frame) frame = requestAnimationFrame(loop);
    else if (!entry.isIntersecting) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  visible.observe(svg);

  return () => {
    reading.disconnect();
    visible.disconnect();
    cancelAnimationFrame(frame);
    svg.replaceChildren();
  };
}

// The small still window shown above case q on narrow screens, its own pane
// lit. Returns a cleanup function.
export function drawCaseRose(svg: SVGSVGElement, q: number) {
  svg.setAttribute("viewBox", "-110 -110 220 220");
  const id = `rose-case-glow-${q}`;
  svg.innerHTML = `<defs>${glow(id)}</defs>`;
  for (let k = 0; k < 4; k++) {
    const lit = k === q;
    draw(
      "path",
      {
        d: sector(30, 92, radians(k * 90 - 90 + 4), radians((k + 1) * 90 - 90 - 4)),
        class: lit ? "rose-case-pane is-lit" : "rose-case-pane",
        fill: lit ? "#8a5f95" : paneTones[k % 4],
        stroke: lit ? "#f0b4dc" : "#9b8794",
        "stroke-width": 1.4,
        opacity: lit ? 1 : 0.55,
      },
      svg,
    );
  }
  for (const r of [100, 26]) draw("circle", { r, fill: "none", stroke: "#9b8794", "stroke-width": 1.4 }, svg);
  draw("circle", { r: 26, fill: `url(#${id})` }, svg);
  draw("circle", { r: 4, fill: "#fff4fb" }, svg);
  return () => svg.replaceChildren();
}
