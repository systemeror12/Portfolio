import { expect, test, type Page } from "@playwright/test";

// The hero's scene is a stack of layers, one <svg> per depth band (ADR 0001,
// Layered scenes), within the budget #81 sets. Each layer carries its kind:
// what the animation loop moves is in layers that repaint, what CSS moves is
// in layers the compositor moves whole, and nothing in a still layer
// changes. A band the compositor moves is a run of layers, one per part.
const desktop = [
  ["back-lilies", "still"],
  ["back-twinkles", "compositor"],
  ["back-strings", "still"],
  ["back-lamps", "repaints"],
  ["heart", "repaints"],
  ["shimmer", "compositor"],
  ["dial", "still"],
  ["clockwork", "repaints"],
  ["mid-strings", "still"],
  ["mid-lamps", "repaints"],
  ["sprigs", "still"],
  ["near-lilies", "compositor"],
  ["near-strings", "still"],
  ["near-lamps", "repaints"],
  ["glints", "compositor"],
];
const tablet = [
  ["back-strings", "still"],
  ["back-lamps", "repaints"],
  ["heart", "repaints"],
  ["shimmer", "compositor"],
  ["dial", "still"],
  ["clockwork", "repaints"],
  ["front-strings", "still"],
  ["front-lamps", "repaints"],
  ["back-lilies", "still"],
  ["back-twinkles", "compositor"],
  ["sprigs", "still"],
  ["near-lilies", "compositor"],
  ["glints", "compositor"],
];

// Every child of the scene, with its band and kind, and its box as a share
// of the hero.
async function layers(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
  return page.evaluate(() => {
    const scene = document.querySelector(".hero > .hero-scene")!;
    const hero = scene.parentElement!.getBoundingClientRect();
    return [...scene.children].map((layer) => {
      const box = layer.getBoundingClientRect();
      return {
        tag: layer.tagName,
        band: layer.getAttribute("data-band"),
        kind: layer.getAttribute("data-layer"),
        willChange: getComputedStyle(layer).willChange,
        hidden: layer.getAttribute("aria-hidden"),
        area: (box.width * box.height) / (hero.width * hero.height),
      };
    });
  });
}

for (const [width, height, order] of [
  [1440, 900, desktop],
  [1920, 1080, desktop],
  [390, 844, desktop],
  [1180, 820, tablet],
  [820, 1180, tablet],
  [844, 390, tablet],
] as const) {
  test(`at ${width}×${height} the scene draws into its layers in depth order`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(".hero > .hero-scene")).toHaveAttribute("aria-hidden", "true");
    const stack = await layers(page);
    const bands = stack.map((layer) => [layer.band, layer.kind]);
    expect(bands.filter(([band], i) => i === 0 || band !== bands[i - 1][0])).toEqual(order);
    // Each layer is composited on its own, so a change repaints only it. A
    // swaying lily's layer is an HTML wrapper.
    for (const layer of stack) {
      const tag = layer.band === "near-lilies" ? "DIV" : "svg";
      expect(layer).toMatchObject({ tag, hidden: "true", willChange: "transform" });
    }
    // #82: a layer per glass pane, per glint, per swaying lily, and per phase
    // of the far lilies' twinkles.
    const count = (band: string) => stack.filter((layer) => layer.band === band).length;
    expect(count("shimmer")).toBe(9);
    expect(count("back-twinkles")).toBe(2);
    expect(count("near-lilies")).toBe(await page.locator(".hero-scene .lily-sway").count());
    expect(count("glints")).toBe(await page.locator(".hero-scene .glint").count());
  });
}

// Runs the page's faked clock until a string run shows the lamps.
async function untilRun(page: Page) {
  const lamps = page.locator(".hero-scene > [data-band$=lamps]");
  for (let t = 0; t < 15_000 && !(await lamps.first().isVisible()); t += 250) await page.clock.runFor(250);
  for (const layer of await lamps.all()) await expect(layer).toBeVisible();
}

test.describe("on a tablet at 1180×820 @2x", () => {
  test.use({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });

  test("while a run plays the layers stay within #81's budget: 160 layers, 8 hero-areas", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await untilRun(page);
    // Every layer the browser composites: each of the scene's, and each
    // twinkle's in a swaying lily. A lily's drawing paints into its wrapper's.
    const budget = await page.evaluate(() => {
      const scene = document.querySelector(".hero > .hero-scene")!;
      const hero = scene.parentElement!.getBoundingClientRect();
      const composited = [...scene.querySelectorAll("[data-layer]")].filter(
        (layer) => layer.parentElement === scene || layer.getAttribute("data-layer") !== "still",
      );
      return {
        count: composited.length,
        area: composited.reduce((sum, layer) => {
          const box = layer.getBoundingClientRect();
          return sum + (box.width * box.height) / (hero.width * hero.height);
        }, 0),
      };
    });
    console.log(`layer budget at 1180×820 @2x: ${budget.count} layers, ${budget.area.toFixed(2)} hero-areas`);
    expect(budget.count).toBeLessThanOrEqual(160);
    expect(budget.area).toBeLessThanOrEqual(8);
  });
});

for (const [width, height] of [
  [1440, 900],
  [1180, 820],
] as const) {
  test(`at ${width}×${height}, over 15 s with a string run, nothing in a still layer changes or animates`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.clock.install();
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      const watch = window as unknown as { changes: string[]; runs: number };
      watch.changes = [];
      watch.runs = 0;
      for (const layer of document.querySelectorAll<SVGSVGElement>(".hero-scene [data-layer=still]")) {
        const band = layer.dataset.band ?? layer.parentElement!.dataset.band;
        new MutationObserver((records) => watch.changes.push(...records.map((r) => `${band}: ${r.type}`))).observe(layer, {
          subtree: true,
          attributes: true,
          childList: true,
          characterData: true,
        });
      }
      // A run shows the lamps' layers.
      const lamps = document.querySelector<SVGSVGElement>(".hero-scene > [data-band$=lamps]")!;
      new MutationObserver(() => (watch.runs += Number(lamps.style.display !== "none"))).observe(lamps, {
        attributes: true,
        attributeFilter: ["style"],
      });
    });
    await page.clock.runFor(15_000);
    const seen = await page.evaluate(() => {
      const { changes, runs } = window as unknown as { changes: string[]; runs: number };
      const scene = document.querySelector(".hero-scene")!;
      const animated = document
        .getAnimations()
        .map((animation) => (animation.effect as KeyframeEffect).target!)
        .filter((target) => target === scene || target.closest(".hero-scene [data-layer=still]"));
      return {
        still: scene.querySelectorAll("[data-layer=still]").length,
        changes,
        runs,
        animated: animated.map((target) => target.outerHTML.slice(0, 80)),
      };
    });
    expect(seen.still).toBeGreaterThan(0);
    expect(seen.runs).toBeGreaterThan(0);
    expect(seen.changes).toEqual([]);
    expect(seen.animated).toEqual([]);
  });
}

// Every CSS animation in the hero, by its layer's band, and whether it runs.
const heroAnimations = (page: Page) =>
  page.evaluate(() =>
    document.querySelector(".hero")!.getAnimations({ subtree: true }).map((animation) => {
      const target = (animation.effect as KeyframeEffect).target!;
      const layer = target.closest<HTMLElement | SVGElement>(".hero-scene > *");
      return { band: layer?.dataset.band, state: animation.playState };
    }),
  );

test("each part CSS moves animates its own layer, only while the hero is on screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const running = await heroAnimations(page);
  expect(new Set(running.map((animation) => animation.state))).toEqual(new Set(["running"]));
  expect(new Set(running.map((animation) => animation.band))).toEqual(
    new Set(["back-twinkles", "shimmer", "near-lilies", "glints"]),
  );
  // Each animation runs on a layer: a lifted <svg>, or a swaying lily's
  // wrapper or one of its twinkles.
  const targets = await page.evaluate(() =>
    document.querySelector(".hero-scene")!.getAnimations({ subtree: true }).map((animation) => {
      const target = (animation.effect as KeyframeEffect).target!;
      return target.hasAttribute("data-layer") && target.getAttribute("data-layer") !== "still";
    }),
  );
  expect(new Set(targets)).toEqual(new Set([true]));

  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(page.locator(".hero-scene")).toHaveClass(/is-paused/);
  expect(new Set((await heroAnimations(page)).map((animation) => animation.state))).toEqual(new Set(["paused"]));
});

test("under reduced motion nothing in the hero animates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".hero-scene .hero-lily")).not.toHaveCount(0);
  expect(await heroAnimations(page)).toEqual([]);
});

test("a resize while the loop runs leaves it writing to the new drawing", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    (window as unknown as { old: Element[] }).old = [...document.querySelector(".hero-scene")!.children];
  });
  await page.setViewportSize({ width: 1100, height: 800 });
  await expect(page.locator(".hero-scene > [data-band=clockwork]")).toHaveAttribute("viewBox", /^0 0 1100 /);
  // Every write the loop makes over half a second, to the old layers and the new.
  const writes = await page.evaluate(
    () =>
      new Promise<{ old: number; new: number; attached: number }>((resolve) => {
        const { old } = window as unknown as { old: Element[] };
        const writes = { old: 0, new: 0, attached: old.filter((layer) => layer.isConnected).length };
        const watch = (layers: Element[], key: "old" | "new") => {
          const observer = new MutationObserver((records) => (writes[key] += records.length));
          for (const layer of layers) observer.observe(layer, { subtree: true, attributes: true, childList: true });
        };
        watch(old, "old");
        watch([...document.querySelector(".hero-scene")!.children], "new");
        setTimeout(() => resolve(writes), 500);
      }),
  );
  expect(writes).toMatchObject({ old: 0, attached: 0 });
  expect(writes.new).toBeGreaterThan(0);
});

// Keeps the observers watching the hero, until they are disconnected.
const trackObservers = () => {
  const live = new Set<object>();
  for (const Kind of [ResizeObserver, IntersectionObserver]) {
    const { observe, disconnect } = Kind.prototype;
    Kind.prototype.observe = function (this: ResizeObserver & IntersectionObserver, target: Element, ...rest: []) {
      if (target.matches(".hero")) live.add(this);
      return observe.call(this, target, ...rest);
    };
    Kind.prototype.disconnect = function (this: ResizeObserver & IntersectionObserver) {
      live.delete(this);
      return disconnect.call(this);
    };
  }
  (window as unknown as { heroObservers: Set<object> }).heroObservers = live;
};

test("leaving the homepage removes every layer and disconnects every observer", async ({ page }) => {
  await page.addInitScript(trackObservers);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const watching = () => page.evaluate(() => (window as unknown as { heroObservers: Set<object> }).heroObservers.size);
  expect(await watching()).toBe(2);
  await page.evaluate(() => {
    (window as unknown as { scene: Element }).scene = document.querySelector(".hero-scene")!;
    window.history.pushState({}, "", "/work/multi-company-hris");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.locator(".hero")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { scene: Element }).scene.childElementCount)).toBe(0);
  expect(await watching()).toBe(0);
});
