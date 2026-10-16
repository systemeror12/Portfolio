import { expect, test, type Page } from "@playwright/test";

const routes = [
  ["/", "Every record ends with a person."],
  ["/work/multi-company-hris", "Multi-Company HRIS"],
  ["/work/ai-odoo-rnd", "AI R&D Case Study"],
  ["/work/payment-provider", "Payment Provider Module"],
  ["/work/public-sector-hris", "Government Water District HRIS"],
  ["/systems/dots-hyprland", "Evolving my previous Hyprland desktop"],
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
  });

  test("no text falls under 4.5:1 contrast against any pixel behind it", async ({ page }) => {
    // Reduced motion shows every section at once, so none is checked mid-fade.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    // Text scrolls under sticky bars, such as the phone lunette, and is read
    // once it clears them. A full-page capture would freeze a bar over it, so
    // hold each bar where it sits in the flow, which moves nothing else.
    await page.evaluate(() => {
      for (const element of document.querySelectorAll<HTMLElement>("body *")) {
        if (getComputedStyle(element).position === "sticky") element.style.position = "relative";
      }
    });

    // Where each line of text sits and what colour it paints.
    const texts = await page.evaluate(() =>
      Array.from(document.querySelectorAll("body *"))
        .filter((element) => !element.closest("svg, [aria-hidden='true'], .skip-link") && element.checkVisibility())
        .flatMap((element) => {
          const [r, g, b, a = 1] = getComputedStyle(element).color.match(/[\d.]+/g)!.map(Number);
          return Array.from(element.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim())
            .flatMap((node) => {
              const range = document.createRange();
              range.selectNodeContents(node);
              return Array.from(range.getClientRects()).map((rect) => ({
                text: node.textContent!.trim().slice(0, 40),
                colour: { r, g, b, a },
                box: { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height },
              }));
            });
        }),
    );
    expect(texts.length).toBeGreaterThan(0);

    // The page with its text taken away, so only what sits behind the text is drawn.
    await page.addStyleTag({
      content: "* { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }",
    });
    const backdrop = (await page.screenshot({ fullPage: true, scale: "css" })).toString("base64");

    const failures = await page.evaluate(
      async ({ backdrop, texts }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${backdrop}`;
        await image.decode();
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        const luminance = (r: number, g: number, b: number) => {
          const [lr, lg, lb] = [r, g, b].map((channel) => {
            const value = channel / 255;
            return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
        };

        return texts.flatMap(({ text, colour, box }) => {
          const x = Math.max(0, Math.floor(box.x));
          const y = Math.max(0, Math.floor(box.y));
          const width = Math.min(image.width - x, Math.ceil(box.width));
          const height = Math.min(image.height - y, Math.ceil(box.height));
          if (width <= 0 || height <= 0) return [];
          const pixels = context.getImageData(x, y, width, height).data;
          let worst = Infinity;
          for (let i = 0; i < pixels.length; i += 4) {
            const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
            const fore = luminance(
              colour.r * colour.a + r * (1 - colour.a),
              colour.g * colour.a + g * (1 - colour.a),
              colour.b * colour.a + b * (1 - colour.a),
            );
            const back = luminance(r, g, b);
            worst = Math.min(worst, (Math.max(fore, back) + 0.05) / (Math.min(fore, back) + 0.05));
          }
          return worst < 4.5 ? [`${text} (${worst.toFixed(2)})`] : [];
        });
      },
      { backdrop, texts },
    );
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
    expect(targets.map(({ id }) => id)).toEqual(["after", "method", "contact"]);

    for (const { name, id } of targets) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await openMenu(page);
      await page.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(`/#${id}`);
      await expect(page.locator(`section#${id}`)).toBeInViewport();
    }
  });
});
