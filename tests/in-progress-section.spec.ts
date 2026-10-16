import { expect, test, type Page } from "@playwright/test";

const pieces = [
  {
    title: "Brokerage ERP Rebuild",
    status: "Odoo 10 live, maintained by me · Odoo 18 rebuild in development",
    for: "for a financial brokerage's accounting team, whose books have to balance before and after the move",
    role: "Project Maintainer, with two other developers",
    owns: "The Odoo 10 → 18 cutover, report parity with the Odoo 10 prints, accounting fixes from QA, and the test and dev setup. I also keep the live Odoo 10 system correct while we rebuild it.",
    holds:
      "Cutover stops if a check can't run or an amount differs. A cutover rehearsal on a sample of deals reconciled to zero differences against Odoo 10.",
    keyIdeas: ["Fail-Closed Cutover", "Report Parity"],
  },
  {
    title: "Training Registration Platform",
    status: "In development",
    for: "for people registering for a training organization's courses",
    role: "Main developer since 2024",
    owns: "Member-rate eligibility and membership review, registration identity locked to the signed-in account, training agreements and evaluations, and browser tests for the flows.",
    holds:
      "A non-member can't register at the member rate. A disputed membership goes to review before it counts.",
    keyIdeas: ["Member Rate Eligibility", "Locked Registration Identity"],
  },
] as const;

function inProgress(page: Page) {
  return page.getByRole("region", { name: "In progress." });
}

test("In Progress sits between Work and After hours", async ({ page }) => {
  await page.goto("/");
  const order = await page
    .locator("main > section")
    .evaluateAll((sections) => sections.map((section) => section.id || section.className));
  expect(order).toEqual(["hero", "work", "in-progress", "after", "method", "contact"]);
  await expect(inProgress(page)).toHaveAttribute("id", "in-progress");
  await expect(
    inProgress(page).getByText(
      "Two systems I'm working on now. Neither is live yet, so instead of a result, each shows what I own and the line it holds.",
      { exact: true },
    ),
  ).toBeVisible();
});

test("each card carries its copy, the rebuild first", async ({ page }) => {
  await page.goto("/");
  const section = inProgress(page);

  await expect(section.getByRole("article")).toHaveCount(2);
  await expect(section.locator("article h3")).toHaveText(pieces.map((piece) => piece.title));

  for (const piece of pieces) {
    const card = section.getByRole("article", { name: piece.title, exact: true });
    await expect(card.locator(".progress-status")).toHaveText(piece.status);
    await expect(card.locator(".progress-for")).toHaveText(piece.for);
    await expect(card.locator("dt")).toHaveText(["Role", "What I own", "The line it holds"]);
    await expect(card.locator("dd")).toHaveText([piece.role, piece.owns, piece.holds]);
    await expect(
      card.getByRole("list", { name: "Key ideas" }).getByRole("listitem"),
    ).toHaveText([...piece.keyIdeas]);
    // Neither system is live, so neither card claims a result or links anywhere yet.
    await expect(card.getByText("What changed")).toHaveCount(0);
    await expect(card.getByRole("link")).toHaveCount(0);
  }
});

test("no card says the rebuild or the platform is live, delivered, or in production", async ({
  page,
}) => {
  await page.goto("/");
  const text = await inProgress(page).innerText();
  expect(text).not.toMatch(/delivered|in production|production-ready|went live/i);
  // The only live system named is the Odoo 10 one being kept correct.
  expect(text.match(/\blive\b/gi)).toHaveLength(3);
  expect(text).not.toMatch(/\b\d[\d,]*\s+deals\b/i);
});

for (const width of [390, 820, 1440]) {
  test(`at ${width}px the cards sit in their places and nothing overflows`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const section = inProgress(page);
    await section.locator(".progress-pieces").scrollIntoViewIfNeeded();
    await expect(section.locator(".progress-pieces")).toHaveCSS("transform", "none");
    const rebuild = (await section.getByRole("article", { name: pieces[0].title }).boundingBox())!;
    const platform = (await section.getByRole("article", { name: pieces[1].title }).boundingBox())!;
    const title = (await section.getByRole("heading", { level: 2 }).boundingBox())!;
    const intro = (await section.locator(".progress-heading p").boundingBox())!;

    if (width > 900) {
      expect(intro.x).toBeGreaterThan(title.x + title.width);
      expect(Math.abs(platform.y - rebuild.y)).toBeLessThan(1);
      expect(platform.width).toBeCloseTo(rebuild.width, 0);
      expect(platform.x - (rebuild.x + rebuild.width)).toBeCloseTo(28, 0);
    } else {
      expect(intro.y).toBeGreaterThan(title.y + title.height);
      expect(platform.x).toBeCloseTo(rebuild.x, 0);
      expect(platform.y - (rebuild.y + rebuild.height)).toBeCloseTo(44, 0);
    }
    if (width <= 560) {
      await expect(section.locator(".progress-piece").first()).toHaveCSS(
        "padding",
        "28px 22px 30px",
      );
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const outside = await section.evaluate((element) =>
      Array.from(element.querySelectorAll("*"))
        .filter((child) => !child.closest("svg") || child.tagName === "svg")
        .filter((child) => {
          const box = child.getBoundingClientRect();
          return box.width > 0 && (box.left < 0 || box.right > window.innerWidth);
        })
        .map((child) => child.textContent!.trim().slice(0, 40) || child.tagName),
    );
    expect(outside).toEqual([]);
  });
}

test("the section reveals itself, and at once under reduced motion", async ({ page }) => {
  await page.goto("/");
  const cards = inProgress(page).locator(".progress-pieces");
  await expect(cards).toHaveCSS("opacity", "0");
  await cards.scrollIntoViewIfNeeded();
  await expect(cards).toHaveClass(/is-shown/);
  await expect(cards).toHaveCSS("opacity", "1");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(inProgress(page).locator(".reveal")).toHaveCount(2);
  for (const element of await inProgress(page).locator(".reveal").all()) {
    await expect(element).toHaveClass(/is-shown/);
    await expect(element).toHaveCSS("opacity", "1");
    await expect(element).toHaveCSS("transform", "none");
  }
});

test("its only drawing is the staff divider and the sparks, all hidden", async ({ page }) => {
  await page.goto("/");
  const drawings = inProgress(page).locator("svg");
  await expect(drawings).toHaveCount(3);
  for (const svg of await drawings.all()) await expect(svg).toHaveAttribute("aria-hidden", "true");
});
