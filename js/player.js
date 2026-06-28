/* ===== Player ===== */

function createPlayer(character) {
    var c = character || (typeof getCharacter === 'function' ? getCharacter('mage') : null);
    var mods = (c && c.mods) || {};
    var ult = (c && c.ult) || 'judgement';
    var player = {
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
        speedMult: 1.0,
        // Character identity
        charId: (c && c.id) || 'mage',
        color: (c && c.color) || '#3b5998',
        lifestealOnKill: mods.lifestealOnKill || 0,
        // Active skills (cooldowns in seconds) + facing for dash.
        // `skills` is the J/K/L loadout for this character.
        skills: (c && c.skills) || (typeof DEFAULT_SKILLS !== 'undefined' ? DEFAULT_SKILLS : ['dash', 'nova', 'frost']),
        skillCd: {},
        facingX: 1,
        facingY: 0,
        dashTimer: 0,
        // Ultimate / 必殺技 — now gated by a fixed cooldown (seconds)
        ultId: ult,
        ultCharge: 0,
        ultMax: 100,
        ultCd: 0
    };

    // Initialise a cooldown slot for each equipped skill
    for (var si = 0; si < player.skills.length; si++) {
        player.skillCd[player.skills[si]] = 0;
    }

    // Apply character stat modifiers
    player.maxHp += (mods.maxHp || 0);
    player.hp = player.maxHp;
    player.armor += (mods.armor || 0);
    player.regen += (mods.regen || 0);
    player.magnetRange += (mods.magnetRange || 0);
    player.speedMult += (mods.speedMult || 0);

    return player;
}

function updatePlayer(player, dx, dy, dt) {
    // Normalize input
    var mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 1) {
        dx /= mag;
        dy /= mag;
    }
    // Remember facing direction (for Dash) when moving
    if (mag > 0.01) {
        var fl = Math.sqrt(dx * dx + dy * dy) || 1;
        player.facingX = dx / fl;
        player.facingY = dy / fl;
    }
    var spd = player.speed * player.speedMult;
    // Dash burst overrides normal movement briefly
    if (player.dashTimer > 0) {
        player.dashTimer -= dt;
        spd *= 3.2;
    }
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
