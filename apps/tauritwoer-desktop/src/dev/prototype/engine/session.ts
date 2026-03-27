import { BOSS_PROFILES } from "../data/bosses";
import { DEFAULT_MAP_ID, getMapDefinition } from "../data/maps";
import { DIFFICULTIES } from "../data/difficulties";
import { ENEMY_ARCHETYPES } from "../data/enemies";
import { TOWER_TYPES } from "../data/towers";
import { updateBullet } from "../domain/bullet";
import { updateEnemy } from "../domain/enemy";
import {
  buildSandboxWavePlan,
  cloneSandboxConfig,
  createDefaultSandboxConfig,
  previewSandboxWaveInfo,
} from "../domain/sandbox";
import { validTowerPosition } from "../domain/placement";
import { updateTower } from "../domain/tower";
import { bossStageFromSpawnKey, buildWavePlan, previewWaveInfo } from "../domain/waves";
import { pickRng, rngRange } from "../rng";
import type {
  DifficultyName,
  DifficultyProfile,
  GameAction,
  GameMessage,
  GameMode,
  GameSession,
  GameSessionOptions,
  GameSnapshot,
  MapId,
  ResetOptions,
  SandboxConfig,
  SpawnKey,
  TowerName,
} from "../types";

interface MutableSessionState {
  difficulty: DifficultyProfile;
  snapshot: GameSnapshot;
  waveSpawnIndex: number;
  nextEnemyId: number;
  nextTowerId: number;
  nextBulletId: number;
}

export function createGameSession(options: GameSessionOptions = {}): GameSession {
  return new GameSessionImpl(options);
}

class GameSessionImpl implements GameSession {
  private readonly rng: ReturnType<typeof pickRng>;

  private readonly defaultMaxLevelOverride: number | undefined;

  private readonly state: MutableSessionState;

  private autoWaveCountdown = -1;

  constructor(options: GameSessionOptions) {
    this.rng = pickRng(options.rng, options.seed);
    this.defaultMaxLevelOverride = options.maxLevelOverride;

    const difficultyName = options.initialDifficulty ?? "leicht";
    const difficulty = DIFFICULTIES[difficultyName];

    const mode = options.mode ?? "classic";
    const mapId = options.mapId ?? DEFAULT_MAP_ID;
    const sandboxConfig = options.sandboxConfig
      ? cloneSandboxConfig(options.sandboxConfig)
      : createDefaultSandboxConfig();

    this.state = {
      difficulty,
      snapshot: createInitialSnapshot("menu", difficultyName, difficulty, {
        maxLevelOverride: options.maxLevelOverride,
        mode,
        mapId,
        sandboxConfig,
      }),
      waveSpawnIndex: 0,
      nextEnemyId: 1,
      nextTowerId: 1,
      nextBulletId: 1,
    };

    if (options.initialDifficulty) {
      this.reset(options.initialDifficulty, {
        mode,
        mapId,
        sandboxConfig,
      });
    }
  }

  reset(difficultyName: DifficultyName, options?: ResetOptions): void {
    const difficulty = DIFFICULTIES[difficultyName];
    const maxLevel = options?.maxLevelOverride ?? this.defaultMaxLevelOverride ?? difficulty.maxLevel;

    const previous = this.state.snapshot;
    const mode = options?.mode ?? previous.mode;
    const mapId = options?.mapId ?? previous.mapId;
    const sandboxConfig = options?.sandboxConfig
      ? cloneSandboxConfig(options.sandboxConfig)
      : cloneSandboxConfig(previous.sandboxConfig);

    this.state.difficulty = difficulty;
    this.state.snapshot = {
      state: "playing",
      mode,
      mapId,
      sandboxConfig,
      difficultyName,
      level: 1,
      maxLevel,
      money: difficulty.startMoney,
      lives: difficulty.lives,
      towers: [],
      enemies: [],
      bullets: [],
      selectedTowerName: null,
      waveActive: false,
      wavePlan: [],
      spawnTimer: 0,
      spawnInterval: 0.52,
      spawnedThisWave: 0,
      totalWaveEnemies: 0,
      currentWaveBossStage: null,
      message: { code: "space_to_start_wave" },
      messageTimer: 4.0,
      nextWavePreview: this.previewFor(1, mode, difficulty, sandboxConfig),
    };

    this.state.nextEnemyId = 1;
    this.state.nextTowerId = 1;
    this.state.nextBulletId = 1;
    this.state.waveSpawnIndex = 0;
    this.autoWaveCountdown = -1;
  }

  applyAction(action: GameAction): void {
    switch (action.type) {
      case "chooseDifficulty": {
        this.reset(action.difficulty, {
          mode: action.mode ?? this.state.snapshot.mode,
          mapId: action.mapId ?? this.state.snapshot.mapId,
          sandboxConfig: action.sandboxConfig ?? this.state.snapshot.sandboxConfig,
        });
        break;
      }
      case "setMode": {
        this.state.snapshot.mode = action.mode;
        break;
      }
      case "setMap": {
        this.state.snapshot.mapId = action.mapId;
        break;
      }
      case "setSandboxConfig": {
        this.state.snapshot.sandboxConfig = cloneSandboxConfig(action.config);
        break;
      }
      case "startWave": {
        if (this.state.snapshot.state === "playing") {
          this.autoWaveCountdown = -1;
          this.startWave();
        }
        break;
      }
      case "selectTower": {
        if (this.state.snapshot.state === "playing") {
          this.trySelectTower(action.tower);
        }
        break;
      }
      case "clearSelection": {
        this.state.snapshot.selectedTowerName = null;
        break;
      }
      case "placeTower": {
        if (this.state.snapshot.state === "playing") {
          this.placeTower(action.position.x, action.position.y);
        }
        break;
      }
      case "restart": {
        if (this.state.snapshot.state !== "menu") {
          this.reset(this.state.snapshot.difficultyName, {
            mode: this.state.snapshot.mode,
            mapId: this.state.snapshot.mapId,
            sandboxConfig: this.state.snapshot.sandboxConfig,
          });
        }
        break;
      }
      case "returnToMenu": {
        this.state.snapshot.state = "menu";
        this.state.snapshot.selectedTowerName = null;
        this.state.waveSpawnIndex = 0;
        this.showMessage({ code: "none" }, 0);
        this.autoWaveCountdown = -1;
        break;
      }
      default: {
        assertUnreachable(action);
      }
    }

    this.refreshWavePreview();
  }

  tick(dtSeconds: number): void {
    if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) {
      return;
    }

    const snapshot = this.state.snapshot;

    if (snapshot.state !== "playing") {
      this.updateMessageTimer(dtSeconds);
      this.refreshWavePreview();
      return;
    }

    this.updateMessageTimer(dtSeconds);

    if (!snapshot.waveActive && this.autoWaveCountdown >= 0) {
      this.autoWaveCountdown -= dtSeconds;
      if (this.autoWaveCountdown <= 0) {
        this.autoWaveCountdown = -1;
        this.startWave();
      }
    }

    if (snapshot.waveActive && this.state.waveSpawnIndex < snapshot.wavePlan.length) {
      snapshot.spawnTimer -= dtSeconds;
      if (snapshot.spawnTimer <= 0) {
        const enemyType = snapshot.wavePlan[this.state.waveSpawnIndex];
        if (!enemyType) {
          this.state.waveSpawnIndex = snapshot.wavePlan.length;
        } else {
          this.state.waveSpawnIndex += 1;
          this.spawnEnemy(enemyType);
          snapshot.spawnedThisWave += 1;
          snapshot.spawnTimer = snapshot.spawnInterval * (enemyType.startsWith("boss_") ? 1.6 : 1.0);
        }
      }
    }

    const pathPoints = getMapDefinition(snapshot.mapId).pathPoints;

    for (const enemy of snapshot.enemies) {
      updateEnemy(enemy, dtSeconds, pathPoints);
      if (enemy.reachedEnd && !enemy.dead) {
        enemy.dead = true;
        snapshot.lives -= enemy.lifeDamage;
      }
    }

    for (const tower of snapshot.towers) {
      updateTower(
        tower,
        dtSeconds,
        snapshot.enemies,
        snapshot.bullets,
        () => this.state.nextBulletId++,
      );
    }

    const enemiesById = new Map<number, (typeof snapshot.enemies)[number]>();
    for (const enemy of snapshot.enemies) {
      enemiesById.set(enemy.id, enemy);
    }

    for (const bullet of snapshot.bullets) {
      const killed = updateBullet(bullet, dtSeconds, snapshot.enemies, enemiesById);
      if (killed.length === 0) {
        continue;
      }

      const uniqueKills = new Map<number, number>();
      for (const enemy of killed) {
        uniqueKills.set(enemy.id, enemy.reward);
      }
      for (const reward of uniqueKills.values()) {
        snapshot.money += reward;
      }
    }

    snapshot.enemies = snapshot.enemies.filter((enemy) => !enemy.dead);
    snapshot.bullets = snapshot.bullets.filter((bullet) => !bullet.dead);

    if (
      snapshot.waveActive &&
      this.state.waveSpawnIndex >= snapshot.wavePlan.length &&
      snapshot.enemies.length === 0
    ) {
      snapshot.waveActive = false;
      snapshot.wavePlan = [];
      this.state.waveSpawnIndex = 0;
      snapshot.level += 1;

      if (snapshot.level > snapshot.maxLevel) {
        snapshot.state = "victory";
        this.showMessage({ code: "victory_all_levels" }, 5);
        this.autoWaveCountdown = -1;
      } else {
        snapshot.money += 28 + snapshot.level * 2;
        this.showMessage({ code: "wave_cleared_next_level", level: snapshot.level }, 2.2);
        this.autoWaveCountdown = 1.4;
      }
    }

    if (snapshot.lives <= 0) {
      snapshot.state = "game_over";
      this.showMessage({ code: "game_over" }, 5);
      this.autoWaveCountdown = -1;
    }

    this.refreshWavePreview();
  }

  getSnapshot(): GameSnapshot {
    const source = this.state.snapshot;

    return {
      state: source.state,
      mode: source.mode,
      mapId: source.mapId,
      sandboxConfig: cloneSandboxConfig(source.sandboxConfig),
      difficultyName: source.difficultyName,
      level: source.level,
      maxLevel: source.maxLevel,
      money: source.money,
      lives: source.lives,
      selectedTowerName: source.selectedTowerName,
      waveActive: source.waveActive,
      wavePlan: [...source.wavePlan],
      spawnTimer: source.spawnTimer,
      spawnInterval: source.spawnInterval,
      spawnedThisWave: source.spawnedThisWave,
      totalWaveEnemies: source.totalWaveEnemies,
      currentWaveBossStage: source.currentWaveBossStage,
      message: cloneGameMessage(source.message),
      messageTimer: source.messageTimer,
      towers: source.towers.map((tower) => ({
        ...tower,
        pos: { x: tower.pos.x, y: tower.pos.y },
      })),
      enemies: source.enemies.map((enemy) => ({
        ...enemy,
        pos: { x: enemy.pos.x, y: enemy.pos.y },
        color: [...enemy.color] as [number, number, number],
      })),
      bullets: source.bullets.map((bullet) => ({
        ...bullet,
        pos: { x: bullet.pos.x, y: bullet.pos.y },
        color: [...bullet.color] as [number, number, number],
      })),
      nextWavePreview: { ...source.nextWavePreview },
    };
  }

  getLiveSnapshot(): Readonly<GameSnapshot> {
    return this.state.snapshot;
  }

  private previewFor(
    level: number,
    mode: GameMode,
    difficulty: DifficultyProfile,
    sandboxConfig: SandboxConfig,
  ): GameSnapshot["nextWavePreview"] {
    if (mode === "sandbox") {
      return previewSandboxWaveInfo(level, sandboxConfig);
    }
    return previewWaveInfo(level, difficulty);
  }

  private updateMessageTimer(dtSeconds: number): void {
    const snapshot = this.state.snapshot;
    if (snapshot.messageTimer <= 0) {
      return;
    }

    snapshot.messageTimer -= dtSeconds;
    if (snapshot.messageTimer <= 0) {
      snapshot.message = { code: "none" };
      snapshot.messageTimer = 0;
    }
  }

  private showMessage(message: GameMessage, seconds = 2.0): void {
    this.state.snapshot.message = message;
    this.state.snapshot.messageTimer = seconds;
  }

  private refreshWavePreview(): void {
    this.state.snapshot.nextWavePreview = this.previewFor(
      this.state.snapshot.level,
      this.state.snapshot.mode,
      this.state.difficulty,
      this.state.snapshot.sandboxConfig,
    );
  }

  private startWave(): void {
    const snapshot = this.state.snapshot;
    if (snapshot.waveActive || snapshot.wavePlan.length > 0) {
      return;
    }
    if (snapshot.level > snapshot.maxLevel) {
      return;
    }

    snapshot.wavePlan =
      snapshot.mode === "sandbox"
        ? buildSandboxWavePlan(snapshot.level, snapshot.sandboxConfig)
        : buildWavePlan(snapshot.level, this.state.difficulty);
    this.state.waveSpawnIndex = 0;
    snapshot.totalWaveEnemies = snapshot.wavePlan.length;
    snapshot.spawnedThisWave = 0;
    snapshot.currentWaveBossStage = null;

    for (const enemyType of snapshot.wavePlan) {
      const stage = bossStageFromSpawnKey(enemyType);
      if (stage) {
        snapshot.currentWaveBossStage = stage;
        break;
      }
    }

    snapshot.waveActive = true;
    snapshot.spawnInterval = Math.max(0.1, 0.46 - Math.min(snapshot.level, 90) * 0.0025);
    snapshot.spawnTimer = snapshot.wavePlan.length === 0 ? 0 : 0.08;
    this.showMessage({
      code: "level_started",
      level: snapshot.level,
      enemies: snapshot.totalWaveEnemies,
      bossStage: snapshot.currentWaveBossStage,
    });
  }

  private spawnEnemy(enemyType: SpawnKey): void {
    const snapshot = this.state.snapshot;
    const diff = this.state.difficulty;
    const levelFactor = snapshot.level;

    const startPoint = getMapDefinition(snapshot.mapId).pathPoints[0];
    if (!startPoint) {
      return;
    }

    const bossStage = bossStageFromSpawnKey(enemyType);
    if (bossStage) {
      const profile = BOSS_PROFILES[bossStage];
      if (!profile) {
        return;
      }

      const hp =
        (540 + levelFactor * 130) *
        diff.hpMult *
        profile.hpMult *
        rngRange(this.rng, 0.98, 1.04);

      const speed =
        (48 + levelFactor * 1.15) *
        diff.speedMult *
        profile.speedMult *
        rngRange(this.rng, 0.98, 1.03);

      const reward = Math.trunc((88 + levelFactor * 10) * diff.rewardMult * profile.rewardMult);

      snapshot.enemies.push({
        id: this.state.nextEnemyId++,
        pos: { x: startPoint.x, y: startPoint.y },
        pathIndex: 0,
        hp,
        maxHp: hp,
        speed,
        reward,
        enemyType: "boss",
        radius: profile.radius,
        color: [...profile.color] as [number, number, number],
        slowFactor: 1.0,
        slowTimer: 0,
        reachedEnd: false,
        dead: false,
        armor: profile.armor + levelFactor * 0.05,
        slowResistance: profile.slowResist,
        splashResistance: Math.min(0.58, 0.16 + bossStage * 0.035),
        regenPerSec: profile.regen,
        lifeDamage: profile.lifeDamage,
        bossStage,
        bossShape: profile.shape,
      });
      return;
    }

    if (enemyType !== "basic" && enemyType !== "runner" && enemyType !== "brute" && enemyType !== "shield") {
      return;
    }

    const archetype = ENEMY_ARCHETYPES[enemyType];

    const hp =
      (archetype.baseHp + levelFactor * archetype.hpGrowth) *
      diff.hpMult *
      rngRange(this.rng, 0.96, 1.08);

    const speed =
      (archetype.baseSpeed + levelFactor * archetype.speedGrowth) *
      diff.speedMult *
      rngRange(this.rng, 0.97, 1.04);

    const reward = Math.trunc((archetype.rewardBase + levelFactor * archetype.rewardGrowth) * diff.rewardMult);

    const armor =
      archetype.armor + levelFactor * (enemyType === "brute" || enemyType === "shield" ? 0.03 : 0.0);

    snapshot.enemies.push({
      id: this.state.nextEnemyId++,
      pos: { x: startPoint.x, y: startPoint.y },
      pathIndex: 0,
      hp,
      maxHp: hp,
      speed,
      reward,
      enemyType,
      radius: archetype.radius,
      color: [...archetype.color] as [number, number, number],
      slowFactor: 1.0,
      slowTimer: 0,
      reachedEnd: false,
      dead: false,
      armor,
      slowResistance: archetype.slowResist,
      splashResistance: archetype.splashResist ?? 0,
      regenPerSec: enemyType === "shield" ? 0.18 + levelFactor * 0.02 : 0,
      lifeDamage: archetype.lifeDamage,
      bossStage: null,
      bossShape: "circle",
    });
  }

  private trySelectTower(towerName: TowerName): void {
    const snapshot = this.state.snapshot;
    const towerStats = TOWER_TYPES[towerName];

    if (snapshot.level < towerStats.unlock) {
      this.showMessage({ code: "tower_unlocks_at_level", tower: towerName, level: towerStats.unlock }, 1.9);
      return;
    }
    if (snapshot.money < towerStats.cost) {
      this.showMessage({ code: "not_enough_money" }, 1.6);
      return;
    }

    snapshot.selectedTowerName = towerName;
  }

  private placeTower(x: number, y: number): void {
    const snapshot = this.state.snapshot;
    if (!snapshot.selectedTowerName) {
      return;
    }

    const towerName = snapshot.selectedTowerName;
    const cost = TOWER_TYPES[towerName].cost;

    if (snapshot.money < cost) {
      this.showMessage({ code: "not_enough_money" }, 1.6);
      return;
    }

    const position = { x, y };
    if (!validTowerPosition(position, snapshot.towers, getMapDefinition(snapshot.mapId).pathPoints)) {
      this.showMessage({ code: "tower_cannot_be_placed" }, 1.6);
      return;
    }

    snapshot.money -= cost;
    snapshot.towers.push({
      id: this.state.nextTowerId++,
      pos: position,
      towerType: towerName,
      cooldownLeft: 0,
    });
    snapshot.selectedTowerName = null;
    this.showMessage({ code: "tower_placed", tower: towerName }, 1.2);
  }
}

function createInitialSnapshot(
  state: GameSnapshot["state"],
  difficultyName: DifficultyName,
  difficulty: DifficultyProfile,
  options: {
    maxLevelOverride?: number;
    mode: GameMode;
    mapId: MapId;
    sandboxConfig: SandboxConfig;
  },
): GameSnapshot {
  const maxLevel = options.maxLevelOverride ?? difficulty.maxLevel;

  return {
    state,
    mode: options.mode,
    mapId: options.mapId,
    sandboxConfig: cloneSandboxConfig(options.sandboxConfig),
    difficultyName,
    level: 1,
    maxLevel,
    money: difficulty.startMoney,
    lives: difficulty.lives,
    selectedTowerName: null,
    waveActive: false,
    wavePlan: [],
    spawnTimer: 0,
    spawnInterval: 0.52,
    spawnedThisWave: 0,
    totalWaveEnemies: 0,
    currentWaveBossStage: null,
    message: { code: "none" },
    messageTimer: 0,
    towers: [],
    enemies: [],
    bullets: [],
    nextWavePreview:
      options.mode === "sandbox"
        ? previewSandboxWaveInfo(1, options.sandboxConfig)
        : previewWaveInfo(1, difficulty),
  };
}

function assertUnreachable(value: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(value)}`);
}

function cloneGameMessage(message: GameMessage): GameMessage {
  return { ...message };
}
