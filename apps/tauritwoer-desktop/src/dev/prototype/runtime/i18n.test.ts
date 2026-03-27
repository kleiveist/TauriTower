import { describe, expect, it } from "vitest";
import { formatGameMessage, formatSandboxValidationIssue, getBossName, TRANSLATIONS } from "./i18n";
import type { SandboxValidationIssue } from "../types";

function collectKeyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectKeyPaths(entry, prefix ? `${prefix}[${index}]` : `[${index}]`),
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([key, entry]) =>
        collectKeyPaths(entry, prefix ? `${prefix}.${key}` : key),
      );
  }

  return [prefix];
}

describe("runtime i18n", () => {
  it("keeps translation key parity between de and en", () => {
    const deKeys = collectKeyPaths(TRANSLATIONS.de);
    const enKeys = collectKeyPaths(TRANSLATIONS.en);

    expect(enKeys).toEqual(deKeys);
  });

  it("formats game message tokens in both languages", () => {
    const deText = formatGameMessage(
      { code: "level_started", level: 20, enemies: 45, bossStage: 2 },
      "de",
    );
    const enText = formatGameMessage(
      { code: "level_started", level: 20, enemies: 45, bossStage: 2 },
      "en",
    );

    expect(deText).toContain("Runde 20");
    expect(deText).toContain("Klingenwurm");
    expect(enText).toContain("Round 20");
    expect(enText).toContain("Blade Wyrm");
  });

  it("formats sandbox validation issues with slot context", () => {
    const issue: SandboxValidationIssue = {
      code: "duplicate_id",
      slotIndex: 3,
      id: "slot-3",
    };

    const deText = formatSandboxValidationIssue(issue, "de");
    const enText = formatSandboxValidationIssue(issue, "en");

    expect(deText).toContain("Slot 3");
    expect(deText).toContain("slot-3");
    expect(enText).toContain("Slot 3");
    expect(enText).toContain("slot-3");
  });

  it("resolves localized boss names", () => {
    expect(getBossName("de", 1)).toBe("Eisenkoloss");
    expect(getBossName("en", 1)).toBe("Iron Colossus");
  });
});
