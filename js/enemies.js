/* ===== Enemy Definitions & Factory ===== */

var ENEMY_TYPES = {
    skeleton: {
        name: 'Skeleton',
        hp: 8,
        speed: 55,
        damage: 5,
        radius: 12,
        xp: 1,
        color: '#d4c5a9',
        minTime: 0
    },
    zombie: {
        name: 'Zombie',
        hp: 20,
        speed: 30,
        damage: 8,
        radius: 14,
        xp: 2,
        color: '#3d6b3d',
        minTime: 0
    },
    bat: {
        name: 'Bat',
        hp: 5,
        speed: 100,
        damage: 3,
        radius: 10,
        xp: 1,
        color: '#3a2255',
        minTime: 15
    },
    ghost: {
        name: 'Ghost',
        hp: 12,
        speed: 50,
        damage: 6,
        radius: 13,
        xp: 2,
        color: '#aaaaee',
        minTime: 30
    },
    spider: {
        name: 'Spider',
        hp: 10,
        speed: 80,
        damage: 4,
        radius: 11,
        xp: 2,
        color: '#4a3520',
        minTime: 45
    },
    werewolf: {
        name: 'Werewolf',
        hp: 40,
        speed: 70,
        damage: 12,
        radius: 17,
        xp: 5,
        color: '#5a4a3a',
        minTime: 60
    },
    warlock: {
        name: 'Warlock',
        hp: 25,
        speed: 40,
        damage: 10,
        radius: 14,
        xp: 4,
        color: '#1a0a30',
        minTime: 90
    },
    vampire: {
        name: 'Vampire',
        hp: 50,
        speed: 60,
        damage: 14,
        radius: 15,
        xp: 6,
        color: '#660000',
        minTime: 120
    },
    drake: {
        name: 'Drake',
        hp: 70,
        speed: 55,
        damage: 18,
        radius: 18,
        xp: 8,
        color: '#3a6a3a',
        minTime: 150
    },
    demon: {
        name: 'Demon Lord',
        hp: 200,
        speed: 45,
        damage: 25,
        radius: 26,
        xp: 30,
        color: '#4a0000',
        minTime: 180
    },
    // ----- Bosses (spawned only by the boss schedule; minTime huge so the
    // normal weighted spawner never picks them) -----
    lich: {
        name: 'Lich',
        hp: 350,
        speed: 35,
        damage: 22,
        radius: 24,
        xp: 40,
        color: '#3aa0a0',
        minTime: 999999
    },
    reaper: {
        name: 'Reaper',
        hp: 500,
        speed: 52,
        damage: 30,
        radius: 28,
        xp: 60,
        color: '#2a2a3a',
        minTime: 999999
    }
};

/* Ranged enemies fire projectiles at the player for combat variety.
 * Stored separately so existing ENEMY_TYPES data stays untouched. */
var RANGED_ENEMIES = {
    warlock: { projColor: '#b066ff', projSpeed: 170, cooldown: 2.2, range: 440, projRadius: 6 },
    drake: { projColor: '#ff7733', projSpeed: 200, cooldown: 2.6, range: 480, projRadius: 7 },
    lich: { projColor: '#66ffcc', projSpeed: 190, cooldown: 1.6, range: 560, projRadius: 8 },
    reaper: { projColor: '#cc66ff', projSpeed: 230, cooldown: 1.3, range: 600, projRadius: 9 }
};

var HP_SCALE_INTERVAL = 60;       // scale HP every N seconds
var HP_SCALE_MULTIPLIER = 0.3;    // HP increase per interval

/** Create an enemy instance */
function createEnemy(type, x, y, elapsed) {
    var def = ENEMY_TYPES[type];
    // Scale HP with time
    var scale = 1 + Math.floor(elapsed / HP_SCALE_INTERVAL) * HP_SCALE_MULTIPLIER;
    var ranged = RANGED_ENEMIES[type] || null;
    return {
        type: type,
        x: x,
        y: y,
        hp: Math.floor(def.hp * scale),
        maxHp: Math.floor(def.hp * scale),
        speed: def.speed,
        damage: def.damage,
        radius: def.radius,
        xp: def.xp,
        color: def.color,
        hitTimer: 0,
        attackCooldown: 0,
        slowTimer: 0,
        // Ranged behaviour (null for melee enemies)
        ranged: ranged,
        rangeTimer: ranged ? randFloat(0.5, ranged.cooldown) : 0,
        isBoss: false
    };
}

/** Get available enemy types at given elapsed time */
function getAvailableEnemyTypes(elapsed) {
    var types = [];
    var keys = Object.keys(ENEMY_TYPES);
    for (var i = 0; i < keys.length; i++) {
        if (elapsed >= ENEMY_TYPES[keys[i]].minTime) {
            types.push(keys[i]);
        }
    }
    return types;
}

/** Pick a random enemy type based on elapsed time (weighted toward newer types) */
function pickEnemyType(elapsed) {
    var available = getAvailableEnemyTypes(elapsed);
    if (available.length === 0) return 'skeleton';

    // Weight newer enemies more
    var weights = [];
    var total = 0;
    for (var i = 0; i < available.length; i++) {
        var w = 1 + i * 0.5;
        weights.push(w);
        total += w;
    }

    var roll = Math.random() * total;
    var sum = 0;
    for (var j = 0; j < weights.length; j++) {
        sum += weights[j];
        if (roll <= sum) return available[j];
    }
    return available[available.length - 1];
}
