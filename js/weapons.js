/* ===== Weapon System ===== */

var INFINITE_PIERCING = 999;

var WEAPON_DEFS = {
    knife: {
        name: '飛刀 Throwing Knife',
        desc: '向最近敵人投擲飛刀',
        baseCooldown: 0.8,
        baseDamage: 8,
        baseCount: 1,
        speed: 350,
        range: 300,
        radius: 5,
        type: 'knife'
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
        type: 'fireball'
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
        type: 'holywater'
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
        type: 'whip'
    }
};

function createWeaponState(weaponId) {
    var def = WEAPON_DEFS[weaponId];
    return {
        id: weaponId,
        def: def,
        cooldown: 0,
        level: 1,
        getDamage: function () { return this.def.baseDamage + (this.level - 1) * 3; },
        getCooldown: function () { return Math.max(0.2, this.def.baseCooldown - (this.level - 1) * 0.08); },
        getCount: function () { return this.def.baseCount + Math.floor((this.level - 1) / 3); }
    };
}

/** Fire weapons and return new projectiles */
function fireWeapons(weapons, player, enemies, dt) {
    var newProjs = [];
    for (var i = 0; i < weapons.length; i++) {
        var w = weapons[i];
        w.cooldown -= dt;
        if (w.cooldown > 0) continue;
        w.cooldown = w.getCooldown();

        var count = w.getCount();
        var dmg = w.getDamage();

        for (var c = 0; c < count; c++) {
            if (w.id === 'knife' || w.id === 'fireball') {
                // Find nearest enemy
                var nearest = findNearestEnemy(player, enemies);
                if (!nearest) continue;
                var a = angleTo(player, nearest);
                // Spread for multiple
                var spread = count > 1 ? (c - (count - 1) / 2) * 0.15 : 0;
                newProjs.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(a + spread) * w.def.speed,
                    vy: Math.sin(a + spread) * w.def.speed,
                    angle: a + spread,
                    damage: dmg,
                    radius: w.def.radius,
                    type: w.def.type,
                    life: w.def.range / w.def.speed,
                    piercing: w.id === 'fireball' ? 2 : 0,
                    hitEnemies: []
                });
            } else if (w.id === 'holywater') {
                // Drop at random nearby position
                var hx = player.x + randFloat(-80, 80);
                var hy = player.y + randFloat(-80, 80);
                newProjs.push({
                    x: hx,
                    y: hy,
                    vx: 0,
                    vy: 0,
                    angle: 0,
                    damage: dmg,
                    radius: w.def.radius,
                    type: 'holywater',
                    life: w.def.duration,
                    tickRate: 0.3,
                    tickTimer: 0,
                    piercing: INFINITE_PIERCING,
                    hitEnemies: []
                });
            } else if (w.id === 'whip') {
                // Whip in facing direction or toward nearest enemy
                var wa = 0;
                var near = findNearestEnemy(player, enemies);
                if (near) wa = angleTo(player, near);
                // Alternate sides for count > 1
                var side = (c % 2 === 0) ? 0 : Math.PI;
                newProjs.push({
                    x: player.x,
                    y: player.y,
                    vx: 0,
                    vy: 0,
                    angle: wa + side,
                    damage: dmg,
                    radius: w.def.range,
                    type: 'whip',
                    life: w.def.duration,
                    piercing: INFINITE_PIERCING,
                    hitEnemies: [],
                    followPlayer: true
                });
            }
        }
    }
    return newProjs;
}

function findNearestEnemy(player, enemies) {
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < enemies.length; i++) {
        var d = dist(player, enemies[i]);
        if (d < bestDist) {
            bestDist = d;
            best = enemies[i];
        }
    }
    return best;
}

/** Update projectile; returns false if dead */
function updateProjectile(proj, player, dt) {
    proj.life -= dt;
    if (proj.life <= 0) return false;

    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;

    if (proj.followPlayer) {
        proj.x = player.x;
        proj.y = player.y;
    }

    if (proj.tickTimer !== undefined) {
        proj.tickTimer -= dt;
    }

    return true;
}

/** Check projectile hit on enemy */
function checkProjectileHit(proj, enemy) {
    if (proj.hitEnemies.indexOf(enemy) >= 0) return false;

    var hitRange = (proj.type === 'whip')
        ? proj.radius
        : (proj.radius + enemy.radius);

    if (proj.type === 'whip') {
        // Whip: arc check
        var d = dist(proj, enemy);
        if (d > hitRange) return false;
        var a = angleTo(proj, enemy);
        var diff = Math.abs(normalizeAngle(a - proj.angle));
        return diff < Math.PI / 2;
    }

    return dist(proj, enemy) < hitRange;
}

/* ===== Upgrade options generation ===== */

var UPGRADE_POOL = [
    { id: 'maxhp', name: '❤️ 生命上限 +20', desc: '增加最大生命值', apply: function (p) { p.maxHp += 20; p.hp += 20; } },
    { id: 'armor', name: '🛡️ 護甲 +1', desc: '減少受到的傷害', apply: function (p) { p.armor += 1; } },
    { id: 'speed', name: '👟 移動速度 +10%', desc: '移動更快', apply: function (p) { p.speedMult += 0.1; } },
    { id: 'regen', name: '💚 生命回復 +0.5/s', desc: '持續回復生命', apply: function (p) { p.regen += 0.5; } },
    { id: 'magnet', name: '🧲 磁鐵範圍 +30', desc: '更遠距離拾取經驗', apply: function (p) { p.magnetRange += 30; } }
];

function generateUpgradeOptions(player, weapons) {
    var options = [];
    // Weapon upgrades for existing weapons
    for (var i = 0; i < weapons.length; i++) {
        if (weapons[i].level < 8) {
            var w = weapons[i];
            options.push({
                name: '⚔️ ' + w.def.name + ' Lv.' + (w.level + 1),
                desc: '強化武器傷害與效果',
                apply: (function (weapon) { return function () { weapon.level++; }; })(w),
                isWeapon: true,
                weaponId: w.id
            });
        }
    }

    // New weapon
    var weaponKeys = Object.keys(WEAPON_DEFS);
    var owned = weapons.map(function (w) { return w.id; });
    for (var j = 0; j < weaponKeys.length; j++) {
        if (owned.indexOf(weaponKeys[j]) < 0 && weapons.length < 4) {
            var def = WEAPON_DEFS[weaponKeys[j]];
            options.push({
                name: '🆕 ' + def.name,
                desc: def.desc,
                apply: (function (wid) { return function (p, weps) { weps.push(createWeaponState(wid)); }; })(weaponKeys[j]),
                isWeapon: true,
                weaponId: weaponKeys[j]
            });
        }
    }

    // Stat upgrades
    for (var k = 0; k < UPGRADE_POOL.length; k++) {
        options.push({
            name: UPGRADE_POOL[k].name,
            desc: UPGRADE_POOL[k].desc,
            apply: (function (up) { return function (p) { up.apply(p); }; })(UPGRADE_POOL[k]),
            isWeapon: false
        });
    }

    // Shuffle and pick 3
    shuffle(options);
    return options.slice(0, 3);
}

function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = randInt(0, i + 1);
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
}
