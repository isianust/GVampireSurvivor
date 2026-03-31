/** Enemy creation and type selection logic. */

import { CONFIG, ENEMY_TYPES } from '../config/index.js';
import type { Enemy } from '../core/types.js';

/** Create an enemy instance with HP scaled by elapsed time. */
export function createEnemy(type: string, x: number, y: number, elapsed: number): Enemy {
  const def = ENEMY_TYPES[type];
  if (!def) {
    throw new Error(`Unknown enemy type: ${type}`);
  }
  const { interval, multiplier } = CONFIG.enemyScaling;
  const scale = 1 + Math.floor(elapsed / interval) * multiplier;
  return {
    type,
    x,
    y,
    hp: Math.floor(def.hp * scale),
    maxHp: Math.floor(def.hp * scale),
    speed: def.speed,
    damage: def.damage,
    radius: def.radius,
    xp: def.xp,
    color: def.color,
    hitTimer: 0,
    attackCooldown: 0,
  };
}

/** Get enemy types available at a given elapsed time. */
export function getAvailableEnemyTypes(elapsed: number): string[] {
  const types: string[] = [];
  for (const key of Object.keys(ENEMY_TYPES)) {
    if (elapsed >= ENEMY_TYPES[key].minTime) {
      types.push(key);
    }
  }
  return types;
}

/**
 * Pick a random enemy type weighted toward newer (higher-index) types.
 * Uses a deterministic random value when provided (for testing).
 */
export function pickEnemyType(elapsed: number, randomValue?: number): string {
  const available = getAvailableEnemyTypes(elapsed);
  if (available.length === 0) return 'skeleton';

  const weights: number[] = [];
  let total = 0;
  for (let i = 0; i < available.length; i++) {
    const w = 1 + i * 0.5;
    weights.push(w);
    total += w;
  }

  const roll = (randomValue ?? Math.random()) * total;
  let sum = 0;
  for (let j = 0; j < weights.length; j++) {
    sum += weights[j];
    if (roll <= sum) return available[j];
  }
  return available[available.length - 1];
}
