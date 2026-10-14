import { expect, test } from "@playwright/test";

type Box = { left: number; right: number; top: number; bottom: number };

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

for (const [width, height, area, glints] of [
  [1440, 900, 3200, 9],
  [390, 844, 2400, 5],
] as const) {
  test(`at ${width}px star dust covers the hero and ${glints} glints breathe`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const sky = page.locator(".hero > svg.hero-sky");
    await expect(sky).toHaveAttribute("aria-hidden", "true");
    // The sky is its own layer, behind the scene.
    expect(
      await page.evaluate(() => {
        const sky = document.querySelector(".hero-sky")!;
        return sky.compareDocumentPosition(document.querySelector(".hero-scene")!) & Node.DOCUMENT_POSITION_FOLLOWING;
      }),
    ).toBeTruthy();

    const { stars, hero } = await page.evaluate(() => {
      const hero = document.querySelector(".hero")!;
      return {
        hero: { width: hero.clientWidth, height: hero.clientHeight },
        stars: [...document.querySelectorAll(".hero-sky .star")].map((star) => ({
          fill: star.getAttribute("fill"),
          twinkles: star.classList.contains("twinkle"),
        })),
      };
    });
    expect(stars.length).toBe(Math.round((hero.width * hero.height) / area));
    for (const { fill } of stars) {
      expect(["#eef0ff", "#d9d2f0", "#f0b4dc", "#a599d8"]).toContain(fill);
    }
    const twinkling = stars.filter((star) => star.twinkles).length / stars.length;
    expect(twinkling).toBeGreaterThan(0.12);
    expect(twinkling).toBeLessThan(0.21);

    await expect(page.locator(".hero-scene .hero-glints .glint")).toHaveCount(glints);
    // The shipped sparkles are gone.
    await expect(page.locator(".hero-scene .sparkle")).toHaveCount(0);
  });

  test(`at ${width}px no star or glint sits on the copy`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);
    const { lights, text } = await page.evaluate(() => {
      const box = ({ left, right, top, bottom }: DOMRect) => ({ left, right, top, bottom });
      const text: Box[] = [...document.querySelectorAll(".hero-actions a")].map((a) => box(a.getBoundingClientRect()));
      for (const element of document.querySelectorAll(".hero-copy *")) {
        for (const node of element.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE || !node.textContent!.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          text.push(...[...range.getClientRects()].map(box));
        }
      }
      const shown = (element: Element) => !element.closest("[display='none']");
      return {
        text,
        lights: [...document.querySelectorAll(".hero-sky .star, .hero-scene .glint")].filter(shown).map((element) => {
          // Measure the core, not the halo or the twinkle's scale.
          const { left, right, top, bottom } = element.getBoundingClientRect();
          const x = (left + right) / 2;
          const y = (top + bottom) / 2;
          return { left: x - 1, right: x + 1, top: y - 1, bottom: y + 1 };
        }),
      };
    });
    expect(lights.length).toBeGreaterThan(50);
    for (const light of lights) {
      for (const line of text) expect(overlaps(light, line)).toBe(false);
    }
  });
}

test("off screen the stars and glints stop twinkling", async ({ page }) => {
  await page.goto("/");
  const states = () =>
    page.evaluate(() =>
      [...document.querySelectorAll(".hero-sky .twinkle, .hero-scene .glint")].flatMap((element) =>
        element.getAnimations().map((animation) => animation.playState),
      ),
    );
  expect(await states()).toContain("running");
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(page.locator(".hero-sky")).toHaveClass(/is-paused/);
  expect(new Set(await states())).toEqual(new Set(["paused"]));
});
