import type { DifficultyProfile, SpawnKey, WavePreview } from "../types";

interface WaveComposition {
  basic: number;
  runner: number;
  brute: number;
  shield: number;
  bossStage: number | null;
}

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
  const composition = computeWaveComposition(level, difficulty);
  const counts: Record<"basic" | "runner" | "brute" | "shield", number> = {
    basic: composition.basic,
    runner: composition.runner,
    brute: composition.brute,
    shield: composition.shield,
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

  if (composition.bossStage !== null) {
    plan.push(`boss_${composition.bossStage}` as SpawnKey);
  }

  return plan;
}

export function previewWaveInfo(level: number, difficulty: DifficultyProfile): WavePreview {
  const composition = computeWaveComposition(level, difficulty);
  const boss = composition.bossStage !== null;

  return {
    count: composition.basic + composition.runner + composition.brute + composition.shield + (boss ? 1 : 0),
    boss,
    bossStage: composition.bossStage,
    basic: composition.basic,
    runner: composition.runner,
    brute: composition.brute,
    shield: composition.shield,
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

function computeWaveComposition(level: number, difficulty: DifficultyProfile): WaveComposition {
  const regularCount = enemyCountForLevel(level, difficulty);
  let runner = 0;
  let brute = 0;
  let shield = 0;

  if (level >= 6) {
    const runnerRatio = Math.min(0.18 + level * 0.008, 0.36);
    runner = Math.max(1, Math.round(regularCount * runnerRatio));
  }
  if (level >= 12) {
    const bruteRatio = Math.min(0.1 + (level - 12) * 0.005, 0.24);
    brute = Math.max(1, Math.round(regularCount * bruteRatio));
  }
  if (level >= 18) {
    const shieldRatio = Math.min(0.06 + (level - 18) * 0.004, 0.18);
    shield = Math.max(1, Math.round(regularCount * shieldRatio));
  }

  const maxSpecial = regularCount - 1;
  let specials = runner + brute + shield;
  if (specials > maxSpecial) {
    let overflow = specials - maxSpecial;

    const reduce = (current: number): number => {
      const step = Math.min(current, overflow);
      overflow -= step;
      return current - step;
    };

    brute = reduce(brute);
    if (overflow > 0) {
      shield = reduce(shield);
    }
    if (overflow > 0) {
      runner = reduce(runner);
    }

    specials = runner + brute + shield;
    if (specials > maxSpecial) {
      runner = Math.max(0, runner - (specials - maxSpecial));
    }
  }

  return {
    basic: Math.max(1, regularCount - runner - brute - shield),
    runner,
    brute,
    shield,
    bossStage: level % 10 === 0 ? bossStageForLevel(level) : null,
  };
}
