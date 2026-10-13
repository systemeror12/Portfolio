import { draw } from "./svg";

// The records flowing into the hero's dial: three five-line staves carrying
// notes and four threads carrying dots, each to the heart, with a word for the
// record it carries. Around them, a ribbon of piano keys curling in under the
// header, sparkles kept off the copy, and lilac fragments falling off the rim.

type Point = { x: number; y: number };
type Box = { l: number; t: number; r: number; b: number };
type Curve = [number[], number[]];
type Thread = {
  x: number;
  y: number;
  seed: number;
  speed: number;
  offset: number;
  lines: SVGPathElement[];
  marks: SVGGraphicsElement[];
  progress: number[];
  label: SVGTextElement;
  labelAt: number | null;
};
export type RecordsLayout = {
  width: number;
  height: number;
  heart: Point;
  radius: number;
  mobile: boolean;
  reduce: boolean;
};

const words = [
  "biometric punch",
  "overtime request",
  "approved leave",
  "payment webhook",
  "access rule",
  "salary step",
  "pass slip",
];
const sparkPath = "M0 -6 L1 -1 L6 0 L1 1 L0 6 L-1 1 L-6 0 L-1 -1 Z";
const copy = ".hero-name, .hero-copy h1, .hero-lede, .hero-actions";

const overlaps = (a: Box, b: Box) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
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

// The boxes of the elements matching selector, in the hero's coordinates.
function boxes(hero: Element, selector: string, pad: number): Box[] {
  const origin = hero.getBoundingClientRect();
  return [...document.querySelectorAll(selector)].map((element) => {
    const box = element.getBoundingClientRect();
    return {
      l: box.left - origin.left - pad,
      t: box.top - origin.top - pad,
      r: box.right - origin.left + pad,
      b: box.bottom - origin.top + pad,
    };
  });
}

// Piano keys along a curve: a pale band, a hairline between keys, black keys
// in twos and threes. Returns points along it for the labels to keep off.
function ribbon(parent: Element, d: string, width: number) {
  const guide = draw("path", { d }, parent);
  const length = guide.getTotalLength();
  const points = Array.from({ length: 81 }, (_, i) => {
    const at = (l: number) => guide.getPointAtLength(Math.min(length, Math.max(0, l)));
    const { x, y } = at((length * i) / 80);
    const ahead = at((length * i) / 80 + 1);
    const behind = at((length * i) / 80 - 1);
    const l = Math.hypot(ahead.x - behind.x, ahead.y - behind.y) || 1;
    return { x, y, nx: -(ahead.y - behind.y) / l, ny: (ahead.x - behind.x) / l };
  });
  guide.remove();
  const offset = (o: number) =>
    "M" + points.map(({ x, y, nx, ny }) => `${(x + nx * o).toFixed(1)},${(y + ny * o).toFixed(1)}`).join(" L");
  const group = draw("g", { class: "ribbon", "data-width": width }, parent);
  const band = { fill: "none", "stroke-width": width };
  draw("path", { class: "ribbon-band", d: offset(0), ...band, stroke: "#d8d0e4", opacity: 0.42 }, group);
  draw("path", { d: offset(0), ...band, stroke: "#06060b", "stroke-dasharray": "1.2 8.8", opacity: 0.55 }, group);
  draw(
    "path",
    {
      d: offset(-width * 0.2),
      fill: "none",
      stroke: "#06060b",
      "stroke-width": width * 0.6,
      "stroke-dasharray": "6 4 6 14 6 4 6 4 6 14",
      "stroke-dashoffset": 3,
      opacity: 0.9,
    },
    group,
  );
  for (const o of [-width / 2, width / 2]) {
    draw("path", { d: offset(o), fill: "none", stroke: "#9b8794", "stroke-width": 0.8, opacity: 0.6 }, group);
  }
  return points.map(({ x, y }) => ({ l: x - width, t: y - width, r: x + width, b: y + width }));
}

// Draws the records into svg, which already holds the dial at heart. Returns
// place, to keep the labels and sparkles clear once the copy has settled, and
// advance, to move the records on; it reports whether one reached the heart.
export function drawHeroRecords(svg: SVGSVGElement, layout: RecordsLayout) {
  const { width: W, height: H, heart, radius: R, mobile, reduce } = layout;
  const hero = svg.parentElement!;
  const start = performance.now();
  const group = draw("g", { class: "hero-records" }, svg);
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // The staves fade in from the page's edge and warm to rose at the heart.
  draw(
    "linearGradient",
    { id: "hero-fade", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: heart.x, y2: 0 },
    svg.querySelector("defs") ?? svg,
  ).innerHTML =
    '<stop offset="0" stop-color="#cfc8de" stop-opacity=".06"/><stop offset=".6" stop-color="#cfc8de" stop-opacity=".34"/><stop offset="1" stop-color="#f0b4dc" stop-opacity=".7"/>';

  // Lilac fragments falling off the dial's rim.
  const fragments: Box[] = [];
  const jig = [0, 3.5, -2, 4, 1, -3, 2.5, -1];
  const out = [0.02, 0.16, 0.06, 0.22, 0.1, 0.3, 0.14, 0.38];
  for (let k = 0; k < (mobile ? 4 : 8); k++) {
    const a = (((mobile ? 136 : 96) + k * (mobile ? 13 : 8.5) + jig[k] * 2) * Math.PI) / 180;
    const x = heart.x + R * (1.12 + out[k]) * Math.cos(a);
    const y = heart.y + R * (1.12 + out[k]) * Math.sin(a);
    const scale = 0.7 + ((k * 7) % 5) / 10;
    const place = draw("g", { transform: `translate(${x} ${y}) rotate(${-20 + ((k * 37) % 70)}) scale(${scale})` }, group);
    const fragment = draw("g", { class: "fragment" }, place);
    fragment.style.animationDelay = `${-k * 1.3}s`;
    draw("rect", { x: -9, y: -9, width: 18, height: 18, fill: "#c9b2dc", opacity: 0.75 }, fragment);
    draw("path", { d: "M-3 4 a2.6 2 0 1 0 0.01 0 M-0.4 4 V-5 L4 -6", stroke: "#2b2436", "stroke-width": 1.3, fill: "none" }, fragment);
    const reach = 13 * scale + 8;
    fragments.push({ l: x - reach, t: y - reach, r: x + reach, b: y + reach });
  }

  // A ribbon of piano keys curling in from the top, clear of the header's
  // text: on desktop it slips under the links and clock and above the dial; on
  // phones it curls away to the left.
  const origin = hero.getBoundingClientRect();
  const header = document.querySelector(".site-header")?.getBoundingClientRect();
  const headerBottom = header ? header.bottom - origin.top : 0;
  const mark = (document.querySelector(".site-header .identity")?.getBoundingClientRect().right ?? 180) - origin.left;
  const nav = document.querySelector<HTMLElement>(".site-header nav");
  const links = (nav?.offsetWidth ? nav : document.querySelector(".site-header .clock"))?.getBoundingClientRect();
  const linksLeft = (links?.left ?? W - 200) - origin.left;
  const yb = Math.max(headerBottom + 14, (headerBottom + heart.y - R * 1.06) / 2);
  const x0 = Math.max(mark + 40, linksLeft - 150);
  const keys = mobile
    ? ribbon(group, `M${mark + 32},-20 C ${mark + 27},40 ${mark - 23},75 ${mark - 93},95 S -10,130 -30,175`, 12)
    : ribbon(
        group,
        `M${x0},-30 C ${x0 + 30},${yb * 0.8} ${x0 + 90},${yb + 12} ${x0 + 220},${yb + 12} S ${W - 120},${Math.max(headerBottom + 16, yb - 22)} ${W + 30},${yb + 36}`,
        16,
      );

  // Sparkles; place moves them off the copy. The twinkle owns each sparkle's
  // transform, so a wrapping group places it.
  const sparkles = Array.from({ length: 16 }, () => {
    const at = draw("g", {}, group);
    const sparkle = draw("path", { class: "sparkle", d: sparkPath, fill: "#f0b4dc" }, at);
    sparkle.style.animationDelay = `${(-random() * 4).toFixed(2)}s`;
    return at;
  });

  // The staves and threads, each from the page's edge to the heart.
  const starts = mobile
    ? [[-20, H * 0.05], [-20, H * 0.32], [W * 0.25, -20], [-20, H * 0.55], [W * 0.55, -20], [W + 20, H * 0.42], [W + 20, H * 0.02]]
    : [[-20, H * 0.14], [-20, H * 0.8], [W * 0.3, -20], [-20, H * 0.42], [W * 0.55, H + 20], [W * 0.95, -20], [W + 20, H * 0.85]];
  const threads: Thread[] = starts.map(([x, y], i) => {
    const staff = i < 3;
    const stroke = staff || x < heart.x ? "url(#hero-fade)" : "rgba(207,200,222,.26)";
    const lines = Array.from({ length: staff ? 5 : 1 }, () =>
      draw("path", { class: staff ? "record-staff" : "record-thread", fill: "none", stroke, "stroke-width": 0.8 }, group),
    );
    const marks: SVGGraphicsElement[] = staff
      ? [0, 1].map(() => {
          const note = draw("g", { class: "record-note" }, group);
          draw("ellipse", { rx: 4.6, ry: 3.2, transform: "rotate(-22)", fill: "#ece8f4" }, note);
          draw("path", { d: "M4 -1 V-17", stroke: "#ece8f4", "stroke-width": 1.2 }, note);
          return note;
        })
      : [draw("circle", { class: "record-dot", r: 2.2, fill: "#ece8f4" }, group)];
    if (reduce) marks.forEach((mark) => mark.setAttribute("display", "none"));
    const label = draw(
      "text",
      { class: "record-label", fill: "#9a8fab", "font-size": mobile ? 11 : 13, "font-family": "Zen Kaku Gothic New, sans-serif" },
      group,
    );
    label.textContent = words[i];
    return { x, y, seed: i * 1.7, speed: 9000 + ((i * 1931) % 5000), offset: (i * 0.37) % 1, lines, marks, progress: [], label, labelAt: null };
  });
  const spacing = mobile ? 3.6 : 4.6;

  // The curve a record follows at t seconds, swaying a little about its rest.
  function curve(th: Thread, t: number, sway: number): Curve {
    const dx = heart.x - th.x;
    const dy = heart.y - th.y;
    return [
      [th.x, th.x + dx * 0.35 + Math.sin(t * 0.35 + th.seed) * 22 * sway, th.x + dx * 0.72 + Math.cos(t * 0.25 + th.seed) * 18 * sway, heart.x],
      [th.y, th.y + dy * 0.1 + Math.cos(t * 0.3 + th.seed) * 26 * sway - 40, heart.y - dy * 0.08 + Math.sin(t * 0.4 + th.seed) * 16 * sway, heart.y],
    ];
  }

  // Keeps the sparkles off the copy, and sets each label where its thread
  // rests, clear of the copy, the ribbon, the fragments, other labels, and
  // the dial. A label with nowhere to go is left out.
  function place() {
    const text = boxes(hero, copy, 10);
    let n = 29;
    const spot = () => (n = (n * 16807) % 2147483647) / 2147483647;
    for (const at of sparkles) {
      let x = 0;
      let y = 0;
      let clear = false;
      for (let tries = 0; tries < 30 && !clear; tries++) {
        x = spot() * W;
        y = spot() * H;
        clear = !text.some((k) => x > k.l && x < k.r && y > k.t && y < k.b);
      }
      at.setAttribute("transform", `translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${(spot() * 0.8 + 0.5).toFixed(2)})`);
      at.setAttribute("display", clear ? "inline" : "none");
    }
    const blocks = [...boxes(hero, `${copy}, .hero .heart-label`, 12), ...keys, ...fragments];
    threads.forEach((th, i) => {
      th.labelAt = null;
      th.label.removeAttribute("display");
      const rest = curve(th, 0, 0);
      const w = th.label.getComputedTextLength() + 8;
      for (const a of mobile && i % 2 ? [] : [0.2, 0.28, 0.36, 0.44, 0.52, 0.6, 0.68, 0.76]) {
        const pt = along(rest, a);
        const box = { l: pt.x + 8, t: pt.y - 26, r: pt.x + 8 + w, b: pt.y - 6 };
        if (box.l < 8 || box.r > W - 8 || box.t < 0 || box.b > H) continue;
        if (blocks.some((k) => overlaps(box, k))) continue;
        // Labels stay outside the dial, leaving its face to the hands.
        const near = Math.hypot(Math.max(box.l - heart.x, 0, heart.x - box.r), Math.max(box.t - heart.y, 0, heart.y - box.b));
        if (near < R * 1.08) continue;
        blocks.push({ l: box.l - 6, t: box.t - 6, r: box.r + 6, b: box.b + 6 });
        th.labelAt = a;
        th.label.setAttribute("x", (pt.x + 8).toFixed(1));
        th.label.setAttribute("y", (pt.y - 12).toFixed(1));
        break;
      }
      if (th.labelAt === null) th.label.setAttribute("display", "none");
    });
  }

  function advance(now: number) {
    const t = (now - start) / 1000;
    let arrived = false;
    for (const th of threads) {
      const path = curve(th, t, reduce ? 0 : 1);
      if (th.lines.length === 1) {
        const [xs, ys] = path;
        th.lines[0].setAttribute("d", `M${xs[0]},${ys[0]} C${xs[1]},${ys[1]} ${xs[2]},${ys[2]} ${xs[3]},${ys[3]}`);
      } else {
        // The staff narrows to a point at the heart.
        const points = Array.from({ length: 41 }, (_, i) => ({ ...along(path, i / 40), f: (1 - i / 40) ** 0.8 }));
        th.lines.forEach((line, j) => {
          const o = (j - 2) * spacing;
          line.setAttribute(
            "d",
            "M" + points.map(({ x, y, nx, ny, f }) => `${(x + nx * o * f).toFixed(1)},${(y + ny * o * f).toFixed(1)}`).join(" L"),
          );
        });
      }
      if (reduce) continue;
      th.marks.forEach((mark, k) => {
        const p = (now / th.speed + th.offset + k * 0.5) % 1;
        if (p < (th.progress[k] ?? 0)) arrived = true;
        th.progress[k] = p;
        const e = p * p * (3 - 2 * p);
        const pt = along(path, e);
        const opacity = Math.min(1, p * 6, (1 - p) * 8).toFixed(2);
        mark.setAttribute("opacity", opacity);
        if (mark instanceof SVGCircleElement) {
          mark.setAttribute("cx", pt.x.toFixed(1));
          mark.setAttribute("cy", pt.y.toFixed(1));
          return;
        }
        // Notes ride the staff's outer lines, closing in as it narrows.
        const o = (k ? 1 : -1) * (k + 1) * 0.5 * spacing * (1 - e) ** 0.8;
        mark.setAttribute(
          "transform",
          `translate(${(pt.x + pt.nx * o).toFixed(1)} ${(pt.y + pt.ny * o).toFixed(1)}) scale(${(0.6 + 0.4 * (1 - e)).toFixed(2)})`,
        );
      });
    }
    return arrived;
  }

  return { place, advance };
}
