import type { Point } from "./hero-layout";

// The records flowing into the hero's dial: three five-line staves carrying
// notes and four threads carrying dots, each from the page's edge to the
// heart. Drawn on the clockwork canvas by the hero's loop, so nothing here
// touches the DOM (ADR 0002).

export type RecordsLayout = { width: number; height: number; heart: Point; mobile: boolean; reduce: boolean };
type Curve = [number[], number[]];
type Mark = { x: number; y: number; s: number; opacity: number };
type Thread = {
  x: number;
  y: number;
  seed: number;
  speed: number;
  offset: number;
  staff: boolean;
  lines: Point[][];
  marks: Mark[];
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

const tilt = (-22 * Math.PI) / 180;
const ink = (opacity: number) => `rgba(236,232,244,${opacity})`;

// Lays out the records for layout. Returns advance, to move them on to now
// (it reports whether one reached the heart), draw, to draw them, and state,
// what they show.
export function heroRecords({ width: W, height: H, heart, mobile, reduce }: RecordsLayout) {
  const start = performance.now();
  const starts = mobile
    ? [[-20, H * 0.05], [-20, H * 0.32], [W * 0.25, -20], [-20, H * 0.55], [W * 0.55, -20], [W + 20, H * 0.42], [W + 20, H * 0.02]]
    : [[-20, H * 0.14], [-20, H * 0.8], [W * 0.3, -20], [-20, H * 0.42], [W * 0.55, H + 20], [W * 0.95, -20], [W + 20, H * 0.85]];
  const threads: Thread[] = starts.map(([x, y], i) => ({
    x,
    y,
    seed: i * 1.7,
    speed: 9000 + ((i * 1931) % 5000),
    offset: (i * 0.37) % 1,
    staff: i < 3,
    lines: [],
    marks: [],
    progress: [],
  }));
  const spacing = mobile ? 3.6 : 4.6;
  const curves = new Map<Thread, Curve>();

  // The curve a record follows at t seconds, swaying a little about its rest.
  function curve(th: Thread, t: number, sway: number): Curve {
    const dx = heart.x - th.x;
    const dy = heart.y - th.y;
    return [
      [th.x, th.x + dx * 0.35 + Math.sin(t * 0.35 + th.seed) * 22 * sway, th.x + dx * 0.72 + Math.cos(t * 0.25 + th.seed) * 18 * sway, heart.x],
      [th.y, th.y + dy * 0.1 + Math.cos(t * 0.3 + th.seed) * 26 * sway - 40, heart.y - dy * 0.08 + Math.sin(t * 0.4 + th.seed) * 16 * sway, heart.y],
    ];
  }

  function advance(now: number) {
    const t = (now - start) / 1000;
    let arrived = false;
    for (const th of threads) {
      const path = curve(th, t, reduce ? 0 : 1);
      curves.set(th, path);
      if (th.staff) {
        // The staff narrows to a point at the heart.
        const points = Array.from({ length: 41 }, (_, i) => ({ ...along(path, i / 40), f: (1 - i / 40) ** 0.8 }));
        th.lines = [0, 1, 2, 3, 4].map((j) => {
          const o = (j - 2) * spacing;
          return points.map(({ x, y, nx, ny, f }) => ({ x: x + nx * o * f, y: y + ny * o * f }));
        });
      }
      if (reduce) continue;
      th.marks = (th.staff ? [0, 1] : [0]).map((k) => {
        const p = (now / th.speed + th.offset + k * 0.5) % 1;
        if (p < (th.progress[k] ?? 0)) arrived = true;
        th.progress[k] = p;
        const e = p * p * (3 - 2 * p);
        const pt = along(path, e);
        const opacity = Number(Math.min(1, p * 6, (1 - p) * 8).toFixed(2));
        if (!th.staff) return { x: pt.x, y: pt.y, s: 1, opacity };
        // Notes ride the staff's outer lines, closing in as it narrows.
        const o = (k ? 1 : -1) * (k + 1) * 0.5 * spacing * (1 - e) ** 0.8;
        return { x: pt.x + pt.nx * o, y: pt.y + pt.ny * o, s: 0.6 + 0.4 * (1 - e), opacity };
      });
    }
    return arrived;
  }

  // The staves fade in from the page's edge and warm to rose at the heart.
  let fade: CanvasGradient | undefined;
  function draw(ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D) {
    if (!fade) {
      fade = ctx.createLinearGradient(0, 0, heart.x, 0);
      fade.addColorStop(0, "rgba(207,200,222,.06)");
      fade.addColorStop(0.6, "rgba(207,200,222,.34)");
      fade.addColorStop(1, "rgba(240,180,220,.7)");
    }
    ctx.lineWidth = 0.8;
    for (const th of threads) {
      ctx.strokeStyle = th.staff || th.x < heart.x ? fade : "rgba(207,200,222,.26)";
      if (th.staff) {
        // Each line on its own, so where they meet at the heart they add up.
        for (const line of th.lines) {
          ctx.beginPath();
          line.forEach(({ x, y }, i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
        }
      } else {
        const [xs, ys] = curves.get(th)!;
        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0]);
        ctx.bezierCurveTo(xs[1], ys[1], xs[2], ys[2], xs[3], ys[3]);
        ctx.stroke();
      }
      for (const { x, y, s, opacity } of th.marks) {
        if (!opacity) continue;
        ctx.fillStyle = ink(opacity);
        ctx.beginPath();
        if (!th.staff) {
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        // A note: its head, an ellipse tilted 22°, and its stem.
        ctx.ellipse(x, y, 4.6 * s, 3.2 * s, tilt, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 1.2 * s;
        ctx.beginPath();
        ctx.moveTo(x + 4 * s, y - s);
        ctx.lineTo(x + 4 * s, y - 17 * s);
        ctx.stroke();
        ctx.lineWidth = 0.8;
      }
    }
  }

  // Each staff and thread: its lines, how many marks it carries, where it
  // ends, and the marks it shows.
  const state = () =>
    threads.map((th) => {
      const [xs, ys] = curves.get(th) ?? curve(th, 0, 0);
      return {
        kind: th.staff ? "staff" : "thread",
        lines: th.staff ? 5 : 1,
        carries: th.staff ? 2 : 1,
        end: { x: xs[3], y: ys[3] },
        // Under reduced motion the marks are hidden.
        marks: th.marks.map(({ x, y, opacity }) => ({ x, y, opacity })),
      };
    });

  return { advance, draw, state };
}
