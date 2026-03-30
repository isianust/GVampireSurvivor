/* ===== Utility Functions ===== */

/** Clamp value between min and max */
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/** Distance between two points */
function dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/** Angle from a to b */
function angleTo(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
}

/** Random integer [min, max) */
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/** Random float [min, max) */
function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/** Detect mobile / touch device */
function isMobileDevice() {
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
}

/** Lerp */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/** Normalize angle to [-PI, PI] */
function normalizeAngle(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
}

/** Simple AABB collision */
function circleCollide(a, b) {
    var d = dist(a, b);
    return d < (a.radius || 16) + (b.radius || 16);
}

/** HSL to string */
function hsl(h, s, l, a) {
    if (a !== undefined) return 'hsla(' + h + ',' + s + '%,' + l + '%,' + a + ')';
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}

/** Create color with alpha */
function rgba(r, g, b, a) {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

/** Spawn position outside camera view */
function spawnOutsideView(camera, canvas, margin) {
    margin = margin || 80;
    var side = randInt(0, 4);
    var x, y;
    switch (side) {
        case 0: // top
            x = camera.x + randFloat(-canvas.width / 2 - margin, canvas.width / 2 + margin);
            y = camera.y - canvas.height / 2 - margin;
            break;
        case 1: // right
            x = camera.x + canvas.width / 2 + margin;
            y = camera.y + randFloat(-canvas.height / 2 - margin, canvas.height / 2 + margin);
            break;
        case 2: // bottom
            x = camera.x + randFloat(-canvas.width / 2 - margin, canvas.width / 2 + margin);
            y = camera.y + canvas.height / 2 + margin;
            break;
        default: // left
            x = camera.x - canvas.width / 2 - margin;
            y = camera.y + randFloat(-canvas.height / 2 - margin, canvas.height / 2 + margin);
            break;
    }
    return { x: x, y: y };
}

/** Format seconds to MM:SS */
function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}
