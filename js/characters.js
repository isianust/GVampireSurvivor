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
        name: '魔法師 Mage',
        title: '元素法師 · 遠程爆發',
        desc: '脆皮高傷的遠程法師。起始火球，技能以元素法術掃場，必殺技召喚隕石風暴。',
        color: '#7a4fd0',
        startWeapon: 'fireball',
        ult: 'meteor',
        skills: ['m_blink', 'm_flame', 'm_frost'],
        mods: { maxHp: -20, speedMult: 0.1, armor: 0, regen: 0, magnetRange: 30 }
    },
    {
        id: 'sword',
        name: '劍客 Swordsman',
        title: '劍術宗師 · 均衡',
        desc: '攻守均衡的劍客。起始遠程劍氣，技能以劍勢突進與橫掃，必殺技天劍式。',
        color: '#3b78c2',
        startWeapon: 'swordqi',
        ult: 'skyblade',
        skills: ['s_dash', 's_wave', 's_wind'],
        mods: { maxHp: 20, speedMult: 0, armor: 1, regen: 0, magnetRange: 0 }
    },
    {
        id: 'assassin',
        name: '刺客 Assassin',
        title: '暗影殺手 · 敏捷',
        desc: '快速靈巧的刺客。起始暗器飛刀，技能瞬影突進與一段擊殺，必殺技影殺全場。',
        color: '#b8434f',
        startWeapon: 'knife',
        ult: 'shadowkill',
        skills: ['a_step', 'a_onekill', 'a_vanish'],
        mods: { maxHp: -10, speedMult: 0.25, armor: 0, regen: 0, magnetRange: 20 }
    },
    {
        id: 'healer',
        name: '藥師 Apothecary',
        title: '丹道藥師 · 續航',
        desc: '高續航的支援藥師。起始遠程藥彈，技能投毒與療傷，必殺技甘霖治療並傷敵。',
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
