// Shared by every page: builds the header and footer. (The confetti lives in js/confetti.js.)

// Site root, worked out from where this script lives, so links work from any folder depth.
const ROOT = new URL('..', document.currentScript.src).href;

// Turns a project title into its URL name, e.g. "lego sans" -> "lego-sans".
// a project's address: letters, numbers and dashes only ("worm & whisk" -> "worm-whisk")
function slugify(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* about: the "about" link in the header opens this. Edit your text here. */

const INFO = {
    bio: 'Nisha is a New York–based designer working across books, print, and branding. Her process often begins with research and conversation. She’s drawn to shared human experience: the ways we talk (or don’t) about grief, the languages we switch between, and the tables we gather around. A graduate of Parsons School of Design, she’s happiest making things that bring people together, whether that’s a book, an event, or just a really good meal.',
    // newest first: [name, date]
    exhibitions: [
        ['Brooklyn Fine Art Print Fair', 'Apr 2026'],
        ['Parsons Making Space', 'Apr 2026'],
        ['MoCCA Festival', 'Mar 2026'],
        ['Offset Book Fair', 'Oct 2025'],
        ['Spitting Image Book Fair', 'Mar 2025'],
        ['Offset Book Fair', 'Oct 2024'],
    ],
    contact: [
        ['nishatiangratanakul@gmail.com', 'mailto:nishatiangratanakul@gmail.com'],
        ['instagram', 'https://www.instagram.com/nisha.tiang/'],
        ['linkedin', 'https://www.linkedin.com/in/jantima-tiangratanakul/'],
    ],
};

/* header + footer */

document.body.insertAdjacentHTML('afterbegin', `
    <header>
        <div class="header-row">
            <a href="${ROOT}index.html" class="site-name">n.tiang</a>
            <nav class="site-nav">
                <a href="${ROOT}index.html">work</a>
                <a href="${ROOT}funshit/index.html">fun shit</a>
                <button class="info-toggle" aria-expanded="false" aria-controls="info">about</button>
            </nav>
        </div>
        <section class="info" id="info" hidden>
            <p class="info-bio">${INFO.bio}</p>
            <div class="info-lists">
                <h2>exhibitions &amp; fairs</h2>
                <ul class="info-exhibitions">${INFO.exhibitions.map(([name, date]) => `<li><span>${name}</span><span>${date}</span></li>`).join('')}</ul>
                <h2>contact</h2>
                <ul class="info-contact">${INFO.contact.map(([label, href]) => `<li><a href="${href}">> ${label}</a></li>`).join('')}</ul>
            </div>
        </section>
    </header>
`);

// "about" opens and closes the info (and ?info in the URL opens it, e.g. from the old about page)
const infoButton = document.querySelector('.info-toggle');
const infoSection = document.getElementById('info');
function setInfo(open) {
    infoSection.hidden = !open;
    infoButton.setAttribute('aria-expanded', open);
}
infoButton.addEventListener('click', () => setInfo(infoSection.hidden));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !infoSection.hidden) setInfo(false); });
if (new URLSearchParams(location.search).has('info')) setInfo(true);

// mark the current section in the nav
document.querySelectorAll('.site-nav a').forEach(a => {
    const here = location.pathname.includes('/funshit/') ? 'fun shit' : 'work';
    if (a.textContent === here) a.setAttribute('aria-current', 'page');
});

document.body.insertAdjacentHTML('beforeend', `
    <footer>
        <div class="footer-text">
            <h2 class="subheading">contact</h2>
            <p class="body">nishatiangratanakul@gmail.com</p>
            <a class="body" href="https://www.linkedin.com/in/jantima-tiangratanakul/">> linkedin</a>
            <a class="body" href="https://www.instagram.com/nisha.tiang/">> instagram</a>
        </div>
        <button class="confetti-button" aria-label="throw confetti">
            <img src="${ROOT}assets/beeboe.png" class="icons" alt="">
        </button>
    </footer>
    <div id="shape-container"></div>
`);
