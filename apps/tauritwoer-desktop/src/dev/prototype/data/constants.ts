import type { Point } from "../types";

export const SCREEN_W = 1760;
export const SCREEN_H = 980;
export const SIDEBAR_W = 560;
export const FIELD_W = SCREEN_W - SIDEBAR_W;
export const FPS = 60;
export const PATH_WIDTH = 58;
export const TOWER_RADIUS = 22;
export const GRID_SIZE = 40;

export const PATH_POINTS: Point[] = [
  { x: 0, y: 140 },
  { x: 210, y: 140 },
  { x: 210, y: 360 },
  { x: 540, y: 360 },
  { x: 540, y: 205 },
  { x: 890, y: 205 },
  { x: 890, y: 645 },
  { x: 280, y: 645 },
  { x: 280, y: 835 },
  { x: 1130, y: 835 },
];
