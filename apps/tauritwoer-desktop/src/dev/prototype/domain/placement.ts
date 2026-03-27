import { FIELD_W, PATH_WIDTH, SCREEN_H, TOWER_RADIUS } from "../data/constants";
import { PATH_POINTS } from "../data/constants";
import { distancePointToSegment } from "../math/geometry";
import { distanceBetween } from "../math/vector";
import type { Point, TowerSnapshot } from "../types";

export function validTowerPosition(
  pos: Point,
  towers: TowerSnapshot[],
  pathPoints: Point[] = PATH_POINTS,
): boolean {
  if (!isWithinPlayableField(pos)) {
    return false;
  }

  for (const tower of towers) {
    if (distanceBetween(tower.pos, pos) < TOWER_RADIUS * 2 + 8) {
      return false;
    }
  }

  for (let i = 0; i < pathPoints.length - 1; i += 1) {
    const a = pathPoints[i];
    const b = pathPoints[i + 1];
    if (distancePointToSegment(pos, a, b) <= PATH_WIDTH / 2 + TOWER_RADIUS + 4) {
      return false;
    }
  }

  return true;
}

export function isWithinPlayableField(pos: Point): boolean {
  if (pos.x < TOWER_RADIUS + 6 || pos.x > FIELD_W - TOWER_RADIUS - 6) {
    return false;
  }
  if (pos.y < TOWER_RADIUS + 6 || pos.y > SCREEN_H - TOWER_RADIUS - 6) {
    return false;
  }
  return true;
}
