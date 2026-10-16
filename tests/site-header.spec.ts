import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/work/multi-company-hris",
  "/work/ai-odoo-rnd",
  "/work/payment-provider",
  "/work/public-sector-hris",
  "/systems/dots-hyprland",
] as const;

// Manila keeps UTC+8 all year.
const manila = (time: string) => new Date(`2026-10-12T${time}+08:00`);

test("the Manila clock counts its hours from 05 to 28", async ({ page }) => {
  for (const [time, shown, plain] of [
    ["04:59:00", "28:59", "4:59 AM"],
    ["05:00:00", "05:00", "5:00 AM"],
    ["00:30:00", "24:30", "12:30 AM"],
    ["01:00:00", "25:00", "1:00 AM"],
    ["23:15:00", "23:15", "11:15 PM"],
  ] as const) {
    await page.clock.setFixedTime(manila(time));
    await page.goto("/");
    const clock = page.getByRole("img", { name: `It's ${plain} in Manila` });
    await expect(clock).toBeVisible();
    await expect(clock).toContainText(shown);
  }
});

test("the Manila clock updates every 15 seconds", async ({ page }) => {
  await page.clock.install({ time: manila("04:59:50") });
  await page.goto("/");
  const clock = page.locator("header .clock");
  await expect(clock).toContainText("28:59");

  await page.clock.runFor(10_000);
  await expect(clock).toContainText("28:59");

  await page.clock.runFor(5_000);
  await expect(clock).toContainText("05:00");
  await expect(clock).toHaveAttribute("aria-label", "It's 5:00 AM in Manila");
});

test("the Manila label hides at 560px and below", async ({ page }) => {
  await page.goto("/");
  const label = page.locator("header .clock span");

  await page.setViewportSize({ width: 561, height: 800 });
  await expect(label).toBeVisible();
  await page.setViewportSize({ width: 560, height: 800 });
  await expect(label).toBeHidden();
  await expect(page.locator("header .clock b")).toBeVisible();
});

for (const width of [360, 560, 900, 1061, 1280, 1440]) {
  test(`nothing in the header overflows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });

    for (const route of ["/", "/work/payment-provider"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => {
        const header = document.querySelector("header")!;
        const visible = Array.from(header.querySelectorAll("a, p, button")).filter(
          (element) => element.getClientRects().length > 0,
        );
        const boxes = visible.map((element) => ({
          text: element.textContent!.trim() || element.getAttribute("aria-label"),
          box: element.getBoundingClientRect(),
        }));
        const outside = boxes
          .filter(({ box }) => box.left < 0 || box.right > window.innerWidth)
          .map(({ text }) => `${text} leaves the screen`);
        const overlapping = boxes.flatMap((a, index) =>
          boxes
            .slice(index + 1)
            .filter(
              (b) =>
                a.box.left < b.box.right &&
                b.box.left < a.box.right &&
                a.box.top < b.box.bottom &&
                b.box.top < a.box.bottom,
            )
            .map((b) => `${a.text} overlaps ${b.text}`),
        );
        const wrapped = boxes
          .filter(({ box }) => box.height > 48)
          .map(({ text }) => `${text} wraps`);
        return [
          ...outside,
          ...overlapping,
          ...wrapped,
          ...(header.scrollWidth > header.clientWidth ? ["the header scrolls"] : []),
        ];
      });
      expect(overflow, route).toEqual([]);
    }
  });
}

test("the header sits outside main as the page's one banner", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByRole("banner"), route).toHaveCount(1);
    expect(
      await page.getByRole("banner").evaluate((header) => header.closest("main")),
      route,
    ).toBeNull();
  }
});

test("every header section link points at an id on the homepage", async ({
  page,
}) => {
  await page.goto("/");
  const targets = await page
    .getByRole("banner")
    .locator('a[href*="#"]')
    .evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).hash.slice(1)),
    );

  expect(targets.length).toBeGreaterThan(0);
  for (const id of targets) {
    await expect(page.locator(`[id="${id}"]`), id).toHaveCount(1);
  }
});

test("the In progress link sits before After hours on every route", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    // On phones the links sit behind the menu button.
    const menuButton = page.getByRole("button", { name: "Open navigation" });
    if (await menuButton.isVisible()) await menuButton.click();
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    const link = nav.getByRole("link", { name: "In progress", exact: true });
    await expect(link, route).toHaveAttribute("href", "/#in-progress");
    const names = await nav
      .getByRole("link")
      .evaluateAll((links) => links.map((element) => element.textContent));
    expect(names.indexOf("In progress"), route).toBe(names.indexOf("After hours") - 1);
  }
});
