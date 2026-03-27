import type { TowerStats } from "../types";

export type ResponsiveUIMode = "desktop" | "compact";

export const COMPACT_MODE_MAX_WIDTH = 1200;
export const TOOLTIP_HOVER_DELAY_MS = 320;

export interface TowerGridLayoutConfig {
  sidePadding: number;
  startY: number;
  columns: number;
  gapX: number;
  gapY: number;
  cardHeight: number;
}

export interface SidebarLayoutConfig {
  panelPadding: number;
  titleY: number;
  infoRectY: number;
  infoRectHeight: number;
  waveRectY: number;
  waveRectHeight: number;
  grid: TowerGridLayoutConfig;
  controlsPrimaryY: number;
  controlsSecondaryY: number;
  startWaveY: number;
  startWaveHeight: number;
  startWaveSidePadding: number;
  infoValueOffset: number;
}

export const DESKTOP_SIDEBAR_LAYOUT: SidebarLayoutConfig = {
  panelPadding: 24,
  titleY: 62,
  infoRectY: 86,
  infoRectHeight: 230,
  waveRectY: 328,
  waveRectHeight: 104,
  grid: {
    sidePadding: 26,
    startY: 448,
    columns: 2,
    gapX: 16,
    gapY: 16,
    cardHeight: 130,
  },
  controlsPrimaryY: 972,
  controlsSecondaryY: 994,
  startWaveY: 1014,
  startWaveHeight: 62,
  startWaveSidePadding: 30,
  infoValueOffset: 150,
};

export const COMPACT_SIDEBAR_LAYOUT: SidebarLayoutConfig = {
  panelPadding: 20,
  titleY: 56,
  infoRectY: 80,
  infoRectHeight: 206,
  waveRectY: 296,
  waveRectHeight: 82,
  grid: {
    sidePadding: 20,
    startY: 392,
    columns: 3,
    gapX: 12,
    gapY: 12,
    cardHeight: 120,
  },
  controlsPrimaryY: 940,
  controlsSecondaryY: 962,
  startWaveY: 1000,
  startWaveHeight: 58,
  startWaveSidePadding: 24,
  infoValueOffset: 126,
};

export interface TooltipBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TooltipSize {
  w: number;
  h: number;
}

export interface TooltipPlacementOptions {
  margin?: number;
  offset?: number;
  preferAbove?: boolean;
}

export function getResponsiveMode(viewportWidth: number): ResponsiveUIMode {
  return viewportWidth <= COMPACT_MODE_MAX_WIDTH ? "compact" : "desktop";
}

export function getSidebarLayoutConfig(mode: ResponsiveUIMode): SidebarLayoutConfig {
  return mode === "compact" ? COMPACT_SIDEBAR_LAYOUT : DESKTOP_SIDEBAR_LAYOUT;
}

export function computeTowerDps(stats: Pick<TowerStats, "damage" | "cooldown">): number {
  if (!Number.isFinite(stats.cooldown) || stats.cooldown <= 0) {
    return 0;
  }
  return stats.damage / stats.cooldown;
}

export function formatTowerDps(stats: Pick<TowerStats, "damage" | "cooldown">): string {
  return computeTowerDps(stats).toFixed(1);
}

export function resolveTooltipPlacement(
  anchor: { x: number; y: number },
  bounds: TooltipBounds,
  tooltip: TooltipSize,
  options: TooltipPlacementOptions = {},
): { x: number; y: number } {
  const margin = options.margin ?? 14;
  const offset = options.offset ?? 14;
  const preferAbove = options.preferAbove ?? true;

  const minX = bounds.x + margin;
  const maxX = bounds.x + bounds.w - tooltip.w - margin;
  const minY = bounds.y + margin;
  const maxY = bounds.y + bounds.h - tooltip.h - margin;

  const xAfterAnchor = anchor.x + offset;
  const xBeforeAnchor = anchor.x - tooltip.w - offset;

  let x = xAfterAnchor;
  if (x > maxX) {
    x = xBeforeAnchor;
  }
  x = clamp(x, minX, maxX);

  const yAbove = anchor.y - tooltip.h - offset;
  const yBelow = anchor.y + offset;

  let y = preferAbove ? yAbove : yBelow;
  if (y < minY || y > maxY) {
    y = preferAbove ? yBelow : yAbove;
  }
  y = clamp(y, minY, maxY);

  return { x, y };
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}
