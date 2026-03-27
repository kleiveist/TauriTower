export type GameState = "menu" | "playing" | "game_over" | "victory";

export type GameMode = "classic" | "sandbox";

export type DifficultyName = "leicht" | "mittel" | "schwer" | "unmoeglich";

export type MapId = "meadow" | "canal" | "switchback";

export type TowerName =
  | "Pistolman"
  | "Scharfschuetze"
  | "Stunner"
  | "Bombarman"
  | "Panzer-Tower";

export type EnemyType = "basic" | "runner" | "brute" | "shield" | "boss";

export type BulletType = "single" | "stun" | "splash" | "cannon";

export type BossShape =
  | "circle"
  | "square"
  | "diamond"
  | "triangle"
  | "hex"
  | "star"
  | "spikes"
  | "crown"
  | "orb"
  | "skull";

export type SpawnKey = "basic" | "runner" | "brute" | "shield" | `boss_${number}`;

export type SandboxEnemyType = "basic" | "runner" | "brute" | "shield" | "boss";

export type ColorRgb = [number, number, number];

export interface Point {
  x: number;
  y: number;
}

export interface DifficultyProfile {
  maxLevel: number;
  countMult: number;
  hpMult: number;
  speedMult: number;
  rewardMult: number;
  startMoney: number;
  lives: number;
}

export interface TowerStats {
  unlock: number;
  cost: number;
  range: number;
  damage: number;
  cooldown: number;
  bulletSpeed: number;
  color: ColorRgb;
  kind: BulletType;
  splashRadius?: number;
  slowFactor?: number;
  slowDuration?: number;
}

export interface EnemyArchetype {
  baseHp: number;
  hpGrowth: number;
  baseSpeed: number;
  speedGrowth: number;
  rewardBase: number;
  rewardGrowth: number;
  radius: number;
  color: ColorRgb;
  armor: number;
  slowResist: number;
  splashResist?: number;
  lifeDamage: number;
}

export interface BossProfile {
  name: string;
  shape: BossShape;
  color: ColorRgb;
  hpMult: number;
  speedMult: number;
  armor: number;
  slowResist: number;
  regen: number;
  rewardMult: number;
  radius: number;
  lifeDamage: number;
}

export interface MapDefinition {
  id: MapId;
  name: string;
  shortLabel: string;
  description: string;
  pathPoints: Point[];
  accent: ColorRgb;
}

export interface SandboxSlot {
  id: string;
  enemyType: SandboxEnemyType;
  bossStage: number;
  startRound: number;
  baseCount: number;
  multiplier: number;
  addEvery10Rounds: number;
  enabled: boolean;
}

export interface SandboxConfig {
  slots: SandboxSlot[];
}

export type SandboxValidationCode =
  | "slot_id_required"
  | "start_round_min"
  | "base_count_non_negative"
  | "add_every_10_non_negative"
  | "multiplier_range"
  | "boss_stage_range"
  | "slots_must_be_array"
  | "duplicate_id";

export interface SandboxValidationIssue {
  code: SandboxValidationCode;
  slotIndex?: number;
  min?: number;
  max?: number;
  id?: string;
}

export interface SandboxSlotValidationResult {
  valid: boolean;
  issues: SandboxValidationIssue[];
}

export type GameMessage =
  | { code: "none" }
  | { code: "space_to_start_wave" }
  | { code: "victory_all_levels" }
  | { code: "wave_cleared_next_level"; level: number }
  | { code: "game_over" }
  | { code: "level_started"; level: number; enemies: number; bossStage: number | null }
  | { code: "tower_unlocks_at_level"; tower: TowerName; level: number }
  | { code: "not_enough_money" }
  | { code: "tower_cannot_be_placed" }
  | { code: "tower_placed"; tower: TowerName };

export interface EnemySnapshot {
  id: number;
  pos: Point;
  pathIndex: number;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  enemyType: EnemyType;
  radius: number;
  color: ColorRgb;
  slowFactor: number;
  slowTimer: number;
  reachedEnd: boolean;
  dead: boolean;
  armor: number;
  slowResistance: number;
  splashResistance: number;
  regenPerSec: number;
  lifeDamage: number;
  bossStage: number | null;
  bossShape: BossShape;
}

export interface BulletSnapshot {
  id: number;
  pos: Point;
  targetEnemyId: number;
  damage: number;
  speed: number;
  color: ColorRgb;
  bulletType: BulletType;
  splashRadius: number;
  slowFactor: number;
  slowDuration: number;
  radius: number;
  dead: boolean;
}

export interface TowerSnapshot {
  id: number;
  pos: Point;
  towerType: TowerName;
  cooldownLeft: number;
}

export interface WavePreview {
  count: number;
  boss: boolean;
  bossStage: number | null;
  basic: number;
  runner: number;
  brute: number;
  shield: number;
}

export interface GameSnapshot {
  state: GameState;
  mode: GameMode;
  mapId: MapId;
  difficultyName: DifficultyName;
  level: number;
  maxLevel: number;
  money: number;
  lives: number;
  selectedTowerName: TowerName | null;
  waveActive: boolean;
  wavePlan: SpawnKey[];
  spawnTimer: number;
  spawnInterval: number;
  spawnedThisWave: number;
  totalWaveEnemies: number;
  currentWaveBossStage: number | null;
  message: GameMessage;
  messageTimer: number;
  towers: TowerSnapshot[];
  enemies: EnemySnapshot[];
  bullets: BulletSnapshot[];
  nextWavePreview: WavePreview;
  sandboxConfig: SandboxConfig;
}

export interface Rng {
  nextFloat(): number;
}

export interface ResetOptions {
  maxLevelOverride?: number;
  mode?: GameMode;
  mapId?: MapId;
  sandboxConfig?: SandboxConfig;
}

export interface GameSessionOptions extends ResetOptions {
  rng?: Rng;
  seed?: number;
  initialDifficulty?: DifficultyName;
}

export type GameAction =
  | {
      type: "chooseDifficulty";
      difficulty: DifficultyName;
      mode?: GameMode;
      mapId?: MapId;
      sandboxConfig?: SandboxConfig;
    }
  | { type: "startWave" }
  | { type: "selectTower"; tower: TowerName }
  | { type: "clearSelection" }
  | { type: "placeTower"; position: Point }
  | { type: "restart" }
  | { type: "returnToMenu" }
  | { type: "setSandboxConfig"; config: SandboxConfig }
  | { type: "setMap"; mapId: MapId }
  | { type: "setMode"; mode: GameMode };

export interface GameSession {
  tick(dtSeconds: number): void;
  applyAction(action: GameAction): void;
  getSnapshot(): GameSnapshot;
  reset(difficulty: DifficultyName, options?: ResetOptions): void;
}
