// Project page: project.html?p=<slug> shows the matching project from index.json.
// Every "mediaN" entry becomes an image, or a looping silent video if it ends in .mp4.

const slug = new URLSearchParams(location.search).get('p');
const container = document.querySelector('.project');

fetch('index.json')
    .then(response => response.json())
    .then(projects => {
        const project = projects.find(p => slugify(p.title) === slug);
        if (project) {
            showProject(project);
        } else {
            container.innerHTML = `<p class="body">Project not found. <a href="index.html">> back to work</a></p>`;
        }
    })
    .catch(error => console.error('Could not load index.json:', error));

function showProject(project) {
    document.title = `${project.title} · Nisha Tiangratanakul`;

    container.innerHTML = `
        <div class="text-container">
            <h1 class="heading project-title"></h1>
            <p class="subheading subject"></p>
            <p class="body description"></p>
        </div>
        <div class="media-container"></div>
    `;
    container.querySelector('.project-title').textContent = project.title;
    container.querySelector('.subject').textContent = project.subject;
    container.querySelector('.description').textContent = project.description;

    const mediaContainer = container.querySelector('.media-container');
    const mediaFiles = Object.keys(project)
        .filter(key => key.startsWith('media'))
        .map(key => project[key]);

    mediaFiles.forEach((file, i) => {
        const src = `assets/${file}`;
        const alt = `${project.title}, image ${i + 1}`;
        const media = file.toLowerCase().endsWith('.mp4')
            ? createLoopingVideo(src, alt)
            : createImage(src, alt, i > 0); // only download later images as you scroll to them
        mediaContainer.appendChild(media);
    });
}

function createImage(src, alt, lazy) {
    const image = document.createElement('img');
    image.src = src;
    image.alt = alt;
    if (lazy) image.loading = 'lazy';
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
