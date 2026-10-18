import { createLoop, type LoopMessage } from "./hero-loop";

// Runs the hero's animation loop off the main thread (ADR 0002).
const scope = self as unknown as {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent<LoopMessage>) => void) | null;
};
const loop = createLoop((event) => scope.postMessage(event));
scope.onmessage = (event) => loop(event.data);
