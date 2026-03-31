import { describe, it, expect } from 'vitest';
import { createEnemy, getAvailableEnemyTypes, pickEnemyType } from '../src/entities/enemies';
import { ENEMY_TYPES } from '../src/config/definitions';
import { CONFIG } from '../src/config/game.config';

describe('createEnemy', () => {
  it('should create a skeleton with correct base stats', () => {
    const enemy = createEnemy('skeleton', 100, 200, 0);
    expect(enemy.type).toBe('skeleton');
    expect(enemy.x).toBe(100);
    expect(enemy.y).toBe(200);
    expect(enemy.hp).toBe(ENEMY_TYPES.skeleton.hp);
    expect(enemy.maxHp).toBe(ENEMY_TYPES.skeleton.hp);
    expect(enemy.speed).toBe(ENEMY_TYPES.skeleton.speed);
    expect(enemy.damage).toBe(ENEMY_TYPES.skeleton.damage);
    expect(enemy.radius).toBe(ENEMY_TYPES.skeleton.radius);
    expect(enemy.xp).toBe(ENEMY_TYPES.skeleton.xp);
    expect(enemy.color).toBe(ENEMY_TYPES.skeleton.color);
    expect(enemy.hitTimer).toBe(0);
    expect(enemy.attackCooldown).toBe(0);
  });

  it('should create enemies at specified coordinates', () => {
    const enemy = createEnemy('zombie', -50, 300, 0);
    expect(enemy.x).toBe(-50);
    expect(enemy.y).toBe(300);
  });

  it('should scale HP with elapsed time', () => {
    const { interval, multiplier } = CONFIG.enemyScaling;
    const baseHp = ENEMY_TYPES.skeleton.hp;

    // At t=0, scale = 1
    const e0 = createEnemy('skeleton', 0, 0, 0);
    expect(e0.hp).toBe(baseHp);

    // At t=interval, scale = 1 + multiplier
    const e1 = createEnemy('skeleton', 0, 0, interval);
    const expected1 = Math.floor(baseHp * (1 + multiplier));
    expect(e1.hp).toBe(expected1);
    expect(e1.maxHp).toBe(expected1);

    // At t=2*interval, scale = 1 + 2*multiplier
    const e2 = createEnemy('skeleton', 0, 0, interval * 2);
    const expected2 = Math.floor(baseHp * (1 + 2 * multiplier));
    expect(e2.hp).toBe(expected2);
  });

  it('should not scale HP for partial intervals', () => {
    const baseHp = ENEMY_TYPES.skeleton.hp;
    // At t=30 (half interval), scale = 1 + 0*multiplier = 1
    const enemy = createEnemy('skeleton', 0, 0, 30);
    expect(enemy.hp).toBe(baseHp);
  });

  it('should throw for unknown enemy type', () => {
    expect(() => createEnemy('unknown', 0, 0, 0)).toThrow('Unknown enemy type: unknown');
  });

  it('should create all 10 enemy types without error', () => {
    for (const type of Object.keys(ENEMY_TYPES)) {
      const enemy = createEnemy(type, 0, 0, 999);
      expect(enemy.type).toBe(type);
      expect(enemy.hp).toBeGreaterThan(0);
    }
  });

  it('should preserve non-scaled stats', () => {
    const enemy = createEnemy('demon', 0, 0, 300);
    // Speed, damage, radius, xp should NOT scale
    expect(enemy.speed).toBe(ENEMY_TYPES.demon.speed);
    expect(enemy.damage).toBe(ENEMY_TYPES.demon.damage);
    expect(enemy.radius).toBe(ENEMY_TYPES.demon.radius);
    expect(enemy.xp).toBe(ENEMY_TYPES.demon.xp);
  });
});

describe('getAvailableEnemyTypes', () => {
  it('should return skeleton and zombie at t=0', () => {
    const types = getAvailableEnemyTypes(0);
    expect(types).toContain('skeleton');
    expect(types).toContain('zombie');
    expect(types).not.toContain('bat'); // bat requires 15s
  });

  it('should include bat after 15 seconds', () => {
    const types = getAvailableEnemyTypes(15);
    expect(types).toContain('bat');
  });

  it('should include ghost after 30 seconds', () => {
    const types = getAvailableEnemyTypes(30);
    expect(types).toContain('ghost');
  });

  it('should include all types after 180 seconds', () => {
    const types = getAvailableEnemyTypes(180);
    expect(types).toHaveLength(10);
    for (const key of Object.keys(ENEMY_TYPES)) {
      expect(types).toContain(key);
    }
  });

  it('should progressively include more types', () => {
    const t0 = getAvailableEnemyTypes(0);
    const t30 = getAvailableEnemyTypes(30);
    const t90 = getAvailableEnemyTypes(90);
    const t180 = getAvailableEnemyTypes(180);
    expect(t30.length).toBeGreaterThan(t0.length);
    expect(t90.length).toBeGreaterThan(t30.length);
    expect(t180.length).toBeGreaterThan(t90.length);
  });

  it('should respect exact minTime boundaries', () => {
    // Spider has minTime=45
    expect(getAvailableEnemyTypes(44)).not.toContain('spider');
    expect(getAvailableEnemyTypes(45)).toContain('spider');
  });
});

describe('pickEnemyType', () => {
  it('should return skeleton when no types available (edge case)', () => {
    // This should only happen if getAvailableEnemyTypes returns empty
    // With current config, skeleton has minTime=0, so it's always available
    expect(pickEnemyType(0)).toBeTruthy();
  });

  it('should return an available type at t=0', () => {
    const available = getAvailableEnemyTypes(0);
    for (let i = 0; i < 50; i++) {
      const type = pickEnemyType(0);
      expect(available).toContain(type);
    }
  });

  it('should return an available type at t=180', () => {
    const available = getAvailableEnemyTypes(180);
    for (let i = 0; i < 50; i++) {
      const type = pickEnemyType(180);
      expect(available).toContain(type);
    }
  });

  it('should use deterministic random value when provided', () => {
    // randomValue=0 should select first type
    const type1 = pickEnemyType(0, 0);
    expect(type1).toBe('skeleton');
  });

  it('should select later types with higher random values', () => {
    // At t=0, available = [skeleton, zombie]
    // weights = [1, 1.5], total = 2.5
    // randomValue close to total should select zombie
    const type = pickEnemyType(0, 2.49);
    expect(type).toBe('zombie');
  });

  it('should weight newer enemies more heavily', () => {
    // At t=180 with many enemies available,
    // newer enemies should have higher weight
    const counts: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const type = pickEnemyType(180);
      counts[type] = (counts[type] || 0) + 1;
    }
    // Demon (last type) should appear more than skeleton (first type)
    expect(counts['demon'] || 0).toBeGreaterThan(counts['skeleton'] || 0);
  });
});
