import type { Point } from "../types";

export const SCREEN_W = 2080;
export const SCREEN_H = 1120;
export const SIDEBAR_W = 720;
export const FIELD_W = SCREEN_W - SIDEBAR_W;
export const FPS = 60;
export const PATH_WIDTH = 64;
export const TOWER_RADIUS = 24;
export const GRID_SIZE = 48;

export const PATH_POINTS: Point[] = [
  { x: 0, y: 180 },
  { x: 280, y: 180 },
  { x: 280, y: 460 },
  { x: 720, y: 460 },
  { x: 720, y: 250 },
  { x: 1100, y: 250 },
  { x: 1100, y: 820 },
  { x: 360, y: 820 },
  { x: 360, y: 1000 },
  { x: 1320, y: 1000 },
];
