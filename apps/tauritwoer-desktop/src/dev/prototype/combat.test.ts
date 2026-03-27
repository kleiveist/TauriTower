import { describe, expect, it } from "vitest";
import { updateBullet } from "./domain/bullet";
import { acquireTarget, updateTower } from "./domain/tower";
import type { BulletSnapshot, EnemySnapshot, TowerSnapshot } from "./types";

function makeEnemy(id: number, overrides: Partial<EnemySnapshot> = {}): EnemySnapshot {
  return {
    id,
    pos: { x: 100, y: 100 },
    pathIndex: 0,
    hp: 200,
    maxHp: 200,
    speed: 50,
    reward: 10,
    enemyType: "basic",
    radius: 12,
    color: [200, 86, 86],
    slowFactor: 1,
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

function makeTower(overrides: Partial<TowerSnapshot> = {}): TowerSnapshot {
  return {
    id: 1,
    pos: { x: 100, y: 100 },
    towerType: "Pistolman",
    cooldownLeft: 0,
    ...overrides,
  };
}

describe("combat systems", () => {
  it("prefers enemies further along the path", () => {
    const tower = makeTower();
    const enemies = [
      makeEnemy(1, { pathIndex: 1, pos: { x: 110, y: 100 } }),
      makeEnemy(2, { pathIndex: 4, pos: { x: 120, y: 100 } }),
    ];

    const target = acquireTarget(tower, enemies);
    expect(target?.id).toBe(2);
  });

  it("spawns bullets and applies cooldown", () => {
    const tower = makeTower();
    const enemies = [makeEnemy(1, { pos: { x: 120, y: 100 } })];
    const bullets: BulletSnapshot[] = [];

    updateTower(tower, 0.1, enemies, bullets, () => 99);

    expect(bullets).toHaveLength(1);
    expect(bullets[0].id).toBe(99);
    expect(tower.cooldownLeft).toBeGreaterThan(0);
  });

  it("cannon damage applies splash multiplier to target and nearby enemies", () => {
    const target = makeEnemy(1, { hp: 500, maxHp: 500, pos: { x: 200, y: 200 } });
    const nearby = makeEnemy(2, { hp: 500, maxHp: 500, pos: { x: 220, y: 200 } });
    const far = makeEnemy(3, { hp: 500, maxHp: 500, pos: { x: 400, y: 200 } });

    const bullet: BulletSnapshot = {
      id: 1,
      pos: { x: 200, y: 200 },
      targetEnemyId: 1,
      damage: 100,
      speed: 620,
      color: [96, 158, 92],
      bulletType: "cannon",
      splashRadius: 60,
      slowFactor: 1,
      slowDuration: 0,
      radius: 8,
      dead: false,
    };

    updateBullet(bullet, 0.016, [target, nearby, far]);

    expect(target.hp).toBeCloseTo(380, 6);
    expect(nearby.hp).toBeCloseTo(430, 6);
    expect(far.hp).toBe(500);
    expect(bullet.dead).toBe(true);
  });

  it("resolves projectile targets via enemy id map lookup", () => {
    const target = makeEnemy(11, { hp: 140, maxHp: 140, pos: { x: 180, y: 180 } });
    const bullet: BulletSnapshot = {
      id: 77,
      pos: { x: 180, y: 180 },
      targetEnemyId: 11,
      damage: 50,
      speed: 600,
      color: [90, 140, 220],
      bulletType: "single",
      splashRadius: 0,
      slowFactor: 1,
      slowDuration: 0,
      radius: 4,
      dead: false,
    };

    const enemies = [target];
    const enemyById = new Map<number, EnemySnapshot>([[target.id, target]]);

    updateBullet(bullet, 0.016, enemies, enemyById);

    expect(target.hp).toBeLessThan(140);
    expect(bullet.dead).toBe(true);
  });
});
