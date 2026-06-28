/* =====================================================================
 * Asset Registry & Placeholder Loader
 * ---------------------------------------------------------------------
 * 像素圖資產清單 (ComfyUI placeholder list)
 *
 * 這是一個「集中清單」。每個遊戲物件（英雄、敵人、子彈、寶石…）都在
 * 下面 ASSET_LIST 登記一個 key 與圖片路徑 (src)。
 *
 * 用法 (How to add ComfyUI pixel art):
 *   1. 用 ComfyUI 產生像素圖 (建議透明背景 PNG)。
 *   2. 依下表的 `src` 路徑，把圖片放進 `assets/` 資料夾即可，
 *      例如  assets/enemies/skeleton.png 。
 *   3. 不需要改任何程式碼 — 有圖就自動用圖，沒圖就用內建向量繪製 (fallback)。
 *
 * 沒有圖片時不會報錯：載入失敗會標記為 missing，渲染器自動回退到
 * 原本的 Canvas 程序繪製。所以這份清單本身就是「placeholder」。
 * ===================================================================== */

var ASSET_LIST = [
    /* ---- Heroes 英雄 (key: char_<id>) ---- */
    { key: 'char_vanhelsing', category: 'hero', label: '范海辛 Van Helsing', src: 'assets/heroes/vanhelsing.png' },
    { key: 'char_carmilla', category: 'hero', label: '卡蜜拉 Carmilla', src: 'assets/heroes/carmilla.png' },
    { key: 'char_bella', category: 'hero', label: '貝拉 Bella', src: 'assets/heroes/bella.png' },
    { key: 'char_max', category: 'hero', label: '麥斯 Max', src: 'assets/heroes/max.png' },

    /* ---- Enemies 敵人 (key: enemy_<type>) ---- */
    { key: 'enemy_skeleton', category: 'enemy', label: '骷髏 Skeleton', src: 'assets/enemies/skeleton.png' },
    { key: 'enemy_zombie', category: 'enemy', label: '殭屍 Zombie', src: 'assets/enemies/zombie.png' },
    { key: 'enemy_bat', category: 'enemy', label: '蝙蝠 Bat', src: 'assets/enemies/bat.png' },
    { key: 'enemy_ghost', category: 'enemy', label: '幽靈 Ghost', src: 'assets/enemies/ghost.png' },
    { key: 'enemy_spider', category: 'enemy', label: '蜘蛛 Spider', src: 'assets/enemies/spider.png' },
    { key: 'enemy_werewolf', category: 'enemy', label: '狼人 Werewolf', src: 'assets/enemies/werewolf.png' },
    { key: 'enemy_warlock', category: 'enemy', label: '巫師 Warlock', src: 'assets/enemies/warlock.png' },
    { key: 'enemy_vampire', category: 'enemy', label: '吸血鬼 Vampire', src: 'assets/enemies/vampire.png' },
    { key: 'enemy_drake', category: 'enemy', label: '小龍 Drake', src: 'assets/enemies/drake.png' },
    { key: 'enemy_demon', category: 'enemy', label: '魔王 Demon Lord', src: 'assets/enemies/demon.png' },

    /* ---- Bosses 頭目 (key: enemy_<type>) ---- */
    { key: 'enemy_lich', category: 'boss', label: '巫妖 Lich', src: 'assets/bosses/lich.png' },
    { key: 'enemy_reaper', category: 'boss', label: '死神 Reaper', src: 'assets/bosses/reaper.png' },

    /* ---- Weapons / projectiles 武器子彈 (key: proj_<type>) ---- */
    { key: 'proj_knife', category: 'weapon', label: '飛刀 Knife', src: 'assets/weapons/knife.png' },
    { key: 'proj_fireball', category: 'weapon', label: '火球 Fireball', src: 'assets/weapons/fireball.png' },
    { key: 'proj_holywater', category: 'weapon', label: '聖水 Holy Water', src: 'assets/weapons/holywater.png' },
    { key: 'proj_whip', category: 'weapon', label: '聖鞭 Whip', src: 'assets/weapons/whip.png' },
    { key: 'proj_stormblade', category: 'weapon', label: '刀刃風暴 Storm Blade', src: 'assets/weapons/stormblade.png' },
    { key: 'proj_inferno', category: 'weapon', label: '煉獄火海 Inferno', src: 'assets/weapons/inferno.png' },
    { key: 'proj_deathspiral', category: 'weapon', label: '死亡螺旋 Death Spiral', src: 'assets/weapons/deathspiral.png' },
    { key: 'proj_sanctuary', category: 'weapon', label: '聖域 Sanctuary', src: 'assets/weapons/sanctuary.png' },

    /* ---- Pickups 拾取物 ---- */
    { key: 'gem', category: 'pickup', label: '經驗寶石 XP Gem', src: 'assets/pickups/gem.png' }
];

var Assets = {
    /** key -> { img, ready, missing } */
    map: {},
    enabled: true,

    /** Begin loading every asset in ASSET_LIST. Safe to call once at startup. */
    load: function () {
        if (typeof Image === 'undefined') { this.enabled = false; return; }
        for (var i = 0; i < ASSET_LIST.length; i++) {
            this._loadOne(ASSET_LIST[i]);
        }
    },

    _loadOne: function (entry) {
        var rec = { img: null, ready: false, missing: false, label: entry.label, src: entry.src };
        this.map[entry.key] = rec;
        try {
            var img = new Image();
            img.onload = function () { rec.img = img; rec.ready = true; };
            img.onerror = function () { rec.missing = true; }; // no placeholder file yet — fall back
            img.src = entry.src;
        } catch (e) {
            rec.missing = true;
        }
    },

    /** Return a ready <img> for a key, or null to signal "use procedural fallback". */
    get: function (key) {
        if (!this.enabled) return null;
        var rec = this.map[key];
        return rec && rec.ready ? rec.img : null;
    },

    /** True if this key has a real image loaded. */
    has: function (key) {
        var rec = this.map[key];
        return !!(rec && rec.ready);
    }
};
