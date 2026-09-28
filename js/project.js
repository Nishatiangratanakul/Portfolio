// Project page: project.html?p=<slug> shows the matching project from index.json.
// Desktop: the hero image, then title + year, then info rows on the work list's three columns
// (a label on the left, the content across the other two), then the images. Phones: title first.
//
// What a project can have in index.json (everything past title/year/description is optional;
// see README.md for a full example):
//   "hero":         "folder/image.jpg"   big image at the top (defaults to media1)
//   "summary":      the "description" row (defaults to "description")
//   "details":      [["role", "designer"], ["duration", "8 months"], …]   the "context" row
//   "deliverables": "what it turned into"                              the "deliverables" row
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

function showProject(project, visible) {
    document.title = `${project.title} · Nisha Tiangratanakul`;
    const media = Object.keys(project).filter(k => /^media\d+$/.test(k)).map(k => project[k]);
    const hero = project.hero || media[0];
    const rest = project.hero ? media : media.slice(1);
    const rows = project.rows || [
        { label: 'description', text: project.summary || project.description },
        project.details && { label: 'context', list: project.details },
        project.deliverables && { label: 'deliverables', text: project.deliverables },
    ].filter(Boolean);

    container.innerHTML = `
        <div class="title-row">
            <h1>${esc(project.title)}</h1>
            <p class="year">${esc(project.year)}</p>
        </div>
        <div class="hero"></div>
        <div class="project-info">${rows.map(infoRow).join('')}</div>
        <div class="sections"></div>
        <nav class="next-bar" aria-label="more projects"></nav>
    `;

    if (hero) container.querySelector('.hero').appendChild(createMedia(hero, project.title, false));
    const sectionsEl = container.querySelector('.sections');
    (project.sections || defaultSections(rest)).forEach(section => sectionsEl.appendChild(createSection(section, project.title)));
    showNextBar(project, visible);
}

// a label on the left, then text or a list across the other two columns
function infoRow({ label, text, list }) {
    const body = list
        ? `<dl class="context">${list.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`
        : `<div class="text">${esc(text || '').split(/\n\n+/).map(p => `<p>${p}</p>`).join('')}</div>`;
    return `<div class="row"><h2>${esc(label || '')}</h2>${body}</div>`;
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
        const row = document.createElement('div');
        row.className = 'project-info';
        row.innerHTML = infoRow(section);
        return row;
    }
    const el = document.createElement('section');
    el.className = `project-section layout-${section.layout || 'full'}${section.dark ? ' dark' : ''}`;
    const grid = document.createElement('div');
    grid.className = 'section-media';
    if (section.columns) grid.style.setProperty('--cols', section.columns);
    if (section.columns) el.classList.add('has-columns');
    const items = section.media.map(item => typeof item === 'string' ? { src: item } : item);
    if (section.layout === 'viewer') return buildViewer(el, grid, items, title);
    items.forEach(({ src, thumb, caption }, i) => {
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
            figure.appendChild(createMedia(src, `${title}, image ${i + 1}`, true));
            if (caption) figure.insertAdjacentHTML('beforeend', `<figcaption>${esc(caption)}</figcaption>`);
        }
        grid.appendChild(figure);
    });
    el.appendChild(grid);
    return el;
}

// viewer: one big image (the first item to start), with small thumbnails beside it; clicking a
// thumbnail shows that item in the big spot
function buildViewer(el, grid, items, title) {
    const stage = document.createElement('div');
    stage.className = 'viewer-stage';
    const thumbs = document.createElement('div');
    thumbs.className = 'viewer-thumbs';
    const show = i => {
        stage.replaceChildren(createMedia(items[i].src, items[i].caption || `${title}, image ${i + 1}`, false));
        thumbs.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-current', i === j));
    };
    items.forEach((item, i) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', item.caption || `image ${i + 1}`);
        button.appendChild(createImage(`assets/${item.thumb || item.src}`, '', true));
        button.addEventListener('click', () => show(i));
        thumbs.appendChild(button);
    });
    grid.append(stage, thumbs);
    el.appendChild(grid);
    show(0);
    return el;
}

// Full screen on black: < > (or arrow keys) to step, Esc or × to close.
// Clicking the image zooms in to about its real size; move the mouse (or drag on a phone) to look around.
let lightbox;
function openLightbox(items, start, title) {
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.innerHTML = `
            <div class="lb-stage"><img alt=""></div>
            <div class="lb-bar">
                <p class="lb-caption"></p>
                <div class="lb-nav">
                    <span class="lb-count"></span>
                    <button type="button" data-step="-1" aria-label="previous">&lt;</button>
                    <button type="button" data-step="1" aria-label="next">&gt;</button>
                    <button type="button" class="lb-close" aria-label="close">×</button>
                </div>
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
        if (e.target.closest('.lb-close')) close();
    };
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
    return video;
}

// "← previous" and "next →" as plain text; hovering one shows a small preview just above it.
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
        a.innerHTML = `<span class="label">${dir === 'prev' ? `← ${esc(p.title)}` : `${esc(p.title)} →`}</span>`;
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
    bar.append(link(prev, 'prev'), link(next, 'next'));
}
