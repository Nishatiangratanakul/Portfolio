// Confetti, two ways:
//  - Click the footer icon: a fast shower over the whole page that speeds up with each click,
//    then sweeps itself away once the page is full.
//  - Leave the page alone: confetti slowly appears all over the page, builds up, and stays.
//    When you come back it disappears piece by piece, and your cursor (or finger, as you
//    scroll) clears whatever it passes over.
// Add ?confetti-test to any page URL to start the idle confetti after 3s instead of 30s.

const testMode = new URLSearchParams(location.search).has('confetti-test');
const isPhone = matchMedia('(max-width: 600px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// How many shapes fill one screen. Long pages get proportionally more.
const SHAPES_PER_SCREEN = { phone: 300, desktop: 1000 };
const MAX_TOTAL = 3000;
// How far (px) a shape's centre can land past the page edges; the overhang is cut off.
const EDGE_OVERHANG = 15;
// Each shape tries this many random spots and keeps the one farthest from the others.
// Pure randomness makes clumps and bare patches; this reads as "random" to the eye.
const CANDIDATES = 5;

const IDLE_AFTER = testMode ? 3000 : 30000; // ms without activity before it starts
const IDLE_FILL_TIME = 180000;              // ms until a desktop screen is full; phones use the
                                            // same pace and fill sooner, as they hold fewer
const IDLE_RAMP = 1.5;                      // >1 starts slower and speeds up; 1 is a steady pace
const CLEAR_DELAY = 2000;                   // once you're back, only the cursor/finger erases for this long,
const CLEAR_TIME = 6000;                    // then the rest disappears over this long, slowly at first
const ERASE_RADIUS = { phone: 50, desktop: 80 };  // px around the cursor/finger
const JIGGLE = 10;                                // px of mouse movement that doesn't count as "back"

const SHAPES = ['confetti-shape', 'circle-shape', 'star-shape'];
const shapeContainer = document.getElementById('shape-container');
const placed = []; // { el, x, y } for every shape on the page, oldest first
let shapeBag = [];

/* placing shapes */

function perScreen() {
    return isPhone.matches ? SHAPES_PER_SCREEN.phone : SHAPES_PER_SCREEN.desktop;
}

// Deals the three shape types in shuffled rounds, so no fixed pattern and no long runs.
function nextShapeType() {
    if (shapeBag.length === 0) {
        shapeBag = [...SHAPES].sort(() => Math.random() - 0.5);
    }
    return shapeBag.pop();
}

// A random spot anywhere on the page, including a little past its edges.
function randomSpot() {
    return {
        x: Math.random() * (shapeContainer.offsetWidth + 2 * EDGE_OVERHANG) - EDGE_OVERHANG,
        y: Math.random() * (shapeContainer.offsetHeight + 2 * EDGE_OVERHANG) - EDGE_OVERHANG,
    };
}

function distanceToNearest(spot) {
    let nearest = Infinity;
    for (const p of placed) {
        nearest = Math.min(nearest, (p.x - spot.x) ** 2 + (p.y - spot.y) ** 2);
    }
    return nearest;
}

function createShape() {
    let best = randomSpot();
    let bestDistance = distanceToNearest(best);
    for (let i = 1; i < CANDIDATES; i++) {
        const spot = randomSpot();
        const distance = distanceToNearest(spot);
        if (distance > bestDistance) {
            best = spot;
            bestDistance = distance;
        }
    }

    const shape = document.createElement('div');
    shape.className = `shape ${nextShapeType()}`;
    shape.style.left = best.x + 'px';
    shape.style.top = best.y + 'px';
    const scale = 0.8 + Math.random() * 0.4;
    shape.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg) scale(${scale})`;
    shapeContainer.appendChild(shape);
    placed.push({ el: shape, ...best });
}

// Most shapes the page holds: one screen's worth per screen of page height.
function screensOfPage() {
    return Math.max(1, shapeContainer.offsetHeight / window.innerHeight);
}

function maxShapes() {
    return Math.min(MAX_TOTAL, Math.round(perScreen() * screensOfPage()));
}

/* click shower */

let shapesPerTick = 0;
let spawnTimer = null;
let sweepTimer = null;

function spawnShapes() {
    for (let i = 0; i < shapesPerTick; i++) {
        if (placed.length >= maxShapes()) {
            startSweep();
            return;
        }
        createShape();
    }
}

// Removes the oldest shapes, about 10 seconds to clear a full page.
function startSweep() {
    clearInterval(spawnTimer);
    spawnTimer = null;
    shapesPerTick = 0;
    const perTick = Math.ceil(placed.length / 100);
    sweepTimer = setInterval(() => {
        placed.splice(0, perTick).forEach(p => p.el.remove());
        if (placed.length === 0) {
            clearInterval(sweepTimer);
            sweepTimer = null;
        }
    }, 100);
}

document.querySelector('.confetti-button').addEventListener('click', () => {
    if (sweepTimer) return; // ignore clicks while sweeping up
    shapesPerTick++;
    clearInterval(spawnTimer);
    spawnTimer = setInterval(spawnShapes, 100);
});

/* idle confetti */

let idleState = 'off'; // 'off' | 'falling' | 'full'
let idleTimer = null;
let fallTimer = null;
let fallElapsed = 0;
let pointer = { x: 0, y: 0 };      // last known mouse position (screen coordinates)
let idleAnchor = { x: 0, y: 0 };   // where the mouse was when the confetti started
const leaving = new Set();         // shapes waiting for their turn to disappear

function restartIdleTimer() {
    clearTimeout(idleTimer);
    if (!reducedMotion.matches) {
        idleTimer = setTimeout(startFalling, IDLE_AFTER);
    }
}

function startFalling() {
    // Never mix with the click shower; try again later if it's running.
    if (spawnTimer || sweepTimer || placed.length > 0) {
        restartIdleTimer();
        return;
    }
    idleState = 'falling';
    idleAnchor = { ...pointer };
    fallElapsed = 0;
    fallTimer = setInterval(fall, 250);
}

// Adds shapes on a curve that starts as a sprinkle and speeds up. Phones and desktop follow
// the same pace (per screen of page), each stopping at its own limit.
function fall() {
    if (document.hidden) return; // only count time while the page is actually on screen
    fallElapsed += 250;
    const perScreenSoFar = SHAPES_PER_SCREEN.desktop * Math.min(1, fallElapsed / IDLE_FILL_TIME) ** IDLE_RAMP;
    const target = Math.min(maxShapes(), Math.round(perScreenSoFar * screensOfPage()));
    while (placed.length < target) {
        createShape();
    }
    if (placed.length >= maxShapes()) {
        clearInterval(fallTimer);
        idleState = 'full'; // hold here until they're back
    }
}

// They're back: stop adding. The cursor/finger erases straight away; after CLEAR_DELAY the rest
// start disappearing one at a time, a few at first and more towards the end of CLEAR_TIME
// (the square root bunches the random moments towards the end).
function wake() {
    clearInterval(fallTimer);
    idleState = 'off';
    for (const p of placed.splice(0)) {
        const delay = CLEAR_DELAY + CLEAR_TIME * Math.sqrt(Math.random());
        p.timeout = setTimeout(() => removeShape(p), delay);
        leaving.add(p);
    }
}

function removeShape(p) {
    clearTimeout(p.timeout);
    leaving.delete(p);
    p.el.remove();
}

// Removes any leaving shapes near a point (page coordinates) straight away.
function eraseAround(x, y) {
    const radius = isPhone.matches ? ERASE_RADIUS.phone : ERASE_RADIUS.desktop;
    for (const p of leaving) {
        if ((p.x - x) ** 2 + (p.y - y) ** 2 < radius ** 2) removeShape(p);
    }
}

function onActivity() {
    if (idleState !== 'off') wake();
    restartIdleTimer();
}

document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return; // touches are handled below
    pointer = { x: e.clientX, y: e.clientY };
    const jiggle = Math.hypot(pointer.x - idleAnchor.x, pointer.y - idleAnchor.y) < JIGGLE;
    if (idleState !== 'off' && jiggle) return; // a bumped desk doesn't count
    onActivity();
    eraseAround(e.pageX, e.pageY);
});

function onTouch(e) {
    onActivity();
    for (const touch of e.touches) eraseAround(touch.pageX, touch.pageY);
}
document.addEventListener('touchstart', onTouch, { passive: true });
document.addEventListener('touchmove', onTouch, { passive: true });

for (const type of ['pointerdown', 'keydown', 'wheel', 'scroll']) {
    document.addEventListener(type, onActivity, { passive: true });
}

restartIdleTimer();
