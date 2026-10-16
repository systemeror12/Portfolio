import { expect, test, type Page } from "@playwright/test";

type Box = { left: number; top: number; right: number; bottom: number };

// Counts every animation frame the page asks for.
const countFrames = () => {
  const request = window.requestAnimationFrame.bind(window);
  (window as unknown as { frames: number }).frames = 0;
  window.requestAnimationFrame = (callback) => {
    (window as unknown as { frames: number }).frames++;
    return request(callback);
  };
};

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const pieces = page.locator("#after .after-pieces");
  await pieces.scrollIntoViewIfNeeded();
  await expect(pieces).toHaveCSS("transform", "none");
}

// The boxes the iron hangs from and the iron's own, in page coordinates.
function measure(page: Page) {
  return page.evaluate(() => {
    const box = (element: Element | Range): Box => {
      const { left, top, right, bottom } = element.getBoundingClientRect();
      return { left, top, right, bottom };
    };
    const section = document.getElementById("after")!;
    const front = section.querySelector(".after-iron-front")!;
    const range = document.createRange();
    range.selectNodeContents(section.querySelector(".after-lingkod .after-status")!);
    return {
      lingkod: box(section.querySelector(".after-lingkod")!),
      desktop: box(section.querySelector(".after-desktop")!),
      plaques: [...section.querySelectorAll(".after-tool")].map(box),
      status: box(range),
      rail: box(front.querySelector(".after-rail")!),
      bar: box(front.querySelector(".after-tool-bar")!),
      // Each hanger's two chains: where they start and where they hang.
      hangers: [...front.querySelectorAll(".after-hanger")].map((hanger) =>
        [...hanger.querySelectorAll(".after-chain")].map(box),
      ),
      bud: box(front.querySelector(".after-bud")!),
      sag: box(section.querySelector(".after-iron-back .after-sag")!),
    };
  });
}

test("the iron is decoration, drawn once into two hidden svgs", async ({ page }) => {
  await open(page, 1440);
  const iron = page.locator("#after svg.after-iron");
  await expect(iron).toHaveCount(2);
  for (const svg of await iron.all()) await expect(svg).toHaveAttribute("aria-hidden", "true");
  const front = page.locator("#after .after-iron-front");
  await expect(front.locator(".after-rail")).toHaveCount(1);
  await expect(front.locator(".after-heart")).toHaveCount(1);
  await expect(front.locator(".after-tool-bar")).toHaveCount(1);
  await expect(front.locator(".after-bud")).toHaveCount(1);
  await expect(front.locator(".after-lotus")).toHaveCount(1);
  // Two panels and three plaques, each on two chains.
  await expect(front.locator(".after-hanger")).toHaveCount(5);
  await expect(front.locator(".after-chain")).toHaveCount(10);
  await expect(page.locator("#after .after-iron-back .after-sag path")).not.toHaveCount(0);
});

for (const width of [360, 390, 1024, 1440, 1920]) {
  test.describe(`at ${width}px`, () => {
    test.beforeEach(({ page }) => open(page, width));

    test("each panel and plaque hangs from whatever is above it", async ({ page }) => {
      const { lingkod, desktop, plaques, rail, bar, hangers } = await measure(page);
      const stacked = (upper: Box, lower: Box) =>
        upper.bottom <= lower.top + 1 && upper.right > lower.left && upper.left < lower.right;
      const above = (panel: Box, list: Box[], base: number) =>
        Math.max(base, ...list.filter((other) => other !== panel && stacked(other, panel)).map((other) => other.bottom));

      const expected = [
        [lingkod, rail.bottom],
        [desktop, above(desktop, [lingkod], rail.bottom)],
        ...plaques.map((plaque) => [plaque, above(plaque, plaques, bar.bottom)] as const),
      ] as const;
      if (width <= 900) expect(expected[1][1]).toBeCloseTo(lingkod.bottom, 0);
      else expect(expected[1][1]).toBeCloseTo(rail.bottom, 0);

      expected.forEach(([panel, hook], k) => {
        expect(hangers[k]).toHaveLength(2);
        for (const chain of hangers[k]) {
          expect(chain.top).toBeCloseTo(hook, 0);
          expect(chain.bottom).toBeLessThanOrEqual(panel.top);
          expect(chain.left).toBeGreaterThan(panel.left);
          expect(chain.right).toBeLessThan(panel.right);
        }
      });
    });

    test("the plaques hang from the tool bar without overlapping", async ({ page }) => {
      const { plaques, bar } = await measure(page);
      expect(plaques).toHaveLength(3);
      const overlap = (a: Box, b: Box) =>
        a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      plaques.forEach((plaque, k) => {
        expect(plaque.top).toBeGreaterThan(bar.bottom);
        for (const other of plaques.slice(k + 1)) expect(overlap(plaque, other)).toBe(false);
      });
    });

    test("the sagging chain stays above the foot of Lingkod HR's panel", async ({ page }) => {
      const { lingkod, sag } = await measure(page);
      expect(sag.bottom).toBeLessThan(lingkod.bottom);
    });

    test("nothing overflows the page", async ({ page }) => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  });
}

test("the lotus never covers the desktop's title", async ({ page }) => {
  for (const width of [360, 390, 834, 1024, 1440, 1920]) {
    await open(page, width);
    const { title, lotus } = await page.evaluate(() => {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector("#after .after-desktop h3")!);
      const box = ({ left, top, right, bottom }: DOMRect) => ({ left, top, right, bottom });
      return {
        title: box(range.getBoundingClientRect()),
        lotus: box(document.querySelector("#after .after-lotus")!.getBoundingClientRect()),
      };
    });
    const clear =
      lotus.right <= title.left ||
      lotus.left >= title.right ||
      lotus.bottom <= title.top ||
      lotus.top >= title.bottom;
    expect(clear, `at ${width}px`).toBe(true);
  }
});

test("on phones the bud hangs above Lingkod HR's panel, clear of the status line", async ({
  page,
}) => {
  await open(page, 390);
  const { lingkod, status, bud } = await measure(page);
  expect(bud.bottom).toBeLessThanOrEqual(lingkod.top);
  expect(bud.bottom).toBeLessThanOrEqual(status.top);
  expect(bud.left).toBeGreaterThan(lingkod.left);
  expect(bud.right).toBeLessThan(lingkod.right);
});

test("charms sway and the bud glows only while the section is on screen", async ({ page }) => {
  await page.goto("/");
  const front = page.locator("#after .after-iron-front");
  const states = () =>
    front.evaluate((svg) => svg.getAnimations({ subtree: true }).map((animation) => animation.playState));
  await expect(front.locator(".after-sway")).toHaveCount(2);
  await expect(front.locator(".after-ember")).toHaveCount(1);

  // Off screen at the top of the page.
  await expect(front).toHaveClass(/is-paused/);
  expect(await states()).toEqual(["paused", "paused", "paused"]);

  await front.scrollIntoViewIfNeeded();
  await expect(front).not.toHaveClass(/is-paused/);
  expect(await states()).toEqual(["running", "running", "running"]);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(front).toHaveClass(/is-paused/);
  expect(await states()).toEqual(["paused", "paused", "paused"]);
});

test("under reduced motion nothing in the iron animates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(countFrames);
  await page.goto("/");
  const front = page.locator("#after .after-iron-front");
  await front.scrollIntoViewIfNeeded();
  await expect(front.locator(".after-bud")).toHaveCount(1);
  await expect(front.locator(".after-sway, .after-ember")).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(
    await page.locator("#after").evaluate((section) => section.getAnimations({ subtree: true }).length),
  ).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { frames: number }).frames)).toBe(0);
});

test("a resize redraws the iron once and leaves no second copy", async ({ page }) => {
  await open(page, 1440);
  await page.evaluate(() => {
    const back = document.querySelector("#after .after-iron-back")!;
    const counter = window as unknown as { redraws: number };
    counter.redraws = 0;
    new MutationObserver((records) => {
      for (const record of records) {
        if ([...record.addedNodes].some((node) => node.nodeName === "defs")) counter.redraws++;
      }
    }).observe(back, { childList: true });
  });
  const redraws = () => page.evaluate(() => (window as unknown as { redraws: number }).redraws);

  await page.setViewportSize({ width: 1100, height: 800 });
  await expect.poll(redraws).toBe(1);
  await page.waitForTimeout(300);
  expect(await redraws()).toBe(1);

  const iron = page.locator("#after");
  await expect(iron.locator(".after-iron-back defs")).toHaveCount(1);
  await expect(iron.locator(".after-iron-back .after-sag")).toHaveCount(1);
  await expect(iron.locator(".after-rail")).toHaveCount(1);
  await expect(iron.locator(".after-hanger")).toHaveCount(5);
});
