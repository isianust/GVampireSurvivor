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

var SKILL_DEFS = {
    dash: { id: 'dash', name: '衝刺 Dash', key: 'j', icon: '💨', cooldown: 3.0 },
    nova: { id: 'nova', name: '震波 Nova', key: 'k', icon: '🌀', cooldown: 7.0 },
    frost: { id: 'frost', name: '冰封 Frost', key: 'l', icon: '❄️', cooldown: 12.0 }
};

/** Ordered list for HUD rendering. */
var SKILL_ORDER = ['dash', 'nova', 'frost'];

/** Ultimate definitions keyed by character.ult. */
var ULT_DEFS = {
    judgement: { name: '聖光審判 Judgement', radius: 1000, dmgMult: 1.0, heal: 0, color: '#ffe08a' },
    bloodmoon: { name: '血月 Blood Moon', radius: 900, dmgMult: 0.9, healPct: 0.4, color: '#ff3355' },
    meteor: { name: '隕石風暴 Meteor Storm', radius: 1000, dmgMult: 1.3, heal: 0, color: '#ff8c1a' },
    fortress: { name: '聖域堡壘 Fortress', radius: 850, dmgMult: 0.8, shield: 2.5, color: '#7fd4ff' }
};

var Skills = {
    /** Decrement cooldowns each frame. */
    update: function (player, dt) {
        if (!player.skillCd) return;
        for (var k in player.skillCd) {
            if (player.skillCd[k] > 0) player.skillCd[k] -= dt;
        }
    },

    ready: function (player, id) {
        return player.skillCd && (player.skillCd[id] || 0) <= 0;
    },

    /** Try to activate a skill; returns true if it fired. */
    activate: function (game, id) {
        var player = game.player;
        var def = SKILL_DEFS[id];
        if (!def || !this.ready(player, id)) return false;
        player.skillCd[id] = def.cooldown;

        if (id === 'dash') {
            game.dashPlayer();
        } else if (id === 'nova') {
            game.areaDamage(player.x, player.y, 190, 30 + player.level * 4, true);
            game.addParticles(player.x, player.y, '#88ccff', 24);
        } else if (id === 'frost') {
            game.slowArea(player.x, player.y, 650, 2.5);
            game.addParticles(player.x, player.y, '#aee4ff', 20);
        }
        return true;
    },

    ultReady: function (player) {
        return player.ultCharge >= player.ultMax;
    },

    /** Try to unleash the ultimate; returns true if it fired. */
    activateUlt: function (game) {
        var player = game.player;
        if (!this.ultReady(player)) return false;
        player.ultCharge = 0;

        var def = ULT_DEFS[player.ultId] || ULT_DEFS.judgement;
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
