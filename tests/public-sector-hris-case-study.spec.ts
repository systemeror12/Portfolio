import { expect, test } from "@playwright/test";

test("a Hiring Manager can open the Public Sector HRIS Case Study from the navigation", async ({
  page,
}) => {
  await page.goto("/");

  if (await page.getByRole("button", { name: "Open navigation" }).isVisible()) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await page.getByRole("link", { name: "Public sector", exact: true }).click();
  await expect(page).toHaveURL("/work/public-sector-hris");
  await expect(
    page.getByRole("heading", { name: "Government Water District HRIS" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();

  await page.getByRole("link", { name: "Back to home" }).click();
  await expect(page).toHaveURL("/");
});

test("the Public Sector HRIS Case Study opens directly with an accessible attendance flow", async ({
  page,
}) => {
  await page.goto("/work/public-sector-hris");

  if (await page.getByRole("button", { name: "Open navigation" }).isVisible()) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await expect(
    page.getByRole("link", { name: "Public sector", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  const attendanceFlow = page.getByRole("img", {
    name: /sanitized attendance flow/i,
  });
  await expect(attendanceFlow).toBeVisible();
  await expect(attendanceFlow.locator("figcaption p")).toContainText(
    /biometric import.*attendance correction.*authoritative punch record/i,
  );
  await expect(
    attendanceFlow.locator(".flow-note"),
  ).toContainText(/sanitized reconstruction/i);
});

test("the Public Sector HRIS Case Study presents its complete evidence narrative", async ({
  page,
}) => {
  await page.goto("/work/public-sector-hris");

  await expect(
    page.getByRole("heading", {
      name: /make every punch defensible before anything reads it/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /attendance engine and self-service hr workflows in a five-person delivery/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /one evaluation path, one workflow lifecycle, one honest dashboard/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /verify behavior the way the operation will use it/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /attendance the district can audit, hr work employees can start themselves/i,
    }),
  ).toBeVisible();

  await expect(
    page.getByText("Authoritative Punch Record", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".decisions").getByText(/Unified ISO Workflow/),
  ).toBeVisible();
  await expect(
    page.locator(".decisions").getByText(/My Dashboard/),
  ).toBeVisible();
  await expect(
    page.getByText(
      /largest contributor on a five-person delivery team over roughly three months/i,
    ),
  ).toBeVisible();
  await expect(
    page.locator(".technologies").getByText("Odoo", { exact: true }),
  ).toBeVisible();
});

test("the Public Sector HRIS Case Study contains no excluded claims", async ({
  page,
}) => {
  await page.goto("/work/public-sector-hris");

  const pageText = await page.locator("body").innerText();
  expect(pageText).not.toMatch(/in production|deployed to production|rollout/i);
  expect(pageText).not.toMatch(/end-to-end test|\be2e\b/i);
  expect(pageText).not.toMatch(/\b\d+\s+(commits?|merged|MRs?)\b/i);
  expect(pageText).not.toMatch(/gitlab|merge request/i);
  expect(pageText).not.toMatch(/\bcwd\b/i);
  expect(pageText).not.toMatch(/production-ready/i);
});
