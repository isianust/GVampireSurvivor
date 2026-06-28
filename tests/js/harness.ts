/**
 * Test harness for the pure-HTML `js/` game (the 大改版 revamp).
 *
 * The `js/` files use plain browser globals (no module exports), so we load
 * them into a Node `vm` sandbox that stubs the browser/DOM/render APIs they
 * touch, then expose the real functions and data tables for testing.
 *
 * This means the tests exercise the *actual shipped* `js/` code, not a copy.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

/** Files that contain testable game logic (render/input/main are UI-only). */
const GAME_FILES = [
  'assets.js',
  'utils.js',
  'characters.js',
  'skills.js',
  'enemies.js',
  'player.js',
  'weapons.js',
  'game.js',
];

const ROOT = path.resolve(__dirname, '..', '..');

/** Read + cache raw file contents once. */
const sourceCache: Record<string, string> = {};
function readJs(file: string): string {
  if (!(file in sourceCache)) {
    sourceCache[file] = fs.readFileSync(path.join(ROOT, 'js', file), 'utf8');
  }
  return sourceCache[file];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Sandbox = Record<string, any>;

/** A minimal DOM element stub good enough for HUD/overlay code paths. */
function makeElementStub(): Sandbox {
  const noop = () => {};
  const el: Sandbox = {
    style: {},
    classList: {
      _set: new Set<string>(),
      add(c: string) {
        this._set.add(c);
      },
      remove(c: string) {
        this._set.delete(c);
      },
      contains(c: string) {
        return this._set.has(c);
      },
      toggle(c: string) {
        if (this._set.has(c)) this._set.delete(c);
        else this._set.add(c);
      },
    },
    children: [] as Sandbox[],
    innerHTML: '',
    textContent: '',
    setAttribute: noop,
    getAttribute: () => null,
    appendChild(child: Sandbox) {
      this.children.push(child);
    },
    querySelector: () => null,
    addEventListener: noop,
    getBoundingClientRect: () => ({ width: 0, height: 0, left: 0, top: 0 }),
  };
  return el;
}

export interface LoadOptions {
  /** Provide DOM elements keyed by id so HUD/overlay code can update them. */
  elements?: Record<string, Sandbox>;
  /** Files to load (defaults to the full game-logic set). */
  files?: string[];
}

/**
 * Build a fresh sandbox and load the `js/` files into it.
 * Each call yields an isolated set of globals (including a fresh `Game`),
 * so tests never bleed state into one another.
 */
export function loadGame(opts: LoadOptions = {}): Sandbox {
  const noop = () => {};
  const elements = opts.elements ?? {};

  const sandbox: Sandbox = {
    Math,
    JSON,
    Date,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    Infinity,
    NaN,
    undefined,
    console,
    navigator: { maxTouchPoints: 0, userAgent: 'node-test' },
    performance: { now: () => sandbox.__now },
    __now: 0,
    Image: function Image(this: Sandbox) {
      this.onload = null;
      this.onerror = null;
      let _src = '';
      Object.defineProperty(this, 'src', {
        get() {
          return _src;
        },
        set(v: string) {
          _src = v;
        },
      });
    },
    Renderer: {
      canvas: { width: 800, height: 600 },
      ctx: {
        globalAlpha: 1,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        save: noop,
        restore: noop,
        beginPath: noop,
        arc: noop,
        fill: noop,
        stroke: noop,
        moveTo: noop,
        lineTo: noop,
        fillRect: noop,
        fillText: noop,
        translate: noop,
        rotate: noop,
        scale: noop,
        drawImage: noop,
      },
      clear: noop,
      drawGround: noop,
      drawGem: noop,
      drawEnemy: noop,
      drawProjectile: noop,
      drawEnemyProjectile: noop,
      drawPlayer: noop,
      drawDamageNumber: noop,
    },
    Input: {
      consumePress: () => false,
      clearPresses: noop,
    },
    document: {
      getElementById: (id: string) => elements[id] ?? null,
      createElement: () => makeElementStub(),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: noop,
      hidden: false,
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  const files = opts.files ?? GAME_FILES;
  for (const f of files) {
    vm.runInContext(readJs(f), sandbox, { filename: `js/${f}` });
  }
  return sandbox;
}

/** Convenience: a shared sandbox for pure-function / data-table tests. */
export const shared: Sandbox = loadGame();

/**
 * Stub `Math.random` inside a sandbox to a fixed sequence (cycled).
 * The loaded `js/` functions resolve the global `Math` at call time, so
 * replacing `sandbox.Math` here affects subsequent calls.
 */
export function stubRandom(sandbox: Sandbox, values: number[]): void {
  let i = 0;
  const m = Object.create(Math) as typeof Math & { random: () => number };
  m.random = () => values[i++ % values.length];
  sandbox.Math = m;
}

/** Restore the real Math on a sandbox. */
export function restoreRandom(sandbox: Sandbox): void {
  sandbox.Math = Math;
}

export { makeElementStub };
