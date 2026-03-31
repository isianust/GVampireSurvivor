/** Utility functions — pure, side-effect free. */

import type { Point, Camera, CanvasSize } from '../core/types.js';

/** Clamp value between min and max. */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Euclidean distance between two points. */
export function dist(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Angle from point a to point b (radians). */
export function angleTo(a: Point, b: Point): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/** Random integer in [min, max). */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

/** Random float in [min, max). */
export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Detect mobile / touch device. */
export function isMobileDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Normalize angle to [-PI, PI]. */
export function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/** Circle-to-circle collision check. */
export function circleCollide(
  a: Point & { radius?: number },
  b: Point & { radius?: number },
): boolean {
  const d = dist(a, b);
  return d < (a.radius ?? 16) + (b.radius ?? 16);
}

/** HSL colour string. */
export function hsl(h: number, s: number, l: number, a?: number): string {
  if (a !== undefined) return `hsla(${h},${s}%,${l}%,${a})`;
  return `hsl(${h},${s}%,${l}%)`;
}

/** RGBA colour string. */
export function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r},${g},${b},${a})`;
}

/** Generate a spawn position outside the camera view. */
export function spawnOutsideView(camera: Camera, canvas: CanvasSize, margin = 80): Point {
  const side = randInt(0, 4);
  let x: number, y: number;
  switch (side) {
    case 0: // top
      x = camera.x + randFloat(-canvas.width / 2 - margin, canvas.width / 2 + margin);
      y = camera.y - canvas.height / 2 - margin;
      break;
    case 1: // right
      x = camera.x + canvas.width / 2 + margin;
      y = camera.y + randFloat(-canvas.height / 2 - margin, canvas.height / 2 + margin);
      break;
    case 2: // bottom
      x = camera.x + randFloat(-canvas.width / 2 - margin, canvas.width / 2 + margin);
      y = camera.y + canvas.height / 2 + margin;
      break;
    default: // left
      x = camera.x - canvas.width / 2 - margin;
      y = camera.y + randFloat(-canvas.height / 2 - margin, canvas.height / 2 + margin);
      break;
  }
  return { x, y };
}

/** Format seconds to MM:SS string. */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

/** Fisher-Yates shuffle (mutates array). */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
