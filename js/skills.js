/* =====================================================================
 * Active Skills 主動技能 + Ultimates 必殺技
 * ---------------------------------------------------------------------
 * Movement (WASD) is unchanged. These are player-triggered abilities:
 *   J → Dash 衝刺   K → Nova 震波   L → Frost 冰封   U → Ultimate 必殺技
 *
 * Cooldowns live on the player (player.skillCd). The heavy lifting
 * (area damage, knockback, kills) is delegated to Game effect helpers so
 * the kill/XP pipeline stays in one place.
 * ===================================================================== */

/* Each skill maps to one of three base mechanics (`mech`): dash / nova / frost.
 * Characters pick three of these (see js/characters.js `skills`), shown on the
 * J / K / L slots in order. Casting a skill flashes its name above the hero. */
var SKILL_DEFS = {
    // Mage 魔法師
    m_blink: { id: 'm_blink', name: '瞬步 Blink', key: 'j', icon: '✨', cooldown: 3.0, mech: 'dash' },
    m_flame: { id: 'm_flame', name: '烈焰爆 Flame Burst', key: 'k', icon: '🔥', cooldown: 7.0, mech: 'nova' },
    m_frost: { id: 'm_frost', name: '寒冰陣 Frost Field', key: 'l', icon: '❄️', cooldown: 12.0, mech: 'frost' },
    // Swordsman 劍客
    s_dash: { id: 's_dash', name: '劍氣突 Blade Rush', key: 'j', icon: '💨', cooldown: 3.0, mech: 'dash' },
    s_wave: { id: 's_wave', name: '萬劍訣 Ten-Thousand Swords', key: 'k', icon: '🌀', cooldown: 7.0, mech: 'nova' },
    s_wind: { id: 's_wind', name: '流雲步 Cloud Step', key: 'l', icon: '🌫️', cooldown: 12.0, mech: 'frost' },
    // Assassin 刺客
    a_step: { id: 'a_step', name: '瞬影步 Shadow Step', key: 'j', icon: '💨', cooldown: 3.0, mech: 'dash' },
    a_onekill: { id: 'a_onekill', name: '一段擊殺 One-Strike Kill', key: 'k', icon: '🗡️', cooldown: 7.0, mech: 'nova' },
    a_vanish: { id: 'a_vanish', name: '隱遁 Vanish', key: 'l', icon: '🌑', cooldown: 12.0, mech: 'frost' },
    // Apothecary 藥師
    h_retreat: { id: 'h_retreat', name: '遁走 Retreat', key: 'j', icon: '💨', cooldown: 3.0, mech: 'dash' },
    h_toxin: { id: 'h_toxin', name: '毒煙 Toxic Cloud', key: 'k', icon: '☠️', cooldown: 7.0, mech: 'nova' },
    h_dew: { id: 'h_dew', name: '甘霖 Healing Dew', key: 'l', icon: '💧', cooldown: 12.0, mech: 'frost' },
    // Generic fallback skills (used if a character has no `skills` list)
    dash: { id: 'dash', name: '衝刺 Dash', key: 'j', icon: '💨', cooldown: 3.0, mech: 'dash' },
    nova: { id: 'nova', name: '震波 Nova', key: 'k', icon: '🌀', cooldown: 7.0, mech: 'nova' },
    frost: { id: 'frost', name: '冰封 Frost', key: 'l', icon: '❄️', cooldown: 12.0, mech: 'frost' }
};

/** Default skill loadout for characters without an explicit `skills` list. */
var DEFAULT_SKILLS = ['dash', 'nova', 'frost'];

/** Ultimate is gated by a fixed cooldown (seconds) instead of a charge meter. */
var ULT_COOLDOWN = 60;

/** Ultimate definitions keyed by character.ult. */
var ULT_DEFS = {
    meteor: { name: '隕石風暴 Meteor Storm', radius: 1000, dmgMult: 1.3, heal: 0, color: '#ff8c1a' },
    skyblade: { name: '天劍式 Sky Blade', radius: 1000, dmgMult: 1.2, heal: 0, color: '#9fd0ff' },
    shadowkill: { name: '影殺 Shadow Kill', radius: 950, dmgMult: 1.4, heal: 0, color: '#b070ff' },
    sweetdew: { name: '甘霖 Sweet Dew', radius: 900, dmgMult: 0.9, healPct: 0.4, color: '#66ffaa' },
    // Legacy ults kept for backward compatibility
    judgement: { name: '聖光審判 Judgement', radius: 1000, dmgMult: 1.0, heal: 0, color: '#ffe08a' },
    bloodmoon: { name: '血月 Blood Moon', radius: 900, dmgMult: 0.9, healPct: 0.4, color: '#ff3355' },
    fortress: { name: '聖域堡壘 Fortress', radius: 850, dmgMult: 0.8, shield: 2.5, color: '#7fd4ff' }
};

var Skills = {
    /** Decrement skill + ultimate cooldowns each frame. */
    update: function (player, dt) {
        if (player.skillCd) {
            for (var k in player.skillCd) {
                if (player.skillCd[k] > 0) player.skillCd[k] -= dt;
            }
        }
        if (player.ultCd > 0) player.ultCd -= dt;
    },

    ready: function (player, id) {
        return player.skillCd && (player.skillCd[id] || 0) <= 0;
    },

    /** Resolve the skill id bound to a J/K/L slot (0/1/2) for this player. */
    skillForSlot: function (player, slot) {
        var list = (player && player.skills) || DEFAULT_SKILLS;
        return list[slot];
    },

    /** Try to activate a skill by id; returns true if it fired. */
    activate: function (game, id) {
        var player = game.player;
        var def = SKILL_DEFS[id];
        if (!def || !this.ready(player, id)) return false;
        player.skillCd[id] = def.cooldown;

        var mech = def.mech || id;
        if (mech === 'dash') {
            game.dashPlayer();
        } else if (mech === 'nova') {
            game.areaDamage(player.x, player.y, 190, 30 + player.level * 4, true);
            game.addParticles(player.x, player.y, '#88ccff', 24);
        } else if (mech === 'frost') {
            game.slowArea(player.x, player.y, 650, 2.5);
            game.addParticles(player.x, player.y, '#aee4ff', 20);
        }
        // Flash the skill name above the hero
        game.addDamageNumber(player.x, player.y - player.radius - 18, def.name, '#9fe0ff', 16);
        return true;
    },

    ultReady: function (player) {
        return (player.ultCd || 0) <= 0;
    },

    /** Try to unleash the ultimate; returns true if it fired. */
    activateUlt: function (game) {
        var player = game.player;
        if (!this.ultReady(player)) return false;
        player.ultCd = ULT_COOLDOWN;
        player.ultCharge = 0;

        var def = ULT_DEFS[player.ultId] || ULT_DEFS.meteor;
        var dmg = (60 + player.level * 8) * def.dmgMult;

        game.areaDamage(player.x, player.y, def.radius, dmg, true);
        game.addParticles(player.x, player.y, def.color, 60);
        game.addDamageNumber(player.x, player.y - 30, def.name, def.color, 22);

        if (def.healPct) {
            player.hp = Math.min(player.maxHp, player.hp + player.maxHp * def.healPct);
        }
        if (def.heal) {
            player.hp = Math.min(player.maxHp, player.hp + def.heal);
        }
        if (def.shield) {
            player.invTimer = Math.max(player.invTimer, def.shield);
        }
        return true;
    }
};
