import { expect, test, type Page } from "@playwright/test";

const cases = [
  { title: "Multi-Company HRIS", served: "HR and payroll teams" },
  { title: "Payment Provider Module", served: "customers at checkout" },
  { title: "Access-Scoped Retrieval", served: "employees asking questions" },
  { title: "Government Water District HRIS", served: "the water district's staff" },
] as const;

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

// Scrolls so the middle of the nth case sits at the middle of the viewport.
async function readCase(page: Page, index: number) {
  await page.evaluate((index) => {
    const box = document.querySelectorAll("#work .work-case")[index].getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + box.top + box.height / 2 - innerHeight / 2, behavior: "instant" });
  }, index);
}

// Where each record dot is now.
const records = (page: Page) =>
  page
    .locator(".rose-window .rose-record")
    .evaluateAll((dots) => dots.map((dot) => `${dot.getAttribute("cx")},${dot.getAttribute("cy")}`));

test.describe("on a wide screen", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("the case at the middle of the viewport lights its pane, turns the hand, and names who it served", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const rose = page.locator("#work .work-rose");
    await expect(rose).toHaveAttribute("aria-hidden", "true");
    // The hand is the shared iron hour hand.
    await expect(rose.locator(".rose-hand > .iron-hand-hour")).toHaveCount(1);

    for (const [index, item] of cases.entries()) {
      await readCase(page, index);
      await expect(rose.locator(".rose-pane").nth(index)).toHaveClass(/is-lit/);
      await expect(rose.locator(".rose-pane.is-lit")).toHaveCount(1);
      await expect(rose.locator(".work-rose-for")).toHaveText(`for ${item.served}`);
      await expect(page.getByRole("article", { name: item.title, exact: true })).toHaveClass(/is-lit/);
      await expect(page.locator("#work .work-case.is-lit")).toHaveCount(1);
      await expect(rose.locator(".rose-hand")).toHaveAttribute(
        "style",
        `transform: rotate(${index * 90 + 45}deg);`,
      );
    }
  });

  test("the window stays beside the cases as they scroll", async ({ page }) => {
    await page.goto("/");
    for (const index of [0, 3]) {
      await readCase(page, index);
      const rose = (await page.locator(".rose-window").boundingBox())!;
      const article = (await page.locator("#work .work-case").nth(index).boundingBox())!;
      expect(rose.x + rose.width).toBeLessThanOrEqual(article.x);
      expect(rose.y).toBeGreaterThanOrEqual(0);
      expect(rose.y + rose.height).toBeLessThanOrEqual(800);
    }
  });

  test("the rim text is 14px, medium, haloed, never dimmed, upright, and fits its arc", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await readCase(page, 0);
    await expect(page.locator(".rose-pane").first()).toHaveClass(/is-lit/);

    const labels = await page.locator(".rose-window .rose-records").evaluateAll((texts) =>
      texts.map((text) => {
        const label = text as SVGTextElement;
        const arc = document.querySelector<SVGPathElement>(
          label.querySelector("textPath")!.getAttribute("href")!,
        )!;
        const style = getComputedStyle(label);
        // How much the text is dimmed by itself and everything above it.
        let opacity = 1;
        for (let node: Element | null = label; node && node.tagName !== "svg"; node = node.parentElement) {
          opacity *= Number(getComputedStyle(node).opacity);
        }
        const last = label.getNumberOfChars() - 1;
        return {
          lit: label.closest(".rose-pane")!.classList.contains("is-lit"),
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          fill: style.fill,
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          paintOrder: style.paintOrder,
          opacity,
          length: label.getComputedTextLength(),
          arc: arc.getTotalLength(),
          rotation: label.getRotationOfChar(Math.floor(last / 2)),
          start: label.getStartPositionOfChar(0).x,
          end: label.getEndPositionOfChar(last).x,
        };
      }),
    );

    expect(labels).toHaveLength(4);
    for (const [index, label] of labels.entries()) {
      expect(label.lit).toBe(index === 0);
      expect(label.fontSize).toBe("14px");
      expect(label.fontWeight).toBe("500");
      expect(label.stroke).toBe("rgb(6, 6, 11)");
      expect(label.strokeWidth).toBe("3px");
      expect(label.paintOrder).toMatch(/^stroke/);
      expect(label.opacity).toBe(1);
      // Silver on the lit pane, mist on the others.
      expect(label.fill).toBe(index === 0 ? "rgb(236, 232, 244)" : "rgb(154, 143, 171)");
      expect(label.length).toBeGreaterThan(0);
      expect(label.length).toBeLessThanOrEqual(label.arc);
      // Upright: it reads left to right, never tipped past the vertical.
      expect(label.end).toBeGreaterThan(label.start);
      expect(Math.abs(label.rotation)).toBeLessThan(90);
    }
  });

  test("the window animates only while it is on screen", async ({ page }) => {
    await page.goto("/");
    const scene = page.locator(".rose-window");
    // Below the hero, out of sight, the window waits.
    await expect(scene).toHaveClass(/is-paused/);
    const still = await records(page);
    await page.waitForTimeout(300);
    expect(await records(page)).toEqual(still);

    await readCase(page, 0);
    await expect(scene).not.toHaveClass(/is-paused/);
    const first = await records(page);
    await expect.poll(() => records(page)).not.toEqual(first);

    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(scene).toHaveClass(/is-paused/);
    const paused = await records(page);
    await page.waitForTimeout(500);
    expect(await records(page)).toEqual(paused);

    await readCase(page, 1);
    await expect(scene).not.toHaveClass(/is-paused/);
    await expect.poll(() => records(page)).not.toEqual(paused);
  });

  test("with reduced motion the records stay still and no animation frames run", async ({
    page,
  }) => {
    await page.addInitScript(countFrames);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    for (const [index, item] of cases.entries()) {
      await readCase(page, index);
      await expect(page.locator(".rose-pane").nth(index)).toHaveClass(/is-lit/);
      await expect(page.locator(".work-rose-for")).toHaveText(`for ${item.served}`);
    }
    await page.waitForTimeout(500);
    expect(await frames(page)).toBe(0);

    const dots = await page.locator(".rose-window .rose-record").evaluateAll((elements) =>
      elements.map((dot) => ({ cx: dot.getAttribute("cx"), opacity: dot.getAttribute("opacity") })),
    );
    expect(dots).toHaveLength(16);
    for (const dot of dots) expect(dot).toEqual({ cx: null, opacity: "0" });
    await expect(page.locator(".rose-hand")).toHaveCSS("transition-duration", "0s");
    await expect(page.locator(".rose-pane .rose-glass").first()).toHaveCSS("transition-duration", "0s");
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("each case carries a small still rose with its own pane lit, and the big window stays hidden", async ({
    page,
  }) => {
    await page.addInitScript(countFrames);
    await page.goto("/");
    await expect(page.locator("#work .work-rose")).toBeHidden();

    const articles = page.locator("#work .work-case");
    for (const index of cases.keys()) {
      await readCase(page, index);
      const mini = articles.nth(index).locator(":scope > svg.work-case-rose");
      await expect(mini).toBeVisible();
      await expect(mini).toHaveAttribute("aria-hidden", "true");
      const box = (await mini.boundingBox())!;
      expect(box.width).toBeCloseTo(96, 0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      await expect(mini.locator(".rose-case-pane")).toHaveCount(4);
      await expect(mini.locator(".rose-case-pane").nth(index)).toHaveClass(/is-lit/);
      await expect(mini.locator(".rose-case-pane.is-lit")).toHaveCount(1);
    }
    // The hidden window never starts its loop.
    await expect(page.locator(".rose-window")).toHaveClass(/is-paused/);
    const dots = await records(page);
    await page.waitForTimeout(300);
    expect(await records(page)).toEqual(dots);
  });
});
