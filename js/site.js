// Shared by every page: builds the header and footer. (The confetti lives in js/confetti.js.)

// Site root, worked out from where this script lives, so links work from any folder depth.
const ROOT = new URL('..', document.currentScript.src).href;

// Turns a project title into its URL name, e.g. "lego sans" -> "lego-sans".
function slugify(title) {
    return title.toLowerCase().replace(/\s+/g, '-');
}

/* header + footer */

document.body.insertAdjacentHTML('afterbegin', `
    <header>
        <nav>
            <a href="${ROOT}about/index.html" class="nav-link subheading">n.tiang</a>
            <a href="${ROOT}index.html" class="nav-link subheading">work</a>
            <a href="${ROOT}funshit/index.html" class="nav-link subheading">fun shit</a>
        </nav>
        <hr class="nav-line">
    </header>
`);

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
