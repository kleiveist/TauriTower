import type { EnemySnapshot, Point } from "../types";
import { addScaled, distanceBetween, normalize, subtract } from "../math/vector";

export function updateEnemy(enemy: EnemySnapshot, dt: number, pathPoints: Point[]): void {
  if (enemy.dead || enemy.reachedEnd) {
    return;
  }

  if (enemy.regenPerSec > 0 && enemy.hp > 0) {
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.regenPerSec * dt);
  }

  if (enemy.slowTimer > 0) {
    enemy.slowTimer -= dt;
    if (enemy.slowTimer <= 0) {
      enemy.slowFactor = 1.0;
    }
  }

  if (enemy.pathIndex >= pathPoints.length - 1) {
    enemy.reachedEnd = true;
    return;
  }

  const target = pathPoints[enemy.pathIndex + 1];
  const directionVector = subtract(target, enemy.pos);
  const distance = Math.hypot(directionVector.x, directionVector.y);

  if (distance === 0) {
    enemy.pathIndex += 1;
    return;
  }

  const direction = normalize(directionVector);
  const movement = enemy.speed * enemy.slowFactor * dt;

  if (movement >= distance) {
    enemy.pos = { x: target.x, y: target.y };
    enemy.pathIndex += 1;
    if (enemy.pathIndex >= pathPoints.length - 1) {
      enemy.reachedEnd = true;
    }
    return;
  }

  enemy.pos = addScaled(enemy.pos, direction, movement);
}

export function enemyTakeDamage(enemy: EnemySnapshot, amount: number): boolean {
  const effectiveDamage = Math.max(1.0, amount - enemy.armor);
  enemy.hp -= effectiveDamage;
  if (enemy.hp <= 0 && !enemy.dead) {
    enemy.dead = true;
    return true;
  }
  return false;
}

export function applySlow(enemy: EnemySnapshot, factor: number, duration: number): void {
  const effectiveFactor = 1.0 - (1.0 - factor) * (1.0 - enemy.slowResistance);
  enemy.slowFactor = Math.min(enemy.slowFactor, effectiveFactor);
  enemy.slowTimer = Math.max(enemy.slowTimer, duration);
}

export function enemyDistanceTo(enemy: EnemySnapshot, point: Point): number {
  return distanceBetween(enemy.pos, point);
}
