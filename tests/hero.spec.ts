import { expect, test, type Page } from "@playwright/test";

const title = "Every record ends with a person.";

async function heroBoxes(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const box = (selector: string) => {
      const { left, right, top, bottom, width, height } = document
        .querySelector(selector)!
        .getBoundingClientRect();
      return { left, right, top: top + scrollY, bottom: bottom + scrollY, width, height };
    };
    const hero = document.querySelector(".hero")!;
    return {
      hero: box(".hero"),
      copy: box(".hero-copy"),
      buttons: [...hero.querySelectorAll(".hero-actions a")].map((a) => {
        const { left, right, top, bottom } = a.getBoundingClientRect();
        return { left, right, top, bottom };
      }),
      outside: [...hero.querySelectorAll(".hero-copy *")]
        .filter((element) => {
          const { left, right } = element.getBoundingClientRect();
          return left < 0 || right > innerWidth;
        })
        .map((element) => element.textContent),
      pageWidth: document.documentElement.scrollWidth,
    };
  });
}

test("the hero carries the Nocturne copy, labelled by the page's only h1", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.getByRole("region", { name: title });
  await expect(hero).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(hero).toContainText(
    "Jerome Mendoza, platform engineer in the Philippines",
  );
  await expect(hero).toContainText(
    "A punch at the gate. An overtime request. A payment webhook at 25:00. Somewhere down the line, someone gets paid, or doesn't. I build and maintain the HR, payroll, payment, and accounting systems that make sure they do.",
  );
  await expect(page.getByText("Reconstructed system map")).toHaveCount(0);
  await expect(hero.getByRole("link", { name: "Email me" })).toHaveAttribute(
    "href",
    "mailto:mendozajeromevrixen@gmail.com",
  );
});

test("See the work goes to the work section", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "See the work" }).click();
  await expect(page).toHaveURL("/#work");
  await expect(page.locator("#work")).toBeInViewport();
});

test("the actions take focus in order with a visible outline", async ({ page }) => {
  await page.goto("/");
  const work = page.getByRole("link", { name: "See the work" });
  const email = page.getByRole("link", { name: "Email me" });
  await work.focus();
  await expect(work).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(email).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(work).toBeFocused();
  for (const link of [work, email]) {
    await link.focus();
    await expect(link).toHaveCSS("outline-style", "solid");
  }
});

test("a scene placed in the hero sits behind the copy and its shade", async ({
  page,
}) => {
  await page.goto("/");
  const hits = await page.evaluate(() => {
    const hero = document.querySelector(".hero")!;
    const copy = hero.querySelector(".hero-copy")!;
    const scene = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    scene.setAttribute("style", "position:absolute;inset:0;width:100%;height:100%");
    hero.prepend(scene);
    const hit = (element: Element, x: (box: DOMRect) => number) => {
      element.scrollIntoView({ block: "center", behavior: "instant" });
      const box = element.getBoundingClientRect();
      return document.elementFromPoint(x(box), box.top + box.height / 2);
    };
    return {
      // Left of the copy, only the shade covers the scene.
      shade: hit(copy, (box) => box.left / 2) === copy,
      copy: [...hero.querySelectorAll("h1, .hero-lede, .hero-actions a")].map(
        (element) => element.contains(hit(element, (box) => box.left + 4)),
      ),
    };
  });
  expect(hits.shade).toBe(true);
  expect(hits.copy).not.toContain(false);
});

test("the hero holds still under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const moving = await page.evaluate(() =>
    [document.querySelector(".hero")!, ...document.querySelectorAll(".hero *")]
      .map((element) => getComputedStyle(element))
      .filter(
        (style) =>
          style.animationDuration !== "0s" || style.transitionDuration !== "0s",
      ).length,
  );
  expect(moving).toBe(0);
});

test("at 390px the copy sits at the foot of the hero and the buttons share a row", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const { hero, copy, buttons, outside, pageWidth } = await heroBoxes(page);

  expect(pageWidth).toBeLessThanOrEqual(390);
  expect(outside).toEqual([]);
  expect(hero.bottom - copy.bottom).toBeLessThan(1);
  expect(copy.top - hero.top).toBeGreaterThan(hero.height / 3);
  expect(buttons).toHaveLength(2);
  expect(buttons[0].top).toBe(buttons[1].top);
  expect(buttons[0].right).toBeLessThan(buttons[1].left);
  expect(buttons[0].left).toBeGreaterThanOrEqual(24);
  expect(buttons[1].right).toBeLessThanOrEqual(390 - 24);
});

test("at 1440px the copy is centred in the hero and the buttons share a row", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const { hero, copy, buttons, outside, pageWidth } = await heroBoxes(page);

  expect(pageWidth).toBeLessThanOrEqual(1440);
  expect(outside).toEqual([]);
  expect(copy.left).toBe(120);
  expect(hero.height).toBeGreaterThanOrEqual(900);
  expect(
    Math.abs(copy.top + copy.height / 2 - (hero.top + hero.height / 2)),
  ).toBeLessThan(2);
  expect(buttons[0].top).toBe(buttons[1].top);
});
