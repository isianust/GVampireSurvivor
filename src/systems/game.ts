/**
 * Core game state and update loop.
 *
 * === Event-Driven Architecture (Event Flow) ===
 *
 * 1. Enemy killed (projectile collision):
 *    → eventBus.emit('enemyDied', { x, y, xp, color, enemyType })
 *    → listener spawns gem + particles (decoupled from collision code)
 *
 * 2. Player picks up XP gem:
 *    → eventBus.emit('xpGained', { amount, totalXp, xpToLevel, level })
 *    → HUD listener updates XP bar display
 *
 * 3. Player levels up:
 *    → eventBus.emit('playerLevelUp', { newLevel, xpToLevel })
 *    → listener shows level-up overlay
 *
 * 4. Player takes damage:
 *    → eventBus.emit('playerDamaged', { damage, currentHp, maxHp })
 *    → HUD listener updates HP bar display
 *
 * 5. Cheat key [E]:
 *    → Directly emits 'xpGained' event to verify UI independently
 */

import { CONFIG } from '../config/index.js';
import type {
  Player,
  Enemy,
  Projectile,
  Gem,
  DamageNumber,
  Particle,
  WeaponState,
  Camera,
  InputDirection,
} from '../core/types.js';
import { createPlayer, updatePlayer, canPickupGem, addXP, damagePlayer } from '../entities/player.js';
import { createEnemy, pickEnemyType } from '../entities/enemies.js';
import {
  createWeaponState,
  fireWeapons,
  updateProjectile,
  checkProjectileHit,
  generateUpgradeOptions,
} from '../entities/weapons.js';
import { angleTo, clamp, dist, formatTime, randFloat, spawnOutsideView } from './utils.js';
import { Renderer } from '../rendering/renderer.js';
import { eventBus } from '../core/EventBus.js';

export const Game = {
  state: 'menu' as string,
  player: null as Player | null,
  enemies: [] as Enemy[],
  projectiles: [] as Projectile[],
  gems: [] as Gem[],
  damageNumbers: [] as DamageNumber[],
  particles: [] as Particle[],
  weapons: [] as WeaponState[],
  camera: { x: 0, y: 0 } as Camera,
  elapsed: 0,
  kills: 0,
  spawnTimer: 0,
  spawnInterval: CONFIG.spawn.baseInterval as number,
  maxEnemies: CONFIG.spawn.maxEnemies,
  lastTime: 0,

  /** Whether event listeners have been registered (only once). */
  _eventsRegistered: false,

  init(): void {
    this.player = createPlayer();
    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.damageNumbers = [];
    this.particles = [];
    this.weapons = [createWeaponState('knife')];
    this.camera = { x: 0, y: 0 };
    this.elapsed = 0;
    this.kills = 0;
    this.spawnTimer = 0;
    this.spawnInterval = CONFIG.spawn.baseInterval;
    this.state = 'playing';
    this.lastTime = performance.now();

    this._registerEvents();
  },

  /**
   * Register EventBus listeners and cheat key (once).
   * Event flow:
   *   enemyDied   → spawn gem + death particles
   *   xpGained    → update XP bar in HUD
   *   playerLevelUp → show level-up overlay
   *   playerDamaged → update HP bar in HUD
   */
  _registerEvents(): void {
    if (this._eventsRegistered) return;
    this._eventsRegistered = true;

    // --- enemyDied: spawn gem + particles (decoupled from collision) ---
    eventBus.on('enemyDied', (...args: unknown[]) => {
      const data = args[0] as { x: number; y: number; xp: number; color: string; enemyType: string };
      console.log(
        `[Event:enemyDied] type=${data.enemyType} xp=${data.xp} pos=(${data.x.toFixed(1)},${data.y.toFixed(1)})`,
      );
      const { gem: gemCfg } = CONFIG;
      this.gems.push({
        x: data.x,
        y: data.y,
        xp: data.xp,
        size: gemCfg.baseSize + data.xp,
        color:
          data.xp >= gemCfg.highXpThreshold
            ? gemCfg.highXpColor
            : data.xp >= gemCfg.midXpThreshold
              ? gemCfg.midXpColor
              : gemCfg.lowXpColor,
      });
      this.addParticles(data.x, data.y, data.color, CONFIG.effects.deathParticleCount);
    });

    // --- xpGained: update XP bar UI ---
    eventBus.on('xpGained', (...args: unknown[]) => {
      const data = args[0] as { amount: number; totalXp: number; xpToLevel: number; level: number };
      console.log(
        `[Event:xpGained] +${data.amount} XP → total=${data.totalXp}/${data.xpToLevel} (Lv.${data.level})`,
      );
      const xpBar = document.getElementById('xp-bar');
      const xpText = document.getElementById('xp-text');
      if (xpBar) xpBar.style.width = clamp((data.totalXp / data.xpToLevel) * 100, 0, 100) + '%';
      if (xpText) xpText.textContent = 'XP: ' + data.totalXp + ' / ' + data.xpToLevel;
      console.log(`[UI:xpBar] width=${xpBar?.style.width} text=${xpText?.textContent}`);
    });

    // --- playerLevelUp: show level-up overlay ---
    eventBus.on('playerLevelUp', (...args: unknown[]) => {
      const data = args[0] as { newLevel: number; xpToLevel: number };
      console.log(`[Event:playerLevelUp] Lv.${data.newLevel} nextXP=${data.xpToLevel}`);
      const levelDisp = document.getElementById('level-display');
      if (levelDisp) levelDisp.textContent = 'Lv.' + data.newLevel;
      this.showLevelUp();
    });

    // --- playerDamaged: update HP bar UI ---
    eventBus.on('playerDamaged', (...args: unknown[]) => {
      const data = args[0] as { damage: number; currentHp: number; maxHp: number };
      console.log(`[Event:playerDamaged] -${data.damage} HP → ${Math.ceil(data.currentHp)}/${data.maxHp}`);
      const hpBar = document.getElementById('hp-bar');
      const hpText = document.getElementById('hp-text');
      if (hpBar) hpBar.style.width = clamp((data.currentHp / data.maxHp) * 100, 0, 100) + '%';
      if (hpText) hpText.textContent = 'HP: ' + Math.ceil(data.currentHp) + ' / ' + data.maxHp;
      console.log(`[UI:hpBar] width=${hpBar?.style.width} text=${hpText?.textContent}`);
    });

    // --- Cheat key [E]: simulate gaining 5 XP for independent UI testing ---
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'e') return;
      if (this.state !== 'playing' || !this.player) return;

      const cheatXp = 5;
      console.log(`[Cheat:E] Simulating +${cheatXp} XP gain`);
      const leveled = addXP(this.player, cheatXp);

      eventBus.emit('xpGained', {
        amount: cheatXp,
        totalXp: this.player.xp,
        xpToLevel: this.player.xpToLevel,
        level: this.player.level,
      });

      if (leveled) {
        eventBus.emit('playerLevelUp', {
          newLevel: this.player.level,
          xpToLevel: this.player.xpToLevel,
        });
      }
    });
  },

  update(inputDir: InputDirection): void {
    if (this.state !== 'playing' || !this.player) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, CONFIG.physics.maxDt);
    this.lastTime = now;
    this.elapsed += dt;

    updatePlayer(this.player, inputDir.x, inputDir.y, dt);

    this.camera.x = clamp(
      this.camera.x + (this.player.x - this.camera.x) * CONFIG.camera.followLerp,
      this.player.x - 1000,
      this.player.x + 1000,
    );
    this.camera.y = clamp(
      this.camera.y + (this.player.y - this.camera.y) * CONFIG.camera.followLerp,
      this.player.y - 1000,
      this.player.y + 1000,
    );

    // Spawn enemies
    this.spawnTimer -= dt;
    this.spawnInterval = Math.max(
      CONFIG.spawn.minInterval,
      CONFIG.spawn.baseInterval - this.elapsed * CONFIG.spawn.difficultyRate,
    );
    if (this.spawnTimer <= 0 && this.enemies.length < this.maxEnemies) {
      this.spawnTimer = this.spawnInterval;
      this.spawnEnemy();
    }

    // Boss spawn
    if (
      Math.floor(this.elapsed) === CONFIG.boss.spawnTime &&
      !this.enemies.some((e) => e.type === 'demon')
    ) {
      this.spawnBoss();
    }

    this.updateEnemies(dt);

    const newProjs = fireWeapons(this.weapons, this.player, this.enemies, dt);
    this.projectiles.push(...newProjs);

    this.updateProjectiles(dt);
    this.updateGems(dt);
    this.updateDamageNumbers(dt);
    this.updateParticles(dt);
    this.updateHUD();

    if (this.player.hp <= 0) {
      this.state = 'gameover';
      this.showGameOver();
    }
  },

  spawnEnemy(): void {
    if (!Renderer.canvas) return;
    const type = pickEnemyType(this.elapsed);
    const pos = spawnOutsideView(this.camera, Renderer.canvas);
    const enemy = createEnemy(type, pos.x, pos.y, this.elapsed);
    this.enemies.push(enemy);
  },

  spawnBoss(): void {
    if (!Renderer.canvas) return;
    const pos = spawnOutsideView(this.camera, Renderer.canvas, CONFIG.spawn.bossSpawnMargin);
    const boss = createEnemy('demon', pos.x, pos.y, this.elapsed);
    boss.hp *= CONFIG.boss.hpMultiplier;
    boss.maxHp *= CONFIG.boss.hpMultiplier;
    this.enemies.push(boss);
  },

  updateEnemies(dt: number): void {
    if (!this.player) return;
    const player = this.player;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const a = angleTo(e, player);
      e.x += Math.cos(a) * e.speed * dt;
      e.y += Math.sin(a) * e.speed * dt;

      if (e.hitTimer > 0) e.hitTimer -= dt;
      if (e.attackCooldown > 0) e.attackCooldown -= dt;

      if (e.attackCooldown <= 0) {
        const d = dist(e, player);
        if (d < e.radius + player.radius) {
          console.log(
            `[Collision] enemy=${e.type} hit player, dist=${d.toFixed(1)}, threshold=${(e.radius + player.radius).toFixed(1)}`,
          );
          if (damagePlayer(player, e.damage)) {
            const dmg = Math.max(CONFIG.combat.minDamage, e.damage - player.armor);
            this.addDamageNumber(player.x, player.y - 20, '-' + dmg, '#ff4444', 18);
            const ka = angleTo(e, player);
            player.x += Math.cos(ka) * CONFIG.combat.knockbackDistance;
            player.y += Math.sin(ka) * CONFIG.combat.knockbackDistance;

            eventBus.emit('playerDamaged', {
              damage: dmg,
              currentHp: player.hp,
              maxHp: player.maxHp,
            });
          }
          e.attackCooldown = CONFIG.combat.attackCooldown;
        }
      }

      // Vampire lifesteal
      if (e.type === 'vampire' && dist(e, player) < e.radius + player.radius) {
        e.hp = Math.min(e.maxHp, e.hp + e.damage * CONFIG.combat.vampireLifestealRate * dt);
      }

      // Remove distant enemies
      if (dist(e, player) > CONFIG.spawn.removalDistance) {
        this.enemies.splice(i, 1);
      }
    }
  },

  updateProjectiles(dt: number): void {
    if (!this.player) return;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!updateProjectile(p, this.player, dt)) {
        this.projectiles.splice(i, 1);
        continue;
      }

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (!checkProjectileHit(p, e)) continue;

        if (p.type === 'holywater') {
          if (p.tickTimer !== undefined && p.tickTimer > 0) continue;
          if (p.tickTimer !== undefined) p.tickTimer = p.tickRate!;
        }

        p.hitEnemies.push(e);
        e.hp -= p.damage;
        e.hitTimer = CONFIG.combat.hitFlashDuration;

        const ka2 = angleTo(p, e);
        e.x += Math.cos(ka2) * CONFIG.combat.projectileKnockback;
        e.y += Math.sin(ka2) * CONFIG.combat.projectileKnockback;

        this.addDamageNumber(e.x, e.y - e.radius - 5, String(p.damage), '#ffcc00', 14);
        this.addParticles(e.x, e.y, e.color, CONFIG.effects.hitParticleCount);

        if (e.hp <= 0) {
          this.kills++;
          console.log(
            `[EnemyDied] type=${e.type} xp=${e.xp} kills=${this.kills} pos=(${e.x.toFixed(1)},${e.y.toFixed(1)})`,
          );
          eventBus.emit('enemyDied', {
            x: e.x,
            y: e.y,
            xp: e.xp,
            color: e.color,
            enemyType: e.type,
          });
          this.enemies.splice(j, 1);
        }

        if (p.piercing <= 0 && p.type !== 'holywater' && p.type !== 'whip') {
          this.projectiles.splice(i, 1);
          break;
        }
        if (p.piercing > 0) p.piercing--;
      }
    }
  },

  updateGems(dt: number): void {
    if (!this.player) return;
    const player = this.player;

    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      if (canPickupGem(player, g)) {
        const a = angleTo(g, player);
        const speed = CONFIG.gem.baseAttractSpeed + player.magnetRange * CONFIG.gem.attractSpeedMultiplier;
        g.x += Math.cos(a) * speed * dt;
        g.y += Math.sin(a) * speed * dt;

        if (dist(player, g) < CONFIG.gem.pickupDistance) {
          console.log(`[GemPickup] xp=${g.xp} pos=(${g.x.toFixed(1)},${g.y.toFixed(1)})`);
          const leveled = addXP(player, g.xp);

          eventBus.emit('xpGained', {
            amount: g.xp,
            totalXp: player.xp,
            xpToLevel: player.xpToLevel,
            level: player.level,
          });

          if (leveled) {
            eventBus.emit('playerLevelUp', {
              newLevel: player.level,
              xpToLevel: player.xpToLevel,
            });
          }
          this.gems.splice(i, 1);
        }
      }
    }
  },

  updateDamageNumbers(dt: number): void {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y -= CONFIG.effects.damageNumberRise * dt;
      d.age += dt;
      if (d.age >= d.lifetime) {
        this.damageNumbers.splice(i, 1);
      }
    }
  },

  updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  addDamageNumber(x: number, y: number, text: string, color: string, size: number): void {
    this.damageNumbers.push({
      x: x + randFloat(-CONFIG.effects.damageNumberSpreadX, CONFIG.effects.damageNumberSpreadX),
      y,
      text: String(text),
      color: color || '#ffcc00',
      size: size || 14,
      age: 0,
      lifetime: CONFIG.effects.damageNumberLifetime,
    });
  },

  addParticles(x: number, y: number, color: string, count: number): void {
    const { particleSpeed, particleMinLife, particleMaxLife, particleMinRadius, particleMaxRadius } =
      CONFIG.effects;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: randFloat(-particleSpeed, particleSpeed),
        vy: randFloat(-particleSpeed, particleSpeed),
        color,
        radius: randFloat(particleMinRadius, particleMaxRadius),
        life: randFloat(particleMinLife, particleMaxLife),
      });
    }
  },

  render(): void {
    if (!this.player) return;
    Renderer.clear();
    Renderer.drawGround(this.camera);

    for (const g of this.gems) Renderer.drawGem(g, this.camera);
    for (const e of this.enemies) Renderer.drawEnemy(e, this.camera);
    for (const p of this.projectiles) Renderer.drawProjectile(p, this.camera);
    this.renderParticles();
    Renderer.drawPlayer(this.player, this.camera);
    for (const d of this.damageNumbers) Renderer.drawDamageNumber(d, this.camera);

    // Draw collision debug circles when physics debug is enabled
    if (CONFIG.physics.debug) {
      Renderer.drawDebugColliders(this.player, this.enemies, this.gems, this.camera);
    }
  },

  renderParticles(): void {
    if (!Renderer.ctx || !Renderer.canvas) return;
    const ctx = Renderer.ctx;
    const w = Renderer.canvas.width;
    const h = Renderer.canvas.height;

    for (const p of this.particles) {
      const sx = p.x - this.camera.x + w / 2;
      const sy = p.y - this.camera.y + h / 2;
      ctx.globalAlpha = clamp(p.life / CONFIG.effects.particleFadeThreshold, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  updateHUD(): void {
    if (!this.player) return;
    const p = this.player;

    // HP and XP bars are now updated via EventBus events
    // (playerDamaged → HP bar, xpGained → XP bar).
    // Here we only update the non-event-driven HUD items,
    // plus do a sync pass in case events were missed (e.g. regen).

    const hpBar = document.getElementById('hp-bar');
    const hpText = document.getElementById('hp-text');
    const xpBar = document.getElementById('xp-bar');
    const xpText = document.getElementById('xp-text');
    const levelDisp = document.getElementById('level-display');
    const timeDisp = document.getElementById('time-display');
    const killDisp = document.getElementById('kill-display');

    if (hpBar) hpBar.style.width = clamp((p.hp / p.maxHp) * 100, 0, 100) + '%';
    if (hpText) hpText.textContent = 'HP: ' + Math.ceil(p.hp) + ' / ' + p.maxHp;
    if (xpBar) xpBar.style.width = clamp((p.xp / p.xpToLevel) * 100, 0, 100) + '%';
    if (xpText) xpText.textContent = 'XP: ' + p.xp + ' / ' + p.xpToLevel;
    if (levelDisp) levelDisp.textContent = 'Lv.' + p.level;
    if (timeDisp) timeDisp.textContent = formatTime(this.elapsed);
    if (killDisp) killDisp.textContent = 'Kills: ' + this.kills;
  },

  showLevelUp(): void {
    if (!this.player) return;
    this.state = 'levelup';
    const overlay = document.getElementById('levelup-overlay');
    const optContainer = document.getElementById('upgrade-options');
    if (!overlay || !optContainer) return;
    overlay.classList.remove('hidden');
    optContainer.innerHTML = '';

    const options = generateUpgradeOptions(this.player, this.weapons);

    for (const opt of options) {
      const btn = document.createElement('button');
      btn.className = 'upgrade-option';
      btn.innerHTML = `<div class="upgrade-name">${opt.name}</div><div class="upgrade-desc">${opt.desc}</div>`;
      btn.addEventListener('click', () => {
        opt.apply(this.player!, this.weapons);
        overlay.classList.add('hidden');
        this.state = 'playing';
        this.lastTime = performance.now();
      });
      optContainer.appendChild(btn);
    }
  },

  showGameOver(): void {
    if (!this.player) return;
    const overlay = document.getElementById('gameover-overlay');
    const stats = document.getElementById('final-stats');
    if (!overlay || !stats) return;
    overlay.classList.remove('hidden');
    stats.innerHTML =
      '<p>⏱️ 存活時間: <span>' +
      formatTime(this.elapsed) +
      '</span></p>' +
      '<p>💀 擊殺數: <span>' +
      this.kills +
      '</span></p>' +
      '<p>⭐ 等級: <span>Lv.' +
      this.player.level +
      '</span></p>';
  },
};
