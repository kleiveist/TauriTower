import { describe, expect, it } from "vitest";
import { createGameSession } from "./index";
import { TOWER_TYPES } from "./data/towers";
import type { GameSnapshot } from "./types";

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
  it("uses panzer tower cost 1000 for all purchase checks", () => {
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
});
