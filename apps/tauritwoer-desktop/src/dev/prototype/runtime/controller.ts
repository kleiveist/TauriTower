import { FIELD_W, FPS } from "../data/constants";
import { DIFFICULTY_ORDER } from "../data/difficulties";
import { TOWER_TYPES } from "../data/towers";
import { validTowerPosition } from "../domain/placement";
import { createGameSession } from "../index";
import type { DifficultyName, GameAction, GameSnapshot, Point, TowerName } from "../types";
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
  PrototypeScreen,
  RenderHitAreas,
  TowerPreviewRenderState,
  TowerTooltipRenderState,
} from "./renderer";
import { getResponsiveMode, TOOLTIP_HOVER_DELAY_MS, type ResponsiveUIMode } from "./ui";

const FIXED_STEP = 1 / FPS;
const MAX_FRAME_DELTA = 0.12;
const MAX_STEPS_PER_FRAME = 8;

export interface PrototypeControllerOptions {
  canvas: HTMLCanvasElement;
  seed?: number;
  iconSrc?: string;
}

export interface PrototypeController {
  start(): void;
  stop(): void;
  resize(pixelWidth: number, pixelHeight: number, viewportWidth?: number): void;
}

export function createPrototypeController(options: PrototypeControllerOptions): PrototypeController {
  return new PrototypeControllerImpl(options);
}

class PrototypeControllerImpl implements PrototypeController {
  private readonly canvas: HTMLCanvasElement;

  private readonly ctx: CanvasRenderingContext2D;

  private readonly session: ReturnType<typeof createGameSession>;

  private snapshot: GameSnapshot;

  private uiScreen: "start" | "difficulty" | "playing" = "start";

  private viewport = createViewport(1, 1);

  private uiMode: ResponsiveUIMode = "desktop";

  private hitAreas: RenderHitAreas = {
    difficultyButtons: [],
    towerCards: [],
    towerInfoButtons: [],
  };

  private pointerWorld: Point = { x: -1000, y: -1000 };

  private speedMultiplier = 1.0;

  private gameIcon: HTMLImageElement | null = null;

  private tooltipState: TowerTooltipRenderState | null = null;

  private hoverTower: TowerName | null = null;

  private hoverAnchor: Point = { x: 0, y: 0 };

  private hoverRevealAtMs = 0;

  private animationFrame = 0;

  private running = false;

  private lastFrameMs = 0;

  private accumulator = 0;

  constructor(options: PrototypeControllerOptions) {
    this.canvas = options.canvas;
    this.session = createGameSession({ seed: options.seed ?? 20260327 });
    this.snapshot = this.session.getSnapshot();

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

  private simulateStep(dtSeconds: number): void {
    if (this.uiScreen === "start" || this.uiScreen === "difficulty") {
      return;
    }

    this.session.tick(dtSeconds);
    this.snapshot = this.session.getSnapshot();
  }

  private render(): void {
    this.hitAreas = renderPrototypeFrame(
      this.ctx,
      this.viewport,
      this.getRenderScreen(),
      this.snapshot,
      {
        pointerWorld: this.pointerWorld,
        speedMultiplier: this.speedMultiplier,
        towerPreview: this.getTowerPreview(),
        gameIcon: this.gameIcon && this.gameIcon.complete ? this.gameIcon : null,
        uiMode: this.uiMode,
        tooltipState: this.tooltipState,
      },
    );

    this.updateCursor(this.pointerWorld);
  }

  private applyAction(action: GameAction): void {
    this.session.applyAction(action);
    this.snapshot = this.session.getSnapshot();
  }

  private chooseDifficulty(difficulty: DifficultyName): void {
    this.applyAction({ type: "chooseDifficulty", difficulty });
    this.speedMultiplier = 1.0;
    this.uiScreen = "playing";
    this.clearAllTooltips();
  }

  private resetSpeedMultiplier(): void {
    this.speedMultiplier = 1.0;
  }

  private getTowerPreview(): TowerPreviewRenderState | null {
    const screen = this.getRenderScreen();
    if (screen !== "playing" || this.snapshot.state !== "playing") {
      return null;
    }

    const towerName = this.snapshot.selectedTowerName;
    if (!towerName) {
      return null;
    }

    const stats = TOWER_TYPES[towerName];
    const validPlacement =
      this.snapshot.money >= stats.cost &&
      validTowerPosition(this.pointerWorld, this.snapshot.towers);

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
    if (this.uiScreen === "start") {
      return "start";
    }
    if (this.uiScreen === "difficulty") {
      return "difficulty";
    }

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
    if (this.uiMode !== "compact") {
      this.clearHoverCandidate();
      this.clearTooltipSource("hover");
      return;
    }

    const screen = this.getRenderScreen();
    if (screen !== "playing" || this.snapshot.state !== "playing") {
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
    if (this.uiMode !== "compact") {
      this.clearHoverCandidate();
      return this.clearTooltipSource("hover");
    }

    const screen = this.getRenderScreen();
    if (screen !== "playing" || this.snapshot.state !== "playing") {
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
    if (
      this.tooltipState?.source === "touch" &&
      this.tooltipState.tower === tower
    ) {
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
    const screen = this.getRenderScreen();

    if (screen === "start") {
      this.canvas.style.cursor =
        this.hitAreas.startButton && pointInRect(worldPoint, this.hitAreas.startButton)
          ? "pointer"
          : "default";
      return;
    }

    if (screen === "difficulty") {
      this.canvas.style.cursor = this.hitAreas.difficultyButtons.some(({ rect }) => pointInRect(worldPoint, rect))
        ? "pointer"
        : "default";
      return;
    }

    if (screen === "game_over" || screen === "victory") {
      const overButton =
        (this.hitAreas.restartButton && pointInRect(worldPoint, this.hitAreas.restartButton)) ||
        (this.hitAreas.menuButton && pointInRect(worldPoint, this.hitAreas.menuButton));
      this.canvas.style.cursor = overButton ? "pointer" : "default";
      return;
    }

    if (this.hitAreas.startWaveButton && pointInRect(worldPoint, this.hitAreas.startWaveButton)) {
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.hitAreas.towerInfoButtons.some(({ rect }) => pointInRect(worldPoint, rect))) {
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

    const delta = Math.min(MAX_FRAME_DELTA, Math.max(0, (nowMs - this.lastFrameMs) / 1000));
    this.lastFrameMs = nowMs;
    this.accumulator += delta;

    let steps = 0;
    while (this.accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
      this.simulateStep(FIXED_STEP * this.speedMultiplier);
      this.accumulator -= FIXED_STEP;
      steps += 1;
    }

    const hoverChanged = this.updateHoverTooltip(nowMs);

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

  private onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    const world = this.worldFromPointer(event);
    this.pointerWorld = world;

    const screen = this.getRenderScreen();

    if (screen === "start") {
      if (this.hitAreas.startButton && pointInRect(world, this.hitAreas.startButton)) {
        this.uiScreen = "difficulty";
        this.clearAllTooltips();
        this.render();
      }
      return;
    }

    if (screen === "difficulty") {
      const hit = findTaggedRectWithValue(
        world,
        this.hitAreas.difficultyButtons.map((entry) => ({
          rect: entry.rect,
          tag: "difficulty",
          value: entry.difficulty,
        })),
      );

      if (hit) {
        this.chooseDifficulty(hit.value);
        this.render();
      }
      return;
    }

    if (screen === "game_over" || screen === "victory") {
      if (this.hitAreas.restartButton && pointInRect(world, this.hitAreas.restartButton)) {
        this.applyAction({ type: "restart" });
        this.resetSpeedMultiplier();
        this.uiScreen = "playing";
        this.clearAllTooltips();
      } else if (this.hitAreas.menuButton && pointInRect(world, this.hitAreas.menuButton)) {
        this.applyAction({ type: "returnToMenu" });
        this.resetSpeedMultiplier();
        this.uiScreen = "start";
        this.clearAllTooltips();
      }

      this.render();
      return;
    }

    if (this.uiMode === "compact") {
      const infoHit = findTaggedRectWithValue(
        world,
        this.hitAreas.towerInfoButtons.map((entry) => ({
          rect: entry.rect,
          tag: "tower_info",
          value: entry,
        })),
      );

      if (infoHit) {
        const rect = infoHit.value.rect;
        this.toggleTouchTooltip(infoHit.value.tower, {
          x: rect.x + rect.w * 0.5,
          y: rect.y + rect.h * 0.5,
        });
        this.render();
        return;
      }
    }

    this.clearTooltipSource("touch");

    if (this.hitAreas.startWaveButton && pointInRect(world, this.hitAreas.startWaveButton)) {
      this.applyAction({ type: "startWave" });
      this.render();
      return;
    }

    const towerHit = findTaggedRectWithValue(
      world,
      this.hitAreas.towerCards.map((entry) => ({
        rect: entry.rect,
        tag: "tower",
        value: entry.tower,
      })),
    );

    if (towerHit) {
      this.applyAction({ type: "selectTower", tower: towerHit.value });
      this.render();
      return;
    }

    if (world.x >= 0 && world.x <= FIELD_W) {
      this.applyAction({ type: "placeTower", position: world });
      this.render();
    }
  };

  private onContextMenu = (event: MouseEvent): void => {
    event.preventDefault();

    if (this.getRenderScreen() !== "playing" || this.snapshot.state !== "playing") {
      return;
    }

    this.applyAction({ type: "clearSelection" });
    this.clearTooltipSource("touch");
    this.render();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    const screen = this.getRenderScreen();

    if (screen === "start") {
      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        this.uiScreen = "difficulty";
        this.clearAllTooltips();
        this.render();
      }
      return;
    }

    if (screen === "difficulty") {
      if (event.code === "Escape") {
        this.uiScreen = "start";
        this.clearAllTooltips();
        this.render();
        return;
      }

      const digit = Number.parseInt(event.key, 10);
      if (Number.isFinite(digit) && digit >= 1 && digit <= DIFFICULTY_ORDER.length) {
        const difficulty = DIFFICULTY_ORDER[digit - 1];
        if (difficulty) {
          this.chooseDifficulty(difficulty);
          this.render();
        }
      }
      return;
    }

    if (screen === "game_over" || screen === "victory") {
      if (event.code === "Enter" || event.code === "KeyR") {
        event.preventDefault();
        this.applyAction({ type: "restart" });
        this.resetSpeedMultiplier();
        this.uiScreen = "playing";
        this.clearAllTooltips();
        this.render();
        return;
      }

      if (event.code === "Escape" || event.code === "KeyM") {
        event.preventDefault();
        this.applyAction({ type: "returnToMenu" });
        this.resetSpeedMultiplier();
        this.uiScreen = "start";
        this.clearAllTooltips();
        this.render();
      }
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
      this.applyAction({ type: "returnToMenu" });
      this.resetSpeedMultiplier();
      this.uiScreen = "start";
      this.clearAllTooltips();
      this.render();
      return;
    }

    if (event.code === "Escape" || event.code === "Backspace" || event.code === "Delete") {
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
