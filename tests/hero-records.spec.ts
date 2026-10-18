import { expect, test } from "@playwright/test";
import { loopState } from "./hero-loop";

// The records are drawn by the hero's loop, on canvas (ADR 0002), so these
// read what it reports.

test("three staves carry notes and four threads carry dots to the heart", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator(".hero > .hero-scene");
  await expect(scene).toHaveAttribute("aria-hidden", "true");
  await page.evaluate(() => document.fonts.ready);
  const { records } = await loopState(page);
  const staves = records.filter((record) => record.kind === "staff");
  const threads = records.filter((record) => record.kind === "thread");
  expect(staves.map(({ lines, carries }) => [lines, carries])).toEqual([[5, 2], [5, 2], [5, 2]]);
  expect(threads.map(({ lines, carries }) => [lines, carries])).toEqual([[1, 1], [1, 1], [1, 1], [1, 1]]);
  // The scene carries no words and no note tiles.
  await expect(scene.locator(".record-label")).toHaveCount(0);
  await expect(scene.locator(".fragment")).toHaveCount(0);
  await expect(scene.locator("text:not(.dial-numeral)")).toHaveCount(0);
  // Every staff and thread ends at the heart.
  const dial = await scene.locator(".dial").getAttribute("transform");
  const [, x, y] = /translate\(([\d.]+) ([\d.]+)\)/.exec(dial!)!.map(Number);
  for (const { end } of records) {
    expect(end.x).toBeCloseTo(x, 0);
    expect(end.y).toBeCloseTo(y, 0);
  }
});

test("each arrival pulses the heart", async ({ page }) => {
  await page.goto("/");
  await expect
    .poll(async () => (await loopState(page)).ringOpacity, { timeout: 15_000 })
    .toBeGreaterThan(0.3);
});

test("under reduced motion the notes and dots are hidden and nothing moves", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const before = await loopState(page);
  expect(before.records).toHaveLength(7);
  for (const record of before.records) expect(record.marks).toEqual([]);
  const running = await page.locator(".hero-scene").evaluate((scene) => scene.getAnimations({ subtree: true }).length);
  expect(running).toBe(0);
  await page.waitForTimeout(1000);
  const after = await loopState(page);
  expect(after.frames).toBe(0);
  expect(after.records).toEqual(before.records);
});

test("off screen the records hold still", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator(".hero-scene");
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(scene).toHaveClass(/is-paused/);
  // The loop may finish the frame it was drawing.
  await page.waitForTimeout(100);
  const paused = await loopState(page);
  await page.waitForTimeout(500);
  const later = await loopState(page);
  expect(later.running).toBe(false);
  expect(later.frames).toBe(paused.frames);
  expect(later.records).toEqual(paused.records);
});
