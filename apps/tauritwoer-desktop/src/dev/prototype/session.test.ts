import { describe, expect, it } from "vitest";
import { createGameSession } from "./index";
import { TOWER_TYPES } from "./data/towers";
import { createSandboxSlot } from "./domain/sandbox";
import type { GameSnapshot, SandboxConfig } from "./types";

function tickUntil(
  getSnapshot: () => GameSnapshot,
  tick: (dt: number) => void,
  predicate: (snapshot: GameSnapshot) => boolean,
  maxTicks = 800,
  dt = 10,
): GameSnapshot {
  let snapshot = getSnapshot();
  for (let i = 0; i < maxTicks; i += 1) {
    if (predicate(snapshot)) {
      return snapshot;
    }
    tick(dt);
    snapshot = getSnapshot();
  }

  throw new Error("Condition not reached in time");
}

describe("session flow", () => {
  it("uses panzer tower base cost 1000", () => {
    expect(TOWER_TYPES["Panzer-Tower"].cost).toBe(1000);
  });

  it("clears selected tower after successful placement", () => {
    const session = createGameSession({ seed: 41 });
    session.applyAction({ type: "chooseDifficulty", difficulty: "leicht" });
    session.applyAction({ type: "selectTower", tower: "Pistolman" });

    session.applyAction({ type: "placeTower", position: { x: 120, y: 260 } });

    const snapshot = session.getSnapshot();
    expect(snapshot.towers).toHaveLength(1);
    expect(snapshot.selectedTowerName).toBeNull();
  });

  it("keeps selected tower after failed placement", () => {
    const session = createGameSession({ seed: 42 });
    session.applyAction({ type: "chooseDifficulty", difficulty: "leicht" });
    session.applyAction({ type: "selectTower", tower: "Pistolman" });

    session.applyAction({ type: "placeTower", position: { x: 120, y: 180 } });

    const snapshot = session.getSnapshot();
    expect(snapshot.towers).toHaveLength(0);
    expect(snapshot.selectedTowerName).toBe("Pistolman");
  });

  it("uses sandbox slots for wave planning when mode is sandbox", () => {
    const session = createGameSession({ seed: 73 });
    const sandboxConfig: SandboxConfig = {
      slots: [
        {
          ...createSandboxSlot("slot-1"),
          enemyType: "runner",
          baseCount: 3,
          addEvery10Rounds: 0,
          multiplier: 1,
          startRound: 1,
          enabled: true,
        },
      ],
    };

    session.applyAction({
      type: "chooseDifficulty",
      difficulty: "leicht",
      mode: "sandbox",
      mapId: "canal",
      sandboxConfig,
    });
    session.applyAction({ type: "startWave" });

    const snapshot = session.getSnapshot();
    expect(snapshot.mode).toBe("sandbox");
    expect(snapshot.mapId).toBe("canal");
    expect(snapshot.totalWaveEnemies).toBe(3);
    expect(snapshot.wavePlan).toEqual(["runner", "runner", "runner"]);
  });

  it("spawns enemies at the selected map path", () => {
    const session = createGameSession({ seed: 74 });
    session.applyAction({
      type: "chooseDifficulty",
      difficulty: "leicht",
      mode: "classic",
      mapId: "canal",
    });
    session.applyAction({ type: "startWave" });
    session.tick(0.09);

    const snapshot = session.getSnapshot();
    expect(snapshot.enemies.length).toBeGreaterThan(0);
    expect(snapshot.enemies[0].pos.y).toBeCloseTo(300, 5);
  });

  it("progresses to the next level and grants wave completion bonus", () => {
    const session = createGameSession({ seed: 42 });
    session.applyAction({ type: "chooseDifficulty", difficulty: "leicht" });
    session.applyAction({ type: "startWave" });

    const snapshot = tickUntil(
      () => session.getSnapshot(),
      (dt) => session.tick(dt),
      (state) => state.level === 2 && !state.waveActive,
    );

    expect(snapshot.state).toBe("playing");
    expect(snapshot.level).toBe(2);
    expect(snapshot.money).toBe(272);
    expect(snapshot.lives).toBe(21);
  });

  it("reaches game over when enemies repeatedly leak", () => {
    const session = createGameSession({ seed: 17 });
    session.applyAction({ type: "chooseDifficulty", difficulty: "unmoeglich" });

    for (let wave = 0; wave < 6; wave += 1) {
      const startSnapshot = session.getSnapshot();
      if (startSnapshot.state !== "playing") {
        break;
      }

      session.applyAction({ type: "startWave" });
      tickUntil(
        () => session.getSnapshot(),
        (dt) => session.tick(dt),
        (state) =>
          state.state === "game_over" ||
          (state.waveActive === false && state.wavePlan.length === 0 && state.enemies.length === 0),
      );
    }

    const finalSnapshot = session.getSnapshot();
    expect(finalSnapshot.state).toBe("game_over");
    expect(finalSnapshot.lives).toBeLessThanOrEqual(0);
  });

  it("reaches victory when max level is completed", () => {
    const session = createGameSession({ seed: 99, maxLevelOverride: 1 });
    session.applyAction({ type: "chooseDifficulty", difficulty: "leicht" });
    session.applyAction({ type: "startWave" });

    const snapshot = tickUntil(
      () => session.getSnapshot(),
      (dt) => session.tick(dt),
      (state) => state.state === "victory" || state.state === "game_over",
    );

    expect(snapshot.state).toBe("victory");
    expect(snapshot.level).toBe(2);
  });

  it("provides a stable live snapshot while keeping cloned snapshots detached", () => {
    const session = createGameSession({ seed: 120 });
    session.applyAction({ type: "chooseDifficulty", difficulty: "leicht" });

    const liveBefore = session.getLiveSnapshot();
    const detached = session.getSnapshot();

    session.applyAction({ type: "startWave" });
    session.tick(0.09);

    const liveAfter = session.getLiveSnapshot();
    expect(liveAfter).toBe(liveBefore);
    expect(detached).not.toBe(liveAfter);

    detached.lives = -999;
    expect(session.getLiveSnapshot().lives).not.toBe(-999);
  });

  it("uses an internal spawn cursor without shrinking wavePlan during active waves", () => {
    const session = createGameSession({ seed: 121 });
    session.applyAction({ type: "chooseDifficulty", difficulty: "leicht" });
    session.applyAction({ type: "startWave" });

    const started = session.getSnapshot();
    const totalPlanned = started.wavePlan.length;
    expect(totalPlanned).toBeGreaterThan(0);

    session.tick(0.09);

    const running = session.getSnapshot();
    expect(running.spawnedThisWave).toBeGreaterThan(0);
    expect(running.wavePlan.length).toBe(totalPlanned);
  });

  it("resets dynamic tower prices on restart", () => {
    const session = createGameSession({ seed: 122 });
    session.applyAction({ type: "chooseDifficulty", difficulty: "leicht" });

    expect(session.getSnapshot().towerPrices.Pistolman).toBe(60);

    session.applyAction({ type: "selectTower", tower: "Pistolman" });
    session.applyAction({ type: "placeTower", position: { x: 120, y: 260 } });
    expect(session.getSnapshot().towerPrices.Pistolman).toBeGreaterThan(60);

    session.applyAction({ type: "restart" });

    const resetSnapshot = session.getSnapshot();
    expect(resetSnapshot.towerPrices.Pistolman).toBe(60);
    expect(resetSnapshot.towerPrices["Panzer-Tower"]).toBe(1000);
  });

  it("uses the exact displayed dynamic price for purchase checks and money deduction", () => {
    const session = createGameSession({ seed: 123 });
    session.applyAction({ type: "chooseDifficulty", difficulty: "leicht" });

    const beforeFirstBuy = session.getSnapshot();
    const firstDisplayedPrice = beforeFirstBuy.towerPrices.Pistolman;

    session.applyAction({ type: "selectTower", tower: "Pistolman" });
    session.applyAction({ type: "placeTower", position: { x: 120, y: 260 } });

    const afterFirstBuy = session.getSnapshot();
    expect(beforeFirstBuy.money - afterFirstBuy.money).toBe(firstDisplayedPrice);

    const secondDisplayedPrice = afterFirstBuy.towerPrices.Pistolman;
    expect(secondDisplayedPrice).toBeGreaterThan(firstDisplayedPrice);

    session.applyAction({ type: "selectTower", tower: "Pistolman" });
    session.applyAction({ type: "placeTower", position: { x: 120, y: 340 } });

    const afterSecondBuy = session.getSnapshot();
    expect(afterFirstBuy.money - afterSecondBuy.money).toBe(secondDisplayedPrice);
  });
});
