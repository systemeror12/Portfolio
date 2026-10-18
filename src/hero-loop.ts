import type { Box } from "./hero-layers";
import type { Point } from "./hero-layout";
import { heroRecords } from "./hero-records";
import { keyLights, type Lamp } from "./piano-ribbon";

// The hero's animation loop: what moves every frame, drawn on canvases
// (ADR 0002). The clockwork canvas holds the second hand, the boss over it,
// the records, and the heart's glow, ring and core; each lamps canvas holds
// the lamps of a pink glissando along the strings. It touches no DOM, so it
// runs in a worker, or on the main thread where a canvas can't be handed to
// one. The scene talks to it in messages, and it answers with events.

type Canvas = OffscreenCanvas | HTMLCanvasElement;
type Context = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
export type LampKey = { outline: string; face: number; band: string; run: number };
export type LampRibbon = { keys: LampKey[] };
export type LoopLayout = {
  width: number;
  height: number;
  heart: Point;
  radius: number;
  mobile: boolean;
  reduce: boolean;
  dpr: number;
  // How many times longer each frame's work takes: measure-hero.mjs's CPU
  // throttle reaches only the main thread, so in a worker the loop throttles
  // itself to match.
  slowdown: number;
};
export type LoopMessage =
  | {
      type: "layout";
      layout: LoopLayout;
      clockwork: { canvas: Canvas; box: Box };
      lamps: { band: string; canvas: Canvas; box: Box }[];
      ribbons: LampRibbon[];
    }
  | { type: "visible"; on: boolean }
  | { type: "state"; id: number }
  | { type: "stop" };
export type LoopEvent =
  | { type: "arrived" }
  | { type: "run"; on: boolean }
  | { type: "state"; id: number; state: LoopState };
export type LoopState = ReturnType<ReturnType<typeof createLoop>["state"]>;

// The heart's pulse keeps 96% of itself every sixtieth of a second.
export const pulseFade = 0.96;
export const pulseStep = 1000 / 60;
// A glissando runs along every string for 2.2 s.
const glissando = 2200;
// How many frames' times the loop keeps, for measuring its pace and work.
const kept = 1200;

const frameAfter = (callback: FrameRequestCallback) =>
  globalThis.requestAnimationFrame
    ? globalThis.requestAnimationFrame(callback)
    : (setTimeout(() => callback(performance.now()), pulseStep) as unknown as number);
const cancelFrame = (handle: number) =>
  globalThis.cancelAnimationFrame ? globalThis.cancelAnimationFrame(handle) : clearTimeout(handle);

// A canvas set to draw in the hero's coordinates over box.
function surface(canvas: Canvas, box: Box, dpr: number) {
  const ctx = canvas.getContext("2d") as Context;
  const clear = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, -box.l * dpr, -box.t * dpr);
  };
  return { ctx, clear };
}

function makeScene({ layout, clockwork, lamps, ribbons }: Extract<LoopMessage, { type: "layout" }>) {
  const { heart, radius, reduce, dpr } = layout;
  const records = heroRecords(layout);
  const clock = surface(clockwork.canvas, clockwork.box, dpr);
  const bands = new Map(lamps.map(({ band, canvas, box }) => [band, surface(canvas, box, dpr)]));
  const runs = ribbons.map(({ keys }) => ({
    keys,
    light: keyLights(
      keys.map((key) => key.face),
      10,
    ),
    lit: [] as Lamp[],
    outlines: new Map<number, Path2D>(),
  }));
  let glow: CanvasGradient | undefined;
  const shown = { second: 0, glow: 0, ring: 0, ringOpacity: 0, core: 0 };

  // Draws the clockwork at pulse, with the heart breathing by breathe.
  function drawClockwork(pulse: number, breathe: number) {
    const { ctx, clear } = clock;
    clear();
    // The second hand sweeps; under reduced motion it is hidden.
    const seconds = (Date.now() % 60_000) / 1000;
    shown.second = -90 + (reduce ? Math.floor(seconds) : seconds) * 6;
    ctx.save();
    ctx.translate(heart.x, heart.y);
    if (!reduce) {
      ctx.save();
      ctx.rotate((shown.second * Math.PI) / 180);
      ctx.strokeStyle = "rgba(240,180,220,.8)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.1, 0);
      ctx.lineTo(radius * 0.76, 0);
      ctx.stroke();
      ctx.restore();
    }
    // The bronze boss, with a thin ring.
    ctx.fillStyle = "#9b8794";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(155,135,148,.8)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#06060b";
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    records.draw(ctx);
    // The glow, the ring a pulse sends out, and the core.
    shown.glow = 130 + breathe * 18 + pulse * 30;
    shown.ring = 10 + (1 - pulse) * 30;
    shown.ringOpacity = Number((pulse * 0.6).toFixed(2));
    shown.core = 3.2 + pulse * 1.4;
    if (!glow) {
      // In units of the glow's radius, which changes every frame.
      glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      glow.addColorStop(0, "rgba(240,180,220,.9)");
      glow.addColorStop(0.25, "rgba(187,102,136,.42)");
      glow.addColorStop(0.55, "rgba(74,58,99,.2)");
      glow.addColorStop(1, "rgba(74,58,99,0)");
    }
    ctx.save();
    ctx.translate(heart.x, heart.y);
    ctx.scale(shown.glow, shown.glow);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (shown.ringOpacity) {
      ctx.strokeStyle = `rgba(240,180,220,${shown.ringOpacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(heart.x, heart.y, shown.ring, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff4fb";
    ctx.beginPath();
    ctx.arc(heart.x, heart.y, shown.core, 0, Math.PI * 2);
    ctx.fill();
  }

  // Moves each string's run on to head (null puts it out), and redraws the
  // lamps bands whose lamps changed.
  function light(head: (count: number) => number | null) {
    const dirty = new Set<string>();
    for (const run of runs) {
      const lit = run.light(head(run.keys.length));
      if (!lit) continue;
      for (const lamp of [...run.lit, ...lit]) dirty.add(run.keys[lamp.key].band);
      run.lit = lit;
    }
    for (const band of dirty) {
      const { ctx, clear } = bands.get(band)!;
      clear();
      // Far runs first, as their lamps lay in the layer.
      const lamps = runs
        .flatMap((run) => run.lit.map((lamp) => ({ run, lamp, key: run.keys[lamp.key] })))
        .filter(({ key }) => key.band === band)
        .sort((a, b) => a.key.run - b.key.run || a.lamp.trail - b.lamp.trail);
      for (const { run, lamp, key } of lamps) {
        let outline = run.outlines.get(lamp.key);
        if (!outline) run.outlines.set(lamp.key, (outline = new Path2D(key.outline)));
        ctx.fillStyle = `rgba(240,180,220,${lamp.opacity})`;
        ctx.fill(outline, "evenodd");
      }
    }
  }

  const lit = () => runs.reduce((sum, run) => sum + run.lit.length, 0);
  return { layout, records, drawClockwork, light, lit, shown };
}

// The loop. Returns a handler for the scene's messages; events go to emit.
export function createLoop(emit: (event: LoopEvent) => void) {
  let scene: ReturnType<typeof makeScene> | undefined;
  let start = 0;
  let visible = false;
  let frame = 0;
  // When the loop last ran a frame; unset until it runs, and while it's paused.
  let last: number | undefined;
  let pulse = 0;
  let run = 0;
  let frames = 0;
  const pacing: number[] = [];
  const work: number[] = [];

  // Each record that reaches the heart pulses it, and sets a run playing
  // along the strings when none is. A frame after a pause takes no arrival it
  // didn't see, so the heart doesn't flash as the hero comes back on screen.
  // The pulse fades by the time since the last frame, elapsed.
  function tick(now: number, elapsed: number) {
    if (!scene) return;
    const { reduce } = scene.layout;
    const arrived = scene.records.advance(now);
    pulse *= pulseFade ** (elapsed / pulseStep);
    if (arrived && last !== undefined) {
      pulse = 1;
      emit({ type: "arrived" });
    }
    if (!reduce) play(now, arrived);
    const breathe = reduce ? 0 : (Math.sin(((now - start) / 1000) * 1.4) + 1) / 2;
    scene.drawClockwork(pulse, breathe);
  }

  function play(now: number, arrived: boolean) {
    if (arrived && !run) {
      run = now;
      emit({ type: "run", on: true });
    }
    if (!run) return;
    const t = (now - run) / glissando;
    scene!.light((count) => (t > 1 ? null : t * (count + 10)));
    if (t > 1) {
      run = 0;
      emit({ type: "run", on: false });
    }
  }

  const loop = (now: number) => {
    const begun = performance.now();
    frames++;
    pacing.push(now);
    tick(now, last === undefined ? 0 : Math.max(0, now - last));
    last = now;
    const took = performance.now() - begun;
    work.push(took);
    if (pacing.length > kept) [pacing, work].forEach((times) => times.shift());
    const slowdown = scene?.layout.slowdown ?? 1;
    while (performance.now() - begun < took * slowdown);
    frame = frameAfter(loop);
  };
  const halt = () => {
    cancelFrame(frame);
    frame = 0;
    last = undefined;
  };
  const resume = () => {
    if (visible && scene && !scene.layout.reduce && !frame) frame = frameAfter(loop);
  };

  function state() {
    return {
      frames,
      pacing: [...pacing],
      work: [...work],
      now: performance.now(),
      running: frame !== 0,
      size: scene ? { width: scene.layout.width, height: scene.layout.height } : null,
      secondShown: scene ? !scene.layout.reduce : false,
      pulse,
      run: run !== 0,
      lamps: scene?.lit() ?? 0,
      records: scene?.records.state() ?? [],
      ...(scene?.shown ?? { second: 0, glow: 0, ring: 0, ringOpacity: 0, core: 0 }),
    };
  }

  function handle(message: LoopMessage) {
    switch (message.type) {
      case "layout":
        // A new drawing ends any run on the old one.
        scene = makeScene(message);
        start = performance.now();
        run = 0;
        tick(start, 0);
        resume();
        break;
      case "visible":
        visible = message.on;
        if (visible) resume();
        else halt();
        break;
      case "state":
        emit({ type: "state", id: message.id, state: state() });
        break;
      case "stop":
        halt();
        scene = undefined;
        break;
    }
  }

  return Object.assign(handle, { state });
}
