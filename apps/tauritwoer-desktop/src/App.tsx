import { useEffect, useMemo, useState } from "react";
import { DIFFICULTY_ORDER } from "./dev/prototype/data/difficulties";
import { TOWER_ORDER } from "./dev/prototype/data/towers";
import { createGameSession } from "./dev/prototype";
import type { DifficultyName, GameAction, GameSnapshot, TowerName } from "./dev/prototype";
import "./App.css";

const DEFAULT_TOWER_POSITION = { x: 120, y: 260 };

function App() {
  const session = useMemo(() => createGameSession({ seed: 20260326 }), []);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => session.getSnapshot());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      session.tick(1 / 30);
      setSnapshot(session.getSnapshot());
    }, 33);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [session]);

  function applyAction(action: GameAction): void {
    session.applyAction(action);
    setSnapshot(session.getSnapshot());
  }

  function chooseDifficulty(difficulty: DifficultyName): void {
    applyAction({ type: "chooseDifficulty", difficulty });
  }

  function selectTower(tower: TowerName): void {
    applyAction({ type: "selectTower", tower });
  }

  return (
    <main className="prototype-shell">
      <h1>TauriTwoer Prototype Engine</h1>
      <p>
        Headless simulation bridge for gameplay port validation. Rendering and final UI are intentionally out of scope.
      </p>

      <section className="panel">
        <h2>Session</h2>
        <div className="button-row">
          {DIFFICULTY_ORDER.map((difficulty) => (
            <button key={difficulty} onClick={() => chooseDifficulty(difficulty)} type="button">
              {difficulty}
            </button>
          ))}
        </div>

        <div className="button-row">
          <button onClick={() => applyAction({ type: "startWave" })} type="button">
            Start Wave
          </button>
          <button onClick={() => applyAction({ type: "restart" })} type="button">
            Restart
          </button>
          <button onClick={() => applyAction({ type: "returnToMenu" })} type="button">
            Return Menu
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Towers</h2>
        <div className="button-row">
          {TOWER_ORDER.map((tower) => (
            <button key={tower} onClick={() => selectTower(tower)} type="button">
              {tower}
            </button>
          ))}
          <button
            onClick={() => applyAction({ type: "clearSelection" })}
            type="button"
          >
            Clear Selection
          </button>
          <button
            onClick={() =>
              applyAction({
                type: "placeTower",
                position: DEFAULT_TOWER_POSITION,
              })
            }
            type="button"
          >
            Place at (120,260)
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Snapshot</h2>
        <dl className="stats-grid">
          <div>
            <dt>State</dt>
            <dd>{snapshot.state}</dd>
          </div>
          <div>
            <dt>Difficulty</dt>
            <dd>{snapshot.difficultyName}</dd>
          </div>
          <div>
            <dt>Level</dt>
            <dd>
              {snapshot.level}/{snapshot.maxLevel}
            </dd>
          </div>
          <div>
            <dt>Money</dt>
            <dd>{snapshot.money}</dd>
          </div>
          <div>
            <dt>Lives</dt>
            <dd>{snapshot.lives}</dd>
          </div>
          <div>
            <dt>Selected Tower</dt>
            <dd>{snapshot.selectedTowerName ?? "none"}</dd>
          </div>
          <div>
            <dt>Wave Active</dt>
            <dd>{snapshot.waveActive ? "yes" : "no"}</dd>
          </div>
          <div>
            <dt>Wave Remaining</dt>
            <dd>{snapshot.wavePlan.length}</dd>
          </div>
          <div>
            <dt>Entities</dt>
            <dd>
              T:{snapshot.towers.length} E:{snapshot.enemies.length} B:{snapshot.bullets.length}
            </dd>
          </div>
          <div>
            <dt>Next Wave</dt>
            <dd>
              {snapshot.nextWavePreview.count} (B:{snapshot.nextWavePreview.basic} R:{snapshot.nextWavePreview.runner} Br:{snapshot.nextWavePreview.brute} Boss:{snapshot.nextWavePreview.bossName})
            </dd>
          </div>
        </dl>

        <p className="message">Message: {snapshot.message || "-"}</p>
      </section>
    </main>
  );
}

export default App;
