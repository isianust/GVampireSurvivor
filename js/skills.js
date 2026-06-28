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
 * J / K / L slots in order. Casting a skill flashes its name above the hero.
 *
 * 數值全部寫進表，唔再 hardcode 喺 activate() —— 加新招 / 調平衡只改呢張表：
 *   dash : { dist 位移距離, inv 無敵秒數 }
 *   nova : { radius 範圍, dmgBase 基礎傷害, dmgScale 每級加成, color 粒子色 }
 *   frost: { radius 範圍, dur 冰凍秒數, heal 治療(佔最大HP百分比), color 粒子色 } */
var SKILL_DEFS = {
    // Mage 玄陰真人
    m_blink: { id: 'm_blink', name: '踏雪無痕 Snow Step', key: 'j', icon: '✨', cooldown: 3.0, mech: 'dash', dist: 120, inv: 0.4 },
    m_flame: { id: 'm_flame', name: '烈焰焚天訣 Flame Burst', key: 'k', icon: '🔥', cooldown: 7.0, mech: 'nova', radius: 200, dmgBase: 30, dmgScale: 4, color: '#ff8c1a' },
    m_frost: { id: 'm_frost', name: '玄冰寒陣 Frost Field', key: 'l', icon: '❄️', cooldown: 12.0, mech: 'frost', radius: 650, dur: 2.5, color: '#aee4ff' },
    // Swordsman 神劍傲洲
    s_dash: { id: 's_dash', name: '驚鴻一劍 Startling Swan', key: 'j', icon: '💨', cooldown: 3.0, mech: 'dash', dist: 130, inv: 0.45 },
    s_wave: { id: 's_wave', name: '萬劍歸宗 Ten-Thousand Swords', key: 'k', icon: '🌀', cooldown: 7.0, mech: 'nova', radius: 210, dmgBase: 34, dmgScale: 4, color: '#9fd0ff' },
    s_wind: { id: 's_wind', name: '踏雲縱 Cloud Tread', key: 'l', icon: '🌫️', cooldown: 12.0, mech: 'frost', radius: 650, dur: 2.5, color: '#cfe8ff' },
    // Assassin 夜無痕
    a_step: { id: 'a_step', name: '鬼魅身法 Phantom Step', key: 'j', icon: '💨', cooldown: 3.0, mech: 'dash', dist: 150, inv: 0.5 },
    a_onekill: { id: 'a_onekill', name: '一段擊殺 One-Strike Kill', key: 'k', icon: '🗡️', cooldown: 7.0, mech: 'nova', radius: 190, dmgBase: 40, dmgScale: 5, color: '#b070ff' },
    a_vanish: { id: 'a_vanish', name: '潛影匿蹤 Vanish', key: 'l', icon: '🌑', cooldown: 12.0, mech: 'frost', radius: 600, dur: 3.0, color: '#9a7bd0' },
    // Apothecary 百草藥師
    h_retreat: { id: 'h_retreat', name: '金蟬脫殼 Cicada Escape', key: 'j', icon: '💨', cooldown: 3.0, mech: 'dash', dist: 120, inv: 0.5 },
    h_toxin: { id: 'h_toxin', name: '五毒煙瘴 Toxic Cloud', key: 'k', icon: '☠️', cooldown: 7.0, mech: 'nova', radius: 200, dmgBase: 26, dmgScale: 3, color: '#88cc55' },
    h_dew: { id: 'h_dew', name: '回春甘露 Healing Dew', key: 'l', icon: '💧', cooldown: 12.0, mech: 'frost', radius: 650, dur: 2.5, heal: 0.18, color: '#66ffaa' },
    // Generic fallback skills (used if a character has no `skills` list)
    dash: { id: 'dash', name: '疾風步 Dash', key: 'j', icon: '💨', cooldown: 3.0, mech: 'dash', dist: 110, inv: 0.4 },
    nova: { id: 'nova', name: '震天罡 Nova', key: 'k', icon: '🌀', cooldown: 7.0, mech: 'nova', radius: 190, dmgBase: 30, dmgScale: 4, color: '#88ccff' },
    frost: { id: 'frost', name: '寒霜訣 Frost', key: 'l', icon: '❄️', cooldown: 12.0, mech: 'frost', radius: 650, dur: 2.5, color: '#aee4ff' }
};

/** Default skill loadout for characters without an explicit `skills` list. */
var DEFAULT_SKILLS = ['dash', 'nova', 'frost'];

/** Ultimate is gated by a fixed cooldown (seconds) instead of a charge meter. */
var ULT_COOLDOWN = 60;

/** Ultimate definitions keyed by character.ult.
 * 傷害公式入表：dmg = (dmgBase + level * dmgScale) * dmgMult —— 唔再 hardcode。 */
var ULT_DEFS = {
    meteor: { name: '九天隕星訣 Meteor Storm', radius: 1000, dmgBase: 60, dmgScale: 8, dmgMult: 1.3, heal: 0, color: '#ff8c1a' },
    skyblade: { name: '天外飛仙 Sky Blade', radius: 1000, dmgBase: 60, dmgScale: 8, dmgMult: 1.2, heal: 0, color: '#9fd0ff' },
    shadowkill: { name: '奪命無常 Shadow Kill', radius: 950, dmgBase: 60, dmgScale: 8, dmgMult: 1.4, heal: 0, color: '#b070ff' },
    sweetdew: { name: '普渡慈航 Sweet Dew', radius: 900, dmgBase: 60, dmgScale: 8, dmgMult: 0.9, healPct: 0.4, color: '#66ffaa' },
    // Legacy ults kept for backward compatibility
    judgement: { name: '天道輪迴 Judgement', radius: 1000, dmgBase: 60, dmgScale: 8, dmgMult: 1.0, heal: 0, color: '#ffe08a' },
    bloodmoon: { name: '血月狂瀾 Blood Moon', radius: 900, dmgBase: 60, dmgScale: 8, dmgMult: 0.9, healPct: 0.4, color: '#ff3355' },
    fortress: { name: '金鐘罩 Fortress', radius: 850, dmgBase: 60, dmgScale: 8, dmgMult: 0.8, shield: 2.5, color: '#7fd4ff' }
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
            game.dashPlayer(def.dist, def.inv);
        } else if (mech === 'nova') {
            var radius = def.radius || 190;
            var dmg = (def.dmgBase || 30) + player.level * (def.dmgScale || 4);
            game.areaDamage(player.x, player.y, radius, dmg, true);
            game.addParticles(player.x, player.y, def.color || '#88ccff', 24);
        } else if (mech === 'frost') {
            game.slowArea(player.x, player.y, def.radius || 650, def.dur || 2.5);
            game.addParticles(player.x, player.y, def.color || '#aee4ff', 20);
            if (def.heal) {
                player.hp = Math.min(player.maxHp, player.hp + player.maxHp * def.heal);
            }
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
        var dmg = ((def.dmgBase || 60) + player.level * (def.dmgScale || 8)) * def.dmgMult;

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
