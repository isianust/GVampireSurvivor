/* ===== Main Entry Point ===== */

(function () {
    'use strict';

    var canvas = document.getElementById('gameCanvas');
    Renderer.init(canvas);
    Input.init();
    if (typeof Assets !== 'undefined') Assets.load(); // pixel-art placeholders (ComfyUI)

    // ---- UI Elements ----
    var instructionOverlay = document.getElementById('instruction-overlay');
    var charselectOverlay = document.getElementById('charselect-overlay');
    var gameoverOverlay = document.getElementById('gameover-overlay');
    var startBtn = document.getElementById('start-btn');
    var restartBtn = document.getElementById('restart-btn');
    var hud = document.getElementById('hud');
    var charOptions = document.getElementById('character-options');

    var selectedCharacter = null;

    // ---- Build character-select cards ----
    function buildCharacterSelect() {
        charOptions.innerHTML = '';
        for (var i = 0; i < CHARACTERS.length; i++) {
            (function (ch) {
                var card = document.createElement('button');
                card.className = 'character-card';
                card.style.borderColor = ch.color;
                var weaponName = (WEAPON_DEFS[ch.startWeapon] || {}).name || ch.startWeapon;
                var ultName = (ULT_DEFS[ch.ult] || {}).name || ch.ult;
                card.innerHTML =
                    '<div class="char-avatar" style="background:' + ch.color + '"></div>' +
                    '<div class="char-name">' + ch.name + '</div>' +
                    '<div class="char-title">' + ch.title + '</div>' +
                    '<div class="char-desc">' + ch.desc + '</div>' +
                    '<div class="char-meta">&#9876;&#65039; ' + weaponName + '<br>&#128165; ' + ultName + '</div>';
                card.addEventListener('click', function () {
                    selectedCharacter = ch;
                    startGame();
                });
                charOptions.appendChild(card);
            })(CHARACTERS[i]);
        }
    }

    function startGame() {
        charselectOverlay.classList.add('hidden');
        instructionOverlay.classList.add('hidden');
        hud.classList.remove('hidden');
        Input.showJoystick();
        if (Input.clearKeys) Input.clearKeys();
        Game.init(selectedCharacter);
    }

    // ---- Start button -> character select ----
    startBtn.addEventListener('click', function () {
        instructionOverlay.classList.add('hidden');
        buildCharacterSelect();
        charselectOverlay.classList.remove('hidden');
    });

    // ---- Restart Game -> keep same character ----
    restartBtn.addEventListener('click', function () {
        gameoverOverlay.classList.add('hidden');
        if (Input.clearKeys) Input.clearKeys();
        Game.init(selectedCharacter);
    });

    // ---- Game Loop ----
    function gameLoop() {
        if (Game.state === 'playing') {
            var dir = Input.getDirection();
            Game.update(dir);
        } else if (Input.clearPresses) {
            // Drop queued presses while paused / in menus
            Input.clearPresses();
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
