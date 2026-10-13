import { expect, test, type Page } from "@playwright/test";

type Box = { left: number; right: number; top: number; bottom: number };

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

// Everything the records promise to keep clear of, in page coordinates.
async function sceneBoxes(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // Let the scene re-place its labels once the fonts have settled.
  await page.waitForTimeout(100);
  return page.evaluate(() => {
    const box = (element: Element) => {
      const { left, right, top, bottom } = element.getBoundingClientRect();
      return { left, right, top, bottom };
    };
    const all = (selector: string) => [...document.querySelectorAll(selector)];
    const shown = (element: Element) => element.getAttribute("display") !== "none";
    const hero = box(document.querySelector(".hero")!);
    const boss = box(document.querySelector(".hero-scene .dial-boss")!);
    const band = document.querySelector<SVGPathElement>(".hero-scene .ribbon-band")!;
    const matrix = band.getScreenCTM()!;
    const length = band.getTotalLength();
    const ribbon = Array.from({ length: 401 }, (_, i) => {
      const point = band.getPointAtLength((length * i) / 400).matrixTransform(matrix);
      return { x: point.x, y: point.y };
    }).filter(({ y }) => y >= hero.top && y <= hero.bottom);
    return {
      hero,
      header: box(document.querySelector(".site-header")!),
      headerText: all(".site-header .identity, .site-header nav a, .site-header .clock")
        .filter((element) => element.getClientRects().length)
        .map(box),
      nav: all(".site-header nav a").filter((a) => a.getClientRects().length).map(box),
      clock: box(document.querySelector(".site-header .clock")!),
      copy: all(".hero-name, .hero h1, .hero-lede, .hero-actions a").map(box),
      heartLabel: box(document.querySelector(".hero .heart-label")!),
      heart: { x: (boss.left + boss.right) / 2, y: (boss.top + boss.bottom) / 2 },
      radius: Number(document.querySelector(".hero-scene .dial-ring")!.getAttribute("r")),
      ribbon,
      ribbonWidth: Number(document.querySelector(".hero-scene .ribbon")!.getAttribute("data-width")),
      labels: all(".hero-scene .record-label").filter(shown).map(box),
      sparkles: all(".hero-scene .sparkle")
        .filter((sparkle) => shown(sparkle.parentElement!))
        .map(box),
    };
  });
}

test("three staves carry notes and four threads carry dots to the heart", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator(".hero > svg.hero-scene");
  await expect(scene).toHaveAttribute("aria-hidden", "true");
  await expect(scene.locator(".record-staff")).toHaveCount(15);
  await expect(scene.locator(".record-note")).toHaveCount(6);
  await expect(scene.locator(".record-thread")).toHaveCount(4);
  await expect(scene.locator(".record-dot")).toHaveCount(4);
  await expect(scene.locator(".record-label")).toHaveCount(7);
  await expect(scene.locator(".ribbon")).toHaveCount(1);
  await expect(scene.locator(".sparkle")).toHaveCount(16);
  await expect(scene.locator(".fragment")).not.toHaveCount(0);
  // Every staff and thread ends at the heart.
  const ends = await scene.locator(".record-thread").evaluateAll((paths) =>
    paths.map((path) => {
      const line = path as SVGPathElement;
      const { x, y } = line.getPointAtLength(line.getTotalLength());
      return { x, y };
    }),
  );
  const dial = await scene.locator(".dial").getAttribute("transform");
  const [, x, y] = /translate\(([\d.]+) ([\d.]+)\)/.exec(dial!)!.map(Number);
  for (const end of ends) {
    expect(end.x).toBeCloseTo(x, 0);
    expect(end.y).toBeCloseTo(y, 0);
  }
});

test("each arrival pulses the heart", async ({ page }) => {
  await page.goto("/");
  const ring = page.locator(".hero-scene .heart-ring");
  await expect
    .poll(() => ring.getAttribute("opacity").then(Number), { timeout: 15_000 })
    .toBeGreaterThan(0.3);
});

for (const [width, height] of [
  [390, 844],
  [1440, 900],
] as const) {
  test(`at ${width}px the ribbon, labels, and sparkles keep clear`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const scene = await sceneBoxes(page);

    // The ribbon stays clear of the header's text.
    expect(scene.ribbon.length).toBeGreaterThan(20);
    for (const text of scene.headerText) {
      for (const { x, y } of scene.ribbon) {
        expect(x > text.left && x < text.right && y > text.top && y < text.bottom).toBe(false);
      }
    }
    const xs = scene.ribbon.map(({ x }) => x);
    if (width < 760) {
      // On phones it curls away to the left, clear of the clock.
      expect(Math.min(...xs)).toBeLessThan(0);
      expect(Math.max(...xs)).toBeLessThan(scene.clock.left);
    } else {
      // On desktop it runs under the links and the clock.
      expect(Math.min(...xs)).toBeLessThan(scene.nav[0].left);
      expect(Math.max(...xs)).toBeGreaterThan(scene.clock.right);
      expect(Math.min(...scene.ribbon.map(({ y }) => y))).toBeGreaterThanOrEqual(scene.header.bottom);
    }

    expect(scene.labels.length).toBeGreaterThan(0);
    scene.labels.forEach((label, i) => {
      for (const block of [...scene.copy, scene.heartLabel, ...scene.labels.slice(i + 1)]) {
        expect(overlaps(label, block)).toBe(false);
      }
      expect(label.left).toBeGreaterThanOrEqual(0);
      expect(label.right).toBeLessThanOrEqual(width);
      // Clear of the ribbon's band.
      for (const { x, y } of scene.ribbon) {
        const gap = Math.hypot(
          Math.max(label.left - x, 0, x - label.right),
          Math.max(label.top - y, 0, y - label.bottom),
        );
        expect(gap).toBeGreaterThan(scene.ribbonWidth / 2);
      }
      // Outside the dial's outer ring.
      const { x, y } = scene.heart;
      const near = Math.hypot(
        Math.max(label.left - x, 0, x - label.right),
        Math.max(label.top - y, 0, y - label.bottom),
      );
      expect(near).toBeGreaterThan(scene.radius * 1.03);
    });

    expect(scene.sparkles.length).toBeGreaterThan(8);
    for (const sparkle of scene.sparkles) {
      for (const block of scene.copy) expect(overlaps(sparkle, block)).toBe(false);
    }
  });
}

test("under reduced motion the notes and dots are hidden and nothing moves", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const scene = page.locator(".hero-scene");
  await expect(scene.locator(".record-staff")).toHaveCount(15);
  for (const mark of await scene.locator(".record-note, .record-dot").all()) {
    await expect(mark).toBeHidden();
  }
  const shapes = () =>
    scene.locator(".record-staff, .record-thread").evaluateAll((paths) => paths.map((path) => path.getAttribute("d")));
  const before = await shapes();
  const running = await scene.evaluate((svg) => svg.getAnimations({ subtree: true }).length);
  expect(running).toBe(0);
  await page.waitForTimeout(1000);
  expect(await shapes()).toEqual(before);
});

test("off screen the records, sparkles, and fragments hold still", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator(".hero-scene");
  const states = () =>
    scene.evaluate((svg) => ({
      shapes: [...svg.querySelectorAll(".record-staff, .record-thread, .record-note, .record-dot")].map(
        (element) => element.getAttribute("d") ?? element.getAttribute("transform") ?? element.getAttribute("cx"),
      ),
      animations: [...svg.querySelectorAll(".sparkle, .fragment")].flatMap((element) =>
        element.getAnimations().map((animation) => animation.playState),
      ),
    }));
  expect((await states()).animations).toContain("running");

  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(scene).toHaveClass(/is-paused/);
  const paused = await states();
  expect(paused.animations.length).toBeGreaterThan(0);
  expect(new Set(paused.animations)).toEqual(new Set(["paused"]));
  await page.waitForTimeout(500);
  expect((await states()).shapes).toEqual(paused.shapes);
});
