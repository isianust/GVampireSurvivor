# 🧛 GVampire Survivor V2

A Vampire Survivor-style HTML5 game built with pure JavaScript and Canvas.

## ✨ Features

- **10 Enemy Types**: Skeleton, Zombie, Bat, Ghost, Spider, Werewolf, Warlock, Vampire, Drake, Demon Lord — each with unique detailed visuals and behaviors
- **Detailed Graphics**: Hand-drawn canvas sprites with glow effects, shadows, animations, and particles
- **Mobile Responsive**: Fully responsive design that adapts to any screen size
- **Mobile Controls**: Virtual joystick for touch devices — tap and drag on the left side of the screen
- **Keyboard Controls**: WASD or Arrow Keys to move
- **Auto-Attack Weapons**: Throwing Knife, Fireball, Holy Water, Holy Whip
- **Level Up System**: Choose upgrades when you level up — new weapons or stat boosts
- **Comprehensive Instructions**: Detailed in-game instruction overlay (Chinese + English)

## 🎮 How to Play

1. Open `index.html` in a web browser
2. Read the instructions and click "START GAME"
3. Move to avoid enemies — your weapons attack automatically
4. Collect XP gems to level up
5. Survive as long as possible!

## 📁 Project Structure

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

## 📱 Mobile Support

- Responsive canvas that fills the screen
- Virtual joystick appears on mobile devices
- Touch-optimized UI buttons and overlays
- Prevents default touch scrolling during gameplay
