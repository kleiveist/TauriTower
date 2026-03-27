import type { DifficultyProfile, SpawnKey, WavePreview } from "../types";

export function enemyCountForLevel(level: number, difficulty: DifficultyProfile): number {
  // Required wave-size formula: ceil(level * difficultyMultiplier)
  return Math.max(1, Math.ceil(level * difficulty.countMult));
}

export function bossStageForLevel(level: number): number {
  return Math.max(1, Math.min(Math.floor(level / 10), 9));
}

export function bossKeyForLevel(level: number): SpawnKey {
  return `boss_${bossStageForLevel(level)}`;
}

export function buildWavePlan(level: number, difficulty: DifficultyProfile): SpawnKey[] {
  const regularCount = enemyCountForLevel(level, difficulty);
  let runnerCount = 0;
  let bruteCount = 0;
  let shieldCount = 0;

  if (level >= 6) {
    const runnerRatio = Math.min(0.18 + level * 0.008, 0.36);
    runnerCount = Math.max(1, Math.round(regularCount * runnerRatio));
  }
  if (level >= 12) {
    const bruteRatio = Math.min(0.1 + (level - 12) * 0.005, 0.24);
    bruteCount = Math.max(1, Math.round(regularCount * bruteRatio));
  }
  if (level >= 18) {
    const shieldRatio = Math.min(0.06 + (level - 18) * 0.004, 0.18);
    shieldCount = Math.max(1, Math.round(regularCount * shieldRatio));
  }

  const maxSpecial = regularCount - 1;
  let specials = runnerCount + bruteCount + shieldCount;
  if (specials > maxSpecial) {
    let overflow = specials - maxSpecial;

    const reduce = (current: number): number => {
      const step = Math.min(current, overflow);
      overflow -= step;
      return current - step;
    };

    bruteCount = reduce(bruteCount);
    if (overflow > 0) {
      shieldCount = reduce(shieldCount);
    }
    if (overflow > 0) {
      runnerCount = reduce(runnerCount);
    }

    specials = runnerCount + bruteCount + shieldCount;
    if (specials > maxSpecial) {
      runnerCount = Math.max(0, runnerCount - (specials - maxSpecial));
    }
  }

  const basicCount = Math.max(1, regularCount - runnerCount - bruteCount - shieldCount);
  const counts: Record<"basic" | "runner" | "brute" | "shield", number> = {
    basic: basicCount,
    runner: runnerCount,
    brute: bruteCount,
    shield: shieldCount,
  };

  const order: Array<"basic" | "runner" | "brute" | "shield"> = [
    "basic",
    "runner",
    "basic",
    "brute",
    "basic",
    "shield",
    "runner",
  ];

  const plan: SpawnKey[] = [];
  while (counts.basic + counts.runner + counts.brute + counts.shield > 0) {
    for (const enemyType of order) {
      if (counts[enemyType] > 0) {
        plan.push(enemyType);
        counts[enemyType] -= 1;
      }
    }
  }

  if (level % 10 === 0) {
    plan.push(bossKeyForLevel(level));
  }

  return plan;
}

export function previewWaveInfo(level: number, difficulty: DifficultyProfile): WavePreview {
  const plan = buildWavePlan(level, difficulty);
  let bossStage: number | null = null;

  for (const enemyType of plan) {
    const stage = bossStageFromSpawnKey(enemyType);
    if (stage) {
      bossStage = stage;
      break;
    }
  }

  return {
    count: plan.length,
    boss: bossStage !== null,
    bossStage,
    basic: plan.filter((enemyType) => enemyType === "basic").length,
    runner: plan.filter((enemyType) => enemyType === "runner").length,
    brute: plan.filter((enemyType) => enemyType === "brute").length,
    shield: plan.filter((enemyType) => enemyType === "shield").length,
  };
}

export function bossStageFromSpawnKey(spawnKey: SpawnKey): number | null {
  if (!spawnKey.startsWith("boss_")) {
    return null;
  }
  const stage = Number.parseInt(spawnKey.slice(5), 10);
  if (!Number.isFinite(stage) || stage < 1) {
    return null;
  }
  return stage;
}
