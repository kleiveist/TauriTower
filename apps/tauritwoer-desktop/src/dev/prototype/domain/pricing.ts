import { TOWER_ORDER, TOWER_TYPES } from "../data/towers";
import type { DifficultyName, TowerName, TowerPriceMap } from "../types";

export const DIFFICULTY_COST_MULTIPLIERS: Record<DifficultyName, number> = {
  leicht: 1.1,
  mittel: 1.2,
  schwer: 1.3,
  unmoeglich: 1.4,
};

export const DIFFICULTY_COST_MULTIPLIER_START_ROUND = 6;

const NORMAL_TOWER_REPURCHASE_GROWTH = 1.12;
const PANZER_TOWER_NAME: TowerName = "Panzer-Tower";

export function createInitialTowerPriceMap(): TowerPriceMap {
  const prices = {} as TowerPriceMap;
  for (const tower of TOWER_ORDER) {
    prices[tower] = TOWER_TYPES[tower].cost;
  }
  return prices;
}

export function getTowerPurchasePrice(
  tower: TowerName,
  round: number,
  difficulty: DifficultyName,
  storedPrices: TowerPriceMap,
): number {
  // Pricing order for regular towers:
  // 1) read stored per-tower base price
  // 2) apply difficulty multiplier only from round 6+
  // 3) round up to an integer
  const stored = normalizePrice(storedPrices[tower] ?? TOWER_TYPES[tower].cost);
  if (tower === PANZER_TOWER_NAME) {
    // Tank/Panzer is explicitly excluded from difficulty-based multipliers.
    return stored;
  }

  if (round < DIFFICULTY_COST_MULTIPLIER_START_ROUND) {
    return stored;
  }

  return normalizePrice(stored * DIFFICULTY_COST_MULTIPLIERS[difficulty]);
}

export function getNextStoredTowerPriceAfterPurchase(
  tower: TowerName,
  storedPrices: TowerPriceMap,
): number {
  const currentStored = normalizePrice(storedPrices[tower] ?? TOWER_TYPES[tower].cost);
  if (tower === PANZER_TOWER_NAME) {
    // Panzer follows its own progression and doubles after each successful placement.
    return normalizePrice(currentStored * 2);
  }

  return normalizePrice(currentStored * NORMAL_TOWER_REPURCHASE_GROWTH);
}

export function buildDisplayedTowerPriceMap(
  round: number,
  difficulty: DifficultyName,
  storedPrices: TowerPriceMap,
): TowerPriceMap {
  const prices = {} as TowerPriceMap;
  for (const tower of TOWER_ORDER) {
    prices[tower] = getTowerPurchasePrice(tower, round, difficulty, storedPrices);
  }
  return prices;
}

function normalizePrice(value: number): number {
  // Economy prices always round up to whole numbers to keep UI and currency checks consistent.
  return Math.max(1, Math.ceil(value));
}
