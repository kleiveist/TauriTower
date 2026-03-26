export type GameState = "menu" | "playing" | "game_over" | "victory";

export type DifficultyName = "leicht" | "mittel" | "schwer" | "unmoeglich";

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
  bossName: string;
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
  bossName: string;
  basic: number;
  runner: number;
  brute: number;
  shield: number;
}

export interface GameSnapshot {
  state: GameState;
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
  currentWaveBossName: string;
  message: string;
  messageTimer: number;
  towers: TowerSnapshot[];
  enemies: EnemySnapshot[];
  bullets: BulletSnapshot[];
  nextWavePreview: WavePreview;
}

export interface Rng {
  nextFloat(): number;
}

export interface ResetOptions {
  maxLevelOverride?: number;
}

export interface GameSessionOptions extends ResetOptions {
  rng?: Rng;
  seed?: number;
  initialDifficulty?: DifficultyName;
}

export type GameAction =
  | { type: "chooseDifficulty"; difficulty: DifficultyName }
  | { type: "startWave" }
  | { type: "selectTower"; tower: TowerName }
  | { type: "clearSelection" }
  | { type: "placeTower"; position: Point }
  | { type: "restart" }
  | { type: "returnToMenu" };

export interface GameSession {
  tick(dtSeconds: number): void;
  applyAction(action: GameAction): void;
  getSnapshot(): GameSnapshot;
  reset(difficulty: DifficultyName, options?: ResetOptions): void;
}
