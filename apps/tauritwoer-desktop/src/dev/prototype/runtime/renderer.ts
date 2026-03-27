import { FIELD_W, GRID_SIZE, PATH_WIDTH, SCREEN_H, SCREEN_W, SIDEBAR_W } from "../data/constants";
import { getMapDefinition } from "../data/maps";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../data/difficulties";
import {
  TOWER_DESCRIPTIONS,
  TOWER_ICON_LABELS,
  TOWER_ORDER,
  TOWER_SHORT_LABELS,
  TOWER_TYPES,
} from "../data/towers";
import type { DifficultyName, EnemySnapshot, GameSnapshot, Point, TowerName } from "../types";
import { difficultyLabel } from "./input";
import {
  centeredRect,
  fieldRect,
  pointInRect,
  sidebarInfoRect,
  sidebarRect,
  sidebarWaveRect,
  startWaveButtonRect,
  towerCardRect,
  towerInfoButtonRect,
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

export interface RuntimeRenderState {
  pointerWorld: Point;
  speedMultiplier: number;
  towerPreview: TowerPreviewRenderState | null;
  gameIcon: CanvasImageSource | null;
  uiMode: ResponsiveUIMode;
  tooltipState: TowerTooltipRenderState | null;
}

export interface RenderHitAreas {
  startButton?: Rect;
  difficultyButtons: DifficultyHit[];
  towerCards: TowerHit[];
  towerInfoButtons: TowerHit[];
  startWaveButton?: Rect;
  restartButton?: Rect;
  menuButton?: Rect;
}

export function renderPrototypeFrame(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  screen: PrototypeScreen,
  snapshot: GameSnapshot,
  runtime: RuntimeRenderState,
): RenderHitAreas {
  const hitAreas: RenderHitAreas = {
    difficultyButtons: [],
    towerCards: [],
    towerInfoButtons: [],
  };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#0a1016";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  ctx.save();
  ctx.translate(viewport.offsetX, viewport.offsetY);
  ctx.scale(viewport.scale, viewport.scale);

  if (screen === "start") {
    drawStartScreen(ctx, hitAreas, runtime.gameIcon, runtime.pointerWorld, runtime.uiMode);
    ctx.restore();
    return hitAreas;
  }

  if (screen === "difficulty") {
    drawDifficultyScreen(ctx, hitAreas, runtime.pointerWorld, runtime.uiMode);
    ctx.restore();
    return hitAreas;
  }

  drawGameScene(ctx, snapshot, hitAreas, runtime);

  if (screen === "game_over" || screen === "victory") {
    drawEndOverlay(ctx, screen, hitAreas, runtime.pointerWorld);
  }

  ctx.restore();
  return hitAreas;
}

function drawStartScreen(
  ctx: CanvasRenderingContext2D,
  hitAreas: RenderHitAreas,
  gameIcon: CanvasImageSource | null,
  pointerWorld: Point,
  uiMode: ResponsiveUIMode,
): void {
  const gradient = ctx.createLinearGradient(0, 0, SCREEN_W, SCREEN_H);
  gradient.addColorStop(0, "#15263a");
  gradient.addColorStop(1, "#173145");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const compact = uiMode === "compact";
  const panel = centeredRect(compact ? 820 : 940, compact ? 500 : 540, compact ? -10 : -24);
  roundRect(ctx, panel, 24, "#0f1824", "#4a6686", 2);

  drawGameIconBadge(ctx, gameIcon, panel.x + 30, panel.y + 30, compact ? 100 : 122);

  ctx.fillStyle = "#f1f6ff";
  ctx.font = compact ? "700 62px Arial" : "700 80px Arial";
  ctx.textAlign = "center";
  ctx.fillText("TauriTwoer Defense", SCREEN_W * 0.5 + 6, panel.y + (compact ? 124 : 136));

  ctx.font = compact ? "500 28px Arial" : "500 32px Arial";
  ctx.fillStyle = "#b7c9de";
  ctx.fillText("Canvas Prototype in Tauri + TypeScript", SCREEN_W * 0.5, panel.y + (compact ? 184 : 206));

  const features = [
    "Responsive Desktop + Compact Sidebar",
    "Wave Formula: ceil(level * multiplier)",
    "Boss every 10 levels",
    "Panzer-Tower as late power spike",
  ];

  ctx.font = compact ? "500 24px Arial" : "500 29px Arial";
  features.forEach((line, index) => {
    ctx.fillText(line, SCREEN_W * 0.5, panel.y + (compact ? 246 : 284) + index * (compact ? 46 : 50));
  });

  const startButton = centeredRect(compact ? 340 : 430, compact ? 84 : 92, compact ? 214 : 230);
  const hovered = pointInRect(pointerWorld, startButton);
  roundRect(
    ctx,
    startButton,
    16,
    hovered ? "#3d96ff" : "#2a81ff",
    hovered ? "#d5e9ff" : "#b8d9ff",
    3,
  );
  ctx.fillStyle = "#ffffff";
  ctx.font = compact ? "700 38px Arial" : "700 42px Arial";
  ctx.fillText("Start", startButton.x + startButton.w * 0.5, startButton.y + (compact ? 55 : 60));

  hitAreas.startButton = startButton;
}

function drawDifficultyScreen(
  ctx: CanvasRenderingContext2D,
  hitAreas: RenderHitAreas,
  pointerWorld: Point,
  uiMode: ResponsiveUIMode,
): void {
  const gradient = ctx.createLinearGradient(0, 0, SCREEN_W, SCREEN_H);
  gradient.addColorStop(0, "#112130");
  gradient.addColorStop(1, "#1b3345");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const compact = uiMode === "compact";
  ctx.textAlign = "center";
  ctx.fillStyle = "#eef4ff";
  ctx.font = compact ? "700 62px Arial" : "700 74px Arial";
  ctx.fillText("Select Difficulty", SCREEN_W * 0.5, compact ? 148 : 164);

  const buttonWidth = compact ? 560 : 620;
  const buttonHeight = compact ? 104 : 118;
  const startY = compact ? 218 : 244;

  DIFFICULTY_ORDER.forEach((difficulty, index) => {
    const rect: Rect = {
      x: (SCREEN_W - buttonWidth) * 0.5,
      y: startY + index * (buttonHeight + 18),
      w: buttonWidth,
      h: buttonHeight,
    };

    const hovered = pointInRect(pointerWorld, rect);
    roundRect(
      ctx,
      rect,
      16,
      hovered ? "#24374b" : "#1a2b3d",
      hovered ? "#9cc7ef" : "#75a4d6",
      3,
    );
    ctx.fillStyle = "#f4f8ff";
    ctx.font = compact ? "700 34px Arial" : "700 39px Arial";
    ctx.fillText(difficultyLabel(difficulty), rect.x + rect.w * 0.5, rect.y + (compact ? 46 : 52));

    ctx.fillStyle = "#9fc1e4";
    ctx.font = compact ? "500 22px Arial" : "500 24px Arial";
    ctx.fillText(
      `Spawn multiplier x${DIFFICULTIES[difficulty].countMult.toFixed(1)}`,
      rect.x + rect.w * 0.5,
      rect.y + (compact ? 78 : 86),
    );

    hitAreas.difficultyButtons.push({ difficulty, rect });
  });
}

function drawGameScene(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  hitAreas: RenderHitAreas,
  runtime: RuntimeRenderState,
): void {
  drawField(ctx);
  drawPath(ctx, snapshot.mapId);
  drawTowerPreview(ctx, runtime.towerPreview);
  drawEntities(ctx, snapshot);
  drawSidebar(ctx, snapshot, hitAreas, runtime);

  if (runtime.uiMode === "compact" && runtime.tooltipState) {
    drawCompactTowerTooltip(ctx, runtime.tooltipState);
  }

  drawTopMessage(ctx, snapshot.message);
}

function drawField(ctx: CanvasRenderingContext2D): void {
  const field = fieldRect();
  ctx.fillStyle = "#21362e";
  ctx.fillRect(field.x, field.y, field.w, field.h);

  ctx.strokeStyle = "#2f4a40";
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

function drawPath(ctx: CanvasRenderingContext2D, mapId: GameSnapshot["mapId"]): void {
  const pathPoints = getMapDefinition(mapId).pathPoints;
  if (pathPoints.length < 2) {
    return;
  }

  ctx.strokeStyle = "#cbb37a";
  ctx.lineWidth = PATH_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let i = 1; i < pathPoints.length; i += 1) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }
  ctx.stroke();

  ctx.strokeStyle = "#7f6a3f";
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
): void {
  if (!preview) {
    return;
  }

  const rangeFill = preview.validPlacement ? "rgba(92, 214, 132, 0.20)" : "rgba(228, 102, 102, 0.20)";
  const rangeStroke = preview.validPlacement ? "#99f0b8" : "#ffb1b1";

  ctx.save();
  ctx.fillStyle = rangeFill;
  ctx.beginPath();
  ctx.arc(preview.position.x, preview.position.y, preview.range, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = rangeStroke;
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 9]);
  ctx.beginPath();
  ctx.arc(preview.position.x, preview.position.y, preview.range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const stats = TOWER_TYPES[preview.tower];
  drawTowerBody(ctx, preview.position, stats.color, 0.7);

  if (!preview.validPlacement) {
    ctx.strokeStyle = "#ffb1b1";
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

function drawEntities(ctx: CanvasRenderingContext2D, snapshot: GameSnapshot): void {
  for (const tower of snapshot.towers) {
    const stats = TOWER_TYPES[tower.towerType];
    drawTowerBody(ctx, tower.pos, stats.color, 1.0);
  }

  for (const enemy of snapshot.enemies) {
    drawEnemy(ctx, enemy);
  }

  for (const bullet of snapshot.bullets) {
    ctx.fillStyle = rgb(bullet.color);
    ctx.beginPath();
    ctx.arc(bullet.pos.x, bullet.pos.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTowerBody(
  ctx: CanvasRenderingContext2D,
  pos: Point,
  color: [number, number, number],
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = "#151b22";
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rgb(color);
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 23, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f4f7ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemySnapshot): void {
  ctx.fillStyle = rgb(enemy.color);

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
    drawBossAura(ctx, enemy);
  }

  const barWidth = enemy.enemyType === "boss" ? 92 : 38;
  const barHeight = enemy.enemyType === "boss" ? 9 : 6;
  const x = enemy.pos.x - barWidth * 0.5;
  const y = enemy.pos.y - enemy.radius - (enemy.enemyType === "boss" ? 24 : 14);
  const hpRatio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));

  roundRect(ctx, { x, y, w: barWidth, h: barHeight }, 3, "#4f1d1d");
  roundRect(ctx, { x, y, w: barWidth * hpRatio, h: barHeight }, 3, "#54c670");

  if (enemy.enemyType === "boss") {
    ctx.fillStyle = "#f4f7ff";
    ctx.font = "600 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(enemy.bossName, enemy.pos.x, y - 8);
  }
}

function drawBossAura(ctx: CanvasRenderingContext2D, enemy: EnemySnapshot): void {
  ctx.save();
  ctx.strokeStyle = "#f9fbff";
  ctx.lineWidth = 2;
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
        "#f9fbff",
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
): void {
  const sidebar = sidebarRect();

  const sidebarGradient = ctx.createLinearGradient(sidebar.x, 0, sidebar.x + sidebar.w, SCREEN_H);
  sidebarGradient.addColorStop(0, "#152332");
  sidebarGradient.addColorStop(1, "#192e42");
  roundRect(ctx, sidebar, 0, sidebarGradient);

  ctx.strokeStyle = "#3f5b77";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(FIELD_W, 0);
  ctx.lineTo(FIELD_W, SCREEN_H);
  ctx.stroke();

  const mode = runtime.uiMode;
  const layout = getSidebarLayoutConfig(mode);

  drawGameIconBadge(ctx, runtime.gameIcon, FIELD_W + SIDEBAR_W - 96, 16, mode === "compact" ? 58 : 66);

  ctx.textAlign = "left";
  ctx.fillStyle = "#f2f7ff";
  ctx.font = mode === "compact" ? "700 40px Arial" : "700 46px Arial";
  ctx.fillText("Tower Defense", FIELD_W + 26, layout.titleY);

  drawSidebarInfo(ctx, snapshot, runtime.speedMultiplier, mode);
  drawSidebarWavePreview(ctx, snapshot, mode);

  for (let i = 0; i < TOWER_ORDER.length; i += 1) {
    const tower = TOWER_ORDER[i];
    const stats = TOWER_TYPES[tower];
    const card = towerCardRect(i, TOWER_ORDER.length, mode);

    const unlocked = snapshot.level >= stats.unlock;
    const affordable = snapshot.money >= stats.cost;
    const selected = snapshot.selectedTowerName === tower;
    const hovered = pointInRect(runtime.pointerWorld, card);

    if (mode === "compact") {
      drawCompactTowerCard(ctx, card, tower, unlocked, affordable, selected, hovered);
      const infoRect = towerInfoButtonRect(card, mode);
      drawCompactInfoButton(ctx, infoRect, tower, runtime.tooltipState, hovered);
      hitAreas.towerInfoButtons.push({ tower, rect: infoRect });
    } else {
      drawDesktopTowerCard(ctx, card, tower, unlocked, affordable, selected, hovered);
    }

    hitAreas.towerCards.push({ tower, rect: card });
  }

  drawSidebarControls(ctx, mode);

  const startWaveRect = startWaveButtonRect(mode);
  const canStart = !snapshot.waveActive && snapshot.wavePlan.length === 0;
  const hoveredStart = pointInRect(runtime.pointerWorld, startWaveRect);

  roundRect(
    ctx,
    startWaveRect,
    12,
    canStart ? (hoveredStart ? "#25a668" : "#1f8c58") : hoveredStart ? "#43688a" : "#355572",
    canStart ? "#b4ffd9" : "#7398bc",
    2,
  );
  ctx.fillStyle = "#f2f7ff";
  ctx.font = mode === "compact" ? "700 23px Arial" : "700 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    canStart ? "Start Wave" : `Wave Running (${snapshot.spawnedThisWave}/${snapshot.totalWaveEnemies})`,
    startWaveRect.x + startWaveRect.w * 0.5,
    startWaveRect.y + (mode === "compact" ? 38 : 40),
  );

  hitAreas.startWaveButton = startWaveRect;
}

function drawSidebarInfo(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  speedMultiplier: number,
  mode: ResponsiveUIMode,
): void {
  const layout = getSidebarLayoutConfig(mode);
  const infoRect = sidebarInfoRect(mode);
  roundRect(ctx, infoRect, 14, "#223548", "#4b6988", 2);

  const selectedTower = snapshot.selectedTowerName ? TOWER_TYPES[snapshot.selectedTowerName] : null;
  const selectedDps = selectedTower ? formatTowerDps(selectedTower) + " DPS" : "-";
  const mapLabel = getMapDefinition(snapshot.mapId).shortLabel;

  const lineX = infoRect.x + 14;
  const yStep = mode === "compact" ? 22 : 25;
  const yStart = infoRect.y + (mode === "compact" ? 28 : 34);

  drawInfoLine(
    ctx,
    "Rules",
    difficultyLabel(snapshot.difficultyName) + " | " + snapshot.mode,
    lineX,
    yStart,
    layout.infoValueOffset,
    mode,
  );
  drawInfoLine(ctx, "Map", mapLabel, lineX, yStart + yStep, layout.infoValueOffset, mode);
  drawInfoLine(
    ctx,
    "Level",
    String(Math.min(snapshot.level, snapshot.maxLevel)) + "/" + String(snapshot.maxLevel),
    lineX,
    yStart + yStep * 2,
    layout.infoValueOffset,
    mode,
  );
  drawInfoLine(ctx, "Lives", String(snapshot.lives), lineX, yStart + yStep * 3, layout.infoValueOffset, mode);
  drawInfoLine(ctx, "Money", String(snapshot.money), lineX, yStart + yStep * 4, layout.infoValueOffset, mode);
  drawInfoLine(
    ctx,
    "Selected",
    snapshot.selectedTowerName ?? "None",
    lineX,
    yStart + yStep * 5,
    layout.infoValueOffset,
    mode,
  );
  drawInfoLine(ctx, "DPS", selectedDps, lineX, yStart + yStep * 6, layout.infoValueOffset, mode);
  drawInfoLine(
    ctx,
    "Speed",
    speedMultiplier.toFixed(1) + "x",
    lineX,
    yStart + yStep * 7,
    layout.infoValueOffset,
    mode,
  );
}

function drawSidebarWavePreview(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  mode: ResponsiveUIMode,
): void {
  const waveRect = sidebarWaveRect(mode);
  roundRect(ctx, waveRect, 12, "#233244", "#4b6887", 2);

  ctx.fillStyle = "#dce8f7";
  ctx.font = mode === "compact" ? "600 19px Arial" : "600 21px Arial";
  ctx.fillText(
    `Next ${snapshot.nextWavePreview.count} | B:${snapshot.nextWavePreview.basic} R:${snapshot.nextWavePreview.runner} Br:${snapshot.nextWavePreview.brute} Sh:${snapshot.nextWavePreview.shield}`,
    waveRect.x + 10,
    waveRect.y + (mode === "compact" ? 32 : 34),
  );
  ctx.fillText(
    `Boss: ${snapshot.nextWavePreview.bossName}`,
    waveRect.x + 10,
    waveRect.y + (mode === "compact" ? 60 : 66),
  );
}

function drawDesktopTowerCard(
  ctx: CanvasRenderingContext2D,
  card: Rect,
  tower: TowerName,
  unlocked: boolean,
  affordable: boolean,
  selected: boolean,
  hovered: boolean,
): void {
  const stats = TOWER_TYPES[tower];

  const base = !unlocked ? "#30343a" : affordable ? "#24394f" : "#3c2f36";
  const hover = !unlocked ? "#353a42" : affordable ? "#2b4863" : "#4b3a45";

  let fill = hovered ? hover : base;
  if (selected) {
    fill = hovered ? "#3f6d98" : "#365f86";
  }

  const border = selected ? "#b6deff" : !unlocked ? "#6a727b" : affordable ? rgb(stats.color) : "#c68f9b";

  roundRect(ctx, card, 12, fill, border, selected ? 3 : 2);

  const iconCenter = { x: card.x + 28, y: card.y + 32 };
  drawTowerGlyph(ctx, iconCenter, 16, stats.color, TOWER_ICON_LABELS[tower]);

  ctx.fillStyle = "#f3f7ff";
  ctx.font = "700 22px Arial";
  ctx.textAlign = "left";
  ctx.fillText(tower, card.x + 56, card.y + 28);

  ctx.fillStyle = affordable ? "#c5f5d2" : "#ffc4c4";
  ctx.font = "600 18px Arial";
  ctx.fillText(`Cost ${stats.cost}`, card.x + 10, card.y + 56);

  ctx.fillStyle = "#d6e5f8";
  ctx.fillText(`DPS ${formatTowerDps(stats)}  RNG ${Math.round(stats.range)}`, card.x + 10, card.y + 80);

  ctx.fillStyle = "#a9c0d8";
  ctx.font = "500 16px Arial";
  ctx.fillText(TOWER_DESCRIPTIONS[tower], card.x + 10, card.y + 102);

  if (!unlocked) {
    ctx.fillStyle = "#ffdd8d";
    ctx.fillText(`Unlock at level ${stats.unlock}`, card.x + 10, card.y + 122);
  }
}

function drawCompactTowerCard(
  ctx: CanvasRenderingContext2D,
  card: Rect,
  tower: TowerName,
  unlocked: boolean,
  affordable: boolean,
  selected: boolean,
  hovered: boolean,
): void {
  const stats = TOWER_TYPES[tower];
  const shortLabel = TOWER_SHORT_LABELS[tower];

  const base = !unlocked ? "#2f3338" : affordable ? "#203245" : "#3a2d33";
  const hover = !unlocked ? "#353b42" : affordable ? "#2a4560" : "#4a3a44";
  let fill = hovered ? hover : base;
  if (selected) {
    fill = hovered ? "#3f6f9b" : "#356086";
  }

  const border = selected ? "#bde2ff" : !unlocked ? "#6b737b" : affordable ? rgb(stats.color) : "#c9929f";

  roundRect(ctx, card, 14, fill, border, selected ? 3 : 2);

  drawTowerGlyph(ctx, { x: card.x + 24, y: card.y + 28 }, 15, stats.color, TOWER_ICON_LABELS[tower]);

  ctx.textAlign = "left";
  ctx.fillStyle = "#f0f6ff";
  ctx.font = "700 18px Arial";
  ctx.fillText(shortLabel, card.x + 46, card.y + 24);

  ctx.fillStyle = affordable ? "#c6f4d4" : "#ffbec1";
  ctx.font = "600 17px Arial";
  ctx.fillText(`${stats.cost}`, card.x + 10, card.y + 56);

  ctx.fillStyle = "#dbe7f9";
  ctx.fillText(`${formatTowerDps(stats)} DPS`, card.x + 10, card.y + 82);

  ctx.fillStyle = "#9eb9d6";
  ctx.font = "500 14px Arial";
  ctx.fillText(`RNG ${Math.round(stats.range)}`, card.x + 10, card.y + 104);

  if (!unlocked) {
    ctx.fillStyle = "rgba(22, 24, 28, 0.68)";
    roundRect(ctx, { x: card.x + 6, y: card.y + card.h - 28, w: card.w - 12, h: 22 }, 8, "rgba(14,18,23,0.74)");
    ctx.fillStyle = "#ffdd8d";
    ctx.font = "600 13px Arial";
    ctx.fillText(`Unlock L${stats.unlock}`, card.x + 12, card.y + card.h - 12);
  }
}

function drawCompactInfoButton(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  tower: TowerName,
  tooltipState: TowerTooltipRenderState | null,
  hovered: boolean,
): void {
  const active = tooltipState?.tower === tower && tooltipState.source === "touch";
  const fill = active ? "#4a8de2" : hovered ? "#385674" : "#2d445c";
  const stroke = active ? "#d4e8ff" : "#9fb9d3";

  roundRect(ctx, rect, 9, fill, stroke, 2);
  ctx.fillStyle = "#f2f8ff";
  ctx.font = "700 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText("i", rect.x + rect.w * 0.5, rect.y + rect.h * 0.68);
}

function drawSidebarControls(ctx: CanvasRenderingContext2D, mode: ResponsiveUIMode): void {
  const layout = getSidebarLayoutConfig(mode);

  ctx.fillStyle = "#9ab4ce";
  ctx.font = mode === "compact" ? "500 14px Arial" : "500 15px Arial";
  ctx.textAlign = "left";

  if (mode === "compact") {
    ctx.fillText("Tap card to buy, tap i for details", FIELD_W + 26, layout.controlsPrimaryY);
    ctx.fillText("[1-5] Tower  [Space] Wave  [Ctrl +/-] Speed  [Esc] Clear", FIELD_W + 26, layout.controlsSecondaryY);
    return;
  }

  ctx.fillText("Controls: [1-5] Tower  [Space] Wave  [R] Restart", FIELD_W + 30, layout.controlsPrimaryY);
  ctx.fillText("[Ctrl +] Faster  [Ctrl -] Slower  [Esc/Right Click] Clear  [M] Menu", FIELD_W + 30, layout.controlsSecondaryY);
}

function drawCompactTowerTooltip(
  ctx: CanvasRenderingContext2D,
  tooltipState: TowerTooltipRenderState,
): void {
  const tower = tooltipState.tower;
  const stats = TOWER_TYPES[tower];
  const tooltipSize = { w: 340, h: 170 };
  const pos = resolveTooltipPlacement(
    tooltipState.anchor,
    { x: 0, y: 0, w: SCREEN_W, h: SCREEN_H },
    tooltipSize,
    { margin: 16, offset: 14, preferAbove: true },
  );

  roundRect(ctx, { x: pos.x, y: pos.y, w: tooltipSize.w, h: tooltipSize.h }, 14, "rgba(11, 17, 26, 0.97)", "#79a4cf", 2);

  drawTowerGlyph(ctx, { x: pos.x + 22, y: pos.y + 28 }, 16, stats.color, TOWER_ICON_LABELS[tower]);

  ctx.textAlign = "left";
  ctx.fillStyle = "#f0f6ff";
  ctx.font = "700 22px Arial";
  ctx.fillText(tower, pos.x + 46, pos.y + 30);

  ctx.fillStyle = "#cde2f8";
  ctx.font = "600 17px Arial";
  ctx.fillText(`Cost ${stats.cost}`, pos.x + 16, pos.y + 60);
  ctx.fillText(`DPS ${formatTowerDps(stats)}`, pos.x + 136, pos.y + 60);
  ctx.fillText(`Range ${Math.round(stats.range)}`, pos.x + 248, pos.y + 60);

  ctx.fillStyle = "#a8c3de";
  ctx.font = "500 16px Arial";
  ctx.fillText(TOWER_DESCRIPTIONS[tower], pos.x + 16, pos.y + 92);

  ctx.fillStyle = "#9fc0df";
  ctx.font = "500 15px Arial";
  ctx.fillText(`Special: ${towerSpecialText(tower)}`, pos.x + 16, pos.y + 120);

  ctx.fillStyle = "#89aac8";
  ctx.font = "500 14px Arial";
  ctx.fillText(tooltipState.source === "touch" ? "Tap i again to close" : "Hover tooltip", pos.x + 16, pos.y + 148);
}

function towerSpecialText(tower: TowerName): string {
  const stats = TOWER_TYPES[tower];

  if (tower === "Stunner") {
    const slow = stats.slowFactor ? Math.round((1 - stats.slowFactor) * 100) : 0;
    return `Slow ${slow}% for ${stats.slowDuration?.toFixed(1) ?? "0.0"}s`;
  }
  if (tower === "Bombarman") {
    return `Splash radius ${Math.round(stats.splashRadius ?? 0)}`;
  }
  if (tower === "Panzer-Tower") {
    return `Heavy cannon splash ${Math.round(stats.splashRadius ?? 0)}`;
  }
  if (tower === "Scharfschuetze") {
    return "Long-range precision shots";
  }

  return "Reliable single target fire";
}

function drawTowerGlyph(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  color: [number, number, number],
  label: string,
): void {
  ctx.fillStyle = "#111821";
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius + 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rgb(color);
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f1f6ff";
  ctx.font = "700 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, center.x, center.y + 5);
}

function drawEndOverlay(
  ctx: CanvasRenderingContext2D,
  screen: PrototypeScreen,
  hitAreas: RenderHitAreas,
  pointerWorld: Point,
): void {
  ctx.fillStyle = "rgba(8, 12, 18, 0.72)";
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const panel = centeredRect(720, 370, -20);
  roundRect(ctx, panel, 20, "#0f1723", "#4d6785", 2);

  ctx.textAlign = "center";
  ctx.fillStyle = screen === "victory" ? "#7df0a0" : "#ff8f8f";
  ctx.font = "700 72px Arial";
  ctx.fillText(screen === "victory" ? "Victory" : "Game Over", SCREEN_W * 0.5, panel.y + 110);

  ctx.fillStyle = "#d9e5f8";
  ctx.font = "500 28px Arial";
  ctx.fillText("Press buttons below to continue", SCREEN_W * 0.5, panel.y + 164);

  const restartButton: Rect = { x: panel.x + 90, y: panel.y + 230, w: 240, h: 72 };
  const menuButton: Rect = { x: panel.x + panel.w - 330, y: panel.y + 230, w: 240, h: 72 };

  const restartHovered = pointInRect(pointerWorld, restartButton);
  const menuHovered = pointInRect(pointerWorld, menuButton);

  roundRect(ctx, restartButton, 12, restartHovered ? "#3280f3" : "#236ed8", "#c5deff", 2);
  roundRect(ctx, menuButton, 12, menuHovered ? "#536171" : "#3e4a59", "#c5deff", 2);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px Arial";
  ctx.fillText("Restart", restartButton.x + restartButton.w * 0.5, restartButton.y + 46);
  ctx.fillText("Main Menu", menuButton.x + menuButton.w * 0.5, menuButton.y + 46);

  hitAreas.restartButton = restartButton;
  hitAreas.menuButton = menuButton;
}

function drawTopMessage(ctx: CanvasRenderingContext2D, message: string): void {
  if (!message) {
    return;
  }

  const box: Rect = { x: 28, y: 20, w: 860, h: 52 };
  roundRect(ctx, box, 11, "#0f1824", "#f4f8ff", 2);

  ctx.fillStyle = "#f4f8ff";
  ctx.textAlign = "left";
  ctx.font = "600 24px Arial";
  ctx.fillText(message, box.x + 14, box.y + 34);
}

function drawInfoLine(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  valueOffset: number,
  mode: ResponsiveUIMode,
): void {
  ctx.textAlign = "left";
  ctx.fillStyle = "#9cb5cd";
  ctx.font = mode === "compact" ? "500 16px Arial" : "500 18px Arial";
  ctx.fillText(`${label}:`, x, y);

  ctx.fillStyle = "#f1f7ff";
  ctx.font = mode === "compact" ? "700 19px Arial" : "700 22px Arial";
  ctx.fillText(value, x + valueOffset, y);
}

function drawGameIconBadge(
  ctx: CanvasRenderingContext2D,
  icon: CanvasImageSource | null,
  x: number,
  y: number,
  size: number,
): void {
  roundRect(ctx, { x: x - 6, y: y - 6, w: size + 12, h: size + 12 }, 14, "#1f2d3f", "#98bee6", 2);

  if (icon) {
    ctx.drawImage(icon, x, y, size, size);
    return;
  }

  ctx.save();
  const cx = x + size * 0.5;
  const cy = y + size * 0.5;

  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, "#1b2e45");
  grad.addColorStop(1, "#132337");
  roundRect(ctx, { x, y, w: size, h: size }, 10, grad);

  ctx.strokeStyle = "#d1b67b";
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.16, y + size * 0.25);
  ctx.lineTo(x + size * 0.7, y + size * 0.25);
  ctx.lineTo(x + size * 0.7, y + size * 0.74);
  ctx.lineTo(x + size * 0.3, y + size * 0.74);
  ctx.stroke();

  ctx.fillStyle = "#79b6ff";
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

function rgb(color: [number, number, number]): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}
