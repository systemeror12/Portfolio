import { expect, test, type Page } from "@playwright/test";

const routes = [
  "/",
  "/work/multi-company-hris",
  "/work/ai-odoo-rnd",
  "/work/payment-provider",
  "/work/public-sector-hris",
  "/systems/dots-hyprland",
] as const;

const caseStudyRoutes = routes.filter((route) => route !== "/");

function loadedFontFamilies(page: Page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return Array.from(document.fonts)
      .filter((font) => font.status === "loaded")
      .map((font) => font.family.replace(/["']/g, ""));
  });
}

function contrastRatio(page: Page, foreground: string, background: string) {
  return page.evaluate(
    ([fg, bg]) => {
      const channels = (value: string) => {
        const probe = document.createElement("span");
        probe.style.color = value;
        document.body.append(probe);
        const rgb = getComputedStyle(probe).color.match(/[\d.]+/g)!.map(Number);
        probe.remove();
        return rgb;
      };
      const luminance = ([r, g, b]: number[]) => {
        const linear = [r, g, b].map((channel) => {
          const value = channel / 255;
          return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const [lighter, darker] = [luminance(channels(fg)), luminance(channels(bg))].sort(
        (a, b) => b - a,
      );
      return (lighter + 0.05) / (darker + 0.05);
    },
    [foreground, background],
  );
}

test("display text uses Shippori Mincho and body text Zen Kaku Gothic New", async ({
  page,
}) => {
  for (const route of ["/", "/work/multi-company-hris"]) {
    await page.goto(route);
    await expect
      .poll(() => loadedFontFamilies(page))
      .toEqual(expect.arrayContaining(["Shippori Mincho", "Zen Kaku Gothic New"]));

    const families = await page.evaluate(() => ({
      body: getComputedStyle(document.body).fontFamily,
      h1: getComputedStyle(document.querySelector("h1")!).fontFamily,
      h2: getComputedStyle(document.querySelector("h2")!).fontFamily,
    }));
    expect(families.body).toMatch(/^"Zen Kaku Gothic New"/);
    expect(families.h1).toMatch(/^"Shippori Mincho"/);
    expect(families.h2).toMatch(/^"Shippori Mincho"/);
  }
});

test("the page sits on the void and body text on it meets 4.5:1", async ({
  page,
}) => {
  await page.goto("/");
  const colours = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      void: root.getPropertyValue("--void").trim(),
      background: root.backgroundColor,
      body: getComputedStyle(document.body).color,
      tones: ["--silver", "--text", "--text-soft", "--text-muted", "--mist", "--peri", "--glow"].map(
        (name) => [name, root.getPropertyValue(name).trim()] as const,
      ),
    };
  });

  expect(colours.void).toBe("#06060b");
  expect(colours.background).toBe("rgb(6, 6, 11)");
  expect(await contrastRatio(page, colours.body, colours.void)).toBeGreaterThanOrEqual(4.5);
  for (const [name, tone] of colours.tones) {
    expect(
      await contrastRatio(page, tone, colours.void),
      `${name} on the void`,
    ).toBeGreaterThanOrEqual(4.5);
  }
});

test("the skip link appears on focus and moves focus to main", async ({
  page,
}) => {
  for (const route of ["/", "/work/payment-provider"]) {
    await page.goto(route);
    const skipLink = page.getByRole("link", { name: "Skip to content" });

    const hiddenBox = await skipLink.boundingBox();
    expect(hiddenBox!.y + hiddenBox!.height).toBeLessThanOrEqual(0);

    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
    const shownBox = await skipLink.boundingBox();
    expect(shownBox!.y).toBeGreaterThanOrEqual(0);

    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  }
});

test("links and buttons show a visible focus ring", async ({ page }, testInfo) => {
  await page.goto("/work/multi-company-hris");
  const seen = new Set<string>();

  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      const style = getComputedStyle(element);
      return {
        tag: element.tagName,
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth),
      };
    });
    if (focused.tag !== "A" && focused.tag !== "BUTTON") continue;
    seen.add(focused.tag);
    expect(focused.outlineStyle).toBe("solid");
    expect(focused.outlineWidth).toBeGreaterThanOrEqual(2);
  }

  expect(seen).toContain("A");
  if (testInfo.project.name === "mobile") expect(seen).toContain("BUTTON");
});

test("every case-study route fits a 390px screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of caseStudyRoutes) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      route,
    ).toBeLessThanOrEqual(390);
  }
});

test("text on every route meets 4.5:1 against what sits behind it", async ({
  page,
}) => {
  for (const route of routes) {
    await page.goto(route);
    const failures = await page.evaluate(() => {
      const rgba = (value: string) => {
        const [r, g, b, a = 1] = value.match(/[\d.]+/g)!.map(Number);
        return { r, g, b, a };
      };
      const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
        const linear = [r, g, b].map((channel) => {
          const value = channel / 255;
          return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const backdrop = (element: Element) => {
        for (let node: Element | null = element; node; node = node.parentElement) {
          const colour = rgba(getComputedStyle(node).backgroundColor);
          if (colour.a > 0) return colour;
        }
        return rgba(getComputedStyle(document.documentElement).backgroundColor);
      };

      return Array.from(document.body.querySelectorAll("*"))
        .filter(
          (element) =>
            !element.closest("svg, [aria-hidden='true'], .skip-link") &&
            Array.from(element.childNodes).some(
              (node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim(),
            ) &&
            element.getClientRects().length > 0,
        )
        .flatMap((element) => {
          const back = backdrop(element);
          const fore = rgba(getComputedStyle(element).color);
          const blended = {
            r: fore.r * fore.a + back.r * (1 - fore.a),
            g: fore.g * fore.a + back.g * (1 - fore.a),
            b: fore.b * fore.a + back.b * (1 - fore.a),
          };
          const [lighter, darker] = [luminance(blended), luminance(back)].sort((a, b) => b - a);
          const ratio = (lighter + 0.05) / (darker + 0.05);
          return ratio < 4.5
            ? [`${element.textContent!.trim().slice(0, 40)} (${ratio.toFixed(2)})`]
            : [];
        });
    });
    expect(failures, route).toEqual([]);
  }
});
