import { describe, expect, it } from "vitest";
import { createGameSession } from "./index";
import type { GameSnapshot } from "./types";

function runScenario(seed: number): GameSnapshot {
  const session = createGameSession({ seed });
  session.applyAction({ type: "chooseDifficulty", difficulty: "mittel" });
  session.applyAction({ type: "selectTower", tower: "Pistolman" });
  session.applyAction({ type: "placeTower", position: { x: 120, y: 260 } });
  session.applyAction({ type: "startWave" });

  for (let i = 0; i < 140; i += 1) {
    session.tick(0.25);
  }

  return session.getSnapshot();
}

describe("seeded RNG determinism", () => {
  it("produces identical snapshots for identical seeds", () => {
    const snapshotA = runScenario(1337);
    const snapshotB = runScenario(1337);

    expect(snapshotA).toEqual(snapshotB);
  });

  it("produces different spawn stats for different seeds", () => {
    const a = createGameSession({ seed: 1 });
    const b = createGameSession({ seed: 2 });

    a.applyAction({ type: "chooseDifficulty", difficulty: "leicht" });
    b.applyAction({ type: "chooseDifficulty", difficulty: "leicht" });
    a.applyAction({ type: "startWave" });
    b.applyAction({ type: "startWave" });

    a.tick(0.1);
    b.tick(0.1);

    const enemiesA = a.getSnapshot().enemies;
    const enemiesB = b.getSnapshot().enemies;

    expect(enemiesA.length).toBeGreaterThan(0);
    expect(enemiesB.length).toBeGreaterThan(0);

    const firstA = enemiesA[0];
    const firstB = enemiesB[0];
    if (!firstA || !firstB) {
      throw new Error("Expected first spawned enemy in both sessions");
    }

    expect(firstA.hp).not.toBe(firstB.hp);
    expect(firstA.speed).not.toBe(firstB.speed);
  });
});
