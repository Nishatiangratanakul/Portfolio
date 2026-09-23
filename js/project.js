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
        let media;
        if (file.toLowerCase().endsWith('.mp4')) {
            // No controls, so it plays like a GIF. (defaultMuted sets the muted
            // attribute too, which Safari needs before it will autoplay.)
            media = document.createElement('video');
            Object.assign(media, { src, autoplay: true, loop: true, muted: true, defaultMuted: true, playsInline: true });
        } else {
            media = document.createElement('img');
            media.src = src;
            media.alt = `${project.title}, image ${i + 1}`;
            if (i > 0) media.loading = 'lazy'; // only download images as you scroll to them
        }
        mediaContainer.appendChild(media);
    });
}
