# 🧛 Vampire Survivors – HTML5 Game

A browser-based tribute to the hit game **Vampire Survivors**, built entirely with HTML5 Canvas, CSS, and vanilla JavaScript. No dependencies, no build step — just open `index.html` and play!

## 🎮 How to Play

1. Open `index.html` in any modern browser
2. Click **Start Game**
3. Move with **WASD** or **Arrow Keys** (touch joystick on mobile)
4. Weapons fire automatically — focus on dodging enemies!
5. Collect **blue XP gems** dropped by defeated enemies
6. **Level up** and choose new weapons or upgrades
7. Survive as long as you can!

## ⚔️ Weapons

| Weapon | Icon | Description |
|--------|------|-------------|
| Whip | 🗡️ | Attacks horizontally in front of the player |
| Magic Wand | 🪄 | Fires a projectile at the nearest enemy |
| Fire Wand | 🔥 | Launches a fiery projectile that explodes on impact |
| Holy Water | 💧 | Drops a damaging pool on the ground |
| Garlic | 🧄 | Damages nearby enemies and knocks them back |
| King Bible | 📖 | Orbiting books that damage enemies |

## 👾 Enemies

Bats 🦇, Skeletons 💀, Zombies 🧟, Ghosts 👻, Werewolves 🐺, and Vampires 🧛 — each stronger than the last. Enemy difficulty scales over time with increasing HP, damage, and spawn rates.

## 🛡️ Passive Upgrades

- ❤️ Max Health
- 🛡️ Armor
- 👟 Move Speed
- 💚 Recovery (HP regen)
- 💪 Might (damage bonus)
- 🔵 Area of Effect
- ⏳ Cooldown Reduction

## ✨ Features

- **Responsive design** for modern screens (desktop, tablet, mobile)
- **Touch controls** with virtual joystick on mobile
- **6 unique weapons** with 8 upgrade levels each
- **7 passive upgrades** for character builds
- **6 enemy types** with scaling difficulty
- **Visual effects**: screen shake, damage numbers, particle effects, vignette
- **No dependencies** — single HTML file, works offline

## 📋 Technical Details

- Pure HTML5 Canvas rendering
- 60 FPS game loop with delta-time physics
- Efficient spatial processing for hundreds of enemies
- CSS-based UI with modern glassmorphism styling
- Emoji-based sprites for instant visual appeal
