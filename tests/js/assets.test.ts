import { describe, it, expect } from 'vitest';
import { loadGame } from './harness';

const sb = loadGame();
const { ASSET_LIST, Assets, CHARACTERS, ENEMY_TYPES, EVOLVED_DEFS } = sb;

describe('js/assets ASSET_LIST integrity', () => {
  it('is a non-empty array', () => expect(ASSET_LIST.length).toBeGreaterThan(0));

  it('keys are unique', () => {
    const keys = ASSET_LIST.map((a: { key: string }) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  const categories = ['hero', 'enemy', 'boss', 'weapon', 'pickup'];
  for (const entry of ASSET_LIST) {
    describe(`asset ${entry.key}`, () => {
      it('has a key', () => expect(entry.key.length).toBeGreaterThan(0));
      it('has a label', () => expect(entry.label.length).toBeGreaterThan(0));
      it('category is valid', () => expect(categories).toContain(entry.category));
      it('src is under assets/', () => expect(entry.src).toMatch(/^assets\//));
      it('src is a .png', () => expect(entry.src).toMatch(/\.png$/));
    });
  }
});

describe('js/assets coverage', () => {
  const keys = new Set(ASSET_LIST.map((a: { key: string }) => a.key));
  for (const c of CHARACTERS) {
    it(`hero ${c.id} has char_ asset`, () => expect(keys.has('char_' + c.id)).toBe(true));
  }
  for (const type of Object.keys(ENEMY_TYPES)) {
    it(`enemy/boss ${type} has enemy_ asset`, () => expect(keys.has('enemy_' + type)).toBe(true));
  }
  for (const key of Object.keys(EVOLVED_DEFS)) {
    it(`evolved ${key} assetKey present in list`, () =>
      expect(keys.has(EVOLVED_DEFS[key].assetKey)).toBe(true));
  }
  it('has an XP gem pickup', () => expect(keys.has('gem')).toBe(true));
});

describe('js/assets Assets accessor', () => {
  it('get returns null before any image is ready (procedural fallback)', () => {
    expect(Assets.get('char_mage')).toBeNull();
  });
  it('has returns false before load', () => {
    expect(Assets.has('char_mage')).toBe(false);
  });
  it('get on unknown key returns null', () => {
    expect(Assets.get('does_not_exist')).toBeNull();
  });
  it('disabled Assets always returns null', () => {
    const s = loadGame();
    s.Assets.enabled = false;
    expect(s.Assets.get('gem')).toBeNull();
  });
  it('load registers a record per asset and does not throw', () => {
    const s = loadGame();
    s.Assets.load();
    expect(Object.keys(s.Assets.map).length).toBe(s.ASSET_LIST.length);
  });
});
