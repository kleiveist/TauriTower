import type { BulletSnapshot, EnemySnapshot } from "../types";
import { addScaled, distanceBetween, normalize, subtract } from "../math/vector";
import { applySlow, enemyTakeDamage } from "./enemy";

export function updateBullet(
  bullet: BulletSnapshot,
  dt: number,
  enemies: EnemySnapshot[],
  enemiesById?: ReadonlyMap<number, EnemySnapshot>,
): number {
  if (bullet.dead) {
    return 0;
  }

  const target = enemiesById?.get(bullet.targetEnemyId) ?? enemies.find((enemy) => enemy.id === bullet.targetEnemyId);
  if (!target || target.dead || target.reachedEnd) {
    bullet.dead = true;
    return 0;
  }

  const directionVector = subtract(target.pos, bullet.pos);
  let distance = Math.hypot(directionVector.x, directionVector.y);
  if (distance === 0) {
    distance = 0.001;
  }
  const direction = normalize(directionVector);
  const movement = bullet.speed * dt;

  if (movement >= distance || distanceBetween(bullet.pos, target.pos) <= target.radius + bullet.radius) {
    const reward = hitBullet(bullet, target, enemies);
    bullet.dead = true;
    return reward;
  } else {
    bullet.pos = addScaled(bullet.pos, direction, movement);
  }

  return 0;
}

function hitBullet(bullet: BulletSnapshot, target: EnemySnapshot, enemies: EnemySnapshot[]): number {
  if (bullet.bulletType === "single") {
    if (!target.dead && !target.reachedEnd && enemyTakeDamage(target, bullet.damage)) {
      return target.reward;
    }
    return 0;
  }

  if (bullet.bulletType === "stun") {
    if (!target.dead && !target.reachedEnd) {
      let reward = 0;
      if (enemyTakeDamage(target, bullet.damage)) {
        reward += target.reward;
      }
      applySlow(target, bullet.slowFactor, bullet.slowDuration);
      return reward;
    }
    return 0;
  }

  if (bullet.bulletType === "splash" || bullet.bulletType === "cannon") {
    const center = { x: target.pos.x, y: target.pos.y };
    let reward = 0;

    for (const enemy of enemies) {
      if (enemy.dead || enemy.reachedEnd) {
        continue;
      }
      if (distanceBetween(enemy.pos, center) > bullet.splashRadius) {
        continue;
      }

      let damage = bullet.damage;
      if (bullet.bulletType === "cannon" && enemy.id === target.id) {
        damage *= 1.2;
      } else if (bullet.bulletType === "cannon") {
        damage *= 0.7;
      }

      damage *= 1 - enemy.splashResistance;

      if (enemyTakeDamage(enemy, damage)) {
        reward += enemy.reward;
      }
    }

    return reward;
  }

  return 0;
}
