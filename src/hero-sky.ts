import { hideOnCopy, type HeroLayout } from "./hero-layout";
import { seeded } from "./space";
import { draw } from "./svg";

// The hero's night sky: star dust over the whole hero, drawn into a layer of
// its own behind the scene so its twinkling never redraws the dial, and
// four-point glints that breathe. Neither sits on the copy.

export const skyDefs = `
  <radialGradient id="glint-halo"><stop offset="0" stop-color="#f0b4dc" stop-opacity=".5"/><stop offset=".3" stop-color="#a599d8" stop-opacity=".16"/><stop offset="1" stop-color="#a599d8" stop-opacity="0"/></radialGradient>`;

const dustColors = ["#eef0ff", "#eef0ff", "#d9d2f0", "#f0b4dc", "#a599d8"];
// Where the glints sit, as shares of the hero, and their size.
const glintSpots = {
  desktop: [[0.05, 0.17, 18], [0.3, 0.09, 10], [0.57, 0.23, 14], [0.6, 0.87, 22], [0.985, 0.44, 11], [0.7, 0.15, 8], [0.875, 0.8, 24], [0.36, 0.94, 12], [0.84, 0.27, 7]],
  mobile: [[0.08, 0.08, 12], [0.62, 0.02, 8], [0.94, 0.37, 10], [0.36, 0.33, 7], [0.92, 0.985, 14]],
};

// Star dust in three sizes, one star per 3200 px² (2400 on phones), about
// one in six twinkling. Returns place, to keep the stars off the copy once it
// has settled.
export function drawStarDust(sky: SVGSVGElement, layout: HeroLayout) {
  const { width, height, mobile, hero } = layout;
  sky.setAttribute("viewBox", `0 0 ${width} ${height}`);
  sky.replaceChildren();
  const random = seeded(13);
  const group = draw("g", { class: "star-dust" }, sky);
  const stars = Array.from({ length: Math.round((width * height) / (mobile ? 2400 : 3200)) }, () => {
    const x = random() * width;
    const y = random() * height;
    const r = 0.35 + random() ** 4 * 1.5;
    const star = draw(
      "circle",
      {
        class: "star",
        cx: x.toFixed(1),
        cy: y.toFixed(1),
        r: r.toFixed(2),
        fill: dustColors[Math.floor(random() * dustColors.length)],
        opacity: (0.22 + random() * 0.62).toFixed(2),
      },
      group,
    );
    if (random() < 0.16) {
      star.classList.add("twinkle");
      star.style.animationDelay = `${(-random() * 6).toFixed(2)}s`;
      star.style.animationDuration = `${(3 + random() * 4).toFixed(1)}s`;
    }
    return { element: star, x, y, r: r + 3 };
  });
  return () => hideOnCopy(hero, stars);
}

// A glint: long rays up and down, shorter across, a fainter cross between
// them, a white core and a halo.
export function glint(parent: Element, x: number, y: number, size: number, delay = 0) {
  const at = draw("g", { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, parent);
  const g = draw("g", { class: "glint" }, at);
  g.style.animationDelay = `${delay.toFixed(2)}s`;
  const c = size * 0.06;
  const h = size * 0.62;
  const ray = "#f6d9ee";
  draw("circle", { r: (size * 1.1).toFixed(1), fill: "url(#glint-halo)" }, g);
  draw("path", { d: `M0,${-size} Q${c},${-c} ${h},0 Q${c},${c} 0,${size} Q${-c},${c} ${-h},0 Q${-c},${-c} 0,${-size}Z`, fill: ray }, g);
  const s = size * 0.36;
  const e = s * 0.12;
  draw(
    "path",
    { d: `M0,${-s} Q${e},${-e} ${s},0 Q${e},${e} 0,${s} Q${-e},${e} ${-s},0 Q${-e},${-e} 0,${-s}Z`, fill: ray, opacity: 0.55, transform: "rotate(45)" },
    g,
  );
  draw("circle", { r: (size * 0.09).toFixed(2), fill: "#fff8fd" }, g);
  return { element: at, x, y, r: size * 0.7 };
}

// Nine glints on desktop, five on phones. On a tablet the dial moves, so
// glints within 1.15R of its heart are left out. Returns place, to keep them
// off the copy.
export function drawGlints(parent: Element, layout: HeroLayout) {
  const { width, height, heart, radius, mobile, tablet, hero } = layout;
  const group = draw("g", { class: "hero-glints" }, parent);
  const clear = ([fx, fy]: number[]) => !tablet || Math.hypot(fx * width - heart.x, fy * height - heart.y) > 1.15 * radius;
  const glints = glintSpots[mobile ? "mobile" : "desktop"]
    .filter(clear)
    .map(([fx, fy, size], i) => glint(group, fx * width, fy * height, size, -i * 1.9));
  return () => hideOnCopy(hero, glints);
}
