/* ===== Input Handler — Keyboard + Touch Joystick ===== */

var Input = {
    keys: {},
    dir: { x: 0, y: 0 },
    joystickActive: false,
    joystickStart: { x: 0, y: 0 },
    joystickDir: { x: 0, y: 0 },
    touchId: null,
    isMobile: false,

    init: function () {
        this.isMobile = isMobileDevice();

        // Keyboard
        var self = this;
        window.addEventListener('keydown', function (e) {
            self.keys[e.key.toLowerCase()] = true;
            self.keys[e.code] = true;
        });
        window.addEventListener('keyup', function (e) {
            self.keys[e.key.toLowerCase()] = false;
            self.keys[e.code] = false;
        });

        // Touch joystick
        if (this.isMobile) {
            this.setupJoystick();
        }

        // Prevent context menu on long press
        window.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    },

    setupJoystick: function () {
        var joystickArea = document.getElementById('joystick-area');
        var base = document.getElementById('joystick-base');
        var thumb = document.getElementById('joystick-thumb');
        var self = this;

        // Use full left half of screen as touch area
        document.addEventListener('touchstart', function (e) {
            if (self.touchId !== null) return;
            for (var i = 0; i < e.changedTouches.length; i++) {
                var touch = e.changedTouches[i];
                // Accept touch on left half or on joystick area
                if (touch.clientX < window.innerWidth * 0.6) {
                    self.touchId = touch.identifier;
                    self.joystickActive = true;

                    // Move joystick base to touch position
                    var baseRect = base.getBoundingClientRect();
                    var baseR = baseRect.width / 2;
                    joystickArea.style.left = (touch.clientX - baseR) + 'px';
                    joystickArea.style.bottom = 'auto';
                    joystickArea.style.top = (touch.clientY - baseR) + 'px';

                    self.joystickStart.x = touch.clientX;
                    self.joystickStart.y = touch.clientY;
                    thumb.style.transform = 'translate(0px, 0px)';
                    e.preventDefault();
                    break;
                }
            }
        }, { passive: false });

        document.addEventListener('touchmove', function (e) {
            for (var i = 0; i < e.changedTouches.length; i++) {
                var touch = e.changedTouches[i];
                if (touch.identifier !== self.touchId) continue;

                var dx = touch.clientX - self.joystickStart.x;
                var dy = touch.clientY - self.joystickStart.y;
                var maxDist = 50;
                var d = Math.sqrt(dx * dx + dy * dy);

                if (d > maxDist) {
                    dx = dx / d * maxDist;
                    dy = dy / d * maxDist;
                    d = maxDist;
                }

                thumb.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
                self.joystickDir.x = dx / maxDist;
                self.joystickDir.y = dy / maxDist;
                e.preventDefault();
                break;
            }
        }, { passive: false });

        var endTouch = function (e) {
            for (var i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === self.touchId) {
                    self.touchId = null;
                    self.joystickActive = false;
                    self.joystickDir.x = 0;
                    self.joystickDir.y = 0;
                    thumb.style.transform = 'translate(0px, 0px)';

                    // Reset joystick position
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

    getDirection: function () {
        // Touch joystick has priority
        if (this.joystickActive) {
            return { x: this.joystickDir.x, y: this.joystickDir.y };
        }

        // Keyboard
        var dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['arrowup'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright'] || this.keys['ArrowRight']) dx += 1;

        return { x: dx, y: dy };
    },

    showJoystick: function () {
        if (this.isMobile) {
            document.getElementById('joystick-area').classList.remove('hidden');
        }
    },

    hideJoystick: function () {
        document.getElementById('joystick-area').classList.add('hidden');
    }
};
