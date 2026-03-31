/** Enemy type definitions */
export interface EnemyTypeDef {
  name: string;
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  xp: number;
  color: string;
  /** Minimum elapsed seconds before this type spawns */
  minTime: number;
}

export const ENEMY_TYPES: Record<string, EnemyTypeDef> = {
  skeleton: {
    name: 'Skeleton',
    hp: 8,
    speed: 55,
    damage: 5,
    radius: 12,
    xp: 1,
    color: '#d4c5a9',
    minTime: 0,
  },
  zombie: {
    name: 'Zombie',
    hp: 20,
    speed: 30,
    damage: 8,
    radius: 14,
    xp: 2,
    color: '#3d6b3d',
    minTime: 0,
  },
  bat: {
    name: 'Bat',
    hp: 5,
    speed: 100,
    damage: 3,
    radius: 10,
    xp: 1,
    color: '#3a2255',
    minTime: 15,
  },
  ghost: {
    name: 'Ghost',
    hp: 12,
    speed: 50,
    damage: 6,
    radius: 13,
    xp: 2,
    color: '#aaaaee',
    minTime: 30,
  },
  spider: {
    name: 'Spider',
    hp: 10,
    speed: 80,
    damage: 4,
    radius: 11,
    xp: 2,
    color: '#4a3520',
    minTime: 45,
  },
  werewolf: {
    name: 'Werewolf',
    hp: 40,
    speed: 70,
    damage: 12,
    radius: 17,
    xp: 5,
    color: '#5a4a3a',
    minTime: 60,
  },
  warlock: {
    name: 'Warlock',
    hp: 25,
    speed: 40,
    damage: 10,
    radius: 14,
    xp: 4,
    color: '#1a0a30',
    minTime: 90,
  },
  vampire: {
    name: 'Vampire',
    hp: 50,
    speed: 60,
    damage: 14,
    radius: 15,
    xp: 6,
    color: '#660000',
    minTime: 120,
  },
  drake: {
    name: 'Drake',
    hp: 70,
    speed: 55,
    damage: 18,
    radius: 18,
    xp: 8,
    color: '#3a6a3a',
    minTime: 150,
  },
  demon: {
    name: 'Demon Lord',
    hp: 200,
    speed: 45,
    damage: 25,
    radius: 26,
    xp: 30,
    color: '#4a0000',
    minTime: 180,
  },
};

/** Weapon definitions */
export interface WeaponDef {
  name: string;
  desc: string;
  baseCooldown: number;
  baseDamage: number;
  baseCount: number;
  speed: number;
  range: number;
  radius: number;
  type: string;
  duration?: number;
}

export const WEAPON_DEFS: Record<string, WeaponDef> = {
  knife: {
    name: '飛刀 Throwing Knife',
    desc: '向最近敵人投擲飛刀',
    baseCooldown: 0.8,
    baseDamage: 8,
    baseCount: 1,
    speed: 350,
    range: 300,
    radius: 5,
    type: 'knife',
  },
  fireball: {
    name: '火球 Fireball',
    desc: '發射火球，造成範圍傷害',
    baseCooldown: 1.5,
    baseDamage: 15,
    baseCount: 1,
    speed: 250,
    range: 400,
    radius: 8,
    type: 'fireball',
  },
  holywater: {
    name: '聖水 Holy Water',
    desc: '在地上留下聖水區域',
    baseCooldown: 3.0,
    baseDamage: 5,
    baseCount: 1,
    speed: 0,
    range: 0,
    radius: 40,
    duration: 2.5,
    type: 'holywater',
  },
  whip: {
    name: '聖鞭 Holy Whip',
    desc: '揮動聖鞭攻擊前方敵人',
    baseCooldown: 1.2,
    baseDamage: 12,
    baseCount: 1,
    speed: 0,
    range: 70,
    radius: 60,
    duration: 0.2,
    type: 'whip',
  },
};
