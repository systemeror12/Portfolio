import { expect, test, type Page } from "@playwright/test";
import { loopInWorker, loopOnMain, loopState } from "./hero-loop";

// Manila keeps UTC+8 all year.
const manila = (time: string) => new Date(`2026-10-12T${time}+08:00`);

// Counts every animation frame the page asks for.
const countFrames = () => {
  const request = window.requestAnimationFrame.bind(window);
  (window as unknown as { frames: number }).frames = 0;
  window.requestAnimationFrame = (callback) => {
    (window as unknown as { frames: number }).frames++;
    return request(callback);
  };
};
const frames = (page: Page) =>
  page.evaluate(() => (window as unknown as { frames: number }).frames);

const angle = (page: Page, selector: string) =>
  page
    .locator(`.hero-scene ${selector}`)
    .getAttribute("transform")
    .then((transform) => Number(/rotate\((-?[\d.]+)\)/.exec(transform!)![1]));

// The heart and the dial's radius, in page coordinates.
async function dialGeometry(page: Page) {
  return page.evaluate(() => {
    const ring = document.querySelector(".hero-scene .dial-ring")!;
    const [, x, y] = /translate\(([\d.]+) ([\d.]+)\)/.exec(document.querySelector(".hero-scene .dial")!.getAttribute("transform")!)!.map(Number);
    const hero = document.querySelector(".hero")!.getBoundingClientRect();
    return { heart: { x: hero.left + x, y: hero.top + y }, radius: Number(ring.getAttribute("r")) };
  });
}

test("the dial has 25 panes of glass, its numerals, rings, ticks, lily, and boss", async ({
  page,
}) => {
  await page.goto("/");
  const scene = page.locator(".hero > .hero-scene");
  await expect(scene).toHaveAttribute("aria-hidden", "true");

  // The glass panes shimmer in layers of their own, so panes are read in
  // the order of their hours.
  const fills = await scene
    .locator(".dial-pane")
    .evaluateAll((panes) =>
      panes
        .sort((a, b) => Number(a.getAttribute("data-pane")) - Number(b.getAttribute("data-pane")))
        .map((pane) => pane.getAttribute("fill")),
    );
  expect(fills).toHaveLength(25);
  fills.forEach((fill, k) => {
    if (k === 0) expect(fill).toBe("#7a4870");
    else if (k % 5 === 0) expect(fill).toBe("#5b4680");
    else expect(["#7a4870", "#5b4680"]).not.toContain(fill);
  });

  const numerals = await scene.locator(".dial-numeral").allTextContents();
  expect(numerals).toEqual(["25", ...Array.from({ length: 24 }, (_, k) => String(k + 1))]);
  await expect(scene.locator(".dial-ring")).toHaveCount(4);
  await expect(scene.locator(".dial-tick")).toHaveCount(125);
  await expect(scene.locator(".iron-hand-hour")).toHaveCount(1);
  await expect(scene.locator(".iron-hand-minute")).toHaveCount(1);
  // The centre lily lies at the dial's heart, under the panes.
  await expect(scene.locator(".dial-heart > g path")).not.toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        document.querySelector(".dial-heart")!.compareDocumentPosition(document.querySelector(".dial-pane")!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ),
  ).toBeTruthy();
});

test("the hands keep Manila time, and the hour hand rests near 25", async ({ page }) => {
  // The loop draws the second hand by the page's faked clock on the main
  // thread; in a worker it would keep the real time.
  await page.addInitScript(loopOnMain);
  for (const [time, hour, minute, second] of [
    // 25:20:30: the hour hand has crept a third of a pane past 25.
    ["01:20:30", -90 + (20 / 60) * 14.4, -90 + (20.5 / 60) * 360, 90],
    ["13:59:00", -90 + (59 / 60) * 14.4, -90 + (59 / 60) * 360, -90],
    ["09:00:15", -90, -90 + (0.25 / 60) * 360, 0],
  ] as const) {
    await page.clock.setFixedTime(manila(time));
    await page.goto("/");
    expect(await angle(page, ".iron-hand-hour")).toBeCloseTo(hour, 1);
    expect(await angle(page, ".iron-hand-minute")).toBeCloseTo(minute, 1);
    expect((await loopState(page)).second).toBeCloseTo(second, 1);
    expect(hour).toBeGreaterThanOrEqual(-90);
    expect(hour).toBeLessThan(-90 + 14.4);
  }
  // The hour hand is 0.56 of the radius, the minute hand 0.72.
  const { radius } = await dialGeometry(page);
  for (const [selector, length] of [
    [".iron-hand-hour", 0.56],
    [".iron-hand-minute", 0.72],
  ] as const) {
    await expect(page.locator(`.hero-scene ${selector} > g`)).toHaveAttribute(
      "transform",
      new RegExp(`scale\\(${((radius * length) / 100).toFixed(3)} `),
    );
  }
});

test("the dial is bare: no words under its heart, no lily on its rim", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero .heart-label")).toHaveCount(0);
  await expect(page.locator(".hero")).not.toContainText("someone, paid right");
  // Inside the dial, only its own heart lily blooms.
  await expect(page.locator(".hero-scene .dial .lily")).toHaveCount(0);
});

test("the scene animates only while the hero is on screen", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator(".hero-scene");
  const frames = async () => (await loopState(page)).frames;
  expect((await loopState(page)).secondShown).toBe(true);
  await expect.poll(frames).toBeGreaterThan(10);

  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(scene).toHaveClass(/is-paused/);
  await page.waitForTimeout(100);
  const paused = await frames();
  await page.waitForTimeout(500);
  expect(await frames()).toBe(paused);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(scene).not.toHaveClass(/is-paused/);
  await expect.poll(frames).toBeGreaterThan(paused + 10);
});

test("the loop draws in a worker, so the page runs no animation frames of its own", async ({ page }) => {
  await page.addInitScript(countFrames);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(await loopInWorker(page)).toBe(true);
  const before = await frames(page);
  const drawn = (await loopState(page)).frames;
  await page.waitForTimeout(1000);
  expect(await frames(page)).toBe(before);
  expect((await loopState(page)).frames).toBeGreaterThan(drawn + 10);
  // And the clockwork it draws moves: the second hand sweeps.
  const shot = () => page.locator(".hero-scene > canvas[data-band=clockwork]").screenshot();
  const first = await shot();
  await page.waitForTimeout(500);
  expect((await shot()).equals(first)).toBe(false);
});

test("under reduced motion no frames run and the second hand is hidden", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(countFrames);
  await page.goto("/");
  await expect(page.locator(".hero-scene .dial")).toHaveCount(1);
  await page.waitForTimeout(1000);
  const { frames: drawn, secondShown } = await loopState(page);
  expect({ drawn, secondShown }).toEqual({ drawn: 0, secondShown: false });
  expect(await frames(page)).toBe(0);
});

test("under reduced motion the dial updates every 15 seconds", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: manila("09:10:40") });
  await page.clock.pauseAt(manila("09:10:50"));
  await page.goto("/");
  const minute = () => angle(page, ".iron-hand-minute");
  const start = -90 + ((10 + 50 / 60) / 60) * 360;
  expect(await minute()).toBeCloseTo(start, 1);
  await page.clock.runFor(10_000);
  expect(await minute()).toBeCloseTo(start, 1);
  await page.clock.runFor(5_000);
  expect(await minute()).toBeCloseTo(start + (15 / 3600) * 360, 1);
});

test("a resize redraws the scene once and leaves no second copy", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  // The scene redraws once its fonts settle; count only what follows.
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const scene = document.querySelector(".hero-scene")!;
    const counter = window as unknown as { redraws: number };
    counter.redraws = 0;
    new MutationObserver((records) => {
      for (const record of records) {
        // Each redraw adds one layer holding the defs.
        if ([...record.addedNodes].some((node) => node instanceof Element && node.querySelector("defs"))) counter.redraws++;
      }
    }).observe(scene, { childList: true });
  });
  const redraws = () => page.evaluate(() => (window as unknown as { redraws: number }).redraws);

  await page.setViewportSize({ width: 1100, height: 800 });
  await expect.poll(redraws).toBe(1);
  await page.waitForTimeout(300);
  expect(await redraws()).toBe(1);

  const scene = page.locator(".hero-scene");
  await expect(scene.locator(".dial")).toHaveCount(1);
  await expect(scene.locator("defs")).toHaveCount(1);
  await expect(scene.locator(".dial-pane")).toHaveCount(25);
  await expect(scene.locator("> canvas[data-band=clockwork]")).toHaveCSS("width", "1100px");
  expect((await loopState(page)).size?.width).toBe(1100);
  await expect(scene.locator(".lilies-front")).toHaveCount(1);
  await expect(page.locator(".night-sky")).toHaveCount(1);
});
