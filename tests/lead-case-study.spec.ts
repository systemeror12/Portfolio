import { expect, test } from "@playwright/test";

test("a Hiring Manager can open the Lead Case Study and return home", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("link", { name: /open the lead case study/i }).click();
  await expect(page).toHaveURL("/work/multi-company-hris");
  await expect(
    page.getByRole("heading", { name: "Multi-Company HRIS" }),
  ).toBeVisible();
  await expect(
    page.getByText("Philippine Payroll Rules", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();

  await page.getByRole("link", { name: "Back to home" }).click();
  await expect(page).toHaveURL("/");
});

test("the Lead Case Study opens directly with an accessible system flow", async ({
  page,
}) => {
  await page.goto("/work/multi-company-hris");

  if (await page.getByRole("button", { name: "Open navigation" }).isVisible()) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await expect(
    page.getByRole("link", { name: "Case study", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("img", { name: /payroll calculation flow/i }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /multiple legal companies.*payroll input.*payslip calculation/i,
    ),
  ).toBeVisible();
});

test("the Lead Case Study presents its complete evidence narrative", async ({
  page,
}) => {
  await page.goto("/work/multi-company-hris");

  await expect(
    page.getByRole("heading", {
      name: /bring hr workflows into one approved flow/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /make the company boundary part of the system design/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /test the calculations against the operation they serve/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /one approved path from hr record to payslip calculation/i,
    }),
  ).toBeVisible();
  await expect(page.getByText("Odoo Community", { exact: true })).toBeVisible();
});

test("a Hiring Manager can inspect the AI R&D Case Study", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /open the ai r&d case study/i }).click();
  await expect(page).toHaveURL("/work/ai-odoo-rnd");
  await expect(
    page.getByRole("heading", { name: "AI R&D Case Study" }),
  ).toBeVisible();
  await expect(
    page.getByText("successful internal R&D", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("figure", { name: /reconstructed rag flow/i }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("figure", { name: /reconstructed rag flow/i })
      .locator("figcaption p"),
  ).toContainText(/access rules.*before.*retrieval/i);
  await expect(
    page.getByText(/returned an Ungrounded Fallback/i),
  ).toBeVisible();
  await expect(page.getByText(/not a production client deployment/i)).toBeVisible();
  await expect(
    page.getByText(/does not claim.*unrestricted record access/i),
  ).toBeVisible();
  await expect(page.getByText(/production-ready/i)).toHaveCount(0);
  await expect(page.getByText(/100% accurate/i)).toHaveCount(0);
  await expect(page.getByText(/unrestricted vector search/i)).toHaveCount(0);
});

test("the AI R&D Case Study opens directly with its complete evidence", async ({
  page,
}) => {
  await page.goto("/work/ai-odoo-rnd");

  if (await page.getByRole("button", { name: "Open navigation" }).isVisible()) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await expect(
    page.getByRole("link", { name: "AI R&D", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  await expect(
    page.getByRole("heading", {
      name: /test a useful chatbot without treating private records as open context/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /authorize records before retrieval, then make the evidence visible/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /missing evidence is a safe response, not a guess/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /an internal prototype proved the agreed end-to-end scenarios were feasible/i,
    }),
  ).toBeVisible();
  await expect(
    page.locator(".technologies").getByText("OpenAI embedding vectors", {
      exact: true,
    }),
  ).toBeVisible();
});
