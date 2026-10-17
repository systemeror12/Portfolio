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

  for (const [name, href] of [
    ["T3 Code", "https://github.com/pingdotgg/t3code"],
    ["Claude Code", "https://github.com/anthropics/claude-code"],
    ["Codex", "https://github.com/openai/codex"],
    ["OpenCode", "https://github.com/anomalyco/opencode"],
    ["Hermes Agent", "https://github.com/NousResearch/hermes-agent"],
  ]) {
    const link = tools.getByRole("link", { name: `Open ${name} upstream project` });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
  }
  await expect(tools.getByText(/odysseus/i)).toHaveCount(0);
});

test("a Hiring Manager can use the approved contact actions, and the site offers no resume", async ({
  page,
}) => {
  await page.goto("/");
  const contact = page.locator("section#contact");
  const email = contact.getByRole("link", {
    name: "mendozajeromevrixen@gmail.com",
    exact: true,
  });
  const github = contact.getByRole("link", { name: "GitHub", exact: true });
  const linkedIn = contact.getByRole("link", { name: "LinkedIn", exact: true });

  await expect(email).toHaveAttribute(
    "href",
    "mailto:mendozajeromevrixen@gmail.com",
  );
  await expect(github).toHaveAttribute("href", "https://github.com/systemeror12");
  await expect(linkedIn).toHaveAttribute("href", linkedInUrl);

  const externalActions = [email, github, linkedIn];
  for (const action of externalActions) {
    await action.focus();
    await expect(action).toBeFocused();
  }
  for (const action of externalActions.slice(1)) {
    await expect(action).toHaveAttribute("target", "_blank");
    await expect(action).toHaveAttribute("rel", "noreferrer");
  }

  // The resume is private now, so the outdated one must not come back.
  await expect(contact.getByRole("link", { name: /resume/i })).toHaveCount(0);
  await expect(page.locator('a[href$=".pdf"]')).toHaveCount(0);
  const resumeResponse = await page.request.get("/jerome-mendoza-resume.pdf");
  expect(resumeResponse.headers()["content-type"] ?? "").not.toContain("application/pdf");
});

test("supporting professional information excludes private contact details", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText(/phone number/i)).toHaveCount(0);
  await expect(page.getByText(/street address/i)).toHaveCount(0);
});
