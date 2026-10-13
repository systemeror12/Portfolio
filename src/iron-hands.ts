import { draw, type SvgAttributes } from "./svg";

// The iron hands, made like the dial itself: flat bronze came, panes of glass,
// hairline leading. Each is drawn 100 units long along +x and scaled to its
// dial; turn sets the direction it points at rest. Callers point a hand by
// setting rotate() on the group it returns.

const came = { fill: "#9b8794" };
const fine = {
  "vector-effect": "non-scaling-stroke",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};
const heartPath = "M0 10 C -12 0, -12 -12, 0 -5 C 12 -12, 12 0, 0 10 Z";

const pane = (d: string, fill: string, parent: Element) =>
  draw("path", { d, fill, stroke: "#9b8794", "stroke-width": 0.9, ...fine }, parent);
const wire = (d: string, parent: Element, stroke: string, width: number) =>
  draw("path", { d, fill: "none", stroke, "stroke-width": width, ...fine }, parent);

function piece(parent: Element, length: number, turn: number, attributes: SvgAttributes) {
  const hand = draw("g", attributes, parent);
  const scale = length / 100;
  const unit = draw(
    "g",
    { transform: `rotate(${turn}) scale(${scale.toFixed(3)} ${(scale * 1.08).toFixed(3)})` },
    hand,
  );
  return [hand, unit] as const;
}

// A bronze shaft with scroll curls, a double open-heart knot, a run of piano
// keys, and a blade of the 25 pane's rose glass carrying a small pink heart.
export function hourHand(parent: Element, length: number, turn = 0) {
  const [hand, unit] = piece(parent, length, turn, { class: "iron-hand iron-hand-hour" });
  draw("path", { d: "M-15,0 L-6,-2.4 L31,-1.6 L31,1.6 L-6,2.4 Z", ...came }, unit);
  draw("circle", { cx: -9.5, r: 1.4, fill: "#06060b" }, unit);
  wire(
    "M22,-1.7 C24,-8.5 31,-12 35.5,-10 C38,-8.8 37.4,-6 35,-6.4 M22,1.7 C24,8.5 31,12 35.5,10 C38,8.8 37.4,6 35,6.4",
    unit,
    "#b8a3ae",
    1,
  );
  wire(heartPath, draw("g", { transform: "translate(40 0) rotate(90) scale(.95)" }, unit), "#b8a3ae", 1.3);
  wire(heartPath, draw("g", { transform: "translate(41.6 0) rotate(90) scale(.52)" }, unit), "#f0b4dc", 1);
  // The keys, as on the ribbon: a pale band, a hairline between whites, blacks
  // in twos and threes.
  draw(
    "path",
    {
      d: "M45,-3.2 L84,-2.6 L84,2.6 L45,3.2 Z",
      fill: "#d8d0e4",
      "fill-opacity": 0.5,
      stroke: "#9b8794",
      "stroke-width": 0.9,
      ...fine,
    },
    unit,
  );
  for (let i = 1; i < 12; i++) {
    const x = 45 + i * 3.25;
    draw("path", { d: `M${x},-3.1 V3.1`, stroke: "#06060b", "stroke-width": 0.5, opacity: 0.6, ...fine }, unit);
    if ([1, 1, 0, 1, 1, 1, 0][(i - 1) % 7]) {
      draw("rect", { x: x - 0.85, y: -3, width: 1.7, height: 3.6, fill: "#06060b", opacity: 0.85 }, unit);
    }
  }
  pane("M84,-2.6 C90,-5.8 96.5,-4.6 100,.6 C95,-1.4 90,-.4 84,2.6 Z", "#7a4870", unit);
  draw("path", { d: "M85.5,1.6 L95,-3.4", stroke: "#9b8794", "stroke-width": 0.5, opacity: 0.6, ...fine }, unit);
  draw("path", { d: heartPath, transform: "translate(89.5 -.4) rotate(90) scale(.15)", fill: "#f0b4dc" }, unit);
  return hand;
}

// A slim spear with C-scrolls, a bead, curved barbs, and a point of the
// quarter panes' violet glass.
export function minuteHand(parent: Element, length: number, turn = 0) {
  const [hand, unit] = piece(parent, length, turn, { class: "iron-hand iron-hand-minute" });
  draw("path", { d: "M-13,0 L-5,-1.8 L64,-.9 L64,.9 L-5,1.8 Z", ...came }, unit);
  draw("circle", { cx: -8.5, r: 1.1, fill: "#06060b" }, unit);
  wire(
    "M9,-1.4 C12,-7.5 21,-8.6 23.4,-4.6 C24.6,-2.2 22,-1.2 20.8,-3 M9,1.4 C12,7.5 21,8.6 23.4,4.6 C24.6,2.2 22,1.2 20.8,3",
    unit,
    "#b8a3ae",
    1,
  );
  draw("circle", { cx: 29, r: 1.5, ...came }, unit);
  wire("M62,-1 C59.5,-2 57.5,-3.6 56.4,-6.2 M62,1 C59.5,2 57.5,3.6 56.4,6.2", unit, "#b8a3ae", 1);
  pane("M62,0 L74,-3.4 L100,0 L74,3.4 Z", "#5b4680", unit);
  draw(
    "path",
    { d: "M64,0 H97 M74,-3.4 L80,0 L74,3.4", fill: "none", stroke: "#9b8794", "stroke-width": 0.5, opacity: 0.7, ...fine },
    unit,
  );
  return hand;
}
