// The hero's moving parts, lifted out of the layers they were drawn in into
// layers of their own, so the compositor moves each with no repaint (ADR 0001,
// Layered scenes, rule 2; #82 sets how the twinkles group). Each part is
// lifted while its layer still fills the hero, so its matrix and box come out
// in the hero's coordinates. A lifted part keeps its look: what its old place
// gave it (its matrix, and for a far twinkle its lily's opacity) goes with it,
// and its own opacity and animation move to the layer that carries it.

export type Box = { l: number; t: number; r: number; b: number };

// Sizes a layer to box, placed relative to origin. An <svg> takes the box as
// its viewBox, so its drawing lands on the same pixels as in the hero.
export function fit(layer: HTMLElement | SVGSVGElement, { l, t, r, b }: Box, origin = { l: 0, t: 0 }) {
  if (layer instanceof SVGSVGElement) layer.setAttribute("viewBox", `${l} ${t} ${r - l} ${b - t}`);
  Object.assign(layer.style, { left: `${l - origin.l}px`, top: `${t - origin.t}px`, width: `${r - l}px`, height: `${b - t}px` });
}

// The box of element's drawing in its layer, to whole pixels, grown by pad.
function boxOf(element: SVGGraphicsElement, pad: number): Box {
  const { x, y, width, height } = element.getBBox();
  const matrix = element.getCTM()!;
  const corners = [
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height],
  ].map(([px, py]) => new DOMPoint(px, py).matrixTransform(matrix));
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  return {
    l: Math.floor(Math.min(...xs) - pad),
    t: Math.floor(Math.min(...ys) - pad),
    r: Math.ceil(Math.max(...xs) + pad),
    b: Math.ceil(Math.max(...ys) + pad),
  };
}

const union = (boxes: Box[]): Box => ({
  l: Math.min(...boxes.map((k) => k.l)),
  t: Math.min(...boxes.map((k) => k.t)),
  r: Math.max(...boxes.map((k) => k.r)),
  b: Math.max(...boxes.map((k) => k.b)),
});

// A layer of the given kind, sized to box, placed relative to origin.
function layer(kind: string, className: string, box: Box, origin?: Box) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("data-layer", kind);
  svg.setAttribute("aria-hidden", "true");
  fit(svg, box, origin);
  return svg;
}

// Moves element into a layer, where it lies just as it did in the hero: if
// its old parents moved it, their matrix becomes its transform.
function move(element: SVGGraphicsElement, into: Element) {
  // getCTM gives an SVGMatrix, which has no isIdentity.
  const { a, b, c, d, e, f } = (element.parentElement as unknown as SVGGraphicsElement).getCTM()!;
  if (a !== 1 || b || c || d !== 1 || e || f) {
    const { a, b, c, d, e, f } = element.getCTM()!;
    element.setAttribute("transform", `matrix(${a} ${b} ${c} ${d} ${e} ${f})`);
  }
  into.append(element);
}

// Hands element's CSS animation delay and opacity to the layer that now
// carries its animation.
function handOver(element: SVGElement, to: HTMLElement | SVGElement) {
  if (element.style.animationDelay) {
    to.style.animationDelay = element.style.animationDelay;
    element.style.removeProperty("animation-delay");
  }
  if (!element.hasAttribute("opacity")) return;
  to.style.opacity = element.getAttribute("opacity")!;
  element.removeAttribute("opacity");
}

// The far lilies' twinkling glitter, one <svg> per phase, which fades as a
// whole. Each twinkle takes its lily's opacity with it, so it dims to 0.08
// of its own opacity, not to 0.08 (#82).
export function liftPhases(from: SVGSVGElement) {
  const phases = new Map<string, SVGCircleElement[]>();
  for (const spark of from.querySelectorAll<SVGCircleElement>(".twinkle")) {
    const delay = spark.style.animationDelay;
    phases.set(delay, [...(phases.get(delay) ?? []), spark]);
  }
  return [...phases].map(([delay, sparks]) => {
    const svg = layer("compositor", "hero-twinkle", union(sparks.map((spark) => boxOf(spark, 1))));
    svg.style.animationDelay = delay;
    for (const spark of sparks) {
      let opacity = 1;
      for (let at: Element | null = spark; at && at !== from; at = at.parentElement) {
        opacity *= Number(at.getAttribute("opacity") ?? 1);
      }
      spark.setAttribute("opacity", opacity.toFixed(4));
      spark.style.removeProperty("animation-delay");
      move(spark, svg);
    }
    return svg;
  });
}

// The dial's shimmering panes of glass, one <svg> each.
export function liftPanes(from: SVGSVGElement) {
  return [...from.querySelectorAll<SVGPathElement>(".glass")].map((pane) => {
    const svg = layer("compositor", "hero-pane", boxOf(pane, 2));
    handOver(pane, svg);
    move(pane, svg);
    return svg;
  });
}

// The swaying lilies. Each becomes an HTML wrapper that the compositor turns
// about the lily's centre, as .lily-sway turned it. It holds the lily, still,
// and over it each of its twinkles in an <svg> of its own, with that
// twinkle's opacity. The wrapper takes the lily's opacity, so the lily and
// its twinkles fade as one, as they did in one group.
export function liftLilies(from: SVGSVGElement) {
  return [...from.querySelectorAll<SVGGElement>(".lily-sway")].map((sway) => {
    const lily = sway.closest<SVGGElement>(".lily")!;
    const { x, y, width, height } = sway.getBBox();
    const pivot = new DOMPoint(x + width / 2, y + height / 2).matrixTransform(sway.getCTM()!);
    const box = boxOf(lily, 4);
    const wrap = document.createElement("div");
    wrap.className = "hero-lily";
    wrap.dataset.layer = "compositor";
    wrap.setAttribute("aria-hidden", "true");
    fit(wrap, box);
    wrap.style.transformOrigin = `${pivot.x - box.l}px ${pivot.y - box.t}px`;
    handOver(sway, wrap);
    handOver(sway.parentElement as unknown as SVGElement, wrap);
    const drawing = layer("still", "hero-lily-drawing", box, box);
    const twinkles = [...sway.querySelectorAll<SVGCircleElement>(".twinkle")].map((spark) => {
      const svg = layer("compositor", "hero-twinkle", boxOf(spark, 1), box);
      handOver(spark, svg);
      move(spark, svg);
      return svg;
    });
    move(lily, drawing);
    wrap.append(drawing, ...twinkles);
    return wrap;
  });
}

// The glints, one <svg> each, which breathes about the glint's centre. Each
// <svg> keeps the class of the group the glint was drawn in.
export function liftGlints(from: SVGSVGElement) {
  return [...from.querySelectorAll<SVGGElement>(".glint")].map((glint) => {
    const at = glint.parentElement as unknown as SVGGElement;
    const box = boxOf(glint, 2);
    const centre = new DOMPoint(0, 0).matrixTransform(glint.getCTM()!);
    const svg = layer("compositor", `hero-glint ${at.parentElement!.getAttribute("class")}`, box);
    svg.style.transformOrigin = `${centre.x - box.l}px ${centre.y - box.t}px`;
    handOver(glint, svg);
    move(at, svg);
    return svg;
  });
}
