/** Main entry point — bootstraps the game loop. */

import { Renderer } from './rendering/renderer.js';
import { Input } from './systems/input.js';
import { Game } from './systems/game.js';

function main(): void {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  Renderer.init(canvas);
  Input.init();

  const instructionOverlay = document.getElementById('instruction-overlay')!;
  const gameoverOverlay = document.getElementById('gameover-overlay')!;
  const startBtn = document.getElementById('start-btn')!;
  const restartBtn = document.getElementById('restart-btn')!;
  const hud = document.getElementById('hud')!;

  startBtn.addEventListener('click', () => {
    instructionOverlay.classList.add('hidden');
    hud.classList.remove('hidden');
    Input.showJoystick();
    Game.init();
  });

  restartBtn.addEventListener('click', () => {
    gameoverOverlay.classList.add('hidden');
    Game.init();
  });

  function gameLoop(): void {
    if (Game.state === 'playing') {
      const dir = Input.getDirection();
      Game.update(dir);
    }
    if (Game.state === 'playing' || Game.state === 'levelup') {
      Game.render();
    }
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);

  window.addEventListener('resize', () => {
    Renderer.resize();
  });

  document.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (Game.state === 'playing') {
        e.preventDefault();
      }
    },
    { passive: false },
  );
}

main();
