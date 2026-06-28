import { describe, it, expect } from 'vitest';
import { loadGame, stubRandom } from './harness';

const sb = loadGame();
const {
  ENEMY_TYPES,
  RANGED_ENEMIES,
  BOSS_ABILITIES,
  HP_SCALE_INTERVAL,
  HP_SCALE_MULTIPLIER,
  createEnemy,
  getAvailableEnemyTypes,
  pickEnemyType,
} = sb;

describe('js/enemies ENEMY_TYPES table', () => {
  it('has 12 entries (incl. 2 bosses)', () => expect(Object.keys(ENEMY_TYPES)).toHaveLength(12));

  const normal = [
    'skeleton',
    'zombie',
    'bat',
    'ghost',
    'spider',
    'werewolf',
    'warlock',
    'vampire',
    'drake',
    'demon',
  ];
  const bosses = ['lich', 'reaper'];

  for (const key of Object.keys(ENEMY_TYPES)) {
    const def = ENEMY_TYPES[key];
    describe(`enemy ${key}`, () => {
      it('has English name', () => expect(def.name.length).toBeGreaterThan(0));
      it('has Chinese cn name', () => expect(def.cn.length).toBeGreaterThan(0));
      it('hp > 0', () => expect(def.hp).toBeGreaterThan(0));
      it('speed > 0', () => expect(def.speed).toBeGreaterThan(0));
      it('damage > 0', () => expect(def.damage).toBeGreaterThan(0));
      it('radius > 0', () => expect(def.radius).toBeGreaterThan(0));
      it('xp > 0', () => expect(def.xp).toBeGreaterThan(0));
      it('color is hex', () => expect(def.color).toMatch(/^#[0-9a-fA-F]{3,6}$/));
      it('minTime >= 0', () => expect(def.minTime).toBeGreaterThanOrEqual(0));
    });
  }

  for (const b of bosses) {
    it(`boss ${b} has huge minTime (never auto-spawned)`, () =>
      expect(ENEMY_TYPES[b].minTime).toBeGreaterThan(99999));
  }
  for (const n of normal) {
    it(`normal ${n} has a reasonable minTime (<=180)`, () =>
      expect(ENEMY_TYPES[n].minTime).toBeLessThanOrEqual(180));
  }
  it('demon is the toughest non-boss (highest hp among normals)', () => {
    const maxNormalHp = Math.max(...normal.map((n) => ENEMY_TYPES[n].hp));
    expect(ENEMY_TYPES.demon.hp).toBe(maxNormalHp);
  });
});

describe('js/enemies RANGED_ENEMIES table', () => {
  for (const key of Object.keys(RANGED_ENEMIES)) {
    const r = RANGED_ENEMIES[key];
    describe(`ranged ${key}`, () => {
      it('key exists in ENEMY_TYPES', () => expect(ENEMY_TYPES[key]).toBeTruthy());
      it('projColor is hex', () => expect(r.projColor).toMatch(/^#[0-9a-fA-F]{3,6}$/));
      it('projSpeed > 0', () => expect(r.projSpeed).toBeGreaterThan(0));
      it('cooldown > 0', () => expect(r.cooldown).toBeGreaterThan(0));
      it('range > 0', () => expect(r.range).toBeGreaterThan(0));
      it('projRadius > 0', () => expect(r.projRadius).toBeGreaterThan(0));
    });
  }
});

describe('js/enemies BOSS_ABILITIES table', () => {
  for (const key of Object.keys(BOSS_ABILITIES)) {
    const ab = BOSS_ABILITIES[key];
    describe(`boss ability ${key}`, () => {
      it('key exists in ENEMY_TYPES', () => expect(ENEMY_TYPES[key]).toBeTruthy());
      it('has a name', () => expect(ab.name.length).toBeGreaterThan(0));
      it('enrage hpPct in (0,1)', () => {
        expect(ab.enrage.hpPct).toBeGreaterThan(0);
        expect(ab.enrage.hpPct).toBeLessThan(1);
      });
      it('enrage speedMult >= 1', () => expect(ab.enrage.speedMult).toBeGreaterThanOrEqual(1));
      it('enrage damageMult >= 1', () => expect(ab.enrage.damageMult).toBeGreaterThanOrEqual(1));
      it('summon.type exists in ENEMY_TYPES', () =>
        expect(ENEMY_TYPES[ab.summon.type]).toBeTruthy());
      it('summon.count > 0', () => expect(ab.summon.count).toBeGreaterThan(0));
      it('summon.interval > 0', () => expect(ab.summon.interval).toBeGreaterThan(0));
      it('summon.max > 0', () => expect(ab.summon.max).toBeGreaterThan(0));
    });
  }
});

describe('js/enemies HP scaling constants', () => {
  it('interval = 60', () => expect(HP_SCALE_INTERVAL).toBe(60));
  it('multiplier = 0.3', () => expect(HP_SCALE_MULTIPLIER).toBe(0.3));
});

describe('js/enemies createEnemy', () => {
  it('copies base stats at elapsed 0', () => {
    const e = createEnemy('skeleton', 10, 20, 0);
    expect(e.type).toBe('skeleton');
    expect(e.x).toBe(10);
    expect(e.y).toBe(20);
    expect(e.hp).toBe(ENEMY_TYPES.skeleton.hp);
    expect(e.maxHp).toBe(ENEMY_TYPES.skeleton.hp);
    expect(e.speed).toBe(ENEMY_TYPES.skeleton.speed);
    expect(e.damage).toBe(ENEMY_TYPES.skeleton.damage);
    expect(e.radius).toBe(ENEMY_TYPES.skeleton.radius);
    expect(e.xp).toBe(ENEMY_TYPES.skeleton.xp);
  });
  it('initializes timers and isBoss', () => {
    const e = createEnemy('zombie', 0, 0, 0);
    expect(e.hitTimer).toBe(0);
    expect(e.attackCooldown).toBe(0);
    expect(e.slowTimer).toBe(0);
    expect(e.isBoss).toBe(false);
  });
  it('melee enemy has null ranged', () => {
    expect(createEnemy('skeleton', 0, 0, 0).ranged).toBeNull();
  });
  it('ranged enemy carries its ranged config', () => {
    const e = createEnemy('warlock', 0, 0, 0);
    expect(e.ranged).toBe(RANGED_ENEMIES.warlock);
    expect(e.rangeTimer).toBeGreaterThan(0);
  });
  // HP scaling steps
  for (let step = 0; step <= 5; step++) {
    const elapsed = step * HP_SCALE_INTERVAL;
    const scale = 1 + step * HP_SCALE_MULTIPLIER;
    it(`scales skeleton hp at elapsed ${elapsed}s by ${scale}x`, () => {
      const e = createEnemy('skeleton', 0, 0, elapsed);
      expect(e.hp).toBe(Math.floor(ENEMY_TYPES.skeleton.hp * scale));
    });
  }
  it('does not scale within an interval', () => {
    const a = createEnemy('zombie', 0, 0, 0).hp;
    const b = createEnemy('zombie', 0, 0, 59).hp;
    expect(a).toBe(b);
  });
});

describe('js/enemies getAvailableEnemyTypes', () => {
  const cases: Array<[number, string[]]> = [
    [0, ['skeleton', 'zombie']],
    [15, ['bat']],
    [30, ['ghost']],
    [45, ['spider']],
    [60, ['werewolf']],
    [90, ['warlock']],
    [120, ['vampire']],
    [150, ['drake']],
    [180, ['demon']],
  ];
  for (const [elapsed, mustInclude] of cases) {
    it(`at ${elapsed}s includes ${mustInclude.join(',')}`, () => {
      const avail = getAvailableEnemyTypes(elapsed);
      for (const t of mustInclude) expect(avail).toContain(t);
    });
  }
  it('never includes bosses (lich/reaper)', () => {
    const avail = getAvailableEnemyTypes(100000);
    expect(avail).not.toContain('lich');
    expect(avail).not.toContain('reaper');
  });
  it('at 0s does not yet include bat (minTime 15)', () =>
    expect(getAvailableEnemyTypes(0)).not.toContain('bat'));
  it('monotonic: later time has >= types', () => {
    for (let t = 0; t < 200; t += 20) {
      expect(getAvailableEnemyTypes(t + 20).length).toBeGreaterThanOrEqual(
        getAvailableEnemyTypes(t).length,
      );
    }
  });
});

describe('js/enemies pickEnemyType', () => {
  it('always returns an available type', () => {
    for (let t = 0; t <= 200; t += 10) {
      const s = loadGame();
      stubRandom(s, [0.5]);
      const picked = s.pickEnemyType(t);
      expect(s.getAvailableEnemyTypes(t)).toContain(picked);
    }
  });
  it('roll=0 picks the first available type', () => {
    const s = loadGame();
    stubRandom(s, [0]);
    expect(s.pickEnemyType(0)).toBe('skeleton');
  });
  it('roll≈1 picks the last (newest) available type', () => {
    const s = loadGame();
    stubRandom(s, [0.999999]);
    const avail = s.getAvailableEnemyTypes(60);
    expect(s.pickEnemyType(60)).toBe(avail[avail.length - 1]);
  });
  it('returns a string', () => {
    const s = loadGame();
    stubRandom(s, [0.3]);
    expect(typeof s.pickEnemyType(50)).toBe('string');
  });
});
