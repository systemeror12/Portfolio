// What the hero's scene is laid out from: its size, the dial, and where the
// copy sits, all in the hero's coordinates.

export type Point = { x: number; y: number };
export type Box = { l: number; t: number; r: number; b: number };
export type HeroLayout = {
  width: number;
  height: number;
  heart: Point;
  radius: number;
  mobile: boolean;
  tablet: boolean;
  reduce: boolean;
  hero: HTMLElement;
};

const local = (hero: Element) => {
  const origin = hero.getBoundingClientRect();
  return (r: DOMRect, pad = 0): Box => ({
    l: r.left - origin.left - pad,
    t: r.top - origin.top - pad,
    r: r.right - origin.left + pad,
    b: r.bottom - origin.top + pad,
  });
};

// The boxes of a node's lines of text.
const lineRects = (node: Node) => {
  const range = document.createRange();
  range.selectNodeContents(node);
  return [...range.getClientRects()];
};

// The box of every line of the copy's text, and of its buttons.
export function textLines(hero: Element, pad: number): Box[] {
  const box = local(hero);
  const rects = [...hero.querySelectorAll(".hero-actions a")].map((a) => a.getBoundingClientRect());
  for (const element of hero.querySelectorAll(".hero-copy *")) {
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent!.trim()) rects.push(...lineRects(node));
    }
  }
  return rects.map((rect) => box(rect, pad));
}

// Where the copy sits: its left edge, the name line, the heading's first
// line and each of its lines, the lede, and the buttons.
export function copyFrame(hero: Element) {
  const box = local(hero);
  const bound = (boxes: Box[]): Box => ({
    l: Math.min(...boxes.map((k) => k.l)),
    t: Math.min(...boxes.map((k) => k.t)),
    r: Math.max(...boxes.map((k) => k.r)),
    b: Math.max(...boxes.map((k) => k.b)),
  });
  const lines = (selector: string) =>
    lineRects(hero.querySelector(selector)!)
      .filter((rect) => rect.width)
      .map((rect) => box(rect));
  const heading = lines(".hero-copy h1");
  const top = Math.min(...heading.map((k) => k.t));
  return {
    left: box(hero.querySelector(".hero-copy")!.getBoundingClientRect()).l,
    name: bound(lines(".hero-name")),
    head: bound(heading.filter((k) => k.t < top + 8)),
    heading,
    lede: bound(lines(".hero-lede")),
    actions: bound([...hero.querySelectorAll(".hero-actions a")].map((a) => box(a.getBoundingClientRect()))),
  };
}

// Hides each item whose reach r about x, y would sit on the copy.
export function hideOnCopy(hero: Element, items: { element: Element; x: number; y: number; r: number }[]) {
  const text = textLines(hero, 8);
  for (const { element, x, y, r } of items) {
    const on = text.some((k) => x + r > k.l && x - r < k.r && y + r > k.t && y - r < k.b);
    element.setAttribute("display", on ? "none" : "inline");
  }
}

// How far a point is from a box (0 inside it).
export const away = (x: number, y: number, k: Box) =>
  Math.hypot(Math.max(k.l - x, 0, x - k.r), Math.max(k.t - y, 0, y - k.b));

// On a tablet, 760 to 1279px wide, the copy comes first, at the top, and the
// dial sits below and right of it: the largest that fits whole on the
// screen, its outer ring (1.03R) 20px inside the hero's edges and 32px clear
// of every line of the copy, with its heart below the paragraph. Of the
// places that hold within 3% of the largest, it takes the one nearest 0.6W
// across, midway between the buttons and the foot.
export function tabletDial(hero: Element, W: number, H: number) {
  const f = copyFrame(hero);
  const edge = 20;
  const gap = 32;
  const ring = 1.03;
  const cap = Math.min(300, 0.3 * W);
  const copy = [f.name, ...f.heading, f.lede, f.actions];
  const prefer = [0.6 * W, (f.actions.b + H) / 2];
  const spots: { x: number; y: number; r: number }[] = [];
  for (let x = edge; x < W - edge; x += 6) {
    for (let y = edge; y < H - edge; y += 6) {
      if (y < f.lede.b) continue;
      const room = Math.min(x - edge, W - edge - x, y - edge, H - edge - y, ...copy.map((k) => away(x, y, k) - gap)) / ring;
      const r = Math.min(cap, room);
      if (r > 0) spots.push({ x, y, r });
    }
  }
  const most = Math.max(...spots.map((s) => s.r));
  const from = (s: { x: number; y: number }) => Math.hypot(s.x - prefer[0], s.y - prefer[1]);
  // A hero too short to hold a dial below the copy still gets a small one.
  const best = spots.filter((s) => s.r >= most * 0.97).sort((a, b) => from(a) - from(b))[0] ?? { x: prefer[0], y: H - 60, r: 40 };
  return { heart: { x: best.x, y: best.y }, radius: best.r };
}
