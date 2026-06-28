# 🎨 Pixel Art Assets (ComfyUI placeholders)

This folder holds the **pixel-art images** for the game. Everything here is a
**placeholder slot** — the game runs perfectly without any images (it falls back
to built‑in vector drawing). Drop a PNG into the right path and it is used
automatically, **no code changes required**.

## How it works

- The full list of slots lives in [`js/assets.js`](../js/assets.js) (`ASSET_LIST`).
- On startup the game tries to load every `src`. If a file is missing, that slot
  silently falls back to the procedural Canvas art.
- Images are drawn with `image-rendering: pixelated`, so low-res pixel art stays crisp.

## Recommended settings (ComfyUI)

- Format: **PNG with transparent background**
- Square canvas (e.g. **32×32, 48×48, or 64×64**)
- Centre the sprite; the game scales it to the entity size.

## Slot list & expected paths

| Category | File path | In‑game thing |
|----------|-----------|---------------|
| Hero | `assets/heroes/vanhelsing.png` | 范海辛 Van Helsing |
| Hero | `assets/heroes/carmilla.png` | 卡蜜拉 Carmilla |
| Hero | `assets/heroes/bella.png` | 貝拉 Bella |
| Hero | `assets/heroes/max.png` | 麥斯 Max |
| Enemy | `assets/enemies/skeleton.png` | 骷髏 |
| Enemy | `assets/enemies/zombie.png` | 殭屍 |
| Enemy | `assets/enemies/bat.png` | 蝙蝠 |
| Enemy | `assets/enemies/ghost.png` | 幽靈 |
| Enemy | `assets/enemies/spider.png` | 蜘蛛 |
| Enemy | `assets/enemies/werewolf.png` | 狼人 |
| Enemy | `assets/enemies/warlock.png` | 巫師（遠程）|
| Enemy | `assets/enemies/vampire.png` | 吸血鬼 |
| Enemy | `assets/enemies/drake.png` | 小龍（遠程）|
| Enemy | `assets/enemies/demon.png` | 魔王 Demon Lord |
| Boss | `assets/bosses/lich.png` | 巫妖 Lich |
| Boss | `assets/bosses/reaper.png` | 死神 Reaper |
| Weapon | `assets/weapons/knife.png` | 飛刀 |
| Weapon | `assets/weapons/fireball.png` | 火球 |
| Weapon | `assets/weapons/holywater.png` | 聖水 |
| Weapon | `assets/weapons/whip.png` | 聖鞭 |
| Weapon | `assets/weapons/stormblade.png` | 刀刃風暴（進化）|
| Weapon | `assets/weapons/inferno.png` | 煉獄火海（進化）|
| Weapon | `assets/weapons/deathspiral.png` | 死亡螺旋（進化）|
| Weapon | `assets/weapons/sanctuary.png` | 聖域（進化）|
| Pickup | `assets/pickups/gem.png` | 經驗寶石 XP Gem |

> To add or rename a slot, edit `ASSET_LIST` in `js/assets.js`.
