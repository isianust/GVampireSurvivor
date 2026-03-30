/* ===== Core Game State & Loop ===== */

var BOSS_SPAWN_TIME = 180; // seconds

var Game = {
    state: 'menu',  // menu | playing | paused | levelup | gameover
    player: null,
    enemies: [],
    projectiles: [],
    gems: [],
    damageNumbers: [],
    particles: [],
    weapons: [],
    camera: { x: 0, y: 0 },
    elapsed: 0,
    kills: 0,
    spawnTimer: 0,
    spawnInterval: 1.5,
    maxEnemies: 80,
    lastTime: 0,
    animFrame: 0,

    init: function () {
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
        this.spawnInterval = 1.5;
        this.state = 'playing';
        this.lastTime = performance.now();
    },

    update: function (inputDir) {
        if (this.state !== 'playing') return;

        var now = performance.now();
        var dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap dt
        this.lastTime = now;
        this.elapsed += dt;

        // Update player
        updatePlayer(this.player, inputDir.x, inputDir.y, dt);

        // Camera follows player smoothly
        this.camera.x = lerp(this.camera.x, this.player.x, 0.1);
        this.camera.y = lerp(this.camera.y, this.player.y, 0.1);

        // Spawn enemies
        this.spawnTimer -= dt;
        // Increase difficulty over time
        this.spawnInterval = Math.max(0.3, 1.5 - this.elapsed * 0.005);
        if (this.spawnTimer <= 0 && this.enemies.length < this.maxEnemies) {
            this.spawnTimer = this.spawnInterval;
            this.spawnEnemy();
        }

        // Boss spawn at certain times
        if (Math.floor(this.elapsed) === BOSS_SPAWN_TIME && this.enemies.filter(function (e) { return e.type === 'demon'; }).length === 0) {
            this.spawnBoss();
        }

        // Update enemies
        this.updateEnemies(dt);

        // Fire weapons
        var newProjs = fireWeapons(this.weapons, this.player, this.enemies, dt);
        for (var np = 0; np < newProjs.length; np++) {
            this.projectiles.push(newProjs[np]);
        }

        // Update projectiles
        this.updateProjectiles(dt);

        // Update gems — attract to player
        this.updateGems(dt);

        // Update damage numbers
        this.updateDamageNumbers(dt);

        // Update particles
        this.updateParticles(dt);

        // Update HUD
        this.updateHUD();

        // Check game over
        if (this.player.hp <= 0) {
            this.state = 'gameover';
            this.showGameOver();
        }
    },

    spawnEnemy: function () {
        var type = pickEnemyType(this.elapsed);
        var pos = spawnOutsideView(this.camera, Renderer.canvas);
        var enemy = createEnemy(type, pos.x, pos.y, this.elapsed);
        this.enemies.push(enemy);
    },

    spawnBoss: function () {
        var pos = spawnOutsideView(this.camera, Renderer.canvas, 200);
        var boss = createEnemy('demon', pos.x, pos.y, this.elapsed);
        boss.hp *= 3;
        boss.maxHp *= 3;
        this.enemies.push(boss);
    },

    updateEnemies: function (dt) {
        var player = this.player;
        for (var i = this.enemies.length - 1; i >= 0; i--) {
            var e = this.enemies[i];

            // Move toward player
            var a = angleTo(e, player);
            e.x += Math.cos(a) * e.speed * dt;
            e.y += Math.sin(a) * e.speed * dt;

            // Hit timer
            if (e.hitTimer > 0) e.hitTimer -= dt;

            // Attack cooldown
            if (e.attackCooldown > 0) e.attackCooldown -= dt;

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

            // Remove if too far
            if (dist(e, player) > 1200) {
                this.enemies.splice(i, 1);
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
                    this.kills++;
                    // Drop gem
                    this.gems.push({
                        x: e.x,
                        y: e.y,
                        xp: e.xp,
                        size: 4 + e.xp,
                        color: e.xp >= 10 ? '#ffcc00' : e.xp >= 5 ? '#44ff44' : '#44aaff'
                    });
                    // Death particles
                    this.addParticles(e.x, e.y, e.color, 8);
                    this.enemies.splice(j, 1);
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
        stats.innerHTML =
            '<p>⏱️ 存活時間: <span>' + formatTime(this.elapsed) + '</span></p>' +
            '<p>💀 擊殺數: <span>' + this.kills + '</span></p>' +
            '<p>⭐ 等級: <span>Lv.' + this.player.level + '</span></p>';
    }
};
