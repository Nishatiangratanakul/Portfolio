// Fun shit page: shows every image listed in funshit.json, newest (last in the list) first.

const grid = document.querySelector('.funshit-grid');

fetch('../funshit.json')
    .then(response => response.json())
    .then(data => {
        data.images.slice().reverse().forEach(fileName => {
            const img = document.createElement('img');
            img.className = 'funshit-image';
            img.src = `../assets/funshit/${fileName}`;
            img.alt = '';
            // funshit.json lists more names than there are files, so new images can just be dropped
            // into assets/funshit; names with no file yet are removed here.
            img.onerror = () => img.remove();
            grid.appendChild(img);
        });
    })
    .catch(error => console.error('Could not load funshit.json:', error));
