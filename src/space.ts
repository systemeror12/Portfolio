// Points in space for the drawn scenes: [x, y, z], x and y in the scene's
// pixels and z running away from us. With the seeded randomness and easing
// the scenes share.

export type Vec = [number, number, number];
export type Flat = [number, number];

export const deg = Math.PI / 180;
export const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const span = (a: Vec) => Math.hypot(a[0], a[1], a[2]);
export const unit = (a: Vec) => mul(a, 1 / (span(a) || 1));
export const mix3 = (a: Vec, b: Vec, u: number) => add(a, mul(sub(b, a), u));

// Eases from 0 at a to 1 at b.
export const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

// The same run of numbers in [0, 1) for the same seed, on every load.
export const seeded = (seed: number) => {
  let n = seed;
  return () => (n = (n * 16807) % 2147483647) / 2147483647;
};
