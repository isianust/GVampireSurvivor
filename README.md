# 🧛 GVampire Survivor V4 — Enterprise Roadmap

A Vampire Survivor-style HTML5 game evolving from indie prototype to enterprise-grade web game platform.

---

## 📊 Current Status (V2 → V4)

| Category | V2 Score | V4 Target | Notes |
|----------|----------|-----------|-------|
| Code Quality | 5/10 | 9/10 | TypeScript + ESLint + Prettier |
| Architecture | 4/10 | 9/10 | ES Modules, ECS pattern, DI |
| Testing | 0/10 | 8/10 | Unit + Integration + E2E |
| DevOps | 0/10 | 9/10 | CI/CD, automated deployment |
| Performance | 6/10 | 9/10 | Spatial partitioning, object pooling |
| Security | 5/10 | 8/10 | Input validation, CSP headers |
| Scalability | 3/10 | 8/10 | Data-driven, config-based |
| Documentation | 4/10 | 9/10 | API docs, architecture guide |
| **Overall** | **3.4/10** | **8.6/10** | |

---

## ✨ Current Features (V2)

- **10 Enemy Types**: Skeleton, Zombie, Bat, Ghost, Spider, Werewolf, Warlock, Vampire, Drake, Demon Lord — each with unique detailed visuals and behaviors
- **Detailed Graphics**: Hand-drawn canvas sprites with glow effects, shadows, animations, and particles
- **Mobile Responsive**: Fully responsive design that adapts to any screen size
- **Mobile Controls**: Virtual joystick for touch devices — tap and drag on the left side of the screen
- **Keyboard Controls**: WASD or Arrow Keys to move
- **Auto-Attack Weapons**: Throwing Knife, Fireball, Holy Water, Holy Whip
- **Level Up System**: Choose upgrades when you level up — new weapons or stat boosts
- **Comprehensive Instructions**: Detailed in-game instruction overlay (Chinese + English)

---

## 🎮 How to Play

1. Open `index.html` in a web browser
2. Read the instructions and click "START GAME"
3. Move to avoid enemies — your weapons attack automatically
4. Collect XP gems to level up
5. Survive as long as possible!

---

## 📁 Project Structure

### Current (V2)
```
├── index.html          # Main HTML with instruction overlay, HUD, canvas
├── css/
│   └── style.css       # Responsive styles, overlays, mobile joystick
├── js/
│   ├── utils.js        # Utility functions
│   ├── renderer.js     # Canvas renderer with detailed enemy sprites
│   ├── enemies.js      # 10 enemy type definitions
│   ├── player.js       # Player logic
│   ├── weapons.js      # Weapon system with 4 weapon types
│   ├── game.js         # Core game state and loop
│   ├── input.js        # Keyboard + touch joystick input
│   └── main.js         # Entry point
└── README.md
```

### Proposed (V4 Enterprise)
```
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Build & dev server
├── .eslintrc.json                # Linting rules
├── .prettierrc                   # Code formatting
├── .github/
│   └── workflows/
│       ├── ci.yml                # CI pipeline (lint, test, build)
│       └── deploy.yml            # Auto-deploy to hosting
├── public/
│   ├── index.html                # Minimal HTML shell
│   └── assets/
│       ├── sprites/              # Sprite atlas images
│       └── audio/                # Sound effects & music
├── src/
│   ├── main.ts                   # Entry point
│   ├── config/
│   │   ├── game.config.ts        # All game constants (no magic numbers)
│   │   ├── enemies.config.ts     # Enemy type definitions (data-driven)
│   │   └── weapons.config.ts     # Weapon definitions (data-driven)
│   ├── core/
│   │   ├── Engine.ts             # Game loop, delta-time, state machine
│   │   ├── EventBus.ts           # Pub/sub event system
│   │   └── AssetManager.ts       # Load & cache sprites, audio
│   ├── ecs/                      # Entity-Component-System
│   │   ├── Entity.ts
│   │   ├── Component.ts
│   │   └── System.ts
│   ├── systems/
│   │   ├── MovementSystem.ts     # Position updates
│   │   ├── CollisionSystem.ts    # Quadtree spatial partitioning
│   │   ├── RenderSystem.ts       # Canvas or WebGL rendering
│   │   ├── InputSystem.ts        # Keyboard, touch, gamepad
│   │   ├── WeaponSystem.ts       # Auto-attack logic
│   │   ├── SpawnSystem.ts        # Enemy wave management
│   │   └── UISystem.ts           # HUD, menus, overlays
│   ├── components/
│   │   ├── Transform.ts          # Position, rotation, scale
│   │   ├── Health.ts             # HP, damage, healing
│   │   ├── Sprite.ts             # Visual representation
│   │   ├── Collider.ts           # Collision bounds
│   │   ├── AI.ts                 # Enemy behavior
│   │   └── Weapon.ts             # Weapon data
│   ├── rendering/
│   │   ├── CanvasRenderer.ts     # 2D Canvas backend
│   │   ├── WebGLRenderer.ts      # WebGL backend (future)
│   │   ├── Camera.ts             # Viewport management
│   │   └── ParticlePool.ts       # Object-pooled particles
│   ├── ui/
│   │   ├── HUD.ts
│   │   ├── LevelUpScreen.ts
│   │   └── GameOverScreen.ts
│   ├── networking/               # Future multiplayer
│   │   ├── Client.ts
│   │   └── Protocol.ts
│   └── utils/
│       ├── math.ts               # Vector math, collision helpers
│       ├── logger.ts             # Structured logging
│       └── objectPool.ts         # Generic object pool
├── tests/
│   ├── unit/
│   │   ├── math.test.ts
│   │   ├── collision.test.ts
│   │   └── spawning.test.ts
│   ├── integration/
│   │   └── gameLoop.test.ts
│   └── e2e/
│       └── gameplay.test.ts
└── README.md
```

---

## 📱 Mobile Support

- Responsive canvas that fills the screen
- Virtual joystick appears on mobile devices
- Touch-optimized UI buttons and overlays
- Prevents default touch scrolling during gameplay

---

## 🏢 V4 Enterprise Upgrade Plan

### 🔴 Phase 1 — Foundation (Critical)

**Migrate to TypeScript + Modern Tooling**
- Convert all `.js` files to TypeScript (`.ts`) for compile-time type safety
- Add `package.json` with npm for dependency management
- Set up Vite as build tool & dev server (fast HMR, ES module bundling)
- Configure ESLint + Prettier for consistent code style
- Add GitHub Actions CI pipeline (lint → test → build on every PR)

**Remove Global Namespace Pollution**
- Convert all files to ES Modules (`import`/`export`)
- Eliminate all global variables and functions
- Implement dependency injection for testability

**Extract Magic Numbers to Configuration**
- Move all 40+ hardcoded constants to `game.config.ts`
- Create data-driven enemy/weapon definitions in JSON/TypeScript configs
- Support difficulty presets (Easy / Normal / Hard / Nightmare)

**Add Error Handling**
- Try-catch blocks around all critical paths (rendering, input, game loop)
- Graceful degradation when canvas features unavailable
- Structured error logging with stack traces

### 🟡 Phase 2 — Quality & Performance (High Priority)

**Implement Testing Framework**
- Vitest for unit tests (math, collision, spawning logic)
- Integration tests for game loop and state transitions
- Playwright for E2E browser testing
- Target: 80%+ code coverage

**Performance Optimization**
- Quadtree spatial partitioning for O(n log n) collision detection
- Object pooling for particles, projectiles, damage numbers (reduce GC)
- Sprite atlas system (single texture draw calls)
- Render culling improvements (frustum-based)
- `requestAnimationFrame` pausing during inactive states

**State Management Overhaul**
- Implement Event Bus (pub/sub) for decoupled communication
- Immutable state snapshots for debugging
- Save/Load system using `localStorage` or IndexedDB

### 🟢 Phase 3 — Architecture (Medium Priority)

**Entity-Component-System (ECS) Architecture**
- Refactor from singleton objects to ECS pattern
- Separate data (Components) from logic (Systems)
- Enable easy addition of new entity types without code changes
- Improved cache performance for large entity counts

**Rendering Abstraction**
- Abstract renderer interface (swap Canvas 2D ↔ WebGL)
- Camera system with smooth follow, zoom, shake effects
- Particle system with GPU acceleration (WebGL path)

**Audio System**
- Web Audio API integration
- Sound effects for attacks, hits, level-up, death
- Background music with crossfade
- Volume controls & mute toggle

**Input Abstraction**
- Unified input system (keyboard + touch + gamepad)
- Configurable key bindings
- Input buffering for responsive controls

### 🔵 Phase 4 — Enterprise Features (Nice-to-Have)

**Multiplayer Networking**
- WebSocket server (Node.js/Deno backend)
- Client-side prediction & server reconciliation
- Competitive/co-op modes

**Analytics & Monitoring**
- Player behavior tracking (anonymized)
- Performance metrics dashboard
- Error reporting (Sentry integration)
- A/B testing for game balance

**Internationalization (i18n)**
- Full i18n framework beyond Chinese/English
- Support Japanese, Korean, Spanish, etc.
- RTL language support

**Accessibility**
- Screen reader support for menus
- High-contrast mode
- Colorblind-friendly palettes
- Keyboard-only navigation

**Content Management**
- Level editor / wave designer
- Modding support (user-created enemies/weapons)
- Cloud save synchronization

---

## 🛠️ Technology Recommendations for V4

### Current Stack (V2)
| Layer | Technology | Limitation |
|-------|-----------|------------|
| Language | Vanilla JS (ES5/6) | No type safety, hard to refactor |
| Graphics | Canvas 2D API | No GPU acceleration, manual drawing |
| Build | None (raw files) | No minification, no tree-shaking |
| Testing | None | Zero automated quality assurance |
| CI/CD | None | No automated deployment |
| State | Global mutable objects | Hard to debug, no persistence |

### Recommended Stack (V4)
| Layer | Technology | Benefit |
|-------|-----------|---------|
| Language | **TypeScript 5.x** | Type safety, better IDE support, refactoring |
| Graphics | **Canvas 2D → WebGL** (via PixiJS or custom) | GPU-accelerated rendering, sprite batching |
| Build | **Vite** | Fast dev server, ES module bundling, HMR |
| Testing | **Vitest + Playwright** | Fast unit tests + browser E2E |
| CI/CD | **GitHub Actions** | Automated lint, test, build, deploy |
| State | **Custom Event Bus + ECS** | Decoupled, testable, debuggable |
| Linting | **ESLint + Prettier** | Consistent code style |
| Deployment | **Vercel / Netlify / GitHub Pages** | One-click deploy, CDN, HTTPS |

### Optional Plugins / Libraries to Consider
| Purpose | Library | Why |
|---------|---------|-----|
| Physics | **Matter.js** or custom | Better collision response, rigid body |
| Audio | **Howler.js** | Cross-browser audio, sprite support |
| UI Framework | **Lit** or **Preact** | Lightweight UI components for menus |
| Networking | **Socket.IO** or **Colyseus** | Real-time multiplayer framework |
| Analytics | **Plausible** | Privacy-friendly, lightweight |
| i18n | **i18next** | Industry-standard translation |
| Sprite Tools | **TexturePacker** | Sprite atlas generation |

### Language Change Assessment
> **No new language runtime is needed** — TypeScript compiles to JavaScript, so the browser runtime stays the same. However, **migrating to TypeScript is a substantial effort** that requires rewriting all files with type annotations, interfaces, and strict null checks. This is the single highest-impact change for enterprise readiness. The migration can be done incrementally (file by file) alongside existing JavaScript, making it a practical upgrade path without a full rewrite.

---

## 📜 Version History

| Version | Description |
|---------|-------------|
| V1 | Initial prototype — basic gameplay |
| V2 | 10 enemy types, detailed sprites, mobile support, level-up system |
| V3 | *(Skipped — jump to V4 for enterprise overhaul)* |
| V4 | Enterprise-grade: TypeScript, ECS, CI/CD, testing, performance optimization |

---

## 📄 License

MIT — Free to use, modify, and distribute.
