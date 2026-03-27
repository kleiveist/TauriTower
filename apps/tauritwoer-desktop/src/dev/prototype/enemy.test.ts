import { describe, expect, it } from "vitest";
import { PATH_POINTS } from "./data/constants";
import { applySlow, enemyTakeDamage, updateEnemy } from "./domain/enemy";
import type { EnemySnapshot } from "./types";

function makeEnemy(overrides: Partial<EnemySnapshot> = {}): EnemySnapshot {
  return {
    id: 1,
    pos: { x: PATH_POINTS[0].x, y: PATH_POINTS[0].y },
    pathIndex: 0,
    hp: 100,
    maxHp: 100,
    speed: 72,
    reward: 10,
    enemyType: "basic",
    radius: 14,
    color: [200, 86, 86],
    slowFactor: 1.0,
    slowTimer: 0,
    reachedEnd: false,
    dead: false,
    armor: 0,
    slowResistance: 0,
    splashResistance: 0,
    regenPerSec: 0,
    lifeDamage: 1,
    bossStage: null,
    bossShape: "circle",
    ...overrides,
  };
}

describe("enemy behavior", () => {
  it("moves along the path using speed and dt", () => {
    const enemy = makeEnemy();
    updateEnemy(enemy, 1, PATH_POINTS);

    expect(enemy.pos.x).toBeCloseTo(72, 6);
    expect(enemy.pos.y).toBe(PATH_POINTS[0].y);
    expect(enemy.pathIndex).toBe(0);
  });

  it("applies slow with resistance", () => {
    const enemy = makeEnemy({ slowResistance: 0.5 });
    applySlow(enemy, 0.5, 2);

    expect(enemy.slowFactor).toBeCloseTo(0.75, 6);
    expect(enemy.slowTimer).toBe(2);
  });

  it("regenerates over time", () => {
    const enemy = makeEnemy({ hp: 50, maxHp: 100, regenPerSec: 5 });
    updateEnemy(enemy, 2, PATH_POINTS);

    expect(enemy.hp).toBeCloseTo(60, 6);
  });

  it("applies armor and minimum damage", () => {
    const enemy = makeEnemy({ armor: 50, hp: 10 });
    const killed = enemyTakeDamage(enemy, 10);

    expect(killed).toBe(false);
    expect(enemy.hp).toBe(9);
  });

  it("flags reachedEnd when already at final path index", () => {
    const enemy = makeEnemy({ pathIndex: PATH_POINTS.length - 1 });
    updateEnemy(enemy, 0.16, PATH_POINTS);

    expect(enemy.reachedEnd).toBe(true);
  });
});
