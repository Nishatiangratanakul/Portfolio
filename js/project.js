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

    // one column, as the pages first were: title, what it is and what was made, then the picture
    container.innerHTML = `
        <div class="opening">
            <div class="opening-title">
                <h1>${esc(project.title)}</h1>
                <p class="meta">${esc([project.format || project.subject, project.year].filter(Boolean).join(' · '))}</p>
            </div>
            <div class="opening-text">
                ${paragraphs(project.summary || project.description)}
                ${deliverables ? `<ul class="made">${deliverables.map(t => `<li>${fmt(t)}</li>`).join('')}</ul>` : ''}
            </div>
        </div>
        <div class="hero"></div>
        <div class="sections"></div>
        <nav class="next-bar" aria-label="more projects"></nav>
    `;

    if (hero) container.querySelector('.hero').appendChild(createMedia(hero, project.title, false));
    const sectionsEl = container.querySelector('.sections');
    // a page can carry two versions of some sections ("option": "1" or "2") to compare; a switch picks one
    // ...and "tones": the same sections in a few background colours; "{tone}" in a section stands for the chosen one
    const tones = project.tones || [];
    const tone = tones.length ? picked(project, 'tone', tones) : null;
    let sections = project.sections || defaultSections(rest);
    if (tone) sections = JSON.parse(JSON.stringify(sections).replaceAll('{tone}', tone));
    const options = [...new Set(sections.map(s => s.option).filter(Boolean))].sort();
    const option = options.length ? picked(project, 'option', options) : null;
    sections.filter(s => !s.option || s.option === option).forEach(section => sectionsEl.appendChild(createSection(section, project.title)));
    showNextBar(project, visible);
    hoverNotes();
    if (options.length || tones.length) optionSwitcher(project, [['layout', 'option', options, option], ['colour', 'tone', tones, tone]]);
    if (new URLSearchParams(location.search).has('try')) sectionsSwitcher();
}

function picked(project, kind, values) {
    let v = null;
    try { v = localStorage.getItem(kind + '-' + slugify(project.title)); } catch (e) {}
    return values.includes(v) ? v : values[0];
}
function optionSwitcher(project, rows) {
    const box = document.createElement('div');
    box.className = 'look-switcher';
    box.innerHTML = rows.filter(([, , values]) => values.length).map(([label, kind, values, current]) =>
        `<div><span>${label}</span>${values.map(v => `<button type="button" data-kind="${kind}" data-val="${v}" aria-pressed="${v === current}">${kind === 'option' ? 'option ' + v : v}</button>`).join('')}</div>`).join('');
    box.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        try { localStorage.setItem(b.dataset.kind + '-' + slugify(project.title), b.dataset.val); } catch (err) {}
        location.reload();
    });
    document.body.appendChild(box);
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
// the facts (role, skills, advisors…) as one short run of text under the description
function facts(list) {
    return `<p class="facts">${list.map(([k, v]) => `<span><b>${esc(k)}</b> ${fmt(v)}</span>`).join('')}</p>`;
}

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
    // a viewer's big picture shows the note of whichever picture is in it
    // ...and each thumbnail shows the note of the picture it opens
    container.querySelectorAll('.viewer-thumbs button[data-note]').forEach(b => {
        b.addEventListener('mousemove', e => { if (!e.noteShown) { e.noteShown = true; show(b.dataset.note, e); } });
        b.addEventListener('mouseleave', () => { tip.hidden = true; });
    });
    container.querySelectorAll('.viewer-stage').forEach(stage => {
        stage.addEventListener('mousemove', e => { if (stage.dataset.note && !e.noteShown) { e.noteShown = true; show(stage.dataset.note, e); } });
        stage.addEventListener('mouseleave', () => { tip.hidden = true; });
    });
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
    el.className = `project-section layout-${section.layout || 'full'}${section.dark ? ' dark' : ''}${section.centred ? ' centred' : ''}${section.fill ? ' fill' : ''}${section.tone ? ' tone-' + section.tone : ''}${section.tall ? ' tall' : ''}`;
    const grid = document.createElement('div');
    grid.className = 'section-media';
    if (section.columns) grid.style.setProperty('--cols', section.columns);
    if (section.columns) el.classList.add('has-columns');
    const items = section.media.map(item => typeof item === 'string' ? { src: item } : item);
    // pictures that give their shape (width / height) share one height: each column is as wide as its picture
    if (section.layout !== 'posts' && items.every(i => i.ratio)) {
        grid.style.setProperty('--ratios', items.map(i => `minmax(0, ${i.ratio}fr)`).join(' '));
        el.classList.add('even');
    }
    if (section.layout === 'posts') {
        buildPosts(el, grid, items, section, title);
        return el;
    }
    if (section.layout === 'viewer') {
        buildViewer(el, grid, items, title, section.zoom !== false);
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
            // a loop can give another version for phones (e.g. stacked instead of side by side)
            const phoneLoop = item.phone && /\.mp4$/i.test(item.phone) && matchMedia('(max-width: 600px)').matches;
            let media = item.back ? createFlip(src, item.back, caption || title) : createMedia(phoneLoop ? item.phone : src, `${title}, image ${i + 1}`, true);
            if (item.phone && !phoneLoop && media.tagName === 'IMG') media = forPhones(media, item.phone);
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
// posts: each post drawn the way Instagram shows one (account, the picture or carousel or clip,
// the icons, likes, the start of the caption, the date), in a row that scrolls sideways with arrows
function buildPosts(el, grid, items, section, title) {
    const svg = (inner, box = '0 0 24 24') => `<svg viewBox="${box}" aria-hidden="true">${inner}</svg>`;
    const stroke = 'fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"';
    const ICON = {
        like: svg('<path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"/>'),
        comment: svg(`<path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" ${stroke}/>`),
        share: svg(`<path d="M13.973 20.046 21.77 6.928C22.8 5.195 21.55 3 19.535 3H4.466C2.138 3 .984 5.825 2.646 7.456l4.842 4.752 1.723 7.121c.548 2.266 3.571 2.721 4.762.717Z" ${stroke}/><line ${stroke} stroke-linecap="round" x1="7.488" x2="15.515" y1="12.208" y2="7.641"/>`),
        save: svg(`<polygon ${stroke} stroke-linecap="round" points="20 21 12 13.44 4 21 4 3 20 3 20 21"/>`),
        more: svg('<circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>'),
        clip: svg('<path d="M22.942 7.464c-.062-1.36-.306-2.143-.511-2.671a5.366 5.366 0 0 0-1.272-1.952 5.364 5.364 0 0 0-1.951-1.27c-.53-.207-1.312-.45-2.673-.513-1.2-.054-1.557-.066-4.535-.066s-3.336.012-4.536.066c-1.36.062-2.143.306-2.672.511-.769.3-1.371.692-1.951 1.272s-.973 1.182-1.27 1.951c-.207.53-.45 1.312-.513 2.673C1.004 8.665.992 9.022.992 12s.012 3.336.066 4.536c.062 1.36.306 2.143.511 2.671.298.77.69 1.373 1.272 1.952.58.581 1.182.974 1.951 1.27.53.207 1.311.45 2.673.513 1.199.054 1.557.066 4.535.066s3.336-.012 4.536-.066c1.36-.062 2.143-.306 2.671-.511a5.368 5.368 0 0 0 1.953-1.273c.58-.58.972-1.181 1.27-1.95.206-.53.45-1.312.512-2.673.054-1.2.066-1.557.066-4.535s-.012-3.336-.066-4.536Zm-7.085 6.055-5.25 3c-1.167.667-2.619-.175-2.619-1.519V9c0-1.344 1.452-2.186 2.619-1.52l5.25 3c1.175.672 1.175 2.368 0 3.04Z"/>'),
    };
    const account = section.account || '';
    const avatar = section.avatar ? `<img class="post-avatar" src="assets/${section.avatar}" alt="" loading="lazy">` : '';
    items.forEach((item, i) => {
        const slides = item.media || [item.src];
        const card = document.createElement('figure');
        card.className = 'post';
        card.innerHTML = `
            <div class="post-head">${avatar}<b>${esc(account)}</b><span class="post-more">${ICON.more}</span></div>
            <div class="post-media"${item.ratio ? ` style="aspect-ratio: ${item.ratio}"` : ''}><div class="post-slides"></div>
                ${slides.length > 1 ? `<span class="post-count">1/${slides.length}</span>
                    <button type="button" class="post-step prev" aria-label="previous picture" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6 8.5 12l6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                    <button type="button" class="post-step next" aria-label="next picture"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ''}
                ${/\.mp4$/i.test(slides[0]) ? `<span class="post-clip">${ICON.clip}</span>` : ''}
            </div>
            ${slides.length > 1 ? `<div class="post-dots">${slides.map((_, k) => `<i${k ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}
            <div class="post-icons">${ICON.like}${ICON.comment}${ICON.share}<span></span>${ICON.save}</div>
            ${item.likes ? `<p class="post-likes">${esc(item.likes)} likes</p>` : ''}
            ${item.caption ? `<p class="post-caption"><b>${esc(account)}</b> <span>${esc(item.caption).replace(/\n/g, '<br>')}</span></p><button type="button" class="post-open">more</button>` : ''}
            ${item.date ? `<p class="post-date">${esc(item.date)}</p>` : ''}`;
        const box = card.querySelector('.post-slides');
        slides.forEach((src, k) => box.appendChild(createMedia(src, `${title}, post ${i + 1}, picture ${k + 1}`, true)));
        if (slides.length > 1) {
            let at = 0;
            const go = n => {
                at = Math.max(0, Math.min(slides.length - 1, n));
                box.style.transform = `translateX(${-100 * at}%)`;
                card.querySelector('.post-count').textContent = `${at + 1}/${slides.length}`;
                card.querySelectorAll('.post-dots i').forEach((d, k) => d.classList.toggle('on', k === at));
                card.querySelector('.post-step.prev').hidden = at === 0;
                card.querySelector('.post-step.next').hidden = at === slides.length - 1;
            };
            card.querySelector('.post-step.prev').addEventListener('click', () => go(at - 1));
            card.querySelector('.post-step.next').addEventListener('click', () => go(at + 1));
        }
        const open = card.querySelector('.post-open');
        if (open) {
            const cap = card.querySelector('.post-caption');
            requestAnimationFrame(() => { if (cap.scrollHeight <= cap.clientHeight + 2) open.remove(); });
            open.addEventListener('click', () => { cap.classList.add('open'); open.remove(); });
        }
        grid.appendChild(card);
    });
    const row = document.createElement('div');
    row.className = 'posts-row';
    row.appendChild(grid);
    // arrows to move through the posts (shown on every screen, so it's clear the row scrolls)
    const step = dir => grid.scrollBy({ left: dir * (grid.querySelector('.post').offsetWidth + 24), behavior: 'smooth' });
    row.insertAdjacentHTML('beforeend', '<div class="posts-nav"><button type="button" class="posts-arrow prev" aria-label="previous post">←</button><span>scroll to move</span><button type="button" class="posts-arrow next" aria-label="next post">→</button></div>');
    row.querySelector('.posts-arrow.prev').addEventListener('click', () => step(-1));
    row.querySelector('.posts-arrow.next').addEventListener('click', () => step(1));
    const ends = () => {
        row.querySelector('.posts-arrow.prev').disabled = grid.scrollLeft < 8;
        row.querySelector('.posts-arrow.next').disabled = grid.scrollLeft + grid.clientWidth > grid.scrollWidth - 8;
    };
    grid.addEventListener('scroll', ends, { passive: true });
    // a normal (up/down) scroll over the row moves it sideways, until it reaches either end
    grid.addEventListener('wheel', e => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        const atStart = grid.scrollLeft <= 0, atEnd = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 1;
        if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
        e.preventDefault();
        grid.scrollLeft += e.deltaY;
    }, { passive: false });
    addEventListener('resize', ends);
    requestAnimationFrame(ends);
    el.appendChild(row);
    if (section.caption) el.insertAdjacentHTML('beforeend', `<figcaption>${fmt(section.caption)}</figcaption>`);
}

function buildViewer(el, grid, items, title, zoom = true) {
    const stage = document.createElement('div');
    stage.className = 'viewer-stage';
    const thumbs = document.createElement('div');
    thumbs.className = 'viewer-thumbs';
    const stills = items.filter(item => !item.src.toLowerCase().endsWith('.mp4'));
    const noted = items.some(item => item.caption);
    const show = i => {
        // an item can give another picture for phones (e.g. a 2x2 grid instead of a row of four)
        const src = items[i].phone && matchMedia('(max-width: 600px)').matches ? items[i].phone : items[i].src;
        const media = createMedia(src, items[i].caption || `${title}, image ${i + 1}`, false);
        if (media.tagName === 'IMG' && !noted && zoom) {   // pictures with notes stay as they are; no full screen
            media.classList.add('zoomable');
            // full screen on the same black as the band, so scans on a dark band don't sit on a second black
            media.addEventListener('click', () => openLightbox(stills, stills.indexOf(items[i]), title, getComputedStyle(grid).backgroundColor));
        }
        stage.replaceChildren(media);
        thumbs.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-current', i === j));
        at = i;
        count.textContent = `${i + 1} / ${items.length}`;
        // each picture's own note: on hover over the big picture (desktop), written under the arrows (phones)
        stage.dataset.note = items[i].caption ? fmt(items[i].caption) : '';
        note.innerHTML = stage.dataset.note;
    };
    // phones: no thumbnails, just arrows and a count under the picture (and swiping the picture)
    let at = 0;
    const nav = document.createElement('div');
    nav.className = 'viewer-nav';
    nav.innerHTML = '<button type="button" aria-label="previous">←</button><span></span><button type="button" aria-label="next">→</button>';
    const count = nav.querySelector('span');
    const note = document.createElement('p');
    note.className = 'viewer-note';
    const step = d => show((at + d + items.length) % items.length);
    nav.querySelector('[aria-label="previous"]').addEventListener('click', () => step(-1));
    nav.querySelector('[aria-label="next"]').addEventListener('click', () => step(1));
    let touchX = null;
    stage.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX; touchX = null;
        if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    });
    items.forEach((item, i) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', item.caption || `image ${i + 1}`);
        if (item.caption) button.dataset.note = fmt(item.caption);
        button.appendChild(createImage(`assets/${item.thumb || item.src}`, '', false)); // small; load straight away
        button.addEventListener('click', () => show(i));
        thumbs.appendChild(button);
    });
    grid.append(stage, thumbs);
    if (items.length > 1) grid.appendChild(nav);
    if (items.some(it => it.caption)) grid.appendChild(note);
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
function openLightbox(items, start, title, background) {
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
    lightbox.style.background = background && background !== 'rgba(0, 0, 0, 0)' ? background : '';
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
