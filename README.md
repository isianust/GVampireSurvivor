# 🧛 GVampire Survivor V3

[![CI](https://github.com/isianust/GVampireSurvivor/actions/workflows/ci.yml/badge.svg)](https://github.com/isianust/GVampireSurvivor/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

A **Vampire Survivors–style** HTML5 game. Pick a named hero, survive endless
waves, fire active skills, charge your ultimate, evolve your weapons, and fight
escalating bosses.

> 🟢 **Pure HTML — no install, no build.** Just open `index.html` in any modern
> browser and play. The game runs on a hand-written Canvas 2D engine in plain
> JavaScript (`js/`), with **zero dependencies**.

---

## 🎮 Play Now

**Option A — no install (recommended):**

Just open `index.html` in a browser (double-click it, or serve the folder with
any static server). That's it.

**Option B — dev server (for live-reload while editing):**

```bash
npm install
npm run dev
```

---

## ✨ Features

### 🦸 Heroes (named classes)
Choose 1 of 4 classes — **every class starts with a ranged default attack** —
each with its own stats, three active skills, and a signature ultimate
(ultimate is on a **60s cooldown**):
- **玄陰真人 Mage** — glass cannon; ranged 烈火真訣 Inferno Orb; ult *九天隕星訣 Meteor Storm*
- **神劍傲洲 Swordsman** — balanced; ranged 凌厲劍氣 Sword Qi; ult *天外飛仙 Sky Blade*
- **夜無痕 Assassin** — fast; ranged 奪命飛刀 Throwing Knife; ult *奪命無常 Shadow Kill*
- **百草藥師 Apothecary** — high sustain; ranged 霹靂藥彈 Potion Bomb; ult *普渡慈航 Sweet Dew*

### ⚡ Active skills + 💥 Ultimate (you're in control)
Movement is **WASD / arrows**; abilities are triggered by you. Each class has its
own three skills shown on the J / K / L slots (the skill's name flashes above the
hero when cast):
- **J / K / L** — the class's three active skills (dash, area burst, slow/utility)
- **U — Ultimate 必殺技** (screen-clearing blast, **60-second cooldown**)

### 🔀 Weapon evolution (2 → 1)
Max out a base weapon and own its partner to **fuse them into one** stronger
evolved weapon: Storm Blade, Inferno, Death Spiral, Sanctuary.

### 👾 Enemies, ranged attacks & escalating bosses
- 10 enemy types; **Warlock / Drake** now fire ranged projectiles
- Scheduled bosses (Demon Lord, **Lich**, **Reaper**) then an **endless** boss
  rotation with rising HP — longer runs stay intense

### 🎨 Pixel-art ready (ComfyUI)
Every hero / enemy / weapon / gem has a **placeholder image slot**. Drop a PNG
into `assets/` and it's used automatically — otherwise the built-in vector art is
used. See [`assets/README.md`](assets/README.md) and `js/assets.js`.

### 📱 Controls
- **Move** — WASD or Arrow Keys (mobile: left-side virtual joystick)
- **Skills / Ultimate** — J / K / L / U (mobile: on-screen buttons)
- **Auto-Attack** — weapons fire automatically at the nearest enemy

---

## 🏗️ Architecture

This repo contains **two parallel implementations** of the same game:

- **`js/` — the pure-HTML runtime that actually ships** (loaded by `index.html`).
  Plain-JavaScript globals, a hand-written Canvas 2D engine, **no build, no
  dependencies**. This is where V3 gameplay (heroes, skills, ultimate, evolution,
  bosses, ranged enemies, pixel-art slots) lives.
- **`src/` — a TypeScript mirror of the core logic** used for **unit tests
  (225 tests)**, linting and type-checking via Vite/Vitest. Great for verifying
  pure game logic; not required to play.

```
GVampireSurvivor/
├── index.html                  # Entry point — loads the js/ pure-HTML build
├── js/                         # ▶ Playable build (no install / no build)
│   ├── assets.js               #   Pixel-art asset LIST + placeholder loader (ComfyUI)
│   ├── characters.js           #   Named heroes (start weapon / stats / ultimate)
│   ├── skills.js               #   Active skills (J/K/L) + ultimates (U)
│   ├── enemies.js              #   Enemy + boss defs, ranged-enemy config
│   ├── player.js               #   Player state, movement, dash, charge
│   ├── weapons.js              #   Weapons, evolution (2→1), upgrades
│   ├── input.js                #   Keyboard + edge presses + touch joystick/buttons
│   ├── renderer.js             #   Canvas 2D renderer (+ sprite override hooks)
│   ├── game.js                 #   Core loop, bosses, skills, enemy projectiles
│   └── main.js                 #   Bootstrap + character-select flow
├── assets/                     # Pixel-art drop folder (see assets/README.md)
├── src/                        # TypeScript logic mirror (unit-tested)
├── tests/                      # Vitest unit tests (225 tests)
├── css/style.css               # Responsive styles, overlays, skills/ult HUD
├── game.js                     # Legacy Phaser prototype (no longer loaded)
├── vite.config.ts              # Vite config (dev server / tests)
└── .github/workflows/ci.yml    # GitHub Actions CI pipeline
```

### Design Patterns

| Pattern | Usage |
|---------|-------|
| **Centralised Config** | All magic numbers in `game.config.ts` |
| **Factory Functions** | `createPlayer()`, `createEnemy()`, `createWeaponState()` |
| **EventBus** | Decoupled pub/sub communication |
| **State Machine** | Game state management with guards & hooks |
| **Pure Functions** | Utility functions with zero side effects |

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| **TypeScript** | Type-safe development |
| **Vite** | Fast dev server + production build |
| **Vitest** | Unit testing (225 tests) |
| **ESLint** | Code quality & consistency |
| **Prettier** | Code formatting |
| **GitHub Actions** | CI/CD pipeline |
| **Canvas 2D** | Game rendering |

---

## 🚀 Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Preview production build
npm run preview
```

### CI/CD

Every push and PR triggers:
1. **Lint** — ESLint checks
2. **Format** — Prettier verification
3. **Type Check** — TypeScript compilation
4. **Test** — Full test suite (225 tests)
5. **Build** — Production build verification

---

## ✅ End-to-End Test (Verified) / 端對端測試

The full game was play-tested **end to end** in a real browser — you can play it
with the **keyboard**, and it runs as **pure HTML** with no build step.
本遊戲已在真實瀏覽器中完整「端對端」實測：可用**鍵盤**遊玩，並能以**純 HTML**
直接開啟（不需編譯）。

### How to play & test by hand / 手動遊玩與測試

1. **Open the game (pure HTML):** double-click `index.html`, *or* serve the
   folder and browse to it:
   ```bash
   python3 -m http.server 8099   # then open http://localhost:8099/index.html
   ```
   (`npm run dev` also works for live-reload.)
2. On the intro screen press **⚔️ 選擇英雄 / CHOOSE HERO**.
3. Pick **1 of the 4 heroes** — the HUD appears and the run starts.
4. **Move** with **WASD** or the **arrow keys**.
5. **Fire skills / ultimate** with the keys below; weapons auto-attack the
   nearest enemy.
6. **Level up:** collect XP gems, then **click** an upgrade card.
7. Survive the waves & bosses until **GAME OVER**, then press
   **🔄 再試一次 / RETRY** to play again.

### ⌨️ Keyboard controls (verified) / 鍵盤操作（已驗證）

| Key 按鍵 | Action 動作 |
|----------|-------------|
| **W A S D** / **↑ ↓ ← →** | Move 移動 |
| **J** | Dash 衝刺 |
| **K** | Nova 震波 |
| **L** | Frost 冰封 |
| **U** *(or* **Space** *)* | Ultimate 必殺技（能量集滿後可用） |

> 💡 Level-up upgrades are chosen by **mouse / touch click** on a card.
> 升級選項目前以**滑鼠 / 觸控點擊**卡片選擇。

### Verified result / 實測結果

- ✅ Loads as **pure HTML** (`index.html`) with **no build / no install**.
- ✅ Hero select → HUD → gameplay → level-up → game-over → retry all work.
- ✅ Movement (WASD / arrows) and skills (J / K / L / U / Space) respond to the
  **keyboard**; enemies spawn and weapons auto-attack.
- ✅ Logic suite passes: **225 unit tests**, plus ESLint, type-check and build.
- ℹ️ Missing pixel-art PNGs in `assets/` log harmless `404`s and **fall back to
  built-in vector art** by design (see `js/assets.js`) — not an error.

> The unit tests (`npm test`) cover the pure game logic in `src/`. The keyboard /
> HTML playthrough above is the manual end-to-end check for the shipping `js/`
> runtime.

---

## 📱 Mobile Support

- Responsive canvas that fills the screen
- Virtual joystick appears on mobile devices
- Touch-optimised UI buttons and overlays
- Prevents default touch scrolling during gameplay
- Media queries for phones (600px), small phones (400px), and landscape mode (450px height)

---

## 🗺️ Roadmap

- [x] Multiple playable characters (named heroes)
- [x] Active skills + ultimate abilities
- [x] Weapon evolution system (combine two weapons)
- [x] Additional bosses + endless boss rotation
- [x] Ranged enemy attacks
- [x] Pixel-art asset slots (ComfyUI placeholders)
- [ ] Sound effects with Web Audio API
- [ ] Save/load system with LocalStorage
- [ ] Multiple maps with terrain
- [ ] Online leaderboard
- [ ] PWA support for offline play
- [ ] Achievement system

---

## 📜 License

MIT
