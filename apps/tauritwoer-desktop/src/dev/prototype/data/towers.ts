import type { TowerName, TowerStats } from "../types";

export const TOWER_TYPES: Record<TowerName, TowerStats> = {
  Pistolman: {
    unlock: 0,
    cost: 60,
    range: 130,
    damage: 18,
    cooldown: 0.55,
    bulletSpeed: 520,
    color: [90, 140, 220],
    kind: "single",
  },
  Scharfschuetze: {
    unlock: 4,
    cost: 145,
    range: 320,
    damage: 92,
    cooldown: 1.5,
    bulletSpeed: 920,
    color: [153, 94, 215],
    kind: "single",
  },
  Stunner: {
    unlock: 6,
    cost: 112,
    range: 160,
    damage: 6,
    cooldown: 0.8,
    bulletSpeed: 450,
    color: [90, 200, 220],
    kind: "stun",
    slowFactor: 0.5,
    slowDuration: 1.8,
  },
  Bombarman: {
    unlock: 8,
    cost: 180,
    range: 175,
    damage: 42,
    cooldown: 1.15,
    bulletSpeed: 360,
    color: [232, 141, 63],
    kind: "splash",
    splashRadius: 66,
  },
  "Panzer-Tower": {
    unlock: 10,
    cost: 420,
    range: 245,
    damage: 210,
    cooldown: 1.0,
    bulletSpeed: 620,
    color: [96, 158, 92],
    kind: "cannon",
    splashRadius: 82,
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
    return 8;
  }
  return 4;
}
