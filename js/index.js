window.addEventListener('DOMContentLoaded', () => {
    const indexContainer = document.querySelector('.index-container');
    const footer = document.querySelector('footer');
    const customCursor = document.createElement('div'); // Create custom cursor element
    customCursor.classList.add('custom-cursor');
    indexContainer.appendChild(customCursor); // Append custom cursor to index container

    const resizeObserver = new ResizeObserver(entries => {
        const indexContainerHeight = entries[0].contentRect.height;
        const viewportHeight = window.innerHeight;
        const footerHeight = footer.offsetHeight;

        if (indexContainerHeight + footerHeight < viewportHeight) {
            footer.style.position = 'absolute';
            footer.style.bottom = '0';
        } else {
            footer.style.position = 'relative';
            footer.style.bottom = 'auto';
        }
    });

    resizeObserver.observe(indexContainer);


    // Fetch data from JSON and dynamically load content
    fetch('index.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                const contentContainer = document.createElement('a');
                contentContainer.classList.add('content-container');
                contentContainer.href = `subpages/${item.title.toLowerCase().replace(/\s/g, '-')}.html`;

                const textContainer = document.createElement('div');
                textContainer.classList.add('text-container');

                const title = document.createElement('div');
                const subject = document.createElement('div');
                const year = document.createElement('div');

                title.classList.add('title', 'info', 'body', 'space-grotesk');
                subject.classList.add('subject', 'info', 'body', 'space-grotesk');
                year.classList.add('year', 'info', 'body', 'space-grotesk');

                title.textContent = item.title;
                subject.textContent = item.subject;
                year.textContent = item.year;

                textContainer.appendChild(title);
                textContainer.appendChild(subject);
                textContainer.appendChild(year);

                const imageContainer = document.createElement('tr');
                imageContainer.classList.add('image-container');

                const icon = document.createElement('img');
                icon.classList.add('icon');
                icon.src = `assets/${item.icon}`;
                icon.alt = "icon";
                

                contentContainer.addEventListener('mouseenter', () => {
                    customCursor.style.backgroundImage = `url(${icon.src})`;
                    customCursor.style.display = 'block';
                });

                contentContainer.addEventListener('mouseleave', () => {
                    customCursor.style.display = 'none';
                });

                imageContainer.appendChild(icon);

                // Append image to the container for mobile breakpoint
                if (window.innerWidth <= 600) {
                    contentContainer.appendChild(icon);
                }

                contentContainer.appendChild(textContainer);

                // Append image to the container for laptop breakpoint
                if (window.innerWidth > 600) {
                    contentContainer.appendChild(imageContainer);
                }

                indexContainer.appendChild(contentContainer);
            });
        });
});

// Function to create image element
function createImageElement(imagePath) {
    const image = document.createElement('img');
    image.src = imagePath;

    console.log('Creating image element for:', imagePath);

    // Check if the file extension is .gif
    if (imagePath.toLowerCase().endsWith('.gif')) {
        console.log('Detected GIF:', imagePath);
        // Add a class to the image to apply the animation
        image.classList.add('slow-gif');
        console.log('Applied slow-gif class to:', image);
    }

    return image;
}


