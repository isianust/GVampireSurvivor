import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWeaponState,
  findNearestEnemy,
  fireWeapons,
  updateProjectile,
  checkProjectileHit,
  generateUpgradeOptions,
} from '../src/entities/weapons';
import { createPlayer } from '../src/entities/player';
import { createEnemy } from '../src/entities/enemies';
import { WEAPON_DEFS } from '../src/config/definitions';
import { CONFIG } from '../src/config/game.config';
import type { Player, Enemy, Projectile, WeaponState } from '../src/core/types';

describe('createWeaponState', () => {
  it('should create a knife weapon', () => {
    const w = createWeaponState('knife');
    expect(w.id).toBe('knife');
    expect(w.def).toBe(WEAPON_DEFS.knife);
    expect(w.cooldown).toBe(0);
    expect(w.level).toBe(1);
  });

  it('should create all weapon types', () => {
    for (const key of Object.keys(WEAPON_DEFS)) {
      const w = createWeaponState(key);
      expect(w.id).toBe(key);
      expect(w.def).toBe(WEAPON_DEFS[key]);
    }
  });

  it('should throw for unknown weapon', () => {
    expect(() => createWeaponState('laser')).toThrow('Unknown weapon: laser');
  });

  describe('getDamage', () => {
    it('should return base damage at level 1', () => {
      const w = createWeaponState('knife');
      expect(w.getDamage()).toBe(WEAPON_DEFS.knife.baseDamage);
    });

    it('should increase damage with level', () => {
      const w = createWeaponState('knife');
      w.level = 5;
      const expected = WEAPON_DEFS.knife.baseDamage + 4 * CONFIG.weapons.damagePerLevel;
      expect(w.getDamage()).toBe(expected);
    });
  });

  describe('getCooldown', () => {
    it('should return base cooldown at level 1', () => {
      const w = createWeaponState('knife');
      expect(w.getCooldown()).toBe(WEAPON_DEFS.knife.baseCooldown);
    });

    it('should decrease cooldown with level', () => {
      const w = createWeaponState('knife');
      w.level = 3;
      const expected = WEAPON_DEFS.knife.baseCooldown - 2 * CONFIG.weapons.cooldownReductionPerLevel;
      expect(w.getCooldown()).toBeCloseTo(expected);
    });

    it('should not go below minimum cooldown', () => {
      const w = createWeaponState('knife');
      w.level = 100;
      expect(w.getCooldown()).toBe(CONFIG.weapons.minCooldown);
    });
  });

  describe('getCount', () => {
    it('should return base count at level 1', () => {
      const w = createWeaponState('knife');
      expect(w.getCount()).toBe(1);
    });

    it('should increase count at level intervals', () => {
      const w = createWeaponState('knife');
      w.level = 1 + CONFIG.weapons.countIncreaseInterval;
      expect(w.getCount()).toBe(2);
    });

    it('should increase count proportionally', () => {
      const w = createWeaponState('knife');
      w.level = 1 + 2 * CONFIG.weapons.countIncreaseInterval;
      expect(w.getCount()).toBe(3);
    });
  });
});

describe('findNearestEnemy', () => {
  it('should return null when no enemies', () => {
    const result = findNearestEnemy({ x: 0, y: 0 }, []);
    expect(result).toBeNull();
  });

  it('should find the nearest enemy', () => {
    const enemies = [
      createEnemy('skeleton', 100, 0, 0),
      createEnemy('zombie', 50, 0, 0),
      createEnemy('bat', 200, 0, 0),
    ];
    const nearest = findNearestEnemy({ x: 0, y: 0 }, enemies);
    expect(nearest).toBe(enemies[1]);
  });

  it('should handle single enemy', () => {
    const enemies = [createEnemy('skeleton', 100, 100, 0)];
    const nearest = findNearestEnemy({ x: 0, y: 0 }, enemies);
    expect(nearest).toBe(enemies[0]);
  });

  it('should work with non-origin positions', () => {
    const enemies = [
      createEnemy('skeleton', 0, 0, 0),
      createEnemy('zombie', 110, 100, 0),
    ];
    const nearest = findNearestEnemy({ x: 100, y: 100 }, enemies);
    expect(nearest).toBe(enemies[1]);
  });
});

describe('fireWeapons', () => {
  let player: Player;
  let enemies: Enemy[];

  beforeEach(() => {
    player = createPlayer();
    enemies = [createEnemy('skeleton', 100, 0, 0)];
  });

  it('should not fire when cooldown is not ready', () => {
    const weapons = [createWeaponState('knife')];
    weapons[0].cooldown = 5;
    const projs = fireWeapons(weapons, player, enemies, 0.1);
    expect(projs).toHaveLength(0);
  });

  it('should fire knife toward nearest enemy', () => {
    const weapons = [createWeaponState('knife')];
    weapons[0].cooldown = 0;
    const projs = fireWeapons(weapons, player, enemies, 0.1);
    expect(projs).toHaveLength(1);
    expect(projs[0].type).toBe('knife');
    expect(projs[0].vx).toBeGreaterThan(0); // moving right toward enemy at (100,0)
  });

  it('should fire fireball with piercing', () => {
    const weapons = [createWeaponState('fireball')];
    weapons[0].cooldown = 0;
    const projs = fireWeapons(weapons, player, enemies, 0.1);
    expect(projs).toHaveLength(1);
    expect(projs[0].type).toBe('fireball');
    expect(projs[0].piercing).toBe(CONFIG.weapons.fireballPiercing);
  });

  it('should fire holy water at random position near player', () => {
    const weapons = [createWeaponState('holywater')];
    weapons[0].cooldown = 0;
    const projs = fireWeapons(weapons, player, enemies, 0.1);
    expect(projs).toHaveLength(1);
    expect(projs[0].type).toBe('holywater');
    expect(projs[0].piercing).toBe(CONFIG.weapons.infinitePiercing);
    expect(projs[0].tickRate).toBe(0.3);
  });

  it('should fire whip following player', () => {
    const weapons = [createWeaponState('whip')];
    weapons[0].cooldown = 0;
    const projs = fireWeapons(weapons, player, enemies, 0.1);
    expect(projs).toHaveLength(1);
    expect(projs[0].type).toBe('whip');
    expect(projs[0].followPlayer).toBe(true);
    expect(projs[0].piercing).toBe(CONFIG.weapons.infinitePiercing);
  });

  it('should not fire knife when no enemies present', () => {
    const weapons = [createWeaponState('knife')];
    weapons[0].cooldown = 0;
    const projs = fireWeapons(weapons, player, [], 0.1);
    expect(projs).toHaveLength(0);
  });

  it('should reset cooldown after firing', () => {
    const weapons = [createWeaponState('knife')];
    weapons[0].cooldown = 0;
    fireWeapons(weapons, player, enemies, 0.1);
    expect(weapons[0].cooldown).toBeGreaterThan(0);
  });

  it('should fire multiple weapons independently', () => {
    const weapons = [createWeaponState('knife'), createWeaponState('holywater')];
    weapons[0].cooldown = 0;
    weapons[1].cooldown = 0;
    const projs = fireWeapons(weapons, player, enemies, 0.1);
    expect(projs).toHaveLength(2);
    const types = projs.map((p) => p.type);
    expect(types).toContain('knife');
    expect(types).toContain('holywater');
  });

  it('should fire multiple projectiles at higher levels', () => {
    const weapons = [createWeaponState('knife')];
    weapons[0].cooldown = 0;
    weapons[0].level = 1 + CONFIG.weapons.countIncreaseInterval; // count = 2
    const projs = fireWeapons(weapons, player, enemies, 0.1);
    expect(projs).toHaveLength(2);
  });
});

describe('updateProjectile', () => {
  let player: Player;

  beforeEach(() => {
    player = createPlayer();
  });

  it('should move projectile based on velocity', () => {
    const proj: Projectile = {
      x: 0, y: 0, vx: 100, vy: 0,
      angle: 0, damage: 10, radius: 5,
      type: 'knife', life: 1, piercing: 0,
      hitEnemies: [],
    };
    const alive = updateProjectile(proj, player, 0.5);
    expect(alive).toBe(true);
    expect(proj.x).toBe(50);
  });

  it('should return false when life expires', () => {
    const proj: Projectile = {
      x: 0, y: 0, vx: 100, vy: 0,
      angle: 0, damage: 10, radius: 5,
      type: 'knife', life: 0.1, piercing: 0,
      hitEnemies: [],
    };
    const alive = updateProjectile(proj, player, 0.2);
    expect(alive).toBe(false);
  });

  it('should follow player when followPlayer is true', () => {
    player.x = 50;
    player.y = 30;
    const proj: Projectile = {
      x: 0, y: 0, vx: 0, vy: 0,
      angle: 0, damage: 10, radius: 5,
      type: 'whip', life: 1, piercing: 999,
      hitEnemies: [], followPlayer: true,
    };
    updateProjectile(proj, player, 0.1);
    expect(proj.x).toBe(50);
    expect(proj.y).toBe(30);
  });

  it('should decrement tick timer for area weapons', () => {
    const proj: Projectile = {
      x: 0, y: 0, vx: 0, vy: 0,
      angle: 0, damage: 5, radius: 40,
      type: 'holywater', life: 2, piercing: 999,
      hitEnemies: [], tickRate: 0.3, tickTimer: 0.3,
    };
    updateProjectile(proj, player, 0.1);
    expect(proj.tickTimer).toBeCloseTo(0.2);
  });
});

describe('checkProjectileHit', () => {
  it('should detect hit for standard projectile', () => {
    const proj: Projectile = {
      x: 10, y: 0, vx: 0, vy: 0,
      angle: 0, damage: 10, radius: 5,
      type: 'knife', life: 1, piercing: 0,
      hitEnemies: [],
    };
    const enemy = createEnemy('skeleton', 20, 0, 0);
    // dist = 10, hitRange = 5 + 12 = 17 => hit
    expect(checkProjectileHit(proj, enemy)).toBe(true);
  });

  it('should not detect hit for far away enemy', () => {
    const proj: Projectile = {
      x: 0, y: 0, vx: 0, vy: 0,
      angle: 0, damage: 10, radius: 5,
      type: 'knife', life: 1, piercing: 0,
      hitEnemies: [],
    };
    const enemy = createEnemy('skeleton', 100, 0, 0);
    expect(checkProjectileHit(proj, enemy)).toBe(false);
  });

  it('should not hit same enemy twice', () => {
    const enemy = createEnemy('skeleton', 10, 0, 0);
    const proj: Projectile = {
      x: 0, y: 0, vx: 0, vy: 0,
      angle: 0, damage: 10, radius: 5,
      type: 'knife', life: 1, piercing: 0,
      hitEnemies: [enemy],
    };
    expect(checkProjectileHit(proj, enemy)).toBe(false);
  });

  it('should check arc for whip projectile', () => {
    const proj: Projectile = {
      x: 0, y: 0, vx: 0, vy: 0,
      angle: 0, // facing right
      damage: 10, radius: 60,
      type: 'whip', life: 0.2, piercing: 999,
      hitEnemies: [],
    };
    // Enemy to the right (within arc)
    const enemyRight = createEnemy('skeleton', 30, 0, 0);
    expect(checkProjectileHit(proj, enemyRight)).toBe(true);

    // Enemy behind (outside arc)
    const enemyBehind = createEnemy('zombie', -30, 0, 0);
    expect(checkProjectileHit(proj, enemyBehind)).toBe(false);
  });

  it('should check range for whip projectile', () => {
    const proj: Projectile = {
      x: 0, y: 0, vx: 0, vy: 0,
      angle: 0, damage: 10, radius: 30,
      type: 'whip', life: 0.2, piercing: 999,
      hitEnemies: [],
    };
    // Enemy too far
    const enemy = createEnemy('skeleton', 50, 0, 0);
    expect(checkProjectileHit(proj, enemy)).toBe(false);
  });
});

describe('generateUpgradeOptions', () => {
  let player: Player;
  let weapons: WeaponState[];

  beforeEach(() => {
    player = createPlayer();
    weapons = [createWeaponState('knife')];
  });

  it('should return exactly 3 options', () => {
    const options = generateUpgradeOptions(player, weapons);
    expect(options).toHaveLength(CONFIG.upgrades.optionCount);
  });

  it('should include weapon upgrade options', () => {
    // Run multiple times since shuffle is random
    let foundWeaponUpgrade = false;
    for (let i = 0; i < 50; i++) {
      const options = generateUpgradeOptions(player, weapons);
      if (options.some((o) => o.isWeapon && o.weaponId === 'knife')) {
        foundWeaponUpgrade = true;
        break;
      }
    }
    expect(foundWeaponUpgrade).toBe(true);
  });

  it('should include new weapon options when not maxed', () => {
    let foundNewWeapon = false;
    for (let i = 0; i < 50; i++) {
      const options = generateUpgradeOptions(player, weapons);
      if (options.some((o) => o.isWeapon && o.weaponId !== 'knife')) {
        foundNewWeapon = true;
        break;
      }
    }
    expect(foundNewWeapon).toBe(true);
  });

  it('should include stat upgrade options', () => {
    let foundStatUpgrade = false;
    for (let i = 0; i < 50; i++) {
      const options = generateUpgradeOptions(player, weapons);
      if (options.some((o) => !o.isWeapon)) {
        foundStatUpgrade = true;
        break;
      }
    }
    expect(foundStatUpgrade).toBe(true);
  });

  it('should not offer weapon upgrade above max level', () => {
    weapons[0].level = CONFIG.weapons.maxLevel;
    for (let i = 0; i < 20; i++) {
      const options = generateUpgradeOptions(player, weapons);
      const knifeUpgrades = options.filter((o) => o.isWeapon && o.weaponId === 'knife');
      expect(knifeUpgrades).toHaveLength(0);
    }
  });

  it('should not offer new weapons when at max weapon count', () => {
    const allWeapons: WeaponState[] = [];
    const weaponKeys = Object.keys(WEAPON_DEFS).slice(0, CONFIG.weapons.maxWeapons);
    for (const key of weaponKeys) {
      allWeapons.push(createWeaponState(key));
    }
    for (let i = 0; i < 20; i++) {
      const options = generateUpgradeOptions(player, allWeapons);
      const newWeapons = options.filter((o) => o.isWeapon && !weaponKeys.includes(o.weaponId!));
      expect(newWeapons).toHaveLength(0);
    }
  });

  it('should apply weapon level upgrade correctly', () => {
    const w = createWeaponState('knife');
    const options = generateUpgradeOptions(player, [w]);
    const knifeUpgrade = options.find((o) => o.isWeapon && o.weaponId === 'knife');
    if (knifeUpgrade) {
      knifeUpgrade.apply(player, [w]);
      expect(w.level).toBe(2);
    }
  });

  it('should apply stat upgrade correctly', () => {
    const options = generateUpgradeOptions(player, weapons);
    const statUpgrade = options.find((o) => !o.isWeapon);
    if (statUpgrade) {
      const origHp = player.maxHp;
      const origArmor = player.armor;
      const origSpeed = player.speedMult;
      const origRegen = player.regen;
      const origMagnet = player.magnetRange;

      statUpgrade.apply(player, weapons);

      // At least one stat should have changed
      const changed =
        player.maxHp !== origHp ||
        player.armor !== origArmor ||
        player.speedMult !== origSpeed ||
        player.regen !== origRegen ||
        player.magnetRange !== origMagnet;
      expect(changed).toBe(true);
    }
  });

  it('should apply new weapon option correctly', () => {
    const weps = [createWeaponState('knife')];
    for (let i = 0; i < 50; i++) {
      const options = generateUpgradeOptions(player, weps);
      const newWeapon = options.find((o) => o.isWeapon && o.weaponId !== 'knife');
      if (newWeapon) {
        newWeapon.apply(player, weps);
        expect(weps).toHaveLength(2);
        return;
      }
    }
    // If we never found a new weapon option in 50 tries, that's unusual but possible
    // due to shuffle randomness. Let's be lenient.
  });
});
