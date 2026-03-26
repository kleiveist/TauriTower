import { BOSS_PROFILES } from "../data/bosses";
import type { DifficultyProfile, SpawnKey, WavePreview } from "../types";

export function enemyCountForLevel(level: number, difficulty: DifficultyProfile): number {
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

  if (level >= 6) {
    const runnerRatio = Math.min(0.18 + level * 0.008, 0.36);
    runnerCount = Math.max(1, Math.round(regularCount * runnerRatio));
  }
  if (level >= 12) {
    const bruteRatio = Math.min(0.1 + (level - 12) * 0.005, 0.24);
    bruteCount = Math.max(1, Math.round(regularCount * bruteRatio));
  }

  if (runnerCount + bruteCount >= regularCount) {
    let overflow = runnerCount + bruteCount - (regularCount - 1);
    if (bruteCount >= overflow) {
      bruteCount -= overflow;
    } else {
      overflow -= bruteCount;
      bruteCount = 0;
      runnerCount = Math.max(0, runnerCount - overflow);
    }
  }

  const basicCount = Math.max(1, regularCount - runnerCount - bruteCount);
  const counts: Record<"basic" | "runner" | "brute", number> = {
    basic: basicCount,
    runner: runnerCount,
    brute: bruteCount,
  };

  const order: Array<"basic" | "runner" | "brute"> = [
    "basic",
    "runner",
    "basic",
    "brute",
    "basic",
    "runner",
  ];

  const plan: SpawnKey[] = [];
  while (counts.basic + counts.runner + counts.brute > 0) {
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
  let bossName = "-";

  for (const enemyType of plan) {
    const stage = bossStageFromSpawnKey(enemyType);
    if (stage) {
      bossName = BOSS_PROFILES[stage].name;
      break;
    }
  }

  return {
    count: plan.length,
    boss: bossName !== "-",
    bossName,
    basic: plan.filter((enemyType) => enemyType === "basic").length,
    runner: plan.filter((enemyType) => enemyType === "runner").length,
    brute: plan.filter((enemyType) => enemyType === "brute").length,
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
