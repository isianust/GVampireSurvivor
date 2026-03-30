/* ===== Main Entry Point ===== */

(function () {
    'use strict';

    var canvas = document.getElementById('gameCanvas');
    Renderer.init(canvas);
    Input.init();

    // ---- UI Elements ----
    var instructionOverlay = document.getElementById('instruction-overlay');
    var gameoverOverlay = document.getElementById('gameover-overlay');
    var startBtn = document.getElementById('start-btn');
    var restartBtn = document.getElementById('restart-btn');
    var hud = document.getElementById('hud');

    // ---- Start Game ----
    startBtn.addEventListener('click', function () {
        instructionOverlay.classList.add('hidden');
        hud.classList.remove('hidden');
        Input.showJoystick();
        Game.init();
    });

    // ---- Restart Game ----
    restartBtn.addEventListener('click', function () {
        gameoverOverlay.classList.add('hidden');
        Game.init();
    });

    // ---- Game Loop ----
    function gameLoop() {
        if (Game.state === 'playing') {
            var dir = Input.getDirection();
            Game.update(dir);
        }

        if (Game.state === 'playing' || Game.state === 'levelup') {
            Game.render();
        }

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);

    // Handle window resize
    window.addEventListener('resize', function () {
        Renderer.resize();
    });

    // Prevent default touch behavior globally
    document.addEventListener('touchmove', function (e) {
        if (Game.state === 'playing') {
            e.preventDefault();
        }
    }, { passive: false });
})();
