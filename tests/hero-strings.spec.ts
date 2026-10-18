import { expect, test, type Page } from "@playwright/test";

// The strings' runs, by layer, and what each layer sits between.
async function strings(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
  return page.evaluate(() => {
    const scene = document.querySelector(".hero-scene")!;
    const layers = ["back", "mid", "near"].map((layer) => scene.querySelector(`.ribbons-${layer}`)!);
    const order = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const dial = scene.querySelector(".dial")!;
    const lilies = scene.querySelector(".lilies-front")!;
    const runs = [...scene.querySelectorAll("[data-string]")];
    const face = scene.querySelector(".dial-face")!;
    return {
      strings: new Set(runs.map((run) => run.getAttribute("data-string"))).size,
      // Behind the dial; between the dial and the front lilies; in front of all.
      layered: order(layers[0], dial) && order(dial, layers[1]) && order(layers[1], lilies) && order(lilies, layers[2]),
      face: {
        fill: face.getAttribute("fill"),
        opacity: Number(face.getAttribute("fill-opacity")),
        r: Number(face.getAttribute("r")),
        behindDial: order(face, dial),
      },
      radius: Number(scene.querySelector(".dial-ring")!.getAttribute("r")),
      masks: scene.querySelectorAll("mask, clipPath").length,
      runs: runs.map((run) => {
        const { left, right, top, bottom } = run.getBoundingClientRect();
        return { left, right, top, bottom };
      }),
      crossings: [...scene.querySelectorAll(".string-glints .glint")].map((glint) => {
        const { left, right, top, bottom } = glint.getBoundingClientRect();
        return { x: (left + right) / 2, y: (top + bottom) / 2 };
      }),
    };
  });
}

test("on desktop four strings are laid in three depths round the smoked dial", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const scene = await strings(page);
  expect(scene.strings).toBe(4);
  expect(scene.layered).toBe(true);
  expect(scene.face).toEqual({ fill: "#06060b", opacity: 0.42, r: expect.closeTo(scene.radius * 1.03, 1), behindDial: true });
  // The records' own ribbon gives way to the strings.
  await expect(page.locator(".hero-scene .ribbon")).toHaveCount(0);
});

test("on desktop the X crosses just right of the heading's first line, and glints there", async ({ page }) => {
  await page.setViewportSize({ width: 1740, height: 1000 });
  await page.goto("/");
  const scene = await strings(page);
  const head = await page.evaluate(() => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector(".hero h1")!);
    const lines = [...range.getClientRects()].filter((rect) => rect.width);
    const top = Math.min(...lines.map((rect) => rect.top));
    const first = lines.filter((rect) => rect.top < top + 8);
    return {
      right: Math.max(...first.map((rect) => rect.right)),
      top,
      bottom: Math.max(...first.map((rect) => rect.bottom)),
    };
  });
  const x = { x: head.right + 28, y: head.top + 0.45 * (head.bottom - head.top) };
  expect(scene.crossings.some(({ x: cx, y: cy }) => Math.hypot(cx - x.x, cy - x.y) < 6)).toBe(true);
});

test("the strings run behind the copy unbroken, and a halo keeps the words clear", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const scene = await strings(page);
  expect(scene.masks).toBe(0);
  for (const selector of [".hero-name", ".hero h1", ".hero-lede", ".hero-action-line"]) {
    await expect(page.locator(selector)).toHaveCSS("text-shadow", /rgb\(6, 6, 11\) 0px 0px 3px/);
  }
  await expect(page.locator(".hero-action-solid")).toHaveCSS("text-shadow", "none");
});

test("on phones three strings stay above the copy", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const scene = await strings(page);
  expect(scene.strings).toBe(3);
  const copy = await page.locator(".hero-name").evaluate((name) => name.getBoundingClientRect().top);
  for (const run of scene.runs) expect(run.bottom).toBeLessThan(copy);
});

test("when a record lands, a pink run plays along the strings", async ({ page }) => {
  await page.goto("/");
  const lit = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll(".hero-scene .key-lamps path:not(.hero-pin)")].filter(
          (lamp) => Number(lamp.getAttribute("fill-opacity")) > 0,
        ).length,
    );
  await expect.poll(lit, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect(page.locator(".hero-scene .key-lamps path:not(.hero-pin)").first()).toHaveAttribute("fill", "#f0b4dc");
});

test("under reduced motion no run plays", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  await page.clock.runFor(20_000);
  const lit = await page.evaluate(
    () =>
      [...document.querySelectorAll(".hero-scene .key-lamps path:not(.hero-pin)")].filter(
        (lamp) => Number(lamp.getAttribute("fill-opacity")) > 0,
      ).length,
  );
  expect(lit).toBe(0);
});
