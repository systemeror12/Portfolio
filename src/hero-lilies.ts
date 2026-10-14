import { lily3d, lilyGlass, lilyRose, lilySprig } from "./glass-lily";
import { textLines, type HeroLayout, type Point } from "./hero-layout";
import { deg, seeded, smooth } from "./space";
import { draw } from "./svg";

// The hero's lily bed, in a band drawn round the dial: from the right edge
// level with the top of the dial, round the dial clear of its rim, under it,
// and down to the bottom edge at about 0.36W. On a phone the copy fills the
// foot, so the bed is the corner beyond the dial. Nothing in it crosses the
// dial, and the dial itself is bare.

type Spot = Point & { size: number; dx: number; dy: number; seed: number };
type Tier = { count: number; min: number; max: number; reach: number; overlap: number; ramp?: number };

// The bed, in shares of the dial's radius. Far lilies are small and dim,
// behind the strings; near ones are large, among them, and may tuck under
// their neighbours; sprigs of buds stand between.
const far: Tier = { count: 30, min: 0.15, max: 0.34, reach: 0.8, overlap: 0.42 };
const near: Tier = { count: 20, min: 0.3, max: 0.74, reach: 0.82, overlap: 0.54, ramp: 0.75 };
const sprigs: Tier = { count: 8, min: 0.42, max: 0.66, reach: 0.6, overlap: 0.45 };
// Rose glass, besides one in five of the near lilies: the near lily nearest
// each of these spots, from the heart in radii. The large one at the bed's
// left end, one at the right edge level with the 5, one below it by the 8,
// one under the 10, and the corner.
const roseAt = [
  [-1.57, 1.6],
  [1.39, -0.46],
  [1.3, 0.8],
  [0.62, 1.4],
  [1.33, 1.58],
];

// Is the point inside the outline (ray casting)?
function inside(outline: number[][], x: number, y: number) {
  let hit = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i];
    const [xj, yj] = outline[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function bedOutline({ width: W, height: H, heart, radius: R, mobile }: HeroLayout) {
  if (mobile) return [[0.55 * W, -60], [W + 60, -60], [W + 60, heart.y + 0.4 * R], [heart.x, heart.y]];
  const arc = [];
  for (let a = -58; a <= 124; a += 3) arc.push([heart.x + 1.12 * R * Math.cos(a * deg), heart.y + 1.12 * R * Math.sin(a * deg)]);
  let y = arc.at(-1)![1];
  const tail = [[0.595, 0.85], [0.51, 0.91], [0.41, 0.925]].map(([fx, fy]) => [fx * W, (y = Math.min(H - 4, Math.max(y + 6, fy * H)))]);
  const top = heart.y - 1.15 * R;
  return [[W + 60, top], [heart.x + 0.72 * R, top], ...arc, ...tail, [0.36 * W, H], [0.35 * W, H + 60], [W + 60, H + 60]];
}

// Where a rose lily once sat on the dial's rim, by 9 and 10 (by 10 on
// phones). It is gone, but the bed still keeps clear of its place, as it was
// planted when chosen.
function oldRimLily({ heart, radius: R, mobile }: HeroLayout) {
  const a = ((mobile ? 10 : 9.6) * 14.4 - 90) * deg;
  const r = R * (mobile ? 0.98 : 0.99);
  return { x: heart.x + r * Math.cos(a), y: heart.y + r * Math.sin(a), size: mobile ? 38 : 66 };
}

// Places lilies in the bed, largest first, at random from a fixed seed. None
// crosses the dial or sits on the copy, and none covers another by more than
// overlap allows. They come smaller by the dial, reaching full size ramp
// radii out from it. reach is how far a lily spreads from its centre, as a
// share of its size. Returned top to bottom.
function plant(layout: HeroLayout, { count, min, max, reach, overlap, ramp = 1.1 }: Tier, seed: number, avoid: Spot[] = []) {
  const { width: W, height: H, heart, radius: R } = layout;
  const outline = bedOutline(layout);
  const clear = 1.08 * R;
  const text = textLines(layout.hero, 24);
  const random = seeded(seed);
  const xs = outline.map(([x]) => x);
  const ys = outline.map(([, y]) => y);
  const [x0, x1] = [Math.max(-50, Math.min(...xs)), Math.min(W + 50, Math.max(...xs))];
  const [y0, y1] = [Math.max(-50, Math.min(...ys)), Math.min(H + 50, Math.max(...ys))];
  const placed: { x: number; y: number; size: number }[] = [oldRimLily(layout), ...avoid];
  const spots: Spot[] = [];
  for (const pass of [1, 0.8, 0.64, 0.5, 0.4]) {
    for (let t = 0; t < 2000 && spots.length < count; t++) {
      const x = x0 + random() * (x1 - x0);
      const y = y0 + random() * (y1 - y0);
      const jitter = 0.85 + random() * 0.3;
      if (!inside(outline, x, y)) continue;
      const d = Math.hypot(x - heart.x, y - heart.y);
      const room = smooth(clear, clear + ramp * R, d);
      const size = Math.min((min + (max - min) * room) * R * pass * jitter, (d - clear) / reach);
      const r = reach * size;
      if (size < min * R * 0.7) continue;
      if (text.some((k) => x + r > k.l && x - r < k.r && y + r > k.t && y - r < k.b)) continue;
      if (placed.some((p) => Math.hypot(p.x - x, p.y - y) < (p.size + size) * reach * overlap)) continue;
      const spot = { x, y, size, dx: (x - heart.x) / R, dy: (y - heart.y) / R, seed: 1 + Math.floor(random() * 997) };
      placed.push(spot);
      spots.push(spot);
    }
  }
  return spots.sort((a, b) => a.y - b.y);
}

// How near the dial's heart any of an element's outlines come, in radii.
function nearest({ heart, radius }: HeroLayout, element: Element) {
  let min = Infinity;
  for (const path of element.querySelectorAll("path")) {
    const matrix = path.getCTM()!;
    const total = path.getTotalLength();
    for (let i = 0; i <= 8; i++) {
      const p = path.getPointAtLength((total * i) / 8).matrixTransform(matrix);
      min = Math.min(min, Math.hypot(p.x - heart.x, p.y - heart.y));
    }
  }
  return min / radius;
}

// Draws a lily or sprig rooted at ax, ay, then measures it: if any outline
// comes within 1.06 radii of the heart (the dial's outer ring is at 1.03,
// with room for the sway), it shrinks toward its root until it clears, or is
// left out.
function bloom(layout: HeroLayout, parent: Element, kind: string, ax: number, ay: number, size: number, paint: (at: Element) => void) {
  const wrap = draw("g", { class: `lily lily-${kind}` }, parent);
  paint(wrap);
  if (Math.hypot(ax - layout.heart.x, ay - layout.heart.y) > 1.1 * layout.radius + 1.6 * size) return wrap;
  for (let k = 1, tries = 0; nearest(layout, wrap) < 1.06; tries++) {
    if (tries === 10) return wrap.remove();
    k *= 0.9;
    wrap.setAttribute(
      "transform",
      `translate(${ax.toFixed(1)} ${ay.toFixed(1)}) scale(${k.toFixed(3)}) translate(${(-ax).toFixed(1)} ${(-ay).toFixed(1)})`,
    );
  }
  return wrap;
}

// Every lily turns a little toward the dial's heart, as to a light.
const towardHeart = ({ dx, dy }: Spot, random: () => number) => ({
  pitch: Math.max(-25, Math.min(55, 18 + dy * 22 + (random() - 0.5) * 16)),
  yaw: Math.max(-48, Math.min(48, -dx * 26 + (random() - 0.5) * 20)),
  spin: random() * 60,
});

// Behind the strings: the far lilies and, on phones, a dim lily at the left.
export function drawBackLilies(parent: Element, layout: HeroLayout) {
  const { width: W, heart, radius: R, mobile } = layout;
  const group = draw("g", { class: "lilies-back" }, parent);
  if (mobile) {
    lily3d(draw("g", { class: "lily" }, group), W * 0.02, heart.y + R * 0.64, 54, { pitch: -18, yaw: 40, spin: 30, seed: 53, opacity: 0.6 });
  }
  const random = seeded(71);
  for (const p of plant(layout, { ...far, count: mobile ? 3 : far.count }, 31)) {
    const turn = towardHeart(p, random);
    const opacity = 0.42 + random() * 0.18;
    bloom(layout, group, "far", p.x, p.y, p.size, (at) =>
      lily3d(at, p.x, p.y, p.size, { ...turn, seed: p.seed, opacity, glitter: 10, twinkle: 0.2 }),
    );
  }
}

// Among the strings: the sprigs, the near lilies, which sway, and on phones
// a lily at the foot.
export function drawFrontLilies(parent: Element, layout: HeroLayout) {
  const { width: W, height: H, heart, radius: R, mobile } = layout;
  const group = draw("g", { class: "lilies-front" }, parent);
  const random = seeded(73);
  const lilies = plant(layout, { ...near, count: mobile ? 3 : near.count }, 41);
  for (const p of plant(layout, { ...sprigs, count: mobile ? 1 : sprigs.count }, 37, lilies)) {
    const buds = random() < 0.6 ? 2 : 1;
    const foot = p.y + p.size * 0.5;
    bloom(layout, group, "sprig", p.x, foot, p.size, (at) =>
      lilySprig(at, p.x, foot, p.size, Math.max(-30, Math.min(30, p.dx * 14)), { buds }),
    );
  }
  const rose = new Set(lilies.filter((_, i) => i % 5 === 2));
  for (const [dx, dy] of mobile ? [] : roseAt) {
    const [x, y] = [heart.x + dx * R, heart.y + dy * R];
    const away = (p: Spot) => Math.hypot(p.x - x, p.y - y);
    const best = lilies.filter((p) => !rose.has(p)).sort((a, b) => away(a) - away(b))[0];
    if (best && away(best) < 0.5 * R) rose.add(best);
  }
  for (const p of lilies) {
    const turn = towardHeart(p, random);
    const opacity = 0.86 + random() * 0.1;
    bloom(layout, group, rose.has(p) ? "near lily-rose" : "near", p.x, p.y, p.size, (at) =>
      lily3d(at, p.x, p.y, p.size, {
        ...turn,
        seed: p.seed,
        tint: rose.has(p) ? lilyRose : lilyGlass,
        opacity,
        sway: true,
        twinkle: 0.15,
        glitter: Math.round(12 + p.size / 4),
      }),
    );
  }
  if (mobile) {
    lily3d(draw("g", { class: "lily" }, group), W, H * 0.97, 76, { pitch: 30, yaw: -26, seed: 7, sway: true, twinkle: 0.15 });
  }
}
