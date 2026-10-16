import { expect, test } from "@playwright/test";

const upstreamPullRequest =
  "https://github.com/yurihikari/ml4w-lightcrimson-dotfiles/pull/3";
const forkRepository = "https://github.com/systemeror12/dots-hyprland-xenrya";
const selectedChanges = [
  [
    "Open Workspace wallpaper state selected change",
    "https://github.com/systemeror12/dots-hyprland-xenrya/pull/11",
  ],
  [
    "Open Launcher performance and correctness selected change",
    "https://github.com/systemeror12/dots-hyprland-xenrya/pull/13",
  ],
  [
    "Open Cross-process reliability selected change",
    "https://github.com/systemeror12/dots-hyprland-xenrya/pull/14",
  ],
];
const caelestiaRepositories = [
  ["Open the Caelestia-Xenrya dotfiles", "https://github.com/systemeror12/caelestia-xenrya"],
  ["Open the Caelestia-Xenrya CLI", "https://github.com/systemeror12/caelestia-cli-xenrya"],
  ["Open the Caelestia-Xenrya shell", "https://github.com/systemeror12/caelestia-shell-xenrya"],
];

test("a Hiring Manager can reach the Previous Desktop from After hours", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "After hours." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lingkod HR" })).toBeVisible();
  await expect(
    page.getByText("In development, private repository", { exact: true }),
  ).toBeVisible();
  for (const technology of [
    "Next.js",
    "React",
    "NestJS",
    "PostgreSQL",
    "Prisma",
    "Docker",
  ]) {
    await expect(page.getByText(technology, { exact: true })).toBeVisible();
  }
  await page.getByRole("link", { name: "Read about the fork" }).click();

  await expect(page).toHaveURL("/systems/dots-hyprland");
  await expect(
    page.getByRole("heading", {
      name: "Evolving my previous Hyprland desktop",
    }),
  ).toBeVisible();
  await expect(page.locator(".case-hero .case-kind")).toHaveText("Previous desktop");
  await expect(
    page.getByRole("link", { name: /open the maintainer's public pull request/i }),
  ).toHaveAttribute("href", upstreamPullRequest);
});

test("the Personal System route loads directly with evidence and safe attribution", async ({
  page,
}) => {
  await page.goto("/systems/dots-hyprland");

  if (await page.getByRole("button", { name: "Open navigation" }).isVisible()) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await expect(
    page.getByRole("link", { name: "After hours", exact: true }),
  ).toHaveAttribute("href", "/#after");
  await expect(page.getByText("Workspace wallpaper state", { exact: true })).toBeVisible();
  await expect(page.getByText("Launcher performance and correctness", { exact: true })).toBeVisible();
  await expect(page.getByText("Cross-process reliability", { exact: true })).toBeVisible();
  await expect(page.getByText("Upstream work", { exact: true })).toBeVisible();
  await expect(page.getByText(/original feature author/i)).toBeVisible();
  await expect(page.getByText(/maintainer reworked the final implementation/i)).toBeVisible();

  await expect(page.getByText(/I designed the upstream visual/i)).toHaveCount(0);
  await expect(page.getByText(/I maintain the upstream repository/i)).toHaveCount(0);
  await expect(page.getByText(/I authored the maintainer's rework/i)).toHaveCount(0);

  const publicEvidenceLinks = [
    ["Open fork repository", forkRepository],
    ["Open the maintainer's public pull request", upstreamPullRequest],
    ...selectedChanges,
  ];
  for (const [name, href] of publicEvidenceLinks) {
    const link = page.getByRole("link", { name });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
  }
});

test("the Previous Desktop never calls the fork current", async ({ page }) => {
  await page.goto("/systems/dots-hyprland");
  const text = (await page.locator("body").innerText()).toLowerCase();
  for (const phrase of [
    "every day",
    "daily platform",
    "daily-use",
    "actively maintained",
    "i will continue",
  ]) {
    expect(text).not.toContain(phrase);
  }
});

test("Where it went next says the desktop moved to Caelestia-Xenrya", async ({ page }) => {
  await page.goto("/systems/dots-hyprland");
  const section = page.locator("section", {
    has: page.getByText("Where it went next", { exact: true }),
  });
  await expect(page.getByText("Future maintenance", { exact: true })).toHaveCount(0);
  await expect(section).toContainText("Caelestia-Xenrya");
  await expect(section).toContainText(/built entirely in Quickshell/);
  await expect(section).toContainText(/no longer maintained/);
  for (const [name, href] of caelestiaRepositories) {
    const link = section.getByRole("link", { name });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
  }
  await expect(page.locator('a[href="/systems/caelestia"]')).toHaveCount(0);
});

test("the Caelestia-Xenrya links read like the page's other evidence links", async ({ page }) => {
  await page.goto("/systems/dots-hyprland");
  const style = (name: string) =>
    page.getByRole("link", { name }).evaluate((link) => {
      const computed = getComputedStyle(link);
      return {
        color: computed.color,
        line: computed.textDecorationLine,
        font: computed.font,
        icon: getComputedStyle(link.querySelector("svg")!).display,
      };
    });
  const evidence = await style("Open the maintainer's public pull request");
  expect(evidence.line).toBe("underline");
  expect(evidence.icon).toBe("none");
  for (const [name] of caelestiaRepositories) {
    expect(await style(name)).toEqual(evidence);
  }
});
