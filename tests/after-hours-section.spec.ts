import { expect, test, type Page } from "@playwright/test";

const tools = [
  { name: "Odysseus", href: "https://github.com/pewdiepie-archdaemon/odysseus" },
  { name: "T3 Code", href: "https://github.com/pingdotgg/t3code" },
] as const;

function after(page: Page) {
  return page.locator("section#after");
}

async function boxes(page: Page) {
  const section = after(page);
  // Scroll the panels in so the reveal has settled before measuring.
  await section.locator(".after-pieces").scrollIntoViewIfNeeded();
  await expect(section.locator(".after-pieces")).toHaveCSS("transform", "none");
  return {
    lingkod: (await section.getByRole("article", { name: "Lingkod HR" }).boundingBox())!,
    dots: (await section.getByRole("article", { name: "dots-hyprland" }).boundingBox())!,
    tools: (await section.getByRole("region", { name: "Tools I Use" }).boundingBox())!,
  };
}

// The contrast of a colour against each stop of a panel's gradient.
function statusContrasts(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("#after .after-status")).flatMap((status) => {
      const channels = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const luminance = ([r, g, b]: number[]) => {
        const linear = [r, g, b].map((channel) => {
          const value = channel / 255;
          return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const foreground = luminance(channels(getComputedStyle(status).color));
      const panel = getComputedStyle(status.closest(".after-piece")!).backgroundImage;
      const stops = panel.match(/rgba?\([^)]+\)/g)!;
      return stops.map((stop) => {
        const [lighter, darker] = [foreground, luminance(channels(stop))].sort((a, b) => b - a);
        return (lighter + 0.05) / (darker + 0.05);
      });
    }),
  );
}

test("After hours replaces Personal Projects and the separate Tools I Use region", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("region", { name: "After hours." })).toHaveAttribute(
    "id",
    "after",
  );
  await expect(after(page).getByText(/^What I build when nobody's asked me to\./)).toBeVisible();
  await expect(page.locator("#personal-projects")).toHaveCount(0);
  await expect(page.locator('a[href="/#personal-projects"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Personal Projects" })).toHaveCount(0);
  await expect(page.getByText("Independent work")).toHaveCount(0);
  // Tools I Use lives inside After hours now, and only there.
  await expect(page.getByRole("region", { name: "Tools I Use" })).toHaveCount(1);
  await expect(after(page).getByRole("region", { name: "Tools I Use" })).toBeVisible();

  const order = await after(page)
    .locator("article h3, .after-tools h3")
    .allTextContents();
  expect(order).toEqual(["Lingkod HR", "dots-hyprland", "Tools I use"]);
});

test("the panels carry the settled copy, the credit, and the fork link", async ({ page }) => {
  await page.goto("/");
  const lingkod = page.getByRole("article", { name: "Lingkod HR" });
  const dots = page.getByRole("article", { name: "dots-hyprland" });

  await expect(lingkod.locator(".after-status")).toHaveText("In development, private repository");
  await expect(lingkod.getByRole("list", { name: "Tech stack" }).getByRole("listitem")).toHaveText([
    "Next.js",
    "React",
    "NestJS",
    "PostgreSQL",
    "Prisma",
    "Docker",
  ]);
  await expect(dots.locator(".after-status")).toHaveText("Actively maintained fork");
  await expect(dots.getByRole("heading", { level: 4 })).toHaveText(["From upstream", "Mine"]);
  await expect(dots.locator(".after-credit code")).toHaveText([
    "ml4w-lightcrimson-dotfiles",
    "@systemeror12",
  ]);

  // An iron ring marks what came with the fork, a pink crystal my own work.
  const markers = await dots.locator(".after-voice h4").evaluateAll((headings) =>
    headings.map((heading) => getComputedStyle(heading, "::before").backgroundImage),
  );
  expect(markers[0]).toContain("circle");
  expect(markers[0]).not.toContain("bb6688");
  expect(markers[1]).toContain("bb6688");

  const link = dots.getByRole("link", { name: "Read about the fork" });
  await expect(link).toHaveAttribute("href", "/systems/dots-hyprland");
  await link.click();
  await expect(page).toHaveURL("/systems/dots-hyprland");
});

test("each tool links to its upstream project with a visible focus ring", async ({ page }) => {
  await page.goto("/");
  const region = page.getByRole("region", { name: "Tools I Use" });
  await expect(region.getByRole("heading", { name: "Tools I use" })).toBeVisible();
  await expect(region.getByText("Not my projects. Just always open.")).toBeVisible();
  await expect(region.getByRole("link")).toHaveCount(tools.length);

  for (const tool of tools) {
    const link = region.getByRole("link", { name: `Open ${tool.name} upstream project` });
    await expect(link).toHaveText(`${tool.name} on GitHub`);
    await expect(link).toHaveAttribute("href", tool.href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
  }
});

test("the header link leads to After hours", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  await page.getByRole("link", { name: "After hours", exact: true }).click();
  await expect(page).toHaveURL("/#after");
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.abs(document.getElementById("after")!.getBoundingClientRect().top),
      ),
    )
    .toBeLessThanOrEqual(1);
});

for (const width of [390, 1024, 1440]) {
  test.describe(`at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
    });

    test("the panels sit in their settled places", async ({ page }) => {
      const { lingkod, dots, tools } = await boxes(page);

      if (width > 900) {
        // Lingkod HR on the left with the tools under it; the fork on the right beside both.
        expect(dots.x).toBeGreaterThan(lingkod.x + lingkod.width);
        expect(Math.abs(dots.y - lingkod.y)).toBeLessThan(1);
        expect(tools.x).toBeCloseTo(lingkod.x, 0);
        expect(tools.width).toBeCloseTo(lingkod.width, 0);
        expect(tools.y).toBeGreaterThan(lingkod.y + lingkod.height);
        expect(dots.x).toBeGreaterThan(tools.x + tools.width);
      } else {
        // One column: Lingkod HR, the fork, then the tools.
        for (const box of [dots, tools]) expect(box.x).toBeCloseTo(lingkod.x, 0);
        expect(dots.y).toBeGreaterThan(lingkod.y + lingkod.height);
        expect(tools.y).toBeGreaterThan(dots.y + dots.height);
      }
    });

    test("the tools stack only when their column is narrower than 440px", async ({ page }) => {
      const { tools: column } = await boxes(page);
      const region = page.getByRole("region", { name: "Tools I Use" });
      const first = (await region.locator(".after-tool").nth(0).boundingBox())!;
      const second = (await region.locator(".after-tool").nth(1).boundingBox())!;

      if (column.width <= 440) {
        expect(second.x).toBeCloseTo(first.x, 0);
        expect(second.y).toBeGreaterThan(first.y + first.height);
      } else {
        expect(second.x).toBeGreaterThan(first.x + first.width);
        expect(Math.abs(second.y - first.y)).toBeLessThan(1);
      }
      // 1024px gives the narrow column, 1440px the wide one.
      if (width === 1024) expect(column.width).toBeLessThan(440);
      if (width === 1440) expect(column.width).toBeGreaterThan(440);
    });

    test("From upstream and Mine stack only on phones", async ({ page }) => {
      await boxes(page);
      const voices = page.locator("#after .after-voice");
      const upstream = (await voices.nth(0).boundingBox())!;
      const mine = (await voices.nth(1).boundingBox())!;

      if (width <= 560) {
        expect(mine.x).toBeCloseTo(upstream.x, 0);
        expect(mine.y).toBeGreaterThanOrEqual(upstream.y + upstream.height - 1);
      } else {
        expect(mine.x).toBeGreaterThanOrEqual(upstream.x + upstream.width - 1);
        expect(Math.abs(mine.y - upstream.y)).toBeLessThan(1);
      }
    });

    test("status text meets 4.5:1 on the panels and nothing overflows", async ({ page }) => {
      await boxes(page);
      const contrasts = await statusContrasts(page);
      // Two panels, two gradient stops each.
      expect(contrasts).toHaveLength(4);
      for (const ratio of contrasts) expect(ratio).toBeGreaterThanOrEqual(4.5);

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      const outside = await after(page).evaluate((section) =>
        Array.from(section.querySelectorAll("*"))
          .filter((element) => !element.closest("svg") || element.tagName === "svg")
          .filter((element) => {
            const box = element.getBoundingClientRect();
            return box.width > 0 && (box.left < 0 || box.right > window.innerWidth);
          })
          .map((element) => element.textContent!.trim().slice(0, 40) || element.tagName),
      );
      expect(outside).toEqual([]);
    });
  });
}

test("the section reveals itself, and at once under reduced motion", async ({ page }) => {
  await page.goto("/");
  const pieces = after(page).locator(".after-pieces");
  await expect(pieces).toHaveCSS("opacity", "0");
  await pieces.scrollIntoViewIfNeeded();
  await expect(pieces).toHaveClass(/is-shown/);
  await expect(pieces).toHaveCSS("opacity", "1");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(after(page).locator(".reveal")).toHaveCount(2);
  await expect(after(page).locator(".reveal:not(.is-shown)")).toHaveCount(0);
  for (const element of await after(page).locator(".reveal").all()) {
    await expect(element).toHaveCSS("opacity", "1");
    await expect(element).toHaveCSS("transform", "none");
  }
});
