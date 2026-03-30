/* ===== Player ===== */

function createPlayer() {
    return {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        speed: 120,
        radius: 16,
        hp: 100,
        maxHp: 100,
        xp: 0,
        xpToLevel: 10,
        level: 1,
        invTimer: 0,          // invincibility after hit
        invDuration: 0.5,
        // Stats that can be upgraded
        armor: 0,
        regen: 0,             // HP per second
        magnetRange: 60,      // XP pickup range
        speedMult: 1.0
    };
}

function updatePlayer(player, dx, dy, dt) {
    // Normalize input
    var mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 1) {
        dx /= mag;
        dy /= mag;
    }
    var spd = player.speed * player.speedMult;
    player.vx = dx * spd;
    player.vy = dy * spd;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Invincibility timer
    if (player.invTimer > 0) {
        player.invTimer -= dt;
    }

    // Regen
    if (player.regen > 0) {
        player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
    }
}

/** Check if player can pick up a gem */
function canPickupGem(player, gem) {
    return dist(player, gem) < player.magnetRange + (gem.size || 5);
}

/** Add XP; returns true if leveled up */
function addXP(player, amount) {
    player.xp += amount;
    if (player.xp >= player.xpToLevel) {
        player.xp -= player.xpToLevel;
        player.level++;
        player.xpToLevel = Math.floor(player.xpToLevel * 1.35 + 5);
        return true;
    }
    return false;
}

/** Damage player */
function damagePlayer(player, amount) {
    if (player.invTimer > 0) return false;
    var dmg = Math.max(1, amount - player.armor);
    player.hp -= dmg;
    player.invTimer = player.invDuration;
    return true;
}
