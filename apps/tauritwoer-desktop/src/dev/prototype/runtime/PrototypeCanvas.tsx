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
import {
  DEFAULT_DESIGN_MODE,
  DEFAULT_UI_LANGUAGE,
  UI_PREFERENCE_KEYS,
  type DesignMode,
  getTranslations,
  isDesignMode,
  isUiLanguage,
  type PrototypeTranslations,
  type UiLanguage,
} from "./i18n";
import { getResponsiveMode } from "./ui";

type MenuStage = "start" | "mode" | "difficulty" | "map" | "sandbox";

const ENEMY_GLYPHS: Record<SandboxEnemyType, string> = {
  basic: "●",
  runner: "▲",
  brute: "■",
  shield: "⬢",
  boss: "★",
};

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

function slotPreviewText(slot: SandboxSlot, text: PrototypeTranslations): string {
  const first = sandboxSlotSpawnCount(slot, slot.startRound);
  const round10 = sandboxSlotSpawnCount(slot, Math.max(10, slot.startRound));
  const round20 = sandboxSlotSpawnCount(slot, Math.max(20, slot.startRound));

  const typeText =
    slot.enemyType === "boss"
      ? `${text.enemyLabels.boss} ${slot.bossStage} (${BOSS_PROFILES[slot.bossStage]?.name ?? text.preview.bossUnknown})`
      : text.enemyLabels[slot.enemyType];

  return `R${slot.startRound}: ${first}, R10: ${round10}, R20: ${round20} | x${slot.multiplier.toFixed(2)} +${slot.addEvery10Rounds}/10r ${typeText}`;
}

function readStoredLanguage(): UiLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_UI_LANGUAGE;
  }

  try {
    const stored = window.localStorage.getItem(UI_PREFERENCE_KEYS.language);
    return isUiLanguage(stored) ? stored : DEFAULT_UI_LANGUAGE;
  } catch {
    return DEFAULT_UI_LANGUAGE;
  }
}

function readStoredDesignMode(): DesignMode {
  if (typeof window === "undefined") {
    return DEFAULT_DESIGN_MODE;
  }

  try {
    const stored = window.localStorage.getItem(UI_PREFERENCE_KEYS.designMode);
    return isDesignMode(stored) ? stored : DEFAULT_DESIGN_MODE;
  } catch {
    return DEFAULT_DESIGN_MODE;
  }
}

export function PrototypeCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<ReturnType<typeof createPrototypeController> | null>(null);
  const settingsContainerRef = useRef<HTMLDivElement | null>(null);

  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window === "undefined" ? 1600 : window.innerWidth,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [menuStage, setMenuStage] = useState<MenuStage>("start");

  const [uiLanguage, setUiLanguage] = useState<UiLanguage>(readStoredLanguage);
  const [designMode, setDesignMode] = useState<DesignMode>(readStoredDesignMode);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [selectedMode, setSelectedMode] = useState<GameMode>("classic");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyName>("leicht");
  const [selectedMap, setSelectedMap] = useState<MapId>(DEFAULT_MAP_ID);

  const [sandboxConfig, setSandboxConfig] = useState<SandboxConfig>(() => createDefaultSandboxConfig());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const isCompact = getResponsiveMode(viewportWidth) === "compact";
  const text = useMemo(() => getTranslations(uiLanguage), [uiLanguage]);

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

  useEffect(() => {
    setSettingsOpen(false);
  }, [isPlaying, menuStage]);

  useEffect(() => {
    try {
      window.localStorage.setItem(UI_PREFERENCE_KEYS.language, uiLanguage);
    } catch {
      // Ignore storage write errors in restricted environments.
    }
  }, [uiLanguage]);

  useEffect(() => {
    try {
      window.localStorage.setItem(UI_PREFERENCE_KEYS.designMode, designMode);
    } catch {
      // Ignore storage write errors in restricted environments.
    }
  }, [designMode]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (settingsContainerRef.current?.contains(target)) {
        return;
      }
      setSettingsOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

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

  const renderSettings = (): JSX.Element => (
    <div className="prototype-card-settings" ref={settingsContainerRef}>
      <button
        className={`prototype-settings-btn ${settingsOpen ? "is-open" : ""}`}
        type="button"
        aria-label={text.settings.title}
        title={text.settings.title}
        aria-expanded={settingsOpen}
        onClick={() => setSettingsOpen((open) => !open)}
      >
        ⚙
      </button>
      {settingsOpen ? (
        <div className="prototype-settings-popover" role="dialog" aria-label={text.settings.title}>
          <div className="prototype-settings-title">{text.settings.title}</div>

          <div className="prototype-settings-section">
            <div className="prototype-settings-label">{text.settings.language}</div>
            <div className="prototype-settings-options">
              {(Object.keys(text.settings.languageOptionLabels) as UiLanguage[]).map((language) => (
                <button
                  key={language}
                  className={`prototype-settings-option ${uiLanguage === language ? "is-selected" : ""}`}
                  type="button"
                  onClick={() => setUiLanguage(language)}
                >
                  {text.settings.languageOptionLabels[language]}
                </button>
              ))}
            </div>
          </div>

          <div className="prototype-settings-section">
            <div className="prototype-settings-label">{text.settings.design}</div>
            <div className="prototype-settings-options">
              {(Object.keys(text.settings.designOptionLabels) as DesignMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`prototype-settings-option ${designMode === mode ? "is-selected" : ""}`}
                  type="button"
                  onClick={() => setDesignMode(mode)}
                >
                  {text.settings.designOptionLabels[mode]}
                </button>
              ))}
            </div>
          </div>

          <button className="prototype-btn prototype-btn--settings-close" type="button" onClick={() => setSettingsOpen(false)}>
            {text.actions.close}
          </button>
        </div>
      ) : null}
    </div>
  );

  const renderOverlayCard = (content: JSX.Element, wide = false): JSX.Element => (
    <div className={`prototype-overlay-card ${wide ? "prototype-overlay-card--wide" : ""}`}>
      {renderSettings()}
      {content}
    </div>
  );

  const renderStart = (): JSX.Element =>
    renderOverlayCard(
      <>
        <h1>{text.start.title}</h1>
        <p>{text.start.description}</p>
        <button className="prototype-btn prototype-btn--primary" onClick={() => setMenuStage("mode")}>
          {text.actions.start}
        </button>
      </>,
    );

  const renderModeSelect = (): JSX.Element =>
    renderOverlayCard(
      <>
        <h2>{text.mode.title}</h2>
        <div className="prototype-choice-grid">
          <button
            className={`prototype-choice ${selectedMode === "classic" ? "is-selected" : ""}`}
            onClick={() => setSelectedMode("classic")}
          >
            <strong>{text.mode.classicTitle}</strong>
            <span>{text.mode.classicDescription}</span>
          </button>
          <button
            className={`prototype-choice ${selectedMode === "sandbox" ? "is-selected" : ""}`}
            onClick={() => setSelectedMode("sandbox")}
          >
            <strong>{text.mode.sandboxTitle}</strong>
            <span>{text.mode.sandboxDescription}</span>
          </button>
        </div>
        <div className="prototype-overlay-actions">
          <button className="prototype-btn" onClick={() => setMenuStage("start")}>{text.actions.back}</button>
          <button className="prototype-btn prototype-btn--primary" onClick={() => setMenuStage("difficulty")}>{text.actions.continue}</button>
        </div>
      </>,
    );

  const renderDifficulty = (): JSX.Element =>
    renderOverlayCard(
      <>
        <h2>{text.difficulty.title}</h2>
        <div className="prototype-list-grid">
          {DIFFICULTY_ORDER.map((difficulty) => (
            <button
              key={difficulty}
              className={`prototype-list-item ${selectedDifficulty === difficulty ? "is-selected" : ""}`}
              onClick={() => setSelectedDifficulty(difficulty)}
            >
              <strong>{text.difficulty.labels[difficulty]}</strong>
              <span>{text.difficulty.multiplierLabel} x{DIFFICULTIES[difficulty].countMult.toFixed(1)}</span>
            </button>
          ))}
        </div>
        <div className="prototype-overlay-actions">
          <button className="prototype-btn" onClick={() => setMenuStage("mode")}>{text.actions.back}</button>
          <button className="prototype-btn prototype-btn--primary" onClick={() => setMenuStage("map")}>{text.actions.continue}</button>
        </div>
      </>,
    );

  const renderMapSelect = (): JSX.Element =>
    renderOverlayCard(
      <>
        <h2>{text.map.title}</h2>
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
          <button className="prototype-btn" onClick={() => setMenuStage("difficulty")}>{text.actions.back}</button>
          {selectedMode === "sandbox" ? (
            <button className="prototype-btn prototype-btn--primary" onClick={() => setMenuStage("sandbox")}>{text.actions.continue}</button>
          ) : (
            <button className="prototype-btn prototype-btn--primary" onClick={startGame}>{text.map.startClassic}</button>
          )}
        </div>
      </>,
    );

  const renderSandbox = (): JSX.Element => {
    const selectedSlotValidation = selectedSlot ? slotValidationById.get(selectedSlot.id) : null;

    return renderOverlayCard(
      <>
        <h2>{text.sandbox.title}</h2>
        <p className="prototype-muted">{text.sandbox.description}</p>

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
                  <div className="sandbox-slot-body">{slotPreviewText(slot, text)}</div>
                </button>
              );
            })}
            <button className="prototype-btn prototype-btn--add" onClick={addSlot}>{text.sandbox.addSlot}</button>
          </div>

          <div className="sandbox-editor-panel">
            {selectedSlot ? (
              <>
                <div className="sandbox-editor-grid">
                  <label>
                    {text.sandbox.fields.enemy}
                    <select
                      value={selectedSlot.enemyType}
                      onChange={(event) => updateSelectedSlot({ enemyType: event.target.value as SandboxEnemyType })}
                    >
                      {Object.entries(text.enemyLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedSlot.enemyType === "boss" ? (
                    <label>
                      {text.sandbox.fields.bossProfile}
                      <select
                        value={selectedSlot.bossStage}
                        onChange={(event) => updateSelectedSlot({ bossStage: Number.parseInt(event.target.value, 10) || 1 })}
                      >
                        {Object.entries(BOSS_PROFILES).map(([stageText, profile]) => (
                          <option key={stageText} value={stageText}>
                            {text.sandbox.fields.stage} {stageText}: {profile.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <label>
                    {text.sandbox.fields.startRound}
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={selectedSlot.startRound}
                      onChange={(event) => updateSelectedSlot({ startRound: Number.parseInt(event.target.value, 10) || 1 })}
                    />
                  </label>

                  <label>
                    {text.sandbox.fields.baseCount}
                    <input
                      type="number"
                      min={0}
                      max={250}
                      value={selectedSlot.baseCount}
                      onChange={(event) => updateSelectedSlot({ baseCount: Number.parseInt(event.target.value, 10) || 0 })}
                    />
                  </label>

                  <label>
                    {text.sandbox.fields.multiplier}
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
                    {text.sandbox.fields.addEvery10Rounds}
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
                  {text.sandbox.slotEnabled}
                </label>

                <p className="sandbox-preview-line">{slotPreviewText(selectedSlot, text)}</p>

                {selectedSlotValidation && !selectedSlotValidation.valid ? (
                  <ul className="prototype-errors">
                    {selectedSlotValidation.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                ) : null}

                <button className="prototype-btn prototype-btn--danger" onClick={removeSelectedSlot}>
                  {text.sandbox.removeSelectedSlot}
                </button>
              </>
            ) : (
              <p className="prototype-muted">{text.sandbox.emptyHint}</p>
            )}
          </div>
        </div>

        <div className="sandbox-preview-grid">
          {previewRounds.map(({ round, info }) => (
            <div className="sandbox-round-preview" key={round}>
              <strong>{text.preview.round} {round}</strong>
              <span>
                {text.preview.total} {info.count} | {text.preview.basic} {info.basic} | {text.preview.runner} {info.runner} | {text.preview.brute} {info.brute} | {text.preview.shield} {info.shield} | {text.preview.boss} {info.bossName}
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
          <button className="prototype-btn" onClick={() => setMenuStage("map")}>{text.actions.back}</button>
          <button
            className="prototype-btn prototype-btn--primary"
            onClick={startGame}
            disabled={!sandboxValidation.valid}
          >
            {text.actions.start}
          </button>
        </div>
      </>,
      true,
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
      className={`prototype-app-shell ${isCompact ? "prototype-app-shell--compact" : "prototype-app-shell--desktop"} ${designMode === "arcade" ? "prototype-theme-arcade" : "prototype-theme-standard"}`}
      aria-label="TauriTwoer tower defense prototype"
    >
      <canvas className={`prototype-canvas ${isPlaying ? "" : "prototype-canvas--inactive"}`} ref={canvasRef} />
      {!isPlaying ? <div className="prototype-overlay">{overlayContent()}</div> : null}
    </section>
  );
}
