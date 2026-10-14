import { copyFrame, hideOnCopy, type HeroLayout } from "./hero-layout";
import { glint } from "./hero-sky";
import { camera, crossings, keyLights, layRibbons, paintRuns, ribbon3d } from "./piano-ribbon";
import type { Flat, Vec } from "./space";
import { draw } from "./svg";

// The hero's strings: keyboard ribbons laid nearly straight and flat in space,
// seen from in front of the dial's heart. On desktop two cross in an X just
// past the end of the heading's first line: one comes toward us past the
// ends of the lede's lines and bends gently to the bottom, the other runs on
// straight and skirts the dial's left rim. A low one runs straight in from
// the left edge under the buttons, and a high one rises over the copy to the
// top right corner, going further off as it goes. On phones three run above
// the copy.

type Route = { through: Vec[]; width: number };

// Placed from the copy's edges and the dial, not the page width, so the
// strings hold from 1280 to 1920.
function routes({ width: W, height: H, heart, radius: R, mobile, hero }: HeroLayout): Route[] {
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

// Builds the strings and sorts their keys into three depths. The scene
// paints each depth where it belongs: back behind the dial, mid between the
// dial and the front lilies, and near over everything; then calls finish to
// glint where they cross. finish returns place, to keep the glints off the
// copy, and play, which runs a pink glissando along every string.
export function drawStrings(layout: HeroLayout) {
  const { width, height, heart, mobile, hero } = layout;
  const cam = camera(heart, width, height);
  const ribbons = routes(layout).map(({ through, width }, i) => ribbon3d(cam, through, width, i));
  const layers = layRibbons(ribbons);
  const paint = (parent: Element, layer: keyof typeof layers) =>
    paintRuns(draw("g", { class: `ribbons-${layer}` }, parent), layers[layer]);

  function finish(parent: Element) {
    const group = draw("g", { class: "string-glints" }, parent);
    const glints = crossings(ribbons, width, height).map(([x, y], i) => glint(group, x, y, mobile ? 10 : 14, -i * 2.3));
    const runs = ribbons.map(({ keys }) => ({ light: keyLights(keys, { trail: 10 }), count: keys.length }));
    let run = 0;
    // When a record lands and none is already playing, a run plays along
    // every string over 2.2 seconds.
    const play = (now: number, arrived: boolean) => {
      if (arrived && !run) run = now;
      if (!run) return;
      const t = (now - run) / 2200;
      for (const { light, count } of runs) light(t > 1 ? null : t * (count + 10));
      if (t > 1) run = 0;
    };
    return { place: () => hideOnCopy(hero, glints), play };
  }

  return { paint, finish };
}
