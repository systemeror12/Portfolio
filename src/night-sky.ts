import { draw } from "./svg";

// The night sky behind every page, from the hero prototype's round 1 A: star
// dust the length of the page, about one star in six twinkling. It is cut
// into bands so only the bands on screen twinkle, and a star that would sit
// under a line of text is hidden, so the text keeps its contrast.

type Star = { element: SVGCircleElement; x: number; y: number; r: number };
type Box = { l: number; t: number; r: number; b: number };

const reducedMotion = "(prefers-reduced-motion: reduce)";
const colors = ["#eef0ff", "#eef0ff", "#d9d2f0", "#f0b4dc", "#a599d8"];
const bandHeight = 1000;

// The box of every line of text on the page, in the page's coordinates.
function textLines(page: Element, pad: number): Box[] {
  const origin = page.getBoundingClientRect();
  const lines: Box[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent!.trim() || node.parentElement?.closest("svg")) continue;
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      lines.push({
        l: rect.left - origin.left - pad,
        t: rect.top - origin.top - pad,
        r: rect.right - origin.left + pad,
        b: rect.bottom - origin.top + pad,
      });
    }
  }
  return lines;
}

// Draws the sky into layer, sized to its parent, the page. Returns a cleanup
// function.
export function drawNightSky(layer: HTMLElement) {
  const page = layer.parentElement!;
  const reduce = window.matchMedia(reducedMotion).matches;
  let width = 0;
  let height = 0;
  let stars: Star[] = [];

  // Bands off screen hold their twinkle.
  const visible = new IntersectionObserver((entries) => {
    for (const entry of entries) entry.target.classList.toggle("is-paused", !entry.isIntersecting);
  });

  function build() {
    width = page.clientWidth;
    height = page.clientHeight;
    visible.disconnect();
    layer.replaceChildren();
    stars = [];
    const area = width < 760 ? 2400 : 3200;
    // Each band has its own seed, so a longer page keeps the sky above.
    for (let i = 0, top = 0; top < height; i++, top += bandHeight) {
      const tall = Math.min(bandHeight, height - top);
      const band = draw("svg", { class: "night-sky-band", viewBox: `0 0 ${width} ${tall}` }, layer);
      band.style.top = `${top}px`;
      band.style.height = `${tall}px`;
      let n = 13 + i * 7919;
      const random = () => (n = (n * 16807) % 2147483647) / 2147483647;
      for (let k = 0, count = Math.round((width * tall) / area); k < count; k++) {
        const x = random() * width;
        const y = random() * tall;
        const r = 0.35 + random() ** 4 * 1.5;
        const star = draw(
          "circle",
          {
            cx: x.toFixed(1),
            cy: y.toFixed(1),
            r: r.toFixed(2),
            fill: colors[Math.floor(random() * colors.length)],
            opacity: (0.22 + random() * 0.62).toFixed(2),
          },
          band,
        );
        if (random() < 0.16) {
          star.classList.add("twinkle");
          star.style.animationDelay = `${(-random() * 6).toFixed(2)}s`;
          star.style.animationDuration = `${(3 + random() * 4).toFixed(1)}s`;
        }
        stars.push({ element: star, x, y: top + y, r: r + 3 });
      }
      visible.observe(band);
    }
    place();
  }

  // Hides the stars that would sit under text.
  function place() {
    const lines = textLines(page, 8);
    for (const { element, x, y, r } of stars) {
      const under = lines.some((k) => x + r > k.l && x - r < k.r && y + r > k.t && y - r < k.b);
      element.setAttribute("display", under ? "none" : "inline");
    }
  }

  build();
  let live = true;
  document.fonts.ready.then(() => live && place());

  // Redraw once the page settles at a new size. Reduced motion redraws at
  // once, so a capture never sees the sky out of step with the page.
  let pending = 0;
  const schedule = (work: () => void) => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      pending = 0;
      work();
    });
  };
  const resize = new ResizeObserver(() => {
    if (page.clientWidth === width && page.clientHeight === height) return;
    if (reduce) build();
    else schedule(build);
  });
  resize.observe(page);

  // Text that rises into place moves off the stars it was measured against.
  const settled = (event: TransitionEvent) => {
    if (event.propertyName === "transform" && (event.target as Element).classList.contains("reveal")) schedule(place);
  };
  document.addEventListener("transitionend", settled);

  return () => {
    live = false;
    resize.disconnect();
    visible.disconnect();
    document.removeEventListener("transitionend", settled);
    cancelAnimationFrame(pending);
    layer.replaceChildren();
  };
}
