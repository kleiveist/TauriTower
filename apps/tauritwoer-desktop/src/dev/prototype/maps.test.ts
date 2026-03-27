import { describe, expect, it } from "vitest";
import { MAP_DEFINITIONS, MAP_ORDER, getMapDefinition } from "./data/maps";

describe("map definitions", () => {
  it("exposes exactly three selectable maps", () => {
    expect(MAP_ORDER).toEqual(["meadow", "canal", "switchback"]);
    expect(Object.keys(MAP_DEFINITIONS)).toHaveLength(3);
  });

  it("returns map path data for resolver calls", () => {
    const canal = getMapDefinition("canal");
    const switchback = getMapDefinition("switchback");

    expect(canal.pathPoints.length).toBeGreaterThanOrEqual(2);
    expect(switchback.pathPoints.length).toBeGreaterThanOrEqual(2);
    expect(canal.pathPoints[0]).not.toEqual(switchback.pathPoints[0]);
  });
});
