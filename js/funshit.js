// Wait for the DOM content to be loaded
document.addEventListener('DOMContentLoaded', function () {
    // Reference to the main section
    var mainSection = document.querySelector('main.funshit');

    // Function to fetch images from the specified folder
    function fetchImages() {
        // Directory path to the images
        var directoryPath = '../assets/funshit';

        // Create an XMLHttpRequest object
        var xhr = new XMLHttpRequest();

        // Define the request
        xhr.open('GET', directoryPath);

        // Set the responseType to document, as we're expecting HTML response
        xhr.responseType = 'document';

        // Define a callback function for when the request is completed
        xhr.onload = function () {
            // Check if the request was successful
            if (xhr.status === 200) {
                // Extract the response HTML document
                var responseDocument = xhr.response;
                // Get all anchor elements (links) from the response
                var links = responseDocument.querySelectorAll('a');

                // Array to hold the file names of images
                var imageFiles = [];

                // Iterate through each link
                links.forEach(function(link) {
                    // Get the href attribute (file name)
                    var fileName = link.getAttribute('href');
                    // Check if the file is an image (ending with .jpg, .jpeg, or .png)
                    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
                        imageFiles.push(fileName); // Add the file name to the array
                    }
                });

                // Shuffle the array to display images randomly
                shuffle(imageFiles);

                // Iterate through each image file
                imageFiles.forEach(function (fileName) {
                    // Create image element
                    var image = document.createElement('img');
                    // Set the src attribute of the image
                    image.src = fileName; // Concatenate directory path and file name
                    // Add class to the image for styling purposes
                    image.classList.add('funshit-image');
                    // Append image to the main section
                    mainSection.appendChild(image);
                });
            } else {
                // Handle the error if the request fails
                console.error('Request failed: ' + xhr.status);
            }
        };

        // Send the request
        xhr.send();
    }

    // Call the fetchImages function to populate the main section with images
    fetchImages();

    // Function to shuffle an array
    function shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }
});
