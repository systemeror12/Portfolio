import type { HeroLayout } from "./hero-layout";
import { draw } from "./svg";

// The records flowing into the hero's dial: three five-line staves carrying
// notes and four threads carrying dots, each from the page's edge to the
// heart.

type Curve = [number[], number[]];
type Thread = {
  x: number;
  y: number;
  seed: number;
  speed: number;
  offset: number;
  lines: SVGPathElement[];
  marks: SVGGraphicsElement[];
  progress: number[];
};

const bez = ([p0, p1, p2, p3]: number[], t: number) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};
const dbez = ([p0, p1, p2, p3]: number[], t: number) => {
  const u = 1 - t;
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
};
// The point at t along a curve, and the unit normal there.
const along = ([xs, ys]: Curve, t: number) => {
  const tx = dbez(xs, t);
  const ty = dbez(ys, t);
  const l = Math.hypot(tx, ty) || 1;
  return { x: bez(xs, t), y: bez(ys, t), nx: -ty / l, ny: tx / l };
};

// Draws the records into svg, which already holds the dial at heart. Returns
// advance, to move the records on; it reports whether one reached the heart.
export function drawHeroRecords(svg: SVGSVGElement, layout: HeroLayout) {
  const { width: W, height: H, heart, mobile, reduce } = layout;
  const start = performance.now();
  const group = draw("g", { class: "hero-records" }, svg);

  // The staves fade in from the page's edge and warm to rose at the heart.
  draw(
    "linearGradient",
    { id: "hero-fade", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: heart.x, y2: 0 },
    svg.querySelector("defs") ?? svg,
  ).innerHTML =
    '<stop offset="0" stop-color="#cfc8de" stop-opacity=".06"/><stop offset=".6" stop-color="#cfc8de" stop-opacity=".34"/><stop offset="1" stop-color="#f0b4dc" stop-opacity=".7"/>';

  // The staves and threads, each from the page's edge to the heart.
  const starts = mobile
    ? [[-20, H * 0.05], [-20, H * 0.32], [W * 0.25, -20], [-20, H * 0.55], [W * 0.55, -20], [W + 20, H * 0.42], [W + 20, H * 0.02]]
    : [[-20, H * 0.14], [-20, H * 0.8], [W * 0.3, -20], [-20, H * 0.42], [W * 0.55, H + 20], [W * 0.95, -20], [W + 20, H * 0.85]];
  const threads: Thread[] = starts.map(([x, y], i) => {
    const staff = i < 3;
    const stroke = staff || x < heart.x ? "url(#hero-fade)" : "rgba(207,200,222,.26)";
    const lines = Array.from({ length: staff ? 5 : 1 }, () =>
      draw("path", { class: staff ? "record-staff" : "record-thread", fill: "none", stroke, "stroke-width": 0.8 }, group),
    );
    const marks: SVGGraphicsElement[] = staff
      ? [0, 1].map(() => {
          // Drawn where it is, frame by frame, rather than moved: a moving
          // transform makes the browser sort the whole hero's layers again.
          const note = draw("g", { class: "record-note" }, group);
          draw("path", { fill: "#ece8f4" }, note);
          draw("path", { stroke: "#ece8f4" }, note);
          return note;
        })
      : [draw("circle", { class: "record-dot", r: 2.2, fill: "#ece8f4" }, group)];
    if (reduce) marks.forEach((mark) => mark.setAttribute("display", "none"));
    return { x, y, seed: i * 1.7, speed: 9000 + ((i * 1931) % 5000), offset: (i * 0.37) % 1, lines, marks, progress: [] };
  });
  const spacing = mobile ? 3.6 : 4.6;

  // The curve a record follows at t seconds, swaying a little about its rest.
  function curve(th: Thread, t: number, sway: number): Curve {
    const dx = heart.x - th.x;
    const dy = heart.y - th.y;
    return [
      [th.x, th.x + dx * 0.35 + Math.sin(t * 0.35 + th.seed) * 22 * sway, th.x + dx * 0.72 + Math.cos(t * 0.25 + th.seed) * 18 * sway, heart.x],
      [th.y, th.y + dy * 0.1 + Math.cos(t * 0.3 + th.seed) * 26 * sway - 40, heart.y - dy * 0.08 + Math.sin(t * 0.4 + th.seed) * 16 * sway, heart.y],
    ];
  }

  // A note at x, y, scaled by s: its head, an ellipse tilted 22°, and its
  // stem, as translate(x y) scale(s) would place them.
  const tilt = (-22 * Math.PI) / 180;
  function note(mark: SVGGraphicsElement, x: number, y: number, s: number) {
    const [head, stem] = mark.children;
    const [rx, ry] = [4.6 * s, 3.2 * s];
    const [dx, dy] = [rx * Math.cos(tilt), rx * Math.sin(tilt)];
    const arc = `A${rx.toFixed(2)},${ry.toFixed(2)} -22 1 0`;
    const [x1, y1, x2, y2] = [x + dx, y + dy, x - dx, y - dy].map((v) => v.toFixed(2));
    head.setAttribute("d", `M${x1},${y1} ${arc} ${x2},${y2} ${arc} ${x1},${y1}Z`);
    stem.setAttribute("d", `M${(x + 4 * s).toFixed(2)},${(y - s).toFixed(2)} V${(y - 17 * s).toFixed(2)}`);
    stem.setAttribute("stroke-width", (1.2 * s).toFixed(2));
  }

  function advance(now: number) {
    const t = (now - start) / 1000;
    let arrived = false;
    for (const th of threads) {
      const path = curve(th, t, reduce ? 0 : 1);
      if (th.lines.length === 1) {
        const [xs, ys] = path;
        th.lines[0].setAttribute("d", `M${xs[0]},${ys[0]} C${xs[1]},${ys[1]} ${xs[2]},${ys[2]} ${xs[3]},${ys[3]}`);
      } else {
        // The staff narrows to a point at the heart.
        const points = Array.from({ length: 41 }, (_, i) => ({ ...along(path, i / 40), f: (1 - i / 40) ** 0.8 }));
        th.lines.forEach((line, j) => {
          const o = (j - 2) * spacing;
          line.setAttribute(
            "d",
            "M" + points.map(({ x, y, nx, ny, f }) => `${(x + nx * o * f).toFixed(1)},${(y + ny * o * f).toFixed(1)}`).join(" L"),
          );
        });
      }
      if (reduce) continue;
      th.marks.forEach((mark, k) => {
        const p = (now / th.speed + th.offset + k * 0.5) % 1;
        if (p < (th.progress[k] ?? 0)) arrived = true;
        th.progress[k] = p;
        const e = p * p * (3 - 2 * p);
        const pt = along(path, e);
        // Fades by fill and stroke, not opacity, for the same reason.
        const opacity = Math.min(1, p * 6, (1 - p) * 8).toFixed(2);
        mark.setAttribute("fill-opacity", opacity);
        if (mark instanceof SVGCircleElement) {
          mark.setAttribute("cx", pt.x.toFixed(1));
          mark.setAttribute("cy", pt.y.toFixed(1));
          return;
        }
        // Notes ride the staff's outer lines, closing in as it narrows.
        const o = (k ? 1 : -1) * (k + 1) * 0.5 * spacing * (1 - e) ** 0.8;
        mark.setAttribute("stroke-opacity", opacity);
        note(mark, pt.x + pt.nx * o, pt.y + pt.ny * o, 0.6 + 0.4 * (1 - e));
      });
    }
    return arrived;
  }

  return { advance };
}
