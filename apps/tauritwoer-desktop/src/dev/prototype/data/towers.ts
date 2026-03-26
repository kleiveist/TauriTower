import type { TowerName, TowerStats } from "../types";

export const TOWER_TYPES: Record<TowerName, TowerStats> = {
  Pistolman: {
    unlock: 0,
    cost: 60,
    range: 140,
    damage: 18,
    cooldown: 0.55,
    bulletSpeed: 520,
    color: [90, 140, 220],
    kind: "single",
  },
  Scharfschuetze: {
    unlock: 4,
    cost: 150,
    range: 340,
    damage: 94,
    cooldown: 1.45,
    bulletSpeed: 940,
    color: [153, 94, 215],
    kind: "single",
  },
  Stunner: {
    unlock: 6,
    cost: 118,
    range: 168,
    damage: 7,
    cooldown: 0.8,
    bulletSpeed: 460,
    color: [90, 200, 220],
    kind: "stun",
    slowFactor: 0.5,
    slowDuration: 1.8,
  },
  Bombarman: {
    unlock: 8,
    cost: 186,
    range: 182,
    damage: 46,
    cooldown: 1.12,
    bulletSpeed: 372,
    color: [232, 141, 63],
    kind: "splash",
    splashRadius: 72,
  },
  "Panzer-Tower": {
    unlock: 10,
    cost: 560,
    range: 290,
    damage: 260,
    cooldown: 0.9,
    bulletSpeed: 700,
    color: [96, 158, 92],
    kind: "cannon",
    splashRadius: 92,
  },
};

export const TOWER_ORDER: TowerName[] = [
  "Pistolman",
  "Scharfschuetze",
  "Stunner",
  "Bombarman",
  "Panzer-Tower",
];

export function bulletRadiusForTower(towerName: TowerName): number {
  if (towerName === "Bombarman") {
    return 6;
  }
  if (towerName === "Panzer-Tower") {
    return 9;
  }
  return 4;
}

export const TOWER_DESCRIPTIONS: Record<TowerName, string> = {
  Pistolman: "Reliable single-target starter",
  Scharfschuetze: "Very long range sniper",
  Stunner: "Slows enemies with every shot",
  Bombarman: "Area damage against groups",
  "Panzer-Tower": "Very expensive, massive cannon power",
};
