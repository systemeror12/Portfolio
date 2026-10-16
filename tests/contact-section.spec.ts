import { expect, test, type Page } from "@playwright/test";

function contact(page: Page) {
  return page.locator("section#contact");
}

function box(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
    return { left, right, top, bottom, width, height };
  });
}

test("the coda replaces the contact footer and the header's Contact link reaches it", async ({
  page,
}) => {
  await page.goto("/");
  const section = contact(page);
  await expect(section).toHaveCount(1);
  await expect(page.locator("footer#contact")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /return to top/i })).toHaveCount(0);
  await expect(
    page.getByRole("region", {
      name: "If people depend on what you're building, I'd like to help.",
    }),
  ).toHaveAttribute("id", "contact");

  await expect(page.getByRole("banner").locator('a[href="/#contact"]')).not.toHaveCount(0);
  await page.goto("/#contact");
  await expect(section.getByRole("heading", { level: 2 })).toBeInViewport();

  const footer = page.getByRole("contentinfo");
  await expect(footer).toHaveText(/Jerome Mendoza\s*Made at 25:00, Manila/);
  await expect(page.locator(".contact-final-bar")).toHaveAttribute("aria-hidden", "true");
  const gap = await page.evaluate(
    () =>
      document.querySelector(".site-footer")!.getBoundingClientRect().top -
      document.querySelector(".contact-final-bar")!.getBoundingClientRect().bottom,
  );
  expect(gap).toBeGreaterThanOrEqual(-1);
});

test("the window is decoration, its iron hands both resting on 25", async ({ page }) => {
  await page.goto("/");
  const scene = contact(page).locator(".contact-window-scene");
  await expect(scene).toHaveAttribute("aria-hidden", "true");
  await expect(scene.locator(".iron-hand-hour")).toHaveCount(1);
  await expect(scene.locator(".iron-hand-minute")).toHaveCount(1);

  await scene.scrollIntoViewIfNeeded();
  const hands = await scene.evaluate((svg) => {
    const window = svg.getBoundingClientRect();
    const centre = { x: window.left + window.width / 2, y: window.top + window.height / 2 };
    return [".iron-hand-hour", ".iron-hand-minute"].map((selector) => {
      const hand = svg.querySelector(selector)!.getBoundingClientRect();
      return { x: hand.left + hand.width / 2 - centre.x, top: hand.top - centre.y, bottom: hand.bottom - centre.y, width: window.width };
    });
  });
  for (const hand of hands) {
    // Pointing straight up, at 25: centred on the axis and reaching above it.
    expect(Math.abs(hand.x)).toBeLessThan(hand.width * 0.04);
    expect(hand.top).toBeLessThan(-hand.width * 0.2);
    expect(hand.bottom).toBeLessThan(hand.width * 0.1);
  }
});

test("on wide screens the window sits beside the text", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const window = await box(page, ".contact-window");
  const text = await box(page, ".contact-text");
  expect(window.left).toBeGreaterThan(text.right);
  expect(window.width).toBeLessThanOrEqual(320);
});

for (const width of [390, 360]) {
  test(`at ${width}px the window sits above the heading at 180px, with no overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await contact(page).scrollIntoViewIfNeeded();
    const window = await box(page, ".contact-window");
    const heading = await box(page, "#contact-title");
    expect(window.width).toBeCloseTo(180, 0);
    expect(window.bottom).toBeLessThanOrEqual(heading.top);

    const overflow = await page.evaluate(() => {
      const outside = Array.from(
        document.querySelectorAll("#contact *, .site-footer *"),
      ).filter((element) => {
        const { left, right } = element.getBoundingClientRect();
        return left < -0.5 || right > window.innerWidth + 0.5;
      });
      return {
        scroll: document.documentElement.scrollWidth - window.innerWidth,
        outside: outside.length,
      };
    });
    expect(overflow).toEqual({ scroll: 0, outside: 0 });
  });
}

test("under reduced motion the coda is shown at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const selector of [".contact-window", ".contact-text"]) {
    await expect(page.locator(selector)).toHaveCSS("opacity", "1");
    await expect(page.locator(selector)).toHaveCSS("transform", "none");
  }
});
