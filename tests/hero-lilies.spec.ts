import { expect, test, type Page } from "@playwright/test";

// Every lily and sprig in the bed, with how near its outline comes to the
// dial's heart (in radii) and whether any of its outline touches the copy.
async function bed(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
  return page.evaluate(() => {
    const scene = document.querySelector(".hero-scene")!;
    const dial = scene.querySelector(".dial")!.getAttribute("transform")!;
    const [x, y] = /translate\(([\d.]+) ([\d.]+)\)/.exec(dial)!.slice(1).map(Number);
    const radius = Number(scene.querySelector(".dial-ring")!.getAttribute("r"));
    const origin = scene.getBoundingClientRect();
    const text: DOMRect[] = [...document.querySelectorAll(".hero-actions a")].map((a) => a.getBoundingClientRect());
    for (const element of document.querySelectorAll(".hero-copy *")) {
      for (const node of element.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent!.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        text.push(...range.getClientRects());
      }
    }
    return [...scene.querySelectorAll(".lily")].map((lily) => {
      let nearest = Infinity;
      let onCopy = false;
      for (const path of lily.querySelectorAll("path")) {
        // In page coordinates, as each layer has its own viewport.
        const matrix = path.getScreenCTM()!;
        const total = path.getTotalLength();
        for (let i = 0; i <= 24; i++) {
          const p = path.getPointAtLength((total * i) / 24).matrixTransform(matrix);
          nearest = Math.min(nearest, Math.hypot(p.x - origin.left - x, p.y - origin.top - y) / radius);
          const [px, py] = [p.x, p.y];
          onCopy ||= text.some((k) => px > k.left && px < k.right && py > k.top && py < k.bottom);
        }
      }
      return {
        kind: ["far", "near", "sprig"].find((kind) => lily.classList.contains(`lily-${kind}`)),
        rose: lily.classList.contains("lily-rose"),
        sways: Boolean(lily.querySelector(".lily-sway")),
        nearest,
        onCopy,
      };
    });
  });
}

for (const [width, height, near] of [
  [1280, 800, 15],
  [1440, 900, 18],
  [1760, 1064, 20],
  [1920, 1080, 20],
] as const) {
  test(`at ${width}×${height} the bed holds ${near} near lilies, none crossing the clock or the copy`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const lilies = await bed(page);
    expect(lilies.filter((lily) => lily.kind === "far")).toHaveLength(30);
    expect(lilies.filter((lily) => lily.kind === "near")).toHaveLength(near);
    expect(lilies.filter((lily) => lily.kind === "sprig")).toHaveLength(8);
    expect(lilies.filter((lily) => lily.sways)).toHaveLength(near);
    for (const lily of lilies) {
      // Clear of the dial's outer ring, at 1.03 radii.
      expect(lily.nearest).toBeGreaterThan(1.03);
      expect(lily.onCopy).toBe(false);
    }
  });
}

test("at 1760×1064, 9 of the 20 near lilies are rose glass", async ({ page }) => {
  await page.setViewportSize({ width: 1760, height: 1064 });
  await page.goto("/");
  const near = (await bed(page)).filter((lily) => lily.kind === "near");
  expect(near.filter((lily) => lily.rose)).toHaveLength(9);
});

test("on phones the bed is the corner beyond the dial, and four lilies sway", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const lilies = await bed(page);
  const inBed = lilies.filter((lily) => lily.kind);
  expect(inBed.filter((lily) => lily.kind === "far")).toHaveLength(3);
  expect(inBed.filter((lily) => lily.kind === "near")).toHaveLength(3);
  expect(inBed.filter((lily) => lily.kind === "sprig")).toHaveLength(1);
  expect(inBed.filter((lily) => lily.kind === "near" && lily.rose)).toHaveLength(1);
  // The bed's three near lilies and round 6's lily at the foot.
  expect(lilies.filter((lily) => lily.sways)).toHaveLength(4);
  for (const lily of lilies) expect(lily.nearest).toBeGreaterThan(1.03);
});

test("the bed looks the same on every load", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const lilies = async () => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    return page
      .locator(".hero-scene .lilies-back, .hero-scene .lilies-front")
      .evaluateAll((groups) => groups.map((group) => group.outerHTML));
  };
  const first = await lilies();
  expect(first).toHaveLength(2);
  expect(await lilies()).toEqual(first);
});

test("off screen and under reduced motion the lilies hold still", async ({ page }) => {
  await page.goto("/");
  const states = () =>
    page.evaluate(() =>
      [...document.querySelectorAll(".hero-scene .lily-sway")].flatMap((element) =>
        element.getAnimations().map((animation) => animation.playState),
      ),
    );
  expect(await states()).toContain("running");
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(page.locator(".hero-scene")).toHaveClass(/is-paused/);
  expect(new Set(await states())).toEqual(new Set(["paused"]));

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hero-scene .lily-sway")).not.toHaveCount(0);
  expect(await states()).toEqual([]);
});
