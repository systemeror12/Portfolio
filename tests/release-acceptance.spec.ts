import { expect, test, type Page } from "@playwright/test";
import { lowContrastText } from "./contrast";
import { routes } from "./public-routes";

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

test.describe("the homepage at release", () => {
  // Counts every animation frame the page asks for.
  const countFrames = () => {
    const request = window.requestAnimationFrame.bind(window);
    (window as unknown as { frames: number }).frames = 0;
    window.requestAnimationFrame = (callback) => {
      (window as unknown as { frames: number }).frames++;
      return request(callback);
    };
  };

  // Scrolls from top to bottom and back, so every scene draws and every
  // section reveals.
  async function readThrough(page: Page) {
    await page.evaluate(async () => {
      await document.fonts.ready;
      const settle = () => new Promise((resolve) => setTimeout(resolve, 50));
      for (let top = 0; top < document.documentElement.scrollHeight; top += innerHeight / 2) {
        window.scrollTo({ top, behavior: "instant" });
        await settle();
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      await settle();
    });
  }

  // Opens the phone menu when the header's links sit behind it.
  async function openMenu(page: Page) {
    const menuButton = page.getByRole("button", { name: "Open navigation" });
    if (await menuButton.isVisible()) await menuButton.click();
  }

  for (const width of [1440, 390]) {
    test(`at ${width}px it logs no errors and does not overflow`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });

      await page.goto("/");
      await readThrough(page);

      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      // The In Progress cards stay inside the screen too.
      const outside = await page.locator("section#in-progress article").evaluateAll((cards) =>
        cards.filter((card) => {
          const box = card.getBoundingClientRect();
          return box.left < 0 || box.right > window.innerWidth;
        }).length,
      );
      expect(outside).toBe(0);
      expect(errors).toEqual([]);
    });
  }

  test("under reduced motion it settles with nothing moving and everything shown", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(countFrames);
    await page.goto("/");
    await readThrough(page);

    await page.evaluate(() => ((window as unknown as { frames: number }).frames = 0));
    await page.waitForTimeout(1000);
    const still = await page.evaluate(() => ({
      frames: (window as unknown as { frames: number }).frames,
      running: document
        .getAnimations()
        .filter((animation) => animation.playState === "running")
        .map((animation) => (animation.effect as KeyframeEffect).target?.getAttribute("class")),
    }));
    expect(still).toEqual({ frames: 0, running: [] });

    const hidden = await page.evaluate(() =>
      Array.from(document.querySelectorAll("main *, footer *"))
        .filter(
          (element) =>
            !element.closest("svg, [aria-hidden='true']") &&
            Array.from(element.childNodes).some(
              (node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim(),
            ) &&
            !element.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
        )
        .map((element) => element.textContent!.trim().slice(0, 40)),
    );
    expect(hidden).toEqual([]);
    // In Progress is among the sections shown at once.
    await expect(page.locator("section#in-progress .reveal")).toHaveCount(2);
    await expect(page.locator("section#in-progress .reveal:not(.is-shown)")).toHaveCount(0);
  });

  test("no text falls under 4.5:1 contrast against any pixel behind it", async ({ page }) => {
    // Reduced motion shows every section at once, so none is checked mid-fade.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const { lines, failures } = await lowContrastText(page);
    expect(lines).toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });

  test("it has one header and one main, labelled sections, and hidden decoration", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);

    const sections = await page.locator("section").all();
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) await expect(section).toHaveAccessibleName(/\S/);

    // Every drawing on the homepage is decoration.
    const exposed = await page.evaluate(() =>
      Array.from(document.querySelectorAll("svg"))
        .filter((svg) => !svg.closest("[aria-hidden='true']"))
        .map((svg) => svg.outerHTML.slice(0, 80)),
    );
    expect(exposed).toEqual([]);
  });

  test("each of the header's section links reaches its section", async ({ page }) => {
    await page.goto("/");
    await openMenu(page);
    const links = page.getByRole("navigation", { name: "Primary navigation" }).locator("a[href*='#']");
    const targets = await links.evaluateAll((anchors) =>
      anchors.map((anchor) => ({ name: anchor.textContent!, id: anchor.getAttribute("href")!.split("#")[1] })),
    );
    expect(targets.map(({ id }) => id)).toEqual(["in-progress", "after", "method", "contact"]);

    for (const { name, id } of targets) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await openMenu(page);
      await page.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(`/#${id}`);
      await expect(page.locator(`section#${id}`)).toBeInViewport();
    }
  });
});
