import { describe, it, expect } from 'vitest';
import { loadGame } from './harness';

const sb = loadGame();
const { createPlayer, updatePlayer, canPickupGem, addXP, damagePlayer, getCharacter, CHARACTERS } =
  sb;

describe('js/player createPlayer defaults', () => {
  const p = createPlayer(getCharacter('mage'));
  it('starts at origin', () => {
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });
  it('base speed 120', () => expect(p.speed).toBe(120));
  it('radius 16', () => expect(p.radius).toBe(16));
  it('level 1', () => expect(p.level).toBe(1));
  it('xp 0', () => expect(p.xp).toBe(0));
  it('xpToLevel 10', () => expect(p.xpToLevel).toBe(10));
  it('invTimer 0', () => expect(p.invTimer).toBe(0));
  it('hp equals maxHp', () => expect(p.hp).toBe(p.maxHp));
  it('ultCd starts at 0', () => expect(p.ultCd).toBe(0));
});

describe('js/player createPlayer applies character mods', () => {
  for (const c of CHARACTERS) {
    describe(`hero ${c.id}`, () => {
      const p = createPlayer(c);
      const m = c.mods;
      it('maxHp = 100 + mods.maxHp', () => expect(p.maxHp).toBe(100 + (m.maxHp || 0)));
      it('hp filled to maxHp', () => expect(p.hp).toBe(p.maxHp));
      it('armor = 0 + mods.armor', () => expect(p.armor).toBe(0 + (m.armor || 0)));
      it('regen = 0 + mods.regen', () => expect(p.regen).toBeCloseTo(0 + (m.regen || 0)));
      it('magnetRange = 60 + mods.magnetRange', () =>
        expect(p.magnetRange).toBe(60 + (m.magnetRange || 0)));
      it('speedMult = 1 + mods.speedMult', () =>
        expect(p.speedMult).toBeCloseTo(1 + (m.speedMult || 0)));
      it('lifestealOnKill from mods', () => expect(p.lifestealOnKill).toBe(m.lifestealOnKill || 0));
      it('ultId from character', () => expect(p.ultId).toBe(c.ult));
      it('skills from character', () => expect(p.skills).toEqual(c.skills));
      it('every skill has a cooldown slot initialised to 0', () => {
        for (const s of c.skills) expect(p.skillCd[s]).toBe(0);
      });
      it('charId set', () => expect(p.charId).toBe(c.id));
    });
  }
  it('no character defaults to mage-ish stats', () => {
    const p = createPlayer();
    expect(p.charId).toBe('mage');
  });
});

describe('js/player updatePlayer movement', () => {
  it('moves right', () => {
    const p = createPlayer(getCharacter('sword'));
    p.speedMult = 1;
    updatePlayer(p, 1, 0, 1);
    expect(p.x).toBeCloseTo(p.speed);
    expect(p.y).toBe(0);
  });
  it('normalizes diagonal input (speed magnitude preserved)', () => {
    const p = createPlayer(getCharacter('sword'));
    p.speedMult = 1;
    updatePlayer(p, 1, 1, 1);
    const moved = Math.sqrt(p.x * p.x + p.y * p.y);
    expect(moved).toBeCloseTo(p.speed);
  });
  it('zero input does not move', () => {
    const p = createPlayer(getCharacter('sword'));
    updatePlayer(p, 0, 0, 1);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });
  it('records facing direction when moving', () => {
    const p = createPlayer(getCharacter('sword'));
    updatePlayer(p, 0, -1, 0.1);
    expect(p.facingY).toBeCloseTo(-1);
  });
  it('applies speedMult', () => {
    const p = createPlayer(getCharacter('sword'));
    p.speedMult = 2;
    updatePlayer(p, 1, 0, 1);
    expect(p.x).toBeCloseTo(p.speed * 2);
  });
  it('dash burst multiplies speed ~3.2x and decrements dashTimer', () => {
    const p = createPlayer(getCharacter('sword'));
    p.speedMult = 1;
    p.dashTimer = 0.18;
    updatePlayer(p, 1, 0, 0.1);
    expect(p.x).toBeCloseTo(p.speed * 3.2 * 0.1);
    expect(p.dashTimer).toBeCloseTo(0.08);
  });
  it('decrements invTimer', () => {
    const p = createPlayer(getCharacter('sword'));
    p.invTimer = 0.5;
    updatePlayer(p, 0, 0, 0.2);
    expect(p.invTimer).toBeCloseTo(0.3);
  });
  it('regen heals up to maxHp', () => {
    const p = createPlayer(getCharacter('healer'));
    p.hp = 50;
    p.regen = 10;
    updatePlayer(p, 0, 0, 1);
    expect(p.hp).toBeCloseTo(60);
  });
  it('regen never exceeds maxHp', () => {
    const p = createPlayer(getCharacter('healer'));
    p.hp = p.maxHp - 1;
    p.regen = 1000;
    updatePlayer(p, 0, 0, 1);
    expect(p.hp).toBe(p.maxHp);
  });
});

describe('js/player canPickupGem', () => {
  const p = createPlayer(getCharacter('mage'));
  p.x = 0;
  p.y = 0;
  it('within magnet range', () =>
    expect(canPickupGem(p, { x: p.magnetRange - 1, y: 0, size: 5 })).toBe(true));
  it('outside magnet range', () =>
    expect(canPickupGem(p, { x: p.magnetRange + 100, y: 0, size: 5 })).toBe(false));
  it('size extends pickup', () =>
    expect(canPickupGem(p, { x: p.magnetRange + 4, y: 0, size: 20 })).toBe(true));
  it('missing size uses default 5', () =>
    expect(canPickupGem(p, { x: p.magnetRange + 4, y: 0 })).toBe(true));
});

describe('js/player addXP', () => {
  it('accumulates without leveling', () => {
    const p = createPlayer(getCharacter('mage'));
    expect(addXP(p, 5)).toBe(false);
    expect(p.xp).toBe(5);
    expect(p.level).toBe(1);
  });
  it('levels up at threshold', () => {
    const p = createPlayer(getCharacter('mage'));
    expect(addXP(p, 10)).toBe(true);
    expect(p.level).toBe(2);
    expect(p.xp).toBe(0);
  });
  it('carries over surplus xp', () => {
    const p = createPlayer(getCharacter('mage'));
    addXP(p, 13);
    expect(p.level).toBe(2);
    expect(p.xp).toBe(3);
  });
  it('xpToLevel grows by floor(old*1.35+5)', () => {
    const p = createPlayer(getCharacter('mage'));
    addXP(p, 10);
    expect(p.xpToLevel).toBe(Math.floor(10 * 1.35 + 5));
  });
  it('multi-level progression is monotonic', () => {
    const p = createPlayer(getCharacter('mage'));
    let prev = p.xpToLevel;
    for (let i = 0; i < 8; i++) {
      addXP(p, p.xpToLevel);
      expect(p.xpToLevel).toBeGreaterThanOrEqual(prev);
      prev = p.xpToLevel;
    }
    expect(p.level).toBe(9);
  });
});

describe('js/player damagePlayer', () => {
  it('applies damage minus armor', () => {
    const p = createPlayer(getCharacter('sword'));
    p.armor = 2;
    const start = p.hp;
    expect(damagePlayer(p, 10)).toBe(true);
    expect(p.hp).toBe(start - 8);
  });
  it('minimum damage is 1', () => {
    const p = createPlayer(getCharacter('sword'));
    p.armor = 100;
    const start = p.hp;
    damagePlayer(p, 5);
    expect(p.hp).toBe(start - 1);
  });
  it('blocked while invincible', () => {
    const p = createPlayer(getCharacter('sword'));
    p.invTimer = 0.5;
    const start = p.hp;
    expect(damagePlayer(p, 10)).toBe(false);
    expect(p.hp).toBe(start);
  });
  it('sets invincibility after a hit', () => {
    const p = createPlayer(getCharacter('sword'));
    damagePlayer(p, 10);
    expect(p.invTimer).toBe(p.invDuration);
  });
  for (let dmg = 1; dmg <= 10; dmg++) {
    it(`damage ${dmg} with 0 armor reduces hp by ${dmg}`, () => {
      const p = createPlayer(getCharacter('mage'));
      p.armor = 0;
      const start = p.hp;
      damagePlayer(p, dmg);
      expect(p.hp).toBe(start - dmg);
    });
  }
});
