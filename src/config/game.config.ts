/** Game-wide configuration constants. All magic numbers centralised here. */
export const CONFIG = {
  /** Player defaults */
  player: {
    speed: 120,
    radius: 16,
    hp: 100,
    maxHp: 100,
    xpToLevel: 10,
    invDuration: 0.5,
    magnetRange: 60,
    xpScaleFactor: 1.35,
    xpScaleFlat: 5,
  },

  /** Spawn & difficulty */
  spawn: {
    baseInterval: 1.5,
    minInterval: 0.3,
    difficultyRate: 0.005,
    maxEnemies: 80,
    spawnMargin: 80,
    bossSpawnMargin: 200,
    removalDistance: 1200,
  },

  /** Enemy HP scaling */
  enemyScaling: {
    /** Scale HP every N seconds */
    interval: 60,
    /** HP increase multiplier per interval */
    multiplier: 0.3,
  },

  /** Combat */
  combat: {
    attackCooldown: 0.5,
    knockbackDistance: 20,
    projectileKnockback: 5,
    hitFlashDuration: 0.15,
    vampireLifestealRate: 0.3,
    minDamage: 1,
  },

  /** Boss */
  boss: {
    spawnTime: 180,
    hpMultiplier: 3,
  },

  /** Particles & effects */
  effects: {
    damageNumberLifetime: 0.8,
    damageNumberRise: 30,
    damageNumberSpreadX: 10,
    particleSpeed: 80,
    particleMinLife: 0.2,
    particleMaxLife: 0.5,
    particleMinRadius: 2,
    particleMaxRadius: 4,
    hitParticleCount: 3,
    deathParticleCount: 8,
    particleFadeThreshold: 0.3,
  },

  /** Gem / XP pickup */
  gem: {
    pickupDistance: 10,
    baseAttractSpeed: 200,
    attractSpeedMultiplier: 2,
    highXpThreshold: 10,
    midXpThreshold: 5,
    highXpColor: '#ffcc00',
    midXpColor: '#44ff44',
    lowXpColor: '#44aaff',
    baseSize: 4,
  },

  /** Camera */
  camera: {
    followLerp: 0.1,
  },

  /** Physics */
  physics: {
    maxDt: 0.05,
    /** When true, draw collision radii for player, enemies, and gems. */
    debug: false,
  },

  /** Weapon system */
  weapons: {
    maxWeapons: 4,
    maxLevel: 8,
    damagePerLevel: 3,
    cooldownReductionPerLevel: 0.08,
    minCooldown: 0.2,
    countIncreaseInterval: 3,
    multiShotSpread: 0.15,
    holyWaterDropRange: 80,
    fireballPiercing: 2,
    infinitePiercing: 999,
  },

  /** Upgrades */
  upgrades: {
    optionCount: 3,
    maxHpBonus: 20,
    armorBonus: 1,
    speedBonus: 0.1,
    regenBonus: 0.5,
    magnetBonus: 30,
  },
} as const;
