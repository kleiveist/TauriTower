import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "./data/difficulties";
import {
  bossKeyForLevel,
  bossStageForLevel,
  buildWavePlan,
  enemyCountForLevel,
  previewWaveInfo,
} from "./domain/waves";

describe("wave planner", () => {
  it("computes enemy count from level and difficulty multiplier", () => {
    expect(enemyCountForLevel(1, DIFFICULTIES.unmoeglich)).toBe(3);
    expect(enemyCountForLevel(7, DIFFICULTIES.mittel)).toBe(10);
  });

  it("creates a boss wave on every 10th level", () => {
    const plan = buildWavePlan(10, DIFFICULTIES.leicht);
    expect(plan[plan.length - 1]).toBe("boss_1");
    expect(plan.filter((enemyType) => enemyType === "basic").length).toBeGreaterThan(0);
  });

  it("scales boss stage from level", () => {
    expect(bossStageForLevel(10)).toBe(1);
    expect(bossStageForLevel(50)).toBe(5);
    expect(bossStageForLevel(130)).toBe(9);
    expect(bossKeyForLevel(90)).toBe("boss_9");
  });

  it("exposes preview counts and boss stage", () => {
    const preview = previewWaveInfo(20, DIFFICULTIES.schwer);
    expect(preview.boss).toBe(true);
    expect(preview.bossStage).toBe(2);
    expect(preview.count).toBe(preview.basic + preview.runner + preview.brute + preview.shield + 1);
  });
});
