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
    }
};

/** Create an enemy instance */
function createEnemy(type, x, y, elapsed) {
    var def = ENEMY_TYPES[type];
    // Scale HP with time
    var scale = 1 + Math.floor(elapsed / 60) * 0.3;
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
        attackCooldown: 0
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
