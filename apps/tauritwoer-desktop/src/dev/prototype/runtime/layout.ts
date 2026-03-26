import { FIELD_W, SCREEN_H, SCREEN_W, SIDEBAR_W } from "../data/constants";
import type { Point } from "../types";

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

export function towerCardRect(index: number, total: number): Rect {
  const startY = 406;
  const gap = 16;
  const innerX = FIELD_W + 26;
  const innerW = SIDEBAR_W - 52;
  const cardW = (innerW - gap) / 2;
  const cardH = 126;

  const col = index % 2;
  const row = Math.floor(index / 2);

  let x = innerX + col * (cardW + gap);
  const y = startY + row * (cardH + gap);

  if (total % 2 === 1 && index === total - 1) {
    x = innerX + (innerW - cardW) * 0.5;
  }

  return { x, y, w: cardW, h: cardH };
}
