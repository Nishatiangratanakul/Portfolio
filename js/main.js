document.addEventListener("DOMContentLoaded", function() {
    const shapeContainer = document.getElementById('shape-container');
    const icons = document.querySelector('.icons');
    const shapes = [
        { imageUrl: '../assets/confetti.png', className: 'confetti-shape' },
        { imageUrl: '../assets/circle.png', className: 'circle-shape' },
        { imageUrl: '../assets/star.png', className: 'star-shape' }
    ];
    let currentIndex = 0; // Index to track the current shape in the rotation
    let shapeCount = 0; // Counter to track the number of shapes created
    let intervalId; // Variable to store the interval ID
    let clickCount = 0; // Counter to track the number of clicks after reset

    // Function to create a shape
    function createShape() {
        if (shapeCount >= 1000) {
            clearInterval(intervalId); // Stop generating shapes if the limit is reached
            clearShapesAtRate(); // Start clearing shapes at a rate of ten shapes every 100 milliseconds
            return;
        }

        const currentShape = shapes[currentIndex];
        
        const shape = document.createElement('div');
        shape.classList.add('shape');
        shape.classList.add(currentShape.className); // Add specific shape class
        shape.style.backgroundImage = `url(${currentShape.imageUrl})`;
        
        // Set random position and rotation
        const randomX = Math.random() * (window.innerWidth - 50) + 'px'; // Subtract the shape width
        const randomY = Math.random() * (window.innerHeight - 50) + 'px'; // Subtract the shape height
        const randomRotation = Math.random() * 360 + 'deg';
        shape.style.left = randomX;
        shape.style.top = randomY;
        shape.style.transform = `rotate(${randomRotation})`;
        
        shapeContainer.appendChild(shape);
        
        // Remove shape after animation completes
        shape.addEventListener('animationend', () => {
            shape.remove();
            shapeCount--; // Decrement shape count when shape is removed
        });

        // Increment the index to cycle through shapes
        currentIndex = (currentIndex + 1) % shapes.length;

        // Increment shape count
        shapeCount++;
    }

    // Function to remove all shapes from the page
    function clearShapes() {
        const shapes = document.querySelectorAll('.shape');
        shapes.forEach(shape => shape.remove());
    }

    // Function to clear shapes at a rate of ten shapes every 100 milliseconds
    function clearShapesAtRate() {
        intervalId = setInterval(() => {
            clearTenShapes();
        }, 100);
    }

    // Function to remove ten shapes
    function clearTenShapes() {
        const shapes = document.querySelectorAll('.shape');
        for (let i = 0; i < 10; i++) {
            if (shapes.length > 0) {
                shapes[i].remove(); // Remove the first ten shapes
                shapeCount--; // Decrement shape count
            } else {
                clearInterval(intervalId); // Stop clearing shapes if no shapes left
                clickCount = 1; // Reset click count to 1
            }
        }
    }

    // Click event for the icon
    icons.addEventListener('click', () => {
        if (shapeCount >= 1000) {
            clearInterval(intervalId); // Stop generating shapes if the limit is reached
            clearShapesAtRate(); // Start clearing shapes at a rate of ten shapes every 100 milliseconds
            return;
        }

        // Increment the click count
        clickCount++;

        // Stop any existing interval
        clearInterval(intervalId);
        
        // Generate shapes at intervals
        intervalId = setInterval(() => {
            // Call createShape function based on the click count
            for (let i = 0; i < clickCount; i++) {
                createShape();
            }
        }, 100); // Adjust the interval as needed (in milliseconds)
    });
});

