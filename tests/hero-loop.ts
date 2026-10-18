import type { Page } from "@playwright/test";
import type { LoopState } from "../src/hero-loop";

// The hero's loop draws on canvas, in a worker (ADR 0002), so tests read
// what it shows from the state it reports, not from the drawing.
export const loopState = (page: Page) =>
  page.evaluate(() =>
    (document.querySelector(".hero-scene") as unknown as { heroLoop: { state(): Promise<LoopState> } }).heroLoop.state(),
  );

// Whether the loop runs in a worker.
export const loopInWorker = (page: Page) =>
  page.evaluate(() => (document.querySelector(".hero-scene") as unknown as { heroLoop: { inWorker: boolean } }).heroLoop.inWorker);

// An init script that keeps the loop on the main thread, where the page's
// faked clock and frames drive it, for tests that drive those.
export const loopOnMain = () => {
  (window as unknown as { heroLoopOnMain: boolean }).heroLoopOnMain = true;
};
