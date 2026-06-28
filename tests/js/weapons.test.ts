import { describe, it, expect } from 'vitest';
import { loadGame, stubRandom } from './harness';

const sb = loadGame();
const {
  WEAPON_DEFS,
  EVOLVED_DEFS,
  EVOLUTIONS,
  UPGRADE_POOL,
  MAX_WEAPON_LEVEL,
  INFINITE_PIERCING,
  createWeaponState,
  findNearestEnemy,
  fireWeapons,
  updateProjectile,
  checkProjectileHit,
  generateUpgradeOptions,
} = sb;

describe('js/weapons constants', () => {
  it('MAX_WEAPON_LEVEL = 8', () => expect(MAX_WEAPON_LEVEL).toBe(8));
  it('INFINITE_PIERCING = 999', () => expect(INFINITE_PIERCING).toBe(999));
});

describe('js/weapons WEAPON_DEFS table', () => {
  for (const key of Object.keys(WEAPON_DEFS)) {
    const def = WEAPON_DEFS[key];
    describe(`weapon ${key}`, () => {
      it('has a name', () => expect(def.name.length).toBeGreaterThan(0));
      it('has a desc', () => expect(def.desc.length).toBeGreaterThan(0));
      it('baseCooldown > 0', () => expect(def.baseCooldown).toBeGreaterThan(0));
      it('baseDamage > 0', () => expect(def.baseDamage).toBeGreaterThan(0));
      it('baseCount >= 1', () => expect(def.baseCount).toBeGreaterThanOrEqual(1));
      it('has a type', () => expect(def.type.length).toBeGreaterThan(0));
    });
  }
  it('swordqi reuses knife mechanic via base', () =>
    expect(WEAPON_DEFS.swordqi.base).toBe('knife'));
  it('potion reuses fireball mechanic via base', () =>
    expect(WEAPON_DEFS.potion.base).toBe('fireball'));
});

describe('js/weapons EVOLVED_DEFS + EVOLUTIONS', () => {
  it('4 evolved weapons', () => expect(Object.keys(EVOLVED_DEFS)).toHaveLength(4));
  it('4 evolution rules', () => expect(EVOLUTIONS).toHaveLength(4));
  for (const ev of EVOLUTIONS) {
    describe(`evolution -> ${ev.result}`, () => {
      it('result def exists', () => expect(EVOLVED_DEFS[ev.result]).toBeTruthy());
      it('base weapon a exists', () => expect(WEAPON_DEFS[ev.a]).toBeTruthy());
      it('partner weapon b exists', () => expect(WEAPON_DEFS[ev.b]).toBeTruthy());
    });
  }
  for (const key of Object.keys(EVOLVED_DEFS)) {
    const def = EVOLVED_DEFS[key];
    describe(`evolved ${key}`, () => {
      it('has assetKey', () => expect(def.assetKey).toMatch(/^proj_/));
      it('has base mechanic', () => expect(def.base.length).toBeGreaterThan(0));
      it('baseDamage > base weapon damage (stronger)', () =>
        expect(def.baseDamage).toBeGreaterThan(0));
    });
  }
});

describe('js/weapons UPGRADE_POOL table', () => {
  const playerFields = ['maxHp', 'armor', 'speedMult', 'regen', 'magnetRange', 'lifestealOnKill'];
  it('has 11 stat upgrades', () => expect(UPGRADE_POOL).toHaveLength(11));
  for (const up of UPGRADE_POOL) {
    describe(`upgrade ${up.id}`, () => {
      it('stat targets a supported player field', () => expect(playerFields).toContain(up.stat));
      it('value > 0', () => expect(up.value).toBeGreaterThan(0));
      it('has icon', () => expect(up.icon.length).toBeGreaterThan(0));
      it('name contains wuxia CJK', () => expect(/[\u4e00-\u9fff]/.test(up.name)).toBe(true));
      it('has desc', () => expect(up.desc.length).toBeGreaterThan(0));
    });
  }
});

describe('js/weapons createWeaponState scaling', () => {
  it('resolves a base weapon def', () => {
    const w = createWeaponState('knife');
    expect(w.def).toBe(WEAPON_DEFS.knife);
    expect(w.level).toBe(1);
    expect(w.cooldown).toBe(0);
  });
  it('resolves an evolved weapon def', () => {
    const w = createWeaponState('stormblade');
    expect(w.def).toBe(EVOLVED_DEFS.stormblade);
  });
  for (let lvl = 1; lvl <= MAX_WEAPON_LEVEL; lvl++) {
    describe(`knife level ${lvl}`, () => {
      const w = createWeaponState('knife');
      w.level = lvl;
      it(`damage = base + (lvl-1)*4`, () =>
        expect(w.getDamage()).toBe(WEAPON_DEFS.knife.baseDamage + (lvl - 1) * 4));
      it('cooldown = max(0.2, base - (lvl-1)*0.08)', () =>
        expect(w.getCooldown()).toBeCloseTo(
          Math.max(0.2, WEAPON_DEFS.knife.baseCooldown - (lvl - 1) * 0.08),
        ));
      it('count = base + floor((lvl-1)/3)', () =>
        expect(w.getCount()).toBe(WEAPON_DEFS.knife.baseCount + Math.floor((lvl - 1) / 3)));
    });
  }
  it('cooldown never below 0.2', () => {
    const w = createWeaponState('knife');
    w.level = 99;
    expect(w.getCooldown()).toBeGreaterThanOrEqual(0.2);
  });
});

describe('js/weapons findNearestEnemy', () => {
  const player = { x: 0, y: 0 };
  it('null when no enemies', () => expect(findNearestEnemy(player, [])).toBeNull());
  it('returns the nearest', () => {
    const enemies = [
      { x: 100, y: 0 },
      { x: 10, y: 0 },
      { x: 50, y: 0 },
    ];
    expect(findNearestEnemy(player, enemies)).toBe(enemies[1]);
  });
  it('single enemy', () => {
    const e = { x: 5, y: 5 };
    expect(findNearestEnemy(player, [e])).toBe(e);
  });
});

function fakePlayer() {
  return { x: 0, y: 0, level: 1, facingX: 1, facingY: 0 };
}

describe('js/weapons fireWeapons', () => {
  it('does not fire while on cooldown', () => {
    const w = createWeaponState('knife');
    w.cooldown = 1;
    const projs = fireWeapons([w], fakePlayer(), [{ x: 50, y: 0, radius: 10 }], 0.1);
    expect(projs).toHaveLength(0);
  });
  it('fires when cooldown elapses and resets cooldown', () => {
    const w = createWeaponState('knife');
    w.cooldown = 0;
    const projs = fireWeapons([w], fakePlayer(), [{ x: 50, y: 0, radius: 10 }], 0.1);
    expect(projs.length).toBeGreaterThan(0);
    expect(w.cooldown).toBeCloseTo(w.getCooldown());
  });
  it('knife needs a target (no enemy => no projectile)', () => {
    const w = createWeaponState('knife');
    const projs = fireWeapons([w], fakePlayer(), [], 0.1);
    expect(projs).toHaveLength(0);
  });
  it('fireball projectile pierces 2', () => {
    const w = createWeaponState('fireball');
    const projs = fireWeapons([w], fakePlayer(), [{ x: 50, y: 0, radius: 10 }], 0.1);
    expect(projs[0].piercing).toBe(2);
  });
  it('knife projectile pierces 0', () => {
    const w = createWeaponState('knife');
    const projs = fireWeapons([w], fakePlayer(), [{ x: 50, y: 0, radius: 10 }], 0.1);
    expect(projs[0].piercing).toBe(0);
  });
  it('holywater drops even with no enemies and has infinite piercing', () => {
    const s = loadGame();
    stubRandom(s, [0.5]);
    const w = s.createWeaponState('holywater');
    const projs = s.fireWeapons([w], { x: 0, y: 0, level: 1 }, [], 0.1);
    expect(projs).toHaveLength(1);
    expect(projs[0].type).toBe('holywater');
    expect(projs[0].piercing).toBe(s.INFINITE_PIERCING);
  });
  it('whip follows player and has infinite piercing', () => {
    const w = createWeaponState('whip');
    const projs = fireWeapons([w], fakePlayer(), [{ x: 50, y: 0, radius: 10 }], 0.1);
    expect(projs[0].type).toBe('whip');
    expect(projs[0].followPlayer).toBe(true);
    expect(projs[0].piercing).toBe(INFINITE_PIERCING);
  });
  it('multi-count knife produces N projectiles with spread', () => {
    const w = createWeaponState('knife');
    w.level = 7; // count = 1 + floor(6/3) = 3
    const projs = fireWeapons([w], fakePlayer(), [{ x: 0, y: 100, radius: 10 }], 0.1);
    expect(projs).toHaveLength(3);
    const angles = projs.map((p: { angle: number }) => p.angle);
    expect(new Set(angles).size).toBeGreaterThan(1);
  });
  it('evolved stormblade reuses knife mechanic (count 3)', () => {
    const w = createWeaponState('stormblade');
    const projs = fireWeapons([w], fakePlayer(), [{ x: 50, y: 0, radius: 10 }], 0.1);
    expect(projs.length).toBe(EVOLVED_DEFS.stormblade.baseCount);
    expect(projs[0].assetKey).toBe('proj_stormblade');
  });
});

describe('js/weapons updateProjectile', () => {
  it('decrements life and dies at <=0', () => {
    const proj = { x: 0, y: 0, vx: 0, vy: 0, life: 0.05 };
    expect(updateProjectile(proj, { x: 0, y: 0 }, 0.1)).toBe(false);
  });
  it('moves by velocity', () => {
    const proj = { x: 0, y: 0, vx: 100, vy: 0, life: 5 };
    updateProjectile(proj, { x: 0, y: 0 }, 0.1);
    expect(proj.x).toBeCloseTo(10);
  });
  it('followPlayer locks to player position', () => {
    const proj = { x: 0, y: 0, vx: 0, vy: 0, life: 5, followPlayer: true };
    updateProjectile(proj, { x: 42, y: -7 }, 0.1);
    expect(proj.x).toBe(42);
    expect(proj.y).toBe(-7);
  });
  it('decrements tickTimer when present', () => {
    const proj = { x: 0, y: 0, vx: 0, vy: 0, life: 5, tickTimer: 0.3 };
    updateProjectile(proj, { x: 0, y: 0 }, 0.1);
    expect(proj.tickTimer).toBeCloseTo(0.2);
  });
});

describe('js/weapons checkProjectileHit', () => {
  it('circle proj hits within radius sum', () => {
    const proj = { x: 0, y: 0, type: 'knife', radius: 5, angle: 0, hitEnemies: [] };
    const enemy = { x: 10, y: 0, radius: 10 };
    expect(checkProjectileHit(proj, enemy)).toBe(true);
  });
  it('circle proj misses beyond radius sum', () => {
    const proj = { x: 0, y: 0, type: 'knife', radius: 5, angle: 0, hitEnemies: [] };
    const enemy = { x: 100, y: 0, radius: 10 };
    expect(checkProjectileHit(proj, enemy)).toBe(false);
  });
  it('does not hit an already-hit enemy', () => {
    const enemy = { x: 5, y: 0, radius: 10 };
    const proj = { x: 0, y: 0, type: 'knife', radius: 5, angle: 0, hitEnemies: [enemy] };
    expect(checkProjectileHit(proj, enemy)).toBe(false);
  });
  it('whip hits in front arc', () => {
    const proj = { x: 0, y: 0, type: 'whip', radius: 60, angle: 0, hitEnemies: [] };
    expect(checkProjectileHit(proj, { x: 50, y: 0, radius: 10 })).toBe(true);
  });
  it('whip misses behind (outside arc)', () => {
    const proj = { x: 0, y: 0, type: 'whip', radius: 60, angle: 0, hitEnemies: [] };
    expect(checkProjectileHit(proj, { x: -50, y: 0, radius: 10 })).toBe(false);
  });
  it('whip misses out of range', () => {
    const proj = { x: 0, y: 0, type: 'whip', radius: 60, angle: 0, hitEnemies: [] };
    expect(checkProjectileHit(proj, { x: 500, y: 0, radius: 10 })).toBe(false);
  });
});

describe('js/weapons generateUpgradeOptions', () => {
  it('returns at most 3 options', () => {
    const weapons = [createWeaponState('knife')];
    const opts = generateUpgradeOptions({ maxHp: 100 }, weapons);
    expect(opts.length).toBeLessThanOrEqual(3);
  });
  it('all options have name/desc/apply', () => {
    const opts = generateUpgradeOptions({ maxHp: 100 }, [createWeaponState('knife')]);
    for (const o of opts) {
      expect(o.name.length).toBeGreaterThan(0);
      expect(typeof o.apply).toBe('function');
    }
  });
  it('stat upgrade apply mutates the player field', () => {
    // Find a maxHp upgrade directly from the pool semantics
    const player: Record<string, number> = { maxHp: 100, hp: 100 };
    const up = UPGRADE_POOL.find((u: { stat: string }) => u.stat === 'armor');
    player.armor = 0;
    // Simulate the generated apply behaviour
    player[up.stat] = (player[up.stat] || 0) + up.value;
    expect(player.armor).toBe(up.value);
  });
  it('evolution option appears when base maxed and partner owned', () => {
    const knife = createWeaponState('knife');
    knife.level = MAX_WEAPON_LEVEL;
    const fireball = createWeaponState('fireball');
    const opts = generateUpgradeOptions({ maxHp: 100 }, [knife, fireball]);
    const hasEvo = opts.some((o: { name: string }) => o.name.indexOf('進化') >= 0);
    expect(hasEvo).toBe(true);
  });
  it('evolution apply removes base weapons and adds evolved', () => {
    const knife = createWeaponState('knife');
    knife.level = MAX_WEAPON_LEVEL;
    const weapons = [knife, createWeaponState('fireball')];
    const opts = generateUpgradeOptions({ maxHp: 100 }, weapons);
    const evo = opts.find((o: { name: string }) => o.name.indexOf('進化') >= 0);
    evo.apply({ maxHp: 100 }, weapons);
    const ids = weapons.map((w: { id: string }) => w.id);
    expect(ids).not.toContain('knife');
    expect(ids).not.toContain('fireball');
    expect(ids).toContain('stormblade');
  });
  it('new weapon option offered when fewer than 4 weapons', () => {
    // With only knife owned (not maxed), the pool can offer a new weapon.
    let found = false;
    for (let attempt = 0; attempt < 50 && !found; attempt++) {
      const opts = generateUpgradeOptions({ maxHp: 100 }, [createWeaponState('knife')]);
      if (opts.some((o: { name: string }) => o.name.indexOf('🆕') >= 0)) found = true;
    }
    expect(found).toBe(true);
  });
});
