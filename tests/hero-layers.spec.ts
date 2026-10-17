import { expect, test, type Page } from "@playwright/test";

// The hero's scene is a stack of layers, one <svg> per depth band (ADR 0001,
// Layered scenes), within the budget #81 sets.
const desktop = ["back-lilies", "back-strings", "dial", "records", "glow", "mid-strings", "front-lilies", "near-strings", "glints"];
const tablet = ["back-strings", "dial", "records", "glow", "mid-strings", "near-strings", "back-lilies", "front-lilies", "glints"];

// Every child of the scene, with its band, and its box as a share of the hero.
async function layers(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
  return page.evaluate(() => {
    const scene = document.querySelector(".hero > .hero-scene")!;
    const hero = scene.parentElement!.getBoundingClientRect();
    return [...scene.children].map((layer) => {
      const box = layer.getBoundingClientRect();
      return {
        tag: layer.tagName,
        band: layer.getAttribute("data-layer"),
        hidden: layer.getAttribute("aria-hidden"),
        area: (box.width * box.height) / (hero.width * hero.height),
      };
    });
  });
}

for (const [width, height, order] of [
  [1440, 900, desktop],
  [1920, 1080, desktop],
  [390, 844, desktop],
  [1180, 820, tablet],
  [820, 1180, tablet],
  [844, 390, tablet],
] as const) {
  test(`at ${width}×${height} the scene draws into its layers in depth order`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(".hero > .hero-scene")).toHaveAttribute("aria-hidden", "true");
    const stack = await layers(page);
    expect(stack.map((layer) => layer.band)).toEqual(order);
    for (const layer of stack) expect(layer).toMatchObject({ tag: "svg", hidden: "true" });
  });
}

test.describe("on a tablet at 1180×820 @2x", () => {
  test.use({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });

  test("the layers stay within #81's budget: 160 layers, 8 hero-areas", async ({ page }) => {
    await page.goto("/");
    const stack = await layers(page);
    expect(stack.length).toBeLessThanOrEqual(160);
    expect(stack.reduce((sum, layer) => sum + layer.area, 0)).toBeLessThanOrEqual(8);
  });
});

// Keeps the observers watching the hero, until they are disconnected.
const trackObservers = () => {
  const live = new Set<object>();
  for (const Kind of [ResizeObserver, IntersectionObserver]) {
    const { observe, disconnect } = Kind.prototype;
    Kind.prototype.observe = function (this: ResizeObserver & IntersectionObserver, target: Element, ...rest: []) {
      if (target.matches(".hero")) live.add(this);
      return observe.call(this, target, ...rest);
    };
    Kind.prototype.disconnect = function (this: ResizeObserver & IntersectionObserver) {
      live.delete(this);
      return disconnect.call(this);
    };
  }
  (window as unknown as { heroObservers: Set<object> }).heroObservers = live;
};

test("leaving the homepage removes every layer and disconnects every observer", async ({ page }) => {
  await page.addInitScript(trackObservers);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const watching = () => page.evaluate(() => (window as unknown as { heroObservers: Set<object> }).heroObservers.size);
  expect(await watching()).toBe(2);
  await page.evaluate(() => {
    (window as unknown as { scene: Element }).scene = document.querySelector(".hero-scene")!;
    window.history.pushState({}, "", "/work/multi-company-hris");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.locator(".hero")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { scene: Element }).scene.childElementCount)).toBe(0);
  expect(await watching()).toBe(0);
});
