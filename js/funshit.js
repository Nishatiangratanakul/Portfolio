// Fun shit page, built from funshit.json ("intro" + "pieces"; see README.md). New order every visit.
// Desktop: a panel on the left ("fun shit" + intro, or the piece you're hovering) beside a grid;
//   clicking a piece opens it big on the right. < > go through its images, then on to the next piece.
// Phones: a cover flicking through everything, then one image at a time (swipe, tap or < >).

const ASSETS = '../assets/funshit/';
const phone = matchMedia('(max-width: 600px)');

fetch('../funshit.json')
    .then(response => response.json())
    .then(({ intro, pieces }) => {
        shuffle(pieces);
        const slides = pieces.flatMap((p, pi) => p.images.map((file, ii) => ({ pi, ii, src: ASSETS + file })));
        const page = document.querySelector('.funshit');
        const panel = page.querySelector('.panel');
        const viewer = createViewer(pieces, slides, panel, intro);
        buildGrid(pieces, page.querySelector('.grid'), panel, intro, viewer);
        buildCarousel(pieces, slides, page.querySelector('.carousel'), intro);
        renderPanel(panel, null, intro);
        document.addEventListener('keydown', e => viewer.key(e.key));
    })
    .catch(error => console.error('Could not load funshit.json:', error));

function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// title, then "medium, year", then the note; "fun shit" and the intro when nothing is picked
function pieceInfo(piece, intro) {
    if (!piece) return `<h1>fun shit</h1><p class="note">${esc(intro)}</p>`;
    const line = [piece.medium, piece.year].filter(Boolean).join(', ');
    return `<h1>${esc(piece.title)}</h1>${line ? `<p class="line">${esc(line)}</p>` : ''}${piece.note ? `<p class="note">${esc(piece.note)}</p>` : ''}`;
}

function renderPanel(panel, piece, intro) {
    panel.innerHTML = pieceInfo(piece, intro);
}

/* ---------- desktop: grid; hover shows the piece in the panel, click opens it ---------- */
function buildGrid(pieces, grid, panel, intro, viewer) {
    pieces.forEach((piece, i) => {
        const figure = document.createElement('figure');
        figure.innerHTML = `<img src="${ASSETS + piece.images[0]}" alt="${esc(piece.title)}" loading="lazy">`;
        figure.addEventListener('mouseenter', () => { if (!viewer.isOpen) renderPanel(panel, piece, intro); });
        figure.addEventListener('click', () => viewer.open(i));
        grid.appendChild(figure);
    });
    // back to "fun shit" only when the mouse leaves the whole grid, so it doesn't flicker between pieces
    grid.addEventListener('mouseleave', () => { if (!viewer.isOpen) renderPanel(panel, null, intro); });
}

/* ---------- desktop: the enlarged view, filling the right side ---------- */
function createViewer(pieces, slides, panel, intro) {
    const el = document.querySelector('.viewer');
    const img = el.querySelector('.stage img');
    let at = 0;

    function show() {
        const s = slides[at], piece = pieces[s.pi];
        img.src = s.src;
        img.alt = `${piece.title}, image ${s.ii + 1}`;
        el.querySelector('.count').textContent = piece.images.length > 1 ? `${s.ii + 1} / ${piece.images.length}` : '';
        renderPanel(panel, piece, intro);
        // load the images either side, so stepping is instant
        [-1, 1].forEach(d => { new Image().src = slides[(at + d + slides.length) % slides.length].src; });
    }
    function step(d) { at = (at + d + slides.length) % slides.length; show(); }
    function close() { el.hidden = true; renderPanel(panel, null, intro); }

    // start below the header (or the top of the screen once it's scrolled away), right of the panel
    function position() {
        el.style.setProperty('--viewer-top', Math.max(0, document.querySelector('header').getBoundingClientRect().bottom) + 'px');
        el.style.setProperty('--viewer-left', panel.getBoundingClientRect().right + 'px');
    }
    addEventListener('scroll', () => !el.hidden && position(), { passive: true });
    addEventListener('resize', () => !el.hidden && position());

    el.querySelector('.back').addEventListener('click', close);
    el.querySelector('.stage').addEventListener('click', close);
    el.querySelector('.nav').addEventListener('click', e => { const b = e.target.closest('[data-step]'); if (b) step(+b.dataset.step); });

    return {
        get isOpen() { return !el.hidden; },
        open(pieceIndex) {
            at = slides.findIndex(s => s.pi === pieceIndex);
            position();
            el.hidden = false;
            show();
        },
        key(k) {
            if (el.hidden) return;
            if (k === 'Escape') close();
            if (k === 'ArrowRight') step(1);
            if (k === 'ArrowLeft') step(-1);
        },
    };
}

/* ---------- phones: a cover, then one at a time ---------- */
function buildCarousel(pieces, slides, el, intro) {
    const img = el.querySelector('.cstage img');
    const info = el.querySelector('.cinfo');
    const everything = shuffle(slides.map(s => s.src));
    let at = -1, ci = 0; // -1 = the cover

    // the cover flicks through everything
    setInterval(() => {
        if (at !== -1 || !phone.matches) return;
        ci = (ci + 1) % everything.length;
        img.src = everything[ci];
    }, 900);

    function show() {
        el.classList.toggle('cover', at === -1);
        if (at === -1) {
            img.src = everything[ci];
            info.innerHTML = pieceInfo(null, intro);
            el.querySelector('.count').textContent = '';
            return;
        }
        const s = slides[at], piece = pieces[s.pi];
        img.src = s.src;
        img.alt = `${piece.title}, image ${s.ii + 1}`;
        info.innerHTML = pieceInfo(piece, intro);
        el.querySelector('.count').textContent = piece.images.length > 1 ? `${s.ii + 1} / ${piece.images.length}` : '';
        new Image().src = slides[(at + 1) % slides.length].src;
    }
    // the cover sits between the last piece and the first, so it loops
    function step(d) {
        at += d;
        if (at >= slides.length) at = -1;
        if (at < -1) at = slides.length - 1;
        show();
    }

    el.querySelector('.cnav').addEventListener('click', e => {
        const b = e.target.closest('[data-step]');
        if (b) step(+b.dataset.step);
        if (e.target.closest('.prompt')) step(1);
    });
    el.querySelector('.cstage').addEventListener('click', () => step(1));
    // fill from where the carousel starts to the bottom of the screen
    const fit = () => el.style.setProperty('--carousel-top', el.getBoundingClientRect().top + scrollY + 'px');
    fit();
    addEventListener('load', fit);
    let touch = null;
    el.addEventListener('touchstart', e => { touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
    el.addEventListener('touchend', e => {
        if (!touch) return;
        const dx = touch.x - e.changedTouches[0].clientX, dy = touch.y - e.changedTouches[0].clientY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) step(Math.sign(dx));
        touch = null;
    });
    show();
}
