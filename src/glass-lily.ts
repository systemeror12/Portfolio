import { add, cross, deg, mul, seeded, smooth, sub, type Vec } from "./space";
import { draw } from "./svg";

// True lilies of glass, after the line-drawing reference: six tepals that
// leave a narrow throat, broaden, and roll back at their tips, round six
// stamens and a pistil. Beside them, sprigs of closed buds and narrow leaves.
// A scene that draws them includes lilyDefs.

export type LilyTint = {
  petal: string;
  petalIn: string;
  back: string;
  edge: string;
  edgeOpacity: number;
  vein: string;
  dust: string;
  glow: string;
  anther: string;
};

export const lilyDefs = `
  <radialGradient id="lily-glass" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="100"><stop offset="0" stop-color="#8d93bd"/><stop offset=".32" stop-color="#535b7e"/><stop offset=".72" stop-color="#394060"/><stop offset="1" stop-color="#2a2f48"/></radialGradient>
  <radialGradient id="lily-glass-in" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="100"><stop offset="0" stop-color="#aeb2da"/><stop offset=".5" stop-color="#6a7296"/><stop offset="1" stop-color="#454c6c"/></radialGradient>
  <radialGradient id="lily-glass-glow"><stop offset="0" stop-color="#f2f3ff" stop-opacity=".5"/><stop offset=".4" stop-color="#b9bde6" stop-opacity=".25"/><stop offset="1" stop-color="#b9bde6" stop-opacity="0"/></radialGradient>
  <radialGradient id="lily-rose" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="100"><stop offset="0" stop-color="#f6c6e4"/><stop offset=".32" stop-color="#bb6688"/><stop offset=".72" stop-color="#7a4870"/><stop offset="1" stop-color="#3a2440"/></radialGradient>
  <radialGradient id="lily-rose-in" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="100"><stop offset="0" stop-color="#ffe3f3"/><stop offset=".5" stop-color="#d68ab8"/><stop offset="1" stop-color="#8e4f7c"/></radialGradient>
  <radialGradient id="lily-rose-glow"><stop offset="0" stop-color="#fff4fb" stop-opacity=".6"/><stop offset=".4" stop-color="#f0b4dc" stop-opacity=".28"/><stop offset="1" stop-color="#f0b4dc" stop-opacity="0"/></radialGradient>`;

// The shipped lily's blue glass, and rose glass in Kanade's colour.
export const lilyGlass: LilyTint = {
  petal: "url(#lily-glass)",
  petalIn: "url(#lily-glass-in)",
  back: "#20253b",
  edge: "#b9bedd",
  edgeOpacity: 0.75,
  vein: "#cdd1ee",
  dust: "#eef0ff",
  glow: "url(#lily-glass-glow)",
  anther: "#f0b4dc",
};
export const lilyRose: LilyTint = {
  petal: "url(#lily-rose)",
  petalIn: "url(#lily-rose-in)",
  back: "#3a2440",
  edge: "#ffd2ec",
  edgeOpacity: 0.85,
  vein: "#ffe2f3",
  dust: "#fff4fb",
  glow: "url(#lily-rose-glow)",
  anther: "#fff4fb",
};

type Item = { z: number; paint: () => void };
type Row = { c: Vec; a: Vec; b: Vec; facing: number };
const flat = (points: Vec[]) => "M" + points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L");
const between = (a: Vec, b: Vec, u: number): Vec => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];

// A lily built in space and turned (spin about its own axis, then pitch to
// look up, then yaw to look right), its inner and outer faces drawn in depth
// order. Each tepal is a band, so where it rolls over, its back shows. Drawn
// 100 units long and scaled to size. sway lets it turn in the air; twinkle is
// the share of its starlight that twinkles.
export function lily3d(
  parent: Element,
  x: number,
  y: number,
  size: number,
  { pitch = 0, yaw = 0, spin = 0, seed = 1, tint = lilyGlass, opacity = 0.9, glitter = 34, twinkle = 0, sway = false } = {},
) {
  const random = seeded(seed);
  let group = draw("g", { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(size / 100).toFixed(3)})`, opacity }, parent);
  if (sway) {
    group = draw("g", { class: "lily-sway" }, group);
    group.style.animationDelay = `${(-seed * 1.7) % 11}s`;
  }
  const [cp, sp, cy, sy] = [Math.cos(pitch * deg), Math.sin(pitch * deg), Math.cos(yaw * deg), Math.sin(yaw * deg)];
  const view = ([px, py, pz]: Vec): Vec => {
    const [y1, z1] = [py * cp + pz * sp, -py * sp + pz * cp];
    return [px * cy - z1 * sy, y1, px * sy + z1 * cy];
  };
  const axis: Vec = [0, 0, -1];
  const edge = {
    stroke: tint.edge,
    "stroke-width": 1,
    "stroke-opacity": tint.edgeOpacity,
    "stroke-linejoin": "round",
    "vector-effect": "non-scaling-stroke",
  };
  const line = { fill: "none", stroke: tint.vein, "vector-effect": "non-scaling-stroke", "stroke-linecap": "round" };
  const items: Item[] = [];
  const tepals: Row[][] = [];
  for (let k = 0; k < 6; k++) {
    const outer = k % 2 === 0;
    const phi = (spin + k * 60 + (random() - 0.5) * 12) * deg;
    const radial: Vec = [Math.cos(phi), Math.sin(phi), 0];
    const across = cross(axis, radial);
    const reach = (outer ? 100 : 92) * (0.92 + random() * 0.12);
    const broad = (outer ? 24 : 32) * (0.9 + random() * 0.18);
    const flare = 60 + random() * 16;
    const recurve = (outer ? 152 : 132) + random() * 22;
    const steps = 18;
    let p = mul(radial, 3);
    const rows: Row[] = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const alpha = (14 + (flare - 14) * smooth(0, 0.5, u) + (recurve - flare) * smooth(0.45, 1, u) ** 1.4) * deg;
      const t = add(mul(axis, Math.cos(alpha)), mul(radial, Math.sin(alpha)));
      if (i) p = add(p, mul(t, reach / steps));
      const w = broad * Math.sin(Math.PI * u ** 0.72) ** 0.85 * (outer ? 1 : 1 + 0.05 * Math.sin(u * 19));
      const inner = cross(t, across);
      const lift = mul(inner, w * 0.16);
      rows.push({
        c: view(p),
        a: view(add(add(p, mul(across, w / 2)), lift)),
        b: view(add(sub(p, mul(across, w / 2)), lift)),
        facing: view(inner)[2],
      });
    }
    tepals.push(rows);
    // Runs of the tepal that show the same face.
    let start = 0;
    for (let i = 1; i <= steps; i++) {
      const shows = rows[i - 1].facing + rows[i].facing < 0;
      const next = i < steps ? rows[i].facing + rows[i + 1].facing < 0 : !shows;
      if (next === shows && i < steps) continue;
      const run = rows.slice(start, i + 1);
      start = i;
      items.push({
        z: run.reduce((sum, r) => sum + r.c[2], 0) / run.length,
        paint() {
          const outline = flat([...run.map((r) => r.a), ...run.map((r) => r.b).reverse()]) + "Z";
          draw("path", { d: outline, fill: shows ? (outer ? tint.petal : tint.petalIn) : tint.back, ...edge }, group);
          if (shows) {
            draw("path", { d: flat([...run.map((r) => r.c), ...run.map((r) => r.b).reverse()]) + "Z", fill: "#12142a", opacity: 0.28 }, group);
            draw("path", { d: flat(run.map((r) => r.c)), ...line, "stroke-width": 0.7, opacity: 0.42 }, group);
            for (const side of ["a", "b"] as const) {
              draw("path", { d: flat(run.map((r) => between(r.c, r[side], 0.55))), ...line, "stroke-width": 0.5, opacity: 0.18 }, group);
            }
          } else {
            draw("path", { d: flat(run.map((r) => r.c)), ...line, "stroke-width": 0.6, opacity: 0.22 }, group);
          }
        },
      });
    }
  }
  // The throat's glow, then six stamens and the pistil.
  items.push({ z: 2, paint: () => draw("circle", { r: 26, fill: tint.glow, opacity: 0.8 }, group) });
  for (let k = 0; k <= 6; k++) {
    const pistil = k === 6;
    const phi = (spin + 30 + k * 60 + (random() - 0.5) * 16) * deg;
    const radial: Vec = [Math.cos(phi), Math.sin(phi), 0];
    const reach = pistil ? 70 : 56 + random() * 12;
    const points: Vec[] = [];
    let p: Vec = [0, 0, 0];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const alpha = (pistil ? 4 + 6 * u : 8 + 28 * u ** 1.5) * deg;
      const t = add(mul(axis, Math.cos(alpha)), mul(radial, Math.sin(alpha)));
      if (i) p = add(p, mul(t, reach / 8));
      points.push(view(p));
    }
    const tip = points.at(-1)!;
    const [ax, ay] = view(cross(axis, radial));
    items.push({
      z: tip[2] * 0.85,
      paint() {
        draw("path", { d: flat(points), ...line, "stroke-width": pistil ? 1.1 : 0.9, opacity: 0.78 }, group);
        if (pistil) {
          draw("circle", { cx: tip[0].toFixed(1), cy: tip[1].toFixed(1), r: 2.6, fill: "#fff4fb", opacity: 0.85 }, group);
        } else {
          draw(
            "path",
            {
              d: `M${(tip[0] - ax * 2.6).toFixed(1)},${(tip[1] - ay * 2.6).toFixed(1)} L${(tip[0] + ax * 2.6).toFixed(1)},${(tip[1] + ay * 2.6).toFixed(1)}`,
              stroke: tint.anther,
              "stroke-width": 2,
              "stroke-linecap": "round",
              "vector-effect": "non-scaling-stroke",
              opacity: 0.9,
            },
            group,
          );
        }
      },
    });
  }
  items.sort((a, b) => b.z - a.z).forEach((item) => item.paint());
  // Starlight caught on the tepals' inner faces.
  for (let i = 0; i < glitter; i++) {
    const rows = tepals[Math.floor(random() * 6)];
    const r = Math.min(rows.length - 2, 2 + Math.floor(random() * (rows.length - 6)));
    const v = 0.2 + random() * 0.6;
    const shine = random();
    if (rows[r].facing + rows[r + 1].facing >= 0) continue;
    const [dx, dy] = between(rows[r].a, rows[r].b, v);
    const spark = draw(
      "circle",
      {
        cx: dx.toFixed(1),
        cy: dy.toFixed(1),
        r: ((shine * 1.1 + 0.35) * (100 / size)).toFixed(2),
        fill: tint.dust,
        opacity: (shine * 0.6 + 0.25).toFixed(2),
      },
      group,
    );
    if (twinkle && i % Math.round(1 / twinkle) === 0) {
      spark.classList.add("twinkle");
      spark.style.animationDelay = `${(-i * 0.73) % 6}s`;
    }
  }
  return group;
}

// A stem of closed buds and narrow leaves, drawn in outline, standing at x, y and leaning by
// angle. Drawn 100 units tall and scaled to size.
export function lilySprig(parent: Element, x: number, y: number, size: number, angle: number, { buds = 2, tint = lilyGlass, opacity = 0.85 } = {}) {
  const g = draw("g", { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle}) scale(${(size / 100).toFixed(3)})`, opacity }, parent);
  const stroke = { fill: "none", stroke: tint.edge, "stroke-width": 1, "vector-effect": "non-scaling-stroke", "stroke-linecap": "round" };
  const leaf = (lx: number, ly: number, length: number, turn: number) => {
    const l = draw("g", { transform: `translate(${lx} ${ly}) rotate(${turn}) scale(${length / 100})` }, g);
    draw("path", { d: "M0,0 C-9,-20 -8,-64 0,-100 C8,-64 9,-20 0,0 Z", ...stroke, "stroke-opacity": 0.5 }, l);
    draw("path", { d: "M0,-4 C1,-40 1,-70 0,-96", ...stroke, "stroke-opacity": 0.28 }, l);
  };
  const bud = (bx: number, by: number, length: number, turn: number) => {
    const b = draw("g", { transform: `translate(${bx} ${by}) rotate(${turn}) scale(${length / 100})` }, g);
    draw("path", { d: "M0,0 C-12,-10 -14,-48 -3,-92 Q0,-102 3,-92 C14,-48 12,-10 0,0 Z", ...stroke, "stroke-opacity": tint.edgeOpacity }, b);
    draw("path", { d: "M-4,-8 C-7,-40 -5,-74 -1,-95 M4,-8 C6,-44 4,-76 1,-95", ...stroke, stroke: tint.vein, "stroke-opacity": 0.32 }, b);
    draw("path", { d: "M-1,-22 C-2,-50 -1,-72 0,-88", ...stroke, stroke: "#eef0ff", "stroke-opacity": 0.3 }, b);
  };
  draw("path", { d: "M0,0 C3,-34 1,-66 6,-100", ...stroke, "stroke-opacity": 0.55, "stroke-width": 1.2 }, g);
  leaf(1, -18, 42, -48);
  leaf(3, -42, 34, 52);
  leaf(4, -76, 26, -38);
  bud(6, -100, 54, 4);
  if (buds > 1) {
    draw("path", { d: "M2,-56 C10,-64 18,-70 26,-80", ...stroke, "stroke-opacity": 0.5 }, g);
    bud(26, -80, 36, 38);
  }
  return g;
}
