import { bulletRadiusForTower, TOWER_TYPES } from "../data/towers";
import { distanceBetween } from "../math/vector";
import type { BulletSnapshot, EnemySnapshot, TowerSnapshot } from "../types";

export function updateTower(
  tower: TowerSnapshot,
  dt: number,
  enemies: EnemySnapshot[],
  bullets: BulletSnapshot[],
  nextBulletId: () => number,
): void {
  if (tower.cooldownLeft > 0) {
    tower.cooldownLeft -= dt;
  }
  if (tower.cooldownLeft > 0) {
    return;
  }

  const target = acquireTarget(tower, enemies);
  if (!target) {
    return;
  }

  const stats = TOWER_TYPES[tower.towerType];
  bullets.push({
    id: nextBulletId(),
    pos: { x: tower.pos.x, y: tower.pos.y },
    targetEnemyId: target.id,
    damage: stats.damage,
    speed: stats.bulletSpeed,
    color: [...stats.color] as [number, number, number],
    bulletType: stats.kind,
    splashRadius: stats.splashRadius ?? 0,
    slowFactor: stats.slowFactor ?? 1,
    slowDuration: stats.slowDuration ?? 0,
    radius: bulletRadiusForTower(tower.towerType),
    dead: false,
  });

  tower.cooldownLeft = stats.cooldown;
}

export function acquireTarget(
  tower: TowerSnapshot,
  enemies: EnemySnapshot[],
): EnemySnapshot | undefined {
  let best: EnemySnapshot | undefined;

  for (const enemy of enemies) {
    if (enemy.dead || enemy.reachedEnd) {
      continue;
    }

    const range = TOWER_TYPES[tower.towerType].range;
    if (distanceBetween(tower.pos, enemy.pos) > range) {
      continue;
    }

    if (!best || compareTargetPriority(enemy, best) > 0) {
      best = enemy;
    }
  }

  return best;
}

function compareTargetPriority(a: EnemySnapshot, b: EnemySnapshot): number {
  if (a.pathIndex !== b.pathIndex) {
    return a.pathIndex - b.pathIndex;
  }

  const aPosSum = a.pos.x + a.pos.y;
  const bPosSum = b.pos.x + b.pos.y;
  if (aPosSum !== bPosSum) {
    return aPosSum - bPosSum;
  }

  const aBoss = a.enemyType === "boss" ? 1 : 0;
  const bBoss = b.enemyType === "boss" ? 1 : 0;
  return aBoss - bBoss;
}
