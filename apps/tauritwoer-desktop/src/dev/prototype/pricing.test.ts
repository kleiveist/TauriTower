import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_COST_MULTIPLIER_START_ROUND,
  buildDisplayedTowerPriceMap,
  createInitialTowerPriceMap,
  getNextStoredTowerPriceAfterPurchase,
  getTowerPurchasePrice,
} from "./domain/pricing";

describe("dynamic tower pricing", () => {
  it("keeps base price before round 6 for regular towers", () => {
    const stored = createInitialTowerPriceMap();
    const price = getTowerPurchasePrice("Pistolman", DIFFICULTY_COST_MULTIPLIER_START_ROUND - 1, "schwer", stored);
    expect(price).toBe(60);
  });

  it("applies difficulty multiplier from round 6 for regular towers", () => {
    const stored = createInitialTowerPriceMap();
    const price = getTowerPurchasePrice("Pistolman", DIFFICULTY_COST_MULTIPLIER_START_ROUND, "mittel", stored);
    expect(price).toBe(72);
  });

  it("uses per-tower persistent growth after purchases", () => {
    const stored = createInitialTowerPriceMap();
    stored.Pistolman = getNextStoredTowerPriceAfterPurchase("Pistolman", stored);
    expect(stored.Pistolman).toBe(68);
    const nextDisplayed = getTowerPurchasePrice("Pistolman", 3, "leicht", stored);
    expect(nextDisplayed).toBe(68);
  });

  it("uses tank special rule without difficulty multiplier and doubles after each purchase", () => {
    const stored = createInitialTowerPriceMap();

    expect(getTowerPurchasePrice("Panzer-Tower", 20, "unmoeglich", stored)).toBe(1000);

    stored["Panzer-Tower"] = getNextStoredTowerPriceAfterPurchase("Panzer-Tower", stored);
    expect(stored["Panzer-Tower"]).toBe(2000);
    expect(getTowerPurchasePrice("Panzer-Tower", 20, "schwer", stored)).toBe(2000);

    stored["Panzer-Tower"] = getNextStoredTowerPriceAfterPurchase("Panzer-Tower", stored);
    expect(stored["Panzer-Tower"]).toBe(4000);
  });

  it("builds displayed price map from one centralized source", () => {
    const stored = createInitialTowerPriceMap();
    stored.Pistolman = 68;
    stored.Scharfschuetze = 150;
    const displayed = buildDisplayedTowerPriceMap(8, "leicht", stored);

    expect(displayed.Pistolman).toBe(75);
    expect(displayed.Scharfschuetze).toBe(165);
    expect(displayed["Panzer-Tower"]).toBe(1000);
  });
});
