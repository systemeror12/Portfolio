import { expect, test, type Page } from "@playwright/test";
import { lowContrastText } from "./contrast";

// The hero on a tablet, 760 to 1279px wide: the copy at the top, the dial
// below and right of it, whole on screen and clear of the copy, the bed round
// it, and every string under every lily.
async function scene(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
  return page.evaluate(() => {
    const hero = document.querySelector(".hero")!;
    const svg = document.querySelector(".hero-scene")!;
    const origin = hero.getBoundingClientRect();
    const dial = svg.querySelector(".dial")!.getAttribute("transform")!;
    const [x, y] = /translate\(([\d.]+) ([\d.]+)\)/.exec(dial)!.slice(1).map(Number);
    const radius = Number(svg.querySelector(".dial-ring")!.getAttribute("r"));
    const local = (r: DOMRect) => ({ l: r.left - origin.left, t: r.top - origin.top, r: r.right - origin.left, b: r.bottom - origin.top });
    const text = [...hero.querySelectorAll(".hero-actions a")].map((a) => local(a.getBoundingClientRect()));
    for (const element of hero.querySelectorAll(".hero-copy *")) {
      for (const node of element.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent!.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        text.push(...[...range.getClientRects()].map(local));
      }
    }
    const lede = local(hero.querySelector(".hero-lede")!.getBoundingClientRect());
    const order = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const runs = [...svg.querySelectorAll("[data-string]")];
    const lilies = [...svg.querySelectorAll(".lily")];
    return {
      heart: { x, y },
      radius,
      width: origin.width,
      height: origin.height,
      heroBottom: origin.bottom + scrollY,
      lede,
      // How near the dial's outer ring comes to any line of the copy.
      gap: Math.min(...text.map((k) => Math.hypot(Math.max(k.l - x, 0, x - k.r), Math.max(k.t - y, 0, y - k.b)))) - 1.03 * radius,
      strings: new Set(runs.map((run) => run.getAttribute("data-string"))).size,
      underLilies: lilies.length > 0 && runs.every((run) => lilies.every((lily) => order(run, lily))),
      glints: [...svg.querySelectorAll(".hero-glints > g")].map((glint) => {
        const [gx, gy] = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(glint.getAttribute("transform")!)!.slice(1).map(Number);
        return Math.hypot(gx - x, gy - y) / radius;
      }),
      pageWidth: document.documentElement.scrollWidth,
    };
  });
}

for (const [width, height, radius] of [
  [768, 1024, 230],
  [820, 1180, 246],
  [1024, 1366, 300],
  [1024, 768, 187],
] as const) {
  test(`at ${width}×${height} the dial sits whole below and right of the copy`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const s = await scene(page);
    expect(s.radius).toBeGreaterThan(radius - 10);
    expect(s.radius).toBeLessThan(radius + 10);
    // Its outer ring stays 20px inside the hero and 32px clear of the copy.
    const ring = 1.03 * s.radius;
    expect(s.heart.x - ring).toBeGreaterThanOrEqual(19);
    expect(s.heart.x + ring).toBeLessThanOrEqual(s.width - 19);
    expect(s.heart.y + ring).toBeLessThanOrEqual(s.height - 19);
    expect(s.gap).toBeGreaterThanOrEqual(31);
    // Its heart is below the paragraph.
    expect(s.heart.y).toBeGreaterThan(s.lede.b);
    // The hero ends at the bottom of the screen.
    expect(Math.abs(s.heroBottom - height)).toBeLessThan(2);
    expect(s.pageWidth).toBe(width);
  });

  test(`at ${width}×${height} four strings run under every lily, and no glint sits on the dial`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const s = await scene(page);
    expect(s.strings).toBe(4);
    expect(s.underLilies).toBe(true);
    for (const distance of s.glints) expect(distance).toBeGreaterThan(1.15);
  });
}

for (const [width, height] of [
  [768, 1024],
  [820, 1180],
] as const) {
  test(`at ${width}×${height} the paragraph keeps 4.5:1 against the strings behind it`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const { lines, failures } = await lowContrastText(page, ".hero-lede");
    expect(lines).toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });
}

test("in landscape the paragraph narrows to leave the dial room", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  const width = await page.locator(".hero-lede").evaluate((lede) => lede.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(0.58 * 1024 + 1);
});

test("on desktop the strings still weave among the lilies", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const s = await scene(page);
  expect(s.underLilies).toBe(false);
});
