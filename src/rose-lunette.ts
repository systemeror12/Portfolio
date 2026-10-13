import { hourHand } from "./iron-hands";
import { pane, reducedMotion, roseDefs } from "./rose-window";
import { draw } from "./svg";

// The Work section's scene on phones: the top of the rose window, held at the
// foot of the screen while the cases scroll. It is drawn at full size, so its
// rim text keeps the settled 14px. The glass turns the lit pane up under the
// iron hour hand, which stays pointing up, and the lit pane's records travel
// inward along its threads.

// Draws the lunette into svg, showing only the top `visible` units of the
// window. Returns light(index), which lights a pane and turns it to the top,
// and a cleanup function.
export function drawLunette(svg: SVGSVGElement, records: string[], visible: number) {
  const reduce = window.matchMedia(reducedMotion).matches;
  svg.setAttribute("viewBox", `-262 -226 524 ${visible}`);
  svg.innerHTML = roseDefs("lunette");
  // The void behind the glass, so the cases scrolling under it don't show.
  draw("circle", { r: 222, fill: "#06060b" }, svg);
  const turn = draw("g", { class: "rose-turn" }, svg);
  const panes = records.map((text, q) => pane(turn, q, text, { clockwise: true, prefix: "lunette" }));
  for (const r of [218, 222]) {
    draw("circle", { r, fill: "none", stroke: "#9b8794", "stroke-width": 0.9, opacity: 0.8 }, svg);
  }
  // Thicker records and threads, so they read at a phone's size.
  for (const p of panes) {
    for (const thread of p.threads) {
      thread.dot.setAttribute("r", "3.2");
      thread.path.setAttribute("stroke-width", "1.1");
    }
  }
  const hand = draw("g", { class: "lunette-hand" }, svg);
  hourHand(hand, 176, -90);

  let active = 0;
  // Each record of the lit pane eases in from the rim.
  function tick(now: number) {
    for (const thread of panes[active].threads) {
      if (!thread.length) thread.length = thread.path.getTotalLength();
      const progress = (now / 3200 + thread.offset) % 1;
      const point = thread.path.getPointAtLength(thread.length * progress * progress);
      thread.dot.setAttribute("cx", point.x.toFixed(2));
      thread.dot.setAttribute("cy", point.y.toFixed(2));
      thread.dot.setAttribute("opacity", Math.min(1, progress * 6, (1 - progress) * 10).toFixed(2));
    }
  }

  // Run only while the lunette is on screen. Reduced motion keeps the records
  // hidden and still.
  let frame = 0;
  const loop = (now: number) => {
    tick(now);
    frame = requestAnimationFrame(loop);
  };
  const onScreen = new IntersectionObserver(([entry]) => {
    svg.classList.toggle("is-paused", !entry.isIntersecting);
    if (reduce) return;
    if (entry.isIntersecting && !frame) frame = requestAnimationFrame(loop);
    else if (!entry.isIntersecting) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  onScreen.observe(svg);

  return {
    light(index: number) {
      active = index;
      panes.forEach((p, q) => p.group.classList.toggle("is-lit", q === index));
      turn.style.transform = `rotate(${-(index * 90 + 45)}deg)`;
    },
    cleanup() {
      onScreen.disconnect();
      cancelAnimationFrame(frame);
      svg.replaceChildren();
    },
  };
}
