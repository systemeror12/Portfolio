import { expect, test } from "@playwright/test";

const linkedInUrl =
  "https://www.linkedin.com/in/jerome-vrixen-mendoza-59b927293/";

test("a Hiring Manager can inspect current workflow tools without mistaking them for Project Evidence", async ({
  page,
}) => {
  await page.goto("/");

  const tools = page.getByRole("region", { name: "Tools I Use" });
  await expect(tools).toBeVisible();
  await expect(tools.getByText("Project Evidence")).toHaveCount(0);
  await expect(tools.getByText(/active tech stack/i)).toHaveCount(0);

  await expect(
    tools.getByRole("link", { name: /open odysseus upstream project/i }),
  ).toHaveAttribute(
    "href",
    "https://github.com/pewdiepie-archdaemon/odysseus",
  );
  await expect(
    tools.getByRole("link", { name: /open odysseus upstream project/i }),
  ).toHaveAttribute("target", "_blank");
  await expect(
    tools.getByRole("link", { name: /open odysseus upstream project/i }),
  ).toHaveAttribute("rel", "noreferrer");
  await expect(
    tools.getByRole("link", { name: /open t3 code upstream project/i }),
  ).toHaveAttribute("href", "https://github.com/pingdotgg/t3code");
  await expect(
    tools.getByRole("link", { name: /open t3 code upstream project/i }),
  ).toHaveAttribute("target", "_blank");
  await expect(
    tools.getByRole("link", { name: /open t3 code upstream project/i }),
  ).toHaveAttribute("rel", "noreferrer");
});

test("a Hiring Manager can use the approved contact actions and download a web-safe resume", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: /email jerome/i }),
  ).toHaveAttribute("href", "mailto:mendozajeromevrixen@gmail.com");
  await expect(
    page.getByRole("link", { name: /view github profile/i }),
  ).toHaveAttribute("href", "https://github.com/systemeror12");
  await expect(
    page.getByRole("link", { name: /view linkedin profile/i }),
  ).toHaveAttribute("href", linkedInUrl);

  const externalActions = [
    page.getByRole("link", { name: /email jerome/i }),
    page.getByRole("link", { name: /view github profile/i }),
    page.getByRole("link", { name: /view linkedin profile/i }),
  ];
  for (const action of externalActions) {
    await action.focus();
    await expect(action).toBeFocused();
  }
  for (const action of externalActions.slice(1)) {
    await expect(action).toHaveAttribute("target", "_blank");
    await expect(action).toHaveAttribute("rel", "noreferrer");
  }

  const resume = page.getByRole("link", { name: /download web-safe resume/i });
  await resume.focus();
  await expect(resume).toBeFocused();
  await expect(resume).toHaveAttribute("href", "/jerome-mendoza-resume.pdf");
  await expect(resume).toHaveAttribute("download");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    resume.press("Enter"),
  ]);
  expect(download.suggestedFilename()).toBe("jerome-mendoza-resume.pdf");

  const resumeResponse = await page.request.get("/jerome-mendoza-resume.pdf");
  expect(resumeResponse.ok()).toBeTruthy();
  expect(resumeResponse.headers()["content-type"]).toContain("application/pdf");
});

test("supporting professional information excludes private contact details", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText(/phone number/i)).toHaveCount(0);
  await expect(page.getByText(/street address/i)).toHaveCount(0);

  const resumeResponse = await page.request.get("/jerome-mendoza-resume.pdf");
  expect(resumeResponse.ok()).toBeTruthy();
  const resumeContents = await resumeResponse.body();
  expect(resumeContents.toString("latin1")).not.toMatch(/phone|street|address/i);
});
