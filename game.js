/**
 * GVampire Survivor — Phaser 3 implementation.
 *
 * Uses Arcade Physics for movement and collision, Phaser Groups/Pools for
 * enemies and projectiles, and procedural graphics (no external assets).
 */

/* ===== Constants ===== */
var WORLD_WIDTH = 3000;
var WORLD_HEIGHT = 3000;
var PLAYER_SPEED = 200;
var PLAYER_SIZE = 28;
var ENEMY_SPEED = 80;
var ENEMY_SIZE = 24;
var ENEMY_SPAWN_INTERVAL = 1000;   // ms
var PROJECTILE_SPEED = 400;
var PROJECTILE_SIZE = 10;
var ATTACK_INTERVAL = 1500;        // ms

/* ===== MainScene ===== */
var MainScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function MainScene() {
    Phaser.Scene.call(this, { key: 'MainScene' });
    this.player = null;
    this.cursors = null;
    this.wasd = null;
    this.enemies = null;
    this.projectiles = null;
    this.kills = 0;
    this.killText = null;
    this.enemySpawnTimer = null;
    this.attackTimer = null;
  },

  /* ----- preload ----- */
  preload: function () {
    // Generate textures procedurally — no external assets needed.
    var playerGfx = this.make.graphics({ add: false });
    playerGfx.fillStyle(0x3366cc, 1);
    playerGfx.fillCircle(PLAYER_SIZE / 2, PLAYER_SIZE / 2, PLAYER_SIZE / 2);
    playerGfx.lineStyle(2, 0x5588ee, 1);
    playerGfx.strokeCircle(PLAYER_SIZE / 2, PLAYER_SIZE / 2, PLAYER_SIZE / 2);
    // Eyes
    playerGfx.fillStyle(0xffffff, 1);
    playerGfx.fillCircle(PLAYER_SIZE / 2 - 5, PLAYER_SIZE / 2 - 3, 3);
    playerGfx.fillCircle(PLAYER_SIZE / 2 + 5, PLAYER_SIZE / 2 - 3, 3);
    playerGfx.fillStyle(0x000000, 1);
    playerGfx.fillCircle(PLAYER_SIZE / 2 - 4, PLAYER_SIZE / 2 - 3, 1.5);
    playerGfx.fillCircle(PLAYER_SIZE / 2 + 6, PLAYER_SIZE / 2 - 3, 1.5);
    playerGfx.generateTexture('player', PLAYER_SIZE, PLAYER_SIZE);
    playerGfx.destroy();

    var enemyGfx = this.make.graphics({ add: false });
    enemyGfx.fillStyle(0xd4c5a9, 1);
    enemyGfx.fillCircle(ENEMY_SIZE / 2, ENEMY_SIZE / 2, ENEMY_SIZE / 2);
    enemyGfx.fillStyle(0xff0000, 1);
    enemyGfx.fillCircle(ENEMY_SIZE / 2 - 4, ENEMY_SIZE / 2 - 2, 2);
    enemyGfx.fillCircle(ENEMY_SIZE / 2 + 4, ENEMY_SIZE / 2 - 2, 2);
    enemyGfx.generateTexture('enemy', ENEMY_SIZE, ENEMY_SIZE);
    enemyGfx.destroy();

    var projGfx = this.make.graphics({ add: false });
    projGfx.fillStyle(0xffcc00, 1);
    projGfx.fillCircle(PROJECTILE_SIZE / 2, PROJECTILE_SIZE / 2, PROJECTILE_SIZE / 2);
    projGfx.generateTexture('projectile', PROJECTILE_SIZE, PROJECTILE_SIZE);
    projGfx.destroy();
  },

  /* ----- create ----- */
  create: function () {
    // Dark background fill covering the world
    this.cameras.main.setBackgroundColor('#1a0a2e');

    // Grid lines drawn as a tiled background
    var gridGfx = this.make.graphics({ add: false });
    var gridCell = 60;
    gridGfx.lineStyle(1, 0xffffff, 0.04);
    gridGfx.strokeRect(0, 0, gridCell, gridCell);
    gridGfx.generateTexture('grid', gridCell, gridCell);
    gridGfx.destroy();
    this.add.tileSprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 'grid');

    // World bounds
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // --- Player ---
    this.player = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setCircle(PLAYER_SIZE / 2);
    this.player.setDepth(10);

    // Camera follows player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    // --- Input ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // --- Enemy pool (Arcade Group) ---
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 200,
      runChildUpdate: false
    });

    // --- Projectile pool (Arcade Group) ---
    this.projectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 100,
      runChildUpdate: false
    });

    // --- Collisions ---
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.onProjectileHitEnemy,
      null,
      this
    );

    // --- Kill counter UI (Phaser text on camera, fixed to viewport) ---
    this.kills = 0;
    this.killText = this.add.text(16, 16, 'Kills: 0', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setScrollFactor(0).setDepth(100);

    // --- Enemy spawn timer ---
    this.enemySpawnTimer = this.time.addEvent({
      delay: ENEMY_SPAWN_INTERVAL,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });

    // --- Auto attack timer ---
    this.attackTimer = this.time.addEvent({
      delay: ATTACK_INTERVAL,
      callback: this.autoAttack,
      callbackScope: this,
      loop: true
    });
  },

  /* ----- update ----- */
  update: function () {
    if (!this.player || !this.player.active) return;

    // Movement
    var vx = 0;
    var vy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      var inv = 1 / Math.SQRT2;
      vx *= inv;
      vy *= inv;
    }

    this.player.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED);

    // Enemy AI: move toward player
    var self = this;
    this.enemies.getChildren().forEach(function (enemy) {
      if (!enemy.active) return;
      self.physics.moveToObject(enemy, self.player, ENEMY_SPEED);
    });

    // Remove projectiles that leave the world
    this.projectiles.getChildren().forEach(function (proj) {
      if (!proj.active) return;
      if (proj.x < -50 || proj.x > WORLD_WIDTH + 50 ||
          proj.y < -50 || proj.y > WORLD_HEIGHT + 50) {
        proj.setActive(false).setVisible(false);
        proj.body.stop();
      }
    });
  },

  /* ----- spawnEnemy ----- */
  spawnEnemy: function () {
    if (!this.player || !this.player.active) return;

    // Spawn outside the camera view
    var cam = this.cameras.main;
    var margin = 80;
    var side = Phaser.Math.Between(0, 3);
    var x, y;

    switch (side) {
      case 0: // top
        x = Phaser.Math.Between(
          Math.max(0, this.player.x - cam.width / 2 - margin),
          Math.min(WORLD_WIDTH, this.player.x + cam.width / 2 + margin)
        );
        y = Math.max(0, this.player.y - cam.height / 2 - margin);
        break;
      case 1: // right
        x = Math.min(WORLD_WIDTH, this.player.x + cam.width / 2 + margin);
        y = Phaser.Math.Between(
          Math.max(0, this.player.y - cam.height / 2 - margin),
          Math.min(WORLD_HEIGHT, this.player.y + cam.height / 2 + margin)
        );
        break;
      case 2: // bottom
        x = Phaser.Math.Between(
          Math.max(0, this.player.x - cam.width / 2 - margin),
          Math.min(WORLD_WIDTH, this.player.x + cam.width / 2 + margin)
        );
        y = Math.min(WORLD_HEIGHT, this.player.y + cam.height / 2 + margin);
        break;
      default: // left
        x = Math.max(0, this.player.x - cam.width / 2 - margin);
        y = Phaser.Math.Between(
          Math.max(0, this.player.y - cam.height / 2 - margin),
          Math.min(WORLD_HEIGHT, this.player.y + cam.height / 2 + margin)
        );
        break;
    }

    // Try to get a pooled enemy
    var enemy = this.enemies.get(x, y, 'enemy');
    if (!enemy) return; // pool full

    enemy.setActive(true).setVisible(true);
    enemy.setPosition(x, y);
    enemy.setCircle(ENEMY_SIZE / 2);
    enemy.body.enable = true;
  },

  /* ----- autoAttack ----- */
  autoAttack: function () {
    if (!this.player || !this.player.active) return;

    // Find nearest active enemy
    var nearest = null;
    var nearestDist = Infinity;
    var px = this.player.x;
    var py = this.player.y;

    this.enemies.getChildren().forEach(function (enemy) {
      if (!enemy.active) return;
      var d = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = enemy;
      }
    });

    if (!nearest) return;

    // Get a projectile from the pool
    var proj = this.projectiles.get(px, py, 'projectile');
    if (!proj) return; // pool full

    proj.setActive(true).setVisible(true);
    proj.setPosition(px, py);
    proj.setCircle(PROJECTILE_SIZE / 2);
    proj.body.enable = true;

    // Fire toward nearest enemy
    this.physics.moveToObject(proj, nearest, PROJECTILE_SPEED);
  },

  /* ----- collision callback ----- */
  onProjectileHitEnemy: function (projectile, enemy) {
    if (!projectile.active || !enemy.active) return;

    // Destroy both
    projectile.setActive(false).setVisible(false);
    projectile.body.stop();

    enemy.setActive(false).setVisible(false);
    enemy.body.stop();

    this.kills++;
    this.killText.setText('Kills: ' + this.kills);
  }
});

/* ===== Boot logic — Start button integration ===== */
document.addEventListener('DOMContentLoaded', function () {
  var startBtn = document.getElementById('start-btn');
  var instructionOverlay = document.getElementById('instruction-overlay');
  var hud = document.getElementById('hud');

  startBtn.addEventListener('click', function () {
    // Hide instruction overlay, show HUD
    instructionOverlay.classList.add('hidden');
    hud.classList.remove('hidden');

    // Create the Phaser game
    var config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#1a0a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [MainScene]
    };

    new Phaser.Game(config);
  });
});
