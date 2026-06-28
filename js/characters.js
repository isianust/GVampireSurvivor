/* =====================================================================
 * Characters 英雄 — named heroes with unique starting weapon, stats,
 * and a signature ultimate. Selected on the character-select screen.
 *
 * Each character provides `mods` applied on top of the base player:
 *   maxHp, speedMult, armor, regen, magnetRange (additive / multiplicative)
 * plus `startWeapon` and `ult` (ultimate id, see js/skills.js).
 * ===================================================================== */

/* Every hero now starts with a *ranged* default weapon (even melee-flavoured
 * classes), and carries its own 3 active skills (J / K / L) plus an ultimate.
 * `skills` lists the 3 skill ids in J, K, L order (see js/skills.js). */
var CHARACTERS = [
    {
        id: 'mage',
        name: '玄陰真人 Mage',
        title: '玄門術法 · 遠程爆發',
        desc: '修為通玄的術法宗師，內力外放化作真火。起手御出火球，招式以玄門術法掃蕩群敵，絕學引動九天隕星。',
        color: '#7a4fd0',
        startWeapon: 'fireball',
        ult: 'meteor',
        skills: ['m_blink', 'm_flame', 'm_frost'],
        mods: { maxHp: -20, speedMult: 0.1, armor: 0, regen: 0, magnetRange: 30 }
    },
    {
        id: 'sword',
        name: '神劍傲洲 Swordsman',
        title: '劍道宗師 · 攻守均衡',
        desc: '一柄長劍傲視九洲的劍道宗師。起手遙遙遞出劍氣，招式以劍勢突進、萬劍橫掃，絕學一式天外飛仙。',
        color: '#3b78c2',
        startWeapon: 'swordqi',
        ult: 'skyblade',
        skills: ['s_dash', 's_wave', 's_wind'],
        mods: { maxHp: 20, speedMult: 0, armor: 1, regen: 0, magnetRange: 0 }
    },
    {
        id: 'assassin',
        name: '夜無痕 Assassin',
        title: '暗影殺手 · 身法如電',
        desc: '來去無蹤、出手即殺的暗影殺手。起手暗器奪命，招式以鬼魅身法突進、一段擊殺取首級，絕學奪命無常掃全場。',
        color: '#b8434f',
        startWeapon: 'knife',
        ult: 'shadowkill',
        skills: ['a_step', 'a_onekill', 'a_vanish'],
        mods: { maxHp: -10, speedMult: 0.25, armor: 0, regen: 0, magnetRange: 20 }
    },
    {
        id: 'healer',
        name: '百草藥師 Apothecary',
        title: '丹道藥王 · 續航不竭',
        desc: '精通百草丹道、續航不竭的藥王。起手遙擲藥彈，招式以五毒煙瘴傷敵、回春甘露療己，絕學普渡慈航救人傷敵。',
        color: '#3fa56a',
        startWeapon: 'potion',
        ult: 'sweetdew',
        skills: ['h_retreat', 'h_toxin', 'h_dew'],
        mods: { maxHp: 30, speedMult: 0, armor: 0, regen: 0.5, magnetRange: 0, lifestealOnKill: 1 }
    }
];

/** Look up a character definition by id (defaults to first). */
function getCharacter(id) {
    for (var i = 0; i < CHARACTERS.length; i++) {
        if (CHARACTERS[i].id === id) return CHARACTERS[i];
    }
    return CHARACTERS[0];
}
