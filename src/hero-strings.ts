import { away, copyFrame, hideOnCopy, textLines, type HeroLayout } from "./hero-layout";
import { glint } from "./hero-sky";
import type { Box } from "./hero-layers";
import type { LampRibbon } from "./hero-loop";
import { camera, crossings, lampOutlines, layRibbons, paintRuns, ribbon3d } from "./piano-ribbon";
import { deg, type Flat, type Vec } from "./space";
import { draw } from "./svg";

// The hero's strings: keyboard ribbons laid nearly straight and flat in space,
// seen from in front of the dial's heart. On desktop two cross in an X just
// past the end of the heading's first line: one comes toward us past the
// ends of the lede's lines and bends gently to the bottom, the other runs on
// straight and skirts the dial's left rim. A low one runs straight in from
// the left edge under the buttons, and a high one rises over the copy to the
// top right corner, going further off as it goes. On phones three run above
// the copy. Tablets have their own four, below.

type Route = { through: Vec[]; width: number };

// Placed from the copy's edges and the dial, not the page width, so the
// strings hold from 1280 to 1920.
function routes(layout: HeroLayout): Route[] {
  const { width: W, height: H, heart, radius: R, mobile, hero } = layout;
  if (layout.tablet) return tabletRoutes(layout);
  if (mobile) {
    return [
      { through: [[0.42 * W, -24, 760], [0.7 * W, 150, 380], [W + 30, 330, -40]], width: 15 },
      { through: [[W + 24, 230, -20], [-24, 330, -110]], width: 15 },
      { through: [[-20, 250, 420], [0.34 * W, -20, 560]], width: 11 },
    ];
  }
  const { left, name, head, lede, actions } = copyFrame(hero);
  const x: Flat = [head.r + 28, head.t + 0.45 * (head.b - head.t)];
  const top = -0.03 * H;
  // The point on the line from p, at height y, leaning dx per unit down.
  const toward = ([px, py]: Flat, y: number, dx: number): Flat => [px + dx * (y - py), y];
  const rim: Flat = [heart.x - 0.97 * R, heart.y + 0.28 * R];
  const bend: Flat = [actions.r + 70, actions.b + 145];
  const under: Flat = [left + 0.4 * (actions.r - left), actions.b + 45];
  const fall = 0.53;
  const over: Flat = [left, name.t - Math.min(107, 0.45 * name.t)];
  const corner: Flat = [1.01 * W, -0.01 * H];
  const rise = (corner[1] - over[1]) / (corner[0] - over[0]);
  return [
    // The X: one from the open sky, coming toward us...
    {
      through: [
        [...toward(x, top, -0.3), 900],
        [...x, 200],
        [lede.r + 30, lede.t + 10, 40],
        [lede.r - 110, actions.b - 15, -80],
        [...bend, -200],
        [...toward(bend, Math.max(1.04 * H, bend[1] + 60), -1.1), -300],
      ],
      width: 20,
    },
    // ...and one that runs on straight through it and skirts the dial.
    {
      through: [
        [...toward(x, top, (rim[0] - x[0]) / (rim[1] - x[1])), 700],
        [...x, 450],
        [...rim, 220],
        [heart.x - 0.42 * R, heart.y + 1.6 * R, -120],
      ],
      width: 18,
    },
    // Low and straight from the left edge, under the buttons.
    {
      through: [
        [-0.01 * W, under[1] - fall * (under[0] + 0.01 * W), -100],
        [...under, -190],
        [under[0] + (1.04 * H - under[1]) / fall, 1.04 * H, -300],
      ],
      width: 22,
    },
    // High over the copy, straight to the top right corner.
    {
      through: [
        [-0.01 * W, over[1] - rise * (over[0] + 0.01 * W), 150],
        [...over, 200],
        [...corner, 500],
      ],
      width: 18,
    },
  ];
}

// On a tablet, with the dial below the copy. Two strings are shared by
// portrait and landscape: a low one straight from the left edge under the
// buttons to the foot, and one straight from the right edge to the foot past
// the dial's lower right, touching a circle 1.12R round the heart 28° below
// its right. The other two cross in an X.
function tabletRoutes({ width: W, height: H, heart, radius: R, hero }: HeroLayout): Route[] {
  const { x: hx, y: hy } = heart;
  const f = copyFrame(hero);
  const top = -0.03 * H;
  const low: Route = { through: [[-0.01 * W, f.actions.b + 60, -100], [Math.max(0.12 * W, hx - 1.35 * R), 1.04 * H, -300]], width: 22 };
  const slope = Math.tan(28 * deg); // across, per unit down
  const touch: Flat = [hx + 1.12 * R * Math.cos(28 * deg), hy + 1.12 * R * Math.sin(28 * deg)];
  const round: Route = {
    through: [
      [W + 30, touch[1] - (W + 30 - touch[0]) / slope, 60],
      [touch[0] - slope * (H + 30 - touch[1]), H + 30, 60],
    ],
    width: 18,
  };
  if (H < W) {
    // Landscape: the X crosses above the dial. One arm runs from the top,
    // just over the end of the heading's first line, to the right edge above
    // the dial; the other runs straight up from the foot, 45px right of the
    // buttons, past the dial's upper left 1.12R from the heart, to the top
    // edge. Where that comes within 40px of the copy, it leans toward the
    // dial until it clears, and runs behind the dial's rim.
    const over: Flat = [f.head.r, f.head.t - 16];
    const text = textLines(hero, 0);
    const foot: Flat = [f.actions.r + 45, H + 20];
    const arm = (a: number) => {
      const point = (s: number): Flat => [foot[0] + Math.cos(a) * s, foot[1] + Math.sin(a) * s];
      const end = Math.min((top - foot[1]) / Math.sin(a), Math.cos(a) > 0 ? (W + 20 - foot[0]) / Math.cos(a) : Infinity);
      const skim = (hx - foot[0]) * Math.cos(a) + (hy - foot[1]) * Math.sin(a);
      const clear = Math.min(
        ...Array.from({ length: 81 }, (_, i) => point((end * i) / 80)).map(([x, y]) => Math.min(...text.map((k) => away(x, y, k)))),
      );
      const through: Vec[] = [[...point(end), 800], [...point(skim), 250], [...foot, -200]];
      return { through, clear };
    };
    const d = Math.hypot(hx - foot[0], hy - foot[1]);
    let a = Math.atan2(hy - foot[1], hx - foot[0]) - Math.asin(Math.min(1, (1.12 * R) / d));
    for (const tangent = a; arm(a).clear < 40 && a < tangent + 30 * deg; ) a += 0.5 * deg;
    return [
      { through: [[over[0] - 1.8 * (over[1] - top), top, 600], [...over, 450], [W + 20, hy - 1.25 * R, 250]], width: 20 },
      { through: arm(a).through, width: 18 },
      low,
      round,
    ];
  }
  // Portrait: the X crosses in the margin past the paragraph's line ends,
  // level with its last lines; it sits further out, and its arms lean
  // further, the wider the margin.
  const margin = W - f.lede.r;
  const x: Flat = [f.lede.r + Math.max(36, 0.47 * (margin - 100)), f.lede.t + 0.65 * (f.lede.b - f.lede.t)];
  const lean = Math.min(1.1, Math.max(0.2, 0.0029 * (margin - 55)));
  // One arm falls from the top through the X to the right edge, leaning a
  // little more below it.
  const exit = x[1] + (W + 20 - x[0]) / (1.2 * lean);
  const fall: Flat = exit < 1.04 * H ? [W + 20, exit] : [x[0] + 1.2 * lean * (1.04 * H - x[1]), 1.04 * H];
  // The other rises to the right edge, and runs down through the X to the
  // left edge, skimming the dial 1.2R above and left of its heart.
  const d = Math.hypot(hx - x[0], hy - x[1]);
  const a = Math.atan2(hy - x[1], hx - x[0]) + Math.asin(Math.min(1, (1.2 * R) / d));
  const along = Math.sqrt(Math.max(0, d * d - 1.44 * R * R));
  const skim: Flat = [x[0] + Math.cos(a) * along, x[1] + Math.sin(a) * along];
  const left = (x[0] + 20) / -Math.cos(a);
  return [
    { through: [[x[0] - lean * (x[1] - top), top, 700], [...x, 300], [...fall, 0]], width: 20 },
    {
      through: [[W + 20, x[1] - 0.9 * (W + 20 - x[0]), 500], [...x, 300], [...skim, 60], [-20, x[1] + Math.sin(a) * left, -120]],
      width: 18,
    },
    low,
    round,
  ];
}

// Builds the strings and sorts their keys into three depths. The scene
// paints each depth where it belongs, naming the band whose lamps light it:
// back behind the dial, mid between the dial and the front lilies, and near
// over everything; then calls finish to glint where they cross. finish
// returns place, to keep the glints off the copy, and what the hero's loop
// needs to play a pink glissando along every string (ADR 0002): each
// ribbon's keys, and each lamps band's box.
export function drawStrings(layout: HeroLayout) {
  const { width, height, heart, mobile, hero } = layout;
  const cam = camera(heart, width, height);
  const ribbons = routes(layout).map(({ through, width }, i) => ribbon3d(cam, through, width, i));
  const layers = layRibbons(ribbons);
  const paint = (parent: Element, band: string, layer: keyof typeof layers) => {
    paintRuns(draw("g", { class: `ribbons-${layer}` }, parent), layers[layer], band);
  };

  function finish(parent: Element) {
    const group = draw("g", { class: "string-glints" }, parent);
    const glints = crossings(ribbons, width, height).map(([x, y], i) => glint(group, x, y, mobile ? 10 : 14, -i * 2.3));
    const lamps: LampRibbon[] = ribbons.map(({ keys }) => {
      const outlines = lampOutlines(keys);
      return { keys: keys.map((key, i) => ({ outline: outlines[i], face: key.face, band: key.band!, run: key.run! })) };
    });
    // Each lamps band reaches as far as the keys it lights.
    const boxes: Record<string, Box> = {};
    for (const key of ribbons.flatMap((ribbon) => ribbon.keys)) {
      const points = [...key.quad, ...(key.black ?? [])];
      const box = boxes[key.band!] ?? { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity };
      for (const [x, y] of points) {
        box.l = Math.min(box.l, x - 2);
        box.t = Math.min(box.t, y - 2);
        box.r = Math.max(box.r, x + 2);
        box.b = Math.max(box.b, y + 2);
      }
      boxes[key.band!] = box;
    }
    return { place: () => hideOnCopy(hero, glints), lamps, boxes };
  }

  return { paint, finish };
}
