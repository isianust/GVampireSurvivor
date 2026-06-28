import { describe, it, expect, vi } from 'vitest';
import { loadGame } from './harness';

const sb = loadGame();
const { SKILL_DEFS, ULT_DEFS, DEFAULT_SKILLS, ULT_COOLDOWN, Skills } = sb;

describe('js/skills SKILL_DEFS table', () => {
  it('has 15 skill definitions', () => expect(Object.keys(SKILL_DEFS)).toHaveLength(15));

  for (const key of Object.keys(SKILL_DEFS)) {
    const def = SKILL_DEFS[key];
    describe(`skill ${key}`, () => {
      it('id matches its table key', () => expect(def.id).toBe(key));
      it('has a name', () => expect(def.name.length).toBeGreaterThan(0));
      it('key is one of j/k/l', () => expect(['j', 'k', 'l']).toContain(def.key));
      it('has an icon', () => expect(def.icon.length).toBeGreaterThan(0));
      it('cooldown > 0', () => expect(def.cooldown).toBeGreaterThan(0));
      it('mech is dash/nova/frost', () => expect(['dash', 'nova', 'frost']).toContain(def.mech));
      if (def.mech === 'dash') {
        it('dash has dist & inv', () => {
          expect(def.dist).toBeGreaterThan(0);
          expect(def.inv).toBeGreaterThan(0);
        });
      }
      if (def.mech === 'nova') {
        it('nova has radius/dmgBase/dmgScale', () => {
          expect(def.radius).toBeGreaterThan(0);
          expect(def.dmgBase).toBeGreaterThan(0);
          expect(def.dmgScale).toBeGreaterThan(0);
        });
      }
      if (def.mech === 'frost') {
        it('frost has radius & dur', () => {
          expect(def.radius).toBeGreaterThan(0);
          expect(def.dur).toBeGreaterThan(0);
        });
      }
    });
  }
});

describe('js/skills ULT_DEFS table', () => {
  const expectedUlts = ['meteor', 'skyblade', 'shadowkill', 'sweetdew'];
  for (const u of expectedUlts) {
    it(`contains ult ${u}`, () => expect(ULT_DEFS[u]).toBeTruthy());
  }
  for (const key of Object.keys(ULT_DEFS)) {
    const def = ULT_DEFS[key];
    describe(`ult ${key}`, () => {
      it('has name', () => expect(def.name.length).toBeGreaterThan(0));
      it('radius > 0', () => expect(def.radius).toBeGreaterThan(0));
      it('dmgBase > 0', () => expect(def.dmgBase).toBeGreaterThan(0));
      it('dmgScale > 0', () => expect(def.dmgScale).toBeGreaterThan(0));
      it('dmgMult > 0', () => expect(def.dmgMult).toBeGreaterThan(0));
    });
  }
  it('sweetdew heals (healPct)', () => expect(ULT_DEFS.sweetdew.healPct).toBeGreaterThan(0));
  it('bloodmoon heals (healPct)', () => expect(ULT_DEFS.bloodmoon.healPct).toBeGreaterThan(0));
  it('fortress grants shield', () => expect(ULT_DEFS.fortress.shield).toBeGreaterThan(0));
});

describe('js/skills constants', () => {
  it('DEFAULT_SKILLS = [dash,nova,frost]', () =>
    expect(DEFAULT_SKILLS).toEqual(['dash', 'nova', 'frost']));
  it('ULT_COOLDOWN = 60', () => expect(ULT_COOLDOWN).toBe(60));
});

function fakePlayer(over: Record<string, unknown> = {}) {
  return {
    x: 0,
    y: 0,
    level: 1,
    hp: 100,
    maxHp: 100,
    radius: 16,
    invTimer: 0,
    skills: ['m_blink', 'm_flame', 'm_frost'],
    skillCd: { m_blink: 0, m_flame: 0, m_frost: 0 },
    ultId: 'meteor',
    ultCharge: 50,
    ultCd: 0,
    ...over,
  };
}

function fakeGame(player: ReturnType<typeof fakePlayer>) {
  return {
    player,
    dashPlayer: vi.fn(),
    areaDamage: vi.fn(),
    slowArea: vi.fn(),
    addParticles: vi.fn(),
    addDamageNumber: vi.fn(),
  };
}

describe('js/skills Skills.update', () => {
  it('decrements skill cooldowns', () => {
    const p = fakePlayer({ skillCd: { m_blink: 1.0 } });
    Skills.update(p, 0.25);
    expect(p.skillCd.m_blink).toBeCloseTo(0.75);
  });
  it('decrements ult cooldown', () => {
    const p = fakePlayer({ ultCd: 10 });
    Skills.update(p, 1);
    expect(p.ultCd).toBeCloseTo(9);
  });
  it('does not touch already-zero cooldowns below zero increase', () => {
    const p = fakePlayer({ skillCd: { m_blink: 0 } });
    Skills.update(p, 1);
    expect(p.skillCd.m_blink).toBe(0);
  });
});

describe('js/skills ready / ultReady', () => {
  it('ready when cd<=0', () => expect(Skills.ready(fakePlayer(), 'm_blink')).toBe(true));
  it('not ready when cd>0', () =>
    expect(Skills.ready(fakePlayer({ skillCd: { m_blink: 2 } }), 'm_blink')).toBe(false));
  it('ultReady when ultCd<=0', () => expect(Skills.ultReady(fakePlayer())).toBe(true));
  it('ult not ready when ultCd>0', () =>
    expect(Skills.ultReady(fakePlayer({ ultCd: 5 }))).toBe(false));
});

describe('js/skills skillForSlot', () => {
  const p = fakePlayer();
  it('slot 0', () => expect(Skills.skillForSlot(p, 0)).toBe('m_blink'));
  it('slot 1', () => expect(Skills.skillForSlot(p, 1)).toBe('m_flame'));
  it('slot 2', () => expect(Skills.skillForSlot(p, 2)).toBe('m_frost'));
  it('falls back to DEFAULT_SKILLS when player has none', () =>
    expect(Skills.skillForSlot({}, 0)).toBe('dash'));
});

describe('js/skills activate', () => {
  it('returns false if skill not ready', () => {
    const p = fakePlayer({ skillCd: { m_blink: 2 } });
    expect(Skills.activate(fakeGame(p), 'm_blink')).toBe(false);
  });
  it('returns false for unknown skill', () => {
    expect(Skills.activate(fakeGame(fakePlayer()), 'nope')).toBe(false);
  });
  it('dash skill calls dashPlayer and sets cooldown', () => {
    const p = fakePlayer();
    const g = fakeGame(p);
    expect(Skills.activate(g, 'm_blink')).toBe(true);
    expect(g.dashPlayer).toHaveBeenCalledWith(SKILL_DEFS.m_blink.dist, SKILL_DEFS.m_blink.inv);
    expect(p.skillCd.m_blink).toBe(SKILL_DEFS.m_blink.cooldown);
  });
  it('nova skill calls areaDamage with level-scaled damage', () => {
    const p = fakePlayer({ level: 5 });
    const g = fakeGame(p);
    Skills.activate(g, 'm_flame');
    const def = SKILL_DEFS.m_flame;
    const expDmg = def.dmgBase + 5 * def.dmgScale;
    expect(g.areaDamage).toHaveBeenCalledWith(p.x, p.y, def.radius, expDmg, true);
  });
  it('frost skill calls slowArea', () => {
    const p = fakePlayer();
    const g = fakeGame(p);
    Skills.activate(g, 'm_frost');
    expect(g.slowArea).toHaveBeenCalledWith(
      p.x,
      p.y,
      SKILL_DEFS.m_frost.radius,
      SKILL_DEFS.m_frost.dur,
    );
  });
  it('frost with heal restores HP capped at maxHp', () => {
    const p = fakePlayer({ hp: 50, maxHp: 100 });
    const g = fakeGame(p);
    Skills.activate(g, 'h_dew'); // heal 0.18
    expect(p.hp).toBeCloseTo(50 + 100 * SKILL_DEFS.h_dew.heal);
  });
  it('flashes skill name via addDamageNumber', () => {
    const p = fakePlayer();
    const g = fakeGame(p);
    Skills.activate(g, 'm_blink');
    expect(g.addDamageNumber).toHaveBeenCalled();
  });
});

describe('js/skills activateUlt', () => {
  it('returns false when not ready', () => {
    const p = fakePlayer({ ultCd: 30 });
    expect(Skills.activateUlt(fakeGame(p))).toBe(false);
  });
  it('puts ult on 60s cooldown and clears charge', () => {
    const p = fakePlayer();
    const g = fakeGame(p);
    expect(Skills.activateUlt(g)).toBe(true);
    expect(p.ultCd).toBe(ULT_COOLDOWN);
    expect(p.ultCharge).toBe(0);
  });
  it('damage formula = (dmgBase + level*dmgScale)*dmgMult', () => {
    const p = fakePlayer({ level: 3, ultId: 'meteor' });
    const g = fakeGame(p);
    Skills.activateUlt(g);
    const def = ULT_DEFS.meteor;
    const expDmg = (def.dmgBase + 3 * def.dmgScale) * def.dmgMult;
    expect(g.areaDamage).toHaveBeenCalledWith(p.x, p.y, def.radius, expDmg, true);
  });
  it('sweetdew ult heals by healPct', () => {
    const p = fakePlayer({ hp: 10, maxHp: 100, ultId: 'sweetdew' });
    const g = fakeGame(p);
    Skills.activateUlt(g);
    expect(p.hp).toBeCloseTo(10 + 100 * ULT_DEFS.sweetdew.healPct);
  });
  it('fortress ult grants shield via invTimer', () => {
    const p = fakePlayer({ invTimer: 0, ultId: 'fortress' });
    const g = fakeGame(p);
    Skills.activateUlt(g);
    expect(p.invTimer).toBeGreaterThanOrEqual(ULT_DEFS.fortress.shield);
  });
  it('unknown ultId falls back to meteor', () => {
    const p = fakePlayer({ ultId: 'does-not-exist' });
    const g = fakeGame(p);
    expect(Skills.activateUlt(g)).toBe(true);
    expect(g.areaDamage).toHaveBeenCalledWith(
      p.x,
      p.y,
      ULT_DEFS.meteor.radius,
      expect.any(Number),
      true,
    );
  });
});
