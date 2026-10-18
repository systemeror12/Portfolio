// Screenshots the homepage hero at #82's viewports, and compares a set with
// the committed baselines by #82's rule: no colour channel differs by more
// than 2/255. Not part of the Playwright suite.
//
// Shoot, against a local preview (`npm run build && npx vite preview`):
//   node scripts/shoot-hero.mjs <url> <dir>
// Compare a set with the baselines, writing a diff image for each shot:
//   node scripts/shoot-hero.mjs --compare scripts/hero-baselines <dir> <diff dir>
//
// Each viewport gets three shots. "still" is under reduced motion with the
// clock fixed. "paused-1" and "paused-2" have motion on: the clock is fixed,
// the animation loop is stepped through 4 s of frames, and every CSS
// animation is held at one of two moments partway through moving, with the
// far lilies' twinkles at the start of their cycle. The exit code is 1 if
// any shot differs by more than the tolerance, or is missing.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: { compare: { type: "boolean", default: false } },
});

const TOLERANCE = 2;
// 25:10:40 in Manila, the instant every shot is taken at.
const TIME = new Date("2026-10-12T01:10:40+08:00");
const LOOP_MS = 4000;
const MOMENTS = [2300, 5900];

const viewports = [
  { name: "desktop-1920", width: 1920, height: 1080, dpr: 1 },
  { name: "desktop-1440", width: 1440, height: 900, dpr: 1 },
  { name: "desktop-1366", width: 1366, height: 768, dpr: 1 },
  { name: "desktop-1280", width: 1280, height: 800, dpr: 1 },
  { name: "tablet-land-1180", width: 1180, height: 820, dpr: 2, touch: true },
  { name: "tablet-port-820", width: 820, height: 1180, dpr: 2, touch: true },
  { name: "phone-port-390", width: 390, height: 844, dpr: 3, touch: true },
  { name: "phone-land-844", width: 844, height: 390, dpr: 3, touch: true },
];

// Holds every CSS animation at moment ms, the far lilies' twinkles at the
// start of their cycle. Chromium rasters a paused animation differently from
// load to load, so each part keeps its paused transform and opacity as
// inline style, the animation is dropped, and the page paints afresh.
function pauseAt(ms) {
  const held = [];
  for (const animation of document.getAnimations()) {
    if (!(animation instanceof CSSAnimation)) {
      animation.finish();
      continue;
    }
    animation.pause();
    const { delay, duration } = animation.effect.getTiming();
    const target = animation.effect.target;
    animation.currentTime = target.closest(".lily-far, [data-band=back-twinkles]") ? ((delay % duration) + duration) % duration : ms;
    const { transform, opacity } = getComputedStyle(target);
    held.push([target, transform, opacity]);
  }
  for (const [target, transform, opacity] of held) {
    target.style.animation = "none";
    target.style.transform = transform;
    target.style.opacity = opacity;
  }
  // A part that was animating keeps the raster scale it was given then, so
  // drop every layer and paint afresh. Done in one task, so no observer sees
  // the page hidden.
  document.body.style.display = "none";
  void document.body.offsetHeight;
  document.body.style.display = "";
}

// Hands the page's animation frames to the script, as hero-dial-pulse.spec.ts
// does: performance.now holds at 0, and frames run only when runFrames steps
// them, at 60 Hz, up to a time.
function crankFrames() {
  const queue = new Map();
  let id = 0;
  let now = 0;
  performance.now = () => now;
  window.requestAnimationFrame = (callback) => {
    queue.set(++id, callback);
    return id;
  };
  window.cancelAnimationFrame = (handle) => void queue.delete(handle);
  window.runFrames = (until) => {
    while (now < until) {
      now = Math.min(until, now + 1000 / 60);
      const due = [...queue.values()];
      queue.clear();
      due.forEach((callback) => callback(now));
    }
  };
}

async function shoot(url, dir) {
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  for (const vp of viewports) {
    // Each shot loads the page afresh, as a held moment can't be resumed.
    for (const [kind, ms] of [["still"], ...MOMENTS.map((ms, i) => [`paused-${i + 1}`, ms])]) {
      const motion = ms !== undefined;
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.dpr,
        hasTouch: !!vp.touch,
        reducedMotion: motion ? "no-preference" : "reduce",
      });
      const page = await context.newPage();
      await page.clock.setFixedTime(TIME);
      await page.addInitScript(crankFrames);
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      // Let the redraw after the fonts settle, and the observers, run.
      await page.waitForTimeout(1000);
      if (motion) {
        await page.evaluate((ms) => window.runFrames(ms), LOOP_MS);
        await page.evaluate(pauseAt, ms);
        await page.waitForTimeout(200);
      }
      const box = await page.locator(".hero").boundingBox();
      const file = join(dir, `${vp.name}-${kind}.png`);
      await page.screenshot({ path: file, clip: box, animations: "allow", caret: "hide" });
      console.log(file);
      await context.close();
    }
  }
  await browser.close();
}

// Compares in the browser, so no image library is needed.
function diff([a, b, tolerance]) {
  const load = async (data) => createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
  return Promise.all([load(a), load(b)]).then(([x, y]) => {
    if (x.width !== y.width || x.height !== y.height) return { size: `${x.width}×${x.height} vs ${y.width}×${y.height}` };
    const read = (bitmap) => {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d");
      context.drawImage(bitmap, 0, 0);
      return context.getImageData(0, 0, bitmap.width, bitmap.height);
    };
    const [p, q] = [read(x), read(y)];
    const out = new ImageData(x.width, x.height);
    let max = 0;
    let over = 0;
    for (let i = 0; i < p.data.length; i += 4) {
      let most = 0;
      for (let c = 0; c < 4; c++) most = Math.max(most, Math.abs(p.data[i + c] - q.data[i + c]));
      max = Math.max(max, most);
      if (most > tolerance) over++;
      // Black where equal; brighter the more a channel differs, red past the tolerance.
      const v = Math.min(255, most * 40);
      out.data.set(most > tolerance ? [255, 0, 0, 255] : [v, v, v, 255], i);
    }
    const canvas = new OffscreenCanvas(x.width, x.height);
    canvas.getContext("2d").putImageData(out, 0, 0);
    return canvas.convertToBlob({ type: "image/png" }).then(
      (blob) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ max, over, png: reader.result.split(",")[1] });
          reader.readAsDataURL(blob);
        }),
    );
  });
}

async function compare(baselines, dir, diffs) {
  mkdirSync(diffs, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let ok = true;
  for (const file of readdirSync(baselines).filter((f) => f.endsWith(".png")).sort()) {
    let shot;
    try {
      shot = readFileSync(join(dir, file));
    } catch {
      console.log(`MISSING ${file}`);
      ok = false;
      continue;
    }
    const result = await page.evaluate(diff, [readFileSync(join(baselines, file)).toString("base64"), shot.toString("base64"), TOLERANCE]);
    if (result.size) {
      console.log(`DIFFERENT SIZE ${file}: ${result.size}`);
      ok = false;
      continue;
    }
    writeFileSync(join(diffs, file), Buffer.from(result.png, "base64"));
    const pass = result.max <= TOLERANCE;
    ok &&= pass;
    console.log(`${pass ? "MATCH" : "DIFFERS"} ${file}: largest channel difference ${result.max}/255, ${result.over} pixels over ${TOLERANCE}/255`);
  }
  await browser.close();
  return ok;
}

if (options.compare ? positionals.length !== 3 : positionals.length !== 2) {
  console.error("Usage: node scripts/shoot-hero.mjs <url> <dir> | node scripts/shoot-hero.mjs --compare <baselines> <dir> <diffs>");
  process.exit(2);
}
const ok = options.compare ? await compare(...positionals) : (await shoot(...positionals), true);
process.exitCode = ok ? 0 : 1;
