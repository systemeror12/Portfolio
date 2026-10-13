import { expect, test, type Page } from "@playwright/test";

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
    const dial = document.querySelector<SVGGElement>(".hero-scene .dial")!;
    const ring = dial.querySelector(".dial-ring")!;
    const box = dial.querySelector(".dial-boss")!.getBoundingClientRect();
    const label = document.querySelector(".heart-label")!.getBoundingClientRect();
    return {
      heart: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
      radius: Number(ring.getAttribute("r")),
      label: { left: label.left, right: label.right, top: label.top, bottom: label.bottom },
    };
  });
}

test("the dial has 25 panes of glass, its numerals, rings, ticks, lily, and boss", async ({
  page,
}) => {
  await page.goto("/");
  const scene = page.locator(".hero > svg.hero-scene");
  await expect(scene).toHaveAttribute("aria-hidden", "true");

  const fills = await scene
    .locator(".dial-pane")
    .evaluateAll((panes) => panes.map((pane) => pane.getAttribute("fill")));
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
  await expect(scene.locator(".dial-boss")).toHaveCount(1);
  await expect(scene.locator(".iron-hand-hour")).toHaveCount(1);
  await expect(scene.locator(".iron-hand-minute")).toHaveCount(1);
  // The centre lily is the dial's first drawing, under the panes.
  await expect(scene.locator(".dial > g:first-child path")).not.toHaveCount(0);
});

test("the corner lilies look the same on every load", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const lilies = async () => {
    await page.goto("/");
    return page
      .locator(".hero-scene > g:not(.dial)")
      .evaluateAll((groups) => groups.map((group) => group.outerHTML));
  };
  const first = await lilies();
  expect(first).toHaveLength(2);
  expect(await lilies()).toEqual(first);
});

test("the hands keep Manila time, and the hour hand rests near 25", async ({ page }) => {
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
    expect(await angle(page, ".dial-second-hand")).toBeCloseTo(second, 1);
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

test("on desktop the heart's label sits beside the heart", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const label = page.locator(".hero .heart-label");
  await expect(label).toHaveText("someone, paid right");
  await expect(label).toHaveAttribute("aria-hidden", "true");
  const { heart, label: box } = await dialGeometry(page);
  expect(box.left - heart.x).toBeCloseTo(22, 0);
  expect(box.top - heart.y).toBeCloseTo(14, 0);
});

test("on phones the heart's label is centred under the heart, inside the dial", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const { heart, radius, label } = await dialGeometry(page);
  expect((label.left + label.right) / 2 - heart.x).toBeCloseTo(0, 0);
  expect(label.top).toBeGreaterThan(heart.y);
  // Every corner of the label sits inside the panes' inner ring.
  for (const x of [label.left, label.right]) {
    for (const y of [label.top, label.bottom]) {
      expect(Math.hypot(x - heart.x, y - heart.y)).toBeLessThan(radius * 0.79);
    }
  }
  expect(label.right).toBeLessThanOrEqual(390);
});

test("the scene animates only while the hero is on screen", async ({ page }) => {
  await page.addInitScript(countFrames);
  await page.goto("/");
  const scene = page.locator(".hero-scene");
  await expect(scene.locator(".dial-second-hand")).toBeVisible();
  await expect.poll(() => frames(page)).toBeGreaterThan(10);

  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(scene).toHaveClass(/is-paused/);
  const paused = await frames(page);
  await page.waitForTimeout(500);
  expect(await frames(page)).toBe(paused);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(scene).not.toHaveClass(/is-paused/);
  await expect.poll(() => frames(page)).toBeGreaterThan(paused + 10);
});

test("under reduced motion no frames run and the second hand is hidden", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(countFrames);
  await page.goto("/");
  await expect(page.locator(".hero-scene .dial")).toHaveCount(1);
  await expect(page.locator(".hero-scene .dial-second-hand")).toBeHidden();
  await page.waitForTimeout(1000);
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
  await page.evaluate(() => {
    const scene = document.querySelector(".hero-scene")!;
    const counter = window as unknown as { redraws: number };
    counter.redraws = 0;
    new MutationObserver((records) => {
      for (const record of records) {
        if ([...record.addedNodes].some((node) => node.nodeName === "defs")) counter.redraws++;
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
  await expect(scene).toHaveAttribute("viewBox", /^0 0 1100 /);
  await expect(page.locator(".heart-label")).toHaveCount(1);
});
