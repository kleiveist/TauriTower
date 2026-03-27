import { useEffect, useMemo, useRef, useState } from "react";
import gameIconUrl from "../../../assets/game-icon.png";
import { BOSS_PROFILES } from "../data/bosses";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../data/difficulties";
import { DEFAULT_MAP_ID, MAP_ORDER, getMapDefinition } from "../data/maps";
import {
  cloneSandboxConfig,
  createDefaultSandboxConfig,
  createSandboxSlot,
  createSandboxSlotId,
  normalizeSandboxSlot,
  previewSandboxWaveInfo,
  sandboxSlotSpawnCount,
  validateSandboxConfig,
  validateSandboxSlot,
} from "../domain/sandbox";
import type {
  DifficultyName,
  GameMode,
  MapId,
  SandboxConfig,
  SandboxEnemyType,
  SandboxSlot,
} from "../types";
import { createPrototypeController } from "./controller";
import { getResponsiveMode } from "./ui";

type MenuStage = "start" | "mode" | "difficulty" | "map" | "sandbox";

const ENEMY_LABELS: Record<SandboxEnemyType, string> = {
  basic: "Basic",
  runner: "Runner",
  brute: "Brute",
  shield: "Shield",
  boss: "Boss",
};

const ENEMY_GLYPHS: Record<SandboxEnemyType, string> = {
  basic: "●",
  runner: "▲",
  brute: "■",
  shield: "⬢",
  boss: "★",
};

function difficultyLabel(difficulty: DifficultyName): string {
  if (difficulty === "unmoeglich") {
    return "Unmoeglich";
  }
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

function createNextSlotId(slots: SandboxSlot[]): string {
  let max = 0;
  for (const slot of slots) {
    const match = /^slot-(\d+)$/.exec(slot.id);
    if (!match) {
      continue;
    }
    const numericId = Number.parseInt(match[1], 10);
    if (Number.isFinite(numericId) && numericId > max) {
      max = numericId;
    }
  }

  return createSandboxSlotId(max + 1);
}

function slotPreviewText(slot: SandboxSlot): string {
  const first = sandboxSlotSpawnCount(slot, slot.startRound);
  const round10 = sandboxSlotSpawnCount(slot, Math.max(10, slot.startRound));
  const round20 = sandboxSlotSpawnCount(slot, Math.max(20, slot.startRound));

  const typeText =
    slot.enemyType === "boss"
      ? `Boss ${slot.bossStage} (${BOSS_PROFILES[slot.bossStage]?.name ?? "Unknown"})`
      : ENEMY_LABELS[slot.enemyType];

  return `From R${slot.startRound}: ${first}, R10: ${round10}, R20: ${round20} | x${slot.multiplier.toFixed(2)} +${slot.addEvery10Rounds}/10r ${typeText}`;
}

export function PrototypeCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<ReturnType<typeof createPrototypeController> | null>(null);

  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window === "undefined" ? 1600 : window.innerWidth,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [menuStage, setMenuStage] = useState<MenuStage>("start");

  const [selectedMode, setSelectedMode] = useState<GameMode>("classic");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyName>("leicht");
  const [selectedMap, setSelectedMap] = useState<MapId>(DEFAULT_MAP_ID);

  const [sandboxConfig, setSandboxConfig] = useState<SandboxConfig>(() => createDefaultSandboxConfig());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const isCompact = getResponsiveMode(viewportWidth) === "compact";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const controller = createPrototypeController({
      canvas,
      seed: 20260327,
      iconSrc: gameIconUrl,
      onReturnToMenu: () => {
        setIsPlaying(false);
        setMenuStage("start");
      },
    });

    controllerRef.current = controller;

    const resizeCanvas = (): void => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const pixelWidth = Math.max(1, Math.floor(rect.width * dpr));
      const pixelHeight = Math.max(1, Math.floor(rect.height * dpr));
      controller.resize(pixelWidth, pixelHeight, window.innerWidth);
      setViewportWidth(window.innerWidth);
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    controller.start();
    controller.setInputEnabled(false);
    resizeObserver.observe(canvas);
    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      resizeObserver.disconnect();
      controller.stop();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setInputEnabled(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    if (sandboxConfig.slots.length === 0) {
      setSelectedSlotId(null);
      return;
    }

    if (selectedSlotId && sandboxConfig.slots.some((slot) => slot.id === selectedSlotId)) {
      return;
    }

    setSelectedSlotId(sandboxConfig.slots[0].id);
  }, [sandboxConfig, selectedSlotId]);

  const slotValidationById = useMemo(() => {
    const result = new Map<string, ReturnType<typeof validateSandboxSlot>>();
    for (const slot of sandboxConfig.slots) {
      result.set(slot.id, validateSandboxSlot(slot));
    }
    return result;
  }, [sandboxConfig]);

  const sandboxValidation = useMemo(() => validateSandboxConfig(sandboxConfig), [sandboxConfig]);

  const normalizedSandboxConfig = useMemo<SandboxConfig>(
    () => ({
      slots: sandboxConfig.slots.map((slot) => normalizeSandboxSlot(slot)),
    }),
    [sandboxConfig],
  );

  const selectedSlot = useMemo(
    () => sandboxConfig.slots.find((slot) => slot.id === selectedSlotId) ?? null,
    [sandboxConfig, selectedSlotId],
  );

  const previewRounds = useMemo(
    () => [1, 10, 20, 30].map((round) => ({ round, info: previewSandboxWaveInfo(round, sandboxConfig) })),
    [sandboxConfig],
  );

  const startGame = (): void => {
    const controller = controllerRef.current;
    if (!controller) {
      return;
    }

    controller.startConfiguredGame({
      difficulty: selectedDifficulty,
      mode: selectedMode,
      mapId: selectedMap,
      sandboxConfig: cloneSandboxConfig(normalizedSandboxConfig),
    });

    setIsPlaying(true);
  };

  const updateSelectedSlot = (patch: Partial<SandboxSlot>): void => {
    if (!selectedSlot) {
      return;
    }

    setSandboxConfig((current) => ({
      slots: current.slots.map((slot) => {
        if (slot.id !== selectedSlot.id) {
          return slot;
        }
        return normalizeSandboxSlot({ ...slot, ...patch });
      }),
    }));
  };

  const addSlot = (): void => {
    const id = createNextSlotId(sandboxConfig.slots);
    const newSlot = createSandboxSlot(id);

    setSandboxConfig((current) => ({
      slots: [...current.slots, newSlot],
    }));
    setSelectedSlotId(newSlot.id);
  };

  const removeSelectedSlot = (): void => {
    if (!selectedSlot) {
      return;
    }

    const remaining = sandboxConfig.slots.filter((slot) => slot.id !== selectedSlot.id);
    setSandboxConfig({ slots: remaining });
    setSelectedSlotId(remaining[0]?.id ?? null);
  };

  const renderStart = (): JSX.Element => (
    <div className="prototype-overlay-card">
      <h1>TauriTwoer Defense</h1>
      <p>Hybrid Canvas + React workflow with classic waves and editable sandbox agent-box slots.</p>
      <button className="prototype-btn prototype-btn--primary" onClick={() => setMenuStage("mode")}>Start</button>
    </div>
  );

  const renderModeSelect = (): JSX.Element => (
    <div className="prototype-overlay-card">
      <h2>Select Mode</h2>
      <div className="prototype-choice-grid">
        <button
          className={`prototype-choice ${selectedMode === "classic" ? "is-selected" : ""}`}
          onClick={() => setSelectedMode("classic")}
        >
          <strong>Classic</strong>
          <span>Original wave planner with automatic boss levels every 10 rounds.</span>
        </button>
        <button
          className={`prototype-choice ${selectedMode === "sandbox" ? "is-selected" : ""}`}
          onClick={() => setSelectedMode("sandbox")}
        >
          <strong>Sandbox / Agent Box</strong>
          <span>Editable slots define exact spawns, scaling and optional explicit boss entries.</span>
        </button>
      </div>
      <div className="prototype-overlay-actions">
        <button className="prototype-btn" onClick={() => setMenuStage("start")}>Back</button>
        <button className="prototype-btn prototype-btn--primary" onClick={() => setMenuStage("difficulty")}>Continue</button>
      </div>
    </div>
  );

  const renderDifficulty = (): JSX.Element => (
    <div className="prototype-overlay-card">
      <h2>Select Difficulty</h2>
      <div className="prototype-list-grid">
        {DIFFICULTY_ORDER.map((difficulty) => (
          <button
            key={difficulty}
            className={`prototype-list-item ${selectedDifficulty === difficulty ? "is-selected" : ""}`}
            onClick={() => setSelectedDifficulty(difficulty)}
          >
            <strong>{difficultyLabel(difficulty)}</strong>
            <span>Spawn multiplier x{DIFFICULTIES[difficulty].countMult.toFixed(1)}</span>
          </button>
        ))}
      </div>
      <div className="prototype-overlay-actions">
        <button className="prototype-btn" onClick={() => setMenuStage("mode")}>Back</button>
        <button className="prototype-btn prototype-btn--primary" onClick={() => setMenuStage("map")}>Continue</button>
      </div>
    </div>
  );

  const renderMapSelect = (): JSX.Element => (
    <div className="prototype-overlay-card">
      <h2>Select Map</h2>
      <div className="prototype-choice-grid">
        {MAP_ORDER.map((mapId) => {
          const map = getMapDefinition(mapId);
          return (
            <button
              key={mapId}
              className={`prototype-choice ${selectedMap === mapId ? "is-selected" : ""}`}
              style={{ borderColor: `rgb(${map.accent[0]}, ${map.accent[1]}, ${map.accent[2]})` }}
              onClick={() => setSelectedMap(mapId)}
            >
              <strong>{map.name}</strong>
              <span>{map.description}</span>
            </button>
          );
        })}
      </div>
      <div className="prototype-overlay-actions">
        <button className="prototype-btn" onClick={() => setMenuStage("difficulty")}>Back</button>
        {selectedMode === "sandbox" ? (
          <button className="prototype-btn prototype-btn--primary" onClick={() => setMenuStage("sandbox")}>Continue</button>
        ) : (
          <button className="prototype-btn prototype-btn--primary" onClick={startGame}>Start Classic Run</button>
        )}
      </div>
    </div>
  );

  const renderSandbox = (): JSX.Element => {
    const selectedSlotValidation = selectedSlot ? slotValidationById.get(selectedSlot.id) : null;

    return (
      <div className="prototype-overlay-card prototype-overlay-card--wide">
        <h2>Sandbox Slot Editor</h2>
        <p className="prototype-muted">
          Spawn order is blockwise by slot order. Formula per slot: start gate, base plus additive 10-round bands, linear multiplier scaling, rounding, and non-negative clamp.
        </p>

        <div className="sandbox-layout">
          <div className="sandbox-slots">
            {sandboxConfig.slots.map((slot) => {
              const validation = slotValidationById.get(slot.id);
              const invalid = validation ? !validation.valid : false;
              const empty = !slot.enabled || (slot.baseCount === 0 && slot.addEvery10Rounds === 0);
              const selected = slot.id === selectedSlotId;

              return (
                <button
                  key={slot.id}
                  className={`sandbox-slot-card ${selected ? "is-selected" : ""} ${invalid ? "is-invalid" : ""} ${empty ? "is-empty" : "is-configured"}`}
                  onClick={() => setSelectedSlotId(slot.id)}
                >
                  <div className="sandbox-slot-top">
                    <span className={`enemy-chip enemy-chip--${slot.enemyType}`}>{ENEMY_GLYPHS[slot.enemyType]}</span>
                    <strong>{slot.id}</strong>
                  </div>
                  <div className="sandbox-slot-body">{slotPreviewText(slot)}</div>
                </button>
              );
            })}
            <button className="prototype-btn prototype-btn--add" onClick={addSlot}>+ Add Slot</button>
          </div>

          <div className="sandbox-editor-panel">
            {selectedSlot ? (
              <>
                <div className="sandbox-editor-grid">
                  <label>
                    Enemy
                    <select
                      value={selectedSlot.enemyType}
                      onChange={(event) => updateSelectedSlot({ enemyType: event.target.value as SandboxEnemyType })}
                    >
                      {Object.entries(ENEMY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedSlot.enemyType === "boss" ? (
                    <label>
                      Boss Profile
                      <select
                        value={selectedSlot.bossStage}
                        onChange={(event) => updateSelectedSlot({ bossStage: Number.parseInt(event.target.value, 10) || 1 })}
                      >
                        {Object.entries(BOSS_PROFILES).map(([stageText, profile]) => (
                          <option key={stageText} value={stageText}>
                            Stage {stageText}: {profile.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <label>
                    Start Round
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={selectedSlot.startRound}
                      onChange={(event) => updateSelectedSlot({ startRound: Number.parseInt(event.target.value, 10) || 1 })}
                    />
                  </label>

                  <label>
                    Base Count
                    <input
                      type="number"
                      min={0}
                      max={250}
                      value={selectedSlot.baseCount}
                      onChange={(event) => updateSelectedSlot({ baseCount: Number.parseInt(event.target.value, 10) || 0 })}
                    />
                  </label>

                  <label>
                    Multiplier
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.05}
                      value={selectedSlot.multiplier}
                      onChange={(event) => updateSelectedSlot({ multiplier: Number.parseFloat(event.target.value) || 0 })}
                    />
                  </label>

                  <label>
                    Add Every 10 Rounds
                    <input
                      type="number"
                      min={0}
                      max={250}
                      value={selectedSlot.addEvery10Rounds}
                      onChange={(event) => updateSelectedSlot({ addEvery10Rounds: Number.parseInt(event.target.value, 10) || 0 })}
                    />
                  </label>
                </div>

                <label className="sandbox-enabled-toggle">
                  <input
                    type="checkbox"
                    checked={selectedSlot.enabled}
                    onChange={(event) => updateSelectedSlot({ enabled: event.target.checked })}
                  />
                  Slot enabled
                </label>

                <p className="sandbox-preview-line">{slotPreviewText(selectedSlot)}</p>

                {selectedSlotValidation && !selectedSlotValidation.valid ? (
                  <ul className="prototype-errors">
                    {selectedSlotValidation.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                ) : null}

                <button className="prototype-btn prototype-btn--danger" onClick={removeSelectedSlot}>
                  Remove Selected Slot
                </button>
              </>
            ) : (
              <p className="prototype-muted">Add a slot to configure sandbox spawning.</p>
            )}
          </div>
        </div>

        <div className="sandbox-preview-grid">
          {previewRounds.map(({ round, info }) => (
            <div className="sandbox-round-preview" key={round}>
              <strong>Round {round}</strong>
              <span>
                Total {info.count} | B {info.basic} | R {info.runner} | Br {info.brute} | Sh {info.shield} | Boss {info.bossName}
              </span>
            </div>
          ))}
        </div>

        {!sandboxValidation.valid ? (
          <ul className="prototype-errors">
            {sandboxValidation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        <div className="prototype-overlay-actions">
          <button className="prototype-btn" onClick={() => setMenuStage("map")}>Back</button>
          <button
            className="prototype-btn prototype-btn--primary"
            onClick={startGame}
            disabled={!sandboxValidation.valid}
          >
            Start Sandbox Run
          </button>
        </div>
      </div>
    );
  };

  const overlayContent = (): JSX.Element => {
    if (menuStage === "start") {
      return renderStart();
    }
    if (menuStage === "mode") {
      return renderModeSelect();
    }
    if (menuStage === "difficulty") {
      return renderDifficulty();
    }
    if (menuStage === "map") {
      return renderMapSelect();
    }
    return renderSandbox();
  };

  return (
    <section
      className={`prototype-app-shell ${isCompact ? "prototype-app-shell--compact" : "prototype-app-shell--desktop"}`}
      aria-label="TauriTwoer tower defense prototype"
    >
      <canvas className={`prototype-canvas ${isPlaying ? "" : "prototype-canvas--inactive"}`} ref={canvasRef} />
      {!isPlaying ? <div className="prototype-overlay">{overlayContent()}</div> : null}
    </section>
  );
}
