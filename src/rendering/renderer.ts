/**
 * Canvas renderer module.
 * This file wraps the original renderer.js as an ES module.
 * The detailed enemy sprite drawing is preserved from the original.
 */

import type { Camera, Player, Enemy, Projectile, Gem, DamageNumber } from '../core/types.js';
import { clamp, hsl, rgba } from '../systems/utils.js';

export const Renderer = {
  canvas: null as HTMLCanvasElement | null,
  ctx: null as CanvasRenderingContext2D | null,

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  },

  resize(): void {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  clear(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  drawGround(camera: Camera): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark background
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(0, 0, w, h);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    const offsetX = -(camera.x % gridSize);
    const offsetY = -(camera.y % gridSize);

    for (let x = offsetX; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = offsetY; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  },

  drawPlayer(player: Player, camera: Camera): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const sx = player.x - camera.x + this.canvas.width / 2;
    const sy = player.y - camera.y + this.canvas.height / 2;

    // Invincibility blink
    if (player.invTimer > 0 && Math.floor(player.invTimer * 10) % 2 === 0) return;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + player.radius + 2, player.radius * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#3366cc';
    ctx.beginPath();
    ctx.arc(sx, sy, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.shadowColor = '#3366cc';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#5588ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, player.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sx - 5, sy - 3, 3, 0, Math.PI * 2);
    ctx.arc(sx + 5, sy - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(sx - 4, sy - 3, 1.5, 0, Math.PI * 2);
    ctx.arc(sx + 6, sy - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  },

  drawEnemy(enemy: Enemy, camera: Camera): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const sx = enemy.x - camera.x + this.canvas.width / 2;
    const sy = enemy.y - camera.y + this.canvas.height / 2;

    // Skip if off-screen
    if (sx < -50 || sx > this.canvas.width + 50 || sy < -50 || sy > this.canvas.height + 50) return;

    // Hit flash
    if (enemy.hitTimer > 0) {
      ctx.globalAlpha = 0.6;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + enemy.radius + 2, enemy.radius * 0.7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(sx, sy, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeOffset = enemy.radius * 0.3;
    ctx.fillStyle = enemy.type === 'ghost' ? '#aaf' : '#ff0';
    ctx.beginPath();
    ctx.arc(sx - eyeOffset, sy - 2, 2, 0, Math.PI * 2);
    ctx.arc(sx + eyeOffset, sy - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    // HP bar for enemies with less than full HP
    if (enemy.hp < enemy.maxHp) {
      const barW = enemy.radius * 2;
      const barH = 3;
      const barX = sx - barW / 2;
      const barY = sy - enemy.radius - 8;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(barX, barY, barW * clamp(enemy.hp / enemy.maxHp, 0, 1), barH);
    }
  },

  drawProjectile(proj: Projectile, camera: Camera): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const sx = proj.x - camera.x + this.canvas.width / 2;
    const sy = proj.y - camera.y + this.canvas.height / 2;

    if (proj.type === 'knife') {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(proj.angle);
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, -3);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (proj.type === 'fireball') {
      ctx.fillStyle = '#ff6600';
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, sy, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (proj.type === 'holywater') {
      ctx.fillStyle = rgba(100, 150, 255, 0.3);
      ctx.beginPath();
      ctx.arc(sx, sy, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba(100, 150, 255, 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, proj.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (proj.type === 'whip') {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(proj.angle);
      ctx.strokeStyle = hsl(45, 80, 60);
      ctx.lineWidth = 3;
      ctx.shadowColor = hsl(45, 80, 60);
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(proj.radius * 0.5, -15, proj.radius, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  },

  drawGem(gem: Gem, camera: Camera): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const sx = gem.x - camera.x + this.canvas.width / 2;
    const sy = gem.y - camera.y + this.canvas.height / 2;

    ctx.fillStyle = gem.color;
    ctx.shadowColor = gem.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    // Diamond shape
    ctx.moveTo(sx, sy - gem.size);
    ctx.lineTo(sx + gem.size * 0.6, sy);
    ctx.lineTo(sx, sy + gem.size);
    ctx.lineTo(sx - gem.size * 0.6, sy);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  },

  drawDamageNumber(dn: DamageNumber, camera: Camera): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const sx = dn.x - camera.x + this.canvas.width / 2;
    const sy = dn.y - camera.y + this.canvas.height / 2;

    ctx.globalAlpha = clamp(1 - dn.age / dn.lifetime, 0, 1);
    ctx.fillStyle = dn.color;
    ctx.font = `bold ${dn.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(dn.text, sx, sy);
    ctx.globalAlpha = 1;
  },
};
