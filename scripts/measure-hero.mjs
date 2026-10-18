// Measures the homepage hero's frame pacing in headless Chromium on the real
// GPU, against #83's D1, and compares a branch with main by #82's "not
// slower" rule. Not part of the Playwright suite.
//
// Measure, against a local preview (`npm run build && npx vite preview`) or
// the deployed site, keeping stdout as the result file:
//   node scripts/measure-hero.mjs <url> [--label main] [--viewports desktop-1920,...]
//     [--throttles 1,4] [--repeats 3] [--angle gl-egl] [--hero-no-css] | tee main.jsonl
// --hero-no-css pauses the hero's CSS animations, as #76's hero-no-css run
// did, so only the animation loop moves. --hero-static also stops the loop,
// as #76's hero-static run did, so nothing in the hero moves: what is left
// is the cost of showing the still scene. Its runs need no string run.
// Measure Chrome on an Android phone, at its own viewport, after
// `adb forward tcp:9222 localabstract:chrome_devtools_remote`:
//   node scripts/measure-hero.mjs <url> --cdp http://127.0.0.1:9222 | tee phone.jsonl
// Compare a branch's result file with main's:
//   node scripts/measure-hero.mjs --compare main.jsonl branch.jsonl
//
// Each run prints one JSON line; each viewport × throttle then prints a
// pass/fail line. The exit code is 1 if anything failed or was invalid.
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    label: { type: "string", default: "" },
    viewports: { type: "string" },
    throttles: { type: "string", default: "1,4" },
    repeats: { type: "string", default: "3" },
    angle: { type: "string", default: "gl-egl" },
    cdp: { type: "string" },
    compare: { type: "boolean", default: false },
    "hero-no-css": { type: "boolean", default: false },
    "hero-static": { type: "boolean", default: false },
  },
});

const TRACE_MS = 3000;
// #83's D1: under 900 ms/s on the GPU process's main thread at 1×.
const MAX_GPU_MAIN = 900;

const viewports = [
  { name: "desktop-1920", width: 1920, height: 1080, dpr: 1 },
  { name: "desktop-1366", width: 1366, height: 768, dpr: 1 },
  { name: "tablet-land-1180", width: 1180, height: 820, dpr: 2, touch: true },
  { name: "tablet-port-820", width: 820, height: 1180, dpr: 2, touch: true },
  { name: "phone-port-390", width: 390, height: 844, dpr: 3, touch: true, phone: true },
  { name: "phone-land-844", width: 844, height: 390, dpr: 3, touch: true, phone: true },
];

const categories = ["devtools.timeline", "disabled-by-default-devtools.timeline", "toplevel", "gpu"];

// The console snippet does the sampling, so the script and the runs done by
// hand report numbers from the same code. Its last line passes the refresh
// rate.
const snippet = readFileSync(new URL("./measure-hero-snippet.js", import.meta.url), "utf8");
const lastLine = /\)\(\d+\);\s*$/;
if (!lastLine.test(snippet)) throw new Error("measure-hero-snippet.js must end with `})(<refresh rate>);`.");
const sampleAt = (hz) => snippet.replace(lastLine, `)(${hz});`);
const pauseCss = options["hero-no-css"] || options["hero-static"];
// For --hero-static: the page's requestAnimationFrame drops every callback
// once __blockPageRaf is set, so the hero's loop stops; the snippet samples
// with the browser's own, kept as __raf.
const blockableRaf = () => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__raf = raf;
  window.requestAnimationFrame = (callback) => (window.__blockPageRaf ? 0 : raf(callback));
};
const sampleWithOwnRaf = (hz) =>
  `(() => { const requestAnimationFrame = window.__raf; return (\n${sampleAt(hz).trim().replace(/;$/, "")}\n); })()`;

// Per-second cost of each pipeline stage, from a trace of the page's
// renderer and the GPU process.
function summarizeTrace(events, seconds) {
  const threads = new Map();
  const procs = new Map();
  for (const e of events) {
    if (e.ph === "M" && e.name === "thread_name") threads.set(`${e.pid}:${e.tid}`, e.args.name);
    if (e.ph === "M" && e.name === "process_name") procs.set(e.pid, e.args.name);
  }
  const top = (e) => e.ph === "X" && e.name === "ThreadControllerImpl::RunTask";
  // Top-level task time per thread, ignoring tasks nested inside another.
  const busy = new Map();
  const open = new Map();
  for (const e of [...events].filter(top).sort((a, b) => a.ts - b.ts)) {
    const key = `${e.pid}:${e.tid}`;
    if ((open.get(key) ?? 0) > e.ts) continue;
    open.set(key, e.ts + e.dur);
    busy.set(key, (busy.get(key) ?? 0) + e.dur / 1000);
  }
  const renderer = [...busy.entries()]
    .filter(([k]) => threads.get(k) === "CrRendererMain")
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const pagePid = Number(renderer?.split(":")[0]);
  const gpuPid = [...procs.entries()].find(([, n]) => n === "GPU Process")?.[0];
  const sums = {};
  const add = (k, v) => (sums[k] = (sums[k] ?? 0) + v);
  for (const e of events) {
    if (e.ph !== "X" || e.pid !== pagePid || threads.get(`${e.pid}:${e.tid}`) !== "CrRendererMain") continue;
    const ms = e.dur / 1000;
    const stage = {
      FireAnimationFrame: "js-rAF",
      UpdateLayoutTree: "style",
      Layout: "layout",
      PrePaint: "prepaint",
      Paint: "paint",
      Layerize: "layerize",
      Commit: "commit",
    }[e.name];
    if (stage) add(stage, ms);
  }
  for (const [key, ms] of busy) {
    const [pid] = key.split(":").map(Number);
    const name = threads.get(key);
    if (key === renderer) add("renderer-main", ms);
    if (pid === pagePid && name === "Compositor") add("renderer-compositor", ms);
    if (pid === gpuPid && name === "CrGpuMain") add("gpu-main", ms);
    if (pid === gpuPid && name === "VizCompositorThread") add("viz", ms);
  }
  const perSecond = {};
  for (const k in sums) perSecond[k] = Math.round(sums[k] / seconds);
  return perSecond;
}

// What the browser composites and rasterizes with, read before sampling.
async function gpuInfo(browser) {
  const cdp = await browser.newBrowserCDPSession();
  const { gpu } = await cdp.send("SystemInfo.getInfo");
  await cdp.detach();
  const renderer = gpu.auxAttributes?.glRenderer || gpu.devices.map((d) => d.deviceString).filter(Boolean).join("; ");
  return {
    compositing: gpu.featureStatus.gpu_compositing,
    rasterization: gpu.featureStatus.rasterization,
    renderer,
  };
}

// The refresh rate this page gets, from the median frame of a blank page.
async function refreshRate(page) {
  const median = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const times = [];
        const step = (t) => {
          times.push(t);
          if (times.length < 61) return requestAnimationFrame(step);
          const deltas = times.slice(1).map((t, i) => t - times[i]).sort((a, b) => a - b);
          resolve(deltas[30]);
        };
        requestAnimationFrame(step);
      }),
  );
  return Math.round(1000 / median);
}

// One run: the hero on screen, settled, sampled for 12 s by the snippet,
// then traced for 3 s.
async function run(browser, page, url, throttle) {
  const gpu = await gpuInfo(browser);
  await page.goto("about:blank");
  const hz = await refreshRate(page);
  const cdp = await page.context().newCDPSession(page);
  if (options["hero-static"]) await page.addInitScript(blockableRaf);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await page.evaluate(() => window.scrollTo(0, 0));
  if (pauseCss) {
    await page.addStyleTag({ content: ".hero-scene, .hero-scene * { animation-play-state: paused !important; }" });
  }
  const screen = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    dpr: devicePixelRatio,
  }));

  if (options["hero-static"]) await page.evaluate(() => (window.__blockPageRaf = true));
  const sample = await page.evaluate(options["hero-static"] ? sampleWithOwnRaf(hz) : sampleAt(hz));
  await browser.startTracing(page, { categories });
  await page.waitForTimeout(TRACE_MS);
  const trace = JSON.parse((await browser.stopTracing()).toString());
  const cost = summarizeTrace(trace.traceEvents ?? trace, TRACE_MS / 1000);
  if (throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await cdp.detach();

  const invalid = [];
  if (!gpu.compositing?.startsWith("enabled")) invalid.push(`compositing is ${gpu.compositing}, not hardware`);
  if (!sample.stringRuns && !options["hero-static"]) invalid.push("no string run started in the window");
  const misses = [...sample.misses];
  if (throttle === 1 && !(cost["gpu-main"] < MAX_GPU_MAIN))
    misses.push(`CrGpuMain ${cost["gpu-main"] ?? "not traced"} ms/s ≥ ${MAX_GPU_MAIN}`);
  return {
    screen,
    hz,
    fps: sample.fps,
    p50: sample.p50,
    p95: sample.p95,
    worst: sample.worst,
    gpuMainMsPerSec: cost["gpu-main"] ?? null,
    stringRuns: sample.stringRuns,
    gpu,
    costMsPerSec: cost,
    valid: !invalid.length,
    invalid,
    pass: !invalid.length && !misses.length,
    misses,
  };
}

// A pass/fail line for one viewport × throttle: all its runs must pass.
function verdict(name, throttle, results) {
  const hz = [...new Set(results.map((r) => r.hz))].join("/");
  const why = results.flatMap((r) => [...(r.invalid ?? []), ...(r.misses ?? [])].map((m) => `run ${r.run}: ${m}`));
  const word = results.every((r) => r.pass) ? "PASS" : results.some((r) => !r.valid) ? "INVALID" : "FAIL";
  const rule = `mean ≥ 5/6 of ${hz} Hz, p95 ≤ 2 intervals${throttle === 1 ? `, CrGpuMain < ${MAX_GPU_MAIN} ms/s` : ""}`;
  const phone = viewports.find((v) => v.name === name)?.phone ? " (phones join D1 in #114; until then, --compare)" : "";
  console.log(`${word} ${name} ${throttle}× D1 (${rule}), ${results.filter((r) => r.pass).length}/${results.length} runs${phone}${why.length ? `: ${why.join("; ")}` : ""}`);
  return word === "PASS";
}

async function measure(url) {
  const throttles = options.throttles.split(",").map(Number);
  const repeats = Number(options.repeats);
  let ok = true;
  const each = async (browser, name, open) => {
    for (const throttle of throttles) {
      const results = [];
      for (let i = 1; i <= repeats; i++) {
        const { page, close } = await open();
        let result;
        try {
          result = await run(browser, page, url, throttle);
        } catch (e) {
          result = { valid: false, invalid: [e.message.split("\n")[0]], pass: false };
        }
        await close();
        result = { label: options.label, heroNoCss: pauseCss, heroStatic: options["hero-static"], viewport: name, throttle, run: i, ...result };
        console.log(JSON.stringify(result));
        results.push(result);
      }
      ok = verdict(name, throttle, results) && ok;
    }
  };

  if (options.cdp) {
    // Chrome on an Android phone, at the phone's own viewport.
    const browser = await chromium.connectOverCDP(options.cdp);
    const context = browser.contexts()[0] ?? (await browser.newContext());
    await each(browser, "android", async () => {
      const page = await context.newPage();
      return { page, close: () => page.close() };
    });
    await browser.close();
  } else {
    // Hardware compositing in headless Chromium needs ANGLE on a real GL or
    // Vulkan backend: gl-egl takes Mesa's default GPU (the integrated Radeon
    // on the Reference Laptop and the RTX 3060 desktop), vulkan takes the
    // NVIDIA card. #76's plain --use-angle=gl fell back to software
    // compositing on the RTX 3060 desktop.
    const browser = await chromium.launch({
      headless: true,
      channel: "chromium",
      args: [
        "--enable-gpu",
        "--ignore-gpu-blocklist",
        "--use-gl=angle",
        `--use-angle=${options.angle}`,
        ...(options.angle === "vulkan" ? ["--enable-features=Vulkan"] : []),
      ],
    });
    const only = options.viewports?.split(",");
    for (const vp of viewports.filter((v) => !only || only.includes(v.name))) {
      await each(browser, vp.name, async () => {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: vp.dpr,
          hasTouch: !!vp.touch,
        });
        return { page: await context.newPage(), close: () => context.close() };
      });
    }
    await browser.close();
  }
  return ok;
}

// #82's "not slower": for each viewport × throttle, the branch's median fps
// is no lower and its median p95 no higher than main's, give or take the
// spread between main's runs.
function compare(mainFile, branchFile) {
  const load = (file) =>
    readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => line.startsWith("{"))
      .map((line) => JSON.parse(line))
      .filter((r) => r.valid);
  const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  const spread = (xs) => Math.max(...xs) - Math.min(...xs);
  const round = (x) => +x.toFixed(1);
  const group = (runs) => Map.groupBy(runs, (r) => `${r.viewport} ${r.throttle}×`);
  const main = group(load(mainFile));
  const branch = group(load(branchFile));
  let ok = true;
  for (const [key, runs] of main) {
    const theirs = branch.get(key);
    if (!theirs) {
      console.log(`MISSING ${key}: no valid branch runs`);
      ok = false;
      continue;
    }
    const fps = runs.map((r) => r.fps);
    const p95 = runs.map((r) => r.p95);
    const floor = round(median(fps) - spread(fps));
    const ceiling = round(median(p95) + spread(p95));
    const [bFps, bP95] = [round(median(theirs.map((r) => r.fps))), round(median(theirs.map((r) => r.p95)))];
    const pass = bFps >= floor && bP95 <= ceiling;
    ok &&= pass;
    console.log(
      `${pass ? "NOT SLOWER" : "SLOWER"} ${key}: median fps ${bFps} vs main ${round(median(fps))} ± ${round(spread(fps))} (≥ ${floor}); ` +
        `median p95 ${bP95} ms vs main ${round(median(p95))} ± ${round(spread(p95))} (≤ ${ceiling}); ` +
        `${theirs.length} branch / ${runs.length} main runs`,
    );
  }
  for (const key of branch.keys()) if (!main.has(key)) console.log(`MISSING ${key}: no valid main runs`);
  return ok;
}

if (options.compare ? positionals.length !== 2 : positionals.length !== 1) {
  console.error("Usage: node scripts/measure-hero.mjs <url> [options] | node scripts/measure-hero.mjs --compare main.jsonl branch.jsonl");
  process.exit(2);
}
const ok = options.compare ? compare(...positionals) : await measure(positionals[0]);
process.exitCode = ok ? 0 : 1;
