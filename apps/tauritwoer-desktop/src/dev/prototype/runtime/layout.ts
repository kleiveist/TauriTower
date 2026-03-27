import { FIELD_W, SCREEN_H, SCREEN_W, SIDEBAR_W } from "../data/constants";
import type { Point } from "../types";
import { getSidebarLayoutConfig, type ResponsiveUIMode } from "./ui";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
  worldWidth: number;
  worldHeight: number;
}

export function createViewport(pixelWidth: number, pixelHeight: number): Viewport {
  const scale = Math.min(pixelWidth / SCREEN_W, pixelHeight / SCREEN_H);
  const worldWidth = SCREEN_W * scale;
  const worldHeight = SCREEN_H * scale;
  const offsetX = (pixelWidth - worldWidth) * 0.5;
  const offsetY = (pixelHeight - worldHeight) * 0.5;

  return {
    scale,
    offsetX,
    offsetY,
    worldWidth,
    worldHeight,
  };
}

export function toWorldPosition(pixelPoint: Point, viewport: Viewport): Point {
  return {
    x: (pixelPoint.x - viewport.offsetX) / viewport.scale,
    y: (pixelPoint.y - viewport.offsetY) / viewport.scale,
  };
}

export function pointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

export function sidebarRect(): Rect {
  return { x: FIELD_W, y: 0, w: SIDEBAR_W, h: SCREEN_H };
}

export function fieldRect(): Rect {
  return { x: 0, y: 0, w: FIELD_W, h: SCREEN_H };
}

export function centeredRect(width: number, height: number, yOffset = 0): Rect {
  return {
    x: (SCREEN_W - width) * 0.5,
    y: (SCREEN_H - height) * 0.5 + yOffset,
    w: width,
    h: height,
  };
}

export function sidebarInfoRect(mode: ResponsiveUIMode): Rect {
  const layout = getSidebarLayoutConfig(mode);
  return {
    x: FIELD_W + layout.panelPadding,
    y: layout.infoRectY,
    w: SIDEBAR_W - layout.panelPadding * 2,
    h: layout.infoRectHeight,
  };
}

export function sidebarWaveRect(mode: ResponsiveUIMode): Rect {
  const layout = getSidebarLayoutConfig(mode);
  return {
    x: FIELD_W + layout.panelPadding,
    y: layout.waveRectY,
    w: SIDEBAR_W - layout.panelPadding * 2,
    h: layout.waveRectHeight,
  };
}

export function startWaveButtonRect(mode: ResponsiveUIMode): Rect {
  const layout = getSidebarLayoutConfig(mode);
  return {
    x: FIELD_W + layout.startWaveSidePadding,
    y: layout.startWaveY,
    w: SIDEBAR_W - layout.startWaveSidePadding * 2,
    h: layout.startWaveHeight,
  };
}

export function towerCardRect(index: number, total: number, mode: ResponsiveUIMode): Rect {
  const layout = getSidebarLayoutConfig(mode);
  const { sidePadding, startY, columns, gapX, gapY, cardHeight } = layout.grid;
  const innerX = FIELD_W + sidePadding;
  const innerW = SIDEBAR_W - sidePadding * 2;
  const cardW = (innerW - gapX * (columns - 1)) / columns;

  const row = Math.floor(index / columns);
  const rowStart = row * columns;
  const itemsInRow = Math.min(columns, total - rowStart);
  const colInRow = index - rowStart;

  const y = startY + row * (cardHeight + gapY);

  let x = innerX + colInRow * (cardW + gapX);
  if (itemsInRow < columns) {
    const rowWidth = itemsInRow * cardW + (itemsInRow - 1) * gapX;
    x = innerX + (innerW - rowWidth) * 0.5 + colInRow * (cardW + gapX);
  }

  return { x, y, w: cardW, h: cardHeight };
}

export function towerInfoButtonRect(cardRect: Rect, mode: ResponsiveUIMode): Rect {
  const size = mode === "compact" ? 28 : 24;
  const inset = mode === "compact" ? 8 : 7;

  return {
    x: cardRect.x + cardRect.w - size - inset,
    y: cardRect.y + inset,
    w: size,
    h: size,
  };
}
