import { FIELD_W, GRID_SIZE, PATH_WIDTH, SCREEN_H, SCREEN_W, SIDEBAR_W } from "../data/constants";
import { getMapDefinition } from "../data/maps";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../data/difficulties";
import { TOWER_ICON_LABELS, TOWER_ORDER, TOWER_TYPES } from "../data/towers";
import type { DifficultyName, EnemySnapshot, GameSnapshot, Point, TowerName } from "../types";
import {
  formatGameMessage,
  getBossName,
  getMapShortLabel,
  getTowerDescription,
  getTowerName,
  getTowerSpecial,
  type DesignMode,
  type PrototypeTranslations,
  type UiLanguage,
} from "./i18n";
import {
  centeredRect,
  fieldRect,
  pointInRect,
  sidebarInfoRect,
  sidebarRect,
  sidebarWaveRect,
  startWaveButtonRect,
  towerCardRect,
} from "./layout";
import type { Rect, Viewport } from "./layout";
import {
  formatTowerDps,
  getSidebarLayoutConfig,
  resolveTooltipPlacement,
  type ResponsiveUIMode,
} from "./ui";

export type PrototypeScreen = "start" | "difficulty" | "playing" | "game_over" | "victory";

export interface DifficultyHit {
  difficulty: DifficultyName;
  rect: Rect;
}

export interface TowerHit {
  tower: TowerName;
  rect: Rect;
}

export interface TowerPreviewRenderState {
  tower: TowerName;
  position: Point;
  range: number;
  validPlacement: boolean;
}

export interface TowerTooltipRenderState {
  tower: TowerName;
  anchor: Point;
  source: "hover" | "touch";
}

export interface PauseRenderState {
  confirmAction: "restart" | "menu" | null;
}

export interface DebugHudRenderState {
  fps: number;
  frameMs: number;
  simMs: number;
  towers: number;
  enemies: number;
  bullets: number;
  waveRemaining: number;
  waveSpawned: number;
  waveTotal: number;
}

export interface RuntimeRenderState {
  pointerWorld: Point;
  speedMultiplier: number;
  towerPreview: TowerPreviewRenderState | null;
  gameIcon: CanvasImageSource | null;
  uiMode: ResponsiveUIMode;
  tooltipState: TowerTooltipRenderState | null;
  language: UiLanguage;
  designMode: DesignMode;
  text: PrototypeTranslations;
  pauseState: PauseRenderState | null;
  debug: DebugHudRenderState | null;
}

export interface RenderHitAreas {
  startButton?: Rect;
  difficultyButtons: DifficultyHit[];
  towerCards: TowerHit[];
  startWaveButton?: Rect;
  restartButton?: Rect;
  menuButton?: Rect;
  pauseButton?: Rect;
  pauseResumeButton?: Rect;
  pauseRestartButton?: Rect;
  pauseMenuButton?: Rect;
  pauseConfirmCancelButton?: Rect;
  pauseConfirmAcceptButton?: Rect;
}

interface CanvasTheme {
  arcade: boolean;
  frameBackground: string;
  startGradientFrom: string;
  startGradientTo: string;
  panelFill: string;
  panelBorder: string;
  fieldFill: string;
  gridColor: string;
  pathMain: string;
  pathEdge: string;
  sidebarGradientFrom: string;
  sidebarGradientTo: string;
  sidebarDivider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  cardFill: string;
  cardStroke: string;
  tooltipFill: string;
  tooltipStroke: string;
  endBackdrop: string;
  messageFill: string;
  messageStroke: string;
  buttonPrimary: string;
  buttonPrimaryHover: string;
  buttonPrimaryStroke: string;
  buttonSecondary: string;
  buttonSecondaryHover: string;
  buttonSecondaryStroke: string;
  buttonDanger: string;
  buttonDangerHover: string;
  buttonDangerStroke: string;
}

export function renderPrototypeFrame(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  screen: PrototypeScreen,
  snapshot: GameSnapshot,
  runtime: RuntimeRenderState,
): RenderHitAreas {
  const theme = createCanvasTheme(runtime.designMode);
  const hitAreas: RenderHitAreas = {
    difficultyButtons: [],
    towerCards: [],
  };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = theme.frameBackground;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  ctx.save();
  ctx.translate(viewport.offsetX, viewport.offsetY);
  ctx.scale(viewport.scale, viewport.scale);

  if (screen === "start") {
    drawStartScreen(ctx, hitAreas, runtime, theme);
    ctx.restore();
    return hitAreas;
  }

  if (screen === "difficulty") {
    drawDifficultyScreen(ctx, hitAreas, runtime, theme);
    ctx.restore();
    return hitAreas;
  }

  drawGameScene(ctx, snapshot, hitAreas, runtime, theme);

  if (screen === "game_over" || screen === "victory") {
    drawEndOverlay(ctx, screen, hitAreas, runtime, theme);
  }

  ctx.restore();
  return hitAreas;
}

function drawStartScreen(
  ctx: CanvasRenderingContext2D,
  hitAreas: RenderHitAreas,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  const gradient = ctx.createLinearGradient(0, 0, SCREEN_W, SCREEN_H);
  gradient.addColorStop(0, theme.startGradientFrom);
  gradient.addColorStop(1, theme.startGradientTo);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const compact = runtime.uiMode === "compact";
  const panel = centeredRect(compact ? 860 : 980, compact ? 560 : 620, compact ? -10 : -20);
  roundRect(ctx, panel, 24, theme.panelFill, theme.panelBorder, 2);

  drawGameIconBadge(ctx, runtime.gameIcon, panel.x + 32, panel.y + 32, compact ? 104 : 124, theme);

  const text = runtime.text.runtime.startScreen;
  ctx.textAlign = "center";
  ctx.fillStyle = theme.textPrimary;
  ctx.font = compact ? "700 60px Arial" : "700 78px Arial";
  ctx.fillText(text.title, SCREEN_W * 0.5, panel.y + (compact ? 126 : 144));

  ctx.fillStyle = theme.textSecondary;
  ctx.font = compact ? "500 27px Arial" : "500 31px Arial";
  ctx.fillText(text.subtitle, SCREEN_W * 0.5, panel.y + (compact ? 188 : 214));

  ctx.fillStyle = theme.textMuted;
  ctx.font = compact ? "500 23px Arial" : "500 28px Arial";
  text.features.forEach((line, index) => {
    ctx.fillText(line, SCREEN_W * 0.5, panel.y + (compact ? 248 : 292) + index * (compact ? 46 : 50));
  });

  const startButton = centeredRect(compact ? 360 : 448, compact ? 86 : 96, compact ? 240 : 258);
  const hovered = pointInRect(runtime.pointerWorld, startButton);
  roundRect(
    ctx,
    startButton,
    16,
    hovered ? theme.buttonPrimaryHover : theme.buttonPrimary,
    theme.buttonPrimaryStroke,
    3,
  );

  if (theme.arcade) {
    applyGlow(ctx, theme.buttonPrimaryStroke, 18);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = compact ? "700 37px Arial" : "700 42px Arial";
  ctx.fillText(text.startButton, startButton.x + startButton.w * 0.5, startButton.y + (compact ? 56 : 62));

  ctx.shadowBlur = 0;
  hitAreas.startButton = startButton;
}

function drawDifficultyScreen(
  ctx: CanvasRenderingContext2D,
  hitAreas: RenderHitAreas,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  const gradient = ctx.createLinearGradient(0, 0, SCREEN_W, SCREEN_H);
  gradient.addColorStop(0, theme.startGradientFrom);
  gradient.addColorStop(1, theme.startGradientTo);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const compact = runtime.uiMode === "compact";
  ctx.textAlign = "center";
  ctx.fillStyle = theme.textPrimary;
  ctx.font = compact ? "700 58px Arial" : "700 72px Arial";
  ctx.fillText(runtime.text.runtime.difficultyScreen.title, SCREEN_W * 0.5, compact ? 148 : 164);

  const buttonWidth = compact ? 600 : 640;
  const buttonHeight = compact ? 108 : 120;
  const startY = compact ? 218 : 244;

  DIFFICULTY_ORDER.forEach((difficulty, index) => {
    const rect: Rect = {
      x: (SCREEN_W - buttonWidth) * 0.5,
      y: startY + index * (buttonHeight + 18),
      w: buttonWidth,
      h: buttonHeight,
    };

    const hovered = pointInRect(runtime.pointerWorld, rect);
    roundRect(
      ctx,
      rect,
      16,
      hovered ? theme.buttonSecondaryHover : theme.buttonSecondary,
      theme.buttonSecondaryStroke,
      3,
    );

    if (theme.arcade) {
      applyGlow(ctx, theme.buttonSecondaryStroke, 13);
    }

    ctx.fillStyle = theme.textPrimary;
    ctx.font = compact ? "700 34px Arial" : "700 38px Arial";
    ctx.fillText(runtime.text.difficulty.labels[difficulty], rect.x + rect.w * 0.5, rect.y + (compact ? 47 : 53));

    ctx.fillStyle = theme.textSecondary;
    ctx.font = compact ? "500 21px Arial" : "500 24px Arial";
    ctx.fillText(
      `${runtime.text.runtime.difficultyScreen.multiplierLabel} x${DIFFICULTIES[difficulty].countMult.toFixed(1)}`,
      rect.x + rect.w * 0.5,
      rect.y + (compact ? 80 : 87),
    );

    ctx.shadowBlur = 0;
    hitAreas.difficultyButtons.push({ difficulty, rect });
  });
}

function drawGameScene(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  hitAreas: RenderHitAreas,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  drawField(ctx, theme);
  drawPath(ctx, snapshot.mapId, theme);
  drawTowerPreview(ctx, runtime.towerPreview, theme);
  drawEntities(ctx, snapshot, runtime, theme);
  drawSidebar(ctx, snapshot, hitAreas, runtime, theme);

  if (runtime.tooltipState) {
    drawTowerTooltip(ctx, snapshot, runtime, theme);
  }

  const message = formatGameMessage(snapshot.message, runtime.language);
  drawTopMessage(ctx, message, theme);

  if (runtime.debug) {
    drawDebugHud(ctx, runtime, theme);
  }

  if (runtime.pauseState) {
    drawPauseOverlay(ctx, hitAreas, runtime, theme);
  }
}

function drawField(ctx: CanvasRenderingContext2D, theme: CanvasTheme): void {
  const field = fieldRect();
  ctx.fillStyle = theme.fieldFill;
  ctx.fillRect(field.x, field.y, field.w, field.h);

  ctx.strokeStyle = theme.gridColor;
  ctx.lineWidth = 1;
  for (let x = 0; x <= FIELD_W; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, SCREEN_H);
    ctx.stroke();
  }
  for (let y = 0; y <= SCREEN_H; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD_W, y);
    ctx.stroke();
  }
}

function drawPath(ctx: CanvasRenderingContext2D, mapId: GameSnapshot["mapId"], theme: CanvasTheme): void {
  const pathPoints = getMapDefinition(mapId).pathPoints;
  if (pathPoints.length < 2) {
    return;
  }

  ctx.strokeStyle = theme.pathMain;
  ctx.lineWidth = PATH_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (theme.arcade) {
    applyGlow(ctx, theme.pathMain, 22);
  }

  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let i = 1; i < pathPoints.length; i += 1) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = theme.pathEdge;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let i = 1; i < pathPoints.length; i += 1) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }
  ctx.stroke();
}

function drawTowerPreview(
  ctx: CanvasRenderingContext2D,
  preview: TowerPreviewRenderState | null,
  theme: CanvasTheme,
): void {
  if (!preview) {
    return;
  }

  const rangeFill = preview.validPlacement ? (theme.arcade ? "rgba(70, 255, 188, 0.22)" : "rgba(92, 214, 132, 0.20)") : "rgba(255, 110, 145, 0.22)";
  const rangeStroke = preview.validPlacement ? (theme.arcade ? "#65ffe4" : "#99f0b8") : "#ff94be";

  ctx.save();
  ctx.fillStyle = rangeFill;
  ctx.beginPath();
  ctx.arc(preview.position.x, preview.position.y, preview.range, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = rangeStroke;
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 9]);
  if (theme.arcade) {
    applyGlow(ctx, rangeStroke, 15);
  }
  ctx.beginPath();
  ctx.arc(preview.position.x, preview.position.y, preview.range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  const stats = TOWER_TYPES[preview.tower];
  drawTowerBody(ctx, preview.position, stats.color, 0.76, theme);

  if (!preview.validPlacement) {
    ctx.strokeStyle = "#ff8db5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(preview.position.x - 16, preview.position.y - 16);
    ctx.lineTo(preview.position.x + 16, preview.position.y + 16);
    ctx.moveTo(preview.position.x + 16, preview.position.y - 16);
    ctx.lineTo(preview.position.x - 16, preview.position.y + 16);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEntities(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  for (const tower of snapshot.towers) {
    const stats = TOWER_TYPES[tower.towerType];
    drawTowerBody(ctx, tower.pos, stats.color, 1.0, theme);
  }

  for (const enemy of snapshot.enemies) {
    drawEnemy(ctx, enemy, runtime, theme);
  }

  for (const bullet of snapshot.bullets) {
    ctx.save();
    ctx.fillStyle = rgb(bullet.color);
    if (theme.arcade) {
      applyGlow(ctx, rgb(bullet.color), 14);
    }
    ctx.beginPath();
    ctx.arc(bullet.pos.x, bullet.pos.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawTowerBody(
  ctx: CanvasRenderingContext2D,
  pos: Point,
  color: [number, number, number],
  alpha: number,
  theme: CanvasTheme,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = theme.arcade ? "#100f1e" : "#151b22";
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rgb(color);
  if (theme.arcade) {
    applyGlow(ctx, rgb(color), 20);
  }
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 23, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = theme.arcade ? "#ffe96b" : "#f4f7ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: EnemySnapshot,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  ctx.save();
  ctx.fillStyle = rgb(enemy.color);
  if (theme.arcade) {
    applyGlow(ctx, rgb(enemy.color), enemy.enemyType === "boss" ? 22 : 10);
  }

  if (enemy.enemyType === "runner") {
    ctx.beginPath();
    ctx.moveTo(enemy.pos.x, enemy.pos.y - enemy.radius);
    ctx.lineTo(enemy.pos.x + enemy.radius, enemy.pos.y + enemy.radius * 0.8);
    ctx.lineTo(enemy.pos.x - enemy.radius, enemy.pos.y + enemy.radius * 0.8);
    ctx.closePath();
    ctx.fill();
  } else if (enemy.enemyType === "brute") {
    const size = enemy.radius * 1.8;
    ctx.fillRect(enemy.pos.x - size / 2, enemy.pos.y - size / 2, size, size);
  } else if (enemy.enemyType === "shield") {
    drawHex(ctx, enemy.pos.x, enemy.pos.y, enemy.radius * 1.12);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(enemy.pos.x, enemy.pos.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (enemy.enemyType === "boss") {
    drawBossAura(ctx, enemy, theme);
  }

  const barWidth = enemy.enemyType === "boss" ? 92 : 38;
  const barHeight = enemy.enemyType === "boss" ? 9 : 6;
  const x = enemy.pos.x - barWidth * 0.5;
  const y = enemy.pos.y - enemy.radius - (enemy.enemyType === "boss" ? 24 : 14);
  const hpRatio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));

  roundRect(ctx, { x, y, w: barWidth, h: barHeight }, 3, theme.arcade ? "#2c1139" : "#4f1d1d");
  roundRect(ctx, { x, y, w: barWidth * hpRatio, h: barHeight }, 3, theme.arcade ? "#5aff9f" : "#54c670");

  ctx.shadowBlur = 0;
  if (enemy.enemyType === "boss") {
    ctx.fillStyle = theme.textPrimary;
    ctx.font = "600 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(getBossName(runtime.language, enemy.bossStage), enemy.pos.x, y - 8);
  }

  ctx.restore();
}

function drawBossAura(ctx: CanvasRenderingContext2D, enemy: EnemySnapshot, theme: CanvasTheme): void {
  ctx.save();
  ctx.strokeStyle = theme.arcade ? "#fff46f" : "#f9fbff";
  ctx.lineWidth = 2;
  if (theme.arcade) {
    applyGlow(ctx, ctx.strokeStyle, 16);
  }

  const r = enemy.radius + 7;

  switch (enemy.bossShape) {
    case "square": {
      ctx.strokeRect(enemy.pos.x - r, enemy.pos.y - r, r * 2, r * 2);
      break;
    }
    case "diamond": {
      ctx.beginPath();
      ctx.moveTo(enemy.pos.x, enemy.pos.y - r);
      ctx.lineTo(enemy.pos.x + r, enemy.pos.y);
      ctx.lineTo(enemy.pos.x, enemy.pos.y + r);
      ctx.lineTo(enemy.pos.x - r, enemy.pos.y);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case "triangle": {
      ctx.beginPath();
      ctx.moveTo(enemy.pos.x, enemy.pos.y - r);
      ctx.lineTo(enemy.pos.x + r, enemy.pos.y + r);
      ctx.lineTo(enemy.pos.x - r, enemy.pos.y + r);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case "hex": {
      drawHex(ctx, enemy.pos.x, enemy.pos.y, r);
      ctx.stroke();
      break;
    }
    case "star": {
      for (let i = 0; i < 10; i += 1) {
        const angle = -Math.PI / 2 + i * (Math.PI / 5);
        const radius = i % 2 === 0 ? r : r * 0.42;
        const px = enemy.pos.x + Math.cos(angle) * radius;
        const py = enemy.pos.y + Math.sin(angle) * radius;
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case "spikes": {
      for (let i = 0; i < 8; i += 1) {
        const angle = i * (Math.PI / 4);
        const x1 = enemy.pos.x + Math.cos(angle) * (r - 6);
        const y1 = enemy.pos.y + Math.sin(angle) * (r - 6);
        const x2 = enemy.pos.x + Math.cos(angle) * (r + 8);
        const y2 = enemy.pos.y + Math.sin(angle) * (r + 8);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      break;
    }
    case "crown": {
      ctx.beginPath();
      ctx.moveTo(enemy.pos.x - r, enemy.pos.y + r * 0.5);
      ctx.lineTo(enemy.pos.x - r * 0.5, enemy.pos.y - r);
      ctx.lineTo(enemy.pos.x, enemy.pos.y - r * 0.2);
      ctx.lineTo(enemy.pos.x + r * 0.5, enemy.pos.y - r);
      ctx.lineTo(enemy.pos.x + r, enemy.pos.y + r * 0.5);
      ctx.stroke();
      break;
    }
    case "orb": {
      ctx.beginPath();
      ctx.arc(enemy.pos.x, enemy.pos.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(enemy.pos.x, enemy.pos.y, r - 7, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "skull": {
      ctx.beginPath();
      ctx.arc(enemy.pos.x, enemy.pos.y - 3, r, 0, Math.PI * 2);
      ctx.stroke();
      roundRect(
        ctx,
        { x: enemy.pos.x - r + 7, y: enemy.pos.y + 2, w: (r - 7) * 2, h: r },
        3,
        "transparent",
        theme.arcade ? "#fff46f" : "#f9fbff",
        2,
      );
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(enemy.pos.x, enemy.pos.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawSidebar(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  hitAreas: RenderHitAreas,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  const sidebar = sidebarRect();

  const sidebarGradient = ctx.createLinearGradient(sidebar.x, 0, sidebar.x + sidebar.w, SCREEN_H);
  sidebarGradient.addColorStop(0, theme.sidebarGradientFrom);
  sidebarGradient.addColorStop(1, theme.sidebarGradientTo);
  roundRect(ctx, sidebar, 0, sidebarGradient);

  ctx.strokeStyle = theme.sidebarDivider;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(FIELD_W, 0);
  ctx.lineTo(FIELD_W, SCREEN_H);
  ctx.stroke();

  const mode = runtime.uiMode;
  const layout = getSidebarLayoutConfig(mode);

  drawGameIconBadge(ctx, runtime.gameIcon, FIELD_W + SIDEBAR_W - 96, 16, mode === "compact" ? 58 : 66, theme);

  ctx.textAlign = "left";
  ctx.fillStyle = theme.textPrimary;
  ctx.font = mode === "compact" ? "700 40px Arial" : "700 46px Arial";
  ctx.fillText(runtime.text.runtime.sidebar.title, FIELD_W + 26, layout.titleY);

  const pauseButton: Rect = {
    x: FIELD_W + SIDEBAR_W - (mode === "compact" ? 188 : 218),
    y: mode === "compact" ? 18 : 22,
    w: mode === "compact" ? 78 : 88,
    h: mode === "compact" ? 38 : 44,
  };
  const pauseHovered = pointInRect(runtime.pointerWorld, pauseButton);
  roundRect(
    ctx,
    pauseButton,
    10,
    pauseHovered ? theme.buttonSecondaryHover : theme.buttonSecondary,
    theme.buttonSecondaryStroke,
    2,
  );
  if (theme.arcade) {
    applyGlow(ctx, theme.buttonSecondaryStroke, 10);
  }

  ctx.fillStyle = theme.textPrimary;
  ctx.textAlign = "center";
  ctx.font = mode === "compact" ? "700 24px Arial" : "700 26px Arial";
  ctx.fillText(runtime.pauseState ? "▶" : "II", pauseButton.x + pauseButton.w * 0.5, pauseButton.y + pauseButton.h * 0.68);
  ctx.shadowBlur = 0;
  hitAreas.pauseButton = pauseButton;

  drawSidebarInfo(ctx, snapshot, runtime, theme);
  drawSidebarWavePreview(ctx, snapshot, runtime, theme);

  for (let i = 0; i < TOWER_ORDER.length; i += 1) {
    const tower = TOWER_ORDER[i];
    const stats = TOWER_TYPES[tower];
    const card = towerCardRect(i, TOWER_ORDER.length, mode);
    const currentCost = snapshot.towerPrices[tower];

    const unlocked = snapshot.level >= stats.unlock;
    const affordable = snapshot.money >= currentCost;
    const selected = snapshot.selectedTowerName === tower;
    const hovered = pointInRect(runtime.pointerWorld, card);

    drawTowerCard(ctx, card, tower, currentCost, unlocked, affordable, selected, hovered, mode, runtime, theme);
    hitAreas.towerCards.push({ tower, rect: card });
  }

  drawSidebarControls(ctx, runtime, theme);

  const startWaveRect = startWaveButtonRect(mode);
  const canStart = !snapshot.waveActive && snapshot.wavePlan.length === 0;
  const hoveredStart = pointInRect(runtime.pointerWorld, startWaveRect);

  roundRect(
    ctx,
    startWaveRect,
    12,
    canStart
      ? hoveredStart
        ? theme.buttonPrimaryHover
        : theme.buttonPrimary
      : hoveredStart
        ? theme.buttonSecondaryHover
        : theme.buttonSecondary,
    canStart ? theme.buttonPrimaryStroke : theme.buttonSecondaryStroke,
    2,
  );

  if (theme.arcade) {
    applyGlow(ctx, canStart ? theme.buttonPrimaryStroke : theme.buttonSecondaryStroke, 12);
  }

  ctx.fillStyle = theme.textPrimary;
  ctx.font = mode === "compact" ? "700 23px Arial" : "700 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    canStart
      ? runtime.text.runtime.sidebar.startWave
      : interpolate(runtime.text.runtime.sidebar.waveRunning, {
          spawned: snapshot.spawnedThisWave,
          total: snapshot.totalWaveEnemies,
        }),
    startWaveRect.x + startWaveRect.w * 0.5,
    startWaveRect.y + (mode === "compact" ? 38 : 40),
  );

  ctx.shadowBlur = 0;
  hitAreas.startWaveButton = startWaveRect;
}

function drawSidebarInfo(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  const mode = runtime.uiMode;
  const layout = getSidebarLayoutConfig(mode);
  const infoRect = sidebarInfoRect(mode);
  roundRect(ctx, infoRect, 14, theme.cardFill, theme.cardStroke, 2);

  const selectedTower = snapshot.selectedTowerName ? TOWER_TYPES[snapshot.selectedTowerName] : null;
  const selectedTowerLabel = snapshot.selectedTowerName
    ? getTowerName(runtime.language, snapshot.selectedTowerName)
    : runtime.text.runtime.sidebar.none;
  const selectedDps = selectedTower ? `${formatTowerDps(selectedTower)} ${runtime.text.runtime.sidebar.dps}` : "-";
  const modeLabel = snapshot.mode === "sandbox" ? runtime.text.mode.sandboxTitle : runtime.text.mode.classicTitle;

  const lineX = infoRect.x + 14;
  const yStep = mode === "compact" ? 22 : 25;
  const yStart = infoRect.y + (mode === "compact" ? 28 : 34);
  const sidebarText = runtime.text.runtime.sidebar;

  drawInfoLine(
    ctx,
    sidebarText.rules,
    `${runtime.text.difficulty.labels[snapshot.difficultyName]} | ${modeLabel}`,
    lineX,
    yStart,
    layout.infoValueOffset,
    mode,
    theme,
  );
  drawInfoLine(
    ctx,
    sidebarText.map,
    getMapShortLabel(runtime.language, snapshot.mapId),
    lineX,
    yStart + yStep,
    layout.infoValueOffset,
    mode,
    theme,
  );
  drawInfoLine(
    ctx,
    sidebarText.level,
    `${Math.min(snapshot.level, snapshot.maxLevel)}/${snapshot.maxLevel}`,
    lineX,
    yStart + yStep * 2,
    layout.infoValueOffset,
    mode,
    theme,
  );
  drawInfoLine(ctx, sidebarText.lives, String(snapshot.lives), lineX, yStart + yStep * 3, layout.infoValueOffset, mode, theme);
  drawInfoLine(ctx, sidebarText.money, String(snapshot.money), lineX, yStart + yStep * 4, layout.infoValueOffset, mode, theme);
  drawInfoLine(ctx, sidebarText.selected, selectedTowerLabel, lineX, yStart + yStep * 5, layout.infoValueOffset, mode, theme);
  drawInfoLine(ctx, sidebarText.dps, selectedDps, lineX, yStart + yStep * 6, layout.infoValueOffset, mode, theme);
  drawInfoLine(
    ctx,
    sidebarText.speed,
    `${runtime.speedMultiplier.toFixed(1)}x`,
    lineX,
    yStart + yStep * 7,
    layout.infoValueOffset,
    mode,
    theme,
  );
}

function drawSidebarWavePreview(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  const mode = runtime.uiMode;
  const waveRect = sidebarWaveRect(mode);
  roundRect(ctx, waveRect, 12, theme.cardFill, theme.cardStroke, 2);

  ctx.fillStyle = theme.textSecondary;
  ctx.font = mode === "compact" ? "600 19px Arial" : "600 21px Arial";
  ctx.textAlign = "left";

  const enemyPreview = `${runtime.text.runtime.sidebar.nextWave} ${snapshot.nextWavePreview.count} | ${runtime.text.preview.basic}:${snapshot.nextWavePreview.basic} ${runtime.text.preview.runner}:${snapshot.nextWavePreview.runner} ${runtime.text.preview.brute}:${snapshot.nextWavePreview.brute} ${runtime.text.preview.shield}:${snapshot.nextWavePreview.shield}`;
  ctx.fillText(enemyPreview, waveRect.x + 10, waveRect.y + (mode === "compact" ? 32 : 34));

  ctx.fillText(
    `${runtime.text.runtime.sidebar.boss}: ${getBossName(runtime.language, snapshot.nextWavePreview.bossStage)}`,
    waveRect.x + 10,
    waveRect.y + (mode === "compact" ? 60 : 66),
  );
}

function drawTowerCard(
  ctx: CanvasRenderingContext2D,
  card: Rect,
  tower: TowerName,
  currentCost: number,
  unlocked: boolean,
  affordable: boolean,
  selected: boolean,
  hovered: boolean,
  mode: ResponsiveUIMode,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  const stats = TOWER_TYPES[tower];

  const baseFill = !unlocked
    ? theme.arcade
      ? "#291936"
      : "#30343a"
    : affordable
      ? theme.arcade
        ? "#102237"
        : "#24394f"
      : theme.arcade
        ? "#371425"
        : "#3c2f36";

  const hoverFill = !unlocked
    ? theme.arcade
      ? "#312042"
      : "#353a42"
    : affordable
      ? theme.arcade
        ? "#16314d"
        : "#2b4863"
      : theme.arcade
        ? "#4a1d33"
        : "#4b3a45";

  let fill = hovered ? hoverFill : baseFill;
  if (selected) {
    fill = theme.arcade ? (hovered ? "#0d4d5d" : "#0a4050") : hovered ? "#3f6d98" : "#365f86";
  }

  const border = selected
    ? theme.arcade
      ? "#3cfffc"
      : "#b6deff"
    : !unlocked
      ? theme.arcade
        ? "#9e7eb1"
        : "#6a727b"
      : affordable
        ? rgb(stats.color)
        : theme.arcade
          ? "#ff74b2"
          : "#c68f9b";

  roundRect(ctx, card, mode === "compact" ? 14 : 12, fill, border, selected ? 3 : 2);

  if (theme.arcade) {
    applyGlow(ctx, border, selected ? 16 : 9);
  }

  drawTowerGlyph(
    ctx,
    { x: card.x + card.w * 0.5, y: card.y + card.h * (mode === "compact" ? 0.43 : 0.39) },
    mode === "compact" ? 20 : 24,
    stats.color,
    TOWER_ICON_LABELS[tower],
    theme,
  );

  const costBadge: Rect = {
    x: card.x + 10,
    y: card.y + card.h - (mode === "compact" ? 34 : 38),
    w: card.w - 20,
    h: mode === "compact" ? 24 : 28,
  };

  const costFill = affordable ? (theme.arcade ? "rgba(35, 124, 77, 0.7)" : "rgba(32, 120, 72, 0.58)") : theme.arcade ? "rgba(145, 41, 84, 0.72)" : "rgba(128, 45, 52, 0.62)";
  roundRect(ctx, costBadge, 8, costFill);

  ctx.shadowBlur = 0;
  ctx.textAlign = "center";
  ctx.fillStyle = theme.textPrimary;
  ctx.font = mode === "compact" ? "700 16px Arial" : "700 18px Arial";
  ctx.fillText(
    `${runtime.text.runtime.tower.tooltip.cost} ${currentCost}`,
    costBadge.x + costBadge.w * 0.5,
    costBadge.y + costBadge.h * 0.68,
  );

  if (!unlocked) {
    ctx.fillStyle = theme.arcade ? "#ffe06e" : "#ffdd8d";
    ctx.font = mode === "compact" ? "600 13px Arial" : "600 14px Arial";
    ctx.fillText(`#${stats.unlock}`, card.x + card.w - 18, card.y + 20);
  }
}

function drawSidebarControls(
  ctx: CanvasRenderingContext2D,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  const mode = runtime.uiMode;
  const layout = getSidebarLayoutConfig(mode);

  ctx.fillStyle = theme.textMuted;
  ctx.font = mode === "compact" ? "500 14px Arial" : "500 15px Arial";
  ctx.textAlign = "left";

  if (mode === "compact") {
    ctx.fillText(runtime.text.runtime.sidebar.controlsCompactPrimary, FIELD_W + 26, layout.controlsPrimaryY);
    ctx.fillText(runtime.text.runtime.sidebar.controlsCompactSecondary, FIELD_W + 26, layout.controlsSecondaryY);
    return;
  }

  ctx.fillText(runtime.text.runtime.sidebar.controlsDesktopPrimary, FIELD_W + 30, layout.controlsPrimaryY);
  ctx.fillText(runtime.text.runtime.sidebar.controlsDesktopSecondary, FIELD_W + 30, layout.controlsSecondaryY);
}

function drawTowerTooltip(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  const tooltipState = runtime.tooltipState;
  if (!tooltipState) {
    return;
  }

  const tower = tooltipState.tower;
  const stats = TOWER_TYPES[tower];
  const currentCost = snapshot.towerPrices[tower];
  const tooltipSize = runtime.uiMode === "compact" ? { w: 356, h: 196 } : { w: 374, h: 210 };

  const pos = resolveTooltipPlacement(
    tooltipState.anchor,
    { x: 0, y: 0, w: SCREEN_W, h: SCREEN_H },
    tooltipSize,
    { margin: 16, offset: 14, preferAbove: runtime.uiMode !== "compact" },
  );

  roundRect(ctx, { x: pos.x, y: pos.y, w: tooltipSize.w, h: tooltipSize.h }, 14, theme.tooltipFill, theme.tooltipStroke, 2);
  if (theme.arcade) {
    applyGlow(ctx, theme.tooltipStroke, 18);
  }

  drawTowerGlyph(ctx, { x: pos.x + 24, y: pos.y + 30 }, 16, stats.color, TOWER_ICON_LABELS[tower], theme);

  ctx.textAlign = "left";
  ctx.fillStyle = theme.textPrimary;
  ctx.font = "700 22px Arial";
  ctx.fillText(getTowerName(runtime.language, tower), pos.x + 50, pos.y + 32);

  ctx.fillStyle = theme.textSecondary;
  ctx.font = "600 17px Arial";
  ctx.fillText(`${runtime.text.runtime.tower.tooltip.cost} ${currentCost}`, pos.x + 16, pos.y + 64);
  ctx.fillText(`${runtime.text.runtime.tower.tooltip.dps} ${formatTowerDps(stats)}`, pos.x + 142, pos.y + 64);
  ctx.fillText(`${runtime.text.runtime.tower.tooltip.range} ${Math.round(stats.range)}`, pos.x + 258, pos.y + 64);

  ctx.fillStyle = theme.textPrimary;
  ctx.font = "500 16px Arial";
  ctx.fillText(getTowerDescription(runtime.language, tower), pos.x + 16, pos.y + 94);

  ctx.fillStyle = theme.textSecondary;
  ctx.font = "500 15px Arial";
  ctx.fillText(`${runtime.text.runtime.tower.tooltip.special}: ${formatTowerSpecialLine(runtime, tower)}`, pos.x + 16, pos.y + 122);

  if (snapshot.level < stats.unlock) {
    ctx.fillStyle = theme.textAccent;
    ctx.font = "500 14px Arial";
    ctx.fillText(
      interpolate(runtime.text.runtime.tower.tooltip.unlockAtLevel, { level: stats.unlock }),
      pos.x + 16,
      pos.y + 146,
    );
  }

  ctx.fillStyle = theme.textMuted;
  ctx.font = "500 14px Arial";
  ctx.fillText(
    tooltipState.source === "touch" ? runtime.text.runtime.tower.tooltip.tapHint : runtime.text.runtime.tower.tooltip.hoverHint,
    pos.x + 16,
    pos.y + tooltipSize.h - 14,
  );

  ctx.shadowBlur = 0;
}

function drawPauseOverlay(
  ctx: CanvasRenderingContext2D,
  hitAreas: RenderHitAreas,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  const pauseState = runtime.pauseState;
  if (!pauseState) {
    return;
  }

  ctx.fillStyle = theme.arcade ? "rgba(6, 0, 18, 0.72)" : "rgba(8, 12, 18, 0.68)";
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const compact = runtime.uiMode === "compact";
  const panel = centeredRect(compact ? 560 : 640, compact ? 360 : 380, -12);
  roundRect(ctx, panel, 18, theme.panelFill, theme.panelBorder, 2);

  ctx.textAlign = "center";
  ctx.fillStyle = theme.textPrimary;
  ctx.font = compact ? "700 48px Arial" : "700 56px Arial";
  ctx.fillText(runtime.text.runtime.pause.title, SCREEN_W * 0.5, panel.y + (compact ? 84 : 92));

  if (!pauseState.confirmAction) {
    ctx.fillStyle = theme.textSecondary;
    ctx.font = compact ? "500 22px Arial" : "500 24px Arial";
    ctx.fillText(runtime.text.runtime.pause.subtitle, SCREEN_W * 0.5, panel.y + (compact ? 124 : 136));

    const resumeButton: Rect = {
      x: panel.x + 48,
      y: panel.y + (compact ? 172 : 186),
      w: panel.w - 96,
      h: compact ? 56 : 62,
    };
    const restartButton: Rect = {
      x: panel.x + 48,
      y: resumeButton.y + resumeButton.h + 14,
      w: panel.w - 96,
      h: compact ? 56 : 62,
    };
    const menuButton: Rect = {
      x: panel.x + 48,
      y: restartButton.y + restartButton.h + 14,
      w: panel.w - 96,
      h: compact ? 56 : 62,
    };

    drawActionButton(ctx, resumeButton, runtime.text.runtime.pause.resume, theme.buttonPrimary, theme.buttonPrimaryHover, theme.buttonPrimaryStroke, runtime.pointerWorld, theme);
    drawActionButton(ctx, restartButton, runtime.text.runtime.pause.restart, theme.buttonDanger, theme.buttonDangerHover, theme.buttonDangerStroke, runtime.pointerWorld, theme);
    drawActionButton(ctx, menuButton, runtime.text.runtime.pause.menu, theme.buttonSecondary, theme.buttonSecondaryHover, theme.buttonSecondaryStroke, runtime.pointerWorld, theme);

    hitAreas.pauseResumeButton = resumeButton;
    hitAreas.pauseRestartButton = restartButton;
    hitAreas.pauseMenuButton = menuButton;
    return;
  }

  const isRestart = pauseState.confirmAction === "restart";
  const confirmTitle = isRestart
    ? runtime.text.runtime.pause.restartConfirmTitle
    : runtime.text.runtime.pause.menuConfirmTitle;

  ctx.fillStyle = theme.textSecondary;
  ctx.font = compact ? "600 28px Arial" : "600 31px Arial";
  ctx.fillText(confirmTitle, SCREEN_W * 0.5, panel.y + (compact ? 146 : 158));

  ctx.fillStyle = theme.textMuted;
  ctx.font = compact ? "500 20px Arial" : "500 22px Arial";
  ctx.fillText(runtime.text.runtime.pause.confirmBody, SCREEN_W * 0.5, panel.y + (compact ? 186 : 202));

  const cancelButton: Rect = {
    x: panel.x + 58,
    y: panel.y + (compact ? 236 : 252),
    w: panel.w - 116,
    h: compact ? 56 : 62,
  };
  const confirmButton: Rect = {
    x: panel.x + 58,
    y: cancelButton.y + cancelButton.h + 14,
    w: panel.w - 116,
    h: compact ? 56 : 62,
  };

  drawActionButton(ctx, cancelButton, runtime.text.runtime.pause.cancel, theme.buttonSecondary, theme.buttonSecondaryHover, theme.buttonSecondaryStroke, runtime.pointerWorld, theme);
  drawActionButton(ctx, confirmButton, runtime.text.runtime.pause.confirm, theme.buttonPrimary, theme.buttonPrimaryHover, theme.buttonPrimaryStroke, runtime.pointerWorld, theme);

  hitAreas.pauseConfirmCancelButton = cancelButton;
  hitAreas.pauseConfirmAcceptButton = confirmButton;
}

function drawEndOverlay(
  ctx: CanvasRenderingContext2D,
  screen: PrototypeScreen,
  hitAreas: RenderHitAreas,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  ctx.fillStyle = theme.endBackdrop;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const panel = centeredRect(720, 370, -20);
  roundRect(ctx, panel, 20, theme.panelFill, theme.panelBorder, 2);

  ctx.textAlign = "center";
  ctx.fillStyle = screen === "victory" ? (theme.arcade ? "#63ffb1" : "#7df0a0") : theme.arcade ? "#ff8ac7" : "#ff8f8f";
  ctx.font = "700 72px Arial";
  ctx.fillText(screen === "victory" ? runtime.text.runtime.endOverlay.victory : runtime.text.runtime.endOverlay.gameOver, SCREEN_W * 0.5, panel.y + 110);

  ctx.fillStyle = theme.textSecondary;
  ctx.font = "500 28px Arial";
  ctx.fillText(runtime.text.runtime.endOverlay.prompt, SCREEN_W * 0.5, panel.y + 164);

  const restartButton: Rect = { x: panel.x + 90, y: panel.y + 230, w: 240, h: 72 };
  const menuButton: Rect = { x: panel.x + panel.w - 330, y: panel.y + 230, w: 240, h: 72 };

  drawActionButton(
    ctx,
    restartButton,
    runtime.text.runtime.endOverlay.restart,
    theme.buttonPrimary,
    theme.buttonPrimaryHover,
    theme.buttonPrimaryStroke,
    runtime.pointerWorld,
    theme,
  );
  drawActionButton(
    ctx,
    menuButton,
    runtime.text.runtime.endOverlay.mainMenu,
    theme.buttonSecondary,
    theme.buttonSecondaryHover,
    theme.buttonSecondaryStroke,
    runtime.pointerWorld,
    theme,
  );

  hitAreas.restartButton = restartButton;
  hitAreas.menuButton = menuButton;
}

function drawTopMessage(ctx: CanvasRenderingContext2D, message: string, theme: CanvasTheme): void {
  if (!message) {
    return;
  }

  const box: Rect = { x: 28, y: 20, w: 860, h: 52 };
  roundRect(ctx, box, 11, theme.messageFill, theme.messageStroke, 2);

  if (theme.arcade) {
    applyGlow(ctx, theme.messageStroke, 12);
  }

  ctx.fillStyle = theme.textPrimary;
  ctx.textAlign = "left";
  ctx.font = "600 24px Arial";
  ctx.fillText(message, box.x + 14, box.y + 34);
  ctx.shadowBlur = 0;
}

function drawDebugHud(
  ctx: CanvasRenderingContext2D,
  runtime: RuntimeRenderState,
  theme: CanvasTheme,
): void {
  const metrics = runtime.debug;
  if (!metrics) {
    return;
  }

  const box: Rect = { x: 24, y: 84, w: 410, h: 124 };
  roundRect(
    ctx,
    box,
    10,
    theme.arcade ? "rgba(8, 4, 28, 0.9)" : "rgba(15, 24, 36, 0.88)",
    theme.arcade ? "#53ffe8" : "#9fc6ed",
    2,
  );

  if (theme.arcade) {
    applyGlow(ctx, "#53ffe8", 10);
  }

  const labels = runtime.text.runtime.debug;
  ctx.textAlign = "left";
  ctx.fillStyle = theme.textPrimary;
  ctx.font = "700 18px Arial";
  ctx.fillText(labels.title, box.x + 12, box.y + 24);

  ctx.fillStyle = theme.textSecondary;
  ctx.font = "500 16px Arial";
  ctx.fillText(
    `${labels.fps}: ${metrics.fps.toFixed(1)} | ${labels.frameMs}: ${metrics.frameMs.toFixed(2)} | ${labels.simMs}: ${metrics.simMs.toFixed(2)}`,
    box.x + 12,
    box.y + 52,
  );
  ctx.fillText(
    `${labels.towers}: ${metrics.towers} | ${labels.enemies}: ${metrics.enemies} | ${labels.bullets}: ${metrics.bullets}`,
    box.x + 12,
    box.y + 78,
  );
  ctx.fillText(
    `${labels.wave}: ${metrics.waveSpawned}/${metrics.waveTotal} | ${labels.remaining}: ${metrics.waveRemaining}`,
    box.x + 12,
    box.y + 104,
  );

  ctx.shadowBlur = 0;
}

function drawInfoLine(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  valueOffset: number,
  mode: ResponsiveUIMode,
  theme: CanvasTheme,
): void {
  ctx.textAlign = "left";
  ctx.fillStyle = theme.textMuted;
  ctx.font = mode === "compact" ? "500 16px Arial" : "500 18px Arial";
  ctx.fillText(`${label}:`, x, y);

  ctx.fillStyle = theme.textPrimary;
  ctx.font = mode === "compact" ? "700 19px Arial" : "700 22px Arial";
  ctx.fillText(value, x + valueOffset, y);
}

function drawActionButton(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  label: string,
  fill: string,
  hoverFill: string,
  stroke: string,
  pointerWorld: Point,
  theme: CanvasTheme,
): void {
  const hovered = pointInRect(pointerWorld, rect);
  roundRect(ctx, rect, 12, hovered ? hoverFill : fill, stroke, 2);

  if (theme.arcade) {
    applyGlow(ctx, stroke, 12);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, rect.x + rect.w * 0.5, rect.y + rect.h * 0.64);

  ctx.shadowBlur = 0;
}

function drawGameIconBadge(
  ctx: CanvasRenderingContext2D,
  icon: CanvasImageSource | null,
  x: number,
  y: number,
  size: number,
  theme: CanvasTheme,
): void {
  roundRect(
    ctx,
    { x: x - 6, y: y - 6, w: size + 12, h: size + 12 },
    14,
    theme.arcade ? "#1f0f32" : "#1f2d3f",
    theme.arcade ? "#4df8ff" : "#98bee6",
    2,
  );

  if (icon) {
    ctx.drawImage(icon, x, y, size, size);
    return;
  }

  ctx.save();
  const cx = x + size * 0.5;
  const cy = y + size * 0.5;

  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, theme.arcade ? "#29124a" : "#1b2e45");
  grad.addColorStop(1, theme.arcade ? "#11213f" : "#132337");
  roundRect(ctx, { x, y, w: size, h: size }, 10, grad);

  ctx.strokeStyle = theme.arcade ? "#ffe668" : "#d1b67b";
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.16, y + size * 0.25);
  ctx.lineTo(x + size * 0.7, y + size * 0.25);
  ctx.lineTo(x + size * 0.7, y + size * 0.74);
  ctx.lineTo(x + size * 0.3, y + size * 0.74);
  ctx.stroke();

  ctx.fillStyle = theme.arcade ? "#32efff" : "#79b6ff";
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.19, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f2f6ff";
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + size * 0.2, cy - size * 0.2);
  ctx.stroke();

  ctx.restore();
}

function formatTowerSpecialLine(runtime: RuntimeRenderState, tower: TowerName): string {
  const stats = TOWER_TYPES[tower];
  const base = getTowerSpecial(runtime.language, tower);

  if (tower === "Stunner") {
    const slow = stats.slowFactor ? Math.round((1 - stats.slowFactor) * 100) : 0;
    return `${base} (${slow}% / ${stats.slowDuration?.toFixed(1) ?? "0.0"}s)`;
  }
  if (tower === "Bombarman" || tower === "Panzer-Tower") {
    return `${base} (${Math.round(stats.splashRadius ?? 0)})`;
  }
  return base;
}

function createCanvasTheme(designMode: DesignMode): CanvasTheme {
  const arcade = designMode === "arcade";
  if (arcade) {
    return {
      arcade: true,
      frameBackground: "#060011",
      startGradientFrom: "#1b0138",
      startGradientTo: "#05193b",
      panelFill: "rgba(12, 5, 30, 0.96)",
      panelBorder: "#31f5ff",
      fieldFill: "#13152d",
      gridColor: "rgba(78, 244, 255, 0.18)",
      pathMain: "#ff4fe5",
      pathEdge: "#ffe86a",
      sidebarGradientFrom: "#180336",
      sidebarGradientTo: "#081f42",
      sidebarDivider: "#2bf7ff",
      textPrimary: "#f9fbff",
      textSecondary: "#c9f2ff",
      textMuted: "#a9c5eb",
      textAccent: "#ffe86a",
      cardFill: "rgba(20, 8, 45, 0.92)",
      cardStroke: "#ff4fe5",
      tooltipFill: "rgba(8, 3, 30, 0.97)",
      tooltipStroke: "#33f7ff",
      endBackdrop: "rgba(8, 0, 18, 0.74)",
      messageFill: "rgba(19, 7, 40, 0.94)",
      messageStroke: "#53ffe8",
      buttonPrimary: "#006f8a",
      buttonPrimaryHover: "#0086a4",
      buttonPrimaryStroke: "#34fdff",
      buttonSecondary: "#3b1b58",
      buttonSecondaryHover: "#4d2870",
      buttonSecondaryStroke: "#ff5fe8",
      buttonDanger: "#7e2a5a",
      buttonDangerHover: "#9a386e",
      buttonDangerStroke: "#ff89cb",
    };
  }

  return {
    arcade: false,
    frameBackground: "#0a1016",
    startGradientFrom: "#15263a",
    startGradientTo: "#173145",
    panelFill: "#0f1824",
    panelBorder: "#4a6686",
    fieldFill: "#21362e",
    gridColor: "#2f4a40",
    pathMain: "#cbb37a",
    pathEdge: "#7f6a3f",
    sidebarGradientFrom: "#152332",
    sidebarGradientTo: "#192e42",
    sidebarDivider: "#3f5b77",
    textPrimary: "#f2f7ff",
    textSecondary: "#dce8f7",
    textMuted: "#9ab4ce",
    textAccent: "#ffdd8d",
    cardFill: "#223548",
    cardStroke: "#4b6988",
    tooltipFill: "rgba(11, 17, 26, 0.97)",
    tooltipStroke: "#79a4cf",
    endBackdrop: "rgba(8, 12, 18, 0.72)",
    messageFill: "#0f1824",
    messageStroke: "#f4f8ff",
    buttonPrimary: "#236ed8",
    buttonPrimaryHover: "#3280f3",
    buttonPrimaryStroke: "#c5deff",
    buttonSecondary: "#3e4a59",
    buttonSecondaryHover: "#536171",
    buttonSecondaryStroke: "#c5deff",
    buttonDanger: "#7f3232",
    buttonDangerHover: "#914242",
    buttonDangerStroke: "#df9292",
  };
}

function applyGlow(ctx: CanvasRenderingContext2D, color: string, blur: number): void {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }, template);
}

function drawHex(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  for (let i = 0; i < 6; i += 1) {
    const angle = -Math.PI / 2 + i * (Math.PI / 3);
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.beginPath();
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  fill: string | CanvasGradient,
  stroke?: string,
  strokeWidth = 1,
): void {
  ctx.beginPath();
  ctx.moveTo(rect.x + radius, rect.y);
  ctx.lineTo(rect.x + rect.w - radius, rect.y);
  ctx.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + radius);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h - radius);
  ctx.quadraticCurveTo(rect.x + rect.w, rect.y + rect.h, rect.x + rect.w - radius, rect.y + rect.h);
  ctx.lineTo(rect.x + radius, rect.y + rect.h);
  ctx.quadraticCurveTo(rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - radius);
  ctx.lineTo(rect.x, rect.y + radius);
  ctx.quadraticCurveTo(rect.x, rect.y, rect.x + radius, rect.y);
  ctx.closePath();

  ctx.fillStyle = fill;
  ctx.fill();

  if (stroke) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawTowerGlyph(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  color: [number, number, number],
  label: string,
  theme: CanvasTheme,
): void {
  ctx.fillStyle = theme.arcade ? "#120923" : "#111821";
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius + 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rgb(color);
  if (theme.arcade) {
    applyGlow(ctx, rgb(color), 18);
  }
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f1f6ff";
  ctx.font = "700 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, center.x, center.y + 5);
}

function rgb(color: [number, number, number]): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}
