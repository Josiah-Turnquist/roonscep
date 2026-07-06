// Swappable source of randomness so the game engine has no hard dependency on
// Math.random. The client leaves the default in place; a future authoritative
// server can inject a seeded or controlled generator via setRng() before
// running the reducer, which is what makes the engine testable and lets the
// server own all randomness (the basis of drop/combat anti-cheat).

let _rng: () => number = Math.random;

/** A float in [0, 1). Use this everywhere the engine needs randomness. */
export function rng(): number {
  return _rng();
}

/** Replace the randomness source (server-side, tests). Pass Math.random to reset. */
export function setRng(fn: () => number): void {
  _rng = fn;
}
