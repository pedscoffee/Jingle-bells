document.addEventListener('DOMContentLoaded', () => {
    const excavator = document.getElementById('excavator');
    const dirtLayer = document.getElementById('dirt-layer');
    const treasure = document.getElementById('treasure');
    const message = document.getElementById('message');

    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const digBtn = document.getElementById('dig-btn');
    const gameContainer = document.getElementById('game-container');

    let excavatorX = 10; // Current X position of the excavator (in pixels)
    const moveSpeed = 20; // How many pixels to move per step
    const digRadius = 40; // Size of the 'hole' (clip-path circle radius)

    // Array to store the centers of the dug holes
    let dugHoles = [];

    // --- Game Dimensions (Set dynamically) ---
    let containerWidth;
    let excavatorWidth;

    function updateDimensions() {
        containerWidth = gameContainer.clientWidth;
        excavatorWidth = excavator.clientWidth;
        // Adjust the excavator's max position
        maxExcavatorX = containerWidth - excavatorWidth - 5; 
    }

    // Call once to set initial dimensions
    updateDimensions(); 
    // And again if the screen resizes (e.g., mobile orientation change)
    window.addEventListener('resize', updateDimensions);

    // --- Movement Logic ---
    function updateExcavatorPosition() {
        excavator.style.left = `${excavatorX}px`;
    }

    function moveLeft() {
        excavatorX = Math.max(0, excavatorX - moveSpeed);
        updateExcavatorPosition();
    }

    function moveRight() {
        // Stop before hitting the right edge
        excavatorX = Math.min(maxExcavatorX, excavatorX + moveSpeed);
        updateExcavatorPosition();
    }

    // --- Digging Logic ---
    function updateDirtClipPath() {
        if (dugHoles.length === 0) {
            // No holes, show full dirt layer
            dirtLayer.style.clipPath = 'none';
            return;
        }

        // Create a string for multiple circular clip-paths
        // The dirt layer starts as a full rectangle (inset(0 0 0 0)).
        // We use the 'difference' (or 'subtract') effect by listing holes
        // that cut out from the primary shape.
        
        // This creates a polygon that is the rectangle MINUS all the circles.
        // NOTE: This uses a non-standard syntax common for complex clip-paths
        // and may require browser-specific prefixes or the 'mask' property for wider support.
        // For simplicity and modern browsers, we'll use a series of circles:
        
        let clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'; // The base rectangle
        
        dugHoles.forEach(hole => {
            // Convert hole position (relative to game-container) to percentage relative to dirt-layer
            // Since the dirt-layer is 100% width, the X is simple.
            const xPercent = (hole.x / containerWidth) * 100;
            const yPercent = (hole.y / dirtLayer.clientHeight) * 100;
            
            // This clip-path structure is an attempt to use the 'difference' effect, 
            // but is limited in standard CSS. A simpler, more reliable approach 
            // is to use a background image for dirt texture and an HTML element for each 'hole'.
            // For a purely CSS clip-path solution, we'll keep the simple version:
            // A long list of circles that essentially removes the part of the dirt they cover.
            clipPath += `, circle(${digRadius}px at ${xPercent}% ${yPercent}%)`;
        });
        
        // This simplified clip-path will show the union of all dug holes being removed from the dirt.
        dirtLayer.style.clipPath = `polygon(nonzero, ${clipPath})`;
    }

    function checkTreasureUncovered() {
        const treasureElementRect = treasure.getBoundingClientRect();
        
        // Convert treasure center coordinates to be relative to the dirt layer
        const containerRect = gameContainer.getBoundingClientRect();
        const dirtRect = dirtLayer.getBoundingClientRect();

        const treasureCenterX = treasureElementRect.left + treasureElementRect.width / 2;
        const treasureCenterY = treasureElementRect.top + treasureElementRect.height / 2;
        
        const treasureXRelativeToDirt = treasureCenterX - dirtRect.left;
        const treasureYRelativeToDirt = treasureCenterY - dirtRect.top;

        // Check if any dug hole is close enough to the treasure's center
        const treasureDigDistance = digRadius / 2; 

        for (const hole of dugHoles) {
            // Check distance from hole center (x, y) to treasure center (treasureXRelativeToDirt, treasureYRelativeToDirt)
            const dx = hole.x - treasureXRelativeToDirt;
            const dy = hole.y - treasureYRelativeToDirt;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < treasureDigDistance) {
                // Treasure is uncovered!
                treasure.style.opacity = 1;
                message.classList.remove('hidden');
                
                // Disable controls
                leftBtn.disabled = true;
                rightBtn.disabled = true;
                digBtn.disabled = true;
                return;
            }
        }
    }

    function dig() {
        // Calculate the center of the hole relative to the DIRT LAYER
        const containerRect = gameContainer.getBoundingClientRect();
        const dirtRect = dirtLayer.getBoundingClientRect();
        
        // Excavator's center X relative to the game container
        const holeXContainer = excavatorX + excavatorWidth / 2; 
        
        // The excavator starts at the top, so digging should happen just below it.
        // The Y position of the hole will be relative to the top of the dirt layer.
        // We'll place the hole near where the excavator's 'bucket' would be.
        const holeYDirt = excavator.clientHeight / 2 + 10; // Start the hole slightly below the excavator

        // Check if the hole is not too close to an existing one (optional)
        const newHole = { x: holeXContainer, y: holeYDirt };
        dugHoles.push(newHole);

        updateDirtClipPath();
        checkTreasureUncovered();
    }
    
    // --- Event Listeners for Touch Controls ---
    leftBtn.addEventListener('click', moveLeft);
    rightBtn.addEventListener('click', moveRight);
    digBtn.addEventListener('click', dig);
    
    // Initial position setup
    updateExcavatorPosition();
    
    // Initial check to ensure the treasure is in an undug spot
    checkTreasureUncovered(); 
});
