import { draw } from "./svg";

// The wrought iron and crystal the drawn scenes share: chains, scrolls, iron
// stars, crystal petals, beaded wire, and the hanger a panel or plaque hangs
// from. Each scene that draws with them includes ironDefs for the petal and
// glow gradients.

export const iron = "#9b8794";
export const ironFill = "#241e2e";
export const ironDefs = `<defs>
  <linearGradient id="after-petal" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe0f1"/><stop offset=".4" stop-color="#f0b4dc"/><stop offset="1" stop-color="#bb6688"/></linearGradient>
  <radialGradient id="after-glow"><stop offset="0" stop-color="#f0b4dc" stop-opacity=".55"/><stop offset=".45" stop-color="#bb6688" stop-opacity=".18"/><stop offset="1" stop-color="#bb6688" stop-opacity="0"/></radialGradient>
</defs>`;

export type Box = { l: number; t: number; r: number; b: number; w: number; h: number };

export const line = (width = 1.4) => ({
  fill: "none",
  stroke: iron,
  "stroke-width": width,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
});
export const at = (x: number, y: number, angle = 0) =>
  `translate(${x.toFixed(1)} ${y.toFixed(1)})` + (angle ? ` rotate(${angle.toFixed(1)})` : "");

// A bar's end turns into a scroll: half-turns shrinking into a spiral, curling
// toward sx and down (sy 1) or up (-1).
export function curl(x: number, y: number, radius: number, sx: number, sy: number) {
  const sweep = sx === sy ? 1 : 0;
  let d = "";
  let k = radius;
  let dir = sy;
  for (let i = 0; i < 4; i++) {
    y += dir * 2 * k;
    d += ` A${k.toFixed(2)},${k.toFixed(2)} 0 0 ${sweep} ${x.toFixed(1)},${y.toFixed(1)}`;
    dir = -dir;
    k *= 0.6;
  }
  return d;
}

// Alternating oval links and short bars, from y0 down to y1.
export function chain(parent: Element, x: number, y0: number, y1: number) {
  const links = draw("g", { class: "after-chain" }, parent);
  for (let y = y0, i = 0; y < y1 - 3; y += 6.5, i++) {
    const h = Math.min(9, y1 - y);
    if (i % 2) draw("path", { d: `M${x},${y.toFixed(1)} V${(y + h).toFixed(1)}`, ...line(1.8) }, links);
    else draw("ellipse", { cx: x, cy: (y + h / 2).toFixed(1), rx: 2.4, ry: h / 2, ...line(1.1) }, links);
  }
}

// The stars set into the sagging chain: four long points and four short.
export function star(parent: Element, x: number, y: number, size: number, turn: number) {
  let d = "";
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 + turn;
    const r = i % 2 ? size * 0.26 : i % 4 ? size * 0.62 : size;
    d += (i ? "L" : "M") + (x + r * Math.cos(a)).toFixed(1) + "," + (y + r * Math.sin(a)).toFixed(1);
  }
  draw("path", { d: d + "Z", fill: iron }, parent);
}

// A crystal petal, pale at the heart and rose at the tip, folded along its vein.
export function petal(parent: Element, turn: number, scale: number) {
  const group = draw("g", { transform: `rotate(${turn}) scale(${scale})` }, parent);
  draw(
    "path",
    {
      d: "M0,0 C-6,-5 -7.5,-15 0,-26 C7.5,-15 6,-5 0,0 Z",
      fill: "url(#after-petal)",
      stroke: "#ffe3f2",
      "stroke-width": 0.8,
      "stroke-opacity": 0.7,
      "vector-effect": "non-scaling-stroke",
    },
    group,
  );
  draw("path", { d: "M0,0 C-6,-5 -7.5,-15 0,-26 Z", fill: "#7a4870", opacity: 0.35 }, group);
  draw(
    "path",
    { d: "M0,-2 V-23", stroke: "#fff4fb", "stroke-width": 0.6, opacity: 0.5, "vector-effect": "non-scaling-stroke" },
    group,
  );
}

// A beaded chain: a fine iron wire strung with rose beads.
export function beads(parent: Element, x: number, y0: number, y1: number) {
  draw("path", { d: `M${x.toFixed(1)},${y0.toFixed(1)} V${y1.toFixed(1)}`, stroke: iron, "stroke-width": 0.8 }, parent);
  for (let y = y0 + 6; y < y1 - 3; y += 9) {
    draw("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: 2.2, fill: "#f0b4dc", opacity: 0.9 }, parent);
  }
}

// Two chains, an iron bar along the top with scrolls at its ends, and a foot
// scroll at each bottom corner.
export function hang(parent: Element, box: Box, top: number, radius: number) {
  const g = draw("g", { class: "after-hanger" }, parent);
  for (const x of [box.l + 24, box.r - 24]) {
    chain(g, x, top, box.t - 5);
    draw("circle", { cx: x, cy: box.t - 3, r: 2.8, ...line(1.3) }, g);
  }
  draw("rect", { x: box.l - 4, y: box.t - 1.2, width: box.w + 8, height: 3.4, rx: 1.7, fill: ironFill, stroke: iron, "stroke-width": 1 }, g);
  draw("path", { d: `M${box.l - 4},${box.t + 0.5}` + curl(box.l - 4, box.t + 0.5, radius, -1, 1), ...line(1.5) }, g);
  draw("path", { d: `M${box.r + 4},${box.t + 0.5}` + curl(box.r + 4, box.t + 0.5, radius, 1, 1), ...line(1.5) }, g);
  const foot = box.b - 0.5;
  draw("path", { d: `M${box.l + 22},${foot} H${box.l - 1}` + curl(box.l - 1, foot, radius * 0.7, -1, -1), ...line(1.3) }, g);
  draw("path", { d: `M${box.r - 22},${foot} H${box.r + 1}` + curl(box.r + 1, foot, radius * 0.7, 1, -1), ...line(1.3) }, g);
}
