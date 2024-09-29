function fetchImages() {
    console.log("Fetching images...");

    fetch('../funshit.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch JSON: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Images found in JSON:", data.images);
            var imageFiles = data.images;

            imageFiles.forEach(fileName => {
                var imageUrl = '../assets/funshit/' + fileName; // Construct the full image URL
                console.log("Checking image URL:", imageUrl);

                // Create an image element to check if it loads
                var img = new Image();
                img.src = imageUrl;

                img.onload = function() {
                    console.log("Image loaded successfully:", imageUrl);
                    img.classList.add('funshit-image'); // Add class for styling
                    document.getElementById('mainSection').appendChild(img);
                };

                img.onerror = function() {
                    console.warn("Image not found:", imageUrl);
                };
            });
        })
        .catch(error => console.error('Error:', error));
}

// Call the function to fetch images
fetchImages();
