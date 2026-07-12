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
