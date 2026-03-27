import type { DifficultyName, SandboxEnemyType } from "../types";

export type UiLanguage = "de" | "en";

export type DesignMode = "standard" | "arcade";

export interface PrototypeTranslations {
  settings: {
    title: string;
    language: string;
    design: string;
    languageOptionLabels: Record<UiLanguage, string>;
    designOptionLabels: Record<DesignMode, string>;
  };
  actions: {
    start: string;
    back: string;
    restart: string;
    resume: string;
    confirm: string;
    cancel: string;
    continue: string;
    close: string;
  };
  start: {
    title: string;
    description: string;
  };
  mode: {
    title: string;
    classicTitle: string;
    classicDescription: string;
    sandboxTitle: string;
    sandboxDescription: string;
  };
  difficulty: {
    title: string;
    multiplierLabel: string;
    labels: Record<DifficultyName, string>;
  };
  map: {
    title: string;
    startClassic: string;
  };
  sandbox: {
    title: string;
    description: string;
    addSlot: string;
    removeSelectedSlot: string;
    emptyHint: string;
    slotEnabled: string;
    fields: {
      enemy: string;
      bossProfile: string;
      startRound: string;
      baseCount: string;
      multiplier: string;
      addEvery10Rounds: string;
      stage: string;
    };
  };
  preview: {
    round: string;
    total: string;
    basic: string;
    runner: string;
    brute: string;
    shield: string;
    boss: string;
    bossUnknown: string;
  };
  enemyLabels: Record<SandboxEnemyType, string>;
}

export const DEFAULT_UI_LANGUAGE: UiLanguage = "de";

export const DEFAULT_DESIGN_MODE: DesignMode = "standard";

export const UI_PREFERENCE_KEYS = {
  language: "tauritwoer.ui.language",
  designMode: "tauritwoer.ui.designMode",
} as const;

export const TRANSLATIONS: Record<UiLanguage, PrototypeTranslations> = {
  de: {
    settings: {
      title: "Einstellungen",
      language: "Sprache",
      design: "Design",
      languageOptionLabels: {
        de: "Deutsch",
        en: "Englisch",
      },
      designOptionLabels: {
        standard: "Standard",
        arcade: "Arcade",
      },
    },
    actions: {
      start: "Starten",
      back: "Zurück",
      restart: "Neustart",
      resume: "Fortsetzen",
      confirm: "Bestätigen",
      cancel: "Abbrechen",
      continue: "Weiter",
      close: "Schließen",
    },
    start: {
      title: "TauriTwoer Defense",
      description: "Hybrider Canvas- und React-Flow mit klassischen Wellen und editierbaren Sandbox-Slots.",
    },
    mode: {
      title: "Modus wählen",
      classicTitle: "Klassisch",
      classicDescription: "Originaler Wellenplaner mit automatischem Boss alle 10 Runden.",
      sandboxTitle: "Sandbox / Agent Box",
      sandboxDescription: "Editierbare Slots steuern Spawns, Skalierung und explizite Boss-Einträge.",
    },
    difficulty: {
      title: "Schwierigkeit wählen",
      multiplierLabel: "Spawn-Multiplikator",
      labels: {
        leicht: "Leicht",
        mittel: "Mittel",
        schwer: "Schwer",
        unmoeglich: "Unmöglich",
      },
    },
    map: {
      title: "Karte wählen",
      startClassic: "Klassischen Lauf starten",
    },
    sandbox: {
      title: "Sandbox Slot-Editor",
      description:
        "Spawn-Reihenfolge ist blockweise nach Slot-Reihenfolge. Formel je Slot: Start-Gate, Basis plus additive 10er-Runden-Bänder, lineare Multiplikator-Skalierung, Rundung und nicht-negativer Clamp.",
      addSlot: "+ Slot hinzufügen",
      removeSelectedSlot: "Ausgewählten Slot entfernen",
      emptyHint: "Füge einen Slot hinzu, um Sandbox-Spawns zu konfigurieren.",
      slotEnabled: "Slot aktiv",
      fields: {
        enemy: "Gegner",
        bossProfile: "Boss-Profil",
        startRound: "Start-Runde",
        baseCount: "Basisanzahl",
        multiplier: "Multiplikator",
        addEvery10Rounds: "Additiv alle 10 Runden",
        stage: "Stufe",
      },
    },
    preview: {
      round: "Runde",
      total: "Gesamt",
      basic: "S",
      runner: "R",
      brute: "B",
      shield: "Sh",
      boss: "Boss",
      bossUnknown: "Unbekannt",
    },
    enemyLabels: {
      basic: "Standard",
      runner: "Runner",
      brute: "Brute",
      shield: "Schild",
      boss: "Boss",
    },
  },
  en: {
    settings: {
      title: "Settings",
      language: "Language",
      design: "Design",
      languageOptionLabels: {
        de: "German",
        en: "English",
      },
      designOptionLabels: {
        standard: "Standard",
        arcade: "Arcade",
      },
    },
    actions: {
      start: "Start",
      back: "Back",
      restart: "Restart",
      resume: "Resume",
      confirm: "Confirm",
      cancel: "Cancel",
      continue: "Continue",
      close: "Close",
    },
    start: {
      title: "TauriTwoer Defense",
      description: "Hybrid Canvas and React flow with classic waves and editable sandbox slots.",
    },
    mode: {
      title: "Select Mode",
      classicTitle: "Classic",
      classicDescription: "Original wave planner with automatic boss levels every 10 rounds.",
      sandboxTitle: "Sandbox / Agent Box",
      sandboxDescription: "Editable slots define exact spawns, scaling and explicit boss entries.",
    },
    difficulty: {
      title: "Select Difficulty",
      multiplierLabel: "Spawn multiplier",
      labels: {
        leicht: "Easy",
        mittel: "Medium",
        schwer: "Hard",
        unmoeglich: "Impossible",
      },
    },
    map: {
      title: "Select Map",
      startClassic: "Start Classic Run",
    },
    sandbox: {
      title: "Sandbox Slot Editor",
      description:
        "Spawn ordering is blockwise by slot order. Per-slot formula: start gate, base plus additive 10-round bands, linear multiplier scaling, rounding, and non-negative clamp.",
      addSlot: "+ Add Slot",
      removeSelectedSlot: "Remove Selected Slot",
      emptyHint: "Add a slot to configure sandbox spawning.",
      slotEnabled: "Slot enabled",
      fields: {
        enemy: "Enemy",
        bossProfile: "Boss Profile",
        startRound: "Start Round",
        baseCount: "Base Count",
        multiplier: "Multiplier",
        addEvery10Rounds: "Add Every 10 Rounds",
        stage: "Stage",
      },
    },
    preview: {
      round: "Round",
      total: "Total",
      basic: "B",
      runner: "R",
      brute: "Br",
      shield: "Sh",
      boss: "Boss",
      bossUnknown: "Unknown",
    },
    enemyLabels: {
      basic: "Basic",
      runner: "Runner",
      brute: "Brute",
      shield: "Shield",
      boss: "Boss",
    },
  },
};

export function isUiLanguage(value: string | null): value is UiLanguage {
  return value === "de" || value === "en";
}

export function isDesignMode(value: string | null): value is DesignMode {
  return value === "standard" || value === "arcade";
}

export function getTranslations(language: UiLanguage): PrototypeTranslations {
  return TRANSLATIONS[language];
}
