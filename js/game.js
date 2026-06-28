/* ===== Core Game State & Loop ===== */

/* Boss schedule: fixed early bosses, then a rotating boss every BOSS_INTERVAL
 * seconds with escalating HP — keeps long runs intense. */
var BOSS_SCHEDULE = [
    { t: 120, type: 'demon' },
    { t: 240, type: 'lich' },
    { t: 360, type: 'reaper' },
    { t: 480, type: 'demon' }
];
var BOSS_INTERVAL = 150;       // seconds between bosses after the schedule
var BOSS_ROTATION = ['demon', 'lich', 'reaper'];

/* Kill-count boss tiers: a boss appears once the player reaches each kill
 * threshold (independent of the time schedule — both systems run together). */
var BOSS_KILL_SCHEDULE = [
    { kills: 50, type: 'demon', label: '小BOSS', hpMult: 1.0 },
    { kills: 100, type: 'lich', label: '中BOSS', hpMult: 1.6 },
    { kills: 200, type: 'reaper', label: '大BOSS', hpMult: 2.4 },
    { kills: 500, type: 'demon', label: '最大BOSS', hpMult: 3.6 }
];
/* After the fixed kill tiers, keep spawning escalating kill-based bosses. */
var BOSS_KILL_INTERVAL = 300;  // every N extra kills past the last tier

var Game = {
    state: 'menu',  // menu | playing | paused | levelup | gameover
    player: null,
    character: null,
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    gems: [],
    damageNumbers: [],
    particles: [],
    weapons: [],
    camera: { x: 0, y: 0 },
    elapsed: 0,
    kills: 0,
    spawnTimer: 0,
    spawnInterval: 1.5,
    maxEnemies: 100,
    lastTime: 0,
    animFrame: 0,
    lastDir: { x: 1, y: 0 },
    nextBossIndex: 0,
    nextBossTime: 0,
    nextKillBossIndex: 0,
    nextKillBossThreshold: 0,

    init: function (character) {
        this.character = character || (typeof getCharacter === 'function' ? getCharacter('mage') : null);
        this.player = createPlayer(this.character);
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.gems = [];
        this.damageNumbers = [];
        this.particles = [];
        var startWeapon = (this.character && this.character.startWeapon) || 'knife';
        this.weapons = [createWeaponState(startWeapon)];
        this.camera = { x: 0, y: 0 };
        this.elapsed = 0;
        this.kills = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;
        this.maxEnemies = 100;
        this.lastDir = { x: 1, y: 0 };
        this.nextBossIndex = 0;
        this.nextBossTime = BOSS_INTERVAL;
        this.nextKillBossIndex = 0;
        this.nextKillBossThreshold = 0;
        this.state = 'playing';
        this.lastTime = performance.now();
        // Opening burst so the field isn't empty at the start
        for (var i = 0; i < 16; i++) this.spawnEnemy();
    },

    update: function (inputDir) {
        if (this.state !== 'playing') return;

        var now = performance.now();
        var dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap dt
        this.lastTime = now;
        this.elapsed += dt;

        // Remember last movement direction (used by Dash)
        if (inputDir.x !== 0 || inputDir.y !== 0) {
            this.lastDir = { x: inputDir.x, y: inputDir.y };
        }

        // Update player
        updatePlayer(this.player, inputDir.x, inputDir.y, dt);

        // Active skills + ultimate (keyboard J/K/L/U or mobile buttons)
        Skills.update(this.player, dt);
        this.handleSkillInput();

        // Camera follows player smoothly
        this.camera.x = lerp(this.camera.x, this.player.x, 0.1);
        this.camera.y = lerp(this.camera.y, this.player.y, 0.1);

        // Spawn enemies — random interval (not fixed) that tightens over time,
        // with a higher cap for longer runs.
        this.spawnTimer -= dt;
        this.maxEnemies = Math.min(200, 100 + Math.floor(this.elapsed / 30) * 12);
        if (this.spawnTimer <= 0 && this.enemies.length < this.maxEnemies) {
            var minI = Math.max(0.15, 0.6 - this.elapsed * 0.004);
            var maxI = Math.max(0.4, 1.1 - this.elapsed * 0.006);
            this.spawnTimer = randFloat(minI, maxI);
            // Spawn a small random burst so density feels lively
            var burst = 1 + randInt(0, 3);
            for (var sb = 0; sb < burst && this.enemies.length < this.maxEnemies; sb++) {
                this.spawnEnemy();
            }
        }

        // Boss schedule (escalating, endless) — by time AND by kill count
        this.updateBossSchedule();
        this.updateKillBossSchedule();

        // Update enemies
        this.updateEnemies(dt);

        // Fire weapons
        var newProjs = fireWeapons(this.weapons, this.player, this.enemies, dt);
        for (var np = 0; np < newProjs.length; np++) {
            this.projectiles.push(newProjs[np]);
        }

        // Update projectiles
        this.updateProjectiles(dt);

        // Update enemy projectiles
        this.updateEnemyProjectiles(dt);

        // Update gems — attract to player
        this.updateGems(dt);

        // Update damage numbers
        this.updateDamageNumbers(dt);

        // Update particles
        this.updateParticles(dt);

        // Update HUD
        this.updateHUD();

        // Done with this frame's one-shot key presses
        if (typeof Input !== 'undefined' && Input.clearPresses) Input.clearPresses();

        // Check game over
        if (this.player.hp <= 0) {
            this.state = 'gameover';
            this.showGameOver();
        }
    },

    /** Read one-shot skill/ultimate presses and activate them. */
    handleSkillInput: function () {
        if (typeof Input === 'undefined' || !Input.consumePress) return;
        var sk = this.player.skills || DEFAULT_SKILLS;
        if (Input.consumePress('j') && sk[0]) Skills.activate(this, sk[0]);
        if (Input.consumePress('k') && sk[1]) Skills.activate(this, sk[1]);
        if (Input.consumePress('l') && sk[2]) Skills.activate(this, sk[2]);
        if (Input.consumePress('u') || Input.consumePress(' ')) Skills.activateUlt(this);
    },

    /** Trigger Dash in the current movement/facing direction. */
    dashPlayer: function () {
        var p = this.player;
        var dx = this.lastDir.x, dy = this.lastDir.y;
        var m = Math.sqrt(dx * dx + dy * dy);
        if (m < 0.01) { dx = p.facingX; dy = p.facingY; m = Math.sqrt(dx * dx + dy * dy) || 1; }
        dx /= m; dy /= m;
        p.x += dx * 110;
        p.y += dy * 110;
        p.dashTimer = 0.18;
        p.invTimer = Math.max(p.invTimer, 0.4);
        this.addParticles(p.x, p.y, '#cfe8ff', 14);
    },

    /** Deal damage to every enemy within radius; killBoss=true also damages bosses. */
    areaDamage: function (x, y, radius, dmg, includeBoss) {
        for (var i = this.enemies.length - 1; i >= 0; i--) {
            var e = this.enemies[i];
            if (!includeBoss && e.isBoss) continue;
            var d = dist({ x: x, y: y }, e);
            if (d > radius + e.radius) continue;
            this.hitEnemy(i, dmg, x, y);
        }
    },

    /** Slow every enemy within radius for `dur` seconds (frost). */
    slowArea: function (x, y, radius, dur) {
        for (var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];
            if (dist({ x: x, y: y }, e) <= radius + e.radius) {
                e.slowTimer = Math.max(e.slowTimer, dur);
            }
        }
    },

    spawnEnemy: function () {
        var type = pickEnemyType(this.elapsed);
        var pos = spawnOutsideView(this.camera, Renderer.canvas);
        var enemy = createEnemy(type, pos.x, pos.y, this.elapsed);
        this.enemies.push(enemy);
    },

    /** Spawn scheduled / rotating bosses as the run gets longer. */
    updateBossSchedule: function () {
        // Fixed early bosses
        if (this.nextBossIndex < BOSS_SCHEDULE.length) {
            var entry = BOSS_SCHEDULE[this.nextBossIndex];
            if (this.elapsed >= entry.t) {
                this.spawnBoss(entry.type, 1 + this.nextBossIndex * 0.25);
                this.nextBossIndex++;
            }
            return;
        }
        // Endless rotation with escalating HP
        if (this.elapsed >= this.nextBossTime) {
            var idx = Math.floor(this.elapsed / BOSS_INTERVAL) % BOSS_ROTATION.length;
            var mult = 1 + (this.elapsed / BOSS_INTERVAL) * 0.15;
            this.spawnBoss(BOSS_ROTATION[idx], mult);
            this.nextBossTime += BOSS_INTERVAL;
        }
    },

    /** Spawn bosses when the player reaches kill-count tiers (50/100/200/500…). */
    updateKillBossSchedule: function () {
        // Fixed kill tiers
        if (this.nextKillBossIndex < BOSS_KILL_SCHEDULE.length) {
            var tier = BOSS_KILL_SCHEDULE[this.nextKillBossIndex];
            if (this.kills >= tier.kills) {
                this.spawnBoss(tier.type, tier.hpMult, tier.label);
                this.nextKillBossIndex++;
                if (this.nextKillBossIndex >= BOSS_KILL_SCHEDULE.length) {
                    var last = BOSS_KILL_SCHEDULE[BOSS_KILL_SCHEDULE.length - 1];
                    this.nextKillBossThreshold = last.kills + BOSS_KILL_INTERVAL;
                }
            }
            return;
        }
        // Endless kill-based bosses past the last tier
        if (this.kills >= this.nextKillBossThreshold) {
            var ridx = Math.floor(this.kills / BOSS_KILL_INTERVAL) % BOSS_ROTATION.length;
            var rmult = 3.6 + (this.kills - 500) / BOSS_KILL_INTERVAL * 0.5;
            this.spawnBoss(BOSS_ROTATION[ridx], rmult, '最大BOSS');
            this.nextKillBossThreshold += BOSS_KILL_INTERVAL;
        }
    },

    spawnBoss: function (type, hpMult, label) {
        type = type || 'demon';
        hpMult = hpMult || 1;
        var pos = spawnOutsideView(this.camera, Renderer.canvas, 200);
        var boss = createEnemy(type, pos.x, pos.y, this.elapsed);
        boss.hp *= 3 * hpMult;
        boss.maxHp *= 3 * hpMult;
        boss.radius *= 1.4;
        boss.isBoss = true;
        if (label) boss.bossLabel = label;
        this.enemies.push(boss);
        var msg = label ? ('⚠ ' + label + ' 出現!') : '⚠ BOSS 出現!';
        this.addDamageNumber(this.player.x, this.player.y - 60, msg, '#ff4444', 24);
    },

    /** Apply damage to enemy at index; centralizes kill → gem/XP/charge/lifesteal. */
    hitEnemy: function (index, dmg, srcX, srcY) {
        var e = this.enemies[index];
        if (!e) return false;
        e.hp -= dmg;
        e.hitTimer = 0.15;
        if (srcX !== undefined) {
            var ka = angleTo({ x: srcX, y: srcY }, e);
            e.x += Math.cos(ka) * 5;
            e.y += Math.sin(ka) * 5;
        }
        this.addDamageNumber(e.x, e.y - e.radius - 5, Math.round(dmg), '#ffcc00', 14);
        this.addParticles(e.x, e.y, e.color, 3);
        if (e.hp <= 0) {
            this.killEnemy(index);
            return true;
        }
        return false;
    },

    /** Remove a dead enemy and award rewards. */
    killEnemy: function (index) {
        var e = this.enemies[index];
        if (!e) return;
        this.kills++;
        this.gems.push({
            x: e.x,
            y: e.y,
            xp: e.xp,
            size: 4 + e.xp,
            color: e.xp >= 10 ? '#ffcc00' : e.xp >= 5 ? '#44ff44' : '#44aaff'
        });
        this.addParticles(e.x, e.y, e.color, e.isBoss ? 24 : 8);
        // Ultimate charge + on-kill lifesteal (e.g. Carmilla)
        var p = this.player;
        p.ultCharge = Math.min(p.ultMax, p.ultCharge + (e.isBoss ? 25 : 3));
        if (p.lifestealOnKill) {
            p.hp = Math.min(p.maxHp, p.hp + p.lifestealOnKill);
        }
        this.enemies.splice(index, 1);
    },

    updateEnemies: function (dt) {
        var player = this.player;
        for (var i = this.enemies.length - 1; i >= 0; i--) {
            var e = this.enemies[i];

            // Slow (frost) factor
            var spdMult = 1;
            if (e.slowTimer > 0) { e.slowTimer -= dt; spdMult = 0.25; }

            // Move toward player
            var a = angleTo(e, player);
            e.x += Math.cos(a) * e.speed * spdMult * dt;
            e.y += Math.sin(a) * e.speed * spdMult * dt;

            // Hit timer
            if (e.hitTimer > 0) e.hitTimer -= dt;

            // Attack cooldown
            if (e.attackCooldown > 0) e.attackCooldown -= dt;

            // Ranged enemies shoot at the player
            if (e.ranged) {
                e.rangeTimer -= dt;
                if (e.rangeTimer <= 0 && dist(e, player) < e.ranged.range) {
                    this.fireEnemyProjectile(e);
                    e.rangeTimer = e.ranged.cooldown;
                }
            }

            // Collision with player
            if (circleCollide(e, player) && e.attackCooldown <= 0) {
                if (damagePlayer(player, e.damage)) {
                    this.addDamageNumber(player.x, player.y - 20, '-' + Math.max(1, e.damage - player.armor), '#ff4444', 18);
                    // Knockback
                    var ka = angleTo(e, player);
                    player.x += Math.cos(ka) * 20;
                    player.y += Math.sin(ka) * 20;
                }
                e.attackCooldown = 0.5;
            }

            // Vampire special: life steal
            if (e.type === 'vampire' && circleCollide(e, player)) {
                e.hp = Math.min(e.maxHp, e.hp + e.damage * 0.3 * dt);
            }

            // Remove if too far (bosses persist)
            if (!e.isBoss && dist(e, player) > 1200) {
                this.enemies.splice(i, 1);
            }
        }
    },

    /** Spawn an enemy projectile aimed at the player. */
    fireEnemyProjectile: function (e) {
        var a = angleTo(e, this.player);
        var r = e.ranged;
        this.enemyProjectiles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * r.projSpeed,
            vy: Math.sin(a) * r.projSpeed,
            radius: r.projRadius,
            damage: Math.max(1, Math.round(e.damage * 0.7)),
            color: r.projColor,
            life: 4
        });
    },

    updateEnemyProjectiles: function (dt) {
        var player = this.player;
        for (var i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            var p = this.enemyProjectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) { this.enemyProjectiles.splice(i, 1); continue; }
            if (dist(p, player) < p.radius + player.radius) {
                if (damagePlayer(player, p.damage)) {
                    this.addDamageNumber(player.x, player.y - 20, '-' + Math.max(1, p.damage - player.armor), '#ff66aa', 18);
                }
                this.addParticles(p.x, p.y, p.color, 5);
                this.enemyProjectiles.splice(i, 1);
            }
        }
    },

    updateProjectiles: function (dt) {
        for (var i = this.projectiles.length - 1; i >= 0; i--) {
            var p = this.projectiles[i];
            if (!updateProjectile(p, this.player, dt)) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check hits
            for (var j = this.enemies.length - 1; j >= 0; j--) {
                var e = this.enemies[j];
                if (!checkProjectileHit(p, e)) continue;

                // Holy water ticks
                if (p.type === 'holywater') {
                    if (p.tickTimer > 0) continue;
                    p.tickTimer = p.tickRate;
                }

                p.hitEnemies.push(e);
                e.hp -= p.damage;
                e.hitTimer = 0.15;

                // Knockback
                var ka2 = angleTo(p, e);
                e.x += Math.cos(ka2) * 5;
                e.y += Math.sin(ka2) * 5;

                this.addDamageNumber(e.x, e.y - e.radius - 5, p.damage, '#ffcc00', 14);

                // Add hit particles
                this.addParticles(e.x, e.y, e.color, 3);

                // Kill enemy
                if (e.hp <= 0) {
                    this.killEnemy(j);
                }

                // Piercing
                if (p.piercing <= 0 && p.type !== 'holywater' && p.type !== 'whip') {
                    this.projectiles.splice(i, 1);
                    break;
                }
                if (p.piercing > 0) p.piercing--;
            }
        }
    },

    updateGems: function (dt) {
        var player = this.player;
        for (var i = this.gems.length - 1; i >= 0; i--) {
            var g = this.gems[i];
            if (canPickupGem(player, g)) {
                // Attract
                var a = angleTo(g, player);
                var speed = 200 + (player.magnetRange * 2);
                g.x += Math.cos(a) * speed * dt;
                g.y += Math.sin(a) * speed * dt;

                if (dist(player, g) < 10) {
                    if (addXP(player, g.xp)) {
                        this.showLevelUp();
                    }
                    this.gems.splice(i, 1);
                }
            }
        }
    },

    updateDamageNumbers: function (dt) {
        for (var i = this.damageNumbers.length - 1; i >= 0; i--) {
            var d = this.damageNumbers[i];
            d.y -= 30 * dt;
            d.age += dt;
            if (d.age >= d.lifetime) {
                this.damageNumbers.splice(i, 1);
            }
        }
    },

    updateParticles: function (dt) {
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    addDamageNumber: function (x, y, text, color, size) {
        this.damageNumbers.push({
            x: x + randFloat(-10, 10),
            y: y,
            text: String(text),
            color: color || '#ffcc00',
            size: size || 14,
            age: 0,
            lifetime: 0.8
        });
    },

    addParticles: function (x, y, color, count) {
        for (var i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: randFloat(-80, 80),
                vy: randFloat(-80, 80),
                color: color,
                radius: randFloat(2, 4),
                life: randFloat(0.2, 0.5)
            });
        }
    },

    render: function () {
        var ctx = Renderer.ctx;
        Renderer.clear();
        Renderer.drawGround(this.camera);

        // Draw gems
        for (var g = 0; g < this.gems.length; g++) {
            Renderer.drawGem(this.gems[g], this.camera);
        }

        // Draw enemies
        for (var e = 0; e < this.enemies.length; e++) {
            Renderer.drawEnemy(this.enemies[e], this.camera);
        }

        // Draw projectiles
        for (var p = 0; p < this.projectiles.length; p++) {
            Renderer.drawProjectile(this.projectiles[p], this.camera);
        }

        // Draw enemy projectiles
        for (var ep = 0; ep < this.enemyProjectiles.length; ep++) {
            Renderer.drawEnemyProjectile(this.enemyProjectiles[ep], this.camera);
        }

        // Draw particles
        this.renderParticles(ctx);

        // Draw player
        Renderer.drawPlayer(this.player, this.camera);

        // Draw damage numbers
        for (var d = 0; d < this.damageNumbers.length; d++) {
            Renderer.drawDamageNumber(this.damageNumbers[d], this.camera);
        }
    },

    renderParticles: function (ctx) {
        var w = window.innerWidth;
        var h = window.innerHeight;
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            var sx = p.x - this.camera.x + w / 2;
            var sy = p.y - this.camera.y + h / 2;
            ctx.globalAlpha = clamp(p.life / 0.3, 0, 1);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    updateHUD: function () {
        var p = this.player;
        var hpBar = document.getElementById('hp-bar');
        var hpText = document.getElementById('hp-text');
        var xpBar = document.getElementById('xp-bar');
        var xpText = document.getElementById('xp-text');
        var levelDisp = document.getElementById('level-display');
        var timeDisp = document.getElementById('time-display');
        var killDisp = document.getElementById('kill-display');

        hpBar.style.width = clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
        hpText.textContent = 'HP: ' + Math.ceil(p.hp) + ' / ' + p.maxHp;
        xpBar.style.width = clamp(p.xp / p.xpToLevel * 100, 0, 100) + '%';
        xpText.textContent = 'XP: ' + p.xp + ' / ' + p.xpToLevel;
        levelDisp.textContent = 'Lv.' + p.level;
        timeDisp.textContent = formatTime(this.elapsed);
        killDisp.textContent = 'Kills: ' + this.kills;

        // Ultimate cooldown bar (fills up as the 60s cooldown elapses)
        var ultBar = document.getElementById('ult-bar');
        var ultContainer = document.getElementById('ult-bar-container');
        var ultPct = ULT_COOLDOWN > 0 ? (ULT_COOLDOWN - (p.ultCd || 0)) / ULT_COOLDOWN : 1;
        if (ultBar) ultBar.style.width = clamp(ultPct * 100, 0, 100) + '%';
        if (ultContainer) {
            if (Skills.ultReady(p)) ultContainer.classList.add('ult-ready');
            else ultContainer.classList.remove('ult-ready');
        }

        // Skill cooldown bar
        this.updateSkillBar();
    },

    /** Build/refresh the on-screen skill cooldown indicators. */
    updateSkillBar: function () {
        var bar = document.getElementById('skill-bar');
        if (!bar) return;
        var p = this.player;
        var order = (p && p.skills) || DEFAULT_SKILLS;
        // Build once (rebuild if the loadout length changes, e.g. new character)
        if (bar.children.length !== order.length || bar.getAttribute('data-loadout') !== order.join(',')) {
            bar.innerHTML = '';
            bar.setAttribute('data-loadout', order.join(','));
            for (var i = 0; i < order.length; i++) {
                var def = SKILL_DEFS[order[i]];
                if (!def) continue;
                var cell = document.createElement('div');
                cell.className = 'skill-cell';
                cell.setAttribute('data-skill', def.id);
                cell.setAttribute('title', def.name);
                cell.innerHTML =
                    '<span class="skill-key">' + def.key.toUpperCase() + '</span>' +
                    '<span class="skill-icon">' + def.icon + '</span>' +
                    '<span class="skill-cd"></span>';
                bar.appendChild(cell);
            }
        }
        // Update cooldown overlays
        for (var j = 0; j < bar.children.length; j++) {
            var cell2 = bar.children[j];
            var id = cell2.getAttribute('data-skill');
            var sdef = SKILL_DEFS[id];
            if (!sdef) continue;
            var cd = (p.skillCd && p.skillCd[id]) || 0;
            var maxCd = sdef.cooldown;
            var cdEl = cell2.querySelector('.skill-cd');
            if (cd > 0) {
                cell2.classList.add('on-cooldown');
                if (cdEl) cdEl.style.height = clamp(cd / maxCd * 100, 0, 100) + '%';
            } else {
                cell2.classList.remove('on-cooldown');
                if (cdEl) cdEl.style.height = '0%';
            }
        }
    },

    showLevelUp: function () {
        this.state = 'levelup';
        var overlay = document.getElementById('levelup-overlay');
        var optContainer = document.getElementById('upgrade-options');
        overlay.classList.remove('hidden');
        optContainer.innerHTML = '';

        var options = generateUpgradeOptions(this.player, this.weapons);
        var self = this;

        for (var i = 0; i < options.length; i++) {
            (function (opt) {
                var btn = document.createElement('button');
                btn.className = 'upgrade-option';
                btn.innerHTML = '<div class="upgrade-name">' + opt.name + '</div><div class="upgrade-desc">' + opt.desc + '</div>';
                btn.addEventListener('click', function () {
                    opt.apply(self.player, self.weapons);
                    overlay.classList.add('hidden');
                    self.state = 'playing';
                    self.lastTime = performance.now();
                });
                optContainer.appendChild(btn);
            })(options[i]);
        }
    },

    showGameOver: function () {
        var overlay = document.getElementById('gameover-overlay');
        var stats = document.getElementById('final-stats');
        overlay.classList.remove('hidden');
        var heroName = (this.character && this.character.name) || '英雄';
        stats.innerHTML =
            '<p>🦸 英雄: <span>' + heroName + '</span></p>' +
            '<p>⏱️ 存活時間: <span>' + formatTime(this.elapsed) + '</span></p>' +
            '<p>💀 擊殺數: <span>' + this.kills + '</span></p>' +
            '<p>⭐ 等級: <span>Lv.' + this.player.level + '</span></p>';
    }
};
