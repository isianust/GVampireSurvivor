/* ===== Weapon System ===== */

var INFINITE_PIERCING = 999;

var WEAPON_DEFS = {
    knife: {
        name: '飛刀 Throwing Knife',
        desc: '向最近敵人投擲飛刀',
        baseCooldown: 0.8,
        baseDamage: 13,
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
        baseDamage: 22,
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
        baseDamage: 8,
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
        baseDamage: 18,
        baseCount: 1,
        speed: 0,
        range: 70,
        radius: 60,
        duration: 0.2,
        type: 'whip'
    },
    // ----- Ranged default weapons for the Swordsman / Apothecary classes.
    // They reuse the knife / fireball firing mechanic via `base`. -----
    swordqi: {
        name: '劍氣 Sword Qi',
        desc: '射出劍氣斬向最近敵人',
        base: 'knife',
        baseCooldown: 0.7,
        baseDamage: 16,
        baseCount: 1,
        speed: 380,
        range: 340,
        radius: 6,
        type: 'knife'
    },
    potion: {
        name: '藥彈 Potion Bomb',
        desc: '投出藥彈造成範圍毒傷',
        base: 'fireball',
        baseCooldown: 1.4,
        baseDamage: 18,
        baseCount: 1,
        speed: 240,
        range: 400,
        radius: 9,
        type: 'fireball'
    }
};

/* ===== Weapon Evolution 武器進化 — fuse two weapons into one =====
 * Each evolved weapon reuses a base mechanic (`base`) for firing, but with
 * far stronger stats. `assetKey` lets ComfyUI pixel art skin it later. */
var EVOLVED_DEFS = {
    stormblade: {
        name: '🌪️ 刀刃風暴 Storm Blade', desc: '飛刀進化：高速三連穿刺',
        base: 'knife', type: 'knife', assetKey: 'proj_stormblade',
        baseCooldown: 0.3, baseDamage: 22, baseCount: 3, speed: 420, range: 360, radius: 7
    },
    inferno: {
        name: '🔥 煉獄火海 Inferno', desc: '火球進化：巨大爆裂火球',
        base: 'fireball', type: 'fireball', assetKey: 'proj_inferno',
        baseCooldown: 0.8, baseDamage: 40, baseCount: 2, speed: 260, range: 460, radius: 14
    },
    deathspiral: {
        name: '💀 死亡螺旋 Death Spiral', desc: '聖鞭進化：雙向大範圍橫掃',
        base: 'whip', type: 'whip', assetKey: 'proj_deathspiral',
        baseCooldown: 0.5, baseDamage: 30, baseCount: 2, speed: 0, range: 95, radius: 90, duration: 0.25
    },
    sanctuary: {
        name: '✨ 聖域 Sanctuary', desc: '聖水進化：持久巨型聖光領域',
        base: 'holywater', type: 'holywater', assetKey: 'proj_sanctuary',
        baseCooldown: 1.5, baseDamage: 14, baseCount: 1, speed: 0, range: 0, radius: 70, duration: 4.0
    }
};

/* Evolution rules: own `a` at max level (8) AND own `b` (any level)
 * → fuse both into `result`, freeing weapon slots. */
var EVOLUTIONS = [
    { result: 'stormblade', a: 'knife', b: 'fireball' },
    { result: 'inferno', a: 'fireball', b: 'holywater' },
    { result: 'deathspiral', a: 'whip', b: 'knife' },
    { result: 'sanctuary', a: 'holywater', b: 'whip' }
];

var MAX_WEAPON_LEVEL = 8;

function createWeaponState(weaponId) {
    var def = WEAPON_DEFS[weaponId] || EVOLVED_DEFS[weaponId];
    return {
        id: weaponId,
        def: def,
        cooldown: 0,
        level: 1,
        getDamage: function () { return this.def.baseDamage + (this.level - 1) * 4; },
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
        var mech = w.def.base || w.id;       // evolved weapons reuse a base mechanic
        var assetKey = w.def.assetKey;       // optional pixel-art skin override

        for (var c = 0; c < count; c++) {
            if (mech === 'knife' || mech === 'fireball') {
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
                    assetKey: assetKey,
                    life: w.def.range / w.def.speed,
                    piercing: mech === 'fireball' ? 2 : 0,
                    hitEnemies: []
                });
            } else if (mech === 'holywater') {
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
                    assetKey: assetKey,
                    life: w.def.duration,
                    tickRate: 0.3,
                    tickTimer: 0,
                    piercing: INFINITE_PIERCING,
                    hitEnemies: []
                });
            } else if (mech === 'whip') {
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
                    assetKey: assetKey,
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
    var owned = weapons.map(function (w) { return w.id; });

    // --- Weapon evolutions (highest priority — shown first when available) ---
    var evolutions = [];
    for (var ei = 0; ei < EVOLUTIONS.length; ei++) {
        var ev = EVOLUTIONS[ei];
        if (owned.indexOf(ev.result) >= 0) continue;       // already evolved
        var wa = null;
        for (var wi = 0; wi < weapons.length; wi++) {
            if (weapons[wi].id === ev.a) { wa = weapons[wi]; break; }
        }
        if (!wa || wa.level < MAX_WEAPON_LEVEL) continue;   // base must be maxed
        if (owned.indexOf(ev.b) < 0) continue;              // partner must be owned
        var evolved = EVOLVED_DEFS[ev.result];
        evolutions.push({
            name: '✨ 進化：' + evolved.name,
            desc: evolved.desc + '（融合 ' + WEAPON_DEFS[ev.a].name + ' + ' + WEAPON_DEFS[ev.b].name + '）',
            apply: (function (rule) {
                return function (p, weps) {
                    // Remove both base weapons, add the evolved one
                    for (var i = weps.length - 1; i >= 0; i--) {
                        if (weps[i].id === rule.a || weps[i].id === rule.b) weps.splice(i, 1);
                    }
                    weps.push(createWeaponState(rule.result));
                };
            })(ev),
            isWeapon: true,
            weaponId: ev.result
        });
    }

    // Weapon upgrades for existing weapons
    for (var i = 0; i < weapons.length; i++) {
        if (weapons[i].level < MAX_WEAPON_LEVEL) {
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

    // Shuffle the regular options, then prepend evolutions so they always show
    shuffle(options);
    return evolutions.concat(options).slice(0, 3);
}

function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = randInt(0, i + 1);
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
}
