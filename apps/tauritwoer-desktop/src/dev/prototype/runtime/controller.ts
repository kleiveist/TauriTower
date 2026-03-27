import { FIELD_W, FPS } from "../data/constants";
import { DEFAULT_MAP_ID, getMapDefinition } from "../data/maps";
import { TOWER_TYPES } from "../data/towers";
import { createDefaultSandboxConfig, cloneSandboxConfig } from "../domain/sandbox";
import { validTowerPosition } from "../domain/placement";
import { createGameSession } from "../index";
import type {
  DifficultyName,
  GameAction,
  GameSnapshot,
  MapId,
  Point,
  SandboxConfig,
  TowerName,
} from "../types";
import {
  DEFAULT_DESIGN_MODE,
  DEFAULT_UI_LANGUAGE,
  getTranslations,
  type DesignMode,
  type PrototypeTranslations,
  type UiLanguage,
} from "./i18n";
import {
  decreaseSpeedMultiplier,
  findTaggedRectWithValue,
  increaseSpeedMultiplier,
  isSpeedDecreaseHotkey,
  isSpeedIncreaseHotkey,
  towerFromDigitKey,
} from "./input";
import { createViewport, pointInRect, toWorldPosition } from "./layout";
import { renderPrototypeFrame } from "./renderer";
import type {
  DebugHudRenderState,
  PauseRenderState,
  PrototypeScreen,
  RenderHitAreas,
  TowerPreviewRenderState,
  TowerTooltipRenderState,
} from "./renderer";
import { getResponsiveMode, TOOLTIP_HOVER_DELAY_MS, type ResponsiveUIMode } from "./ui";

const FIXED_STEP = 1 / FPS;
const MAX_FRAME_DELTA = 0.12;
const MAX_STEPS_PER_FRAME = 8;
const DEBUG_WARN_INTERVAL_MS = 5000;
const DEBUG_WARN_THRESHOLDS = {
  enemies: 360,
  bullets: 1200,
  simMs: 10,
  fps: 30,
} as const;

export interface StartGameConfig {
  difficulty: DifficultyName;
  mode: "classic" | "sandbox";
  mapId: MapId;
  sandboxConfig: SandboxConfig;
}

export interface PresentationPreferences {
  language: UiLanguage;
  designMode: DesignMode;
  debugMode: boolean;
}

export interface PrototypeControllerOptions {
  canvas: HTMLCanvasElement;
  seed?: number;
  iconSrc?: string;
  onReturnToMenu?: () => void;
}

export interface PrototypeController {
  start(): void;
  stop(): void;
  resize(pixelWidth: number, pixelHeight: number, viewportWidth?: number): void;
  setInputEnabled(enabled: boolean): void;
  startConfiguredGame(config: StartGameConfig): void;
  setPresentation(preferences: PresentationPreferences): void;
  getSnapshot(): GameSnapshot;
}

export function createPrototypeController(options: PrototypeControllerOptions): PrototypeController {
  return new PrototypeControllerImpl(options);
}

class PrototypeControllerImpl implements PrototypeController {
  private readonly canvas: HTMLCanvasElement;

  private readonly ctx: CanvasRenderingContext2D;

  private readonly session: ReturnType<typeof createGameSession>;

  private readonly onReturnToMenu?: () => void;

  private snapshot: GameSnapshot;

  private inputEnabled = false;

  private viewport = createViewport(1, 1);

  private uiMode: ResponsiveUIMode = "desktop";

  private hitAreas: RenderHitAreas = {
    difficultyButtons: [],
    towerCards: [],
  };

  private pointerWorld: Point = { x: -1000, y: -1000 };

  private speedMultiplier = 1.0;

  private gameIcon: HTMLImageElement | null = null;

  private tooltipState: TowerTooltipRenderState | null = null;

  private hoverTower: TowerName | null = null;

  private hoverAnchor: Point = { x: 0, y: 0 };

  private hoverRevealAtMs = 0;

  private paused = false;

  private pauseConfirmAction: "restart" | "menu" | null = null;

  private uiLanguage: UiLanguage = DEFAULT_UI_LANGUAGE;

  private designMode: DesignMode = DEFAULT_DESIGN_MODE;

  private debugMode = false;

  private avgFps = 0;

  private avgFrameMs = 0;

  private avgSimMs = 0;

  private lastDebugWarningAtMs = 0;

  private text: PrototypeTranslations = getTranslations(DEFAULT_UI_LANGUAGE);

  private animationFrame = 0;

  private running = false;

  private lastFrameMs = 0;

  private accumulator = 0;

  constructor(options: PrototypeControllerOptions) {
    this.canvas = options.canvas;
    this.onReturnToMenu = options.onReturnToMenu;
    this.session = createGameSession({
      seed: options.seed ?? 20260327,
      mode: "classic",
      mapId: DEFAULT_MAP_ID,
      sandboxConfig: createDefaultSandboxConfig(),
    });
    this.snapshot = this.session.getLiveSnapshot() as GameSnapshot;

    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get 2D canvas context");
    }
    this.ctx = context;

    if (options.iconSrc) {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        this.render();
      };
      image.src = options.iconSrc;
      this.gameIcon = image;
    }
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastFrameMs = performance.now();

    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("contextmenu", this.onContextMenu);
    window.addEventListener("keydown", this.onKeyDown);

    this.render();
    this.animationFrame = window.requestAnimationFrame(this.onAnimationFrame);
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    window.cancelAnimationFrame(this.animationFrame);

    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
    window.removeEventListener("keydown", this.onKeyDown);
  }

  resize(pixelWidth: number, pixelHeight: number, viewportWidth?: number): void {
    if (pixelWidth <= 0 || pixelHeight <= 0) {
      return;
    }

    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }

    this.viewport = createViewport(pixelWidth, pixelHeight);

    const modeFromWidth = getResponsiveMode(viewportWidth ?? pixelWidth);
    if (modeFromWidth !== this.uiMode) {
      this.uiMode = modeFromWidth;
      this.clearAllTooltips();
    }

    this.render();
  }

  setInputEnabled(enabled: boolean): void {
    if (this.inputEnabled === enabled) {
      return;
    }

    this.inputEnabled = enabled;
    if (!enabled) {
      this.paused = false;
      this.pauseConfirmAction = null;
      this.clearAllTooltips();
      this.canvas.style.cursor = "default";
    }
  }

  setPresentation(preferences: PresentationPreferences): void {
    let changed = false;

    if (this.uiLanguage !== preferences.language) {
      this.uiLanguage = preferences.language;
      this.text = getTranslations(preferences.language);
      changed = true;
    }

    if (this.designMode !== preferences.designMode) {
      this.designMode = preferences.designMode;
      changed = true;
    }

    if (this.debugMode !== preferences.debugMode) {
      this.debugMode = preferences.debugMode;
      this.lastDebugWarningAtMs = 0;
      changed = true;
    }

    if (changed) {
      this.render();
    }
  }

  startConfiguredGame(config: StartGameConfig): void {
    this.applyAction({
      type: "chooseDifficulty",
      difficulty: config.difficulty,
      mode: config.mode,
      mapId: config.mapId,
      sandboxConfig: cloneSandboxConfig(config.sandboxConfig),
    });
    this.resetSpeedMultiplier();
    this.paused = false;
    this.pauseConfirmAction = null;
    this.clearAllTooltips();
    this.inputEnabled = true;
    this.render();
  }

  getSnapshot(): GameSnapshot {
    return this.session.getSnapshot();
  }

  private simulateStep(dtSeconds: number): void {
    if (!this.inputEnabled || this.paused) {
      return;
    }

    this.session.tick(dtSeconds);
  }

  private render(): void {
    this.hitAreas = renderPrototypeFrame(this.ctx, this.viewport, this.getRenderScreen(), this.snapshot, {
      pointerWorld: this.pointerWorld,
      speedMultiplier: this.speedMultiplier,
      towerPreview: this.getTowerPreview(),
      gameIcon: this.gameIcon && this.gameIcon.complete ? this.gameIcon : null,
      uiMode: this.uiMode,
      tooltipState: this.tooltipState,
      language: this.uiLanguage,
      designMode: this.designMode,
      text: this.text,
      pauseState: this.getPauseRenderState(),
      debug: this.getDebugRenderState(),
    });

    this.updateCursor(this.pointerWorld);
  }

  private applyAction(action: GameAction): void {
    this.session.applyAction(action);
    this.snapshot = this.session.getLiveSnapshot() as GameSnapshot;
  }

  private resetSpeedMultiplier(): void {
    this.speedMultiplier = 1.0;
  }

  private returnToMenu(): void {
    this.applyAction({ type: "returnToMenu" });
    this.resetSpeedMultiplier();
    this.inputEnabled = false;
    this.paused = false;
    this.pauseConfirmAction = null;
    this.clearAllTooltips();
    this.onReturnToMenu?.();
    this.render();
  }

  private setPaused(nextPaused: boolean): void {
    if (this.paused === nextPaused) {
      return;
    }

    this.paused = nextPaused;
    if (!nextPaused) {
      this.pauseConfirmAction = null;
    }

    this.clearAllTooltips();
    this.render();
  }

  private togglePause(): void {
    if (!this.inputEnabled || this.snapshot.state !== "playing") {
      return;
    }
    this.setPaused(!this.paused);
  }

  private getPauseRenderState(): PauseRenderState | null {
    if (!this.paused || this.snapshot.state !== "playing") {
      return null;
    }

    return {
      confirmAction: this.pauseConfirmAction,
    };
  }

  private getDebugRenderState(): DebugHudRenderState | null {
    if (!this.debugMode) {
      return null;
    }

    return {
      fps: this.avgFps,
      frameMs: this.avgFrameMs,
      simMs: this.avgSimMs,
      towers: this.snapshot.towers.length,
      enemies: this.snapshot.enemies.length,
      bullets: this.snapshot.bullets.length,
      waveRemaining: Math.max(0, this.snapshot.totalWaveEnemies - this.snapshot.spawnedThisWave),
      waveSpawned: this.snapshot.spawnedThisWave,
      waveTotal: this.snapshot.totalWaveEnemies,
    };
  }

  private updateFrameMetrics(frameDurationMs: number, simulationMs: number): void {
    const alpha = 0.16;
    const fps = frameDurationMs > 0 ? 1000 / frameDurationMs : 0;

    this.avgFps = this.avgFps === 0 ? fps : this.avgFps + (fps - this.avgFps) * alpha;
    this.avgFrameMs =
      this.avgFrameMs === 0
        ? frameDurationMs
        : this.avgFrameMs + (frameDurationMs - this.avgFrameMs) * alpha;
    this.avgSimMs =
      this.avgSimMs === 0
        ? simulationMs
        : this.avgSimMs + (simulationMs - this.avgSimMs) * alpha;
  }

  private maybeWarnDebugOverload(nowMs: number): void {
    if (!this.debugMode) {
      return;
    }

    if (this.snapshot.state !== "playing" || !this.inputEnabled) {
      return;
    }

    if (nowMs - this.lastDebugWarningAtMs < DEBUG_WARN_INTERVAL_MS) {
      return;
    }

    const enemies = this.snapshot.enemies.length;
    const bullets = this.snapshot.bullets.length;
    const overloaded =
      enemies >= DEBUG_WARN_THRESHOLDS.enemies ||
      bullets >= DEBUG_WARN_THRESHOLDS.bullets ||
      this.avgSimMs >= DEBUG_WARN_THRESHOLDS.simMs ||
      (this.avgFps > 0 && this.avgFps <= DEBUG_WARN_THRESHOLDS.fps);

    if (!overloaded) {
      return;
    }

    this.lastDebugWarningAtMs = nowMs;
    console.warn("[TauriTwoer][Debug] Runtime pressure detected", {
      fps: this.avgFps.toFixed(1),
      simMs: this.avgSimMs.toFixed(2),
      frameMs: this.avgFrameMs.toFixed(2),
      towers: this.snapshot.towers.length,
      enemies,
      bullets,
      waveSpawned: this.snapshot.spawnedThisWave,
      waveTotal: this.snapshot.totalWaveEnemies,
      waveRemaining: Math.max(0, this.snapshot.totalWaveEnemies - this.snapshot.spawnedThisWave),
    });
  }

  private getTowerPreview(): TowerPreviewRenderState | null {
    if (!this.inputEnabled || this.paused || this.snapshot.state !== "playing") {
      return null;
    }

    const towerName = this.snapshot.selectedTowerName;
    if (!towerName) {
      return null;
    }

    const stats = TOWER_TYPES[towerName];
    const cost = this.snapshot.towerPrices[towerName];
    const pathPoints = getMapDefinition(this.snapshot.mapId).pathPoints;
    const validPlacement =
      this.snapshot.money >= cost &&
      validTowerPosition(this.pointerWorld, this.snapshot.towers, pathPoints);

    return {
      tower: towerName,
      position: {
        x: this.pointerWorld.x,
        y: this.pointerWorld.y,
      },
      range: stats.range,
      validPlacement,
    };
  }

  private getRenderScreen(): PrototypeScreen {
    if (this.snapshot.state === "game_over") {
      return "game_over";
    }
    if (this.snapshot.state === "victory") {
      return "victory";
    }
    return "playing";
  }

  private worldFromPointer(event: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return toWorldPosition(
      {
        x: (event.clientX - rect.left) * (this.canvas.width / Math.max(1, rect.width)),
        y: (event.clientY - rect.top) * (this.canvas.height / Math.max(1, rect.height)),
      },
      this.viewport,
    );
  }

  private clearHoverCandidate(): void {
    this.hoverTower = null;
    this.hoverRevealAtMs = 0;
  }

  private clearTooltipSource(source: "hover" | "touch" | "all"): boolean {
    if (source === "all") {
      const changed = this.tooltipState !== null;
      this.tooltipState = null;
      return changed;
    }

    if (this.tooltipState?.source === source) {
      this.tooltipState = null;
      return true;
    }

    return false;
  }

  private clearAllTooltips(): void {
    this.clearHoverCandidate();
    this.clearTooltipSource("all");
  }

  private beginHoverTooltip(worldPoint: Point, nowMs: number): void {
    if (!this.inputEnabled || this.paused || this.uiMode !== "desktop") {
      this.clearHoverCandidate();
      this.clearTooltipSource("hover");
      return;
    }

    if (this.snapshot.state !== "playing") {
      this.clearHoverCandidate();
      this.clearTooltipSource("hover");
      return;
    }

    if (this.tooltipState?.source === "touch") {
      return;
    }

    const hit = findTaggedRectWithValue(
      worldPoint,
      this.hitAreas.towerCards.map((entry) => ({
        rect: entry.rect,
        tag: "tower",
        value: entry.tower,
      })),
    );

    if (!hit) {
      this.clearHoverCandidate();
      this.clearTooltipSource("hover");
      return;
    }

    const nextAnchor = {
      x: hit.rect.x + hit.rect.w * 0.5,
      y: hit.rect.y + hit.rect.h * 0.5,
    };

    if (this.hoverTower !== hit.value) {
      this.hoverTower = hit.value;
      this.hoverAnchor = nextAnchor;
      this.hoverRevealAtMs = nowMs + TOOLTIP_HOVER_DELAY_MS;
      this.clearTooltipSource("hover");
      return;
    }

    this.hoverAnchor = nextAnchor;
    if (this.tooltipState?.source === "hover") {
      this.tooltipState = {
        ...this.tooltipState,
        anchor: nextAnchor,
      };
    }
  }

  private updateHoverTooltip(nowMs: number): boolean {
    if (!this.inputEnabled || this.paused || this.uiMode !== "desktop") {
      this.clearHoverCandidate();
      return this.clearTooltipSource("hover");
    }

    if (this.snapshot.state !== "playing") {
      this.clearHoverCandidate();
      return this.clearTooltipSource("hover");
    }

    if (this.tooltipState?.source === "touch") {
      return false;
    }

    if (!this.hoverTower || this.hoverRevealAtMs <= 0 || nowMs < this.hoverRevealAtMs) {
      return false;
    }

    if (
      this.tooltipState?.source === "hover" &&
      this.tooltipState.tower === this.hoverTower &&
      this.tooltipState.anchor.x === this.hoverAnchor.x &&
      this.tooltipState.anchor.y === this.hoverAnchor.y
    ) {
      return false;
    }

    this.tooltipState = {
      tower: this.hoverTower,
      anchor: this.hoverAnchor,
      source: "hover",
    };
    return true;
  }

  private toggleTouchTooltip(tower: TowerName, anchor: Point): void {
    if (this.tooltipState?.source === "touch" && this.tooltipState.tower === tower) {
      this.tooltipState = null;
      this.clearHoverCandidate();
      return;
    }

    this.clearHoverCandidate();
    this.tooltipState = {
      tower,
      anchor,
      source: "touch",
    };
  }

  private updateCursor(worldPoint: Point): void {
    if (!this.inputEnabled) {
      this.canvas.style.cursor = "default";
      return;
    }

    const screen = this.getRenderScreen();
    if (screen === "game_over" || screen === "victory") {
      const overButton =
        (this.hitAreas.restartButton && pointInRect(worldPoint, this.hitAreas.restartButton)) ||
        (this.hitAreas.menuButton && pointInRect(worldPoint, this.hitAreas.menuButton));
      this.canvas.style.cursor = overButton ? "pointer" : "default";
      return;
    }

    if (this.hitAreas.pauseButton && pointInRect(worldPoint, this.hitAreas.pauseButton)) {
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.paused) {
      const overPauseAction =
        (this.hitAreas.pauseResumeButton && pointInRect(worldPoint, this.hitAreas.pauseResumeButton)) ||
        (this.hitAreas.pauseRestartButton && pointInRect(worldPoint, this.hitAreas.pauseRestartButton)) ||
        (this.hitAreas.pauseMenuButton && pointInRect(worldPoint, this.hitAreas.pauseMenuButton)) ||
        (this.hitAreas.pauseConfirmCancelButton && pointInRect(worldPoint, this.hitAreas.pauseConfirmCancelButton)) ||
        (this.hitAreas.pauseConfirmAcceptButton && pointInRect(worldPoint, this.hitAreas.pauseConfirmAcceptButton));
      this.canvas.style.cursor = overPauseAction ? "pointer" : "default";
      return;
    }

    if (this.hitAreas.startWaveButton && pointInRect(worldPoint, this.hitAreas.startWaveButton)) {
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.hitAreas.towerCards.some(({ rect }) => pointInRect(worldPoint, rect))) {
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (worldPoint.x >= 0 && worldPoint.x <= FIELD_W) {
      this.canvas.style.cursor = "crosshair";
      return;
    }

    this.canvas.style.cursor = "default";
  }

  private onAnimationFrame = (nowMs: number): void => {
    if (!this.running) {
      return;
    }

    const frameStartMs = nowMs;
    const delta = Math.min(MAX_FRAME_DELTA, Math.max(0, (nowMs - this.lastFrameMs) / 1000));
    this.lastFrameMs = nowMs;
    this.accumulator += delta;

    let steps = 0;
    let simulationMs = 0;
    while (this.accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
      const simStartMs = performance.now();
      this.simulateStep(FIXED_STEP * this.speedMultiplier);
      simulationMs += performance.now() - simStartMs;
      this.accumulator -= FIXED_STEP;
      steps += 1;
    }

    if (steps > 0) {
      this.snapshot = this.session.getLiveSnapshot() as GameSnapshot;
    }

    const hoverChanged = this.updateHoverTooltip(nowMs);
    const frameDurationMs = Math.max(0, performance.now() - frameStartMs);
    this.updateFrameMetrics(frameDurationMs, simulationMs);
    this.maybeWarnDebugOverload(nowMs);

    if (steps > 0 || hoverChanged) {
      this.render();
    }

    this.animationFrame = window.requestAnimationFrame(this.onAnimationFrame);
  };

  private onPointerMove = (event: PointerEvent): void => {
    this.pointerWorld = this.worldFromPointer(event);
    this.beginHoverTooltip(this.pointerWorld, performance.now());
    this.updateCursor(this.pointerWorld);
    this.render();
  };

  private onPointerLeave = (): void => {
    this.pointerWorld = { x: -1000, y: -1000 };
    this.clearHoverCandidate();
    if (this.clearTooltipSource("hover")) {
      this.render();
    } else {
      this.updateCursor(this.pointerWorld);
    }
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || !this.inputEnabled) {
      return;
    }

    const world = this.worldFromPointer(event);
    this.pointerWorld = world;

    const screen = this.getRenderScreen();

    if (screen === "game_over" || screen === "victory") {
      if (this.hitAreas.restartButton && pointInRect(world, this.hitAreas.restartButton)) {
        this.applyAction({ type: "restart" });
        this.resetSpeedMultiplier();
        this.paused = false;
        this.pauseConfirmAction = null;
        this.clearAllTooltips();
      } else if (this.hitAreas.menuButton && pointInRect(world, this.hitAreas.menuButton)) {
        this.returnToMenu();
      }

      this.render();
      return;
    }

    if (this.hitAreas.pauseButton && pointInRect(world, this.hitAreas.pauseButton)) {
      this.togglePause();
      return;
    }

    if (this.paused) {
      if (this.pauseConfirmAction) {
        if (this.hitAreas.pauseConfirmCancelButton && pointInRect(world, this.hitAreas.pauseConfirmCancelButton)) {
          this.pauseConfirmAction = null;
          this.render();
          return;
        }

        if (this.hitAreas.pauseConfirmAcceptButton && pointInRect(world, this.hitAreas.pauseConfirmAcceptButton)) {
          if (this.pauseConfirmAction === "restart") {
            this.applyAction({ type: "restart" });
            this.resetSpeedMultiplier();
            this.paused = false;
            this.pauseConfirmAction = null;
          } else {
            this.returnToMenu();
            return;
          }
          this.render();
          return;
        }
      } else {
        if (this.hitAreas.pauseResumeButton && pointInRect(world, this.hitAreas.pauseResumeButton)) {
          this.setPaused(false);
          return;
        }

        if (this.hitAreas.pauseRestartButton && pointInRect(world, this.hitAreas.pauseRestartButton)) {
          this.pauseConfirmAction = "restart";
          this.render();
          return;
        }

        if (this.hitAreas.pauseMenuButton && pointInRect(world, this.hitAreas.pauseMenuButton)) {
          this.pauseConfirmAction = "menu";
          this.render();
          return;
        }
      }

      this.render();
      return;
    }

    const towerHit = findTaggedRectWithValue(
      world,
      this.hitAreas.towerCards.map((entry) => ({
        rect: entry.rect,
        tag: "tower",
        value: entry,
      })),
    );

    let clearedTouchTooltip = false;
    if (this.uiMode === "compact") {
      if (towerHit) {
        const rect = towerHit.value.rect;
        this.toggleTouchTooltip(towerHit.value.tower, {
          x: rect.x + rect.w * 0.5,
          y: rect.y + rect.h * 0.5,
        });
        this.applyAction({ type: "selectTower", tower: towerHit.value.tower });
        this.render();
        return;
      }

      clearedTouchTooltip = this.clearTooltipSource("touch");
    }

    if (this.hitAreas.startWaveButton && pointInRect(world, this.hitAreas.startWaveButton)) {
      this.applyAction({ type: "startWave" });
      this.render();
      return;
    }

    if (towerHit) {
      this.applyAction({ type: "selectTower", tower: towerHit.value.tower });
      this.render();
      return;
    }

    if (world.x >= 0 && world.x <= FIELD_W) {
      this.applyAction({ type: "placeTower", position: world });
      this.render();
      return;
    }

    if (clearedTouchTooltip) {
      this.render();
    }
  };

  private onContextMenu = (event: MouseEvent): void => {
    event.preventDefault();

    if (!this.inputEnabled || this.snapshot.state !== "playing" || this.paused) {
      return;
    }

    this.applyAction({ type: "clearSelection" });
    this.clearTooltipSource("touch");
    this.render();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.inputEnabled) {
      return;
    }

    const screen = this.getRenderScreen();

    if (screen === "game_over" || screen === "victory") {
      if (event.code === "Enter" || event.code === "KeyR") {
        event.preventDefault();
        this.applyAction({ type: "restart" });
        this.resetSpeedMultiplier();
        this.paused = false;
        this.pauseConfirmAction = null;
        this.clearAllTooltips();
        this.render();
        return;
      }

      if (event.code === "Escape" || event.code === "KeyM") {
        event.preventDefault();
        this.returnToMenu();
      }
      return;
    }

    if (event.code === "Escape" || event.code === "KeyP") {
      event.preventDefault();
      if (this.paused && this.pauseConfirmAction) {
        this.pauseConfirmAction = null;
        this.render();
        return;
      }
      this.togglePause();
      return;
    }

    if (this.paused) {
      return;
    }

    if (isSpeedIncreaseHotkey(event)) {
      event.preventDefault();
      this.speedMultiplier = increaseSpeedMultiplier(this.speedMultiplier);
      this.render();
      return;
    }

    if (isSpeedDecreaseHotkey(event)) {
      event.preventDefault();
      this.speedMultiplier = decreaseSpeedMultiplier(this.speedMultiplier);
      this.render();
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      this.applyAction({ type: "startWave" });
      this.render();
      return;
    }

    if (event.code === "KeyR") {
      this.applyAction({ type: "restart" });
      this.resetSpeedMultiplier();
      this.clearAllTooltips();
      this.render();
      return;
    }

    if (event.code === "KeyM") {
      this.returnToMenu();
      return;
    }

    if (event.code === "Backspace" || event.code === "Delete") {
      event.preventDefault();
      this.applyAction({ type: "clearSelection" });
      this.clearTooltipSource("touch");
      this.render();
      return;
    }

    const tower = towerFromDigitKey(event.key);
    if (tower) {
      this.applyAction({ type: "selectTower", tower });
      this.clearTooltipSource("touch");
      this.render();
    }
  };
}
