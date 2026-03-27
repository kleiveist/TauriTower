import { describe, expect, it } from "vitest";
import {
  decreaseSpeedMultiplier,
  increaseSpeedMultiplier,
  isSpeedDecreaseHotkey,
  isSpeedIncreaseHotkey,
  SPEED_MULTIPLIER_STEPS,
} from "./input";

function keyEventLike(
  key: string,
  code: string,
  ctrlKey = false,
): { key: string; code: string; ctrlKey: boolean; metaKey: boolean } {
  return {
    key,
    code,
    ctrlKey,
    metaKey: false,
  };
}

describe("runtime speed helpers", () => {
  it("increases speed in bounded steps", () => {
    let speed = 1.0;
    speed = increaseSpeedMultiplier(speed);
    expect(speed).toBe(1.5);
    speed = increaseSpeedMultiplier(speed);
    expect(speed).toBe(2.0);
    speed = increaseSpeedMultiplier(speed);
    expect(speed).toBe(3.0);
    speed = increaseSpeedMultiplier(speed);
    expect(speed).toBe(3.0);
  });

  it("decreases speed in bounded steps", () => {
    let speed = 3.0;
    speed = decreaseSpeedMultiplier(speed);
    expect(speed).toBe(2.0);
    speed = decreaseSpeedMultiplier(speed);
    expect(speed).toBe(1.5);
    speed = decreaseSpeedMultiplier(speed);
    expect(speed).toBe(1.0);
    speed = decreaseSpeedMultiplier(speed);
    expect(speed).toBe(0.5);
    speed = decreaseSpeedMultiplier(speed);
    expect(speed).toBe(0.5);
  });

  it("accepts Ctrl + variants for speed increase", () => {
    expect(isSpeedIncreaseHotkey(keyEventLike("+", "Equal", true))).toBe(true);
    expect(isSpeedIncreaseHotkey(keyEventLike("=", "Equal", true))).toBe(true);
    expect(isSpeedIncreaseHotkey(keyEventLike("+", "NumpadAdd", true))).toBe(true);
    expect(isSpeedIncreaseHotkey(keyEventLike("+", "Equal", false))).toBe(false);
  });

  it("accepts Ctrl - variants for speed decrease", () => {
    expect(isSpeedDecreaseHotkey(keyEventLike("-", "Minus", true))).toBe(true);
    expect(isSpeedDecreaseHotkey(keyEventLike("_", "Minus", true))).toBe(true);
    expect(isSpeedDecreaseHotkey(keyEventLike("-", "NumpadSubtract", true))).toBe(true);
    expect(isSpeedDecreaseHotkey(keyEventLike("-", "Minus", false))).toBe(false);
  });

  it("keeps step table stable", () => {
    expect(SPEED_MULTIPLIER_STEPS).toEqual([0.5, 1.0, 1.5, 2.0, 3.0]);
  });
});
