// Work page: builds the project list from index.json.
// On desktop, hovering a row shows that project's icon large in the middle of the screen;
// on phones the icon is shown above each row instead (see css/index.css).

const projectList = document.querySelector('.project-list');
const hoverPreview = document.createElement('div');
hoverPreview.className = 'hover-preview';
document.body.appendChild(hoverPreview);

fetch('index.json')
    .then(response => response.json())
    .then(projects => {
        projects
            .filter(project => !project.hidden)
            .forEach(project => projectList.appendChild(createRow(project)));
    })
    .catch(error => console.error('Could not load index.json:', error));

function createRow(project) {
    const iconUrl = `assets/${project.icon}`;

    const row = document.createElement('a');
    row.className = 'content-container';
    row.href = `project.html?p=${slugify(project.title)}`;
    row.innerHTML = `
        <img class="icon" src="${iconUrl}" alt="">
        <div class="text-container">
            <div class="title body"></div>
            <div class="subject body"></div>
            <div class="year body"></div>
        </div>
    `;
    row.querySelector('.title').textContent = project.title;
    row.querySelector('.subject').textContent = project.subject;
    row.querySelector('.year').textContent = project.year;

    row.addEventListener('mouseenter', () => {
        hoverPreview.style.backgroundImage = `url("${iconUrl}")`;
        hoverPreview.style.display = 'block';
    });
    row.addEventListener('mouseleave', () => {
        hoverPreview.style.display = 'none';
    });

    return row;
}
