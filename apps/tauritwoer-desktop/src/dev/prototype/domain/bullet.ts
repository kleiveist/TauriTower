import type { BulletSnapshot, EnemySnapshot } from "../types";
import { addScaled, distanceBetween, normalize, subtract } from "../math/vector";
import { applySlow, enemyTakeDamage } from "./enemy";

export function updateBullet(
  bullet: BulletSnapshot,
  dt: number,
  enemies: EnemySnapshot[],
  enemiesById?: ReadonlyMap<number, EnemySnapshot>,
): EnemySnapshot[] {
  const killed: EnemySnapshot[] = [];

  if (bullet.dead) {
    return killed;
  }

  const target = enemiesById?.get(bullet.targetEnemyId) ?? enemies.find((enemy) => enemy.id === bullet.targetEnemyId);
  if (!target || target.dead || target.reachedEnd) {
    bullet.dead = true;
    return killed;
  }

  const directionVector = subtract(target.pos, bullet.pos);
  let distance = Math.hypot(directionVector.x, directionVector.y);
  if (distance === 0) {
    distance = 0.001;
  }
  const direction = normalize(directionVector);
  const movement = bullet.speed * dt;

  if (movement >= distance || distanceBetween(bullet.pos, target.pos) <= target.radius + bullet.radius) {
    killed.push(...hitBullet(bullet, target, enemies));
    bullet.dead = true;
  } else {
    bullet.pos = addScaled(bullet.pos, direction, movement);
  }

  return killed;
}

function hitBullet(
  bullet: BulletSnapshot,
  target: EnemySnapshot,
  enemies: EnemySnapshot[],
): EnemySnapshot[] {
  const killed: EnemySnapshot[] = [];

  if (bullet.bulletType === "single") {
    if (!target.dead && !target.reachedEnd && enemyTakeDamage(target, bullet.damage)) {
      killed.push(target);
    }
    return killed;
  }

  if (bullet.bulletType === "stun") {
    if (!target.dead && !target.reachedEnd) {
      if (enemyTakeDamage(target, bullet.damage)) {
        killed.push(target);
      }
      applySlow(target, bullet.slowFactor, bullet.slowDuration);
    }
    return killed;
  }

  if (bullet.bulletType === "splash" || bullet.bulletType === "cannon") {
    const center = { x: target.pos.x, y: target.pos.y };

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
        killed.push(enemy);
      }
    }
  }

  return killed;
}
