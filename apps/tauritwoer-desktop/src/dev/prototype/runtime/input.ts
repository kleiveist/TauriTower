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

export type KeyboardShortcutLike = Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "metaKey">;

export const SPEED_MULTIPLIER_STEPS = [0.5, 1.0, 1.5, 2.0, 3.0] as const;

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

export function increaseSpeedMultiplier(current: number): number {
  const index = nearestStepIndex(current);
  const nextIndex = Math.min(index + 1, SPEED_MULTIPLIER_STEPS.length - 1);
  return SPEED_MULTIPLIER_STEPS[nextIndex] ?? SPEED_MULTIPLIER_STEPS[0];
}

export function decreaseSpeedMultiplier(current: number): number {
  const index = nearestStepIndex(current);
  const nextIndex = Math.max(0, index - 1);
  return SPEED_MULTIPLIER_STEPS[nextIndex] ?? SPEED_MULTIPLIER_STEPS[0];
}

export function isSpeedIncreaseHotkey(event: KeyboardShortcutLike): boolean {
  if (!event.ctrlKey && !event.metaKey) {
    return false;
  }

  return (
    event.code === "NumpadAdd" ||
    event.code === "Equal" ||
    event.key === "+" ||
    event.key === "="
  );
}

export function isSpeedDecreaseHotkey(event: KeyboardShortcutLike): boolean {
  if (!event.ctrlKey && !event.metaKey) {
    return false;
  }

  return (
    event.code === "NumpadSubtract" ||
    event.code === "Minus" ||
    event.key === "-" ||
    event.key === "_"
  );
}

function nearestStepIndex(value: number): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < SPEED_MULTIPLIER_STEPS.length; i += 1) {
    const distance = Math.abs(SPEED_MULTIPLIER_STEPS[i] - value);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}
