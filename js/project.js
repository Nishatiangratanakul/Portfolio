// Project page: project.html?p=<slug> shows the matching project from index.json.
// Desktop: the hero image, then title + year, then info rows on the work list's three columns
// (a label on the left, the content across the other two), then the images. Phones: title first.
//
// What a project can have in index.json (everything past title/year/description is optional;
// see README.md for a full example):
//   "hero":         "folder/image.jpg"   big image at the top (defaults to media1)
//   "summary":      the "description" row (defaults to "description")
//   "details":      [["role", "designer"], ["duration", "8 months"], …]   the "context" row
//   "deliverables": "what it turned into", or ["the book", "the posters", …] for a list
//   "rows":         [{ "label": "…", "text": "…" } or { "label": "…", "list": [["a", "b"], …] }, …]
//                   your own info rows instead of description · context · deliverables
//   "sections":     the blocks below, in order. Each is either images or a text row:
//                   { "layout": "full" | "pair" | "trio" | "row", "media": ["folder/a.jpg", { "src": "folder/b.mp4", "caption": "a note" }] }
//                   { "layout": "gallery", "media": [{ "src": "big.jpg", "thumb": "small.jpg", "caption": "…" }, …] }
//                     thumbnails in a row (or "columns": 3 for rows of three); clicking one opens it
//                     full screen, where clicking again zooms in
//                   { "layout": "viewer", "media": [{ "src": "big.mp4", "thumb": "small.jpg" }, …] }
//                     the first one big, the rest as thumbnails beside it that swap in when clicked
//                   { "label": "a new part", "text": "…" }
//                   add "caption": "…" for one note under the whole block
//                   "fill": true lets a viewer's pictures run to the band's edges; "tone": "dim" a softer black
//                   add "centred": true to a viewer to centre its picture in the whole band, thumbnails over the edge
//                   an item with "phone": "file" uses that crop on phones
//                   an item with "back": "b.jpg" turns over when clicked
//                   text anywhere can use *italics* and [a link](#posters) to jump to a part of the page
//                   add "dark": true to put any image block on black
// Without "sections", the mediaN images/videos are laid out in a mix of one and two across.

const slug = new URLSearchParams(location.search).get('p');
const container = document.querySelector('.project');

fetch('index.json')
    .then(response => response.json())
    .then(projects => {
        const project = projects.find(p => slugify(p.title) === slug);
        if (project) {
            showProject(project, projects.filter(p => !p.hidden));
        } else {
            container.innerHTML = `<p class="not-found">Project not found. <a href="index.html">> back to work</a></p>`;
        }
    })
    .catch(error => console.error('Could not load index.json:', error));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// text can carry *italics* and [links](#posters) (to jump to a part of the page)
const fmt = s => esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
const slugId = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function showProject(project, visible) {
    document.title = `${project.title} · Nisha Tiangratanakul`;
    const media = Object.keys(project).filter(k => /^media\d+$/.test(k)).map(k => project[k]);
    const hero = project.hero === false ? null : project.hero || media[0];   // "hero": false for none
    const rest = project.hero !== undefined ? media : media.slice(1);
    const deliverables = project.deliverables && (Array.isArray(project.deliverables) ? project.deliverables : [project.deliverables]);

    // the words first: title on the left; what it is and what was made on the right. Then the picture.
    container.innerHTML = `
        <div class="opening">
            <div class="opening-title">
                <h1>${esc(project.title)}</h1>
                <p class="meta">${esc([project.format || project.subject, project.year].filter(Boolean).join(' · '))}</p>
            </div>
            <div class="opening-text">
                ${paragraphs(project.summary || project.description)}
                ${deliverables ? `<ul class="made">${deliverables.map(t => `<li>${fmt(t)}</li>`).join('')}</ul>` : ''}
                ${project.details ? `<a class="to-credits" href="#credits">details ↓</a>` : ''}
            </div>
        </div>
        <div class="hero"></div>
        <div class="sections"></div>
        ${project.details ? credits(project.details) : ''}
        <nav class="next-bar" aria-label="more projects"></nav>
    `;

    if (hero) container.querySelector('.hero').appendChild(createMedia(hero, project.title, false));
    const sectionsEl = container.querySelector('.sections');
    (project.sections || defaultSections(rest)).forEach(section => sectionsEl.appendChild(createSection(section, project.title)));
    showNextBar(project, visible);
    creditsSidebar();
    hoverNotes();
    if (new URLSearchParams(location.search).has('try')) sectionsSwitcher();
}

// On desktop, each part's writing shows as text ("text", the default) or only as notes over its
// pictures ("hover"). To compare, add ?try to the address: a small switcher appears.
function sectionsLook() {
    try { return localStorage.getItem('look-sections') === 'hover' ? 'hover' : 'text'; } catch (e) { return 'text'; }
}
function sectionsSwitcher() {
    const box = document.createElement('div');
    box.className = 'look-switcher';
    box.innerHTML = `<div><span>sections</span>${['text', 'hover'].map(v => `<button type="button" data-val="${v}" aria-pressed="${sectionsLook() === v}">${v}</button>`).join('')}</div>`;
    box.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        try { localStorage.setItem('look-sections', b.dataset.val); } catch (err) {}
        location.reload();
    });
    document.body.appendChild(box);
}

// Credits in a panel that slides out from the right, under the nav, when "credits" is clicked
// (on phones it opens right under the link instead)
function creditsSidebar() {
    const panel = container.querySelector('.credits');
    const link = container.querySelector('.to-credits');
    if (!panel || !link) return;
    link.textContent = 'details +';
    link.after(panel);   // on phones it opens right here, under the link
    panel.insertAdjacentHTML('afterbegin', '<button type="button" class="credits-close" aria-label="close details">×</button>');
    const open = on => {
        panel.classList.toggle('open', on);
        link.setAttribute('aria-expanded', on);
        link.textContent = on ? 'details −' : 'details +';
    };
    link.addEventListener('click', e => { e.preventDefault(); open(!panel.classList.contains('open')); });
    panel.querySelector('.credits-close').addEventListener('click', () => open(false));
    addEventListener('keydown', e => { if (e.key === 'Escape') open(false); });
    document.addEventListener('click', e => {
        if (matchMedia('(max-width: 600px)').matches) return;
        if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== link) open(false);
    });
    // the panel starts where the header ends
    const fit = () => document.body.style.setProperty('--header-bottom', Math.max(0, document.querySelector('header').getBoundingClientRect().bottom) + 'px');
    fit(); addEventListener('scroll', fit, { passive: true }); addEventListener('resize', fit);
}


const paragraphs = text => text ? fmt(text).split(/\n\n+/).map(p => `<p>${p}</p>`).join('') : '';

// the facts (role, time, advisors…) at the end of the page, like credits
function credits(list) {
    return `<section class="credits" id="credits">${list.map(([k, v]) => `<div><h2>${esc(k)}</h2><p>${fmt(v)}</p></div>`).join('')}</section>`;
}

// a short piece of writing between the pictures: a small heading, then the text and/or a list
function partText({ label, text, items, note }) {
    const short = `${label ? `<b>${esc(label)}</b> ` : ''}${fmt(note || text || '')}`;
    return `<div class="part-text" id="${slugId(label || '')}" data-note="${esc(short).replace(/"/g, '&quot;')}">
        ${label ? `<h2>${esc(label)}</h2>` : ''}
        ${text ? `<div class="part-words">${paragraphs(text)}</div>` : ''}
        ${items ? `<ul class="made">${items.map(t => `<li>${fmt(t)}</li>`).join('')}</ul>` : ''}
    </div>`;
}

// Touch screens: notes on single pictures are hidden; tapping the picture pops its note up
// over the bottom of it, and tapping again (or another picture) puts it away.
function tapNotes() {
    container.querySelectorAll('.project-section .section-media figure').forEach(fig => {
        const cap = fig.querySelector(':scope > figcaption');
        if (!cap || fig.querySelector('button')) return;   // gallery pictures open full screen instead
        cap.classList.add('tap-note');
        fig.classList.add('has-tap-note');
        fig.addEventListener('click', () => {
            const open = !fig.classList.contains('show-note');
            container.querySelectorAll('.show-note').forEach(f => f.classList.remove('show-note'));
            fig.classList.toggle('show-note', open);
        });
    });
}

// Notes on pictures: with a mouse, a note follows the cursor while you're over its picture
// (the note under the picture is hidden); on touch screens the note stays under the picture.
function hoverNotes() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return tapNotes();
    const tip = document.createElement('div');
    tip.className = 'hover-note';
    tip.hidden = true;
    document.body.appendChild(tip);
    const show = (html, e) => {
        tip.innerHTML = html;
        tip.hidden = false;
        const x = Math.min(e.clientX + 18, innerWidth - tip.offsetWidth - 12);
        tip.style.transform = `translate(${x}px, ${e.clientY + 18}px)`;
    };
    const attach = (area, html) => {
        area.classList.add('has-note');
        area.addEventListener('mousemove', e => { if (!e.noteShown) { e.noteShown = true; show(html, e); } });
        area.addEventListener('mouseleave', () => { tip.hidden = true; });
    };
    // notes on single pictures (these win over a part's note, being the innermost)
    {
        container.querySelectorAll('.project-section').forEach(section => {
            section.querySelectorAll('.section-media figure').forEach(fig => {
                const cap = fig.querySelector(':scope > figcaption');
                if (cap) { cap.classList.add('noted'); attach(fig, cap.innerHTML); }
            });
            const own = section.querySelector(':scope > figcaption');
            if (own) { own.classList.add('noted'); attach(section.querySelector('.section-media'), own.innerHTML); }
        });
    }
    // a part's writing, as a note over all its pictures (until the next part) - only in the "hover" look
    if (sectionsLook() === 'hover') {
        let note = null;
        [...container.querySelector('.sections').children].forEach(el => {
            if (el.classList.contains('part-text')) { note = el.dataset.note; el.classList.add('noted-part'); return; }
            if (note && el.classList.contains('project-section')) attach(el, note);
        });
    }
}

// no written sections yet: alternate one image with a pair side by side
function defaultSections(media) {
    const sections = [];
    for (let i = 0; i < media.length;) {
        const one = sections.length % 2 === 0 || i === media.length - 1;
        sections.push({ layout: one ? 'full' : 'pair', media: media.slice(i, i + (one ? 1 : 2)) });
        i += one ? 1 : 2;
    }
    return sections;
}

// a section: images (one, two or three across) with any notes under them, or a text row
function createSection(section, title) {
    if (!section.media) {
        const wrap = document.createElement('div');
        wrap.innerHTML = partText(section);
        return wrap.firstElementChild;
    }
    const el = document.createElement('section');
    el.className = `project-section layout-${section.layout || 'full'}${section.dark ? ' dark' : ''}${section.centred ? ' centred' : ''}${section.fill ? ' fill' : ''}${section.tone ? ' tone-' + section.tone : ''}`;
    const grid = document.createElement('div');
    grid.className = 'section-media';
    if (section.columns) grid.style.setProperty('--cols', section.columns);
    if (section.columns) el.classList.add('has-columns');
    const items = section.media.map(item => typeof item === 'string' ? { src: item } : item);
    if (section.layout === 'viewer') {
        buildViewer(el, grid, items, title);
        if (section.caption) el.insertAdjacentHTML('beforeend', `<figcaption>${fmt(section.caption)}</figcaption>`);
        return el;
    }
    items.forEach((item, i) => {
        const { src, thumb, caption } = item;
        const figure = document.createElement('figure');
        if (section.layout === 'gallery') {
            // a thumbnail that opens the full image
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('aria-label', `open ${caption || `image ${i + 1}`}`);
            button.appendChild(createImage(`assets/${thumb || src}`, caption || `${title}, image ${i + 1}`, true));
            button.addEventListener('click', () => openLightbox(items, i, title));
            figure.appendChild(button);
        } else {
            let media = item.back ? createFlip(src, item.back, caption || title) : createMedia(src, `${title}, image ${i + 1}`, true);
            if (item.phone && media.tagName === 'IMG') media = forPhones(media, item.phone);
            figure.appendChild(media);
            markPortrait(media.tagName === 'PICTURE' ? media.querySelector('img') : media, figure);
            // on black, the note sits under the band, like every other note
            if (caption && !section.dark) figure.insertAdjacentHTML('beforeend', `<figcaption>${fmt(caption)}</figcaption>`);
        }
        grid.appendChild(figure);
    });
    el.appendChild(grid);
    if (section.dark) items.filter(i => i.caption && section.layout !== 'gallery')
        .forEach(i => el.insertAdjacentHTML('beforeend', `<figcaption>${fmt(i.caption)}</figcaption>`));
    // one note for the whole block (e.g. a pair)
    if (section.caption) el.insertAdjacentHTML('beforeend', `<figcaption>${fmt(section.caption)}</figcaption>`);
    return el;
}

// full-width blocks fill the width; only upright (portrait) pictures are held to the screen height
function markPortrait(media, figure) {
    const check = () => {
        const w = media.naturalWidth || media.videoWidth, h = media.naturalHeight || media.videoHeight;
        if (w && h) figure.classList.toggle('portrait', h > w);
    };
    media.addEventListener(media.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', check);
    check();
}

// viewer: one big image (the first item to start), with small thumbnails beside it; clicking a
// thumbnail shows that item in the big spot, and clicking a big picture opens it full screen to zoom
function buildViewer(el, grid, items, title) {
    const stage = document.createElement('div');
    stage.className = 'viewer-stage';
    const thumbs = document.createElement('div');
    thumbs.className = 'viewer-thumbs';
    const stills = items.filter(item => !item.src.toLowerCase().endsWith('.mp4'));
    const show = i => {
        const media = createMedia(items[i].src, items[i].caption || `${title}, image ${i + 1}`, false);
        if (media.tagName === 'IMG') {
            media.classList.add('zoomable');
            media.addEventListener('click', () => openLightbox(stills, stills.indexOf(items[i]), title));
        }
        stage.replaceChildren(media);
        thumbs.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-current', i === j));
    };
    items.forEach((item, i) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', item.caption || `image ${i + 1}`);
        button.appendChild(createImage(`assets/${item.thumb || item.src}`, '', false)); // small; load straight away
        button.addEventListener('click', () => show(i));
        thumbs.appendChild(button);
    });
    grid.append(stage, thumbs);
    el.appendChild(grid);
    show(0);
    return el;
}

// a picture with a back: clicking turns it over (e.g. both sides of a poster)
function createFlip(front, back, alt) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'flip';
    button.setAttribute('aria-label', 'turn it over');
    button.innerHTML = `<span class="flip-inner"><img class="flip-front" src="assets/${front}" alt="${esc(alt)}"><img class="flip-back" src="assets/${back}" alt="${esc(alt)}, back"></span>`;
    button.addEventListener('click', () => button.classList.toggle('flipped'));
    return button;
}

// Full screen on black: < > in the middle (or arrow keys) to step, Esc or × (top right) to close.
// Clicking the image zooms in to about its real size; move the mouse (or drag on a phone) to look around.
let lightbox;
function openLightbox(items, start, title) {
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.innerHTML = `
            <button type="button" class="lb-close" aria-label="close">×</button>
            <div class="lb-stage"><img alt=""></div>
            <div class="lb-bar">
                <p class="lb-caption"></p>
                <div class="lb-nav">
                    <button type="button" data-step="-1" aria-label="previous">&lt;</button>
                    <button type="button" data-step="1" aria-label="next">&gt;</button>
                </div>
                <span class="lb-count"></span>
            </div>`;
        document.body.appendChild(lightbox);
    }
    const stage = lightbox.querySelector('.lb-stage');
    const img = stage.querySelector('img');
    let at = start;

    const show = () => {
        const item = items[at];
        stage.classList.remove('zoomed');
        img.src = `assets/${item.src}`;
        img.alt = item.caption || `${title}, image ${at + 1}`;
        lightbox.querySelector('.lb-caption').textContent = item.caption || '';
        lightbox.querySelector('.lb-count').textContent = `${at + 1} / ${items.length}`;
        [-1, 1].forEach(d => { new Image().src = `assets/${items[(at + d + items.length) % items.length].src}`; });
    };
    const step = d => { at = (at + d + items.length) % items.length; show(); };
    const pan = e => {
        if (!stage.classList.contains('zoomed')) return;
        const r = stage.getBoundingClientRect();
        stage.scrollLeft = (e.clientX - r.left) / r.width * (stage.scrollWidth - r.width);
        stage.scrollTop = (e.clientY - r.top) / r.height * (stage.scrollHeight - r.height);
    };
    const close = () => {
        lightbox.hidden = true;
        document.documentElement.style.overflow = '';
        removeEventListener('keydown', onKey);
    };
    const onKey = e => {
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
    };

    // fresh handlers each time it opens (this gallery's images)
    lightbox.querySelector('.lb-nav').onclick = e => {
        const b = e.target.closest('[data-step]');
        if (b) step(+b.dataset.step);
    };
    lightbox.querySelector('.lb-close').onclick = close;
    img.onclick = e => {
        const zoomed = stage.classList.toggle('zoomed');
        // zoom in on the spot that was clicked (mouse) or leave it for dragging (touch)
        if (zoomed && e.pointerType !== 'touch') requestAnimationFrame(() => pan(e));
    };
    stage.onmousemove = pan;
    stage.onclick = e => { if (e.target === stage) close(); };

    lightbox.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    addEventListener('keydown', onKey);
    show();
}

function createMedia(file, alt, lazy) {
    const src = `assets/${file}`;
    return file.toLowerCase().endsWith('.mp4') ? createLoopingVideo(src, alt) : createImage(src, alt, lazy);
}

// a different crop of a picture for phones ("phone": "file" on an item)
function forPhones(img, file) {
    const picture = document.createElement('picture');
    picture.innerHTML = `<source media="(max-width: 600px)" srcset="assets/${file}">`;
    img.loading = 'eager';   // lazy pictures with a <source> can fail to start loading
    picture.appendChild(img);
    return picture;
}

function createImage(src, alt, lazy) {
    const image = document.createElement('img');
    image.src = src;
    image.alt = alt;
    if (lazy) image.loading = 'lazy'; // only download images as you scroll to them
    return image;
}

// Plays like a GIF: silent, looping, no controls. Each video has a still of its first frame
// beside it (media-2.mp4 -> media-2-poster.jpg), shown while it loads and used instead if the
// browser won't autoplay (e.g. iPhones in Low Power Mode), so a play button never appears.
function createLoopingVideo(src, alt) {
    const poster = src.replace(/\.mp4$/i, '-poster.jpg');
    const video = document.createElement('video');
    // defaultMuted sets the muted attribute too, which Safari needs before it will autoplay.
    Object.assign(video, { src, poster, autoplay: true, loop: true, muted: true, defaultMuted: true, playsInline: true });
    video.setAttribute('aria-label', alt);
    video.play().catch(error => {
        if (error.name === 'NotAllowedError') video.replaceWith(createImage(poster, alt, false));
    });
    // start from the first frame each time it scrolls into view, so a sequence reads in order
    new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !video.dataset.seen) { video.dataset.seen = '1'; video.currentTime = 0; video.play().catch(() => {}); }
        if (!entry.isIntersecting) delete video.dataset.seen;
    }, { threshold: 0.4 }).observe(video);
    return video;
}

// "← previous", "↑ top" and "next →" as plain text; hovering previous/next shows a small preview just above it.
function showNextBar(project, visible) {
    const bar = container.querySelector('.next-bar');
    const i = visible.findIndex(p => p.title === project.title);
    const at = n => visible[(n + visible.length) % visible.length];
    const prev = i === -1 ? visible[visible.length - 1] : at(i - 1);
    const next = i === -1 ? visible[0] : at(i + 1);

    const link = (p, dir) => {
        const a = document.createElement('a');
        a.className = `next-link ${dir}`;
        a.href = `project.html?p=${slugify(p.title)}`;
        if (p.title.length > 13) a.classList.add('long');   // longer than "contemplating": may wrap on phones
        // the arrow sits apart from the title, level with its first line, so wrapped lines align with each other
        a.innerHTML = dir === 'prev'
            ? `<span class="label"><span class="arrow">←</span><span class="name">${esc(p.title)}</span></span>`
            : `<span class="label"><span class="name">${esc(p.title)}</span><span class="arrow">→</span></span>`;
        const peek = document.createElement('span');
        peek.className = 'peek';
        peek.appendChild(p.preview
            ? Object.assign(document.createElement('video'), { src: `assets/${p.preview}`, muted: true, loop: true, playsInline: true, preload: 'none' })
            : createImage(`assets/${p.icon}`, '', true));
        a.appendChild(peek);
        const video = peek.querySelector('video');
        a.addEventListener('mouseenter', () => { if (video) { video.currentTime = 0; video.play().catch(() => {}); } });
        a.addEventListener('mouseleave', () => video?.pause());
        return a;
    };
    // back to the top (and the header's work · fun shit · about) from the bottom of a long page
    const top = document.createElement('a');
    top.className = 'to-top';
    top.href = '#';
    top.textContent = '↑ top';
    top.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); });
    bar.append(link(prev, 'prev'), top, link(next, 'next'));
}
