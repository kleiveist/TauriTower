import type { Point } from "../types";
import { addScaled, distanceBetween, dot, lengthSquared, subtract } from "./vector";

export function distancePointToSegment(p: Point, a: Point, b: Point): number {
  const ab = subtract(b, a);
  const abLenSquared = lengthSquared(ab);
  if (abLenSquared === 0) {
    return distanceBetween(p, a);
  }

  const ap = subtract(p, a);
  const t = Math.max(0, Math.min(1, dot(ap, ab) / abLenSquared));
  const projection = addScaled(a, ab, t);
  return distanceBetween(p, projection);
}
