// Hero frame-rate snippet: the console twin of scripts/measure-hero.mjs,
// for the runs done by hand (#83's D1 and D7).
//
// Paste it into the browser console on the homepage, with the hero on screen,
// and change the number on its last line to the monitor's refresh rate. It
// waits 1.5 s for the paste to settle, samples requestAnimationFrame for 12 s
// on the page as it stands, and prints the same stats and pass/fail line as
// the script (all but CrGpuMain, which needs a trace). Keep the window still
// and in front while it runs.
//
// Record with each run:
// - the monitor's refresh rate (`hyprctl monitors` under Hyprland);
// - Compositing, from chrome://gpu in a Chromium-based browser or
//   about:support in Firefox. Software compositing doesn't count.
//
// A run counts only if a string run started in its window; otherwise run it
// again. scripts/measure-hero.mjs evaluates this same file in the page, so
// both report numbers from the same code.
(async (hz) => {
  const SETTLE_MS = 1500;
  const SAMPLE_MS = 12000;
  // A string run lights pink lamps along the strings' keys for 2.2 s, and
  // puts them all out when it ends. A run has started when a lamp lights
  // with none lit, at least 2 s after the last run started (a lamp can go
  // out mid-run). On builds since #79 the lamps' layers show only while a
  // run plays, and since #80 the lamps are drawn on canvas, so a run has
  // also started when a lamps layer shows with none showing.
  const LAMPS = 'path[fill="#f0b4dc"]';
  const LAMP_LAYERS = ".hero-scene > [data-band$=lamps]";
  const hero = document.querySelector(".hero");
  if (!hero) throw new Error("No .hero on this page: open the homepage first.");
  // A lamp's strength is its fill-opacity, or on builds before #80 its opacity.
  const isLit = (lamp) => Number(lamp.getAttribute("fill-opacity") ?? lamp.getAttribute("opacity")) > 0;
  const isShown = (layer) => layer.isConnected && layer.style.display !== "none";
  const lit = new Set([...hero.querySelectorAll(LAMPS)].filter(isLit));
  const shown = new Set([...hero.querySelectorAll(LAMP_LAYERS)].filter(isShown));
  let lastStart = lit.size || shown.size ? performance.now() : -Infinity;
  const runs = [];
  const lamps = new MutationObserver((records) => {
    for (const { target } of records) {
      const [on, is] = target.matches(LAMPS) ? [lit, isLit] : target.matches(LAMP_LAYERS) ? [shown, isShown] : [];
      if (!on) continue;
      // A redrawn scene drops its old lamps and layers.
      for (const set of [lit, shown]) for (const old of set) if (!old.isConnected) set.delete(old);
      const wasDark = !lit.size && !shown.size;
      if (is(target)) on.add(target);
      else on.delete(target);
      const now = performance.now();
      if (wasDark && on.size && now - lastStart > 2000) runs.push((lastStart = now));
    }
  });
  lamps.observe(hero, { subtree: true, attributes: true, attributeFilter: ["opacity", "fill-opacity", "style"] });

  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
  const times = await new Promise((resolve) => {
    const times = [];
    const step = (t) => {
      times.push(t);
      if (t - times[0] < SAMPLE_MS) requestAnimationFrame(step);
      else resolve(times);
    };
    requestAnimationFrame(step);
  });
  lamps.disconnect();

  // Mean fps and percentiles of a run of frame times.
  const pace = (times) => {
    const deltas = times
      .slice(1)
      .map((t, i) => t - times[i])
      .sort((a, b) => a - b);
    const pct = (p) => +deltas[Math.min(deltas.length - 1, Math.floor(p * deltas.length))].toFixed(1);
    return {
      fps: +((deltas.length / (times.at(-1) - times[0])) * 1000).toFixed(1),
      p50: pct(0.5),
      p95: pct(0.95),
      worst: +deltas.at(-1).toFixed(1),
    };
  };
  const stats = {
    hz,
    ...pace(times),
    stringRuns: runs.filter((t) => t >= times[0] && t <= times.at(-1)).length,
  };
  // Since #80 the hero's loop draws in a worker, on frames of its own, so
  // its pace is measured too, over the same span, with the work each frame
  // took (ADR 0002).
  const loop = hero.querySelector(".hero-scene")?.heroLoop;
  if (loop?.inWorker) {
    const { pacing, work, now } = await loop.state();
    const span = times.at(-1) - times[0];
    const from = pacing.findIndex((t) => t >= now - span);
    const kept = from < 0 ? [] : pacing.slice(from);
    const took = from < 0 ? [] : work.slice(from);
    stats.loop =
      kept.length > 1
        ? { ...pace(kept), workMs: +(took.reduce((sum, t) => sum + t, 0) / took.length).toFixed(2) }
        : { fps: 0, p50: 0, p95: 0, worst: 0, workMs: 0 };
  }

  // #83's D1: mean fps at least 5/6 of the refresh rate, and p95 no more
  // than two refresh intervals, rounded up to 0.1 ms (33.4 ms at 60 Hz).
  const minFps = +((hz * 5) / 6).toFixed(1);
  const maxP95 = Math.ceil(20000 / hz) / 10;
  const misses = [];
  if (stats.fps < minFps) misses.push(`mean ${stats.fps} fps < ${minFps}`);
  if (stats.p95 > maxP95) misses.push(`p95 ${stats.p95} ms > ${maxP95}`);
  if (stats.loop && stats.loop.fps < minFps) misses.push(`loop mean ${stats.loop.fps} fps < ${minFps}`);
  if (stats.loop && stats.loop.p95 > maxP95) misses.push(`loop p95 ${stats.loop.p95} ms > ${maxP95}`);
  const valid = stats.stringRuns > 0;
  const verdict = !valid ? "INVALID" : misses.length ? "FAIL" : "PASS";
  const line = `${verdict} hero at ${hz} Hz (D1: mean ≥ ${minFps} fps, p95 ≤ ${maxP95} ms)${
    !valid ? ": no string run started in the window, run it again" : misses.length ? `: ${misses.join("; ")}` : ""
  }`;
  console.table({ ...stats, loop: undefined });
  if (stats.loop) console.table(stats.loop);
  console.log(line);
  return { ...stats, valid, pass: valid && !misses.length, misses };
})(60);
