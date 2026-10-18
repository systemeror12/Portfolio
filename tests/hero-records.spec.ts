import { expect, test } from "@playwright/test";

test("three staves carry notes and four threads carry dots to the heart", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator(".hero > .hero-scene");
  await expect(scene).toHaveAttribute("aria-hidden", "true");
  await expect(scene.locator(".record-staff")).toHaveCount(15);
  await expect(scene.locator(".record-note")).toHaveCount(6);
  await expect(scene.locator(".record-thread")).toHaveCount(4);
  await expect(scene.locator(".record-dot")).toHaveCount(4);
  // The scene carries no words and no note tiles.
  await expect(scene.locator(".record-label")).toHaveCount(0);
  await expect(scene.locator(".fragment")).toHaveCount(0);
  await expect(scene.locator("text:not(.dial-numeral)")).toHaveCount(0);
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
    .poll(() => ring.getAttribute("stroke-opacity").then(Number), { timeout: 15_000 })
    .toBeGreaterThan(0.3);
});

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
  const running = await scene.evaluate((scene) => scene.getAnimations({ subtree: true }).length);
  expect(running).toBe(0);
  await page.waitForTimeout(1000);
  expect(await shapes()).toEqual(before);
});

test("off screen the records hold still", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator(".hero-scene");
  const shapes = () =>
    scene.evaluate((scene) =>
      [...scene.querySelectorAll(".record-staff, .record-thread, .record-note, .record-dot")].map(
        (element) => element.getAttribute("d") ?? element.getAttribute("transform") ?? element.getAttribute("cx"),
      ),
    );

  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(scene).toHaveClass(/is-paused/);
  const paused = await shapes();
  await page.waitForTimeout(500);
  expect(await shapes()).toEqual(paused);
});
