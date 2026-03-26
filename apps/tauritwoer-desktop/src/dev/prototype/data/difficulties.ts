import type { DifficultyName, DifficultyProfile } from "../types";

export const DIFFICULTIES: Record<DifficultyName, DifficultyProfile> = {
  leicht: {
    maxLevel: 10,
    countMult: 1.0,
    hpMult: 1.0,
    speedMult: 1.0,
    rewardMult: 1.0,
    startMoney: 240,
    lives: 22,
  },
  mittel: {
    maxLevel: 25,
    countMult: 1.4,
    hpMult: 1.22,
    speedMult: 1.08,
    rewardMult: 1.06,
    startMoney: 225,
    lives: 19,
  },
  schwer: {
    maxLevel: 50,
    countMult: 2.0,
    hpMult: 1.58,
    speedMult: 1.18,
    rewardMult: 1.11,
    startMoney: 210,
    lives: 17,
  },
  unmoeglich: {
    maxLevel: 99,
    countMult: 2.5,
    hpMult: 2.02,
    speedMult: 1.31,
    rewardMult: 1.18,
    startMoney: 195,
    lives: 14,
  },
};

export const DIFFICULTY_ORDER: DifficultyName[] = [
  "leicht",
  "mittel",
  "schwer",
  "unmoeglich",
];
