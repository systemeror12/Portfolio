import { expect, test, type Page } from "@playwright/test";

const plaques = [
  {
    tools: [{ name: "T3 Code", href: "https://github.com/pingdotgg/t3code" }],
    line: "The workspace where my agent threads, worktrees, and pull requests live.",
  },
  {
    tools: [
      { name: "Claude Code", href: "https://github.com/anthropics/claude-code" },
      { name: "Codex", href: "https://github.com/openai/codex" },
      { name: "OpenCode", href: "https://github.com/anomalyco/opencode" },
    ],
    line: "The coding agents I run inside it, picked per task.",
  },
  {
    tools: [{ name: "Hermes Agent", href: "https://github.com/NousResearch/hermes-agent" }],
    line: "My personal assistant: it flags emails that need a reply and summarizes issues once they're finished.",
  },
] as const;
const tools = plaques.flatMap((plaque) => plaque.tools);
const repositories = [
  ["Open the Caelestia-Xenrya dotfiles", "Dotfiles on GitHub", "https://github.com/systemeror12/caelestia-xenrya"],
  ["Open the Caelestia-Xenrya CLI", "CLI on GitHub", "https://github.com/systemeror12/caelestia-cli-xenrya"],
  ["Open the Caelestia-Xenrya shell", "Shell on GitHub", "https://github.com/systemeror12/caelestia-shell-xenrya"],
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
    desktop: (await section.getByRole("article", { name: "Caelestia-Xenrya" }).boundingBox())!,
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
  await expect(after(page).locator(".after-heading p")).toHaveText(
    "What I build when nobody's asked me to. One is still taking shape. The other is the desktop I'm typing this on.",
  );
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
  expect(order).toEqual(["Lingkod HR", "Caelestia-Xenrya", "Tools I use"]);
});

test("the panels carry the settled copy, the forks, and the Previous Desktop", async ({ page }) => {
  await page.goto("/");
  const lingkod = page.getByRole("article", { name: "Lingkod HR" });
  const desktop = page.getByRole("article", { name: "Caelestia-Xenrya" });

  await expect(lingkod.locator(".after-status")).toHaveText("In development, private repository");
  await expect(lingkod.getByRole("list", { name: "Tech stack" }).getByRole("listitem")).toHaveText([
    "Next.js",
    "React",
    "NestJS",
    "PostgreSQL",
    "Prisma",
    "Docker",
  ]);
  await expect(desktop).toHaveClass(/\bafter-desktop\b/);
  await expect(desktop.locator(".after-status")).toHaveText("Actively maintained fork");
  await expect(desktop.locator("h3 + p")).toHaveText(
    "The Hyprland desktop I'm on every day. I moved to it because its shell is built entirely in Quickshell, which makes my own changes easier to add and the desktop easier to use.",
  );
  await expect(desktop.getByRole("heading", { level: 4 })).toHaveText(["From upstream", "Mine"]);
  await expect(desktop.locator(".after-voice p")).toHaveText([
    "The dotfiles, CLI, and shell, and their design. They aren't mine.",
    "Animated wallpapers across the shell and CLI, settings that stay put, and a safe preview for testing changes.",
  ]);

  // An iron ring marks what came with the fork, a pink crystal my own work.
  const markers = await desktop.locator(".after-voice h4").evaluateAll((headings) =>
    headings.map((heading) => getComputedStyle(heading, "::before").backgroundImage),
  );
  expect(markers[0]).toContain("circle");
  expect(markers[0]).not.toContain("bb6688");
  expect(markers[1]).toContain("bb6688");

  const forks = desktop.getByRole("list", { name: "Caelestia-Xenrya repositories" }).getByRole("link");
  await expect(forks).toHaveCount(repositories.length);
  for (const [name, text, href] of repositories) {
    const link = desktop.getByRole("link", { name });
    await expect(link).toHaveText(text);
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
  }
  // The Caelestia page doesn't exist yet, so nothing reads about the fork.
  await expect(desktop.getByRole("link", { name: "Read about the fork" })).toHaveCount(0);
  await expect(page.locator('a[href="/systems/caelestia"]')).toHaveCount(0);

  await expect(desktop.locator(".after-credit")).toHaveText(
    "Upstream contribution: my per-workspace wallpaper feature was reworked and merged into ml4w-lightcrimson-dotfiles, crediting @systemeror12 as its original author.",
  );
  await expect(desktop.locator(".after-credit code")).toHaveText([
    "ml4w-lightcrimson-dotfiles",
    "@systemeror12",
  ]);
  const previous = desktop.getByRole("link", { name: "Previously: dots-hyprland" });
  await expect(previous).toHaveAttribute("href", "/systems/dots-hyprland");
  expect(await previous.getAttribute("target")).toBeNull();
  // The credit sits under the Previous Desktop link.
  const link = (await previous.boundingBox())!;
  const credit = (await desktop.locator(".after-credit").boundingBox())!;
  expect(credit.y).toBeGreaterThanOrEqual(link.y + link.height);
  await previous.click();
  await expect(page).toHaveURL("/systems/dots-hyprland");
});

test("no homepage text calls dots-hyprland current", async ({ page }) => {
  await page.goto("/");
  const text = await page.locator("main").innerText();
  const mentions = text.split("\n").filter((line) => /dots-hyprland/i.test(line));
  expect(mentions).toEqual(["Previously: dots-hyprland"]);
});

test("Odysseus is gone from every route", async ({ page }) => {
  for (const path of [
    "/",
    "/work/multi-company-hris",
    "/work/ai-odoo-rnd",
    "/work/payment-provider",
    "/work/public-sector-hris",
    "/systems/dots-hyprland",
  ]) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/odysseus/i);
    await expect(page.locator('a[href*="odysseus" i]')).toHaveCount(0);
  }
});

test("Tools I use shows three plaques, each tool linking to its upstream project with a visible focus ring", async ({ page }) => {
  await page.goto("/");
  const region = page.getByRole("region", { name: "Tools I Use" });
  await expect(region.getByRole("heading", { name: "Tools I use" })).toBeVisible();
  await expect(region.getByText("Not my projects. Just always open.")).toBeVisible();
  await expect(region.getByText(/Project Evidence|tech stack/i)).toHaveCount(0);
  await expect(region.locator(".after-tool h4")).toHaveText(
    plaques.map((plaque) => plaque.tools.map((tool) => tool.name).join(", ")),
  );
  await expect(region.locator(".after-tool p")).toHaveText(plaques.map((plaque) => plaque.line));
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
      const { lingkod, desktop, tools } = await boxes(page);

      if (width > 900) {
        // Lingkod HR on the left with the tools under it; the fork on the right beside both.
        expect(desktop.x).toBeGreaterThan(lingkod.x + lingkod.width);
        expect(Math.abs(desktop.y - lingkod.y)).toBeLessThan(1);
        expect(tools.x).toBeCloseTo(lingkod.x, 0);
        expect(tools.width).toBeCloseTo(lingkod.width, 0);
        expect(tools.y).toBeGreaterThan(lingkod.y + lingkod.height);
        expect(desktop.x).toBeGreaterThan(tools.x + tools.width);
      } else {
        // One column: Lingkod HR, the fork, then the tools.
        for (const box of [desktop, tools]) expect(box.x).toBeCloseTo(lingkod.x, 0);
        expect(desktop.y).toBeGreaterThan(lingkod.y + lingkod.height);
        expect(tools.y).toBeGreaterThan(desktop.y + desktop.height);
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
