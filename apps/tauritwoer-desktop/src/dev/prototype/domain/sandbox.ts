import type {
  SandboxConfig,
  SandboxSlot,
  SandboxValidationIssue,
  SandboxSlotValidationResult,
  SpawnKey,
  WavePreview,
} from "../types";

const MIN_START_ROUND = 1;
const MAX_BOSS_STAGE = 9;
const MAX_BASE_COUNT = 250;
const MAX_ADD_EVERY_10 = 250;
const MIN_MULTIPLIER = 0;
const MAX_MULTIPLIER = 5;
const MAX_SLOT_SPAWN = 2000;

export function createSandboxSlotId(index: number): string {
  return `slot-${index}`;
}

export function createSandboxSlot(id: string): SandboxSlot {
  return {
    id,
    enemyType: "basic",
    bossStage: 1,
    startRound: 1,
    baseCount: 3,
    multiplier: 1,
    addEvery10Rounds: 1,
    enabled: true,
  };
}

export function createDefaultSandboxConfig(): SandboxConfig {
  return {
    slots: [
      createSandboxSlot(createSandboxSlotId(1)),
      {
        ...createSandboxSlot(createSandboxSlotId(2)),
        enemyType: "runner",
        startRound: 6,
        baseCount: 2,
        multiplier: 1.05,
        addEvery10Rounds: 1,
      },
      {
        ...createSandboxSlot(createSandboxSlotId(3)),
        enemyType: "brute",
        startRound: 12,
        baseCount: 1,
        multiplier: 1.08,
        addEvery10Rounds: 1,
      },
      {
        ...createSandboxSlot(createSandboxSlotId(4)),
        enemyType: "shield",
        startRound: 18,
        baseCount: 1,
        multiplier: 1.04,
        addEvery10Rounds: 1,
      },
    ],
  };
}

export function cloneSandboxConfig(config: SandboxConfig): SandboxConfig {
  return {
    slots: config.slots.map((slot) => ({ ...slot })),
  };
}

export function normalizeSandboxSlot(slot: SandboxSlot): SandboxSlot {
  return {
    ...slot,
    bossStage: clampInt(slot.bossStage, 1, MAX_BOSS_STAGE),
    startRound: clampInt(slot.startRound, MIN_START_ROUND, 9999),
    baseCount: clampInt(slot.baseCount, 0, MAX_BASE_COUNT),
    multiplier: clampFloat(slot.multiplier, MIN_MULTIPLIER, MAX_MULTIPLIER),
    addEvery10Rounds: clampInt(slot.addEvery10Rounds, 0, MAX_ADD_EVERY_10),
  };
}

export function validateSandboxSlot(slot: SandboxSlot): SandboxSlotValidationResult {
  const issues: SandboxValidationIssue[] = [];

  if (!slot.id.trim()) {
    issues.push({ code: "slot_id_required" });
  }

  if (!Number.isFinite(slot.startRound) || slot.startRound < MIN_START_ROUND) {
    issues.push({ code: "start_round_min", min: MIN_START_ROUND });
  }

  if (!Number.isFinite(slot.baseCount) || slot.baseCount < 0) {
    issues.push({ code: "base_count_non_negative" });
  }

  if (!Number.isFinite(slot.addEvery10Rounds) || slot.addEvery10Rounds < 0) {
    issues.push({ code: "add_every_10_non_negative" });
  }

  if (!Number.isFinite(slot.multiplier) || slot.multiplier < MIN_MULTIPLIER || slot.multiplier > MAX_MULTIPLIER) {
    issues.push({ code: "multiplier_range", min: MIN_MULTIPLIER, max: MAX_MULTIPLIER });
  }

  if (slot.enemyType === "boss") {
    if (!Number.isFinite(slot.bossStage) || slot.bossStage < 1 || slot.bossStage > MAX_BOSS_STAGE) {
      issues.push({ code: "boss_stage_range", min: 1, max: MAX_BOSS_STAGE });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function validateSandboxConfig(config: SandboxConfig): SandboxSlotValidationResult {
  const issues: SandboxValidationIssue[] = [];

  if (!Array.isArray(config.slots)) {
    return {
      valid: false,
      issues: [{ code: "slots_must_be_array" }],
    };
  }

  const ids = new Set<string>();
  config.slots.forEach((slot, index) => {
    const result = validateSandboxSlot(slot);
    if (!result.valid) {
      for (const issue of result.issues) {
        issues.push({ ...issue, slotIndex: index + 1 });
      }
    }

    if (ids.has(slot.id)) {
      issues.push({ code: "duplicate_id", slotIndex: index + 1, id: slot.id });
    }
    ids.add(slot.id);
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function sandboxSlotSpawnCount(slot: SandboxSlot, round: number): number {
  if (!slot.enabled || round < slot.startRound) {
    return 0;
  }

  // Sandbox scaling order:
  // 1) start-round gate
  // 2) base + additive growth per 10-round band
  // 3) linear multiplier scaling by rounds since start
  // 4) round and clamp to non-negative
  const band10 = Math.floor(round / 10);
  const basePlusAdd = slot.baseCount + slot.addEvery10Rounds * band10;
  const roundsSinceStart = round - slot.startRound;
  const linearFactor = 1 + (slot.multiplier - 1) * roundsSinceStart;

  const scaled = Math.round(basePlusAdd * linearFactor);
  return clampInt(scaled, 0, MAX_SLOT_SPAWN);
}

export function buildSandboxWavePlan(round: number, config: SandboxConfig): SpawnKey[] {
  const plan: SpawnKey[] = [];

  for (const rawSlot of config.slots) {
    const slot = normalizeSandboxSlot(rawSlot);
    const validation = validateSandboxSlot(slot);
    if (!validation.valid) {
      continue;
    }

    const count = sandboxSlotSpawnCount(slot, round);
    if (count <= 0) {
      continue;
    }

    if (slot.enemyType === "boss") {
      const key = `boss_${slot.bossStage}` as SpawnKey;
      for (let i = 0; i < count; i += 1) {
        plan.push(key);
      }
      continue;
    }

    for (let i = 0; i < count; i += 1) {
      plan.push(slot.enemyType);
    }
  }

  return plan;
}

export function previewSandboxWaveInfo(round: number, config: SandboxConfig): WavePreview {
  const plan = buildSandboxWavePlan(round, config);

  let bossStage: number | null = null;
  for (const key of plan) {
    if (!key.startsWith("boss_")) {
      continue;
    }
    const stage = Number.parseInt(key.slice(5), 10);
    bossStage = Math.max(1, Math.min(stage, MAX_BOSS_STAGE));
    break;
  }

  return {
    count: plan.length,
    boss: bossStage !== null,
    bossStage,
    basic: plan.filter((key) => key === "basic").length,
    runner: plan.filter((key) => key === "runner").length,
    brute: plan.filter((key) => key === "brute").length,
    shield: plan.filter((key) => key === "shield").length,
  };
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampFloat(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}
