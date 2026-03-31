import { describe, it, expect } from 'vitest';
import { CONFIG } from '../src/config/game.config';
import { ENEMY_TYPES, WEAPON_DEFS } from '../src/config/definitions';

describe('Game Config', () => {
  describe('player config', () => {
    it('should have valid player defaults', () => {
      expect(CONFIG.player.speed).toBeGreaterThan(0);
      expect(CONFIG.player.radius).toBeGreaterThan(0);
      expect(CONFIG.player.hp).toBeGreaterThan(0);
      expect(CONFIG.player.maxHp).toBe(CONFIG.player.hp);
      expect(CONFIG.player.xpToLevel).toBeGreaterThan(0);
      expect(CONFIG.player.invDuration).toBeGreaterThan(0);
      expect(CONFIG.player.magnetRange).toBeGreaterThan(0);
    });
  });

  describe('spawn config', () => {
    it('should have valid spawn settings', () => {
      expect(CONFIG.spawn.baseInterval).toBeGreaterThan(0);
      expect(CONFIG.spawn.minInterval).toBeGreaterThan(0);
      expect(CONFIG.spawn.minInterval).toBeLessThan(CONFIG.spawn.baseInterval);
      expect(CONFIG.spawn.difficultyRate).toBeGreaterThan(0);
      expect(CONFIG.spawn.maxEnemies).toBeGreaterThan(0);
    });
  });

  describe('combat config', () => {
    it('should have valid combat settings', () => {
      expect(CONFIG.combat.attackCooldown).toBeGreaterThan(0);
      expect(CONFIG.combat.minDamage).toBeGreaterThanOrEqual(1);
      expect(CONFIG.combat.knockbackDistance).toBeGreaterThan(0);
    });
  });

  describe('boss config', () => {
    it('should have valid boss settings', () => {
      expect(CONFIG.boss.spawnTime).toBeGreaterThan(0);
      expect(CONFIG.boss.hpMultiplier).toBeGreaterThan(1);
    });
  });

  describe('weapon config', () => {
    it('should have valid weapon system settings', () => {
      expect(CONFIG.weapons.maxWeapons).toBeGreaterThan(0);
      expect(CONFIG.weapons.maxLevel).toBeGreaterThan(1);
      expect(CONFIG.weapons.minCooldown).toBeGreaterThan(0);
    });
  });

  describe('upgrade config', () => {
    it('should have valid upgrade settings', () => {
      expect(CONFIG.upgrades.optionCount).toBeGreaterThan(0);
      expect(CONFIG.upgrades.maxHpBonus).toBeGreaterThan(0);
    });
  });
});

describe('Enemy Type Definitions', () => {
  it('should have 10 enemy types', () => {
    expect(Object.keys(ENEMY_TYPES)).toHaveLength(10);
  });

  it('should have all required enemy types', () => {
    const expectedTypes = [
      'skeleton', 'zombie', 'bat', 'ghost', 'spider',
      'werewolf', 'warlock', 'vampire', 'drake', 'demon',
    ];
    for (const type of expectedTypes) {
      expect(ENEMY_TYPES).toHaveProperty(type);
    }
  });

  it('every enemy type should have valid stats', () => {
    for (const [key, def] of Object.entries(ENEMY_TYPES)) {
      expect(def.name, `${key}.name`).toBeTruthy();
      expect(def.hp, `${key}.hp`).toBeGreaterThan(0);
      expect(def.speed, `${key}.speed`).toBeGreaterThan(0);
      expect(def.damage, `${key}.damage`).toBeGreaterThan(0);
      expect(def.radius, `${key}.radius`).toBeGreaterThan(0);
      expect(def.xp, `${key}.xp`).toBeGreaterThan(0);
      expect(def.color, `${key}.color`).toBeTruthy();
      expect(def.minTime, `${key}.minTime`).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have skeleton and zombie as initial enemies (minTime=0)', () => {
    expect(ENEMY_TYPES.skeleton.minTime).toBe(0);
    expect(ENEMY_TYPES.zombie.minTime).toBe(0);
  });

  it('should have demon as the latest enemy', () => {
    const maxMinTime = Math.max(...Object.values(ENEMY_TYPES).map((t) => t.minTime));
    expect(ENEMY_TYPES.demon.minTime).toBe(maxMinTime);
  });

  it('demon should be the strongest enemy', () => {
    const maxHp = Math.max(...Object.values(ENEMY_TYPES).map((t) => t.hp));
    const maxDamage = Math.max(...Object.values(ENEMY_TYPES).map((t) => t.damage));
    expect(ENEMY_TYPES.demon.hp).toBe(maxHp);
    expect(ENEMY_TYPES.demon.damage).toBe(maxDamage);
  });
});

describe('Weapon Definitions', () => {
  it('should have 4 weapon types', () => {
    expect(Object.keys(WEAPON_DEFS)).toHaveLength(4);
  });

  it('should have all required weapon types', () => {
    expect(WEAPON_DEFS).toHaveProperty('knife');
    expect(WEAPON_DEFS).toHaveProperty('fireball');
    expect(WEAPON_DEFS).toHaveProperty('holywater');
    expect(WEAPON_DEFS).toHaveProperty('whip');
  });

  it('every weapon should have valid base stats', () => {
    for (const [key, def] of Object.entries(WEAPON_DEFS)) {
      expect(def.name, `${key}.name`).toBeTruthy();
      expect(def.desc, `${key}.desc`).toBeTruthy();
      expect(def.baseCooldown, `${key}.baseCooldown`).toBeGreaterThan(0);
      expect(def.baseDamage, `${key}.baseDamage`).toBeGreaterThan(0);
      expect(def.baseCount, `${key}.baseCount`).toBeGreaterThanOrEqual(1);
      expect(def.radius, `${key}.radius`).toBeGreaterThan(0);
    }
  });

  it('projectile weapons should have speed and range', () => {
    expect(WEAPON_DEFS.knife.speed).toBeGreaterThan(0);
    expect(WEAPON_DEFS.knife.range).toBeGreaterThan(0);
    expect(WEAPON_DEFS.fireball.speed).toBeGreaterThan(0);
    expect(WEAPON_DEFS.fireball.range).toBeGreaterThan(0);
  });

  it('area weapons should have duration', () => {
    expect(WEAPON_DEFS.holywater.duration).toBeGreaterThan(0);
    expect(WEAPON_DEFS.whip.duration).toBeGreaterThan(0);
  });
});
