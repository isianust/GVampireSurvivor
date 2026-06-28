/* =====================================================================
 * Characters 英雄 — named heroes with unique starting weapon, stats,
 * and a signature ultimate. Selected on the character-select screen.
 *
 * Each character provides `mods` applied on top of the base player:
 *   maxHp, speedMult, armor, regen, magnetRange (additive / multiplicative)
 * plus `startWeapon` and `ult` (ultimate id, see js/skills.js).
 * ===================================================================== */

var CHARACTERS = [
    {
        id: 'vanhelsing',
        name: '范海辛 Van Helsing',
        title: '吸血鬼獵人 · 全能型',
        desc: '均衡的老練獵人。起始飛刀，必殺技降下聖光審判全場。',
        color: '#3b5998',
        startWeapon: 'knife',
        ult: 'judgement',
        mods: { maxHp: 0, speedMult: 0, armor: 0, regen: 0, magnetRange: 0 }
    },
    {
        id: 'carmilla',
        name: '卡蜜拉 Carmilla',
        title: '墮落貴族 · 吸血型',
        desc: '以聖鞭起手，擊殺可回復生命，必殺技血月吞噬並治療自身。',
        color: '#aa2244',
        startWeapon: 'whip',
        ult: 'bloodmoon',
        mods: { maxHp: 20, speedMult: 0, armor: 0, regen: 0.5, magnetRange: 0, lifestealOnKill: 1 }
    },
    {
        id: 'bella',
        name: '貝拉 Bella',
        title: '見習法師 · 敏捷型',
        desc: '脆皮但靈活。起始火球，移動更快，必殺技召喚隕石風暴。',
        color: '#cc7722',
        startWeapon: 'fireball',
        ult: 'meteor',
        mods: { maxHp: -20, speedMult: 0.25, armor: 0, regen: 0, magnetRange: 40 }
    },
    {
        id: 'max',
        name: '麥斯 Max',
        title: '聖殿騎士 · 坦克型',
        desc: '厚血高甲、移動較慢。起始聖水，必殺技築起聖域震退全場。',
        color: '#557755',
        startWeapon: 'holywater',
        ult: 'fortress',
        mods: { maxHp: 60, speedMult: -0.15, armor: 2, regen: 0.25, magnetRange: 0 }
    }
];

/** Look up a character definition by id (defaults to first). */
function getCharacter(id) {
    for (var i = 0; i < CHARACTERS.length; i++) {
        if (CHARACTERS[i].id === id) return CHARACTERS[i];
    }
    return CHARACTERS[0];
}
