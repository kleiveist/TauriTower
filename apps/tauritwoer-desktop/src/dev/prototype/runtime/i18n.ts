import type {
  DifficultyName,
  GameMessage,
  MapId,
  SandboxEnemyType,
  SandboxValidationIssue,
  TowerName,
} from "../types";

export type UiLanguage = "de" | "en";

export type DesignMode = "standard" | "arcade";

export type DebugMode = "off" | "on";

export const BOSS_STAGE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

interface RuntimeMessageTemplates {
  spaceToStartWave: string;
  victoryAllLevels: string;
  waveClearedNextLevel: string;
  gameOver: string;
  levelStarted: string;
  levelStartedWithBoss: string;
  towerUnlocksAtLevel: string;
  notEnoughMoney: string;
  towerCannotBePlaced: string;
  towerPlaced: string;
}

interface SandboxValidationTexts {
  slotIdRequired: string;
  startRoundMin: string;
  baseCountNonNegative: string;
  addEvery10NonNegative: string;
  multiplierRange: string;
  bossStageRange: string;
  slotsMustBeArray: string;
  duplicateId: string;
  slotPrefix: string;
}

export interface PrototypeTranslations {
  app: {
    ariaLabel: string;
  };
  settings: {
    title: string;
    language: string;
    design: string;
    debug: string;
    languageOptionLabels: Record<UiLanguage, string>;
    designOptionLabels: Record<DesignMode, string>;
    debugOptionLabels: Record<DebugMode, string>;
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
    menu: string;
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
    names: Record<MapId, string>;
    shortLabels: Record<MapId, string>;
    descriptions: Record<MapId, string>;
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
    validation: SandboxValidationTexts;
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
  runtime: {
    startScreen: {
      title: string;
      subtitle: string;
      features: string[];
      startButton: string;
    };
    difficultyScreen: {
      title: string;
      multiplierLabel: string;
    };
    sidebar: {
      title: string;
      rules: string;
      map: string;
      level: string;
      lives: string;
      money: string;
      selected: string;
      dps: string;
      speed: string;
      none: string;
      nextWave: string;
      boss: string;
      startWave: string;
      waveRunning: string;
      controlsDesktopPrimary: string;
      controlsDesktopSecondary: string;
      controlsCompactPrimary: string;
      controlsCompactSecondary: string;
    };
    tower: {
      names: Record<TowerName, string>;
      descriptions: Record<TowerName, string>;
      specials: Record<TowerName, string>;
      tooltip: {
        cost: string;
        dps: string;
        range: string;
        special: string;
        unlockAtLevel: string;
        hoverHint: string;
        tapHint: string;
      };
    };
    bossNames: Record<number, string>;
    endOverlay: {
      victory: string;
      gameOver: string;
      prompt: string;
      restart: string;
      mainMenu: string;
    };
    pause: {
      title: string;
      subtitle: string;
      restartConfirmTitle: string;
      menuConfirmTitle: string;
      confirmBody: string;
      resume: string;
      restart: string;
      menu: string;
      confirm: string;
      cancel: string;
    };
    debug: {
      title: string;
      fps: string;
      frameMs: string;
      simMs: string;
      towers: string;
      enemies: string;
      bullets: string;
      wave: string;
      remaining: string;
    };
    messages: RuntimeMessageTemplates;
  };
}

export const DEFAULT_UI_LANGUAGE: UiLanguage = "de";

export const DEFAULT_DESIGN_MODE: DesignMode = "standard";

export const DEFAULT_DEBUG_MODE: DebugMode = "off";

export const UI_PREFERENCE_KEYS = {
  language: "tauritwoer.ui.language",
  designMode: "tauritwoer.ui.designMode",
  debugMode: "tauritwoer.ui.debugMode",
} as const;

export const TRANSLATIONS: Record<UiLanguage, PrototypeTranslations> = {
  de: {
    app: {
      ariaLabel: "TauriTwoer Tower-Defense-Prototyp",
    },
    settings: {
      title: "Einstellungen",
      language: "Sprache",
      design: "Design",
      debug: "Debug",
      languageOptionLabels: {
        de: "Deutsch",
        en: "Englisch",
      },
      designOptionLabels: {
        standard: "Standard",
        arcade: "Arcade Neon",
      },
      debugOptionLabels: {
        off: "Aus",
        on: "An",
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
      menu: "Hauptmenü",
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
      names: {
        meadow: "Smaragdwiese",
        canal: "Eisenkanal",
        switchback: "Serpentinenrücken",
      },
      shortLabels: {
        meadow: "Wiese",
        canal: "Kanal",
        switchback: "Serpentine",
      },
      descriptions: {
        meadow: "Ausgewogene Standardroute mit breiten Platzierungszonen.",
        canal: "Enge Kurven und lange Mittellinie belohnen präzise Positionierung.",
        switchback: "Mehrfach-Kurven mit starker Verdichtung nahe der Basis.",
      },
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
      validation: {
        slotIdRequired: "Slot-ID ist erforderlich.",
        startRoundMin: "Start-Runde muss mindestens {min} sein.",
        baseCountNonNegative: "Basisanzahl darf nicht negativ sein.",
        addEvery10NonNegative: "Additiv alle 10 Runden darf nicht negativ sein.",
        multiplierRange: "Multiplikator muss zwischen {min} und {max} liegen.",
        bossStageRange: "Boss-Stufe muss zwischen {min} und {max} liegen.",
        slotsMustBeArray: "Slots müssen als Liste vorliegen.",
        duplicateId: "Doppelte Slot-ID: {id}",
        slotPrefix: "Slot {slot}: {message}",
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
    runtime: {
      startScreen: {
        title: "TauriTwoer Defense",
        subtitle: "Canvas-Prototyp in Tauri + TypeScript",
        features: [
          "Responsive Desktop- und Compact-Sidebar",
          "Wellenformel: ceil(level * multiplikator)",
          "Boss alle 10 Runden",
          "Panzer-Turm als spätes Power-Spike",
        ],
        startButton: "Start",
      },
      difficultyScreen: {
        title: "Schwierigkeit wählen",
        multiplierLabel: "Spawn-Multiplikator",
      },
      sidebar: {
        title: "Tower Defense",
        rules: "Modus",
        map: "Karte",
        level: "Runde",
        lives: "Leben",
        money: "Credits",
        selected: "Auswahl",
        dps: "DPS",
        speed: "Tempo",
        none: "Keine",
        nextWave: "Nächste Welle",
        boss: "Boss",
        startWave: "Welle starten",
        waveRunning: "Welle läuft ({spawned}/{total})",
        controlsDesktopPrimary: "Steuerung: [1-5] Tower  [Leertaste] Welle  [R] Neustart  [P/Esc] Pause",
        controlsDesktopSecondary: "[Ctrl +] Schneller  [Ctrl -] Langsamer  [Esc/Rechtsklick] Auswahl löschen  [M] Menü",
        controlsCompactPrimary: "Tippen: Tower kaufen, Tippen außerhalb schließt Info",
        controlsCompactSecondary: "[1-5] Tower  [Leertaste] Welle  [Ctrl +/-] Tempo  [P/Esc] Pause",
      },
      tower: {
        names: {
          Pistolman: "Pistolmann",
          Scharfschuetze: "Scharfschütze",
          Stunner: "Betäuber",
          Bombarman: "Bombenwerfer",
          "Panzer-Tower": "Panzer-Turm",
        },
        descriptions: {
          Pistolman: "Zuverlässiger Einzelziel-Starter.",
          Scharfschuetze: "Extrem große Reichweite für präzise Schüsse.",
          Stunner: "Verlangsamt Gegner mit jedem Treffer.",
          Bombarman: "Flächenschaden gegen dichte Gruppen.",
          "Panzer-Tower": "Sehr teuer, aber gewaltige Kanonenwirkung.",
        },
        specials: {
          Pistolman: "Zuverlässiges Einzelzielfeuer",
          Scharfschuetze: "Langstrecken-Präzisionsschüsse",
          Stunner: "Verlangsamt Ziele für kurze Zeit",
          Bombarman: "Explosionsradius gegen Gruppen",
          "Panzer-Tower": "Schwere Kanone mit Splash-Schaden",
        },
        tooltip: {
          cost: "Kosten",
          dps: "DPS",
          range: "Reichweite",
          special: "Spezial",
          unlockAtLevel: "Freischaltung bei Runde {level}",
          hoverHint: "Hover: Tooltip aktiv",
          tapHint: "Tippen erneut: schließen",
        },
      },
      bossNames: {
        1: "Eisenkoloss",
        2: "Klingenwurm",
        3: "Frostbrut",
        4: "Aschentitan",
        5: "Schattenfürst",
        6: "Donnerbestie",
        7: "Obsidianhydra",
        8: "Chronogolem",
        9: "Weltenbrecher",
      },
      endOverlay: {
        victory: "Sieg",
        gameOver: "Niederlage",
        prompt: "Wähle eine Aktion, um fortzufahren.",
        restart: "Neustart",
        mainMenu: "Hauptmenü",
      },
      pause: {
        title: "Pausiert",
        subtitle: "Spiel ist angehalten.",
        restartConfirmTitle: "Neustart bestätigen",
        menuConfirmTitle: "Zurück zum Menü bestätigen",
        confirmBody: "Möchtest du diese Aktion wirklich ausführen?",
        resume: "Fortsetzen",
        restart: "Neustart",
        menu: "Hauptmenü",
        confirm: "Bestätigen",
        cancel: "Abbrechen",
      },
      debug: {
        title: "Debug Metriken",
        fps: "FPS",
        frameMs: "Frame ms",
        simMs: "Sim ms",
        towers: "Tower",
        enemies: "Gegner",
        bullets: "Projektile",
        wave: "Welle",
        remaining: "Rest",
      },
      messages: {
        spaceToStartWave: "Leertaste startet die erste Welle.",
        victoryAllLevels: "Sieg! Alle Runden abgeschlossen.",
        waveClearedNextLevel: "Welle geschafft. Nächste Runde: {level}",
        gameOver: "Niederlage",
        levelStarted: "Runde {level} gestartet: {enemies} Gegner",
        levelStartedWithBoss: "Runde {level} gestartet: {enemies} Gegner + Boss: {boss}",
        towerUnlocksAtLevel: "{tower} wird bei Runde {level} freigeschaltet.",
        notEnoughMoney: "Nicht genug Credits.",
        towerCannotBePlaced: "Tower kann dort nicht platziert werden.",
        towerPlaced: "{tower} platziert.",
      },
    },
  },
  en: {
    app: {
      ariaLabel: "TauriTwoer tower defense prototype",
    },
    settings: {
      title: "Settings",
      language: "Language",
      design: "Design",
      debug: "Debug",
      languageOptionLabels: {
        de: "German",
        en: "English",
      },
      designOptionLabels: {
        standard: "Standard",
        arcade: "Arcade Neon",
      },
      debugOptionLabels: {
        off: "Off",
        on: "On",
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
      menu: "Main Menu",
    },
    start: {
      title: "TauriTwoer Defense",
      description: "Hybrid Canvas + React flow with classic waves and editable sandbox slots.",
    },
    mode: {
      title: "Select Mode",
      classicTitle: "Classic",
      classicDescription: "Original wave planner with automatic boss waves every 10 rounds.",
      sandboxTitle: "Sandbox / Agent Box",
      sandboxDescription: "Editable slots define exact spawns, scaling, and explicit boss entries.",
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
      names: {
        meadow: "Emerald Meadow",
        canal: "Iron Canal",
        switchback: "Switchback Ridge",
      },
      shortLabels: {
        meadow: "Meadow",
        canal: "Canal",
        switchback: "Switchback",
      },
      descriptions: {
        meadow: "Balanced lane with broad tower placement coverage.",
        canal: "Tight turns and long center line reward precise placement.",
        switchback: "Multi-turn snake path with late compression near the base.",
      },
    },
    sandbox: {
      title: "Sandbox Slot Editor",
      description:
        "Spawn ordering is blockwise by slot order. Per-slot formula: start gate, base + additive 10-round bands, linear multiplier scaling, rounding, and non-negative clamp.",
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
      validation: {
        slotIdRequired: "Slot id is required.",
        startRoundMin: "Start round must be >= {min}.",
        baseCountNonNegative: "Base count cannot be negative.",
        addEvery10NonNegative: "Add-every-10 cannot be negative.",
        multiplierRange: "Multiplier must be between {min} and {max}.",
        bossStageRange: "Boss stage must be between {min} and {max}.",
        slotsMustBeArray: "Slots must be an array.",
        duplicateId: "Duplicate slot id: {id}",
        slotPrefix: "Slot {slot}: {message}",
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
    runtime: {
      startScreen: {
        title: "TauriTwoer Defense",
        subtitle: "Canvas prototype in Tauri + TypeScript",
        features: [
          "Responsive desktop and compact sidebar",
          "Wave formula: ceil(level * multiplier)",
          "Boss every 10 rounds",
          "Panzer Tower as late-game power spike",
        ],
        startButton: "Start",
      },
      difficultyScreen: {
        title: "Select Difficulty",
        multiplierLabel: "Spawn multiplier",
      },
      sidebar: {
        title: "Tower Defense",
        rules: "Mode",
        map: "Map",
        level: "Round",
        lives: "Lives",
        money: "Credits",
        selected: "Selected",
        dps: "DPS",
        speed: "Speed",
        none: "None",
        nextWave: "Next Wave",
        boss: "Boss",
        startWave: "Start Wave",
        waveRunning: "Wave Running ({spawned}/{total})",
        controlsDesktopPrimary: "Controls: [1-5] Tower  [Space] Wave  [R] Restart  [P/Esc] Pause",
        controlsDesktopSecondary: "[Ctrl +] Faster  [Ctrl -] Slower  [Esc/Right Click] Clear  [M] Menu",
        controlsCompactPrimary: "Tap: buy tower, tap outside closes info",
        controlsCompactSecondary: "[1-5] Tower  [Space] Wave  [Ctrl +/-] Speed  [P/Esc] Pause",
      },
      tower: {
        names: {
          Pistolman: "Pistolman",
          Scharfschuetze: "Sharpshooter",
          Stunner: "Stunner",
          Bombarman: "Bombardier",
          "Panzer-Tower": "Panzer Tower",
        },
        descriptions: {
          Pistolman: "Reliable single-target opener.",
          Scharfschuetze: "Extreme long range precision shots.",
          Stunner: "Applies slow on every hit.",
          Bombarman: "Area splash against dense packs.",
          "Panzer-Tower": "Very expensive with massive cannon output.",
        },
        specials: {
          Pistolman: "Reliable single-target fire",
          Scharfschuetze: "Long-range precision shots",
          Stunner: "Applies strong slowing effect",
          Bombarman: "Explosive splash radius",
          "Panzer-Tower": "Heavy cannon splash damage",
        },
        tooltip: {
          cost: "Cost",
          dps: "DPS",
          range: "Range",
          special: "Special",
          unlockAtLevel: "Unlock at round {level}",
          hoverHint: "Hover tooltip",
          tapHint: "Tap again to close",
        },
      },
      bossNames: {
        1: "Iron Colossus",
        2: "Blade Wyrm",
        3: "Frostspawn",
        4: "Ash Titan",
        5: "Shadow Lord",
        6: "Thunder Beast",
        7: "Obsidian Hydra",
        8: "Chrono Golem",
        9: "Worldbreaker",
      },
      endOverlay: {
        victory: "Victory",
        gameOver: "Game Over",
        prompt: "Choose an action to continue.",
        restart: "Restart",
        mainMenu: "Main Menu",
      },
      pause: {
        title: "Paused",
        subtitle: "Gameplay is currently paused.",
        restartConfirmTitle: "Confirm Restart",
        menuConfirmTitle: "Confirm Return to Menu",
        confirmBody: "Do you really want to perform this action?",
        resume: "Resume",
        restart: "Restart",
        menu: "Main Menu",
        confirm: "Confirm",
        cancel: "Cancel",
      },
      debug: {
        title: "Debug Metrics",
        fps: "FPS",
        frameMs: "Frame ms",
        simMs: "Sim ms",
        towers: "Towers",
        enemies: "Enemies",
        bullets: "Bullets",
        wave: "Wave",
        remaining: "Remaining",
      },
      messages: {
        spaceToStartWave: "Press space to start the first wave.",
        victoryAllLevels: "Victory! All rounds completed.",
        waveClearedNextLevel: "Wave cleared. Next round: {level}",
        gameOver: "Game Over",
        levelStarted: "Round {level} started: {enemies} enemies",
        levelStartedWithBoss: "Round {level} started: {enemies} enemies + Boss: {boss}",
        towerUnlocksAtLevel: "{tower} unlocks at round {level}.",
        notEnoughMoney: "Not enough credits.",
        towerCannotBePlaced: "Tower cannot be placed there.",
        towerPlaced: "{tower} placed.",
      },
    },
  },
};

export function isUiLanguage(value: string | null): value is UiLanguage {
  return value === "de" || value === "en";
}

export function isDesignMode(value: string | null): value is DesignMode {
  return value === "standard" || value === "arcade";
}

export function isDebugMode(value: string | null): value is DebugMode {
  return value === "off" || value === "on";
}

export function getTranslations(language: UiLanguage): PrototypeTranslations {
  return TRANSLATIONS[language];
}

export function getTowerName(language: UiLanguage, tower: TowerName): string {
  return TRANSLATIONS[language].runtime.tower.names[tower];
}

export function getTowerDescription(language: UiLanguage, tower: TowerName): string {
  return TRANSLATIONS[language].runtime.tower.descriptions[tower];
}

export function getTowerSpecial(language: UiLanguage, tower: TowerName): string {
  return TRANSLATIONS[language].runtime.tower.specials[tower];
}

export function getMapName(language: UiLanguage, mapId: MapId): string {
  return TRANSLATIONS[language].map.names[mapId];
}

export function getMapShortLabel(language: UiLanguage, mapId: MapId): string {
  return TRANSLATIONS[language].map.shortLabels[mapId];
}

export function getMapDescription(language: UiLanguage, mapId: MapId): string {
  return TRANSLATIONS[language].map.descriptions[mapId];
}

export function getBossName(language: UiLanguage, stage: number | null): string {
  if (!stage) {
    return TRANSLATIONS[language].preview.bossUnknown;
  }
  return TRANSLATIONS[language].runtime.bossNames[stage] ?? TRANSLATIONS[language].preview.bossUnknown;
}

export function formatSandboxValidationIssue(issue: SandboxValidationIssue, language: UiLanguage): string {
  const text = TRANSLATIONS[language].sandbox.validation;
  let message = "";

  switch (issue.code) {
    case "slot_id_required":
      message = text.slotIdRequired;
      break;
    case "start_round_min":
      message = interpolate(text.startRoundMin, { min: issue.min ?? 1 });
      break;
    case "base_count_non_negative":
      message = text.baseCountNonNegative;
      break;
    case "add_every_10_non_negative":
      message = text.addEvery10NonNegative;
      break;
    case "multiplier_range":
      message = interpolate(text.multiplierRange, {
        min: issue.min ?? 0,
        max: issue.max ?? 0,
      });
      break;
    case "boss_stage_range":
      message = interpolate(text.bossStageRange, {
        min: issue.min ?? 1,
        max: issue.max ?? 9,
      });
      break;
    case "slots_must_be_array":
      message = text.slotsMustBeArray;
      break;
    case "duplicate_id":
      message = interpolate(text.duplicateId, { id: issue.id ?? "-" });
      break;
    default:
      message = "";
      break;
  }

  if (typeof issue.slotIndex === "number") {
    return interpolate(text.slotPrefix, { slot: issue.slotIndex, message });
  }
  return message;
}

export function formatGameMessage(message: GameMessage, language: UiLanguage): string {
  const text = TRANSLATIONS[language];
  const templates = text.runtime.messages;

  switch (message.code) {
    case "none":
      return "";
    case "space_to_start_wave":
      return templates.spaceToStartWave;
    case "victory_all_levels":
      return templates.victoryAllLevels;
    case "wave_cleared_next_level":
      return interpolate(templates.waveClearedNextLevel, { level: message.level });
    case "game_over":
      return templates.gameOver;
    case "level_started": {
      if (message.bossStage) {
        return interpolate(templates.levelStartedWithBoss, {
          level: message.level,
          enemies: message.enemies,
          boss: getBossName(language, message.bossStage),
        });
      }
      return interpolate(templates.levelStarted, {
        level: message.level,
        enemies: message.enemies,
      });
    }
    case "tower_unlocks_at_level":
      return interpolate(templates.towerUnlocksAtLevel, {
        tower: getTowerName(language, message.tower),
        level: message.level,
      });
    case "not_enough_money":
      return templates.notEnoughMoney;
    case "tower_cannot_be_placed":
      return templates.towerCannotBePlaced;
    case "tower_placed":
      return interpolate(templates.towerPlaced, {
        tower: getTowerName(language, message.tower),
      });
    default:
      return "";
  }
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }, template);
}
