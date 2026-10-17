import { expect, test, type Page } from "@playwright/test";

// Hands the page's animation frames and clock to the test: frames run only
// when the test steps the clock to a time, and that time is the page's
// performance.now.
const crankFrames = () => {
  const crank = window as unknown as { now: number; step: (now: number) => void };
  const queue = new Map<number, FrameRequestCallback>();
  let id = 0;
  crank.now = 0;
  performance.now = () => crank.now;
  window.requestAnimationFrame = (callback) => {
    queue.set(++id, callback);
    return id;
  };
  window.cancelAnimationFrame = (handle) => void queue.delete(handle);
  crank.step = (now) => {
    crank.now = now;
    const due = [...queue.values()];
    queue.clear();
    due.forEach((callback) => callback(now));
  };
};

// The glow, ring, core, and bloom the pulse drives.
const heart = (page: Page) =>
  page.evaluate(() => {
    const scene = document.querySelector(".hero-scene")!;
    const ring = scene.querySelector(".heart-ring")!;
    return {
      // The glow lies just under the ring, and the core just over it.
      glow: Number(ring.previousElementSibling!.getAttribute("r")),
      ring: Number(ring.getAttribute("r")),
      ringOpacity: Number(ring.getAttribute("opacity")),
      core: Number(ring.nextElementSibling!.getAttribute("r")),
      bloom: Number(scene.querySelector(".dial > g:first-child")!.getAttribute("opacity")),
    };
  });

// Steps the page's frames at rate a second after one time up to another,
// both in milliseconds on the page's clock.
const run = (page: Page, rate: number, from: number, to: number) =>
  page.evaluate(
    ({ rate, from, to }) => {
      const { step } = window as unknown as { step: (now: number) => void };
      for (let k = 1; from + (k * 1000) / rate <= to + 1e-6; k++) step(from + (k * 1000) / rate);
    },
    { rate, from, to },
  );

// A record reaches the heart at 9 s on the page's clock, the only arrival
// between 8.75 s and 9.75 s.
const arrival = 9000;

async function open(page: Page) {
  await page.addInitScript(crankFrames);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  // The scene's own watch on the hero fires first and asks for the loop.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        new IntersectionObserver((_, watch) => {
          watch.disconnect();
          resolve();
        }).observe(document.querySelector(".hero")!),
      ),
  );
}

for (const rate of [60, 200]) {
  test(`at ${rate} frames a second the pulse fades by the clock`, async ({ page }) => {
    await open(page);
    await run(page, rate, 8750, arrival);
    expect(await heart(page)).toMatchObject({ ringOpacity: 0.6, core: 4.6, bloom: 1 });
    // A 60th of a second keeps 96% of the pulse, as each frame did at 60 Hz.
    let since = 0;
    for (const after of [50, 100, 250, 500, 750]) {
      await run(page, rate, arrival + since, arrival + after);
      since = after;
      const pulse = 0.96 ** ((after * 60) / 1000);
      const shown = await heart(page);
      expect(shown.ring).toBeCloseTo(10 + (1 - pulse) * 30, 6);
      expect(shown.ringOpacity).toBe(Number((pulse * 0.6).toFixed(2)));
      expect(shown.core).toBeCloseTo(3.2 + pulse * 1.4, 6);
      expect(shown.bloom).toBe(Number((0.85 + pulse * 0.15).toFixed(2)));
      const breathe = (Math.sin((arrival + after) / 1000 * 1.4) + 1) / 2;
      expect(shown.glow).toBeCloseTo(130 + breathe * 18 + pulse * 30, 6);
    }
  });
}

test("the pulse picks up where it paused when the hero comes back on screen", async ({ page }) => {
  await open(page);
  await run(page, 60, 8750, arrival + 200);
  const paused = await heart(page);

  const scene = page.locator(".hero-scene");
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(scene).toHaveClass(/is-paused/);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(scene).not.toHaveClass(/is-paused/);

  // Five seconds on, records have reached the heart off screen, and the
  // first frame back shows the pulse as it was, without a flash.
  await run(page, 60, 14_200 - 1000 / 60, 14_200);
  const { glow: _glow, ...back } = await heart(page);
  const { glow: _paused, ...before } = paused;
  expect(back).toEqual(before);
  // Then it fades on from there.
  await run(page, 60, 14_200, 14_200 + 1000 / 60);
  expect((await heart(page)).core).toBeCloseTo(3.2 + (before.core - 3.2) * 0.96, 6);
});
