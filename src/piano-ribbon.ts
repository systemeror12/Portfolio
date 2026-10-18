import { add, cross, dot, mix3, mul, smooth, span, sub, unit, type Flat, type Vec } from "./space";
import { pin } from "./hero-layers";
import { draw } from "./svg";

// Keyboard ribbons laid like strings in space: each runs through screen points
// at given depths, seen through one camera, so near keys come long and wide
// and far ones short and narrow. A scene builds each ribbon, sorts their keys
// into depths with layRibbons, and paints each depth with paintRuns where it
// belongs among the scene's other layers.

export type Camera = {
  eye: Vec;
  scale: (z: number) => number;
  project: (p: Vec) => Flat;
  unproject: (p: Vec) => Vec;
};
export type Key = {
  quad: Flat[];
  black: Flat[] | null;
  rim: string;
  front: boolean;
  tone: number;
  face: number;
  z: number;
  string: number;
  d: string;
  blacks: [string, string];
  lamps?: SVGGElement;
};
export type Ribbon = { keys: Key[]; line: Flat[] };
type Run = { keys: Key[]; z: number };

// The white keys that have a black key after them, in an octave from C.
const sharps = [1, 1, 0, 1, 1, 1, 0];
const keyFace = [221, 214, 232];
const keyBack = [74, 63, 92];
const poly = (points: Flat[]) => "M" + points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L") + "Z";
// Keys lit face on and near are brightest; turned or far, darker.
const shade = ([r, g, b]: number[], k: number) =>
  `rgb(${Math.round(6 + (r - 6) * k)},${Math.round(6 + (g - 6) * k)},${Math.round(11 + (b - 11) * k)})`;

// A camera looking in from in front of the heart. A point at depth z is
// scaled by F / (F + z), F being 1.1 times the scene's larger side.
export function camera(heart: { x: number; y: number }, width: number, height: number): Camera {
  const { x, y } = heart;
  const F = 1.1 * Math.max(width, height);
  const scale = (z: number) => F / (F + z);
  return {
    eye: [x, y, -F],
    scale,
    project: ([px, py, pz]) => [x + (px - x) * scale(pz), y + (py - y) * scale(pz)],
    // Where a point must sit in space to be seen at sx, sy from depth z.
    unproject: ([sx, sy, z]) => [x + (sx - x) / scale(z), y + (sy - y) / scale(z), z],
  };
}

// A smooth curve through points (centripetal Catmull-Rom), finely sampled.
function spline(points: Vec[], steps = 32) {
  const ends = [sub(mul(points[0], 2), points[1]), ...points, sub(mul(points.at(-1)!, 2), points.at(-2)!)];
  const out: Vec[] = [];
  for (let i = 1; i < ends.length - 2; i++) {
    const [p0, p1, p2, p3] = ends.slice(i - 1, i + 3);
    const d01 = Math.sqrt(span(sub(p1, p0))) || 1e-3;
    const d12 = Math.sqrt(span(sub(p2, p1))) || 1e-3;
    const d23 = Math.sqrt(span(sub(p3, p2))) || 1e-3;
    const m1 = mul(add(sub(mul(sub(p1, p0), 1 / d01), mul(sub(p2, p0), 1 / (d01 + d12))), mul(sub(p2, p1), 1 / d12)), d12);
    const m2 = mul(add(sub(mul(sub(p2, p1), 1 / d12), mul(sub(p3, p1), 1 / (d12 + d23))), mul(sub(p3, p2), 1 / d23)), d12);
    for (let s = 0; s < steps; s++) {
      const u = s / steps;
      const [u2, u3] = [u * u, u * u * u];
      out.push(
        add(add(mul(p1, 2 * u3 - 3 * u2 + 1), mul(m1, u3 - 2 * u2 + u)), add(mul(p2, 3 * u2 - 2 * u3), mul(m2, u3 - u2))),
      );
    }
  }
  out.push(points.at(-1)!);
  return out;
}

// A keyboard ribbon in space. It runs through `through` ([x, y, z]: where it
// crosses the picture, and how deep), its keys spaced evenly in space, not on
// the screen. string numbers it among the scene's ribbons.
export function ribbon3d(cam: Camera, through: Vec[], width: number, string: number): Ribbon {
  const dense = spline(through.map(cam.unproject));
  const length = [0];
  for (let i = 1; i < dense.length; i++) length.push(length[i - 1] + span(sub(dense[i], dense[i - 1])));
  const total = length.at(-1)!;
  const n = Math.max(2, Math.round(total / (width * 0.62)));
  let j = 0;
  const P = Array.from({ length: n + 1 }, (_, i) => {
    const l = (total * i) / n;
    while (j < dense.length - 2 && length[j + 1] < l) j++;
    return mix3(dense[j], dense[j + 1], Math.min(1, Math.max(0, (l - length[j]) / (length[j + 1] - length[j] || 1))));
  });
  // Frames: the width starts across the ribbon in the picture plane and is
  // carried along without spinning, so the ribbon lies flat.
  const T = P.map((_, i) => unit(sub(P[Math.min(n, i + 1)], P[Math.max(0, i - 1)])));
  let across = unit(cross([0, 0, 1], T[0]));
  const frames = P.map((p, i) => {
    if (i) across = unit(sub(across, mul(T[i], dot(across, T[i]))));
    return { p, t: T[i], b: across };
  });
  const m = frames.length - 1;
  const edge = frames.map(({ p, b }) => [add(p, mul(b, width / 2)), sub(p, mul(b, width / 2))]);
  const flat = edge.map(([a, b]) => [cam.project(a), cam.project(b)]);
  // A point s keys along and v of the way across, from the black keys' side.
  const at = (s: number, v: number) => {
    const i = Math.min(m - 1, Math.floor(s));
    const u = s - i;
    return cam.project(mix3(mix3(edge[i][0], edge[i + 1][0], u), mix3(edge[i][1], edge[i + 1][1], u), v));
  };
  const keys: Key[] = [];
  for (let i = 0; i < m; i++) {
    const mid = mix3(frames[i].p, frames[i + 1].p, 0.5);
    const normal = unit(cross(add(frames[i].t, frames[i + 1].t), add(frames[i].b, frames[i + 1].b)));
    const c = dot(normal, unit(sub(mid, cam.eye)));
    // Far keys darken: depth fades as 1.2 - 0.8 * smooth(-400, 1000, z).
    const light = 1.2 - 0.8 * smooth(-400, 1000, mid[2]);
    const tone = Math.round(Math.min(1.25, (0.3 + 0.7 * Math.abs(c)) * light) * 16) / 16;
    const [a0, b0] = flat[i];
    const [a1, b1] = flat[i + 1];
    const quad = [a0, a1, b1, b0];
    keys.push({
      quad,
      black:
        c > 0.22 && sharps[i % 7] && i < m - 1 ? [at(i + 0.68, 0), at(i + 1.32, 0), at(i + 1.32, 0.6), at(i + 0.68, 0.6)] : null,
      rim: `M${a0[0].toFixed(1)},${a0[1].toFixed(1)} L${a1[0].toFixed(1)},${a1[1].toFixed(1)} M${b0[0].toFixed(1)},${b0[1].toFixed(1)} L${b1[0].toFixed(1)},${b1[1].toFixed(1)}`,
      front: c > 0,
      tone,
      face: c > 0 ? tone : 0,
      z: mid[2],
      string,
      d: poly(quad),
      blacks: ["", ""],
    });
  }
  // The parts of the black keys before and after each key that lie on it.
  const cut = (s: number) => poly([at(s, 0), at(s + 0.32, 0), at(s + 0.32, 0.6), at(s, 0.6)]);
  keys.forEach((key, i) => (key.blacks = [keys[i - 1]?.black ? cut(i) : "", key.black ? cut(i + 0.68) : ""]));
  return { keys, line: frames.map(({ p }) => cam.project(p)) };
}

// Sorts every ribbon's keys, in runs of six, into three depths: behind the
// heart (z > 0), just in front of it, and nearest of all (z <= -140). Each
// depth is sorted far to near.
export function layRibbons(ribbons: Ribbon[]) {
  const layers: Record<"back" | "mid" | "near", Run[]> = { back: [], mid: [], near: [] };
  for (const ribbon of ribbons) {
    for (let i = 0; i < ribbon.keys.length; i += 6) {
      const keys = ribbon.keys.slice(i, i + 6);
      const z = keys.reduce((sum, key) => sum + key.z, 0) / keys.length;
      layers[z > 0 ? "back" : z > -140 ? "mid" : "near"].push({ keys, z });
    }
  }
  for (const runs of Object.values(layers)) runs.sort((a, b) => b.z - a.z);
  return layers;
}

// Paints runs far to near: the white keys by tone, the black keys over them,
// and the bronze edges. Each run's lit keys light in lamps, over the keys.
export function paintRuns(group: Element, runs: Run[], lamps: Element) {
  for (const { keys } of runs) {
    const g = draw("g", { "data-string": keys[0].string }, group);
    const fills = new Map<string, string>();
    const black: string[] = [];
    for (const key of keys) {
      const fill = key.front ? shade(keyFace, Math.min(1, key.tone * 0.6)) : shade(keyBack, key.tone);
      fills.set(fill, (fills.get(fill) ?? "") + key.d);
      if (key.black) black.push(poly(key.black));
    }
    for (const [fill, d] of fills) {
      draw("path", { d, fill, stroke: "#06060b", "stroke-width": 0.6, "stroke-opacity": 0.5, "stroke-linejoin": "round" }, g);
    }
    const lit = draw("g", { class: "key-lamps" }, lamps);
    if (black.length) draw("path", { d: black.join(""), fill: "#06060b", opacity: 0.92 }, g);
    draw(
      "path",
      {
        d: keys.map((key) => key.rim).join(""),
        fill: "none",
        stroke: "#9b8794",
        "stroke-width": 0.8,
        opacity: (0.3 + 0.35 * Math.min(1, keys[0].tone)).toFixed(2),
      },
      g,
    );
    // The lamps light only these keys, so pin them to the keys' box (#80).
    const { x, y, width, height } = g.getBBox();
    pin(lit, { l: Math.floor(x - 1), t: Math.floor(y - 1), r: Math.ceil(x + width + 1), b: Math.ceil(y + height + 1) });
    for (const key of keys) key.lamps = lit;
  }
}

// Lights a run of a painted ribbon's keys: the head brightest, the keys
// behind it fading. light(head) moves the run to key head; light(null) puts
// it out.
export function keyLights(keys: Key[], { trail = 9, color = "#f0b4dc" } = {}) {
  // A lamp lies over the keys, so it lights a key's face less the black keys
  // drawn over it (even-odd): its own, and the one before when that one's
  // run paints later in the same layer.
  const lit = keys.map((key, i) => {
    const before = keys[i - 1]?.lamps;
    const covers =
      before === key.lamps ||
      (before?.ownerSVGElement === key.lamps!.ownerSVGElement &&
        key.lamps!.compareDocumentPosition(before!) & Node.DOCUMENT_POSITION_FOLLOWING);
    return key.d + (covers ? key.blacks[0] : "") + key.blacks[1];
  });
  const lamps = Array.from({ length: trail }, () =>
    draw("path", { fill: color, "fill-rule": "evenodd", "fill-opacity": 0 }, keys[0].lamps!),
  );
  let last: number | null = null;
  return (head: number | null) => {
    const i = head === null ? null : Math.floor(head);
    if (i === last) return;
    last = i;
    lamps.forEach((lamp, j) => {
      const key = i === null ? null : keys[i - j];
      if (!key || !key.face) return lamp.setAttribute("fill-opacity", "0");
      if (lamp.parentNode !== key.lamps) key.lamps!.appendChild(lamp);
      lamp.setAttribute("d", lit[i! - j]);
      lamp.setAttribute("fill-opacity", ((1 - j / trail) ** 1.5 * (0.35 + 0.65 * Math.min(1, key.face))).toFixed(2));
    });
  };
}

// Where two ribbons first cross on the screen, at least inset from the edges.
export function crossings(ribbons: Ribbon[], width: number, height: number, inset = 12) {
  const meet = ([x1, y1]: Flat, [x2, y2]: Flat, [x3, y3]: Flat, [x4, y4]: Flat): Flat | null => {
    const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (!d) return null;
    const u = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
    const v = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? [x1 + u * (x2 - x1), y1 + u * (y2 - y1)] : null;
  };
  const spots: Flat[] = [];
  for (let i = 0; i < ribbons.length; i++) {
    for (let j = i + 1; j < ribbons.length; j++) {
      const [a, b] = [ribbons[i].line, ribbons[j].line];
      search: for (let p = 0; p < a.length - 1; p++) {
        for (let q = 0; q < b.length - 1; q++) {
          const hit = meet(a[p], a[p + 1], b[q], b[q + 1]);
          if (!hit) continue;
          if (hit[0] > inset && hit[0] < width - inset && hit[1] > inset && hit[1] < height - inset) spots.push(hit);
          break search;
        }
      }
    }
  }
  return spots;
}
