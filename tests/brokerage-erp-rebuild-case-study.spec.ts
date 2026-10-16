import { expect, test, type Page } from "@playwright/test";

const path = "/work/brokerage-erp-rebuild";
const standing =
  "A cutover rehearsal on a sample of deals reconciled to zero differences against Odoo 10. The Odoo 18 system is not yet live.";

// Opens the phone menu when the header's links sit behind it.
async function openMenu(page: Page) {
  const menuButton = page.getByRole("button", { name: "Open navigation" });
  if (await menuButton.isVisible()) await menuButton.click();
}

test("a Hiring Manager can reach the Brokerage ERP Rebuild from its In Progress card", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("region", { name: "In progress." })
    .getByRole("link", { name: "Read the full case study: Brokerage ERP Rebuild" })
    .click();
  await expect(page).toHaveURL(path);
  await expect(page.getByRole("heading", { level: 1, name: "Brokerage ERP Rebuild" })).toBeVisible();

  await page.getByRole("link", { name: "Back to home" }).click();
  await expect(page).toHaveURL("/");
});

test("the Brokerage ERP Rebuild opens directly, with In progress marked current", async ({ page }) => {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1, name: "Brokerage ERP Rebuild" })).toBeVisible();

  await openMenu(page);
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(nav.getByRole("link", { name: "In progress", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.locator("[aria-current]")).toHaveCount(1);
});

test("it opens on its own kind line, its records, and who it was for", async ({ page }) => {
  await page.goto(path);
  const kind = page.locator(".case-hero .case-kind");
  await expect(kind).toHaveText("In progress");
  await expect(kind.locator("svg")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("list", { name: "Records it carries" }).getByRole("listitem")).toHaveText([
    "extract",
    "transform",
    "load",
    "verify",
  ]);
  await expect(page.locator(".case-hero .case-for")).toHaveText(
    "for a financial brokerage's accounting team, whose books have to balance before and after the move",
  );
  await expect(page.locator(".case-end")).toHaveText("for the brokerage's accountants");
  await expect(page.locator("main svg.case-iron")).toHaveCount(2);
});

test("it tells the rebuild's story in its sections", async ({ page }) => {
  await page.goto(path);
  const main = page.getByRole("main");

  await expect(main.locator(".section-label")).toHaveText([
    "Problem and constraints",
    "Contribution",
    "Merged work",
    "On the live Odoo 10 system",
    "Where it stands",
    "Technologies",
  ]);
  await expect(main.locator(".case-problem p")).toContainText(
    "Every amount, reconciliation, and document number has to survive the move",
  );
  await expect(main.locator(".contribution p")).toContainText("Project Maintainer");
  await expect(main.locator(".contribution p")).toContainText("didn't build every module");
  await expect(main.locator(".decisions li strong")).toHaveText([
    "Fail-Closed Cutover:",
    "Report Parity:",
    "Accounting correctness from QA:",
    "Delivery environment:",
  ]);
  await expect(main.locator(".live-system p")).toContainText("Trial Balance Excel export");
  await expect(main.locator(".technologies li")).toHaveText([
    "Odoo 18",
    "Odoo 10",
    "Python",
    "PostgreSQL",
    "Playwright",
  ]);
});

test("its flow runs from Odoo 10 to Odoo 18 and stops on any difference", async ({ page }) => {
  await page.goto(path);
  const flow = page.getByRole("img", { name: "Sanitized cutover flow" });
  await expect(flow).toBeVisible();
  await expect(flow.locator(".flow-lane strong")).toHaveText([
    "Odoo 10",
    "Extract",
    "Transform",
    "Load",
    "Verify",
    "Odoo 18",
  ]);
  await expect(flow.locator("figcaption p")).toContainText(
    "Any difference, or any check that can't run, stops cutover.",
  );
  await expect(flow.locator(".flow-note")).toContainText(/sanitized reconstruction/i);
  for (const svg of await flow.locator("svg").all()) await expect(svg).toHaveAttribute("aria-hidden", "true");
});

test("it says where it stands and claims no result or scale", async ({ page }) => {
  await page.goto(path);
  const main = page.getByRole("main");

  await expect(main.locator(".standing p")).toHaveText(standing);
  await expect(main.locator(".outcome, .validation")).toHaveCount(0);

  const text = await main.innerText();
  expect(text).not.toMatch(/outcome|verified result|what changed/i);
  expect(text).not.toMatch(/delivered|in production|production-ready|went live|completed migration/i);
  // No deal count, record counts, or other scale.
  expect(text).not.toMatch(/\d[\d,.]*\s*(\+|k\b|%)?\s*(deals|records|rows|invoices|payments|documents|accounts|users|companies)/i);
  // The only links are back home; nothing reaches a repository.
  const links = await page.locator("main a, footer a").evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute("href")),
  );
  expect(links).toEqual(["/", "/"]);
});
