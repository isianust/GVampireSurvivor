import { describe, it, expect, beforeEach } from 'vitest';
import { loadGame, makeElementStub, type Sandbox } from './harness';

/** Build the HUD/overlay elements Game's update()/overlays expect. */
function hudElements(): Record<string, Sandbox> {
  const ids = [
    'hp-bar',
    'hp-text',
    'xp-bar',
    'xp-text',
    'level-display',
    'time-display',
    'kill-display',
    'ult-bar',
    'ult-bar-container',
    'skill-bar',
    'levelup-overlay',
    'upgrade-options',
    'gameover-overlay',
    'final-stats',
  ];
  const map: Record<string, Sandbox> = {};
  for (const id of ids) map[id] = makeElementStub();
  return map;
}

function freshGame(): { s: Sandbox; Game: Sandbox } {
  const s = loadGame({ elements: hudElements() });
  return { s, Game: s.Game };
}

const meta = loadGame();

describe('js/game schedule tables', () => {
  it('BOSS_SCHEDULE has 4 fixed bosses', () => expect(meta.BOSS_SCHEDULE).toHaveLength(4));
  it('BOSS_SCHEDULE entries have ascending times', () => {
    for (let i = 1; i < meta.BOSS_SCHEDULE.length; i++) {
      expect(meta.BOSS_SCHEDULE[i].t).toBeGreaterThan(meta.BOSS_SCHEDULE[i - 1].t);
    }
  });
  for (const entry of meta.BOSS_SCHEDULE) {
    it(`boss-schedule type ${entry.type}@${entry.t}s exists in ENEMY_TYPES`, () =>
      expect(meta.ENEMY_TYPES[entry.type]).toBeTruthy());
  }
  it('BOSS_KILL_SCHEDULE has 4 kill tiers', () => expect(meta.BOSS_KILL_SCHEDULE).toHaveLength(4));
  it('kill tiers ascend and HP multipliers escalate', () => {
    for (let i = 1; i < meta.BOSS_KILL_SCHEDULE.length; i++) {
      expect(meta.BOSS_KILL_SCHEDULE[i].kills).toBeGreaterThan(
        meta.BOSS_KILL_SCHEDULE[i - 1].kills,
      );
      expect(meta.BOSS_KILL_SCHEDULE[i].hpMult).toBeGreaterThan(
        meta.BOSS_KILL_SCHEDULE[i - 1].hpMult,
      );
    }
  });
  for (const tier of meta.BOSS_KILL_SCHEDULE) {
    it(`kill tier ${tier.kills} type ${tier.type} exists`, () =>
      expect(meta.ENEMY_TYPES[tier.type]).toBeTruthy());
  }
  it('BOSS_INTERVAL = 150', () => expect(meta.BOSS_INTERVAL).toBe(150));
  it('BOSS_KILL_INTERVAL = 300', () => expect(meta.BOSS_KILL_INTERVAL).toBe(300));
  for (const t of meta.BOSS_ROTATION) {
    it(`rotation type ${t} exists`, () => expect(meta.ENEMY_TYPES[t]).toBeTruthy());
  }
});

describe('js/game init', () => {
  let Game: Sandbox;
  beforeEach(() => {
    Game = freshGame().Game;
  });
  it('starts in playing state', () => {
    Game.init();
    expect(Game.state).toBe('playing');
  });
  it('creates a player', () => {
    Game.init();
    expect(Game.player).toBeTruthy();
    expect(Game.player.hp).toBeGreaterThan(0);
  });
  it('uses the character start weapon', () => {
    const { s } = freshGame();
    s.Game.init(s.getCharacter('sword'));
    expect(s.Game.weapons[0].id).toBe('swordqi');
  });
  it('spawns the opening burst of 16 enemies', () => {
    Game.init();
    expect(Game.enemies.length).toBe(16);
  });
  it('resets counters', () => {
    Game.init();
    expect(Game.kills).toBe(0);
    expect(Game.elapsed).toBe(0);
    expect(Game.nextBossIndex).toBe(0);
    expect(Game.nextKillBossIndex).toBe(0);
  });
  it('clears projectiles/gems/particles', () => {
    Game.init();
    expect(Game.projectiles).toHaveLength(0);
    expect(Game.gems).toHaveLength(0);
    expect(Game.particles).toHaveLength(0);
  });
});

describe('js/game spawnBoss', () => {
  let Game: Sandbox;
  beforeEach(() => {
    Game = freshGame().Game;
    Game.init();
    Game.enemies = [];
  });
  it('flags isBoss and scales HP by 3*hpMult', () => {
    Game.spawnBoss('demon', 2);
    const boss = Game.enemies[Game.enemies.length - 1];
    expect(boss.isBoss).toBe(true);
    const base = meta.ENEMY_TYPES.demon.hp;
    expect(boss.maxHp).toBeCloseTo(base * 3 * 2);
  });
  it('enlarges radius by 1.4x', () => {
    Game.spawnBoss('demon', 1);
    const boss = Game.enemies[Game.enemies.length - 1];
    expect(boss.radius).toBeCloseTo(meta.ENEMY_TYPES.demon.radius * 1.4);
  });
  it('attaches a data-driven ability for demon', () => {
    Game.spawnBoss('demon', 1);
    const boss = Game.enemies[Game.enemies.length - 1];
    expect(boss.ability.name).toBe(meta.BOSS_ABILITIES.demon.name);
    expect(boss.enraged).toBe(false);
  });
  it('stores a label when provided', () => {
    Game.spawnBoss('lich', 1, '中BOSS');
    const boss = Game.enemies[Game.enemies.length - 1];
    expect(boss.bossLabel).toBe('中BOSS');
  });
  it('defaults to demon when no type given', () => {
    Game.spawnBoss();
    const boss = Game.enemies[Game.enemies.length - 1];
    expect(boss.type).toBe('demon');
  });
});

describe('js/game areaDamage', () => {
  let Game: Sandbox;
  beforeEach(() => {
    Game = freshGame().Game;
    Game.init();
    Game.enemies = [];
  });
  it('damages enemies within radius', () => {
    Game.enemies = [meta.createEnemy('skeleton', 50, 0, 0)];
    Game.areaDamage(0, 0, 100, 5, true);
    // skeleton has 8 hp; 5 damage leaves it alive at 3
    expect(Game.enemies[0].hp).toBe(3);
  });
  it('kills enemies and increments kills', () => {
    Game.enemies = [meta.createEnemy('skeleton', 10, 0, 0)];
    Game.areaDamage(0, 0, 100, 999, true);
    expect(Game.enemies).toHaveLength(0);
    expect(Game.kills).toBe(1);
  });
  it('ignores enemies outside radius', () => {
    Game.enemies = [meta.createEnemy('skeleton', 1000, 0, 0)];
    Game.areaDamage(0, 0, 100, 999, true);
    expect(Game.enemies).toHaveLength(1);
  });
  it('skips bosses when includeBoss is false', () => {
    const boss = meta.createEnemy('demon', 10, 0, 0);
    boss.isBoss = true;
    Game.enemies = [boss];
    Game.areaDamage(0, 0, 100, 999, false);
    expect(Game.enemies).toHaveLength(1);
  });
});

describe('js/game slowArea', () => {
  let Game: Sandbox;
  beforeEach(() => {
    Game = freshGame().Game;
    Game.init();
    Game.enemies = [];
  });
  it('sets slowTimer on enemies within radius', () => {
    Game.enemies = [meta.createEnemy('zombie', 30, 0, 0)];
    Game.slowArea(0, 0, 100, 2.5);
    expect(Game.enemies[0].slowTimer).toBe(2.5);
  });
  it('does not slow enemies outside radius', () => {
    Game.enemies = [meta.createEnemy('zombie', 9999, 0, 0)];
    Game.slowArea(0, 0, 100, 2.5);
    expect(Game.enemies[0].slowTimer).toBe(0);
  });
});

describe('js/game killEnemy rewards', () => {
  let Game: Sandbox;
  beforeEach(() => {
    Game = freshGame().Game;
    Game.init();
    Game.enemies = [];
    Game.gems = [];
  });
  it('increments kills, drops a gem, and removes the enemy', () => {
    Game.enemies = [meta.createEnemy('skeleton', 5, 5, 0)];
    Game.killEnemy(0);
    expect(Game.kills).toBe(1);
    expect(Game.gems).toHaveLength(1);
    expect(Game.enemies).toHaveLength(0);
  });
  it('adds +3 ult charge for normal kill', () => {
    Game.player.ultCharge = 0;
    Game.enemies = [meta.createEnemy('skeleton', 0, 0, 0)];
    Game.killEnemy(0);
    expect(Game.player.ultCharge).toBe(3);
  });
  it('adds +25 ult charge for a boss kill', () => {
    Game.player.ultCharge = 0;
    const boss = meta.createEnemy('demon', 0, 0, 0);
    boss.isBoss = true;
    Game.enemies = [boss];
    Game.killEnemy(0);
    expect(Game.player.ultCharge).toBe(25);
  });
  it('caps ult charge at ultMax', () => {
    Game.player.ultCharge = Game.player.ultMax - 1;
    Game.enemies = [meta.createEnemy('skeleton', 0, 0, 0)];
    Game.killEnemy(0);
    expect(Game.player.ultCharge).toBe(Game.player.ultMax);
  });
  it('applies lifestealOnKill healing', () => {
    Game.player.lifestealOnKill = 5;
    Game.player.hp = 50;
    Game.player.maxHp = 100;
    Game.enemies = [meta.createEnemy('skeleton', 0, 0, 0)];
    Game.killEnemy(0);
    expect(Game.player.hp).toBe(55);
  });
  it('gem color tiers by xp', () => {
    const high = meta.createEnemy('demon', 0, 0, 0); // xp 30 -> gold
    Game.enemies = [high];
    Game.killEnemy(0);
    expect(Game.gems[0].color).toBe('#ffcc00');
  });
});

describe('js/game hitEnemy', () => {
  let Game: Sandbox;
  beforeEach(() => {
    Game = freshGame().Game;
    Game.init();
    Game.enemies = [];
  });
  it('non-lethal hit reduces hp and returns false', () => {
    Game.enemies = [meta.createEnemy('demon', 0, 0, 0)];
    const killed = Game.hitEnemy(0, 5);
    expect(killed).toBe(false);
    expect(Game.enemies[0].hp).toBeLessThan(Game.enemies[0].maxHp);
  });
  it('lethal hit returns true and removes enemy', () => {
    Game.enemies = [meta.createEnemy('skeleton', 0, 0, 0)];
    const killed = Game.hitEnemy(0, 999);
    expect(killed).toBe(true);
    expect(Game.enemies).toHaveLength(0);
  });
});

describe('js/game boss schedules', () => {
  let Game: Sandbox;
  beforeEach(() => {
    Game = freshGame().Game;
    Game.init();
    Game.enemies = [];
  });
  it('spawns the first scheduled boss at its time', () => {
    Game.elapsed = meta.BOSS_SCHEDULE[0].t;
    Game.updateBossSchedule();
    expect(Game.enemies.some((e: { isBoss: boolean }) => e.isBoss)).toBe(true);
    expect(Game.nextBossIndex).toBe(1);
  });
  it('does not spawn before the scheduled time', () => {
    Game.elapsed = meta.BOSS_SCHEDULE[0].t - 1;
    Game.updateBossSchedule();
    expect(Game.enemies.some((e: { isBoss: boolean }) => e.isBoss)).toBe(false);
  });
  it('spawns a kill-tier boss at the threshold', () => {
    Game.kills = meta.BOSS_KILL_SCHEDULE[0].kills;
    Game.updateKillBossSchedule();
    expect(Game.enemies.some((e: { isBoss: boolean }) => e.isBoss)).toBe(true);
    expect(Game.nextKillBossIndex).toBe(1);
  });
  it('does not spawn a kill boss below threshold', () => {
    Game.kills = meta.BOSS_KILL_SCHEDULE[0].kills - 1;
    Game.updateKillBossSchedule();
    expect(Game.enemies.some((e: { isBoss: boolean }) => e.isBoss)).toBe(false);
  });
});

describe('js/game updateBossAbility', () => {
  let Game: Sandbox;
  beforeEach(() => {
    Game = freshGame().Game;
    Game.init();
    Game.enemies = [];
  });
  it('enrages once when HP drops below threshold', () => {
    const boss = meta.createEnemy('demon', 0, 0, 0);
    boss.isBoss = true;
    boss.ability = meta.BOSS_ABILITIES.demon;
    boss.enraged = false;
    boss.summonTimer = 999;
    boss.maxHp = 100;
    boss.hp = 100 * meta.BOSS_ABILITIES.demon.enrage.hpPct - 1;
    const baseSpeed = boss.speed;
    Game.enemies = [boss];
    Game.updateBossAbility(boss, 0.1);
    expect(boss.enraged).toBe(true);
    expect(boss.speed).toBeGreaterThan(baseSpeed);
  });
  it('does not re-enrage twice', () => {
    const boss = meta.createEnemy('demon', 0, 0, 0);
    boss.isBoss = true;
    boss.ability = meta.BOSS_ABILITIES.demon;
    boss.enraged = false;
    boss.summonTimer = 999;
    boss.maxHp = 100;
    boss.hp = 1;
    Game.enemies = [boss];
    Game.updateBossAbility(boss, 0.1);
    const speedAfterFirst = boss.speed;
    Game.updateBossAbility(boss, 0.1);
    expect(boss.speed).toBe(speedAfterFirst);
  });
  it('summons minions when timer elapses', () => {
    const boss = meta.createEnemy('demon', 0, 0, 0);
    boss.isBoss = true;
    boss.ability = meta.BOSS_ABILITIES.demon;
    boss.enraged = false;
    boss.maxHp = 1000;
    boss.hp = 1000;
    boss.summonTimer = 0;
    Game.enemies = [boss];
    Game.updateBossAbility(boss, 0.1);
    expect(Game.enemies.length).toBeGreaterThan(1);
  });
});

describe('js/game dashPlayer', () => {
  let Game: Sandbox;
  beforeEach(() => {
    Game = freshGame().Game;
    Game.init();
  });
  it('moves the player along lastDir and sets timers', () => {
    Game.player.x = 0;
    Game.player.y = 0;
    Game.lastDir = { x: 1, y: 0 };
    Game.dashPlayer(120, 0.4);
    expect(Game.player.x).toBeCloseTo(120);
    expect(Game.player.dashTimer).toBeGreaterThan(0);
    expect(Game.player.invTimer).toBeGreaterThanOrEqual(0.4);
  });
});

describe('js/game updateEnemies', () => {
  let Game: Sandbox;
  beforeEach(() => {
    Game = freshGame().Game;
    Game.init();
    Game.enemies = [];
  });
  it('moves an enemy toward the player', () => {
    Game.player.x = 0;
    Game.player.y = 0;
    const e = meta.createEnemy('skeleton', 100, 0, 0);
    Game.enemies = [e];
    Game.updateEnemies(0.1);
    expect(e.x).toBeLessThan(100);
  });
  it('removes far-away non-boss enemies', () => {
    Game.player.x = 0;
    Game.player.y = 0;
    Game.enemies = [meta.createEnemy('skeleton', 5000, 0, 0)];
    Game.updateEnemies(0.1);
    expect(Game.enemies).toHaveLength(0);
  });
  it('keeps far-away bosses on the field', () => {
    const boss = meta.createEnemy('demon', 5000, 0, 0);
    boss.isBoss = true;
    Game.enemies = [boss];
    Game.updateEnemies(0.1);
    expect(Game.enemies).toHaveLength(1);
  });
  it('damages the player on contact', () => {
    Game.player.x = 0;
    Game.player.y = 0;
    Game.player.invTimer = 0;
    const start = Game.player.hp;
    const e = meta.createEnemy('zombie', 0, 0, 0);
    Game.enemies = [e];
    Game.updateEnemies(0.1);
    expect(Game.player.hp).toBeLessThan(start);
  });
});

describe('js/game updateGems', () => {
  let Game: Sandbox;
  beforeEach(() => {
    Game = freshGame().Game;
    Game.init();
    Game.enemies = [];
    Game.gems = [];
  });
  it('picks up a gem on the player and grants XP', () => {
    Game.player.x = 0;
    Game.player.y = 0;
    Game.player.xp = 0;
    Game.gems = [{ x: 5, y: 0, xp: 5, size: 6, color: '#fff' }];
    Game.updateGems(0.001);
    expect(Game.gems).toHaveLength(0);
    expect(Game.player.xp).toBe(5);
  });
  it('triggers level-up overlay when XP threshold reached', () => {
    Game.player.x = 0;
    Game.player.y = 0;
    Game.player.xp = 0;
    Game.player.xpToLevel = 4;
    Game.gems = [{ x: 5, y: 0, xp: 5, size: 6, color: '#fff' }];
    Game.updateGems(0.001);
    expect(Game.state).toBe('levelup');
  });
});

describe('js/game update full frame smoke', () => {
  it('advances elapsed and stays playing with controlled dt', () => {
    const { s, Game } = freshGame();
    Game.init();
    s.__now = 16; // 16 ms after init (init set lastTime = 0)
    Game.update({ x: 1, y: 0 });
    expect(Game.elapsed).toBeGreaterThan(0);
    expect(Game.state).toBe('playing');
  });
  it('transitions to gameover when player HP hits 0', () => {
    const { s, Game } = freshGame();
    Game.init();
    Game.player.hp = 0;
    s.__now = 16;
    Game.update({ x: 0, y: 0 });
    expect(Game.state).toBe('gameover');
  });
});
