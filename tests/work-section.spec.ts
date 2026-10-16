import { expect, test, type Page } from "@playwright/test";

const cases = [
  {
    title: "Multi-Company HRIS",
    kind: "Lead case study",
    for: "for HR and payroll teams at multiple legal companies, now sharing one platform",
    keyIdeas: "Philippine Payroll Rules, Payroll Input, Payroll Validation",
    path: "/work/multi-company-hris",
    pageHeading: "Multi-Company HRIS",
  },
  {
    title: "Payment Provider Module",
    kind: "Integration case study",
    for: "for customers at checkout, who should only ever be charged once",
    keyIdeas: "Verified Payment Webhook, Idempotent Payment Update, Payment Outcome",
    path: "/work/payment-provider",
    pageHeading: "Payment Provider Module",
  },
  {
    title: "Access-Scoped Retrieval",
    kind: "AI research and development",
    for: "for employees asking questions, who should only see what they're allowed to",
    keyIdeas: "Odoo-Grounded Answer, Access-Scoped Retrieval, Ungrounded Fallback",
    path: "/work/ai-odoo-rnd",
    pageHeading: "AI R&D Case Study",
  },
  {
    title: "Government Water District HRIS",
    kind: "Public sector case study",
    for: "for the staff whose leave, overtime, and pass slips all hang on one punch",
    keyIdeas:
      "Authoritative Punch Record, Attendance Correction, Biometric Import, Unified ISO Workflow",
    path: "/work/public-sector-hris",
    pageHeading: "Government Water District HRIS",
  },
] as const;

const fields = ["What I built", "How it fits", "The line it holds", "What changed"];

function work(page: Page) {
  return page.locator("section#work");
}

function revealStates(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("#work .reveal")).map((element) => {
      const style = getComputedStyle(element);
      return {
        opacity: style.opacity,
        transform: style.transform,
        transition: style.transitionDuration,
      };
    }),
  );
}

test("the Work section presents the four Anonymized Case Studies in order", async ({
  page,
}) => {
  await page.goto("/");
  const section = work(page);

  await expect(
    page.getByRole("region", { name: "Four systems, and who they were for." }),
  ).toHaveAttribute("id", "work");
  await expect(section.getByText(/^One window, four panes\./)).toBeVisible();
  await expect(section.getByText(/Client names stay private\.$/)).toBeVisible();

  const articles = section.locator("article");
  await expect(articles).toHaveCount(4);
  for (const [index, item] of cases.entries()) {
    const article = articles.nth(index);
    await expect(article).toHaveAccessibleName(item.title);
    await expect(
      article.getByRole("heading", { level: 3, name: item.title }),
    ).toBeVisible();
    const kind = article.locator(".work-case-kind");
    await expect(kind).toHaveText(new RegExp(`${item.kind}$`));
    await expect(kind.locator("span")).toHaveAttribute("aria-hidden", "true");
    await expect(article.getByText(item.for, { exact: true })).toBeVisible();
    await expect(article.locator(".work-case-problem")).not.toBeEmpty();
    await expect(article.locator("dt")).toHaveText(fields);
    for (const definition of await article.locator("dd").all()) {
      await expect(definition).not.toBeEmpty();
    }
    await expect(article.getByText(/^Key ideas:/)).toHaveText(
      `Key ideas: ${item.keyIdeas}`,
    );
  }
});

test("the AI R&D Case Study carries its internal-prototype note and no other case does", async ({
  page,
}) => {
  await page.goto("/");
  const note =
    "An internal prototype. It proved the idea works. It was never a production deployment.";

  await expect(
    page
      .getByRole("article", { name: "Access-Scoped Retrieval" })
      .getByText(note, { exact: true }),
  ).toBeVisible();
  await expect(work(page).getByText(note, { exact: true })).toHaveCount(1);
});

test("the Work section names no client, no Confidential Scale, and no Excluded Project", async ({
  page,
}) => {
  await page.goto("/");
  const text = await work(page).innerText();

  // Client identity: real names are checked by the private-name scan
  // (tests/private-names.spec.ts), which keeps them out of the repo.
  expect(text).not.toMatch(/client company|client organization/i);
  // Confidential Scale: "multiple legal companies" only, never a count.
  expect(text).not.toMatch(/Confidential Scale/i);
  expect(text).not.toMatch(
    /\b(\d+|two|three|four|five|six|seven|eight|nine|ten|dozens?|hundreds?|thousands?)\+?\s+(legal\s+)?(companies|employees|staff)\b/i,
  );
  expect(text).toMatch(/multiple legal companies/i);
  // The Excluded Project never appears anywhere on the homepage.
  expect(await page.locator("body").innerText()).not.toMatch(/pallet/i);
});

test("each case links to its case-study route under a distinct accessible name", async ({
  page,
}) => {
  await page.goto("/");
  const links = work(page).getByRole("link");
  await expect(links).toHaveCount(4);

  const names = await links.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("aria-label")),
  );
  expect(new Set(names).size).toBe(4);

  for (const item of cases) {
    const link = page
      .getByRole("article", { name: item.title, exact: true })
      .getByRole("link", { name: `Read the full case study: ${item.title}` });
    await expect(link).toHaveText("Read the full case study");
    await expect(link).toHaveAttribute("href", item.path);
  }

  for (const item of cases) {
    await page
      .getByRole("link", { name: `Read the full case study: ${item.title}` })
      .click();
    await expect(page).toHaveURL(item.path);
    await expect(
      page.getByRole("heading", { level: 1, name: item.pageHeading }),
    ).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL("/");
  }
});

test("the case links take keyboard focus with a visible ring", async ({
  page,
}) => {
  await page.goto("/");
  for (const item of cases) {
    const link = page.getByRole("link", {
      name: `Read the full case study: ${item.title}`,
    });
    await link.focus();
    await expect(link).toBeFocused();
    const outline = await link.evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(outline.style).toBe("solid");
    expect(outline.width).toBeGreaterThanOrEqual(2);
  }
});

test("the hero's link leads to the Work section", async ({ page }) => {
  await page.goto("/");
  // Wait for the fonts so the page doesn't reflow under the scroll.
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('a[href="/#evidence"]')).toHaveCount(0);
  await expect(page.locator("#evidence")).toHaveCount(0);

  await page.getByRole("main").locator('a[href="/#work"]').first().click();
  await expect(page).toHaveURL("/#work");
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.abs(document.getElementById("work")!.getBoundingClientRect().top),
      ),
    )
    .toBeLessThanOrEqual(1);
});

test("the section opens with the five-line staff divider", async ({ page }) => {
  await page.goto("/");
  const divider = work(page).locator(":scope > svg.staff-divider");

  await expect(divider).toHaveAttribute("aria-hidden", "true");
  expect(
    await work(page).evaluate((section) => section.firstElementChild!.tagName),
  ).toBe("svg");

  const viewport = page.viewportSize()!;
  const box = (await divider.boundingBox())!;
  const width = Math.min(1200, viewport.width - 48);
  expect(box.height).toBeCloseTo(44, 0);
  expect(box.width).toBeCloseTo(width, 0);
  expect(box.x).toBeCloseTo((viewport.width - width) / 2, 0);

  // Five lines on each side of the heart.
  const path = await divider.locator("path").getAttribute("d");
  expect(path!.match(/M0 \d+ H560/g)).toHaveLength(5);
  expect(path!.match(/M640 \d+ H1200/g)).toHaveLength(5);
});

test("the Work section fits a 390px screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  const outside = await work(page).evaluate((section) =>
    Array.from(section.querySelectorAll("*"))
      // The staff divider crops its own drawing, so measure the svg, not its path.
      .filter((element) => !element.closest("svg") || element.tagName === "svg")
      // The lunette crops its window, so measure its frame, not the window.
      .filter((element) => !element.closest(".rose-lunette"))
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && (box.left < 0 || box.right > window.innerWidth);
      })
      .map((element) => element.textContent!.trim().slice(0, 40) || element.tagName),
  );
  expect(outside).toEqual([]);

  // Terms stack above their definitions on a phone.
  const term = (await work(page).locator("dt").first().boundingBox())!;
  const definition = (await work(page).locator("dd").first().boundingBox())!;
  expect(definition.y).toBeGreaterThanOrEqual(term.y + term.height - 1);
});

test("on a wide screen the heading sits beside its intro and terms beside definitions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  // The section moves down once the web fonts swap in above it.
  await page.evaluate(() => document.fonts.ready);

  const heading = (await work(page).locator("h2").boundingBox())!;
  const intro = (await work(page).locator(".work-heading p").boundingBox())!;
  expect(intro.x).toBeGreaterThan(heading.x + heading.width);

  const term = (await work(page).locator("dt").first().boundingBox())!;
  const definition = (await work(page).locator("dd").first().boundingBox())!;
  expect(definition.x).toBeGreaterThan(term.x + term.width);
  expect(Math.abs(definition.y - term.y)).toBeLessThan(8);
});

test("the section reveals itself as it scrolls into view", async ({ page }) => {
  await page.goto("/");
  const last = page.getByRole("article", {
    name: "Government Water District HRIS",
  });

  await expect(last).toHaveCSS("opacity", "0");
  await expect(last).not.toHaveClass(/is-shown/);

  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveClass(/is-shown/);
  await expect(last).toHaveCSS("opacity", "1");
  await expect(last).toHaveCSS("transform", "none");
});

test("with reduced motion everything in the Work section is visible at once", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(work(page).locator("article")).toHaveCount(4);

  const states = await revealStates(page);
  // The heading block and the four cases.
  expect(states).toHaveLength(5);
  for (const state of states) {
    expect(state).toEqual({ opacity: "1", transform: "none", transition: "0s" });
  }
  await expect(work(page).locator(".reveal:not(.is-shown)")).toHaveCount(0);
});
