# 🧛 GVampire Survivor V2

[![CI](https://github.com/isianust/GVampireSurvivor/actions/workflows/ci.yml/badge.svg)](https://github.com/isianust/GVampireSurvivor/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

A **Vampire Survivors–style** HTML5 game built with **TypeScript**, **Canvas 2D**, and **Vite**. Survive endless waves of monsters, level up, and unlock powerful weapons!

---

## 🎮 Play Now

Open `index.html` in any modern browser, or run the dev server:

```bash
npm install
npm run dev
```

---

## ✨ Features

### 🕹️ Gameplay
- **10 Enemy Types** — Skeleton, Zombie, Bat, Ghost, Spider, Werewolf, Warlock, Vampire, Drake, Demon Lord — each with unique visuals, stats, and behaviors
- **4 Auto-Attack Weapons** — Throwing Knife, Fireball, Holy Water, Holy Whip — each with distinct mechanics
- **Level-Up System** — Choose from weapon upgrades, new weapons, or stat boosts on every level up
- **Progressive Difficulty** — Enemies scale in HP over time; spawn rate increases; boss appears at 3 minutes
- **XP Gem Magnet System** — Collect XP gems with auto-attract within your magnet range

### 📱 Controls
- **Keyboard** — WASD or Arrow Keys to move
- **Mobile** — Virtual joystick on touch devices (left side of screen)
- **Auto-Attack** — Weapons fire automatically at the nearest enemy

### 🎨 Visual Polish
- Hand-drawn Canvas 2D sprites with glow effects and shadows
- Smooth camera follow with lerp
- Damage numbers, hit particles, and death effects
- Responsive UI with Gothic dark theme

---

## 🏗️ Architecture

The project uses a **modular TypeScript architecture** with clear separation of concerns:

```
GVampireSurvivor/
├── src/
│   ├── main.ts                  # Entry point — game loop bootstrap
│   ├── config/
│   │   ├── game.config.ts       # Centralised constants (no magic numbers)
│   │   ├── definitions.ts       # Enemy & weapon data definitions
│   │   └── index.ts             # Re-exports
│   ├── core/
│   │   ├── EventBus.ts          # Pub/sub event system
│   │   ├── StateMachine.ts      # Finite state machine with guards & hooks
│   │   ├── types.ts             # Shared TypeScript interfaces
│   │   └── index.ts
│   ├── entities/
│   │   ├── player.ts            # Player creation, movement, damage, XP
│   │   ├── enemies.ts           # Enemy creation, type selection, HP scaling
│   │   ├── weapons.ts           # Weapon system, projectiles, upgrades
│   │   └── index.ts
│   ├── systems/
│   │   ├── game.ts              # Core game state & update loop
│   │   ├── input.ts             # Keyboard + touch joystick handler
│   │   └── utils.ts             # Pure math/collision/formatting utilities
│   └── rendering/
│       └── renderer.ts          # Canvas 2D renderer
├── tests/                       # Vitest unit tests (225 tests)
│   ├── utils.test.ts            # Math, collision, formatting
│   ├── EventBus.test.ts         # Event system
│   ├── StateMachine.test.ts     # State machine
│   ├── config.test.ts           # Configuration validation
│   ├── enemies.test.ts          # Enemy creation & type selection
│   ├── player.test.ts           # Player mechanics
│   └── weapons.test.ts          # Weapon system & upgrades
├── css/style.css                # Responsive styles, overlays, mobile joystick
├── index.html                   # Game HTML with HUD and overlays
├── js/                          # Legacy vanilla JS (preserved for reference)
├── vite.config.ts               # Vite build configuration
├── vitest.config.ts             # Test configuration
├── tsconfig.json                # TypeScript configuration
├── eslint.config.js             # ESLint flat config
├── .prettierrc                  # Prettier formatting rules
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

## 📱 Mobile Support

- Responsive canvas that fills the screen
- Virtual joystick appears on mobile devices
- Touch-optimised UI buttons and overlays
- Prevents default touch scrolling during gameplay
- Media queries for phones (600px), small phones (400px), and landscape mode (450px height)

---

## 🗺️ Roadmap

- [ ] Sound effects with Web Audio API
- [ ] Save/load system with LocalStorage
- [ ] Multiple playable characters
- [ ] Weapon evolution system (combine two weapons)
- [ ] Multiple maps with terrain
- [ ] Online leaderboard
- [ ] PWA support for offline play
- [ ] Achievement system

---

## 📜 License

MIT
