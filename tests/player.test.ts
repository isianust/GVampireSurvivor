import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlayer,
  updatePlayer,
  canPickupGem,
  addXP,
  damagePlayer,
} from '../src/entities/player';
import { CONFIG } from '../src/config/game.config';
import type { Player } from '../src/core/types';

describe('createPlayer', () => {
  it('should create player with default config values', () => {
    const p = createPlayer();
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
    expect(p.speed).toBe(CONFIG.player.speed);
    expect(p.radius).toBe(CONFIG.player.radius);
    expect(p.hp).toBe(CONFIG.player.hp);
    expect(p.maxHp).toBe(CONFIG.player.maxHp);
    expect(p.xp).toBe(0);
    expect(p.xpToLevel).toBe(CONFIG.player.xpToLevel);
    expect(p.level).toBe(1);
    expect(p.invTimer).toBe(0);
    expect(p.invDuration).toBe(CONFIG.player.invDuration);
    expect(p.armor).toBe(0);
    expect(p.regen).toBe(0);
    expect(p.magnetRange).toBe(CONFIG.player.magnetRange);
    expect(p.speedMult).toBe(1.0);
  });
});

describe('updatePlayer', () => {
  let player: Player;

  beforeEach(() => {
    player = createPlayer();
  });

  it('should move player based on input direction', () => {
    updatePlayer(player, 1, 0, 1);
    expect(player.x).toBeGreaterThan(0);
    expect(player.y).toBe(0);
    expect(player.vx).toBe(player.speed);
    expect(player.vy).toBe(0);
  });

  it('should normalize diagonal input', () => {
    updatePlayer(player, 1, 1, 1);
    // Magnitude of (1,1) is sqrt(2) > 1, so it gets normalized
    const expected = player.speed / Math.sqrt(2);
    expect(player.vx).toBeCloseTo(expected);
    expect(player.vy).toBeCloseTo(expected);
  });

  it('should not normalize input with magnitude <= 1', () => {
    updatePlayer(player, 0.5, 0.5, 1);
    expect(player.vx).toBe(0.5 * player.speed);
    expect(player.vy).toBe(0.5 * player.speed);
  });

  it('should apply speed multiplier', () => {
    player.speedMult = 2.0;
    updatePlayer(player, 1, 0, 1);
    expect(player.vx).toBe(player.speed * 2.0);
  });

  it('should not move with zero input', () => {
    updatePlayer(player, 0, 0, 1);
    expect(player.x).toBe(0);
    expect(player.y).toBe(0);
  });

  it('should scale movement by delta time', () => {
    updatePlayer(player, 1, 0, 0.5);
    expect(player.x).toBe(player.speed * 0.5);
  });

  it('should decrease invincibility timer', () => {
    player.invTimer = 1.0;
    updatePlayer(player, 0, 0, 0.3);
    expect(player.invTimer).toBeCloseTo(0.7);
  });

  it('should not decrease invincibility below 0 conceptually', () => {
    player.invTimer = 0.1;
    updatePlayer(player, 0, 0, 0.5);
    expect(player.invTimer).toBeLessThanOrEqual(0);
  });

  it('should regenerate HP when regen > 0', () => {
    player.hp = 50;
    player.regen = 5;
    updatePlayer(player, 0, 0, 1);
    expect(player.hp).toBe(55);
  });

  it('should not regenerate beyond maxHp', () => {
    player.hp = 99;
    player.regen = 10;
    updatePlayer(player, 0, 0, 1);
    expect(player.hp).toBe(player.maxHp);
  });

  it('should not regenerate when regen is 0', () => {
    player.hp = 50;
    player.regen = 0;
    updatePlayer(player, 0, 0, 1);
    expect(player.hp).toBe(50);
  });

  it('should handle negative input direction', () => {
    updatePlayer(player, -1, -1, 1);
    expect(player.x).toBeLessThan(0);
    expect(player.y).toBeLessThan(0);
  });
});

describe('canPickupGem', () => {
  let player: Player;

  beforeEach(() => {
    player = createPlayer();
  });

  it('should detect gem within magnet range', () => {
    const gem = { x: 30, y: 0, size: 5 };
    expect(canPickupGem(player, gem)).toBe(true);
  });

  it('should not detect gem outside magnet range', () => {
    const gem = { x: 200, y: 0, size: 5 };
    expect(canPickupGem(player, gem)).toBe(false);
  });

  it('should account for gem size', () => {
    // magnetRange = 60, gem at 62 with size 5 => dist(62) < 60 + 5 = 65 => true
    const gem = { x: 62, y: 0, size: 5 };
    expect(canPickupGem(player, gem)).toBe(true);
  });

  it('should use default size of 5 when gem has no size', () => {
    const gem = { x: 64, y: 0 };
    // dist = 64, magnetRange + 5 = 65 => 64 < 65 => true
    expect(canPickupGem(player, gem)).toBe(true);
  });

  it('should respond to increased magnet range', () => {
    player.magnetRange = 200;
    const gem = { x: 180, y: 0, size: 5 };
    expect(canPickupGem(player, gem)).toBe(true);
  });

  it('should detect gem at same position', () => {
    const gem = { x: 0, y: 0, size: 5 };
    expect(canPickupGem(player, gem)).toBe(true);
  });
});

describe('addXP', () => {
  let player: Player;

  beforeEach(() => {
    player = createPlayer();
  });

  it('should add XP to player', () => {
    addXP(player, 5);
    expect(player.xp).toBe(5);
  });

  it('should return false when not leveling up', () => {
    const result = addXP(player, 5);
    expect(result).toBe(false);
    expect(player.level).toBe(1);
  });

  it('should return true when leveling up', () => {
    const result = addXP(player, CONFIG.player.xpToLevel);
    expect(result).toBe(true);
    expect(player.level).toBe(2);
  });

  it('should carry over excess XP after leveling', () => {
    addXP(player, CONFIG.player.xpToLevel + 3);
    expect(player.xp).toBe(3);
    expect(player.level).toBe(2);
  });

  it('should increase xpToLevel after leveling', () => {
    const initialXpToLevel = player.xpToLevel;
    addXP(player, initialXpToLevel);
    expect(player.xpToLevel).toBeGreaterThan(initialXpToLevel);
  });

  it('should calculate xpToLevel correctly', () => {
    const initialXpToLevel = player.xpToLevel;
    addXP(player, initialXpToLevel);
    const expected = Math.floor(initialXpToLevel * CONFIG.player.xpScaleFactor + CONFIG.player.xpScaleFlat);
    expect(player.xpToLevel).toBe(expected);
  });

  it('should handle multiple level ups in sequence', () => {
    addXP(player, player.xpToLevel);
    expect(player.level).toBe(2);
    addXP(player, player.xpToLevel);
    expect(player.level).toBe(3);
  });

  it('should accumulate small XP amounts', () => {
    addXP(player, 3);
    addXP(player, 3);
    addXP(player, 3);
    expect(player.xp).toBe(9);
    expect(player.level).toBe(1);
  });
});

describe('damagePlayer', () => {
  let player: Player;

  beforeEach(() => {
    player = createPlayer();
  });

  it('should reduce player HP', () => {
    damagePlayer(player, 10);
    expect(player.hp).toBe(CONFIG.player.hp - 10);
  });

  it('should return true when damage is applied', () => {
    expect(damagePlayer(player, 10)).toBe(true);
  });

  it('should set invincibility timer', () => {
    damagePlayer(player, 10);
    expect(player.invTimer).toBe(player.invDuration);
  });

  it('should not apply damage during invincibility', () => {
    player.invTimer = 1.0;
    const result = damagePlayer(player, 10);
    expect(result).toBe(false);
    expect(player.hp).toBe(CONFIG.player.hp);
  });

  it('should reduce damage by armor', () => {
    player.armor = 3;
    damagePlayer(player, 10);
    expect(player.hp).toBe(CONFIG.player.hp - 7);
  });

  it('should always deal at least minimum damage', () => {
    player.armor = 100;
    damagePlayer(player, 1);
    expect(player.hp).toBe(CONFIG.player.hp - CONFIG.combat.minDamage);
  });

  it('should allow HP to go below 0', () => {
    damagePlayer(player, 200);
    expect(player.hp).toBeLessThan(0);
  });

  it('should handle zero armor correctly', () => {
    player.armor = 0;
    damagePlayer(player, 15);
    expect(player.hp).toBe(CONFIG.player.hp - 15);
  });

  it('should allow damage again after invincibility expires', () => {
    damagePlayer(player, 10);
    expect(player.invTimer).toBeGreaterThan(0);

    player.invTimer = 0;
    const result = damagePlayer(player, 5);
    expect(result).toBe(true);
    expect(player.hp).toBe(CONFIG.player.hp - 10 - 5);
  });
});
