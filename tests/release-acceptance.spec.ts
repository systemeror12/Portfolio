import { expect, test } from "@playwright/test";

const routes = [
  ["/", "Order for systems that cannot stop."],
  ["/work/multi-company-hris", "Multi-Company HRIS"],
  ["/work/ai-odoo-rnd", "AI R&D Case Study"],
  ["/work/payment-provider", "Payment Provider Module"],
  ["/systems/dots-hyprland", "Evolving a Hyprland desktop into my daily platform"],
] as const;

test("every public route loads directly without horizontal overflow", async ({
  page,
}) => {
  for (const [path, heading] of routes) {
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
  }
});

test("mobile navigation closes on Escape and preserves keyboard context", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only behavior");
  await page.goto("/work/multi-company-hris");
  const menuButton = page.getByRole("button");

  await menuButton.focus();
  await menuButton.press("Enter");
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("link", { name: "Case study", exact: true }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(menuButton).toBeFocused();
});

test("the navigation identifies the current route and returns visitors home", async ({
  page,
}) => {
  await page.goto("/work/payment-provider");
  const menuButton = page.getByRole("button");

  if (await menuButton.isVisible()) await menuButton.click();
  await expect(
    page.getByRole("link", { name: "Integration", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole("link", { name: "Back to home" }).click();
  await expect(page).toHaveURL("/");
  if (await menuButton.isVisible()) await menuButton.click();
  await expect(
    page.getByRole("link", { name: "Home", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("reduced motion disables nonessential transitions on every route", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const [path] of routes) {
    await page.goto(path);
    await expect
      .poll(() =>
        page.evaluate(
          () => getComputedStyle(document.documentElement).scrollBehavior,
        ),
      )
      .toBe("auto");
    await expect
      .poll(() =>
        page.evaluate(() =>
          Array.from(document.querySelectorAll("*")).every((element) => {
            const style = getComputedStyle(element);
            return style.animationDuration === "0s" && style.transitionDuration === "0s";
          }),
        ),
      )
      .toBe(true);
  }
});

test("public routes contain none of the explicitly excluded public claims", async ({
  page,
}) => {
  const excludedClaims = [
    /Confidential Scale/i,
    /Payfusion/i,
    /\bphone number\b/i,
    /\bstreet address\b/i,
    /production-ready/i,
    /100% accurate/i,
    /unrestricted vector search/i,
    /sk_live|api[_ -]?key|secret=/i,
  ];

  for (const [path] of routes) {
    await page.goto(path);
    const publicText = await page.locator("body").innerText();
    for (const excludedClaim of excludedClaims) {
      expect(publicText).not.toMatch(excludedClaim);
    }
  }
});
