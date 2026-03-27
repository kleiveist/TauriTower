import { PATH_POINTS } from "./constants";
import type { MapDefinition, MapId } from "../types";

const CANAL_PATH = [
  { x: 0, y: 300 },
  { x: 430, y: 300 },
  { x: 430, y: 110 },
  { x: 980, y: 110 },
  { x: 980, y: 590 },
  { x: 1220, y: 590 },
  { x: 1220, y: 900 },
  { x: 600, y: 900 },
  { x: 600, y: 1030 },
  { x: 1320, y: 1030 },
] as const;

const SWITCHBACK_PATH = [
  { x: 0, y: 160 },
  { x: 560, y: 160 },
  { x: 560, y: 360 },
  { x: 180, y: 360 },
  { x: 180, y: 560 },
  { x: 940, y: 560 },
  { x: 940, y: 780 },
  { x: 340, y: 780 },
  { x: 340, y: 1000 },
  { x: 1320, y: 1000 },
] as const;

export const MAP_DEFINITIONS: Record<MapId, MapDefinition> = {
  meadow: {
    id: "meadow",
    name: "Emerald Meadow",
    shortLabel: "Meadow",
    description: "Balanced default lane with broad tower coverage opportunities.",
    pathPoints: PATH_POINTS.map((point) => ({ x: point.x, y: point.y })),
    accent: [98, 170, 105],
  },
  canal: {
    id: "canal",
    name: "Iron Canal",
    shortLabel: "Canal",
    description: "Tight turns and long center lane reward precision tower placement.",
    pathPoints: CANAL_PATH.map((point) => ({ x: point.x, y: point.y })),
    accent: [84, 146, 196],
  },
  switchback: {
    id: "switchback",
    name: "Switchback Ridge",
    shortLabel: "Switchback",
    description: "Multi-turn snake path with late compression near the base.",
    pathPoints: SWITCHBACK_PATH.map((point) => ({ x: point.x, y: point.y })),
    accent: [212, 142, 92],
  },
};

export const MAP_ORDER: MapId[] = ["meadow", "canal", "switchback"];

export const DEFAULT_MAP_ID: MapId = "meadow";

export function getMapDefinition(mapId: MapId): MapDefinition {
  return MAP_DEFINITIONS[mapId];
}
