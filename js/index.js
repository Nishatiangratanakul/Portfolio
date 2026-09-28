// Work page: builds the project list from index.json.
// Each row reads: title · what it is (the "format" field, or "subject" until that's filled in) · year.
// Desktop: hovering a row plays its looping preview, big, in the middle of the screen.
// Phones: each row shows its preview above it, playing while it's on screen.

const projectList = document.querySelector('.project-list');
const hoverPreview = document.createElement('div');
hoverPreview.className = 'hover-preview';
document.body.appendChild(hoverPreview);

// Hover previews all take up about the same area, so portrait ones don't look smaller than landscape.
const PREVIEW_AREA = 0.25;  // fraction of the screen
const PREVIEW_MAX_W = 0.55; // never wider than this share of the screen…
const PREVIEW_MAX_H = 0.7;  // …or taller than this

fetch('index.json')
    .then(response => response.json())
    .then(projects => {
        projects
            .filter(project => !project.hidden)
            .forEach(project => projectList.appendChild(createRow(project)));
    })
    .catch(error => console.error('Could not load index.json:', error));

// A looping preview: the project's preview video, or its icon if it doesn't have one yet.
function createMedia(project, lazy) {
    if (!project.preview) {
        const img = document.createElement('img');
        img.src = `assets/${project.icon}`;
        img.alt = '';
        return img;
    }
    const video = document.createElement('video');
    Object.assign(video, {
        src: `assets/${project.preview}`,
        poster: `assets/${project.icon}`,
        muted: true, defaultMuted: true, loop: true, playsInline: true,
        preload: lazy ? 'none' : 'metadata',
    });
    return video;
}

function createRow(project) {
    const row = document.createElement('a');
    row.className = 'project-row';
    row.href = `project.html?p=${slugify(project.title)}`;
    row.innerHTML = `
        <div class="row-preview"></div>
        <span class="title"></span>
        <span class="format"></span>
        <span class="year"></span>
    `;
    row.querySelector('.year').textContent = project.year;
    row.querySelector('.title').textContent = project.title;
    row.querySelector('.format').textContent = project.format || project.subject;

    // phones: inline preview that plays only while it's on screen
    const inline = createMedia(project, true);
    row.querySelector('.row-preview').appendChild(inline);
    if (inline.tagName === 'VIDEO') playWhenVisible(inline);

    // desktop: one big preview per project, shown on hover
    const big = createMedia(project, false);
    big.hidden = true;
    hoverPreview.appendChild(big);
    row.addEventListener('mouseenter', () => showPreview(big));
    row.addEventListener('mouseleave', () => hidePreview(big));

    return row;
}

function showPreview(media) {
    const w = media.videoWidth || media.naturalWidth;
    const h = media.videoHeight || media.naturalHeight;
    if (w && h) sizePreview(media, w / h);
    else media.addEventListener(media.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', () => showPreview(media), { once: true });
    media.hidden = false;
    if (media.tagName === 'VIDEO') {
        media.currentTime = 0;
        media.play().catch(() => {});
    }
}

function hidePreview(media) {
    media.hidden = true;
    if (media.tagName === 'VIDEO') media.pause();
}

// same area whatever the shape, within the max width/height
function sizePreview(media, ratio) {
    const area = PREVIEW_AREA * innerWidth * innerHeight;
    let w = Math.sqrt(area * ratio);
    let h = w / ratio;
    const fit = Math.min(1, (PREVIEW_MAX_W * innerWidth) / w, (PREVIEW_MAX_H * innerHeight) / h);
    media.style.width = w * fit + 'px';
    media.style.height = h * fit + 'px';
}

const visibility = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.play().catch(() => {});
    else entry.target.pause();
}), { threshold: 0.4 });

function playWhenVisible(video) {
    if (matchMedia('(max-width: 600px)').matches) visibility.observe(video);
}
