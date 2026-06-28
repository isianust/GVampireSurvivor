import { describe, it, expect } from 'vitest';
import { loadGame } from './harness';

const sb = loadGame();
const { CHARACTERS, getCharacter, WEAPON_DEFS, SKILL_DEFS, ULT_DEFS } = sb;

describe('js/characters CHARACTERS table', () => {
  it('has exactly 4 heroes', () => expect(CHARACTERS).toHaveLength(4));

  it('ids are unique', () => {
    const ids = CHARACTERS.map((c: { id: string }) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  const expectedIds = ['mage', 'sword', 'assassin', 'healer'];
  for (const id of expectedIds) {
    it(`contains hero "${id}"`, () =>
      expect(CHARACTERS.some((c: { id: string }) => c.id === id)).toBe(true));
  }

  for (const c of CHARACTERS) {
    describe(`hero ${c.id}`, () => {
      it('has non-empty name', () => expect(c.name.length).toBeGreaterThan(0));
      it('name contains CJK (wuxia naming)', () =>
        expect(/[\u4e00-\u9fff]/.test(c.name)).toBe(true));
      it('has title', () => expect(c.title.length).toBeGreaterThan(0));
      it('has description', () => expect(c.desc.length).toBeGreaterThan(0));
      it('has hex color', () => expect(c.color).toMatch(/^#[0-9a-fA-F]{3,6}$/));
      it('startWeapon exists in WEAPON_DEFS', () =>
        expect(WEAPON_DEFS[c.startWeapon]).toBeTruthy());
      it('ult exists in ULT_DEFS', () => expect(ULT_DEFS[c.ult]).toBeTruthy());
      it('skills is an array of 3', () => {
        expect(Array.isArray(c.skills)).toBe(true);
        expect(c.skills).toHaveLength(3);
      });
      for (let i = 0; i < 3; i++) {
        it(`skill slot ${i} (${c.skills[i]}) exists in SKILL_DEFS`, () =>
          expect(SKILL_DEFS[c.skills[i]]).toBeTruthy());
      }
      it('mods is an object', () => expect(typeof c.mods).toBe('object'));
      it('mods.maxHp is a number', () => expect(typeof c.mods.maxHp).toBe('number'));
      it('mods.speedMult is a number', () => expect(typeof c.mods.speedMult).toBe('number'));
    });
  }
});

describe('js/characters getCharacter', () => {
  for (const c of CHARACTERS) {
    it(`returns ${c.id} by id`, () => expect(getCharacter(c.id).id).toBe(c.id));
  }
  it('unknown id falls back to first (mage)', () => expect(getCharacter('nope').id).toBe('mage'));
  it('undefined falls back to first', () => expect(getCharacter(undefined).id).toBe('mage'));
  it('empty string falls back to first', () => expect(getCharacter('').id).toBe('mage'));
  it('returns the same object reference each time', () =>
    expect(getCharacter('sword')).toBe(getCharacter('sword')));
});

describe('js/characters per-hero specifics', () => {
  it('mage is a glass cannon (negative maxHp mod)', () =>
    expect(getCharacter('mage').mods.maxHp).toBeLessThan(0));
  it('sword is tanky (positive maxHp + armor)', () => {
    const s = getCharacter('sword');
    expect(s.mods.maxHp).toBeGreaterThan(0);
    expect(s.mods.armor).toBeGreaterThan(0);
  });
  it('assassin is fast (high speedMult)', () =>
    expect(getCharacter('assassin').mods.speedMult).toBeGreaterThan(0.2));
  it('healer has regen and lifesteal-on-kill', () => {
    const h = getCharacter('healer');
    expect(h.mods.regen).toBeGreaterThan(0);
    expect(h.mods.lifestealOnKill).toBeGreaterThan(0);
  });
  it('mage uses fireball start weapon', () =>
    expect(getCharacter('mage').startWeapon).toBe('fireball'));
  it('assassin uses knife start weapon', () =>
    expect(getCharacter('assassin').startWeapon).toBe('knife'));
});
