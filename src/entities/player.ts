/** Player creation and update logic. */

import { CONFIG } from '../config/index.js';
import type { Player } from '../core/types.js';
import { dist } from '../systems/utils.js';

/** Create a new player with default stats. */
export function createPlayer(): Player {
  const cfg = CONFIG.player;
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: cfg.speed,
    radius: cfg.radius,
    hp: cfg.hp,
    maxHp: cfg.maxHp,
    xp: 0,
    xpToLevel: cfg.xpToLevel,
    level: 1,
    invTimer: 0,
    invDuration: cfg.invDuration,
    armor: 0,
    regen: 0,
    magnetRange: cfg.magnetRange,
    speedMult: 1.0,
  };
}

/** Update player position and timers. */
export function updatePlayer(player: Player, dx: number, dy: number, dt: number): void {
  // Normalize input
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag > 1) {
    dx /= mag;
    dy /= mag;
  }
  const spd = player.speed * player.speedMult;
  player.vx = dx * spd;
  player.vy = dy * spd;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Invincibility timer
  if (player.invTimer > 0) {
    player.invTimer -= dt;
  }

  // Regen
  if (player.regen > 0) {
    player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
  }
}

/** Check if player can pick up a gem. */
export function canPickupGem(
  player: Player,
  gem: { x: number; y: number; size?: number },
): boolean {
  return dist(player, gem) < player.magnetRange + (gem.size ?? 5);
}

/** Add XP to player. Returns true if leveled up. */
export function addXP(player: Player, amount: number): boolean {
  player.xp += amount;
  if (player.xp >= player.xpToLevel) {
    player.xp -= player.xpToLevel;
    player.level++;
    player.xpToLevel = Math.floor(player.xpToLevel * CONFIG.player.xpScaleFactor + CONFIG.player.xpScaleFlat);
    return true;
  }
  return false;
}

/** Apply damage to player. Returns true if damage was applied. */
export function damagePlayer(player: Player, amount: number): boolean {
  if (player.invTimer > 0) return false;
  const dmg = Math.max(CONFIG.combat.minDamage, amount - player.armor);
  player.hp -= dmg;
  player.invTimer = player.invDuration;
  return true;
}
