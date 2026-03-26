import type { Rng } from "./types";

export function createMathRandomRng(): Rng {
  return {
    nextFloat: () => Math.random(),
  };
}

export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;

  return {
    nextFloat: () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function pickRng(rng?: Rng, seed?: number): Rng {
  if (rng) {
    return rng;
  }
  if (Number.isFinite(seed)) {
    return createSeededRng(seed as number);
  }
  return createMathRandomRng();
}

export function rngRange(rng: Rng, min: number, max: number): number {
  return min + rng.nextFloat() * (max - min);
}
