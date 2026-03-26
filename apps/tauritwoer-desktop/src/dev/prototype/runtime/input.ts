import { TOWER_ORDER } from "../data/towers";
import type { DifficultyName, Point, TowerName } from "../types";
import { pointInRect } from "./layout";
import type { Rect } from "./layout";

export interface TaggedRect<T extends string> {
  rect: Rect;
  tag: T;
}

export interface TaggedRectWithValue<T extends string, V> {
  rect: Rect;
  tag: T;
  value: V;
}

export function findTaggedRect<T extends string>(
  point: Point,
  entries: TaggedRect<T>[],
): TaggedRect<T> | undefined {
  return entries.find((entry) => pointInRect(point, entry.rect));
}

export function findTaggedRectWithValue<T extends string, V>(
  point: Point,
  entries: TaggedRectWithValue<T, V>[],
): TaggedRectWithValue<T, V> | undefined {
  return entries.find((entry) => pointInRect(point, entry.rect));
}

export function towerFromDigitKey(key: string): TowerName | null {
  if (key.length !== 1) {
    return null;
  }

  const digit = Number.parseInt(key, 10);
  if (!Number.isFinite(digit) || digit < 1 || digit > TOWER_ORDER.length) {
    return null;
  }

  return TOWER_ORDER[digit - 1] ?? null;
}

export function difficultyLabel(difficulty: DifficultyName): string {
  if (difficulty === "unmoeglich") {
    return "Unmoeglich";
  }
  return `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`;
}
