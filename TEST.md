# 🧪 TEST PLAN — GVampire Survivor 大改版測試計劃

> 對應 commit「武俠風命名 + 招式/升級/BOSS/角色數據表化（純 HTML `js/`）」。
> 呢個大改版主要喺純 HTML `js/` 引擎度，之前完全冇自動化測試覆蓋。
> 本計劃針對改版新增/改動嘅細節逐項立 case，目標 **最少 500 個 CASE**。

## 0. 範圍與方法 Scope & Method

- **被測對象（SUT）**：`js/` 目錄下嘅純 HTML 遊戲邏輯（assets / utils / characters /
  skills / enemies / player / weapons / game）。`renderer.js`、`input.js`（DOM/觸控）、
  `main.js`（啟動）屬視覺/事件層，唔喺單元測試範圍，但會用 stub 提供。
- **載入方式**：因為 `js/` 用純 global（冇 module export），用 Node `vm` sandbox
  載入（見 `tests/js/harness.ts`），提供 `window / navigator / document / performance /
  Image / Renderer / Input` 等 stub，再讀取真實 `js/*.js` 執行，攞返真正嘅
  function 同數據表去測。**測試嘅係真實出貨碼，唔係複製品。**
- **執行**：`npm test`（Vitest）。新增 case 全部放喺 `tests/js/*.test.ts`，
  與原有 `tests/*.test.ts`（TypeScript `src/`）並存，互不影響。
- **決定論**：凡涉及 `Math.random()` 嘅邏輯（spawn 權重、shuffle、holywater 落點），
  測試會 stub `Math.random` 或斷言「範圍 / 不變量」而非固定值。

## 1. 工具函數 Utils（`js/utils.js`）

| # | 區域 | 要點 |
|---|------|------|
| 1.1 | `clamp` | 範圍內 / 低於下限 / 高於上限 / min==max / 負範圍 |
| 1.2 | `dist` | 軸向、對角、零距離、對稱性、負座標 |
| 1.3 | `angleTo` | 四正方向、自身、對角象限 |
| 1.4 | `randInt` / `randFloat` | 全 stub random 邊界（0、近 1）落喺 `[min,max)` |
| 1.5 | `lerp` | t=0 / t=1 / t=0.5 / 外插 |
| 1.6 | `normalizeAngle` | 收斂到 `[-π,π]`、多圈、邊界 |
| 1.7 | `circleCollide` | 相交 / 相切 / 分離 / 預設半徑 |
| 1.8 | `hsl` / `rgba` | 有/無 alpha 字串格式 |
| 1.9 | `spawnOutsideView` | 四邊都喺視野外（用 stub random 控制 side）、margin |
| 1.10 | `formatTime` | 補零、分鐘、超過一小時、零、捨去小數 |
| 1.11 | `isMobileDevice` | navigator stub 下唔拋錯 |

## 2. 角色數據表 Characters（`js/characters.js`）

- 表 `CHARACTERS` 有 4 個英雄（mage / sword / assassin / healer）。
- 每個英雄逐項檢查：`id / name / title / desc / color` 非空；`startWeapon` 喺
  `WEAPON_DEFS`；`ult` 喺 `ULT_DEFS`；`skills` 長度為 3 且全部喺 `SKILL_DEFS`；
  `mods` 為物件。
- `id` 唯一；`name` 含中文武俠名。
- `getCharacter`：每個合法 id 取得正確物件；未知 id / undefined 回退第一個（mage）。

## 3. 招式與必殺 Skills（`js/skills.js`）

- 數據表 `SKILL_DEFS`（15 條）逐條：有 `id/name/key/icon/cooldown/mech`；
  `key` ∈ {j,k,l}；`mech` ∈ {dash,nova,frost}；`cooldown > 0`；
  按 mech 必備欄位（dash→dist/inv；nova→radius/dmgBase/dmgScale；frost→radius/dur）。
- `id` 與表 key 一致。
- `ULT_DEFS`（7 條）逐條：`name/radius/dmgBase/dmgScale/dmgMult` 合理；治療類有
  `healPct`/`heal`；`fortress` 有 `shield`。
- `DEFAULT_SKILLS = [dash,nova,frost]`；`ULT_COOLDOWN = 60`。
- `Skills.update`：遞減 `skillCd` 各槽同 `ultCd`，唔會減到負無窮以外問題。
- `Skills.ready` / `ultReady`：cd<=0 為 ready。
- `skillForSlot`：有/無 `skills` 時嘅 slot 對應。
- `activate`：未 ready 返回 false；ready 觸發後上 cooldown；dash/nova/frost 各自
  呼叫對應 Game helper（用 spy 驗證）；frost 有 `heal` 時回血並夾 maxHp。
- `activateUlt`：未 ready false；ready 後 ultCd=60、清 ultCharge；傷害公式
  `(dmgBase+level*dmgScale)*dmgMult`；`healPct`/`heal`/`shield` 各分支生效。

## 4. 敵人數據表與工廠 Enemies（`js/enemies.js`）

- `ENEMY_TYPES`（12 種，含 2 BOSS lich/reaper）逐種：`hp/speed/damage/radius/xp>0`、
  `color` 格式、有中文 `cn`、`minTime>=0`；BOSS `minTime` 為極大值（唔會被一般 spawner 抽到）。
- `RANGED_ENEMIES`（warlock/drake/lich/reaper）逐個欄位合理且其 key 喺 `ENEMY_TYPES`。
- `BOSS_ABILITIES`（demon/lich/reaper）逐個：`enrage` 三欄、`summon` 四欄、
  `summon.type` 喺 `ENEMY_TYPES`。
- `createEnemy`：基本欄位複製；HP 隨 `elapsed` 階梯式縮放
  （`scale = 1 + floor(elapsed/60)*0.3`）；ranged 敵有 `ranged`/`rangeTimer`；melee 為 null；
  `isBoss=false`、`hitTimer/attackCooldown/slowTimer=0`。
- `getAvailableEnemyTypes`：唔同 `elapsed`（0/15/30/45/60/90/120/150/180）開放正確類型，
  BOSS 永遠唔包含。
- `pickEnemyType`：回傳恆為可用類型；空可用時回 `skeleton`；stub random 驗證權重邊界
  （roll=0 取第一、roll→total 取最後）。

## 5. 玩家 Player（`js/player.js`）

- `createPlayer`：預設值（speed120/radius16/hp=maxHp=100/level1/xpToLevel10…）；
  逐個角色套 `mods`（maxHp/armor/regen/magnetRange/speedMult/lifestealOnKill）後數值正確；
  `skills` 來自角色、每招初始化 cd=0；`ultId` 來自角色；無角色時用 mage 預設。
- `updatePlayer`：對角輸入正規化（速度量級守恆）；記低 facing；dash 期間 3.2× 加速並遞減
  `dashTimer`；`invTimer` 遞減；`regen` 回血夾 maxHp；零輸入唔郁。
- `canPickupGem`：距離 < `magnetRange + gem.size`（有/無 size）。
- `addXP`：累積；達標升級、扣減、`xpToLevel = floor(old*1.35+5)`、回傳 true；未達回 false；
  連升多級序列正確。
- `damagePlayer`：無敵中回 false；扣血 = `max(1, dmg-armor)`；最低傷 1；命中後設無敵。

## 6. 武器系統 Weapons（`js/weapons.js`）

- 數據表 `WEAPON_DEFS`（含 swordqi/potion）、`EVOLVED_DEFS`（4）、`EVOLUTIONS`（4）、
  `UPGRADE_POOL`（11）逐項欄位健全；`EVOLUTIONS.a/b/result` 對應到正確表；
  `UPGRADE_POOL.stat` 全部喺 player 已支援欄位；`MAX_WEAPON_LEVEL=8`、`INFINITE_PIERCING=999`。
- `createWeaponState`：基本武器與進化武器都解析到 `def`；level1 cd/damage/count；
  `getDamage = base + (lv-1)*4`、`getCooldown = max(0.2, base-(lv-1)*0.08)`、
  `getCount = base + floor((lv-1)/3)`，逐 level 1..8 驗證。
- `findNearestEnemy`：空陣回 null；多敵取最近；同距穩定。
- `fireWeapons`：cooldown 未到唔開火；到咗重置 cd 並產生 `count` 顆；knife/fireball
  追最近敵、多發有散射、fireball piercing=2；holywater 落點喺 ±80、tick 設定、無限穿透；
  whip 跟玩家、無限穿透、左右交替；無敵人時 knife/fireball 唔產生彈、holywater 照落。
- `updateProjectile`：life 遞減、到 0 死亡；移動位移；followPlayer 鎖玩家位；tickTimer 遞減。
- `checkProjectileHit`：已命中過唔重複；圓形彈用半徑和；whip 用扇形（範圍 + 角度 < π/2）。
- `generateUpgradeOptions`：最多 3 項；未滿級武器有強化項；未擁有且 <4 把有新武器項；
  屬性升級全部由 `UPGRADE_POOL` 帶出（apply 改對應 stat，maxHp 同步補血）；
  進化條件（a 滿級 + 擁有 b）滿足時進化項置頂；進化 apply 會移除 a/b 加入 result。

## 7. 資產清單 Assets（`js/assets.js`）

- `ASSET_LIST` key 唯一；每條有 `key/category/label/src`；`src` 在 `assets/` 下且
  副檔名 `.png`；category ∈ {hero,enemy,boss,weapon,pickup}。
- 覆蓋完整：每個 `CHARACTERS` 有 `char_<id>`；每個非 BOSS `ENEMY_TYPES` 有 `enemy_<type>`；
  BOSS 有對應 boss 資產；每個 `EVOLVED_DEFS.assetKey` 喺清單。
- `Assets.get`/`has`：未載入時 `get` 回 null（觸發 procedural fallback）、`has` false；
  `enabled=false` 時 `get` 回 null。

## 8. 核心遊戲迴圈 Game（`js/game.js`）

- 排程數據表 `BOSS_SCHEDULE`（4）、`BOSS_KILL_SCHEDULE`（4）、`BOSS_ROTATION`、
  `BOSS_INTERVAL=150`、`BOSS_KILL_INTERVAL=300` 健全。
- `init`：state=playing；建立玩家（按角色起手武器）；清空各陣列；開場爆 16 敵；
  排程指標歸零。
- `spawnBoss`：HP ×(3×hpMult)、半徑 ×1.4、`isBoss=true`、附 `BOSS_ABILITIES`（如有）；
  附 `bossLabel`。
- `updateBossSchedule`：到時間放固定 BOSS、之後進入無限輪替（HP 遞增）。
- `updateKillBossSchedule`：到擊殺門檻（50/100/200/500）放對應級別 BOSS；之後每 +300 殺再放。
- `areaDamage`：半徑內敵受傷，`includeBoss=false` 跳過 BOSS。
- `slowArea`：半徑內敵 `slowTimer` 設為較大值（frost 減速）。
- `hitEnemy` / `killEnemy`：扣血、擊殺 → kills++、掉寶（顏色按 xp 分級）、加 ultCharge
  （BOSS+25 / 一般+3，夾 ultMax）、`lifestealOnKill` 回血、由陣列移除。
- `updateEnemies`：向玩家移動、slow 0.25×、ranged 開火、BOSS 能力（暴怒一次 + 召喚上限）、
  碰撞傷害 + 擊退、vampire 吸血、遠離 1200 移除（BOSS 留場）。
- `dashPlayer`：沿 lastDir/facing 位移、設 dashTimer/invTimer。
- `updateGems`：吸附、撿到加 XP，升級觸發 `showLevelUp`（state=levelup）。
- `addXP`→爆等→升級面板 state 流轉。

## 9. 通過準則 Exit Criteria

- `npm test` 全綠，**總 case 數 ≥ 500**（原有 225 + 新增 js/ 改版 ≥ 約 300，合計 ≥ 500）。
- 所有數據表（角色/招式/必殺/敵人/BOSS能力/武器/進化/升級池/資產）交叉引用一致、無懸空 key。
- 改版核心邏輯（排程 BOSS、招式公式、武器進化、升級數據化）行為有 case 鎖定。

> 執行結果（RESULT）：見執行後在本檔尾或 PR 描述附上 `npm test` 摘要。

## 10. 執行結果 TEST PLAN RESULT

執行指令：`npm test`（Vitest run）。

```
 ✓ tests/js/utils.test.ts        (124 tests)
 ✓ tests/js/characters.test.ts   (76 tests)
 ✓ tests/js/skills.test.ts       (174 tests)
 ✓ tests/js/enemies.test.ts      (202 tests)
 ✓ tests/js/player.test.ts       (86 tests)
 ✓ tests/js/weapons.test.ts      (177 tests)
 ✓ tests/js/assets.test.ts       (153 tests)
 ✓ tests/js/game.test.ts         (58 tests)
   ── 新增（大改版 js/）小計：1050 tests ──
 ✓ tests/utils.test.ts           (63 tests)   ← 原有 src/ 測試
 ✓ tests/weapons.test.ts         (42 tests)
 ✓ tests/player.test.ts          (36 tests)
 ✓ tests/StateMachine.test.ts    (26 tests)
 ✓ tests/EventBus.test.ts        (22 tests)
 ✓ tests/enemies.test.ts         (19 tests)
 ✓ tests/config.test.ts          (17 tests)

 Test Files  15 passed (15)
      Tests  1275 passed (1275)
```

- **總 CASE 數：1275（全綠）**，其中針對大改版 `js/` 新增 **1050** 個，
  遠超「最少 500 個 CASE」嘅要求。
- 大改版每張數據表（角色/招式/必殺/敵人/遠程/BOSS能力/武器/進化/升級池/資產/排程）
  都有交叉引用一致性 case；核心邏輯（招式與必殺傷害公式、武器升級/進化、
  時間與擊殺雙軌 BOSS 排程、敵人 HP 縮放、撿寶升級流程）都有 case 鎖定。
- 測試透過 `tests/js/harness.ts` 用 Node `vm` 載入真實 `js/*.js` 出貨碼執行，
  並非複製品；對 `Math.random` 採 stub/不變量斷言，保持決定論。

