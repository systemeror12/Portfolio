import { expect, test, type Page } from "@playwright/test";

const cases = [
  { title: "Multi-Company HRIS", served: "HR and payroll teams" },
  { title: "Payment Provider Module", served: "customers at checkout" },
  { title: "Access-Scoped Retrieval", served: "employees asking questions" },
  { title: "Government Water District HRIS", served: "the water district's staff" },
] as const;

// Counts every animation frame the page asks for.
const countFrames = () => {
  const request = window.requestAnimationFrame.bind(window);
  (window as unknown as { frames: number }).frames = 0;
  window.requestAnimationFrame = (callback) => {
    (window as unknown as { frames: number }).frames++;
    return request(callback);
  };
};
const frames = (page: Page) =>
  page.evaluate(() => (window as unknown as { frames: number }).frames);

// Scrolls so the middle of the nth case sits at the middle of the viewport.
async function readCase(page: Page, index: number) {
  await page.evaluate((index) => {
    const box = document.querySelectorAll("#work .work-case")[index].getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + box.top + box.height / 2 - innerHeight / 2, behavior: "instant" });
  }, index);
}

// Where each record dot is now.
const records = (page: Page) =>
  page
    .locator(".rose-window .rose-record")
    .evaluateAll((dots) => dots.map((dot) => `${dot.getAttribute("cx")},${dot.getAttribute("cy")}`));

test.describe("on a wide screen", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("the case at the middle of the viewport lights its pane, turns the hand, and names who it served", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const rose = page.locator("#work .work-rose");
    await expect(rose).toHaveAttribute("aria-hidden", "true");
    // The hand is the shared iron hour hand.
    await expect(rose.locator(".rose-hand > .iron-hand-hour")).toHaveCount(1);

    for (const [index, item] of cases.entries()) {
      await readCase(page, index);
      await expect(rose.locator(".rose-pane").nth(index)).toHaveClass(/is-lit/);
      await expect(rose.locator(".rose-pane.is-lit")).toHaveCount(1);
      await expect(rose.locator(".work-rose-for")).toHaveText(`for ${item.served}`);
      await expect(page.getByRole("article", { name: item.title, exact: true })).toHaveClass(/is-lit/);
      await expect(page.locator("#work .work-case.is-lit")).toHaveCount(1);
      await expect(rose.locator(".rose-hand")).toHaveAttribute(
        "style",
        `transform: rotate(${index * 90 + 45}deg);`,
      );
    }
  });

  test("the window stays beside the cases as they scroll", async ({ page }) => {
    await page.goto("/");
    for (const index of [0, 3]) {
      await readCase(page, index);
      const rose = (await page.locator(".rose-window").boundingBox())!;
      const article = (await page.locator("#work .work-case").nth(index).boundingBox())!;
      expect(rose.x + rose.width).toBeLessThanOrEqual(article.x);
      expect(rose.y).toBeGreaterThanOrEqual(0);
      expect(rose.y + rose.height).toBeLessThanOrEqual(800);
    }
  });

  test("the lunette stays hidden", async ({ page }) => {
    await page.goto("/");
    await readCase(page, 0);
    await expect(page.locator("#work .work-lunette")).toBeHidden();
  });

  test("the rim text is 14px, medium, haloed, never dimmed, upright, and fits its arc", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await readCase(page, 0);
    await expect(page.locator(".rose-pane").first()).toHaveClass(/is-lit/);

    const labels = await page.locator(".rose-window .rose-records").evaluateAll((texts) =>
      texts.map((text) => {
        const label = text as SVGTextElement;
        const arc = document.querySelector<SVGPathElement>(
          label.querySelector("textPath")!.getAttribute("href")!,
        )!;
        const style = getComputedStyle(label);
        // How much the text is dimmed by itself and everything above it.
        let opacity = 1;
        for (let node: Element | null = label; node && node.tagName !== "svg"; node = node.parentElement) {
          opacity *= Number(getComputedStyle(node).opacity);
        }
        const last = label.getNumberOfChars() - 1;
        return {
          lit: label.closest(".rose-pane")!.classList.contains("is-lit"),
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          fill: style.fill,
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          paintOrder: style.paintOrder,
          opacity,
          length: label.getComputedTextLength(),
          arc: arc.getTotalLength(),
          rotation: label.getRotationOfChar(Math.floor(last / 2)),
          start: label.getStartPositionOfChar(0).x,
          end: label.getEndPositionOfChar(last).x,
        };
      }),
    );

    expect(labels).toHaveLength(4);
    for (const [index, label] of labels.entries()) {
      expect(label.lit).toBe(index === 0);
      expect(label.fontSize).toBe("14px");
      expect(label.fontWeight).toBe("500");
      expect(label.stroke).toBe("rgb(6, 6, 11)");
      expect(label.strokeWidth).toBe("3px");
      expect(label.paintOrder).toMatch(/^stroke/);
      expect(label.opacity).toBe(1);
      // Silver on the lit pane, mist on the others.
      expect(label.fill).toBe(index === 0 ? "rgb(236, 232, 244)" : "rgb(154, 143, 171)");
      expect(label.length).toBeGreaterThan(0);
      expect(label.length).toBeLessThanOrEqual(label.arc);
      // Upright: it reads left to right, never tipped past the vertical.
      expect(label.end).toBeGreaterThan(label.start);
      expect(Math.abs(label.rotation)).toBeLessThan(90);
    }
  });

  test("the window animates only while it is on screen", async ({ page }) => {
    await page.goto("/");
    const scene = page.locator(".rose-window");
    // Below the hero, out of sight, the window waits.
    await expect(scene).toHaveClass(/is-paused/);
    const still = await records(page);
    await page.waitForTimeout(300);
    expect(await records(page)).toEqual(still);

    await readCase(page, 0);
    await expect(scene).not.toHaveClass(/is-paused/);
    const first = await records(page);
    await expect.poll(() => records(page)).not.toEqual(first);

    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(scene).toHaveClass(/is-paused/);
    const paused = await records(page);
    await page.waitForTimeout(500);
    expect(await records(page)).toEqual(paused);

    await readCase(page, 1);
    await expect(scene).not.toHaveClass(/is-paused/);
    await expect.poll(() => records(page)).not.toEqual(paused);
  });

  test("with reduced motion the records stay still and no animation frames run", async ({
    page,
  }) => {
    await page.addInitScript(countFrames);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    for (const [index, item] of cases.entries()) {
      await readCase(page, index);
      await expect(page.locator(".rose-pane").nth(index)).toHaveClass(/is-lit/);
      await expect(page.locator(".work-rose-for")).toHaveText(`for ${item.served}`);
    }
    await page.waitForTimeout(500);
    expect(await frames(page)).toBe(0);

    const dots = await page.locator(".rose-window .rose-record").evaluateAll((elements) =>
      elements.map((dot) => ({ cx: dot.getAttribute("cx"), opacity: dot.getAttribute("opacity") })),
    );
    expect(dots).toHaveLength(16);
    for (const dot of dots) expect(dot).toEqual({ cx: null, opacity: "0" });
    await expect(page.locator(".rose-hand")).toHaveCSS("transition-duration", "0s");
    await expect(page.locator(".rose-pane .rose-glass").first()).toHaveCSS("transition-duration", "0s");
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const lunette = (page: Page) => page.locator("#work .work-lunette");
  const lunetteRecords = (page: Page) =>
    page
      .locator(".rose-lunette .rose-record")
      .evaluateAll((dots) => dots.map((dot) => `${dot.getAttribute("cx")},${dot.getAttribute("cy")}`));

  test("the per-case still roses are gone, and the lunette holds the window instead", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#work .work-rose")).toBeHidden();
    await expect(page.locator("#work .work-case-rose")).toHaveCount(0);
    await readCase(page, 0);
    await expect(lunette(page)).toBeVisible();
    await expect(lunette(page)).toHaveAttribute("aria-hidden", "true");
  });

  test("reading each case lights its pane, turns it to the top, and names who it served", async ({
    page,
  }) => {
    await page.goto("/");
    const scene = lunette(page);
    for (const [index, item] of cases.entries()) {
      await readCase(page, index);
      await expect(scene.locator(".rose-pane").nth(index)).toHaveClass(/is-lit/);
      await expect(scene.locator(".rose-pane.is-lit")).toHaveCount(1);
      await expect(scene.locator(".rose-turn")).toHaveAttribute(
        "style",
        `transform: rotate(${-(index * 90 + 45)}deg);`,
      );
      await expect(scene.locator(".work-lunette-for")).toHaveText(`for ${item.served}`);
    }
  });

  test("it fills the foot of the screen while a case is read, and rests above the next section after the last", async ({
    page,
  }) => {
    await page.goto("/");
    for (const index of cases.keys()) {
      await readCase(page, index);
      const box = (await lunette(page).boundingBox())!;
      expect(box.x).toBe(0);
      expect(box.width).toBe(390);
      expect(box.height).toBe(102);
      expect(box.y + box.height).toBeCloseTo(844, 0);
    }

    // Bring the end of the Work section to the middle of the screen.
    await page.evaluate(() => {
      const box = document.querySelector("#work")!.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + box.bottom - innerHeight / 2, behavior: "instant" });
    });
    const rest = (await lunette(page).boundingBox())!;
    const last = (await page.locator("#work .work-case").last().boundingBox())!;
    const next = (await page.locator("#work + section").boundingBox())!;
    expect(rest.y + rest.height).toBeLessThan(844 - 100);
    expect(rest.y).toBeGreaterThanOrEqual(last.y + last.height);
    expect(rest.y + rest.height).toBeLessThanOrEqual(next.y);
  });

  test("the lit pane's rim text is 14px, medium, haloed, upright, and fits its arc", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    for (const index of cases.keys()) {
      await readCase(page, index);
      const scene = (await lunette(page).boundingBox())!;
      const measure = () =>
        page.locator(".rose-lunette .rose-pane.is-lit .rose-records").evaluate((text) => {
          const label = text as SVGTextElement;
          const arc = document.querySelector<SVGPathElement>(
            label.querySelector("textPath")!.getAttribute("href")!,
          )!;
          const style = getComputedStyle(label);
          const ctm = label.getScreenCTM()!;
          const last = label.getNumberOfChars() - 1;
          const middle = Math.floor(last / 2);
          const onScreen = (point: DOMPoint) => new DOMPoint(point.x, point.y).matrixTransform(ctm);
          return {
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            stroke: style.stroke,
            strokeWidth: style.strokeWidth,
            paintOrder: style.paintOrder,
            scale: Math.hypot(ctm.a, ctm.b),
            // The tilt of the middle character on screen, in degrees.
            tilt: (Math.atan2(ctm.b, ctm.a) * 180) / Math.PI + label.getRotationOfChar(middle),
            start: onScreen(label.getStartPositionOfChar(0)).x,
            end: onScreen(label.getEndPositionOfChar(last)).x,
            top: onScreen(label.getStartPositionOfChar(middle)).y,
            length: label.getComputedTextLength(),
            arc: arc.getTotalLength(),
          };
        });
      // Wait for the turn to settle.
      await expect(lunette(page).locator(".rose-pane").nth(index)).toHaveClass(/is-lit/);
      await page.locator(".rose-turn").evaluate((turn) =>
        Promise.all(turn.getAnimations().map((animation) => animation.finished.catch(() => {}))),
      );
      const label = await measure();
      // The tilt is read at the start of the middle character, a few degrees
      // short of the arc's apex.
      expect(Math.abs(label.tilt)).toBeLessThan(5);
      expect(label.fontSize).toBe("14px");
      expect(label.fontWeight).toBe("500");
      expect(label.stroke).toBe("rgb(6, 6, 11)");
      expect(label.strokeWidth).toBe("3px");
      expect(label.paintOrder).toMatch(/^stroke/);
      // Drawn at 1:1, so it renders at 14px.
      expect(label.scale).toBeCloseTo(1, 3);
      expect(label.end).toBeGreaterThan(label.start);
      expect(label.length).toBeGreaterThan(0);
      expect(label.length).toBeLessThanOrEqual(label.arc);
      // It sits at the top of the lunette, centred.
      expect((label.start + label.end) / 2).toBeCloseTo(195, -1);
      expect(label.top).toBeGreaterThan(scene.y);
      expect(label.start).toBeGreaterThanOrEqual(0);
      expect(label.end).toBeLessThanOrEqual(390);
    }
  });

  test("the hand is the shared iron hour hand, pointing up for every case", async ({ page }) => {
    await page.goto("/");
    const hand = lunette(page).locator(".lunette-hand > .iron-hand-hour");
    await expect(hand).toHaveCount(1);
    for (const index of cases.keys()) {
      await readCase(page, index);
      await expect(lunette(page).locator(".rose-pane").nth(index)).toHaveClass(/is-lit/);
      // The hand's unit is drawn along +x; on screen it points straight up.
      const angle = await hand.locator(":scope > g").evaluate((unit) => {
        const ctm = (unit as SVGGElement).getScreenCTM()!;
        return (Math.atan2(ctm.b, ctm.a) * 180) / Math.PI;
      });
      expect(angle).toBeCloseTo(-90, 3);
    }
  });

  test("a focused case study link is never hidden under the lunette", async ({ page }) => {
    await page.goto("/");
    const links = page.locator("#work .work-case-link");
    // Let the cases fade up first, so the links sit where they will stay.
    for (const index of cases.keys()) await readCase(page, index);
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => ((animation.effect as KeyframeEffect).target as Element)?.closest(".work-case"))
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
    for (const index of cases.keys()) {
      // The link sits under the lunette, and focus arrives from the previous
      // focusable element by keyboard.
      await links.nth(index).evaluate((link) => {
        const box = link.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + box.top - (innerHeight - 60), behavior: "instant" });
        const focusable = Array.from(document.querySelectorAll<HTMLElement>("a[href], button"));
        focusable[focusable.indexOf(link as HTMLElement) - 1].focus({ preventScroll: true });
      });
      await page.keyboard.press("Tab");
      await expect(links.nth(index)).toBeFocused();
      // The page may scroll smoothly; wait for the link to clear the lunette.
      await expect
        .poll(async () => {
          const link = (await links.nth(index).boundingBox())!;
          const scene = (await lunette(page).boundingBox())!;
          return scene.y - (link.y + link.height);
        })
        .toBeGreaterThanOrEqual(0);
    }
  });

  test("the sill reads at 4.5:1 or better against the scrim over the lit pane", async ({ page }) => {
    // Under reduced motion the records stay hidden, so only the glass and the
    // scrim lie behind the sill.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const sill = lunette(page).locator(".work-lunette-for");
    for (const [index, item] of cases.entries()) {
      await readCase(page, index);
      await expect(sill).toHaveText(`for ${item.served}`);
      for (const part of [sill.locator("span"), sill.locator("b")]) {
        const color = await part.evaluate((element) => getComputedStyle(element).color);
        const box = (await part.boundingBox())!;
        await part.evaluate((element) => ((element as HTMLElement).style.color = "transparent"));
        const shot = (await page.screenshot({ clip: box })).toString("base64");
        await part.evaluate((element) => ((element as HTMLElement).style.color = ""));
        const contrast = await page.evaluate(
          async ({ shot, color }) => {
            const luminance = (r: number, g: number, b: number) => {
              const linear = (c: number) => {
                const s = c / 255;
                return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
              };
              return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
            };
            const image = new Image();
            image.src = `data:image/png;base64,${shot}`;
            await image.decode();
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext("2d")!;
            context.drawImage(image, 0, 0);
            const pixels = context.getImageData(0, 0, image.width, image.height).data;
            // The brightest pixel behind the text is the worst case.
            let background = 0;
            for (let i = 0; i < pixels.length; i += 4) {
              background = Math.max(background, luminance(pixels[i], pixels[i + 1], pixels[i + 2]));
            }
            const [r, g, b] = color.match(/\d+/g)!.map(Number);
            return (luminance(r, g, b) + 0.05) / (background + 0.05);
          },
          { shot, color },
        );
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  for (const width of [360, 390]) {
    test(`nothing overflows at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      for (const [index, item] of cases.entries()) {
        await readCase(page, index);
        await expect(lunette(page).locator(".work-lunette-for")).toHaveText(`for ${item.served}`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        const box = (await lunette(page).boundingBox())!;
        expect(box.x).toBe(0);
        expect(box.width).toBe(width);
        const sill = (await lunette(page).locator(".work-lunette-for b").boundingBox())!;
        expect(sill.x).toBeGreaterThanOrEqual(0);
        expect(sill.x + sill.width).toBeLessThanOrEqual(width);
      }
    });
  }

  test("the lunette animates only while it is on screen", async ({ page }) => {
    await page.goto("/");
    const scene = page.locator(".rose-lunette");
    await expect(scene).toHaveClass(/is-paused/);
    const still = await lunetteRecords(page);
    await page.waitForTimeout(300);
    expect(await lunetteRecords(page)).toEqual(still);

    await readCase(page, 0);
    await expect(scene).not.toHaveClass(/is-paused/);
    const first = await lunetteRecords(page);
    await expect.poll(() => lunetteRecords(page)).not.toEqual(first);

    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(scene).toHaveClass(/is-paused/);
    const paused = await lunetteRecords(page);
    await page.waitForTimeout(500);
    expect(await lunetteRecords(page)).toEqual(paused);
  });

  test("with reduced motion no animation frames run, the records stay still, and the turn and the sill are instant", async ({
    page,
  }) => {
    await page.addInitScript(countFrames);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const scene = lunette(page);
    for (const [index, item] of cases.entries()) {
      await readCase(page, index);
      await expect(scene.locator(".rose-pane").nth(index)).toHaveClass(/is-lit/);
      await expect(scene.locator(".work-lunette-for")).toHaveText(`for ${item.served}`);
    }
    await page.waitForTimeout(500);
    expect(await frames(page)).toBe(0);

    const dots = await page.locator(".rose-lunette .rose-record").evaluateAll((elements) =>
      elements.map((dot) => ({ cx: dot.getAttribute("cx"), opacity: dot.getAttribute("opacity") })),
    );
    expect(dots).toHaveLength(16);
    for (const dot of dots) expect(dot).toEqual({ cx: null, opacity: "0" });
    await expect(scene.locator(".rose-turn")).toHaveCSS("transition-duration", "0s");
    await expect(scene.locator(".work-lunette-for b")).toHaveCSS("animation-name", "none");
  });
});
