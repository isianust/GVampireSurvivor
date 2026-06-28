/* ===== Weapon System ===== */

var INFINITE_PIERCING = 999;

var WEAPON_DEFS = {
    knife: {
        name: '奪命飛刀 Soul-Reaping Knife',
        desc: '向最近敵人擲出奪命飛刀',
        baseCooldown: 0.8,
        baseDamage: 13,
        baseCount: 1,
        speed: 350,
        range: 300,
        radius: 5,
        type: 'knife'
    },
    fireball: {
        name: '烈火真訣 Inferno Orb',
        desc: '催動真火轟出，造成範圍灼傷',
        baseCooldown: 1.5,
        baseDamage: 22,
        baseCount: 1,
        speed: 250,
        range: 400,
        radius: 8,
        type: 'fireball'
    },
    holywater: {
        name: '淨世甘泉 Cleansing Spring',
        desc: '潑灑甘泉，於地面化作傷敵領域',
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
        name: '游龍鞭法 Dragon Whip',
        desc: '揮出游龍鞭，橫掃身前群敵',
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
        name: '凌厲劍氣 Keen Sword Qi',
        desc: '遞出凌厲劍氣，斬向最近敵人',
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
        name: '霹靂藥彈 Thunderclap Bomb',
        desc: '擲出霹靂藥彈，炸開範圍毒傷',
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
        name: '🌪️ 風雷刀陣 Storm Blade', desc: '飛刀進化：風雷三連、高速穿刺',
        base: 'knife', type: 'knife', assetKey: 'proj_stormblade',
        baseCooldown: 0.3, baseDamage: 22, baseCount: 3, speed: 420, range: 360, radius: 7
    },
    inferno: {
        name: '🔥 焚天煉獄 Inferno', desc: '真火進化：焚天巨焰、爆裂連環',
        base: 'fireball', type: 'fireball', assetKey: 'proj_inferno',
        baseCooldown: 0.8, baseDamage: 40, baseCount: 2, speed: 260, range: 460, radius: 14
    },
    deathspiral: {
        name: '💀 奪魂旋風 Death Spiral', desc: '鞭法進化：雙向奪魂、大範圍橫掃',
        base: 'whip', type: 'whip', assetKey: 'proj_deathspiral',
        baseCooldown: 0.5, baseDamage: 30, baseCount: 2, speed: 0, range: 95, radius: 90, duration: 0.25
    },
    sanctuary: {
        name: '✨ 護身金鐘 Sanctuary', desc: '甘泉進化：持久巨型護身金鐘領域',
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

/* ===== Stat upgrade pool 屬性升級表 =====
 * 純數據表，加新招只要喺呢度加一行（唔使改 generateUpgradeOptions）：
 *   stat   要加嘅玩家屬性欄位名（必須係 player 已支援嘅欄位）
 *   value  每次升級加幾多
 *   name / desc / icon 顯示用（武俠風命名） */
var UPGRADE_POOL = [
    { id: 'maxhp', stat: 'maxHp', value: 20, icon: '❤️', name: '渾元護體 生命上限 +20', desc: '渾厚內力護體，最大生命提升' },
    { id: 'maxhp_big', stat: 'maxHp', value: 40, icon: '❤️‍🔥', name: '九陽神功 生命上限 +40', desc: '純陽內力滾滾，最大生命大幅提升' },
    { id: 'armor', stat: 'armor', value: 1, icon: '🛡️', name: '鐵布衫 護甲 +1', desc: '橫練金鐘鐵布，減少受到的傷害' },
    { id: 'armor_big', stat: 'armor', value: 2, icon: '🪨', name: '金鐘罩 護甲 +2', desc: '罡氣護身，大幅減少受到的傷害' },
    { id: 'speed', stat: 'speedMult', value: 0.1, icon: '👟', name: '凌波微步 移速 +10%', desc: '身法如水，移動更快' },
    { id: 'speed_big', stat: 'speedMult', value: 0.2, icon: '🌬️', name: '神行百變 移速 +20%', desc: '神行無蹤，移動大幅加快' },
    { id: 'regen', stat: 'regen', value: 0.5, icon: '💚', name: '龜息養生 回復 +0.5/s', desc: '吐納養生，持續回復生命' },
    { id: 'regen_big', stat: 'regen', value: 1.0, icon: '🌿', name: '長春不老功 回復 +1/s', desc: '生生不息，大幅持續回復生命' },
    { id: 'magnet', stat: 'magnetRange', value: 30, icon: '🧲', name: '吸星大法 拾取 +30', desc: '隔空攝物，更遠距離拾取經驗' },
    { id: 'magnet_big', stat: 'magnetRange', value: 60, icon: '🌀', name: '北冥神功 拾取 +60', desc: '吞吐如海，大幅擴大拾取範圍' },
    { id: 'lifesteal', stat: 'lifestealOnKill', value: 1, icon: '🩸', name: '化血神刀 擊殺回血 +1', desc: '每擊殺一敵回復生命' }
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

    // Stat upgrades — data-driven from UPGRADE_POOL
    for (var k = 0; k < UPGRADE_POOL.length; k++) {
        options.push({
            name: (UPGRADE_POOL[k].icon ? UPGRADE_POOL[k].icon + ' ' : '') + UPGRADE_POOL[k].name,
            desc: UPGRADE_POOL[k].desc,
            apply: (function (up) {
                return function (p) {
                    p[up.stat] = (p[up.stat] || 0) + up.value;
                    // 生命上限提升時同步補滿等量當前生命
                    if (up.stat === 'maxHp') p.hp += up.value;
                };
            })(UPGRADE_POOL[k]),
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
