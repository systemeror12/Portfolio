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

test("a Hiring Manager can inspect the Featured Personal System", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "A desktop platform I keep improving." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /inspect the personal system/i })
    .click();

  await expect(page).toHaveURL("/systems/dots-hyprland");
  await expect(
    page.getByRole("heading", {
      name: "Evolving a Hyprland desktop into my daily platform",
    }),
  ).toBeVisible();
  await expect(page.getByText("Actively maintained fork", { exact: true })).toBeVisible();
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
    page.getByRole("link", { name: "Personal system", exact: true }),
  ).toHaveAttribute("aria-current", "page");
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
