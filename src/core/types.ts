/** Shared type definitions used across the game. */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle extends Point {
  radius: number;
}

export type Camera = Point;

export interface CanvasSize {
  width: number;
  height: number;
}

export interface Enemy extends Point {
  type: string;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  xp: number;
  color: string;
  hitTimer: number;
  attackCooldown: number;
}

export interface Player extends Point {
  vx: number;
  vy: number;
  speed: number;
  radius: number;
  hp: number;
  maxHp: number;
  xp: number;
  xpToLevel: number;
  level: number;
  invTimer: number;
  invDuration: number;
  armor: number;
  regen: number;
  magnetRange: number;
  speedMult: number;
}

export interface Projectile extends Point {
  vx: number;
  vy: number;
  angle: number;
  damage: number;
  radius: number;
  type: string;
  life: number;
  piercing: number;
  hitEnemies: Enemy[];
  followPlayer?: boolean;
  tickRate?: number;
  tickTimer?: number;
}

export interface Gem extends Point {
  xp: number;
  size: number;
  color: string;
}

export interface DamageNumber extends Point {
  text: string;
  color: string;
  size: number;
  age: number;
  lifetime: number;
}

export interface Particle extends Point {
  vx: number;
  vy: number;
  color: string;
  radius: number;
  life: number;
}

export interface WeaponState {
  id: string;
  def: import('../config/definitions.js').WeaponDef;
  cooldown: number;
  level: number;
  getDamage(): number;
  getCooldown(): number;
  getCount(): number;
}

export interface UpgradeOption {
  name: string;
  desc: string;
  apply: (player: Player, weapons: WeaponState[]) => void;
  isWeapon: boolean;
  weaponId?: string;
}

export interface InputDirection {
  x: number;
  y: number;
}
