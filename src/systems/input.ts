/** Input handler — keyboard + touch joystick. */

import type { InputDirection } from '../core/types.js';

export const Input = {
  keys: {} as Record<string, boolean>,
  dir: { x: 0, y: 0 } as InputDirection,
  joystickActive: false,
  joystickStart: { x: 0, y: 0 },
  joystickDir: { x: 0, y: 0 },
  touchId: null as number | null,
  isMobile: false,

  init(): void {
    this.isMobile =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    if (this.isMobile) {
      this.setupJoystick();
    }

    window.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault();
    });
  },

  setupJoystick(): void {
    const joystickArea = document.getElementById('joystick-area')!;
    const base = document.getElementById('joystick-base')!;
    const thumb = document.getElementById('joystick-thumb')!;

    document.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (this.touchId !== null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.clientX < window.innerWidth * 0.6) {
            this.touchId = touch.identifier;
            this.joystickActive = true;

            const baseRect = base.getBoundingClientRect();
            const baseR = baseRect.width / 2;
            joystickArea.style.left = touch.clientX - baseR + 'px';
            joystickArea.style.bottom = 'auto';
            joystickArea.style.top = touch.clientY - baseR + 'px';

            this.joystickStart.x = touch.clientX;
            this.joystickStart.y = touch.clientY;
            thumb.style.transform = 'translate(0px, 0px)';
            e.preventDefault();
            break;
          }
        }
      },
      { passive: false },
    );

    document.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier !== this.touchId) continue;

          let dx = touch.clientX - this.joystickStart.x;
          let dy = touch.clientY - this.joystickStart.y;
          const maxDist = 50;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d > maxDist) {
            dx = (dx / d) * maxDist;
            dy = (dy / d) * maxDist;
          }

          thumb.style.transform = `translate(${dx}px, ${dy}px)`;
          this.joystickDir.x = dx / maxDist;
          this.joystickDir.y = dy / maxDist;
          e.preventDefault();
          break;
        }
      },
      { passive: false },
    );

    const endTouch = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          this.touchId = null;
          this.joystickActive = false;
          this.joystickDir.x = 0;
          this.joystickDir.y = 0;
          thumb.style.transform = 'translate(0px, 0px)';
          joystickArea.style.left = '30px';
          joystickArea.style.top = 'auto';
          joystickArea.style.bottom = '30px';
          break;
        }
      }
    };
    document.addEventListener('touchend', endTouch);
    document.addEventListener('touchcancel', endTouch);
  },

  getDirection(): InputDirection {
    if (this.joystickActive) {
      return { x: this.joystickDir.x, y: this.joystickDir.y };
    }

    let dx = 0,
      dy = 0;
    if (this.keys['w'] || this.keys['arrowup'] || this.keys['ArrowUp']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown'] || this.keys['ArrowDown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright'] || this.keys['ArrowRight']) dx += 1;

    return { x: dx, y: dy };
  },

  showJoystick(): void {
    if (this.isMobile) {
      document.getElementById('joystick-area')?.classList.remove('hidden');
    }
  },

  hideJoystick(): void {
    document.getElementById('joystick-area')?.classList.add('hidden');
  },
};
