// Function to create video element
function createVideoElement(videoPath) {
    const video = document.createElement('video');
    video.src = videoPath;
    video.autoplay = true; // Autoplay the video
    video.loop = true; // Loop the video
    video.muted = true; // Mute the video
    video.playsinline = true; // Play the video inline on mobile
    video.classList.add('video'); // Add a class for styling
    return video;
}

// Function to create image element
function createImageElement(imagePath) {
    const image = document.createElement('img');
    image.src = imagePath;
    return image;
}

// Call the function to load page content when the DOM is loaded
document.addEventListener('DOMContentLoaded', loadPageContent);
// Function to fetch and load JSON data
function loadPageContent() {
    // Get the title of the current page
    const pageTitle = document.title.toLowerCase().replace(/\s/g, '-').replace('.html', '');

    console.log('Page Title:', pageTitle);

    // Fetch JSON data
    fetch('../index.json')
        .then(response => response.json())
        .then(data => {
            console.log('JSON Data:', data);

            // Find the item with the matching title
            const currentItem = data.find(item => item.title.toLowerCase().replace(/\s/g, '-') === pageTitle);

            if (currentItem) {
                // Get the container for subpages content
                const container = document.querySelector('.subpages');

                // Clear previous content
                container.innerHTML = '';

                // Create a content container
                const contentContainer = document.createElement('div');
                contentContainer.classList.add('subpages-container');

                // Create text container
                const textContainer = document.createElement('div');
                textContainer.classList.add('text-container');

                // Create title element
                const title = document.createElement('h1');
                title.classList.add('heading', 'project-title', 'space-grotesk');
                title.textContent = currentItem.title;
                textContainer.appendChild(title);

                // Create subject element
                const subject = document.createElement('p');
                subject.classList.add('subheading', 'project-subject', 'space-grotesk', 'subject');
                subject.textContent = currentItem.subject;
                textContainer.appendChild(subject);

                // Create description element
                const description = document.createElement('p');
                description.classList.add('body', 'space-grotesk', 'description');
                description.textContent = currentItem.description;
                textContainer.appendChild(description);

                // Append text container to content container
                contentContainer.appendChild(textContainer);

                // Create image container
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('img-container');

                // Create media elements
                const mediaElements = [];

                // Iterate over all media properties in currentItem
                for (const key in currentItem) {
                    if (key.startsWith('media')) {
                        if (key.endsWith('.mp4')) {
                            const video = createVideoElement(`../assets/${currentItem[key]}`);
                            video.classList.add(key); // Add class for styling
                            mediaElements.push(video);
                        } else {
                            const image = createImageElement(`../assets/${currentItem[key]}`);
                            image.classList.add(key); // Add class for styling
                            mediaElements.push(image);
                        }
                    }
                }

                // Append media elements to image container
                mediaElements.forEach(media => {
                    imgContainer.appendChild(media);
                });

                // Append image container to content container
                contentContainer.appendChild(imgContainer);

                // Append content container to main container
                container.appendChild(contentContainer);
            } else {
                console.error('No matching item found in the JSON data.');
            }
        })
        .catch(error => {
            console.error('Error loading page content:', error);
        });
}
// Function to create image element
function createImageElement(imagePath) {
    const image = document.createElement('img');
    image.src = imagePath;

    // Check if the file extension is .gif
    if (imagePath.toLowerCase().endsWith('.gif')) {
        // Slow down the GIF by 50%
        image.style.animation = 'slow 2s steps(100) infinite'; // Adjust the animation duration to slow down the GIF
    }

    return image;
}
