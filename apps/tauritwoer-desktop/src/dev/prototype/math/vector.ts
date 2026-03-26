import type { Point } from "../types";

export function point(x: number, y: number): Point {
  return { x, y };
}

export function clonePoint(p: Point): Point {
  return { x: p.x, y: p.y };
}

export function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function addScaled(a: Point, direction: Point, scale: number): Point {
  return {
    x: a.x + direction.x * scale,
    y: a.y + direction.y * scale,
  };
}

export function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

export function lengthSquared(v: Point): number {
  return dot(v, v);
}

export function length(v: Point): number {
  return Math.sqrt(lengthSquared(v));
}

export function normalize(v: Point): Point {
  const len = length(v);
  if (len === 0) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / len, y: v.y / len };
}

export function distanceBetween(a: Point, b: Point): number {
  return length(subtract(a, b));
}
