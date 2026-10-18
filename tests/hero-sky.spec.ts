import { expect, test } from "@playwright/test";

type Box = { left: number; right: number; top: number; bottom: number };

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const dust = ["#eef0ff", "#d9d2f0", "#f0b4dc", "#a599d8"];
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

for (const [width, height, area, glints] of [
  [1440, 900, 3200, 9],
  [390, 844, 2400, 5],
] as const) {
  test(`at ${width}px the page's star dust covers the hero and ${glints} glints breathe`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    // The hero has no sky of its own; the page's sky lies behind it.
    await expect(page.locator(".hero-sky")).toHaveCount(0);
    await expect(page.locator(".night-sky")).toHaveAttribute("aria-hidden", "true");

    const { stars, bands, root, hero } = await page.evaluate(() => {
      const box = document.querySelector(".hero")!.getBoundingClientRect();
      return {
        root: document.getElementById("root")!.clientWidth,
        bands: [...document.querySelectorAll<HTMLElement>(".night-sky-band")].map((band) => band.offsetHeight),
        hero: [...document.querySelectorAll(".night-sky .star")].filter((star) => {
          const { left, right, top, bottom } = star.getBoundingClientRect();
          const [x, y] = [(left + right) / 2, (top + bottom) / 2];
          return x >= box.left && x < box.right && y >= box.top && y < box.bottom;
        }).length,
        stars: [...document.querySelectorAll<HTMLElement | SVGElement>(".night-sky .star")].map((star) => ({
          fill: star.getAttribute("fill") ?? star.style.background,
          twinkles: star.classList.contains("twinkle"),
        })),
      };
    });
    // One star per area, band by band, down the whole page.
    expect(stars.length).toBe(bands.reduce((sum, tall) => sum + Math.round((root * tall) / area), 0));
    for (const { fill } of stars) {
      expect([...dust, ...dust.map(rgb)]).toContain(fill);
    }
    const twinkling = stars.filter((star) => star.twinkles).length / stars.length;
    expect(twinkling).toBeGreaterThan(0.12);
    expect(twinkling).toBeLessThan(0.21);
    // The hero shows its share, less the stars kept off the copy.
    expect(hero).toBeGreaterThan(((width * height) / area) * 0.5);

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
      const hero = document.querySelector(".hero")!.getBoundingClientRect();
      const shown = (element: Element) =>
        !element.closest("[display='none']") && getComputedStyle(element).display !== "none";
      return {
        text,
        lights: [...document.querySelectorAll(".night-sky .star, .hero-scene .glint")]
          .filter(shown)
          .map((element) => {
            // Measure the core, not the halo or the twinkle's scale.
            const { left, right, top, bottom } = element.getBoundingClientRect();
            const x = (left + right) / 2;
            const y = (top + bottom) / 2;
            return { left: x - 1, right: x + 1, top: y - 1, bottom: y + 1 };
          })
          .filter((light) => light.top < hero.bottom),
      };
    });
    expect(lights.length).toBeGreaterThan(50);
    for (const light of lights) {
      for (const line of text) expect(overlaps(light, line)).toBe(false);
    }
  });
}

test("the sky runs the length of the page, and its stars twinkle a few svgs at a time", async ({ page }) => {
  await page.goto("/");
  const sky = await page.evaluate(() => {
    const bands = [...document.querySelectorAll(".night-sky-band")];
    return {
      sky: document.querySelector(".night-sky")!.getBoundingClientRect().height,
      page: document.getElementById("root")!.getBoundingClientRect().height,
      // A star fading on its own would repaint its band, and the hero over
      // it, every frame. Only whole svgs fade.
      animated: [...document.querySelectorAll(".night-sky *")].filter((element) => element.getAnimations().length)
        .map((element) => element.tagName.toLowerCase()),
      perBand: Math.max(...bands.map((band) => band.querySelectorAll(":scope > svg.twinkles").length)),
      stray: document.querySelectorAll(".night-sky .twinkle:not(svg.twinkles > .twinkle)").length,
    };
  });
  expect(sky.sky).toBe(sky.page);
  expect(sky.perBand).toBe(4);
  expect(new Set(sky.animated)).toEqual(new Set(["svg"]));
  expect(sky.stray).toBe(0);
});

test("off screen the stars and glints stop twinkling", async ({ page }) => {
  await page.goto("/");
  const top = page.locator(".night-sky-band").first();
  const states = () =>
    page.evaluate(() =>
      [...document.querySelectorAll(".night-sky-band:first-child .twinkles, .hero-scene .hero-glint")].flatMap((element) =>
        element.getAnimations().map((animation) => animation.playState),
      ),
    );
  expect(await states()).toContain("running");
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(top).toHaveClass(/is-paused/);
  await expect(page.locator(".hero-scene")).toHaveClass(/is-paused/);
  // The glints hold; the sky's band drops its animations altogether.
  expect(await states()).not.toContain("running");
});
