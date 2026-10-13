import { expect, test, type Page } from "@playwright/test";

type Box = { left: number; top: number; right: number; bottom: number };

// Each case's lines from the homepage: its pane's numeral and kind, who it
// was for, who it served, and the records written around its pane. The fork
// has no pane, so it carries its spark and its own records.
const cases = [
  {
    path: "/work/multi-company-hris",
    numeral: "I",
    kind: "Lead case study",
    for: "for HR and payroll teams at multiple legal companies, now sharing one platform",
    served: "HR and payroll teams",
    records: ["attendance", "overtime", "leave", "payroll rules"],
  },
  {
    path: "/work/payment-provider",
    numeral: "II",
    kind: "Integration case study",
    for: "for customers at checkout, who should only ever be charged once",
    served: "customers at checkout",
    records: ["checkout", "webhook", "signature", "one charge"],
  },
  {
    path: "/work/ai-odoo-rnd",
    numeral: "III",
    kind: "AI research and development",
    for: "for employees asking questions, who should only see what they're allowed to",
    served: "employees asking questions",
    records: ["question", "access rules", "records", "answer"],
  },
  {
    path: "/work/public-sector-hris",
    numeral: "IV",
    kind: "Public sector case study",
    for: "for the staff whose leave, overtime, and pass slips all hang on one punch",
    served: "the water district's staff",
    records: ["punch", "import", "correction", "one record"],
  },
  {
    path: "/systems/dots-hyprland",
    kind: "Actively maintained fork",
    served: "me, every day",
    records: ["workspace", "wallpaper", "launcher", "processes"],
  },
] as const;
const paths = cases.map((item) => item.path);

// Counts every animation frame the page asks for.
const countFrames = () => {
  const request = window.requestAnimationFrame.bind(window);
  (window as unknown as { frames: number }).frames = 0;
  window.requestAnimationFrame = (callback) => {
    (window as unknown as { frames: number }).frames++;
    return request(callback);
  };
};

async function open(page: Page, path: string, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".case-iron-front .case-chain")).toHaveCount(1);
}

// Scrolls to y and waits for the lights to follow.
async function scrollTo(page: Page, top: number) {
  await page.evaluate(async (y) => {
    window.scrollTo({ top: y, behavior: "instant" });
    await new Promise((resolve) => setTimeout(resolve, 80));
  }, top);
}
const scrollToEnd = (page: Page) => scrollTo(page, 1e6);

// The boxes the iron hangs beside and the iron's own, in viewport coordinates.
function measure(page: Page) {
  return page.evaluate(() => {
    const box = (element: Element): Box => {
      const { left, top, right, bottom } = element.getBoundingClientRect();
      return { left, top, right, bottom };
    };
    const centre = (element: Element) => {
      const { left, top, right, bottom } = element.getBoundingClientRect();
      return { x: (left + right) / 2, y: (top + bottom) / 2 };
    };
    const main = document.querySelector("main")!;
    const front = main.querySelector(".case-iron-front")!;
    const back = main.querySelector(".case-iron-back")!;
    const all = (selector: string, root: Element = main) => Array.from(root.querySelectorAll(selector));
    return {
      title: box(main.querySelector(".case-hero h1")!),
      kind: box(main.querySelector(".case-kind")!),
      records: all(".case-records li").map(box),
      labels: all(".section-label, .case-study-flow figcaption > span").map(box),
      steps: all(".case-study-flow .flow-lane > div, .personal-contributions li").map(box),
      plaques: all(".case-hero-meta, .case-study-flow .flow-lane, .personal-contributions ol").map(box),
      end: box(main.querySelector(".case-end p")!),
      hook: box(front.querySelector(".case-hook")!),
      chain: box(front.querySelector(".case-chain > .after-chain")!),
      crystals: all(".case-crystal", front).map(centre),
      flowers: all(".case-flower", front).map(centre),
      wires: all(".case-wire", front).map(box),
      brackets: all(".case-bracket", front).map((bracket) => ({
        arm: box(bracket.querySelector(".case-arm")!),
        chains: Array.from(bracket.querySelectorAll(".after-hanger .after-chain")).map(box),
      })),
      lotus: box(front.querySelector(".case-lotus")!),
      sags: all(".case-sag", back).map((sag) => Array.from(sag.children).map(box)),
      // Every box of text a reader needs.
      text: all("*")
        .filter(
          (element) =>
            !element.closest("svg, [aria-hidden='true']") &&
            Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim()) &&
            element.getClientRects().length > 0,
        )
        .map(box),
    };
  });
}

const overlaps = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const inside = (a: Box, b: Box) => a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;
const within = (y: number, b: Box) => y >= b.top && y <= b.bottom;

for (const item of cases) {
  test(`${item.path} opens on its kind line, its records, and who it was for`, async ({ page }) => {
    await page.goto(item.path);
    const kind = page.locator(".case-hero .case-kind");
    await expect(kind).toContainText(item.kind);
    if ("numeral" in item) {
      await expect(kind.locator("span")).toHaveText(item.numeral);
      await expect(kind.locator("span")).toHaveAttribute("aria-hidden", "true");
      await expect(page.locator(".case-hero .case-for")).toHaveText(item.for);
    } else {
      await expect(kind.locator("svg")).toHaveAttribute("aria-hidden", "true");
    }
    await expect(page.getByRole("list", { name: "Records it carries" }).getByRole("listitem")).toHaveText([
      ...item.records,
    ]);
    await expect(page.locator(".case-end")).toHaveText(`for ${item.served}`);
    // The kind line carries what the eyebrow and the maintenance label said.
    await expect(page.locator(".case-hero .eyebrow, .case-hero .maintenance-label")).toHaveCount(0);
  });
}

test("the iron is decoration, drawn into two hidden svgs on every case", async ({ page }) => {
  for (const path of paths) {
    await open(page, path);
    const iron = page.locator("main svg.case-iron");
    await expect(iron).toHaveCount(2);
    for (const svg of await iron.all()) await expect(svg).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(".case-end")).toHaveAttribute("aria-hidden", "true");
    const front = page.locator(".case-iron-front");
    await expect(front.locator(".case-hook")).toHaveCount(1);
    await expect(front.locator(".case-lotus")).toHaveCount(1);
    // The facts and the flow, or the fork's facts and themes, each on two chains.
    await expect(front.locator(".case-bracket")).toHaveCount(2);
    await expect(front.locator(".case-bracket .after-chain")).toHaveCount(4);
  }
});

for (const width of [360, 390, 1024, 1440, 1920]) {
  const wide = width > 900;
  test.describe(`at ${width}px`, () => {
    test("the chain hangs from its hook to the lotus, with a crystal at each label and a flower at each step", async ({
      page,
    }) => {
      for (const path of paths) {
        await open(page, path, width);
        const m = await measure(page);
        const x = (m.chain.left + m.chain.right) / 2;

        // Between the rail and the column, or down the gutter on phones.
        expect(m.chain.right, path).toBeLessThan(m.title.left);
        expect(m.chain.left, path).toBeGreaterThan(0);
        if (wide) {
          for (const left of [m.kind, ...m.records, ...m.labels]) expect(left.right, path).toBeLessThan(m.chain.left);
        }
        expect(m.hook.bottom, path).toBeLessThanOrEqual(m.chain.top + 2);
        expect(Math.abs(m.chain.bottom - m.lotus.top), path).toBeLessThan(8);
        expect(overlaps({ ...m.lotus, left: m.end.left, right: m.end.right }, m.end), path).toBe(true);

        expect(m.crystals, path).toHaveLength(m.labels.length + 1);
        expect(within(m.crystals[0].y, m.kind), path).toBe(true);
        m.labels.forEach((label, k) => expect(within(m.crystals[k + 1].y, label), path).toBe(true));
        expect(m.flowers, path).toHaveLength(m.steps.length);
        m.steps.forEach((step, k) => expect(within(m.flowers[k].y, step), path).toBe(true));
        for (const light of [...m.crystals, ...m.flowers]) expect(Math.abs(light.x - x), path).toBeLessThan(1);
      }
    });

    test("the records join the chain on wires where they sit beside it", async ({ page }) => {
      for (const path of paths) {
        await open(page, path, width);
        const m = await measure(page);
        const x = (m.chain.left + m.chain.right) / 2;
        if (!wide) {
          // On phones the records sit in the column, beyond the chain.
          for (const record of m.records) expect(record.left, path).toBeGreaterThan(m.chain.right);
          expect(m.wires, path).toHaveLength(0);
          continue;
        }
        expect(m.wires, path).toHaveLength(m.records.length);
        m.records.forEach((record, k) => {
          const wire = m.wires[k];
          expect(wire.left, path).toBeGreaterThanOrEqual(record.right);
          expect(Math.abs(wire.right - x), path).toBeLessThan(4);
          expect(within((wire.top + wire.bottom) / 2, record), path).toBe(true);
        });
      }
    });

    test("each plaque hangs on two chains from a bracket off the chain, clear of text", async ({ page }) => {
      for (const path of paths) {
        await open(page, path, width);
        const m = await measure(page);
        const x = (m.chain.left + m.chain.right) / 2;
        expect(m.brackets, path).toHaveLength(m.plaques.length);
        m.plaques.forEach((plaque, k) => {
          const { arm, chains } = m.brackets[k];
          expect(Math.abs(arm.left - x), path).toBeLessThan(6);
          expect(arm.right, path).toBeGreaterThan(plaque.right - 16);
          expect(arm.bottom, path).toBeLessThan(plaque.top);
          expect(m.text.filter((text) => overlaps(arm, text)), path).toEqual([]);
          expect(chains, path).toHaveLength(2);
          for (const chain of chains) {
            expect(Math.abs(chain.top - arm.bottom), path).toBeLessThan(2);
            expect(chain.bottom, path).toBeLessThanOrEqual(plaque.top);
            expect(chain.left, path).toBeGreaterThan(plaque.left);
            expect(chain.right, path).toBeLessThan(plaque.right);
          }
        });
      }
    });

    test(
      wide
        ? "a chain of iron stars sags in behind each plaque and never runs behind text"
        : "no chain of iron stars sags across a phone",
      async ({ page }) => {
        for (const path of paths) {
          await open(page, path, width);
          const m = await measure(page);
          if (!wide) {
            expect(m.sags, path).toHaveLength(0);
            continue;
          }
          expect(m.sags, path).toHaveLength(m.plaques.length);
          // The plaques are opaque, so only text outside them could show the
          // chain running behind it.
          const uncovered = m.text.filter((text) => !m.plaques.some((plaque) => inside(text, plaque)));
          m.sags.forEach((links, k) => {
            const plaque = m.plaques[k];
            expect(Math.min(...links.map((link) => link.left)), path).toBeGreaterThan(plaque.left);
            // It comes in from the edge of the screen.
            expect(Math.max(...links.map((link) => link.right)), path).toBeGreaterThan(width - 8);
            const behindText = links.filter((link) => uncovered.some((text) => overlaps(link, text)));
            expect(behindText, path).toEqual([]);
          });
        }
      },
    );

    test("nothing overflows the page", async ({ page }) => {
      for (const path of paths) {
        await open(page, path, width);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(width);
      }
    });
  });
}

test("what the reader has passed lights, and the glow runs down the chain to it", async ({ page }) => {
  await open(page, "/work/multi-company-hris");
  const front = page.locator(".case-iron-front");
  const crystals = front.locator(".case-crystal");
  const labels = page.locator(".section-label, .case-study-flow figcaption > span");
  const glow = () => front.locator(".case-iron-glow").evaluate((rect) => rect.getBoundingClientRect().height);

  // At the top the kind is read; nothing below the fold is.
  await expect(crystals.first()).toHaveClass(/is-lit/);
  await expect(page.locator(".case-kind")).toHaveClass(/is-passed/);
  await expect(crystals.last()).not.toHaveClass(/is-lit/);
  await expect(labels.last()).not.toHaveClass(/is-passed/);
  await expect(front.locator(".case-charm")).not.toHaveClass(/is-lit/);
  const before = await glow();

  // Bring the engineering decisions to the upper third of the screen.
  const decisions = page.locator(".decisions .section-label");
  const index = await labels.evaluateAll((all, target) => all.indexOf(target!), await decisions.elementHandle());
  await scrollTo(page, await decisions.evaluate((label) => label.getBoundingClientRect().top + scrollY - innerHeight * 0.3));
  await expect(decisions).toHaveClass(/is-passed/);
  await expect(crystals.nth(index + 1)).toHaveClass(/is-lit/);
  await expect(crystals.nth(index)).toHaveClass(/is-lit/);
  // A label further down than the reading line is not read yet.
  const unread = await labels.evaluateAll((all) =>
    all.findIndex((label) => label.getBoundingClientRect().top > innerHeight * 0.6),
  );
  expect(unread).toBeGreaterThan(index);
  await expect(labels.nth(unread)).not.toHaveClass(/is-passed/);
  await expect(crystals.nth(unread + 1)).not.toHaveClass(/is-lit/);
  expect(await glow()).toBeGreaterThan(before);
});

for (const [width, height] of [
  [1440, 900],
  [1280, 600],
  [390, 664],
]) {
  test(`at the end of each case the lotus lights beside who it was for (${width}×${height})`, async ({ page }) => {
    for (const path of paths) {
      await open(page, path, width, height);
      await scrollToEnd(page);
      const front = page.locator(".case-iron-front");
      await expect(front.locator(".case-charm"), path).toHaveClass(/is-lit/);
      await expect(page.locator(".case-end"), path).toHaveClass(/is-passed/);
      for (const light of await front.locator(".case-crystal, .case-flower").all()) {
        await expect(light, path).toHaveClass(/is-lit/);
      }
      // The glow has run the length of the chain.
      const { glow, chain } = await front.evaluate((svg) => ({
        glow: svg.querySelector(".case-iron-glow")!.getBoundingClientRect().bottom,
        chain: svg.querySelector(".case-chain > .after-chain")!.getBoundingClientRect().bottom,
      }));
      expect(Math.abs(glow - chain), path).toBeLessThan(8);
    }
  });
}

test("the lotus sways and glows only while it is on screen", async ({ page }) => {
  await open(page, "/work/multi-company-hris");
  const front = page.locator(".case-iron-front");
  const states = () =>
    front.evaluate((svg) =>
      svg
        .getAnimations({ subtree: true })
        .filter((animation) => animation instanceof CSSAnimation)
        .map((animation) => animation.playState),
    );
  await expect(front.locator(".case-sway")).toHaveCount(1);
  await expect(front.locator(".case-ember")).toHaveCount(1);

  // Off screen at the top of the page, and not yet read, so it does not glow.
  await expect(front).toHaveClass(/is-paused/);
  expect(await states()).toEqual(["paused"]);

  await scrollToEnd(page);
  await expect(front).not.toHaveClass(/is-paused/);
  await expect.poll(states).toEqual(["running", "running"]);

  await scrollTo(page, 0);
  await expect(front).toHaveClass(/is-paused/);
  await expect.poll(states).toEqual(["paused"]);
});

test("under reduced motion nothing in the iron animates, and the lights still follow the reader", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(countFrames);
  for (const path of paths) {
    await open(page, path);
    const front = page.locator(".case-iron-front");
    await expect(front.locator(".case-sway, .case-ember")).toHaveCount(0);
    for (let top = 0; top < 6000; top += 450) await scrollTo(page, top);
    await scrollToEnd(page);
    await expect(front.locator(".case-charm"), path).toHaveClass(/is-lit/);
    await expect(page.locator(".case-end"), path).toHaveClass(/is-passed/);
    expect(await page.locator("main").evaluate((main) => main.getAnimations({ subtree: true }).length), path).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { frames: number }).frames), path).toBe(0);
  }
});

test("a resize redraws the iron once and leaves no second copy", async ({ page }) => {
  await open(page, "/work/multi-company-hris");
  await page.evaluate(() => {
    const front = document.querySelector(".case-iron-front")!;
    const counter = window as unknown as { redraws: number };
    counter.redraws = 0;
    new MutationObserver((records) => {
      for (const record of records) {
        if (Array.from(record.addedNodes).some((node) => node.nodeName === "defs")) counter.redraws++;
      }
    }).observe(front, { childList: true });
  });
  const redraws = () => page.evaluate(() => (window as unknown as { redraws: number }).redraws);

  await page.setViewportSize({ width: 1100, height: 800 });
  await expect.poll(redraws).toBe(1);
  await page.waitForTimeout(300);
  expect(await redraws()).toBe(1);

  const main = page.locator("main");
  await expect(main.locator(".case-iron-front defs")).toHaveCount(1);
  await expect(main.locator(".case-chain")).toHaveCount(1);
  await expect(main.locator(".case-charm")).toHaveCount(1);
  await expect(main.locator(".case-bracket")).toHaveCount(2);
  await expect(main.locator(".case-sag")).toHaveCount(2);
});
