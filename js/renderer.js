/* ===== Renderer — detailed Canvas drawing ===== */

var Renderer = {
    canvas: null,
    ctx: null,

    init: function (canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
    },

    resize: function () {
        var dpr = window.devicePixelRatio || 1;
        var w = window.innerWidth;
        var h = window.innerHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    clear: function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    /** Draw tiled ground with grass detail */
    drawGround: function (camera) {
        var ctx = this.ctx;
        var w = window.innerWidth;
        var h = window.innerHeight;
        var tileSize = 64;

        // Dark ground base
        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(0, 0, w, h);

        var startX = Math.floor((camera.x - w / 2) / tileSize) * tileSize;
        var startY = Math.floor((camera.y - h / 2) / tileSize) * tileSize;

        ctx.save();
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(40, 80, 40, 0.3)';
        ctx.lineWidth = 1;
        for (var gx = startX; gx < startX + w + tileSize * 2; gx += tileSize) {
            ctx.beginPath();
            ctx.moveTo(gx, startY);
            ctx.lineTo(gx, startY + h + tileSize * 2);
            ctx.stroke();
        }
        for (var gy = startY; gy < startY + h + tileSize * 2; gy += tileSize) {
            ctx.beginPath();
            ctx.moveTo(startX, gy);
            ctx.lineTo(startX + w + tileSize * 2, gy);
            ctx.stroke();
        }

        // Grass tufts — seeded by tile position
        for (var tx = startX; tx < startX + w + tileSize * 2; tx += tileSize) {
            for (var ty = startY; ty < startY + h + tileSize * 2; ty += tileSize) {
                var seed = ((tx * 7919 + ty * 104729) & 0xFFFF) / 65535;
                if (seed < 0.35) {
                    var gx2 = tx + seed * 50 + 7;
                    var gy2 = ty + (seed * 37 % 1) * 50 + 7;
                    ctx.fillStyle = seed < 0.15 ? 'rgba(30,70,30,0.5)' : 'rgba(50,90,40,0.3)';
                    ctx.beginPath();
                    ctx.ellipse(gx2, gy2, 3 + seed * 4, 1.5, seed * Math.PI, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    },

    /** Draw player character with detail */
    drawPlayer: function (player, camera) {
        var ctx = this.ctx;
        var w = window.innerWidth;
        var h = window.innerHeight;
        var sx = player.x - camera.x + w / 2;
        var sy = player.y - camera.y + h / 2;
        var r = player.radius;
        var t = performance.now() / 1000;

        ctx.save();
        ctx.translate(sx, sy);

        // Aura glow
        var auraGrad = ctx.createRadialGradient(0, 0, r, 0, 0, r * 3);
        auraGrad.addColorStop(0, 'rgba(100,180,255,0.15)');
        auraGrad.addColorStop(1, 'rgba(100,180,255,0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 3, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.8, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body — armored knight
        ctx.fillStyle = '#3b5998';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = '#1a3366';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Helmet visor
        ctx.fillStyle = '#2a4080';
        ctx.beginPath();
        ctx.arc(0, -r * 0.1, r * 0.7, -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.fill();

        // Eyes (glowing)
        var eyeGlow = 0.7 + Math.sin(t * 4) * 0.3;
        ctx.fillStyle = rgba(150, 220, 255, eyeGlow);
        ctx.shadowColor = 'rgba(100,200,255,0.8)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.15, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.25, -r * 0.15, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cross emblem on chest
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, r * 0.15);
        ctx.lineTo(0, r * 0.55);
        ctx.moveTo(-r * 0.15, r * 0.3);
        ctx.lineTo(r * 0.15, r * 0.3);
        ctx.stroke();

        // Invincibility flash
        if (player.invTimer > 0 && Math.floor(t * 10) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    /** Draw a single enemy with detailed sprites */
    drawEnemy: function (enemy, camera) {
        var ctx = this.ctx;
        var w = window.innerWidth;
        var h = window.innerHeight;
        var sx = enemy.x - camera.x + w / 2;
        var sy = enemy.y - camera.y + h / 2;

        // Culling
        if (sx < -60 || sx > w + 60 || sy < -60 || sy > h + 60) return;

        var r = enemy.radius;
        var t = performance.now() / 1000;

        ctx.save();
        ctx.translate(sx, sy);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.7, r * 0.8, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Damage flash
        if (enemy.hitTimer > 0) {
            ctx.globalAlpha = 0.6 + Math.sin(t * 20) * 0.4;
        }

        // Draw based on type
        EnemyRenderer.draw(ctx, enemy, r, t);

        // HP bar
        if (enemy.hp < enemy.maxHp) {
            var barW = r * 2;
            var barH = 3;
            var barY = -r - 8;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(-barW / 2, barY, barW, barH);
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(-barW / 2, barY, barW * (enemy.hp / enemy.maxHp), barH);
        }

        ctx.restore();
    },

    /** Draw XP gem */
    drawGem: function (gem, camera) {
        var ctx = this.ctx;
        var w = window.innerWidth;
        var h = window.innerHeight;
        var sx = gem.x - camera.x + w / 2;
        var sy = gem.y - camera.y + h / 2;
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) return;

        var t = performance.now() / 1000;
        var bob = Math.sin(t * 3 + gem.x) * 2;

        ctx.save();
        ctx.translate(sx, sy + bob);

        // Glow
        ctx.shadowColor = gem.color || '#44aaff';
        ctx.shadowBlur = 8;

        // Diamond shape
        var s = gem.size || 5;
        ctx.fillStyle = gem.color || '#44aaff';
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.7, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.7, 0);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.3, -s * 0.2);
        ctx.lineTo(0, 0);
        ctx.lineTo(-s * 0.3, -s * 0.2);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    },

    /** Draw projectile */
    drawProjectile: function (proj, camera) {
        var ctx = this.ctx;
        var w = window.innerWidth;
        var h = window.innerHeight;
        var sx = proj.x - camera.x + w / 2;
        var sy = proj.y - camera.y + h / 2;
        if (sx < -30 || sx > w + 30 || sy < -30 || sy > h + 30) return;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(proj.angle || 0);

        if (proj.type === 'knife') {
            // Throwing knife
            ctx.fillStyle = '#c0c0c0';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-4, -3);
            ctx.lineTo(-4, 3);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-8, -2, 5, 4);
        } else if (proj.type === 'fireball') {
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 12;
            var fGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 8);
            fGrad.addColorStop(0, '#ffff00');
            fGrad.addColorStop(0.5, '#ff6600');
            fGrad.addColorStop(1, 'rgba(255,0,0,0)');
            ctx.fillStyle = fGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (proj.type === 'holywater') {
            ctx.fillStyle = 'rgba(100,200,255,0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, proj.radius || 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(100,200,255,0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (proj.type === 'whip') {
            ctx.strokeStyle = '#daa520';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            var len = proj.radius || 60;
            ctx.lineTo(len, 0);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            // Default circle projectile
            ctx.fillStyle = proj.color || '#ffcc00';
            ctx.beginPath();
            ctx.arc(0, 0, proj.radius || 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    /** Draw damage number */
    drawDamageNumber: function (dmg, camera) {
        var ctx = this.ctx;
        var w = window.innerWidth;
        var h = window.innerHeight;
        var sx = dmg.x - camera.x + w / 2;
        var sy = dmg.y - camera.y + h / 2;

        ctx.save();
        ctx.globalAlpha = clamp(1 - dmg.age / dmg.lifetime, 0, 1);
        ctx.font = 'bold ' + (dmg.size || 14) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = dmg.color || '#ffcc00';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(dmg.text, sx, sy);
        ctx.restore();
    }
};

/* ===== Per-enemy-type rendering ===== */
var EnemyRenderer = {
    draw: function (ctx, enemy, r, t) {
        switch (enemy.type) {
            case 'skeleton': this.skeleton(ctx, r, t); break;
            case 'zombie': this.zombie(ctx, r, t); break;
            case 'bat': this.bat(ctx, r, t); break;
            case 'ghost': this.ghost(ctx, r, t); break;
            case 'spider': this.spider(ctx, r, t); break;
            case 'werewolf': this.werewolf(ctx, r, t); break;
            case 'warlock': this.warlock(ctx, r, t); break;
            case 'vampire': this.vampire(ctx, r, t); break;
            case 'drake': this.drake(ctx, r, t); break;
            case 'demon': this.demon(ctx, r, t); break;
            default: this.skeleton(ctx, r, t); break;
        }
    },

    skeleton: function (ctx, r, t) {
        // Skull body
        ctx.fillStyle = '#d4c5a9';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Eye sockets
        ctx.fillStyle = '#1a0000';
        ctx.beginPath();
        ctx.ellipse(-r * 0.25, -r * 0.15, r * 0.15, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.25, -r * 0.15, r * 0.15, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        // Red eye glow
        ctx.fillStyle = rgba(255, 50, 50, 0.6 + Math.sin(t * 5) * 0.3);
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.15, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.25, -r * 0.15, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        // Nose
        ctx.fillStyle = '#1a0000';
        ctx.beginPath();
        ctx.moveTo(0, r * 0.05);
        ctx.lineTo(-r * 0.06, r * 0.15);
        ctx.lineTo(r * 0.06, r * 0.15);
        ctx.closePath();
        ctx.fill();
        // Teeth
        ctx.strokeStyle = '#1a0000';
        ctx.lineWidth = 1;
        for (var i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * r * 0.12, r * 0.35);
            ctx.lineTo(i * r * 0.12, r * 0.5);
            ctx.stroke();
        }
    },

    zombie: function (ctx, r, t) {
        // Green body
        ctx.fillStyle = '#3d6b3d';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a4a2a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Darker patches
        ctx.fillStyle = 'rgba(20,50,20,0.4)';
        ctx.beginPath();
        ctx.arc(-r * 0.3, r * 0.2, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.2, -r * 0.3, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Eyes - asymmetric
        ctx.fillStyle = '#ccff00';
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, -r * 0.15, r * 0.12, r * 0.14, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.25, -r * 0.2, r * 0.1, r * 0.12, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.15, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.25, -r * 0.2, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // Open mouth
        ctx.fillStyle = '#1a0000';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.35, r * 0.3, r * 0.18, 0, 0, Math.PI);
        ctx.fill();
    },

    bat: function (ctx, r, t) {
        var wingFlap = Math.sin(t * 12) * 0.5;
        // Wings
        ctx.fillStyle = '#2a1a3a';
        ctx.save();
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-r * 0.3, 0);
        ctx.quadraticCurveTo(-r * 2, -r * (1 + wingFlap), -r * 1.8, r * 0.3);
        ctx.quadraticCurveTo(-r * 1.2, r * 0.1, -r * 0.3, 0);
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.moveTo(r * 0.3, 0);
        ctx.quadraticCurveTo(r * 2, -r * (1 + wingFlap), r * 1.8, r * 0.3);
        ctx.quadraticCurveTo(r * 1.2, r * 0.1, r * 0.3, 0);
        ctx.fill();
        ctx.restore();
        // Body
        ctx.fillStyle = '#3a2255';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.fillStyle = '#3a2255';
        ctx.beginPath();
        ctx.moveTo(-r * 0.3, -r * 0.5);
        ctx.lineTo(-r * 0.5, -r);
        ctx.lineTo(-r * 0.05, -r * 0.55);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.3, -r * 0.5);
        ctx.lineTo(r * 0.5, -r);
        ctx.lineTo(r * 0.05, -r * 0.55);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(-r * 0.2, -r * 0.1, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.2, -r * 0.1, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    ghost: function (ctx, r, t) {
        ctx.globalAlpha = 0.5 + Math.sin(t * 2) * 0.15;
        var bob = Math.sin(t * 3) * 3;
        // Body
        var gGrad = ctx.createRadialGradient(0, bob, 0, 0, bob, r * 1.2);
        gGrad.addColorStop(0, 'rgba(200,200,255,0.7)');
        gGrad.addColorStop(1, 'rgba(150,150,220,0.1)');
        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.arc(0, bob, r, 0, Math.PI);
        ctx.arc(0, bob, r, 0, -Math.PI, true);
        ctx.fill();
        // Wavy bottom
        ctx.beginPath();
        ctx.moveTo(-r, bob);
        for (var gx = -r; gx <= r; gx += r * 0.25) {
            ctx.lineTo(gx, bob + r * 0.3 + Math.sin(t * 4 + gx) * r * 0.2);
        }
        ctx.lineTo(r, bob);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#000033';
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, bob - r * 0.15, r * 0.18, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.3, bob - r * 0.15, r * 0.18, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    spider: function (ctx, r, t) {
        var legWave = Math.sin(t * 8) * 0.3;
        // Legs (8)
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 2;
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var midX = Math.cos(angle) * r * 0.8;
            var midY = Math.sin(angle) * r * 0.8;
            var endX = Math.cos(angle + legWave * (i % 2 === 0 ? 1 : -1)) * r * 1.6;
            var endY = Math.sin(angle + legWave * (i % 2 === 0 ? 1 : -1)) * r * 1.6;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * r * 0.4, Math.sin(angle) * r * 0.4);
            ctx.quadraticCurveTo(midX, midY - r * 0.3, endX, endY);
            ctx.stroke();
        }
        // Body
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.15, r * 0.55, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = '#3a2510';
        ctx.beginPath();
        ctx.arc(0, -r * 0.35, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Eyes (8 small)
        ctx.fillStyle = '#ff3300';
        for (var ei = 0; ei < 4; ei++) {
            var ex = -r * 0.15 + ei * r * 0.1;
            var ey = -r * 0.4 + (ei % 2) * r * 0.1;
            ctx.beginPath();
            ctx.arc(ex, ey, r * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }
        // Hourglass mark
        ctx.fillStyle = '#cc0000';
        ctx.beginPath();
        ctx.moveTo(0, r * 0.0);
        ctx.lineTo(-r * 0.08, r * 0.15);
        ctx.lineTo(0, r * 0.1);
        ctx.lineTo(r * 0.08, r * 0.15);
        ctx.closePath();
        ctx.fill();
    },

    werewolf: function (ctx, r, t) {
        // Fur body
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        // Fur texture
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 1;
        for (var fi = 0; fi < 12; fi++) {
            var fa = (fi / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(fa) * r * 0.5, Math.sin(fa) * r * 0.5);
            ctx.lineTo(Math.cos(fa) * r * 1.05, Math.sin(fa) * r * 1.05);
            ctx.stroke();
        }
        // Ears
        ctx.fillStyle = '#4a3a2a';
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.6);
        ctx.lineTo(-r * 0.7, -r * 1.2);
        ctx.lineTo(-r * 0.15, -r * 0.7);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.5, -r * 0.6);
        ctx.lineTo(r * 0.7, -r * 1.2);
        ctx.lineTo(r * 0.15, -r * 0.7);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, -r * 0.15, r * 0.12, r * 0.08, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.3, -r * 0.15, r * 0.12, r * 0.08, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Slit pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, -r * 0.15, r * 0.03, r * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.3, -r * 0.15, r * 0.03, r * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        // Snout
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.2, r * 0.25, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a0a00';
        ctx.beginPath();
        ctx.arc(0, r * 0.15, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
    },

    warlock: function (ctx, r, t) {
        // Robe
        ctx.fillStyle = '#1a0a30';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        // Hat
        ctx.fillStyle = '#0d0520';
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.5);
        ctx.lineTo(-r * 0.8, -r * 0.3);
        ctx.lineTo(r * 0.8, -r * 0.3);
        ctx.closePath();
        ctx.fill();
        // Hat brim
        ctx.fillStyle = '#1a0a30';
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.3, r * 1.0, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Glowing eyes
        ctx.fillStyle = '#aa00ff';
        ctx.shadowColor = '#aa00ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-r * 0.2, -r * 0.05, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.2, -r * 0.05, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Magic orb floating
        var orbAngle = t * 2;
        var orbX = Math.cos(orbAngle) * r * 1.2;
        var orbY = Math.sin(orbAngle) * r * 0.8 - r * 0.2;
        ctx.fillStyle = 'rgba(170,0,255,0.6)';
        ctx.shadowColor = '#aa00ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(orbX, orbY, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    vampire: function (ctx, r, t) {
        // Cape
        ctx.fillStyle = '#2a0000';
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.3);
        ctx.quadraticCurveTo(-r * 1.3, r * 0.5, -r * 0.8, r * 1.1);
        ctx.lineTo(r * 0.8, r * 1.1);
        ctx.quadraticCurveTo(r * 1.3, r * 0.5, r * 0.5, -r * 0.3);
        ctx.fill();
        // Head
        ctx.fillStyle = '#d4c4b0';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Hair
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, -r * 0.15, r * 0.85, -Math.PI * 0.9, -Math.PI * 0.1);
        ctx.fill();
        // Widow's peak
        ctx.beginPath();
        ctx.moveTo(-r * 0.15, -r * 0.7);
        ctx.lineTo(0, -r * 0.35);
        ctx.lineTo(r * 0.15, -r * 0.7);
        ctx.fill();
        // Red eyes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.05, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.25, -r * 0.05, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Fangs
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-r * 0.15, r * 0.3);
        ctx.lineTo(-r * 0.1, r * 0.55);
        ctx.lineTo(-r * 0.05, r * 0.3);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.05, r * 0.3);
        ctx.lineTo(r * 0.1, r * 0.55);
        ctx.lineTo(r * 0.15, r * 0.3);
        ctx.fill();
    },

    drake: function (ctx, r, t) {
        // Wings
        ctx.fillStyle = '#2a4a2a';
        var wingFlap = Math.sin(t * 6) * 0.4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, -r * 0.2);
        ctx.quadraticCurveTo(-r * 1.8, -r * (1.2 + wingFlap), -r * 1.5, r * 0.2);
        ctx.lineTo(-r * 0.4, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.4, -r * 0.2);
        ctx.quadraticCurveTo(r * 1.8, -r * (1.2 + wingFlap), r * 1.5, r * 0.2);
        ctx.lineTo(r * 0.4, 0);
        ctx.fill();
        // Body
        ctx.fillStyle = '#3a6a3a';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a4a2a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Scales
        ctx.fillStyle = 'rgba(20,80,20,0.3)';
        for (var si = 0; si < 5; si++) {
            ctx.beginPath();
            ctx.arc((-2 + si) * r * 0.2, r * 0.2, r * 0.15, 0, Math.PI);
            ctx.fill();
        }
        // Eyes
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, -r * 0.25, r * 0.12, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.3, -r * 0.25, r * 0.12, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Slit pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, -r * 0.25, r * 0.03, r * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.3, -r * 0.25, r * 0.03, r * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        // Nostrils with smoke
        ctx.fillStyle = 'rgba(255,100,0,0.4)';
        ctx.beginPath();
        ctx.arc(-r * 0.1, -r * 0.55, r * 0.05 + Math.sin(t * 3) * r * 0.02, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.1, -r * 0.55, r * 0.05 + Math.sin(t * 3 + 1) * r * 0.02, 0, Math.PI * 2);
        ctx.fill();
    },

    demon: function (ctx, r, t) {
        // Aura
        ctx.fillStyle = rgba(200, 0, 0, 0.1 + Math.sin(t * 2) * 0.05);
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.fillStyle = '#4a0000';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#800000';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Horns
        ctx.fillStyle = '#2a0000';
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, -r * 0.7);
        ctx.quadraticCurveTo(-r * 0.9, -r * 1.6, -r * 0.2, -r * 1.3);
        ctx.lineTo(-r * 0.3, -r * 0.7);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.4, -r * 0.7);
        ctx.quadraticCurveTo(r * 0.9, -r * 1.6, r * 0.2, -r * 1.3);
        ctx.lineTo(r * 0.3, -r * 0.7);
        ctx.fill();
        // Face markings
        ctx.strokeStyle = '#ff3300';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -r * 0.1);
        ctx.lineTo(-r * 0.3, r * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.6, -r * 0.1);
        ctx.lineTo(r * 0.3, r * 0.1);
        ctx.stroke();
        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.15, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.3, -r * 0.15, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // White pupils
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.15, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.3, -r * 0.15, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // Mouth
        ctx.fillStyle = '#1a0000';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.35, r * 0.35, r * 0.15, 0, 0, Math.PI);
        ctx.fill();
        // Fangs
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, r * 0.3);
        ctx.lineTo(-r * 0.15, r * 0.55);
        ctx.lineTo(-r * 0.1, r * 0.3);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.1, r * 0.3);
        ctx.lineTo(r * 0.15, r * 0.55);
        ctx.lineTo(r * 0.2, r * 0.3);
        ctx.fill();
    }
};
