import { describe, expect, it } from "vitest";
import {
  buildSandboxWavePlan,
  createDefaultSandboxConfig,
  createSandboxSlot,
  sandboxSlotSpawnCount,
  validateSandboxConfig,
  validateSandboxSlot,
} from "./domain/sandbox";
import type { SandboxConfig } from "./types";

describe("sandbox wave planner", () => {
  it("applies additive growth every 10 rounds cumulatively", () => {
    const slot = {
      ...createSandboxSlot("slot-1"),
      baseCount: 3,
      addEvery10Rounds: 5,
      multiplier: 1,
      startRound: 1,
      enabled: true,
    };

    expect(sandboxSlotSpawnCount(slot, 1)).toBe(3);
    expect(sandboxSlotSpawnCount(slot, 9)).toBe(3);
    expect(sandboxSlotSpawnCount(slot, 10)).toBe(8);
    expect(sandboxSlotSpawnCount(slot, 19)).toBe(8);
    expect(sandboxSlotSpawnCount(slot, 20)).toBe(13);
    expect(sandboxSlotSpawnCount(slot, 30)).toBe(18);
  });

  it("applies linear multiplier scaling after start round", () => {
    const slot = {
      ...createSandboxSlot("slot-2"),
      startRound: 5,
      baseCount: 2,
      addEvery10Rounds: 0,
      multiplier: 1.2,
      enabled: true,
    };

    expect(sandboxSlotSpawnCount(slot, 4)).toBe(0);
    expect(sandboxSlotSpawnCount(slot, 5)).toBe(2);
    expect(sandboxSlotSpawnCount(slot, 6)).toBe(2);
    expect(sandboxSlotSpawnCount(slot, 10)).toBe(4);
  });

  it("keeps blockwise ordering by slot list order", () => {
    const config: SandboxConfig = {
      slots: [
        {
          ...createSandboxSlot("slot-1"),
          enemyType: "basic",
          baseCount: 2,
          addEvery10Rounds: 0,
          multiplier: 1,
          startRound: 1,
        },
        {
          ...createSandboxSlot("slot-2"),
          enemyType: "runner",
          baseCount: 1,
          addEvery10Rounds: 0,
          multiplier: 1,
          startRound: 1,
        },
      ],
    };

    expect(buildSandboxWavePlan(1, config)).toEqual(["basic", "basic", "runner"]);
  });

  it("maps boss slots to explicit boss profile keys", () => {
    const config: SandboxConfig = {
      slots: [
        {
          ...createSandboxSlot("slot-1"),
          enemyType: "boss",
          bossStage: 4,
          baseCount: 2,
          addEvery10Rounds: 0,
          multiplier: 1,
          startRound: 1,
        },
      ],
    };

    expect(buildSandboxWavePlan(1, config)).toEqual(["boss_4", "boss_4"]);
  });

  it("validates slot boundaries and duplicate ids", () => {
    const invalidSlot = {
      ...createSandboxSlot("slot-1"),
      startRound: 0,
      baseCount: -1,
      multiplier: 9,
    };

    const slotValidation = validateSandboxSlot(invalidSlot);
    expect(slotValidation.valid).toBe(false);
    expect(slotValidation.issues.length).toBeGreaterThan(0);

    const defaults = createDefaultSandboxConfig();
    const duplicated: SandboxConfig = {
      slots: [
        defaults.slots[0],
        { ...defaults.slots[0] },
      ],
    };

    const configValidation = validateSandboxConfig(duplicated);
    expect(configValidation.valid).toBe(false);
    expect(configValidation.issues.some((issue) => issue.code === "duplicate_id")).toBe(true);
  });
});
