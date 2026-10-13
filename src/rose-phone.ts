import { hourHand } from "./iron-hands";
import { pane, reducedMotion, ring, roseDefs, type Thread } from "./rose-window";
import { draw } from "./svg";

// PROTOTYPE for #47: three ways to keep the rose window scroll-driven on
// phones, switched with ?rose=a|b|c. Each scene draws the same window as the
// Work section (ring, four panes, the shared hour hand) at a phone's size.
//
// A, the held band: a small whole window pinned at the top of the screen.
// B, the lunette: the top of a large window rising from the foot of the
//    screen. The window turns its lit pane up under a still hand, so the rim
//    text stays at its settled 14px.
// C, the case roses: no pinning. Each case opens on its own window, and the
//    hand is scrubbed by scroll from the last case's pane to this one.

type Pane = ReturnType<typeof pane>;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// The whole window's ring and panes, named with prefix.
function glass(svg: SVGSVGElement, records: string[], prefix: string) {
  svg.innerHTML = roseDefs(prefix);
  ring(draw("g", {}, svg));
  return records.map((text, q) => pane(svg, q, text, { prefix }));
}

function heart(svg: SVGSVGElement, prefix: string) {
  const glow = draw("circle", { r: 60, fill: `url(#${prefix}-glow)` }, svg);
  draw("circle", { r: 7, fill: "#9b8794" }, svg);
  draw("circle", { r: 10, fill: "none", stroke: "#9b8794", "stroke-width": 0.9, opacity: 0.8 }, svg);
  const core = draw("circle", { r: 3.4, fill: "#fff4fb" }, svg);
  return { glow, core };
}

// Lights pane index alone.
function lightPane(panes: Pane[], index: number) {
  panes.forEach((p, q) => p.group.classList.toggle("is-lit", q === index));
}

// Each record of the lit pane eases in from the rim. Returns true as one
// arrives, so the heart can swell.
function travel(threads: Thread[], now: number) {
  let arrived = false;
  for (const thread of threads) {
    if (!thread.length) thread.length = thread.path.getTotalLength();
    const progress = (now / 3200 + thread.offset) % 1;
    if (progress < thread.progress) arrived = true;
    thread.progress = progress;
    const point = thread.path.getPointAtLength(thread.length * progress * progress);
    thread.dot.setAttribute("cx", point.x.toFixed(2));
    thread.dot.setAttribute("cy", point.y.toFixed(2));
    thread.dot.setAttribute("opacity", Math.min(1, progress * 6, (1 - progress) * 10).toFixed(2));
  }
  return arrived;
}

// Calls frame(now) on every animation frame while svg is on screen, and marks
// svg is-paused while it is not. Under reduced motion no frames run. Returns a
// cleanup function.
function whileOnScreen(svg: SVGSVGElement, frame: (now: number) => void) {
  const reduce = window.matchMedia(reducedMotion).matches;
  let id = 0;
  const loop = (now: number) => {
    frame(now);
    id = requestAnimationFrame(loop);
  };
  const visible = new IntersectionObserver(([entry]) => {
    svg.classList.toggle("is-paused", !entry.isIntersecting);
    if (reduce) return;
    if (entry.isIntersecting && !id) id = requestAnimationFrame(loop);
    else if (!entry.isIntersecting) {
      cancelAnimationFrame(id);
      id = 0;
    }
  });
  visible.observe(svg);
  return () => {
    visible.disconnect();
    cancelAnimationFrame(id);
  };
}

// Thickens the threads and records so they still read at a phone's size.
function bolden(panes: Pane[], dot: number, line: number) {
  for (const p of panes) {
    for (const thread of p.threads) {
      thread.dot.setAttribute("r", String(dot));
      thread.path.setAttribute("stroke-width", String(line));
    }
  }
}

// A: the whole window, small, for the band pinned at the top of the screen.
// light(index) lights a pane and swings the hand to it.
export function drawBandRose(svg: SVGSVGElement, records: string[]) {
  svg.setAttribute("viewBox", "-262 -262 524 524");
  const panes = glass(svg, records, "band");
  bolden(panes, 11, 3);
  const hand = draw("g", { class: "rose-hand" }, svg);
  hourHand(hand, 150, -90);
  const { glow, core } = heart(svg, "band");

  let active = 0;
  let pulse = 0;
  const stop = whileOnScreen(svg, (now) => {
    if (travel(panes[active].threads, now)) pulse = 1;
    pulse *= 0.95;
    glow.setAttribute("r", (58 + pulse * 22 + Math.sin(now / 700) * 4).toFixed(2));
    core.setAttribute("r", (3.4 + pulse * 3).toFixed(2));
  });

  return {
    light(index: number) {
      active = index;
      lightPane(panes, index);
      hand.style.transform = `rotate(${index * 90 + 45}deg)`;
    },
    cleanup() {
      stop();
      svg.replaceChildren();
    },
  };
}

// B: the top of the window, rising from the foot of the screen at full size,
// so its rim text keeps the settled 14px. It drops the 25-hour ring to keep
// the strip low. The glass turns its lit pane up under the hand, which stays
// pointing up.
export function drawLunette(svg: SVGSVGElement, records: string[], visible: number) {
  svg.setAttribute("viewBox", `-262 -226 524 ${visible}`);
  svg.innerHTML = roseDefs("lunette");
  // The void behind the glass, so the cases scrolling under it don't show.
  draw("circle", { r: 222, fill: "#06060b" }, svg);
  const turn = draw("g", { class: "rose-turn" }, svg);
  const panes = records.map((text, q) => pane(turn, q, text, { clockwise: true, prefix: "lunette" }));
  for (const r of [218, 222]) draw("circle", { r, fill: "none", stroke: "#9b8794", "stroke-width": 0.9, opacity: 0.8 }, svg);
  bolden(panes, 3.2, 1.1);
  const hand = draw("g", { class: "rose-hand" }, svg);
  hourHand(hand, 176, -90);

  let active = 0;
  const stop = whileOnScreen(svg, (now) => travel(panes[active].threads, now));

  return {
    light(index: number) {
      active = index;
      lightPane(panes, index);
      turn.style.transform = `rotate(${-(index * 90 + 45)}deg)`;
    },
    cleanup() {
      stop();
      svg.replaceChildren();
    },
  };
}

// C: case q's own window. While it is on screen its hand follows the scroll,
// from the last case's pane (or 25, for the first) when the window enters at
// the foot of the screen, to this case's pane as it nears the middle. The
// pane under the hand lights. Reduced motion shows it already arrived.
export function drawCaseScrub(svg: SVGSVGElement, q: number, records: string[]) {
  svg.setAttribute("viewBox", "-262 -262 524 524");
  const prefix = `scrub-${q}`;
  const panes = glass(svg, records, prefix);
  bolden(panes, 5, 1.4);
  const hand = draw("g", { class: "rose-hand-scrub" }, svg);
  hourHand(hand, 150, -90);
  const { glow, core } = heart(svg, prefix);

  const from = q === 0 ? 0 : (q - 1) * 90 + 45;
  const to = q * 90 + 45;
  let lit = -1;
  function point(angle: number) {
    hand.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    const under = Math.min(3, Math.floor(angle / 90));
    if (under === lit) return;
    lit = under;
    lightPane(panes, under);
  }
  point(to);

  let pulse = 0;
  const stop = whileOnScreen(svg, (now) => {
    const box = svg.getBoundingClientRect();
    const centre = box.top + box.height / 2;
    const progress = Math.min(1, Math.max(0, (innerHeight - centre) / (innerHeight * 0.55)));
    point(from + (to - from) * ease(progress));
    if (travel(panes[lit].threads, now)) pulse = 1;
    pulse *= 0.95;
    glow.setAttribute("r", (58 + pulse * 18 + Math.sin(now / 700) * 4).toFixed(2));
    core.setAttribute("r", (3.4 + pulse * 1.6).toFixed(2));
  });

  return () => {
    stop();
    svg.replaceChildren();
  };
}
