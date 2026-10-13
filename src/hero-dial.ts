import { hourHand, minuteHand } from "./iron-hands";
import { draw } from "./svg";

// The hero's scene: a twenty-five hour dial of stained glass keeping Manila
// time, a glass lily at its heart, and smoked-glass lilies in the corners.

const reducedMotion = "(prefers-reduced-motion: reduce)";
const manilaTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Manila",
  minute: "2-digit",
  second: "2-digit",
});
const paneTones = ["#2b2436", "#3a2d4d", "#4a3a63", "#33293f"];
const defs = `<defs>
  <radialGradient id="hero-glow"><stop offset="0" stop-color="#f0b4dc" stop-opacity=".9"/><stop offset=".25" stop-color="#bb6688" stop-opacity=".42"/><stop offset=".55" stop-color="#4a3a63" stop-opacity=".2"/><stop offset="1" stop-color="#4a3a63" stop-opacity="0"/></radialGradient>
  <radialGradient id="hero-petal" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="100"><stop offset="0" stop-color="#8d93bd"/><stop offset=".32" stop-color="#535b7e"/><stop offset=".72" stop-color="#394060"/><stop offset="1" stop-color="#2a2f48"/></radialGradient>
  <radialGradient id="hero-petal-in" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="100"><stop offset="0" stop-color="#aeb2da"/><stop offset=".5" stop-color="#6a7296"/><stop offset="1" stop-color="#454c6c"/></radialGradient>
  <radialGradient id="hero-lily-glow"><stop offset="0" stop-color="#f2f3ff" stop-opacity=".5"/><stop offset=".4" stop-color="#b9bde6" stop-opacity=".25"/><stop offset="1" stop-color="#b9bde6" stop-opacity="0"/></radialGradient>
</defs>`;

type LilyTint = { petal: string; petalIn: string; edge: string; edgeOpacity: number; vein: string; dust: string };

// The corner lilies are blue smoked glass; the one in the dial keeps the
// dial's plum glass and bronze leading.
const smoked: LilyTint = {
  petal: "url(#hero-petal)",
  petalIn: "url(#hero-petal-in)",
  edge: "#b9bedd",
  edgeOpacity: 0.75,
  vein: "#cdd1ee",
  dust: "#eef0ff",
};
const plum: LilyTint = {
  petal: "rgba(74,58,99,.2)",
  petalIn: "rgba(74,58,99,.3)",
  edge: "#9b8794",
  edgeOpacity: 0.55,
  vein: "#9b8794",
  dust: "#cfc8de",
};
const petalPath = "M0,0 C-34,-16 -40,-56 -8,-80 C-2,-85 4,-92 9,-100 C9,-88 31,-64 28,-34 C26,-16 12,-5 0,0 Z";
const petalShade = "M0,0 C-34,-16 -40,-56 -8,-80 C-2,-85 4,-92 9,-100 C2,-70 1,-40 0,0 Z";

// A starry lily of glass: two rings of broad pointed petals, a vein down each,
// glitter gathered at the heart. Its seed makes it the same on every load.
function lily(
  parent: Element,
  x: number,
  y: number,
  scale: number,
  rotation: number,
  seed: number,
  { opacity = 0.9, bud = true, glitter = 46, tint = smoked } = {},
) {
  let n = seed;
  const random = () => (n = (n * 16807) % 2147483647) / 2147483647;
  const group = draw("g", { transform: `translate(${x} ${y}) rotate(${rotation}) scale(${scale})`, opacity }, parent);
  const line = { fill: "none", stroke: tint.vein, "vector-effect": "non-scaling-stroke" };
  const ring = (count: number, size: number, fill: string, turn: number, veins: boolean) => {
    for (let i = 0; i < count; i++) {
      const angle = i * (360 / count) + turn + (random() - 0.5) * 12;
      const petal = draw(
        "g",
        { transform: `rotate(${angle.toFixed(1)}) scale(${(size * (0.86 + random() * 0.22)).toFixed(2)})` },
        group,
      );
      draw(
        "path",
        {
          d: petalPath,
          fill,
          stroke: tint.edge,
          "stroke-width": 1,
          "stroke-opacity": tint.edgeOpacity,
          "vector-effect": "non-scaling-stroke",
        },
        petal,
      );
      // One half of each petal in shadow, folded along its vein.
      draw("path", { d: petalShade, fill: "#12142a", opacity: 0.3 }, petal);
      draw("path", { d: "M0,-5 C1,-40 2,-70 8,-94", ...line, "stroke-width": 0.7, opacity: 0.4 }, petal);
      if (veins) {
        draw(
          "path",
          { d: "M1,-28 C-6,-36 -12,-42 -17,-50 M2,-44 C8,-52 13,-58 16,-64", ...line, "stroke-width": 0.5, opacity: 0.2 },
          petal,
        );
      }
    }
  };
  ring(7, 1, tint.petal, 0, true);
  ring(5, 0.56, tint.petalIn, 180 / 7, false);
  if (bud) {
    draw("circle", { r: 40, fill: "url(#hero-lily-glow)" }, group);
    for (const angle of [-24, 0, 24]) {
      draw(
        "path",
        {
          d: "M0,0 C-7,-6 -6,-18 0,-26 C6,-18 7,-6 0,0 Z",
          transform: `rotate(${angle})`,
          fill: "#8e94bd",
          stroke: "#d6d9f2",
          "stroke-width": 0.8,
          "stroke-opacity": 0.7,
          "fill-opacity": 0.75,
          "vector-effect": "non-scaling-stroke",
        },
        group,
      );
    }
  }
  for (let i = 0; i < glitter; i++) {
    const angle = random() * Math.PI * 2;
    const r = 3 + 82 * random() ** 1.7;
    draw(
      "circle",
      {
        cx: (Math.cos(angle) * r).toFixed(1),
        cy: (Math.sin(angle) * r).toFixed(1),
        r: (random() * 1.1 + 0.35).toFixed(2),
        fill: tint.dust,
        opacity: (random() * 0.6 + 0.25).toFixed(2),
      },
      group,
    );
  }
  return group;
}

// The dial's panes, numerals, rings, and ticks, with the hands and the boss
// on top. Returns the hands for the clock to turn.
function dial(parent: Element, radius: number, reduce: boolean) {
  const r1 = radius * 0.79;
  const r2 = radius * 0.95;
  const step = (2 * Math.PI) / 25;
  const up = -Math.PI / 2;
  const at = (r: number, a: number) => [r * Math.cos(a), r * Math.sin(a)];
  // A glass lily, like the ones at the corners, blooms at the dial's heart.
  lily(parent, 0, 0, radius * 0.0048, 0, 5, { opacity: 0.85, bud: false, glitter: 24, tint: plum });
  for (let k = 0; k < 25; k++) {
    const a0 = (k - 0.5) * step + up;
    const a1 = (k + 0.5) * step + up;
    const [x0, y0] = at(r1, a0);
    const [x1, y1] = at(r2, a0);
    const [x2, y2] = at(r2, a1);
    const [x3, y3] = at(r1, a1);
    // Every fifth pane is violet glass, and 25 burns rose.
    const fill = k === 0 ? "#7a4870" : k % 5 ? paneTones[k % 4] : "#5b4680";
    const pane = draw(
      "path",
      {
        d: `M${x0},${y0} L${x1},${y1} A${r2},${r2} 0 0 1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 0 0 ${x0},${y0} Z`,
        class: k % 3 ? "dial-pane" : "dial-pane glass",
        fill,
        opacity: 0.78,
        stroke: "#9b8794",
        "stroke-width": 0.8,
      },
      parent,
    );
    if (k % 3 === 0) pane.style.animationDelay = `${-k * 0.6}s`;
    // A facet line through each pane, like leaded glass.
    const [fx0, fy0] = at(r1, a0 + (a1 - a0) * (0.3 + ((k * 37) % 40) / 100));
    const [fx1, fy1] = at(r2, a0 + (a1 - a0) * 0.7);
    draw("path", { d: `M${fx0},${fy0} L${fx1},${fy1}`, stroke: "#9b8794", "stroke-width": 0.5, opacity: 0.6 }, parent);
    // A diamond on the outer ring between panes.
    const [dx, dy] = at(radius, a0);
    draw(
      "path",
      { d: "M0 -5 L3 0 L0 5 L-3 0 Z", transform: `translate(${dx} ${dy}) rotate(${(a0 * 180) / Math.PI})`, fill: "#9b8794" },
      parent,
    );
    // The hour numerals, with 25 at the top.
    const hour = k === 0 ? 25 : k;
    const [tx, ty] = at(radius * 0.87, k * step + up);
    draw(
      "text",
      {
        class: "dial-numeral",
        x: tx,
        y: ty,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-family": "Shippori Mincho, serif",
        "font-size": (radius * (hour === 25 ? 0.05 : 0.034)).toFixed(1),
        fill: hour === 25 ? "#f0b4dc" : "#cfc8de",
        opacity: hour === 25 ? 1 : 0.7,
      },
      parent,
    ).textContent = String(hour);
  }
  [radius, radius * 1.03, r1, radius * 0.7].forEach((r, i) =>
    draw(
      "circle",
      { class: "dial-ring", r, fill: "none", stroke: "#9b8794", "stroke-width": i === 3 ? 0.6 : 1, opacity: i === 3 ? 0.5 : 0.8 },
      parent,
    ),
  );
  for (let k = 0; k < 125; k++) {
    const a = (k * 2 * Math.PI) / 125;
    const [x0, y0] = at(radius * 0.7, a);
    const [x1, y1] = at(radius * (k % 5 ? 0.725 : 0.745), a);
    draw("path", { class: "dial-tick", d: `M${x0},${y0} L${x1},${y1}`, stroke: "#9b8794", "stroke-width": 0.7, opacity: 0.7 }, parent);
  }
  const hour = hourHand(parent, radius * 0.56);
  const minute = minuteHand(parent, radius * 0.72);
  const second = draw("g", reduce ? { class: "dial-second-hand", display: "none" } : { class: "dial-second-hand" }, parent);
  draw("path", { d: `M${-radius * 0.1},0 L${radius * 0.76},0`, stroke: "#f0b4dc", "stroke-width": 0.9, opacity: 0.8 }, second);
  // The bronze boss, with a thin ring.
  draw("circle", { class: "dial-boss", r: 7, fill: "#9b8794" }, parent);
  draw("circle", { r: 10, fill: "none", stroke: "#9b8794", "stroke-width": 0.9, opacity: 0.8 }, parent);
  draw("circle", { r: 2.5, fill: "#06060b" }, parent);
  return { hour, minute, second };
}

// Draws the scene into svg, sized to its parent, and places label beside the
// heart. Returns a cleanup function.
export function drawHeroDial(svg: SVGSVGElement, label: HTMLElement) {
  const hero = svg.parentElement!;
  const reduce = window.matchMedia(reducedMotion).matches;
  const start = performance.now();
  let width = 0;
  let height = 0;
  let hands: ReturnType<typeof dial>;
  let glow: SVGCircleElement;

  function build() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const mobile = width < 760;
    const heart = mobile ? { x: width * 0.7, y: 196 } : { x: width * 0.79, y: height * 0.52 };
    const radius = mobile ? Math.min(width * 0.36, 150) : Math.min(300, height * 0.36, width * 0.22);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = defs;
    if (mobile) lily(svg, width, height * 0.97, 0.66, 12, 7);
    else {
      lily(svg, width * 0.97, height * 0.9, 1.25, 12, 7);
      lily(svg, width * 0.42, height * 1.04, 0.9, -20, 23);
    }
    hands = dial(draw("g", { class: "dial", transform: `translate(${heart.x} ${heart.y})` }, svg), radius, reduce);
    glow = draw("circle", { fill: "url(#hero-glow)", cx: heart.x, cy: heart.y }, svg);
    draw("circle", { fill: "#fff4fb", cx: heart.x, cy: heart.y, r: 3.2 }, svg);
    // On phones the words sit under the heart, inside the dial's face.
    label.style.left = `${heart.x + (mobile ? 0 : 22)}px`;
    label.style.top = `${heart.y + (mobile ? radius * 0.22 : 14)}px`;
    label.style.transform = mobile ? "translateX(-50%)" : "";
    tick(start);
  }

  // The dial keeps Manila minutes and seconds; the hour hand stays near 25,
  // creeping one pane an hour, so its heart stays upright.
  function tick(now: number) {
    const parts = Object.fromEntries(
      manilaTime.formatToParts(new Date()).map((part) => [part.type, Number(part.value)]),
    );
    const millis = reduce ? 0 : (Date.now() % 1000) / 1000;
    const turn = (hand: SVGGElement, degrees: number) => hand.setAttribute("transform", `rotate(${degrees.toFixed(2)})`);
    turn(hands.hour, -90 + (parts.minute / 60) * (360 / 25));
    turn(hands.minute, -90 + ((parts.minute + parts.second / 60) / 60) * 360);
    turn(hands.second, -90 + ((parts.second + millis) / 60) * 360);
    const breathe = reduce ? 0 : (Math.sin(((now - start) / 1000) * 1.4) + 1) / 2;
    glow.setAttribute("r", String(130 + breathe * 18));
  }

  build();

  // Redraw once the hero settles at a new size.
  let pending = 0;
  const resize = new ResizeObserver(() => {
    if (hero.clientWidth === width && hero.clientHeight === height) return;
    if (reduce) return build();
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      pending = 0;
      build();
    });
  });
  resize.observe(hero);

  // Run only while the hero is on screen. Reduced motion keeps the time on a
  // timer, without a sweeping second hand.
  let frame = 0;
  const loop = (now: number) => {
    tick(now);
    frame = requestAnimationFrame(loop);
  };
  const visible = new IntersectionObserver(([entry]) => {
    svg.classList.toggle("is-paused", !entry.isIntersecting);
    if (reduce) return;
    if (entry.isIntersecting && !frame) frame = requestAnimationFrame(loop);
    else if (!entry.isIntersecting) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  visible.observe(hero);
  const timer = reduce ? window.setInterval(() => tick(performance.now()), 15_000) : 0;

  return () => {
    resize.disconnect();
    visible.disconnect();
    cancelAnimationFrame(pending);
    cancelAnimationFrame(frame);
    window.clearInterval(timer);
    svg.replaceChildren();
    label.removeAttribute("style");
  };
}
