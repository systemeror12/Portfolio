import { expect, test, type Page } from "@playwright/test";

const steps = [
  {
    number: "one",
    title: "Trace the operation",
    description:
      "Start with the people, records, approvals, and outcomes the system has to support.",
  },
  {
    number: "two",
    title: "Define the boundaries",
    description:
      "Make permissions, company rules, external ownership, and confidentiality explicit.",
  },
  {
    number: "three",
    title: "Design the failure path",
    description:
      "Treat retries, invalid state, missing context, and what the customer sees as real behavior.",
  },
  {
    number: "four",
    title: "Validate the result",
    description:
      "Check the finished flow against representative scenarios and what the operation expects.",
  },
] as const;

function method(page: Page) {
  return page.locator("section#method");
}

// The staff, each note's head, and the final bar, measured from the list's
// CSS. Pseudo-elements have no boxes of their own, so their centres come from
// their computed offsets inside each step.
function phraseGeometry(page: Page) {
  return method(page)
    .locator("ol")
    .evaluate((list) => {
      const box = list.getBoundingClientRect();
      const style = getComputedStyle(list);
      const notes = Array.from(list.children).map((item) => {
        const itemBox = item.getBoundingClientRect();
        const head = getComputedStyle(item, "::before");
        const stem = getComputedStyle(item, "::after");
        return {
          x:
            itemBox.left -
            box.left +
            parseFloat(head.left) +
            parseFloat(head.width) / 2,
          y:
            itemBox.top -
            box.top +
            parseFloat(head.top) +
            parseFloat(head.height) / 2,
          background: head.backgroundColor,
          glow: head.boxShadow,
          stem: stem.display,
          text: item.querySelector("h3")!.getBoundingClientRect().left - box.left,
        };
      });
      const bar = getComputedStyle(list, "::after");
      return {
        width: box.width,
        height: box.height,
        image: style.backgroundImage,
        position: style.backgroundPosition,
        size: style.backgroundSize,
        bar: {
          display: bar.display,
          left: parseFloat(bar.borderLeftWidth),
          right: parseFloat(bar.borderRightWidth),
        },
        notes,
      };
    });
}

// The staff's five 1px lines start at its origin and repeat every 9px.
const lineCentres = (origin: number) =>
  [0, 9, 18, 27, 36].map((offset) => origin + offset + 0.5);

test("Method presents the four steps as an ordered list", async ({ page }) => {
  await page.goto("/");

  const section = page.getByRole("region", {
    name: "How I start on a system I've never seen.",
  });
  await expect(section).toHaveAttribute("id", "method");
  await expect(
    section.getByText(/^Four notes, always in this order: /),
  ).toBeVisible();

  const items = section.getByRole("list").getByRole("listitem");
  await expect(section.getByRole("list")).toHaveJSProperty("tagName", "OL");
  await expect(items).toHaveCount(4);
  for (const [index, step] of steps.entries()) {
    const item = items.nth(index);
    await expect(
      item.getByRole("heading", { level: 3, name: step.title }),
    ).toBeVisible();
    await expect(item.getByText(step.description, { exact: true })).toBeVisible();
    await expect(item.locator("span")).toHaveText(step.number);
    await expect(item.locator("span")).toHaveAttribute("aria-hidden", "true");
  }
});

test("the Approach section is gone and the header links to Method", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  await expect(page.locator("#approach, .approach")).toHaveCount(0);
  await expect(page.locator('a[href="/#approach"]')).toHaveCount(0);
  await expect(page.getByText("Reliability starts before the code.")).toHaveCount(0);

  if (await page.getByRole("button", { name: "Open navigation" }).isVisible()) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Method", exact: true })
    .click();
  await expect(page).toHaveURL("/#method");
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.abs(document.getElementById("method")!.getBoundingClientRect().top),
      ),
    )
    .toBeLessThanOrEqual(1);
});

test("on a wide screen the notes climb a level staff to a final double bar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const phrase = await phraseGeometry(page);

  // A horizontal staff, 37px tall, 6px from the top.
  expect(phrase.image).toMatch(/^repeating-linear-gradient\(/);
  expect(phrase.image).not.toContain("90deg");
  expect(phrase.position).toBe("0px 6px");
  expect(phrase.size).toBe("100% 37px");
  expect(phrase.bar).toEqual({ display: "block", left: 1, right: 3 });

  // The steps sit side by side, and each head is on the line above the last.
  const lines = lineCentres(6);
  for (const [index, note] of phrase.notes.entries()) {
    expect(note.y).toBeCloseTo(lines[4 - index], 1);
    expect(note.stem).toBe("block");
    if (index > 0) {
      expect(note.x).toBeGreaterThan(phrase.notes[index - 1].x + 200);
    }
  }

  // Three violet notes and a rose fourth with a glow.
  const [one, two, three, four] = phrase.notes;
  expect(new Set([one.background, two.background, three.background]).size).toBe(1);
  expect(one.glow).toBe("none");
  expect(four.background).not.toBe(one.background);
  expect(four.glow).not.toBe("none");

  // The heading sits beside its intro.
  const heading = (await method(page).locator("h2").boundingBox())!;
  const intro = (await method(page).locator(".method-heading p").boundingBox())!;
  expect(intro.x).toBeGreaterThan(heading.x + heading.width);
});

test("at 390px the staff stands upright beside the steps, each note on its line", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const phrase = await phraseGeometry(page);

  // A vertical staff, 37px wide, down the whole list, with no final bar.
  expect(phrase.image).toContain("90deg");
  expect(phrase.position).toBe("0px 0px");
  expect(phrase.size).toBe("37px 100%");
  expect(phrase.bar.display).toBe("none");

  // The steps stack, each note's head on its own line, the text clear of the staff.
  const lines = lineCentres(0);
  for (const [index, note] of phrase.notes.entries()) {
    expect(note.x).toBeCloseTo(lines[4 - index], 1);
    expect(note.stem).toBe("none");
    expect(note.text).toBeGreaterThanOrEqual(37);
    if (index > 0) {
      expect(note.y).toBeGreaterThan(phrase.notes[index - 1].y + 40);
    }
  }
  expect(phrase.notes.at(-1)!.y).toBeLessThan(phrase.height);

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  const outside = await method(page).evaluate((section) =>
    Array.from(section.querySelectorAll("*"))
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && (box.left < 0 || box.right > window.innerWidth);
      })
      .map((element) => element.textContent!.trim().slice(0, 40)),
  );
  expect(outside).toEqual([]);
});

test("the section reveals itself as it scrolls into view", async ({ page }) => {
  await page.goto("/");
  const phrase = method(page).locator("ol");

  await expect(phrase).toHaveCSS("opacity", "0");
  await phrase.scrollIntoViewIfNeeded();
  await expect(phrase).toHaveClass(/is-shown/);
  await expect(phrase).toHaveCSS("opacity", "1");
  await expect(phrase).toHaveCSS("transform", "none");
});

test("with reduced motion the Method section is visible at once", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const reveals = method(page).locator(".reveal");
  await expect(reveals).toHaveCount(2);
  await expect(method(page).locator(".reveal:not(.is-shown)")).toHaveCount(0);
  for (const element of await reveals.all()) {
    await expect(element).toHaveCSS("opacity", "1");
    await expect(element).toHaveCSS("transform", "none");
  }
});
