import { describe, it, expect } from 'vitest';
import {
  clamp,
  dist,
  angleTo,
  randInt,
  randFloat,
  lerp,
  normalizeAngle,
  circleCollide,
  hsl,
  rgba,
  spawnOutsideView,
  formatTime,
  shuffle,
} from '../src/systems/utils';

describe('clamp', () => {
  it('should return value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('should clamp to min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('should clamp to max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should return min when min equals max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });

  it('should handle negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
    expect(clamp(-15, -10, -1)).toBe(-10);
  });

  it('should handle exact boundary values', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('dist', () => {
  it('should calculate distance between same point as 0', () => {
    expect(dist({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
  });

  it('should calculate distance on x-axis', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
  });

  it('should calculate distance on y-axis', () => {
    expect(dist({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4);
  });

  it('should calculate diagonal distance (3-4-5 triangle)', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('should be symmetric', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 4, y: 6 };
    expect(dist(a, b)).toBe(dist(b, a));
  });

  it('should handle negative coordinates', () => {
    expect(dist({ x: -3, y: 0 }, { x: 0, y: 4 })).toBe(5);
  });
});

describe('angleTo', () => {
  it('should return 0 for point directly to the right', () => {
    expect(angleTo({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(0);
  });

  it('should return PI/2 for point directly below', () => {
    expect(angleTo({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
  });

  it('should return PI for point directly to the left', () => {
    expect(angleTo({ x: 0, y: 0 }, { x: -1, y: 0 })).toBeCloseTo(Math.PI);
  });

  it('should return -PI/2 for point directly above', () => {
    expect(angleTo({ x: 0, y: 0 }, { x: 0, y: -1 })).toBeCloseTo(-Math.PI / 2);
  });

  it('should handle non-origin points', () => {
    expect(angleTo({ x: 5, y: 5 }, { x: 6, y: 5 })).toBe(0);
  });
});

describe('randInt', () => {
  it('should return values within range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randInt(0, 10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('should return min when range is 1', () => {
    expect(randInt(5, 6)).toBe(5);
  });

  it('should handle negative ranges', () => {
    for (let i = 0; i < 50; i++) {
      const val = randInt(-10, -5);
      expect(val).toBeGreaterThanOrEqual(-10);
      expect(val).toBeLessThan(-5);
    }
  });
});

describe('randFloat', () => {
  it('should return values within range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randFloat(0, 10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(10);
    }
  });

  it('should handle negative ranges', () => {
    for (let i = 0; i < 50; i++) {
      const val = randFloat(-10, -5);
      expect(val).toBeGreaterThanOrEqual(-10);
      expect(val).toBeLessThan(-5);
    }
  });
});

describe('lerp', () => {
  it('should return a when t=0', () => {
    expect(lerp(0, 10, 0)).toBe(0);
  });

  it('should return b when t=1', () => {
    expect(lerp(0, 10, 1)).toBe(10);
  });

  it('should return midpoint when t=0.5', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('should handle negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });

  it('should extrapolate when t > 1', () => {
    expect(lerp(0, 10, 2)).toBe(20);
  });

  it('should extrapolate when t < 0', () => {
    expect(lerp(0, 10, -1)).toBe(-10);
  });
});

describe('normalizeAngle', () => {
  it('should return 0 for 0', () => {
    expect(normalizeAngle(0)).toBe(0);
  });

  it('should normalize 2*PI to approximately 0', () => {
    expect(normalizeAngle(2 * Math.PI)).toBeCloseTo(0, 10);
  });

  it('should normalize -2*PI to approximately 0', () => {
    expect(normalizeAngle(-2 * Math.PI)).toBeCloseTo(0, 10);
  });

  it('should normalize 3*PI to approximately PI', () => {
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 10);
  });

  it('should keep PI as PI', () => {
    expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI, 10);
  });

  it('should keep -PI as -PI', () => {
    expect(normalizeAngle(-Math.PI)).toBeCloseTo(-Math.PI, 10);
  });

  it('should normalize large positive angles', () => {
    const result = normalizeAngle(10 * Math.PI + 0.5);
    expect(result).toBeGreaterThanOrEqual(-Math.PI);
    expect(result).toBeLessThanOrEqual(Math.PI);
  });

  it('should normalize large negative angles', () => {
    const result = normalizeAngle(-10 * Math.PI - 0.5);
    expect(result).toBeGreaterThanOrEqual(-Math.PI);
    expect(result).toBeLessThanOrEqual(Math.PI);
  });
});

describe('circleCollide', () => {
  it('should detect collision when circles overlap', () => {
    expect(circleCollide({ x: 0, y: 0, radius: 10 }, { x: 15, y: 0, radius: 10 })).toBe(true);
  });

  it('should detect no collision when circles are apart', () => {
    expect(circleCollide({ x: 0, y: 0, radius: 10 }, { x: 25, y: 0, radius: 10 })).toBe(false);
  });

  it('should detect collision at exact touching point', () => {
    // dist = 20, radii sum = 20, d < sum is false
    expect(circleCollide({ x: 0, y: 0, radius: 10 }, { x: 20, y: 0, radius: 10 })).toBe(false);
  });

  it('should use default radius of 16 when not specified', () => {
    expect(circleCollide({ x: 0, y: 0 }, { x: 30, y: 0 })).toBe(true); // 30 < 16+16=32
    expect(circleCollide({ x: 0, y: 0 }, { x: 33, y: 0 })).toBe(false); // 33 >= 32
  });

  it('should detect collision on diagonal', () => {
    // dist(0,0 to 7,7) ≈ 9.9, radii sum = 20 => collide
    expect(circleCollide({ x: 0, y: 0, radius: 10 }, { x: 7, y: 7, radius: 10 })).toBe(true);
  });

  it('should handle same-position circles', () => {
    expect(circleCollide({ x: 5, y: 5, radius: 10 }, { x: 5, y: 5, radius: 10 })).toBe(true);
  });
});

describe('hsl', () => {
  it('should create HSL string without alpha', () => {
    expect(hsl(120, 50, 60)).toBe('hsl(120,50%,60%)');
  });

  it('should create HSLA string with alpha', () => {
    expect(hsl(120, 50, 60, 0.5)).toBe('hsla(120,50%,60%,0.5)');
  });

  it('should handle edge values', () => {
    expect(hsl(0, 0, 0)).toBe('hsl(0,0%,0%)');
    expect(hsl(360, 100, 100)).toBe('hsl(360,100%,100%)');
  });
});

describe('rgba', () => {
  it('should create RGBA string', () => {
    expect(rgba(255, 128, 0, 0.5)).toBe('rgba(255,128,0,0.5)');
  });

  it('should handle zero values', () => {
    expect(rgba(0, 0, 0, 0)).toBe('rgba(0,0,0,0)');
  });

  it('should handle full values', () => {
    expect(rgba(255, 255, 255, 1)).toBe('rgba(255,255,255,1)');
  });
});

describe('spawnOutsideView', () => {
  const camera = { x: 0, y: 0 };
  const canvas = { width: 800, height: 600 };

  it('should spawn outside the camera view', () => {
    for (let i = 0; i < 50; i++) {
      const pos = spawnOutsideView(camera, canvas);
      // At least one coordinate should be beyond half canvas + margin
      const isOutsideX = Math.abs(pos.x - camera.x) >= canvas.width / 2;
      const isOutsideY = Math.abs(pos.y - camera.y) >= canvas.height / 2;
      expect(isOutsideX || isOutsideY).toBe(true);
    }
  });

  it('should respect custom margin', () => {
    for (let i = 0; i < 50; i++) {
      const pos = spawnOutsideView(camera, canvas, 200);
      const isOutsideX = Math.abs(pos.x - camera.x) >= canvas.width / 2;
      const isOutsideY = Math.abs(pos.y - camera.y) >= canvas.height / 2;
      expect(isOutsideX || isOutsideY).toBe(true);
    }
  });

  it('should handle non-zero camera position', () => {
    const offsetCamera = { x: 500, y: 300 };
    for (let i = 0; i < 50; i++) {
      const pos = spawnOutsideView(offsetCamera, canvas);
      const isOutsideX = Math.abs(pos.x - offsetCamera.x) >= canvas.width / 2;
      const isOutsideY = Math.abs(pos.y - offsetCamera.y) >= canvas.height / 2;
      expect(isOutsideX || isOutsideY).toBe(true);
    }
  });
});

describe('formatTime', () => {
  it('should format 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format 65 seconds as 01:05', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('should format 3600 seconds as 60:00', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('should handle fractional seconds', () => {
    expect(formatTime(90.7)).toBe('01:30');
  });

  it('should format single-digit minutes with leading zero', () => {
    expect(formatTime(540)).toBe('09:00');
  });

  it('should format single-digit seconds with leading zero', () => {
    expect(formatTime(9)).toBe('00:09');
  });

  it('should handle large times', () => {
    expect(formatTime(5999)).toBe('99:59');
  });
});

describe('shuffle', () => {
  it('should maintain array length', () => {
    const arr = [1, 2, 3, 4, 5];
    shuffle(arr);
    expect(arr).toHaveLength(5);
  });

  it('should contain all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    shuffle(arr);
    expect(arr.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle empty array', () => {
    const arr: number[] = [];
    shuffle(arr);
    expect(arr).toEqual([]);
  });

  it('should handle single-element array', () => {
    const arr = [42];
    shuffle(arr);
    expect(arr).toEqual([42]);
  });

  it('should return the same array reference (mutate in place)', () => {
    const arr = [1, 2, 3];
    const result = shuffle(arr);
    expect(result).toBe(arr);
  });
});
