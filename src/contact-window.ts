import { hourHand, minuteHand } from "./iron-hands";
import { draw } from "./svg";

// The coda's scene: a small twenty-five hour window whose hands both rest on
// 25, as the footer says. Nothing moves, so it is drawn once into a fixed
// viewBox and needs no observers.

const paneTones = ["#2b2436", "#3a2d4d", "#4a3a63", "#33293f"];
const leading = { stroke: "#9b8794", "stroke-width": 0.9 };
const step = (2 * Math.PI) / 25;
const point = (r: number, a: number) => [r * Math.cos(a), r * Math.sin(a)].map((n) => n.toFixed(2));

export function drawContactWindow(svg: SVGSVGElement) {
  svg.setAttribute("viewBox", "-130 -130 260 260");
  svg.innerHTML = `<defs><radialGradient id="coda-glow"><stop offset="0" stop-color="#f0b4dc" stop-opacity=".9"/><stop offset=".28" stop-color="#bb6688" stop-opacity=".4"/><stop offset=".6" stop-color="#4a3a63" stop-opacity=".18"/><stop offset="1" stop-color="#4a3a63" stop-opacity="0"/></radialGradient></defs>`;
  draw("circle", { r: 96, fill: "url(#coda-glow)", opacity: 0.5 }, svg);

  // The ring of hours: rose glass for 25, violet every fifth, plum between.
  for (let k = 0; k < 25; k++) {
    const a0 = (k - 0.5) * step - Math.PI / 2;
    const a1 = (k + 0.5) * step - Math.PI / 2;
    const [x0, y0] = point(96, a0);
    const [x1, y1] = point(118, a0);
    const [x2, y2] = point(118, a1);
    const [x3, y3] = point(96, a1);
    draw(
      "path",
      {
        d: `M${x0},${y0} L${x1},${y1} A118,118 0 0 1 ${x2},${y2} L${x3},${y3} A96,96 0 0 0 ${x0},${y0} Z`,
        fill: k === 0 ? "#7a4870" : k % 5 ? paneTones[k % 4] : "#5b4680",
        opacity: 0.82,
        stroke: "#9b8794",
        "stroke-width": 0.8,
      },
      svg,
    );
  }
  for (const r of [92, 120, 125]) draw("circle", { r, fill: "none", ...leading, opacity: 0.8 }, svg);

  // Five ticks to the hour.
  for (let k = 0; k < 125; k++) {
    const a = (k * 2 * Math.PI) / 125;
    const [x0, y0] = point(84, a);
    const [x1, y1] = point(k % 5 ? 87 : 90, a);
    draw("path", { d: `M${x0},${y0} L${x1},${y1}`, stroke: "#9b8794", "stroke-width": 0.7, opacity: 0.7 }, svg);
  }

  const [tx, ty] = point(107, -Math.PI / 2);
  draw(
    "text",
    {
      x: tx,
      y: ty,
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "font-family": "Shippori Mincho, serif",
      "font-size": 12,
      fill: "#f0b4dc",
    },
    svg,
  ).textContent = "25";

  minuteHand(svg, 86, -90);
  hourHand(svg, 66, -90);
  draw("circle", { r: 6, fill: "#9b8794" }, svg);
  draw("circle", { r: 9, fill: "none", ...leading, opacity: 0.8 }, svg);
  draw("circle", { r: 2.2, fill: "#06060b" }, svg);

  return () => svg.replaceChildren();
}
