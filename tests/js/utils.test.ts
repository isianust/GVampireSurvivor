import { describe, it, expect } from 'vitest';
import { loadGame, stubRandom } from './harness';

const sb = loadGame();
const { clamp, dist, angleTo, lerp, normalizeAngle, circleCollide, hsl, rgba, formatTime } = sb;

describe('js/utils clamp', () => {
  it('returns value within range', () => expect(clamp(5, 0, 10)).toBe(5));
  it('clamps below to min', () => expect(clamp(-5, 0, 10)).toBe(0));
  it('clamps above to max', () => expect(clamp(15, 0, 10)).toBe(10));
  it('min equals max', () => expect(clamp(5, 3, 3)).toBe(3));
  it('value equals min', () => expect(clamp(0, 0, 10)).toBe(0));
  it('value equals max', () => expect(clamp(10, 0, 10)).toBe(10));
  it('negative range in-range', () => expect(clamp(-5, -10, -1)).toBe(-5));
  it('negative range above', () => expect(clamp(0, -10, -1)).toBe(-1));
  it('negative range below', () => expect(clamp(-15, -10, -1)).toBe(-10));
  it('fractional', () => expect(clamp(0.5, 0, 1)).toBe(0.5));
  for (let v = -3; v <= 13; v++) {
    it(`clamp(${v},0,10) stays in [0,10]`, () => {
      const r = clamp(v, 0, 10);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(10);
    });
  }
});

describe('js/utils dist', () => {
  it('horizontal', () => expect(dist({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3));
  it('vertical', () => expect(dist({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4));
  it('3-4-5 triangle', () => expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5));
  it('zero distance', () => expect(dist({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(0));
  it('symmetry', () =>
    expect(dist({ x: 1, y: 2 }, { x: 4, y: 6 })).toBe(dist({ x: 4, y: 6 }, { x: 1, y: 2 })));
  it('negative coords', () => expect(dist({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5));
  for (let i = 1; i <= 8; i++) {
    it(`dist scales: (0,0)->(${i * 3},${i * 4}) = ${i * 5}`, () =>
      expect(dist({ x: 0, y: 0 }, { x: i * 3, y: i * 4 })).toBeCloseTo(i * 5));
  }
});

describe('js/utils angleTo', () => {
  it('east = 0', () => expect(angleTo({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0));
  it('south = PI/2', () =>
    expect(angleTo({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2));
  it('west = PI', () =>
    expect(Math.abs(angleTo({ x: 0, y: 0 }, { x: -1, y: 0 }))).toBeCloseTo(Math.PI));
  it('north = -PI/2', () =>
    expect(angleTo({ x: 0, y: 0 }, { x: 0, y: -1 })).toBeCloseTo(-Math.PI / 2));
  it('NE = PI/4 below origin', () =>
    expect(angleTo({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(Math.PI / 4));
  it('same point = 0', () => expect(angleTo({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0));
});

describe('js/utils lerp', () => {
  it('t=0', () => expect(lerp(0, 10, 0)).toBe(0));
  it('t=1', () => expect(lerp(0, 10, 1)).toBe(10));
  it('t=0.5', () => expect(lerp(0, 10, 0.5)).toBe(5));
  it('negative endpoints', () => expect(lerp(-10, 10, 0.5)).toBe(0));
  it('extrapolation t=2', () => expect(lerp(0, 10, 2)).toBe(20));
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    it(`lerp(0,100,${t})=${t * 100}`, () => expect(lerp(0, 100, t)).toBeCloseTo(t * 100));
  }
});

describe('js/utils normalizeAngle', () => {
  it('0 stays 0', () => expect(normalizeAngle(0)).toBe(0));
  it('PI stays PI', () => expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI));
  it('2PI -> 0', () => expect(normalizeAngle(2 * Math.PI)).toBeCloseTo(0));
  it('3PI -> PI', () => expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI));
  it('-2PI -> 0', () => expect(normalizeAngle(-2 * Math.PI)).toBeCloseTo(0));
  for (let k = -3; k <= 3; k++) {
    it(`normalizeAngle(0.3 + ${k}*2PI) in [-PI,PI]`, () => {
      const r = normalizeAngle(0.3 + k * 2 * Math.PI);
      expect(r).toBeGreaterThanOrEqual(-Math.PI - 1e-9);
      expect(r).toBeLessThanOrEqual(Math.PI + 1e-9);
      expect(r).toBeCloseTo(0.3);
    });
  }
});

describe('js/utils circleCollide', () => {
  it('overlapping', () =>
    expect(circleCollide({ x: 0, y: 0, radius: 10 }, { x: 5, y: 0, radius: 10 })).toBe(true));
  it('far apart', () =>
    expect(circleCollide({ x: 0, y: 0, radius: 5 }, { x: 100, y: 0, radius: 5 })).toBe(false));
  it('exactly touching not colliding (strict <)', () =>
    expect(circleCollide({ x: 0, y: 0, radius: 5 }, { x: 10, y: 0, radius: 5 })).toBe(false));
  it('default radius when missing', () =>
    expect(circleCollide({ x: 0, y: 0 }, { x: 20, y: 0 })).toBe(true));
  it('default radius far', () =>
    expect(circleCollide({ x: 0, y: 0 }, { x: 40, y: 0 })).toBe(false));
});

describe('js/utils hsl & rgba', () => {
  it('hsl no alpha', () => expect(hsl(120, 50, 60)).toBe('hsl(120,50%,60%)'));
  it('hsl with alpha', () => expect(hsl(120, 50, 60, 0.5)).toBe('hsla(120,50%,60%,0.5)'));
  it('hsl alpha 0', () => expect(hsl(0, 0, 0, 0)).toBe('hsla(0,0%,0%,0)'));
  it('rgba', () => expect(rgba(255, 128, 0, 1)).toBe('rgba(255,128,0,1)'));
  it('rgba transparent', () => expect(rgba(0, 0, 0, 0)).toBe('rgba(0,0,0,0)'));
});

describe('js/utils formatTime', () => {
  it('zero', () => expect(formatTime(0)).toBe('00:00'));
  it('59s', () => expect(formatTime(59)).toBe('00:59'));
  it('60s -> 01:00', () => expect(formatTime(60)).toBe('01:00'));
  it('90s -> 01:30', () => expect(formatTime(90)).toBe('01:30'));
  it('truncates fractional seconds', () => expect(formatTime(75.9)).toBe('01:15'));
  it('10 minutes', () => expect(formatTime(600)).toBe('10:00'));
  it('over an hour keeps minutes', () => expect(formatTime(3661)).toBe('61:01'));
  for (let s = 0; s < 12; s++) {
    it(`formatTime(${s}) zero-pads`, () =>
      expect(formatTime(s)).toBe('00:' + (s < 10 ? '0' + s : s)));
  }
});

describe('js/utils randInt / randFloat (stubbed)', () => {
  it('randInt floor with random=0 returns min', () => {
    const s = loadGame();
    stubRandom(s, [0]);
    expect(s.randInt(5, 10)).toBe(5);
  });
  it('randInt with random≈1 returns max-1', () => {
    const s = loadGame();
    stubRandom(s, [0.999999]);
    expect(s.randInt(5, 10)).toBe(9);
  });
  it('randFloat random=0 returns min', () => {
    const s = loadGame();
    stubRandom(s, [0]);
    expect(s.randFloat(2, 8)).toBe(2);
  });
  it('randFloat random=0.5 returns midpoint', () => {
    const s = loadGame();
    stubRandom(s, [0.5]);
    expect(s.randFloat(2, 8)).toBe(5);
  });
  for (let r = 0; r < 10; r++) {
    it(`randInt(0,4) with random=${r / 10} in [0,4)`, () => {
      const s = loadGame();
      stubRandom(s, [r / 10]);
      const v = s.randInt(0, 4);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(4);
    });
  }
});

describe('js/utils spawnOutsideView', () => {
  const camera = { x: 0, y: 0 };
  const canvas = { width: 800, height: 600 };
  it('top side is above view', () => {
    const s = loadGame();
    stubRandom(s, [0, 0.5]); // side=0 (top)
    const p = s.spawnOutsideView(camera, canvas, 80);
    expect(p.y).toBeLessThan(-canvas.height / 2);
  });
  it('right side is right of view', () => {
    const s = loadGame();
    stubRandom(s, [0.3, 0.5]); // side=1 (right): randInt(0,4) of 0.3*4=1.2 -> 1
    const p = s.spawnOutsideView(camera, canvas, 80);
    expect(p.x).toBeGreaterThan(canvas.width / 2);
  });
  it('bottom side is below view', () => {
    const s = loadGame();
    stubRandom(s, [0.5, 0.5]); // side=2
    const p = s.spawnOutsideView(camera, canvas, 80);
    expect(p.y).toBeGreaterThan(canvas.height / 2);
  });
  it('left side is left of view', () => {
    const s = loadGame();
    stubRandom(s, [0.9, 0.5]); // side=3 (default)
    const p = s.spawnOutsideView(camera, canvas, 80);
    expect(p.x).toBeLessThan(-canvas.width / 2);
  });
  it('default margin applies', () => {
    const s = loadGame();
    stubRandom(s, [0, 0.5]);
    const p = s.spawnOutsideView(camera, canvas);
    expect(p.y).toBeLessThanOrEqual(-canvas.height / 2 - 80);
  });
});

describe('js/utils isMobileDevice', () => {
  it('returns false on node-test navigator', () => {
    expect(typeof sb.isMobileDevice()).toBe('boolean');
    expect(sb.isMobileDevice()).toBe(false);
  });
});
