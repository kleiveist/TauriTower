import { describe, expect, it } from "vitest";
import { computeTowerDps, getResponsiveMode, resolveTooltipPlacement } from "./ui";

describe("runtime ui helpers", () => {
  it("switches responsive mode at 1200 breakpoint", () => {
    expect(getResponsiveMode(1200)).toBe("compact");
    expect(getResponsiveMode(1201)).toBe("desktop");
  });

  it("computes tower DPS from damage and attack interval", () => {
    expect(computeTowerDps({ damage: 120, cooldown: 2 })).toBe(60);
    expect(computeTowerDps({ damage: 90, cooldown: 0 })).toBe(0);
  });

  it("keeps tooltip placement inside bounds", () => {
    const pos = resolveTooltipPlacement(
      { x: 16, y: 18 },
      { x: 0, y: 0, w: 300, h: 200 },
      { w: 180, h: 120 },
      { margin: 10, offset: 12, preferAbove: true },
    );

    expect(pos.x).toBeGreaterThanOrEqual(10);
    expect(pos.y).toBeGreaterThanOrEqual(10);
    expect(pos.x + 180).toBeLessThanOrEqual(290);
    expect(pos.y + 120).toBeLessThanOrEqual(190);
  });
});
