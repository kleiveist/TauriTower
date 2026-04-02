import { describe, expect, it } from "vitest";
import { createGameSession } from "./index";
import { createSandboxSlot } from "./domain/sandbox";
import type { GameSession, Point, SandboxConfig } from "./types";

const PLACEMENT_POINTS: Point[] = [
  { x: 120, y: 260 },
  { x: 120, y: 340 },
  { x: 210, y: 340 },
  { x: 300, y: 340 },
  { x: 390, y: 340 },
  { x: 480, y: 340 },
  { x: 570, y: 340 },
  { x: 660, y: 340 },
  { x: 750, y: 340 },
  { x: 840, y: 340 },
  { x: 930, y: 340 },
  { x: 1020, y: 340 },
  { x: 1110, y: 340 },
];

function maybeRestartAndContinue(session: GameSession): void {
  const snapshot = session.getLiveSnapshot();
  if (snapshot.state === "game_over" || snapshot.state === "victory") {
    session.applyAction({ type: "restart" });
    session.applyAction({ type: "startWave" });
    return;
  }

  if (snapshot.state === "playing" && !snapshot.waveActive && snapshot.wavePlan.length === 0) {
    session.applyAction({ type: "startWave" });
  }
}

function tryPlaceTower(session: GameSession, point: Point): void {
  session.applyAction({ type: "selectTower", tower: "Pistolman" });
  session.applyAction({ type: "placeTower", position: point });
}

function assertFiniteSessionState(session: GameSession): void {
  const snapshot = session.getSnapshot();

  expect(Number.isFinite(snapshot.money)).toBe(true);
  expect(Number.isFinite(snapshot.lives)).toBe(true);
  expect(Number.isFinite(snapshot.level)).toBe(true);
  expect(Number.isFinite(snapshot.spawnTimer)).toBe(true);
  expect(Number.isFinite(snapshot.spawnInterval)).toBe(true);
  expect(snapshot.enemies.length).toBeLessThan(5000);
  expect(snapshot.bullets.length).toBeLessThan(14000);

  for (const enemy of snapshot.enemies) {
    expect(Number.isFinite(enemy.pos.x)).toBe(true);
    expect(Number.isFinite(enemy.pos.y)).toBe(true);
    expect(Number.isFinite(enemy.hp)).toBe(true);
    expect(Number.isFinite(enemy.maxHp)).toBe(true);
    expect(Number.isFinite(enemy.speed)).toBe(true);
    expect(Number.isFinite(enemy.armor)).toBe(true);
    expect(Number.isFinite(enemy.slowFactor)).toBe(true);
    expect(Number.isFinite(enemy.slowTimer)).toBe(true);
  }

  for (const bullet of snapshot.bullets) {
    expect(Number.isFinite(bullet.pos.x)).toBe(true);
    expect(Number.isFinite(bullet.pos.y)).toBe(true);
    expect(Number.isFinite(bullet.damage)).toBe(true);
    expect(Number.isFinite(bullet.speed)).toBe(true);
    expect(Number.isFinite(bullet.radius)).toBe(true);
  }
}

describe("long-run stability stress", () => {
  it("classic_longrun_stress remains stable without unbounded entity growth", () => {
    const session = createGameSession({ seed: 20260402 });
    session.applyAction({ type: "chooseDifficulty", difficulty: "schwer", mode: "classic", mapId: "meadow" });
    session.applyAction({ type: "startWave" });

    for (let tick = 1; tick <= 6000; tick += 1) {
      maybeRestartAndContinue(session);

      if (tick % 180 === 0) {
        const point = PLACEMENT_POINTS[Math.floor(tick / 180) % PLACEMENT_POINTS.length];
        if (point) {
          tryPlaceTower(session, point);
        }
      }

      session.tick(1 / 30);

      if (tick % 120 === 0) {
        assertFiniteSessionState(session);
      }
    }

    assertFiniteSessionState(session);
  });

  it("sandbox_longrun_stress remains stable under aggressive sandbox spawns", () => {
    const sandboxConfig: SandboxConfig = {
      slots: [
        {
          ...createSandboxSlot("slot-1"),
          enemyType: "basic",
          startRound: 1,
          baseCount: 20,
          addEvery10Rounds: 3,
          multiplier: 1.05,
          enabled: true,
        },
        {
          ...createSandboxSlot("slot-2"),
          enemyType: "runner",
          startRound: 4,
          baseCount: 8,
          addEvery10Rounds: 2,
          multiplier: 1.06,
          enabled: true,
        },
        {
          ...createSandboxSlot("slot-3"),
          enemyType: "brute",
          startRound: 10,
          baseCount: 5,
          addEvery10Rounds: 1,
          multiplier: 1.04,
          enabled: true,
        },
        {
          ...createSandboxSlot("slot-4"),
          enemyType: "shield",
          startRound: 14,
          baseCount: 4,
          addEvery10Rounds: 1,
          multiplier: 1.03,
          enabled: true,
        },
        {
          ...createSandboxSlot("slot-5"),
          enemyType: "boss",
          bossStage: 4,
          startRound: 18,
          baseCount: 1,
          addEvery10Rounds: 0,
          multiplier: 1,
          enabled: true,
        },
      ],
    };

    const session = createGameSession({ seed: 20260403 });
    session.applyAction({
      type: "chooseDifficulty",
      difficulty: "mittel",
      mode: "sandbox",
      mapId: "switchback",
      sandboxConfig,
    });
    session.applyAction({ type: "startWave" });

    for (let tick = 1; tick <= 6000; tick += 1) {
      maybeRestartAndContinue(session);

      if (tick % 200 === 0) {
        const point = PLACEMENT_POINTS[Math.floor(tick / 200) % PLACEMENT_POINTS.length];
        if (point) {
          tryPlaceTower(session, point);
        }
      }

      session.tick(1 / 30);

      if (tick % 120 === 0) {
        assertFiniteSessionState(session);
      }
    }

    assertFiniteSessionState(session);
  });
});
