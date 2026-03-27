import { PATH_POINTS, FIELD_W, GRID_SIZE, PATH_WIDTH, SCREEN_H, SCREEN_W, SIDEBAR_W } from "../data/constants";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../data/difficulties";
import { TOWER_DESCRIPTIONS, TOWER_ORDER, TOWER_TYPES } from "../data/towers";
import type { DifficultyName, EnemySnapshot, GameSnapshot, Point, TowerName } from "../types";
import { difficultyLabel } from "./input";
import { centeredRect, fieldRect, sidebarRect, towerCardRect } from "./layout";
import type { Rect, Viewport } from "./layout";

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

export interface RuntimeRenderState {
  pointerWorld: Point;
  speedMultiplier: number;
  towerPreview: TowerPreviewRenderState | null;
  gameIcon: CanvasImageSource | null;
}

export interface RenderHitAreas {
  startButton?: Rect;
  difficultyButtons: DifficultyHit[];
  towerCards: TowerHit[];
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
  };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#0c1118";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  ctx.save();
  ctx.translate(viewport.offsetX, viewport.offsetY);
  ctx.scale(viewport.scale, viewport.scale);

  if (screen === "start") {
    drawStartScreen(ctx, hitAreas, runtime.gameIcon);
    ctx.restore();
    return hitAreas;
  }

  if (screen === "difficulty") {
    drawDifficultyScreen(ctx, hitAreas);
    ctx.restore();
    return hitAreas;
  }

  drawGameScene(ctx, snapshot, hitAreas, runtime);

  if (screen === "game_over" || screen === "victory") {
    drawEndOverlay(ctx, screen, hitAreas);
  }

  ctx.restore();
  return hitAreas;
}

function drawStartScreen(
  ctx: CanvasRenderingContext2D,
  hitAreas: RenderHitAreas,
  gameIcon: CanvasImageSource | null,
): void {
  const gradient = ctx.createLinearGradient(0, 0, SCREEN_W, SCREEN_H);
  gradient.addColorStop(0, "#15202f");
  gradient.addColorStop(1, "#1d2f3f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const panel = centeredRect(920, 520, -40);
  roundRect(ctx, panel, 22, "#101722", "#4d6783", 2);

  drawGameIconBadge(ctx, gameIcon, panel.x + 34, panel.y + 34, 122);

  ctx.fillStyle = "#f3f7ff";
  ctx.font = "700 84px Arial";
  ctx.textAlign = "center";
  ctx.fillText("TauriTwoer Defense", SCREEN_W * 0.5 + 20, panel.y + 138);

  ctx.font = "400 32px Arial";
  ctx.fillStyle = "#b9c8dc";
  ctx.fillText("Canvas Prototype in Tauri + TypeScript", SCREEN_W * 0.5, panel.y + 206);

  const features = [
    "Menu Flow + Difficulty Selection",
    "Wave Formula: ceil(level * multiplier)",
    "Boss every 10 levels",
    "Panzer-Tower as late power spike",
  ];

  ctx.font = "500 30px Arial";
  features.forEach((line, index) => {
    ctx.fillText(line, SCREEN_W * 0.5, panel.y + 284 + index * 52);
  });

  const startButton = centeredRect(420, 92, 225);
  roundRect(ctx, startButton, 16, "#2a81ff", "#b8d9ff", 3);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 42px Arial";
  ctx.fillText("Start", startButton.x + startButton.w * 0.5, startButton.y + 60);

  hitAreas.startButton = startButton;
}

function drawDifficultyScreen(ctx: CanvasRenderingContext2D, hitAreas: RenderHitAreas): void {
  const gradient = ctx.createLinearGradient(0, 0, SCREEN_W, SCREEN_H);
  gradient.addColorStop(0, "#112130");
  gradient.addColorStop(1, "#1c3244");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#eef4ff";
  ctx.font = "700 74px Arial";
  ctx.fillText("Select Difficulty", SCREEN_W * 0.5, 160);

  const buttonWidth = 620;
  const buttonHeight = 118;
  const startY = 238;

  DIFFICULTY_ORDER.forEach((difficulty, index) => {
    const rect: Rect = {
      x: (SCREEN_W - buttonWidth) * 0.5,
      y: startY + index * (buttonHeight + 20),
      w: buttonWidth,
      h: buttonHeight,
    };

    roundRect(ctx, rect, 16, "#1a2b3d", "#75a4d6", 3);
    ctx.fillStyle = "#f4f8ff";
    ctx.font = "700 39px Arial";
    ctx.fillText(difficultyLabel(difficulty), rect.x + rect.w * 0.5, rect.y + 52);

    ctx.fillStyle = "#9fc1e4";
    ctx.font = "500 24px Arial";
    ctx.fillText(
      `Spawn multiplier x${DIFFICULTIES[difficulty].countMult.toFixed(1)}`,
      rect.x + rect.w * 0.5,
      rect.y + 86,
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
  drawPath(ctx);
  drawTowerPreview(ctx, runtime.towerPreview);
  drawEntities(ctx, snapshot);
  drawSidebar(ctx, snapshot, hitAreas, runtime.speedMultiplier, runtime.gameIcon);
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

function drawPath(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#cbb37a";
  ctx.lineWidth = PATH_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
  for (let i = 1; i < PATH_POINTS.length; i += 1) {
    ctx.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
  }
  ctx.stroke();

  ctx.strokeStyle = "#7f6a3f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
  for (let i = 1; i < PATH_POINTS.length; i += 1) {
    ctx.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
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
  speedMultiplier: number,
  gameIcon: CanvasImageSource | null,
): void {
  const sidebar = sidebarRect();
  roundRect(ctx, sidebar, 0, "#18232f");

  ctx.strokeStyle = "#37506b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(FIELD_W, 0);
  ctx.lineTo(FIELD_W, SCREEN_H);
  ctx.stroke();

  drawGameIconBadge(ctx, gameIcon, FIELD_W + SIDEBAR_W - 98, 18, 66);

  ctx.textAlign = "left";
  ctx.fillStyle = "#f2f7ff";
  ctx.font = "700 46px Arial";
  ctx.fillText("Tower Defense", FIELD_W + 28, 58);

  const infoRect: Rect = { x: FIELD_W + 24, y: 82, w: SIDEBAR_W - 48, h: 210 };
  roundRect(ctx, infoRect, 14, "#233244", "#4b6887", 2);
  drawInfoLine(ctx, "Difficulty", difficultyLabel(snapshot.difficultyName), infoRect.x + 14, infoRect.y + 36);
  drawInfoLine(ctx, "Level", `${Math.min(snapshot.level, snapshot.maxLevel)}/${snapshot.maxLevel}`, infoRect.x + 14, infoRect.y + 66);
  drawInfoLine(ctx, "Lives", `${snapshot.lives}`, infoRect.x + 14, infoRect.y + 96);
  drawInfoLine(ctx, "Money", `${snapshot.money}`, infoRect.x + 14, infoRect.y + 126);
  drawInfoLine(ctx, "Selected", snapshot.selectedTowerName ?? "None", infoRect.x + 14, infoRect.y + 156);
  drawInfoLine(ctx, "Speed", `${speedMultiplier.toFixed(1)}x`, infoRect.x + 14, infoRect.y + 186);

  const waveRect: Rect = { x: FIELD_W + 24, y: 302, w: SIDEBAR_W - 48, h: 98 };
  roundRect(ctx, waveRect, 12, "#233244", "#4b6887", 2);
  ctx.fillStyle = "#dce8f7";
  ctx.font = "600 21px Arial";
  ctx.fillText(
    `Next: ${snapshot.nextWavePreview.count} (B:${snapshot.nextWavePreview.basic} R:${snapshot.nextWavePreview.runner} Br:${snapshot.nextWavePreview.brute} Sh:${snapshot.nextWavePreview.shield})`,
    waveRect.x + 10,
    waveRect.y + 34,
  );
  ctx.fillText(`Boss: ${snapshot.nextWavePreview.bossName}`, waveRect.x + 10, waveRect.y + 66);

  for (let i = 0; i < TOWER_ORDER.length; i += 1) {
    const tower = TOWER_ORDER[i];
    const stats = TOWER_TYPES[tower];
    const card = towerCardRect(i, TOWER_ORDER.length);

    const unlocked = snapshot.level >= stats.unlock;
    const affordable = snapshot.money >= stats.cost;
    const selected = snapshot.selectedTowerName === tower;

    const fill = selected ? "#355a82" : unlocked ? "#24384d" : "#2f3033";
    const border = selected ? "#9fd0ff" : rgb(stats.color);

    roundRect(ctx, card, 12, fill, border, 2);

    ctx.fillStyle = "#f3f7ff";
    ctx.font = "700 23px Arial";
    ctx.fillText(tower, card.x + 10, card.y + 28);

    ctx.fillStyle = affordable ? "#c5f5d2" : "#ffc4c4";
    ctx.font = "600 18px Arial";
    ctx.fillText(`Cost ${stats.cost}`, card.x + 10, card.y + 53);

    ctx.fillStyle = "#d6e5f8";
    ctx.fillText(`DMG ${Math.round(stats.damage)}  RNG ${Math.round(stats.range)}`, card.x + 10, card.y + 76);

    ctx.fillStyle = "#a9c0d8";
    ctx.font = "500 16px Arial";
    ctx.fillText(TOWER_DESCRIPTIONS[tower], card.x + 10, card.y + 98);

    if (!unlocked) {
      ctx.fillStyle = "#ffdd8d";
      ctx.fillText(`Unlock at level ${stats.unlock}`, card.x + 10, card.y + 118);
    }

    hitAreas.towerCards.push({ tower, rect: card });
  }

  ctx.fillStyle = "#94aec9";
  ctx.font = "500 15px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Controls: [1-5] Tower  [Space] Wave  [R] Restart", FIELD_W + 30, SCREEN_H - 148);
  ctx.fillText("[Ctrl +] Faster  [Ctrl -] Slower  [Esc/Right Click] Clear  [M] Menu", FIELD_W + 30, SCREEN_H - 126);

  const startWaveRect: Rect = {
    x: FIELD_W + 30,
    y: SCREEN_H - 106,
    w: SIDEBAR_W - 60,
    h: 62,
  };

  const canStart = !snapshot.waveActive && snapshot.wavePlan.length === 0;
  roundRect(
    ctx,
    startWaveRect,
    12,
    canStart ? "#1f8c58" : "#355572",
    canStart ? "#b4ffd9" : "#7398bc",
    2,
  );
  ctx.fillStyle = "#f2f7ff";
  ctx.font = "700 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    canStart ? "Start Wave" : `Wave Running (${snapshot.spawnedThisWave}/${snapshot.totalWaveEnemies})`,
    startWaveRect.x + startWaveRect.w * 0.5,
    startWaveRect.y + 40,
  );

  hitAreas.startWaveButton = startWaveRect;
}

function drawEndOverlay(
  ctx: CanvasRenderingContext2D,
  screen: PrototypeScreen,
  hitAreas: RenderHitAreas,
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

  roundRect(ctx, restartButton, 12, "#236ed8", "#c5deff", 2);
  roundRect(ctx, menuButton, 12, "#3e4a59", "#c5deff", 2);

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
): void {
  ctx.textAlign = "left";
  ctx.fillStyle = "#9cb5cd";
  ctx.font = "500 18px Arial";
  ctx.fillText(`${label}:`, x, y);

  ctx.fillStyle = "#f1f7ff";
  ctx.font = "700 22px Arial";
  ctx.fillText(value, x + 144, y);
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
