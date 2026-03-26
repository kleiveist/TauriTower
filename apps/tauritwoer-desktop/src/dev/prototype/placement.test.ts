import { describe, expect, it } from "vitest";
import { FIELD_W, SCREEN_H } from "./data/constants";
import { isWithinPlayableField, validTowerPosition } from "./domain/placement";
import type { TowerSnapshot } from "./types";

describe("tower placement", () => {
  it("accepts a valid field position", () => {
    expect(validTowerPosition({ x: 120, y: 260 }, [])).toBe(true);
  });

  it("rejects positions outside field bounds", () => {
    expect(isWithinPlayableField({ x: 0, y: 100 })).toBe(false);
    expect(isWithinPlayableField({ x: FIELD_W + 4, y: SCREEN_H - 20 })).toBe(false);
  });

  it("rejects positions too close to path", () => {
    expect(validTowerPosition({ x: 120, y: 140 }, [])).toBe(false);
  });

  it("rejects positions too close to existing towers", () => {
    const towers: TowerSnapshot[] = [
      {
        id: 1,
        pos: { x: 300, y: 300 },
        towerType: "Pistolman",
        cooldownLeft: 0,
      },
    ];

    expect(validTowerPosition({ x: 320, y: 320 }, towers)).toBe(false);
  });
});
