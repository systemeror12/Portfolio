import { at, beads, type Box, curl, hang, iron, ironDefs, ironFill, line, petal, star } from "./iron-pieces";
import { draw } from "./svg";

// After hours' iron: the projects hang on chains from a wrought-iron rail, each
// with a crystal charm in front of its corner: a bud for Lingkod HR, still
// taking shape, and an open lotus for the fork. A chain set with iron stars
// sags behind them, and the tools hang from a bar of their own.

const reducedMotion = "(prefers-reduced-motion: reduce)";
const defs = ironDefs;

// Each panel or plaque hangs from whatever is above it: the rail or bar, or
// the panel above when they stack on narrow screens.
function anchor(box: Box, list: Box[], base: number) {
  const above = list.filter((p) => p !== box && p.b <= box.t + 1 && p.r > box.l && p.l < box.r).map((p) => p.b);
  return above.length ? Math.max(...above) : base;
}

// The handrail catching the moonlight, and under it a frieze of wave scrolls
// that rise from either end and curl toward an open heart at the middle.
function rail(parent: Element, width: number, y: number) {
  draw("rect", { class: "after-rail", x: -2, y, width: width + 4, height: 5, rx: 2.5, fill: ironFill, stroke: iron, "stroke-width": 1 }, parent);
  draw("path", { d: `M3,${y + 1.4} H${width - 3}`, stroke: "#cfc8de", "stroke-width": 0.7, opacity: 0.45 }, parent);
  draw("path", { d: `M-2,${y + 2.5}` + curl(-2, y + 2.5, 9, -1, 1), ...line(2) }, parent);
  draw("path", { d: `M${width + 2},${y + 2.5}` + curl(width + 2, y + 2.5, 9, 1, 1), ...line(2) }, parent);
  const n = 2 * Math.max(1, Math.round(width / 184)) + 1;
  const unit = width / n;
  const crest = y + 5.5;
  const foot = y + 31;
  const r = Math.min(8.5, unit * 0.12);
  const mid = (n - 1) / 2;
  for (let i = 0; i < n; i++) {
    if (i === mid) {
      const heart = draw("g", { class: "after-heart", transform: at(width / 2, y + 5) }, parent);
      draw("path", { d: "M0,30 C-15,23 -19,4 -9,2.5 C-3,1.8 0,7 -3.5,10 M0,30 C15,23 19,4 9,2.5 C3,1.8 0,7 3.5,10", ...line(1.5) }, heart);
      draw("path", { d: "M0,11 L4,16.5 L0,24 L-4,16.5 Z", fill: "url(#after-petal)", stroke: "#ffe3f2", "stroke-width": 0.6, "stroke-opacity": 0.7 }, heart);
      continue;
    }
    const dir = i < mid ? 1 : -1;
    const x0 = dir > 0 ? i * unit : (i + 1) * unit;
    const cx = x0 + dir * unit * 0.56;
    const wave = `M${x0.toFixed(1)},${foot} C${(x0 + dir * unit * 0.22).toFixed(1)},${foot} ${(x0 + dir * unit * 0.26).toFixed(1)},${crest} ${cx.toFixed(1)},${crest}`;
    draw("path", { d: wave + curl(cx, crest, r, dir, 1), ...line(1.4) }, parent);
    // Small glass flowers caught in two of the scrolls.
    if (n > 4 && (i === 1 || i === n - 2)) {
      const flower = draw("g", { transform: at(cx + dir * r * 0.25, crest + r * 1.2) }, parent);
      for (let k = 0; k < 5; k++) {
        draw("ellipse", { cy: -3, rx: 1.9, ry: 3.4, transform: `rotate(${k * 72})`, fill: "#a599d8", opacity: 0.85 }, flower);
      }
      draw("circle", { r: 1.3, fill: "#f0b4dc" }, flower);
    }
  }
}

// The chain of iron stars sags behind the panels. Its lowest point stays above
// the foot of the first panel, so it never runs behind text.
function sag(parent: Element, width: number, first: Box, second: Box) {
  const y0 = Math.min(first.t, second.t) - 40;
  const y2 = first.t + first.h * 0.3;
  const low = first.b - 40;
  const path = draw("path", { d: `M${width + 90},${y0} Q${width * 0.45},${2 * low - (y0 + y2) / 2} -90,${y2}` }, parent);
  const length = path.getTotalLength();
  const links = draw("g", { class: "after-sag", opacity: 0.38 }, parent);
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

// The bud hangs from its cap, closed, its light coming and going. It hangs over
// the panel's corner, or just above the panel where the status line runs long
// beneath it.
function bud(parent: Element, x: number, top: number, panel: Box, statusRight: number, scale: number, still: boolean) {
  const y = statusRight + 8 > x - 16 * scale ? panel.t - 38 * scale : panel.t + 26;
  beads(parent, x, top, y);
  const flower = draw("g", { transform: `${at(x, y)} scale(${scale})` }, parent);
  draw("circle", { class: still ? "after-bud-glow" : "after-bud-glow after-ember", cy: 20, r: 42, fill: "url(#after-glow)" }, flower);
  const crystal = draw("g", { class: "after-bud" }, flower);
  petal(crystal, 154, 1);
  petal(crystal, 206, 1);
  petal(crystal, 180, 1.32);
  draw("path", { d: "M-5,1.5 C-4.5,-2.5 4.5,-2.5 5,1.5 Z", fill: iron }, crystal);
}

// The lotus is open, with a crystal drop on two beads beneath it.
function lotus(parent: Element, x: number, top: number, panel: Box, scale: number) {
  const y = panel.t + 40;
  beads(parent, x, top, y - 26 * scale);
  const flower = draw("g", { class: "after-lotus", transform: `${at(x, y)} scale(${scale})` }, parent);
  draw("circle", { r: 48, fill: "url(#after-glow)" }, flower);
  for (let i = 0; i < 8; i++) petal(flower, i * 45 + 22.5, 1);
  for (let i = 0; i < 6; i++) petal(flower, i * 60, 0.62);
  for (let i = 0; i < 3; i++) petal(flower, i * 120 + 30, 0.32);
  draw("circle", { r: 2.4, fill: "#fff4fb" }, flower);
  draw("path", { d: "M0,26 V40", stroke: iron, "stroke-width": 0.8 }, flower);
  for (const cy of [30, 37]) draw("circle", { cy, r: 2, fill: "#f0b4dc" }, flower);
  const drop = draw("g", { transform: "translate(0 40)" }, flower);
  draw("path", { d: "M0,0 L5,8 L2.6,23 L0,27 L-2.6,23 L-5,8 Z", fill: "url(#after-petal)", stroke: "#ffe3f2", "stroke-width": 0.7, "stroke-opacity": 0.7 }, drop);
  draw("path", { d: "M-5,8 H5 M0,0 V27", stroke: "#fff4fb", "stroke-width": 0.5, opacity: 0.5 }, drop);
}

// Draws the iron into back (behind the panels) and front (over them), both
// filling the panels' grid. Returns a cleanup function.
export function drawAfterHoursIron(back: SVGSVGElement, front: SVGSVGElement) {
  const grid = back.parentElement!;
  const section = grid.closest("section")!;
  const lingkod = grid.querySelector<HTMLElement>(".after-lingkod")!;
  const dots = grid.querySelector<HTMLElement>(".after-dots")!;
  const status = lingkod.querySelector(".after-status")!;
  const toolList = grid.querySelector<HTMLElement>(".after-tool-list")!;
  const still = window.matchMedia(reducedMotion).matches;
  let drawn = "";

  // Where an element sits inside the grid, which both drawings share.
  const rel = (element: Element): Box => {
    const g = grid.getBoundingClientRect();
    const r = element.getBoundingClientRect();
    return { l: r.left - g.left, t: r.top - g.top, r: r.right - g.left, b: r.bottom - g.top, w: r.width, h: r.height };
  };
  // Where the status line's text ends, which decides where the bud hangs.
  const statusRight = () => {
    const range = document.createRange();
    range.selectNodeContents(status);
    return range.getBoundingClientRect().right - grid.getBoundingClientRect().left;
  };
  const layout = () => {
    const boxes = [lingkod, dots, toolList, ...toolList.children].map(rel);
    return JSON.stringify([grid.clientWidth, Math.round(statusRight()), boxes.map((box) => [box.l, box.t, box.w, box.h].map(Math.round))]);
  };

  function build() {
    drawn = layout();
    back.innerHTML = defs;
    front.replaceChildren();
    const width = grid.clientWidth;
    const top = 8;
    const panels = [lingkod, dots].map(rel);
    sag(back, width, panels[0], panels[1]);
    rail(front, width, top);
    panels.forEach((panel, k) => {
      const hook = anchor(panel, panels, top + 5);
      hang(front, panel, hook, 6.5);
      // A crystal charm in front of the panel's corner, swaying a little on its beads.
      const x = panel.r - Math.min(70, panel.w * 0.18);
      const scale = panel.w < 420 ? 0.82 : 1;
      const charm = draw(
        "g",
        still
          ? { class: "after-charm" }
          : { class: "after-charm after-sway", style: `transform-origin:${x.toFixed(1)}px ${hook.toFixed(1)}px;animation-delay:${-k * 2.6}s` },
        front,
      );
      if (k === 0) bud(charm, x, hook, panel, statusRight(), scale, still);
      else lotus(charm, x, hook, panel, scale);
    });
    // The tools hang from a bar of their own, apart from the projects.
    const list = rel(toolList);
    const bar = list.t - 40;
    draw("rect", { class: "after-tool-bar", x: list.l + 6, y: bar, width: list.w - 12, height: 3, rx: 1.5, fill: ironFill, stroke: iron, "stroke-width": 1 }, front);
    draw("path", { d: `M${list.l + 6},${bar + 1.5}` + curl(list.l + 6, bar + 1.5, 6, -1, -1), ...line(1.5) }, front);
    draw("path", { d: `M${list.r - 6},${bar + 1.5}` + curl(list.r - 6, bar + 1.5, 6, 1, -1), ...line(1.5) }, front);
    const plaques = [...toolList.children].map(rel);
    for (const plaque of plaques) hang(front, plaque, anchor(plaque, plaques, bar + 3), 5);
  }

  build();

  // Redraw once the panels settle at a new size, or the fonts arrive.
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
  for (const element of [grid, lingkod, dots, toolList]) resize.observe(element);
  document.fonts.ready.then(schedule);

  // The charms sway and the bud glows only while the section is on screen.
  front.classList.add("is-paused");
  const visible = new IntersectionObserver(([entry]) => front.classList.toggle("is-paused", !entry.isIntersecting));
  visible.observe(section);

  return () => {
    live = false;
    resize.disconnect();
    visible.disconnect();
    cancelAnimationFrame(pending);
    back.replaceChildren();
    front.replaceChildren();
    front.classList.remove("is-paused");
  };
}
