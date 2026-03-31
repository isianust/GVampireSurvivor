/** Weapon system — creation, firing, projectile management, upgrades. */

import { CONFIG, WEAPON_DEFS } from '../config/index.js';
import type { WeaponDef } from '../config/definitions.js';
import type { Player, Enemy, Projectile, WeaponState, UpgradeOption } from '../core/types.js';
import { angleTo, dist, normalizeAngle, randFloat, shuffle } from '../systems/utils.js';

/** Create a weapon state for a given weapon ID. */
export function createWeaponState(weaponId: string): WeaponState {
  const def = WEAPON_DEFS[weaponId];
  if (!def) {
    throw new Error(`Unknown weapon: ${weaponId}`);
  }
  return {
    id: weaponId,
    def,
    cooldown: 0,
    level: 1,
    getDamage() {
      return this.def.baseDamage + (this.level - 1) * CONFIG.weapons.damagePerLevel;
    },
    getCooldown() {
      return Math.max(
        CONFIG.weapons.minCooldown,
        this.def.baseCooldown - (this.level - 1) * CONFIG.weapons.cooldownReductionPerLevel,
      );
    },
    getCount() {
      return this.def.baseCount + Math.floor((this.level - 1) / CONFIG.weapons.countIncreaseInterval);
    },
  };
}

/** Find the nearest enemy to a point. Returns null if no enemies. */
export function findNearestEnemy(origin: { x: number; y: number }, enemies: Enemy[]): Enemy | null {
  let best: Enemy | null = null;
  let bestDist = Infinity;
  for (const e of enemies) {
    const d = dist(origin, e);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

/** Fire all ready weapons and return new projectiles. */
export function fireWeapons(
  weapons: WeaponState[],
  player: Player,
  enemies: Enemy[],
  dt: number,
): Projectile[] {
  const newProjs: Projectile[] = [];
  for (const w of weapons) {
    w.cooldown -= dt;
    if (w.cooldown > 0) continue;
    w.cooldown = w.getCooldown();

    const count = w.getCount();
    const dmg = w.getDamage();

    for (let c = 0; c < count; c++) {
      if (w.id === 'knife' || w.id === 'fireball') {
        const nearest = findNearestEnemy(player, enemies);
        if (!nearest) continue;
        const a = angleTo(player, nearest);
        const spread =
          count > 1 ? (c - (count - 1) / 2) * CONFIG.weapons.multiShotSpread : 0;
        newProjs.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(a + spread) * w.def.speed,
          vy: Math.sin(a + spread) * w.def.speed,
          angle: a + spread,
          damage: dmg,
          radius: w.def.radius,
          type: w.def.type,
          life: w.def.range / w.def.speed,
          piercing: w.id === 'fireball' ? CONFIG.weapons.fireballPiercing : 0,
          hitEnemies: [],
        });
      } else if (w.id === 'holywater') {
        const range = CONFIG.weapons.holyWaterDropRange;
        const hx = player.x + randFloat(-range, range);
        const hy = player.y + randFloat(-range, range);
        newProjs.push({
          x: hx,
          y: hy,
          vx: 0,
          vy: 0,
          angle: 0,
          damage: dmg,
          radius: w.def.radius,
          type: 'holywater',
          life: w.def.duration!,
          tickRate: 0.3,
          tickTimer: 0,
          piercing: CONFIG.weapons.infinitePiercing,
          hitEnemies: [],
        });
      } else if (w.id === 'whip') {
        let wa = 0;
        const near = findNearestEnemy(player, enemies);
        if (near) wa = angleTo(player, near);
        const side = c % 2 === 0 ? 0 : Math.PI;
        newProjs.push({
          x: player.x,
          y: player.y,
          vx: 0,
          vy: 0,
          angle: wa + side,
          damage: dmg,
          radius: w.def.range,
          type: 'whip',
          life: w.def.duration!,
          piercing: CONFIG.weapons.infinitePiercing,
          hitEnemies: [],
          followPlayer: true,
        });
      }
    }
  }
  return newProjs;
}

/** Update a projectile. Returns false if the projectile is dead. */
export function updateProjectile(proj: Projectile, player: Player, dt: number): boolean {
  proj.life -= dt;
  if (proj.life <= 0) return false;

  proj.x += proj.vx * dt;
  proj.y += proj.vy * dt;

  if (proj.followPlayer) {
    proj.x = player.x;
    proj.y = player.y;
  }

  if (proj.tickTimer !== undefined) {
    proj.tickTimer -= dt;
  }

  return true;
}

/** Check if a projectile hits an enemy. */
export function checkProjectileHit(proj: Projectile, enemy: Enemy): boolean {
  if (proj.hitEnemies.indexOf(enemy) >= 0) return false;

  const hitRange = proj.type === 'whip' ? proj.radius : proj.radius + enemy.radius;

  if (proj.type === 'whip') {
    const d = dist(proj, enemy);
    if (d > hitRange) return false;
    const a = angleTo(proj, enemy);
    const diff = Math.abs(normalizeAngle(a - proj.angle));
    return diff < Math.PI / 2;
  }

  return dist(proj, enemy) < hitRange;
}

/** Generate upgrade options for the level-up screen. */
export function generateUpgradeOptions(player: Player, weapons: WeaponState[]): UpgradeOption[] {
  const options: UpgradeOption[] = [];

  // Existing weapon upgrades
  for (const w of weapons) {
    if (w.level < CONFIG.weapons.maxLevel) {
      options.push({
        name: `⚔️ ${w.def.name} Lv.${w.level + 1}`,
        desc: '強化武器傷害與效果',
        apply: (_p: Player, _weps: WeaponState[]) => {
          w.level++;
        },
        isWeapon: true,
        weaponId: w.id,
      });
    }
  }

  // New weapon options
  const owned = weapons.map((w) => w.id);
  for (const key of Object.keys(WEAPON_DEFS)) {
    if (!owned.includes(key) && weapons.length < CONFIG.weapons.maxWeapons) {
      const def: WeaponDef = WEAPON_DEFS[key];
      options.push({
        name: `🆕 ${def.name}`,
        desc: def.desc,
        apply: (_p: Player, weps: WeaponState[]) => {
          weps.push(createWeaponState(key));
        },
        isWeapon: true,
        weaponId: key,
      });
    }
  }

  // Stat upgrades
  const { maxHpBonus, armorBonus, speedBonus, regenBonus, magnetBonus } = CONFIG.upgrades;
  const statUpgrades: UpgradeOption[] = [
    {
      name: '❤️ 生命上限 +20',
      desc: '增加最大生命值',
      apply: (p) => {
        p.maxHp += maxHpBonus;
        p.hp += maxHpBonus;
      },
      isWeapon: false,
    },
    {
      name: '🛡️ 護甲 +1',
      desc: '減少受到的傷害',
      apply: (p) => {
        p.armor += armorBonus;
      },
      isWeapon: false,
    },
    {
      name: '👟 移動速度 +10%',
      desc: '移動更快',
      apply: (p) => {
        p.speedMult += speedBonus;
      },
      isWeapon: false,
    },
    {
      name: '💚 生命回復 +0.5/s',
      desc: '持續回復生命',
      apply: (p) => {
        p.regen += regenBonus;
      },
      isWeapon: false,
    },
    {
      name: '🧲 磁鐵範圍 +30',
      desc: '更遠距離拾取經驗',
      apply: (p) => {
        p.magnetRange += magnetBonus;
      },
      isWeapon: false,
    },
  ];
  options.push(...statUpgrades);

  shuffle(options);
  return options.slice(0, CONFIG.upgrades.optionCount);
}
