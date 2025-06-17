/**
 * Tetris Game
 * 
 * This file contains the main game logic for the Tetris game.
 * It handles game state, controls, rendering, and game mechanics.
 */

/**
 * Game grid configuration
 * Defines the game board dimensions, block size, and colors
 */
const GRID = {
    COLS: 10,                       // Number of columns in the game board
    ROWS: 20,                       // Number of rows in the game board
    BLOCK_SIZE: 30,                 // Size of each block in pixels
    COLORS: [                       // Colors for different tetrominoes
        '#00f0f0', // I - Cyan
        '#0000f0', // J - Blue
        '#f0a000', // L - Orange
        '#f0f000', // O - Yellow
        '#00f000', // S - Green
        '#a000f0', // T - Purple
        '#f00000'  // Z - Red
    ]
};

/**
 * Game configuration
 * Defines game rules, scoring, and timing
 */
const GAME = {
    INITIAL_LEVEL: 1,               // Starting level
    LINES_PER_LEVEL: 10,            // Lines needed to advance to next level
    INITIAL_SPEED: 1000,            // Initial drop speed in milliseconds
    SPEED_DECREMENT: 100,           // Speed decrease per level (ms)
    MIN_SPEED: 100,                 // Minimum drop speed (ms)
    POINTS: {                       // Points system
        SINGLE: 100,                // 1 line cleared
        DOUBLE: 300,                // 2 lines cleared
        TRIPLE: 500,                // 3 lines cleared
        TETRIS: 800,                // 4 lines cleared (Tetris)
        SOFT_DROP: 1,               // Points per cell soft dropped
        HARD_DROP: 2                // Points per cell hard dropped
    }
};

/**
 * Game state object
 * Tracks the current state of the game
 */
const gameState = {
    // Canvas and rendering
    canvas: null,                   // Canvas element
    ctx: null,                      // Canvas 2D context
    
    // Game board and pieces
    board: [],                      // 2D array representing the game board
    currentPiece: null,             // Currently active tetromino
    nextPiece: null,                // Next tetromino to appear
    
        // Game progress
    score: 0,                       // Current score
    level: GAME.INITIAL_LEVEL,      // Current level
    lines: 0,                       // Total lines cleared
    isGameOver: false,              // Game over state
    isPaused: false,                // Paused state
    
    // Timing and animation
    dropStart: 0,                   // When the current piece started falling
    dropInterval: GAME.INITIAL_SPEED, // Current drop interval
    animationId: null,              // Current animation frame ID
    
    // Input state
    keys: {                         // Keyboard key states
        ArrowLeft: false,
        ArrowRight: false,
        ArrowDown: false,
        ArrowUp: false,
        ' ': false,                 // Space for hard drop
        'p': false                  // P key for pause
    },
    
    // UI elements cache
    elements: {},                   // Cached DOM elements
    
    // Input timing and intervals
    moveRightInterval: null,        // Interval for continuous right movement
    moveDownInterval: null,         // Interval for continuous down movement
    lastMove: 0,                    // Timestamp of last move
    lastRotate: 0,                  // Timestamp of last rotation
    lastDrop: 0,                    // Timestamp of last drop
    lastHardDrop: 0                 // Timestamp of last hard drop
};

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize canvas
        gameState.canvas = document.getElementById('tetris');
        if (!gameState.canvas) {
            throw new Error('Canvas element not found');
        }
        
        gameState.ctx = gameState.canvas.getContext('2d');
        if (!gameState.ctx) {
            throw new Error('Could not get 2D rendering context');
        }
        
        // Cache DOM elements for better performance
        cacheElements();
        
        // Set up event listeners
        setupKeyboardControls();
        setupTouchControls();
        setupControlButtons();
        
        // Initialize game board
        createBoard();
        
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Failed to initialize the game. Please check the console for details.');
    }
});

/**
 * Cache frequently accessed DOM elements
 */
function cacheElements() {
    gameState.elements = {
        startPauseBtn: document.getElementById('startPause'),
        restartBtn: document.getElementById('restart'),
        scoreDisplay: document.getElementById('score'),
        levelDisplay: document.getElementById('level'),
        linesDisplay: document.getElementById('lines'),
        gameOverDisplay: document.getElementById('gameOver'),
        finalScoreDisplay: document.getElementById('finalScore'),
        gameOverRestartBtn: document.getElementById('gameOverRestart')
    };
}

/**
 * Create an empty game board
 */
function createBoard() {
    // Create a 2D array filled with zeros
    gameState.board = Array(GRID.ROWS).fill().map(() => Array(GRID.COLS).fill(0));
}

/**
 * Set up keyboard controls for the game
 */
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (gameState.isGameOver) return;
        
        // Prevent default for game controls to avoid page scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'p'].includes(e.key)) {
            e.preventDefault();
        }
        
        // Only process keydown if the key wasn't already pressed
        if (gameState.keys[e.key] === undefined) return;
        if (gameState.keys[e.key]) return;
        
        gameState.keys[e.key] = true;
        
        // Handle key press
        const now = performance.now();
        const timeSinceLastMove = now - gameState.lastMove;
        const moveDelay = 100; // ms
        
        switch (e.key) {
            case 'ArrowLeft':
                if (timeSinceLastMove >= moveDelay) {
                    move(-1, 0);
                    gameState.lastMove = now;
                }
                break;
                
            case 'ArrowRight':
                if (timeSinceLastMove >= moveDelay) {
                    move(1, 0);
                    gameState.lastMove = now;
                }
                break;
                
            case 'ArrowDown':
                if (timeSinceLastMove >= moveDelay) {
                    move(0, 1);
                    gameState.lastMove = now;
                    gameState.score += GAME.POINTS.SOFT_DROP;
                    updateUI();
                }
                break;
                
            case 'ArrowUp':
                const nowRotate = performance.now();
                if (nowRotate - gameState.lastRotate > 100) {
                    rotate();
                    gameState.lastRotate = nowRotate;
                }
                break;
                
            case ' ':
                if (now - gameState.lastDrop > 100) {
                    hardDrop();
                    gameState.lastDrop = now;
                }
                break;
                
            case 'p':
                togglePause();
                break;
        }
    });
    
    // Handle key up events
    document.addEventListener('keyup', (e) => {
        if (gameState.keys[e.key] !== undefined) {
            gameState.keys[e.key] = false;
        }
    });
}

/**
 * Set up touch controls for mobile devices
 */
function setupTouchControls() {
    const touchArea = gameState.canvas;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchMoved = false;
    const SWIPE_THRESHOLD = 30;
    const TAP_THRESHOLD = 200;
    const SWIPE_VELOCITY_THRESHOLD = 0.3; // pixels/ms
    let lastTouchTime = 0;
    let lastMoveTime = 0;
    let lastMoveY = 0;
    let dropInterval = null;

    // Prevent context menu on long press
    touchArea.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    }, false);

    touchArea.addEventListener('touchstart', (e) => {
        if (gameState.isPaused || gameState.isGameOver) return;
        
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        touchMoved = false;
        lastMoveTime = touchStartTime;
        lastMoveY = touchStartY;
        
        // Clear any existing drop interval
        if (dropInterval) {
            clearInterval(dropInterval);
            dropInterval = null;
        }
        
        // Start continuous drop after a short delay
        const startX = touchStartX;
        const startY = touchStartY;
        
        dropInterval = setTimeout(() => {
            if (!touchMoved && !gameState.isPaused && !gameState.isGameOver) {
                // Start continuous drop
                const drop = () => {
                    if (!touchMoved) {
                        move(0, 1);
                        dropInterval = setTimeout(drop, 100); // Fast drop
                    }
                };
                drop();
            }
        }, 300); // Delay before starting continuous drop
        
    }, { passive: true });

    touchArea.addEventListener('touchmove', (e) => {
        if (gameState.isPaused || gameState.isGameOver) return;
        
        const touch = e.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;
        const currentTime = Date.now();
        
        // Calculate movement
        const deltaX = currentX - touchStartX;
        const deltaY = currentY - touchStartY;
        
        // Check if touch has moved enough to be considered a swipe
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            touchMoved = true;
            
            // Clear continuous drop if active
            if (dropInterval) {
                clearInterval(dropInterval);
                dropInterval = null;
            }
            
            // Calculate time delta and velocity
            const timeDelta = currentTime - lastMoveTime;
            const velocityY = (currentY - lastMoveY) / timeDelta;
            
            // Update last position and time
            lastMoveY = currentY;
            lastMoveTime = currentTime;
            
            // Handle horizontal movement with velocity
            if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
                // Only move if we have enough velocity or have moved significantly
                if (Math.abs(velocityY) < SWIPE_VELOCITY_THRESHOLD) {
                    if (deltaX > 0) {
                        move(1, 0);
                    } else {
                        move(-1, 0);
                    }
                    // Reset start position to prevent continuous movement
                    touchStartX = currentX;
                }
            }
        }
        
        e.preventDefault();
    }, { passive: false });

    touchArea.addEventListener('touchend', (e) => {
        if (gameState.isPaused || gameState.isGameOver) return;
        
        // Clear any drop interval
        if (dropInterval) {
            clearInterval(dropInterval);
            dropInterval = null;
        }
        
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const touchDuration = Date.now() - touchStartTime;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Check if it's a tap (short duration and small movement)
        if (!touchMoved && touchDuration < TAP_THRESHOLD && distance < SWIPE_THRESHOLD * 2) {
            // Rotate on tap
            rotate();
            return;
        }
        
        // Check for swipe direction if movement was significant
        if (distance > SWIPE_THRESHOLD) {
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            
            // Determine swipe direction based on angle
            if (angle > -45 && angle < 45) {
                // Right swipe
                move(1, 0);
            } else if (angle > 135 || angle < -135) {
                // Left swipe
                move(-1, 0);
            } else if (angle >= 45 && angle <= 135) {
                // Down swipe - soft drop
                move(0, 1);
            } else {
                // Up swipe - hard drop
                hardDrop();
            }
        }
        
        e.preventDefault();
    }, { passive: false });
    
    // Prevent window scrolling on touch
    document.body.addEventListener('touchmove', (e) => {
        if (e.target === touchArea) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Set up button event listeners
    const leftBtn = document.getElementById('moveLeft');
    const rightBtn = document.getElementById('moveRight');
    const downBtn = document.getElementById('moveDown');
    const rotateBtn = document.getElementById('rotate');
    const dropBtn = document.getElementById('drop');
    
    // Button event handlers
    const handleButtonPress = (action) => {
        if (gameState.isPaused || gameState.isGameOver) return;
        
        switch(action) {
            case 'left':
                move(-1, 0);
                break;
            case 'right':
                move(1, 0);
                break;
            case 'down':
                move(0, 1);
                break;
            case 'rotate':
                rotate();
                break;
            case 'drop':
                hardDrop();
                break;
        }
    };
    
    // Add button event listeners
    const addButtonListeners = (element, action) => {
        if (!element) return;
        
        // Click event for mouse
        element.addEventListener('click', (e) => {
            e.preventDefault();
            handleButtonPress(action);
        });
        
        // Touch events for mobile
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Add visual feedback
            element.classList.add('active');
            handleButtonPress(action);
        });
        
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            element.classList.remove('active');
        });
        
        element.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            element.classList.remove('active');
        });
    };
    
    // Set up all control buttons
    addButtonListeners(leftBtn, 'left');
    addButtonListeners(rightBtn, 'right');
    addButtonListeners(downBtn, 'down');
    addButtonListeners(rotateBtn, 'rotate');
    addButtonListeners(dropBtn, 'drop');
}

/**
 * Set up control buttons (start/pause, restart)
 */
function setupControlButtons() {
    const { elements } = gameState;
    
    if (elements.startPauseBtn) {
        elements.startPauseBtn.addEventListener('click', togglePause);
    }
    
    if (elements.restartBtn) {
        elements.restartBtn.addEventListener('click', resetGame);
    }
    
    if (elements.gameOverRestartBtn) {
        elements.gameOverRestartBtn.addEventListener('click', resetGame);
    }
    
    // Add keyboard event for space to start/pause when game is not focused
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' && !gameState.currentPiece) {
            e.preventDefault();
            startGame();
        }
    });
}

/**
 * Create a new tetromino piece
 * @returns {Object} A new tetromino piece
 */
function createPiece() {
    const shapes = [
        { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: 0 }, // I
        { shape: [[1,0,0], [1,1,1], [0,0,0]], color: 1 }, // J
        { shape: [[0,0,1], [1,1,1], [0,0,0]], color: 2 }, // L
        { shape: [[1,1], [1,1]], color: 3 }, // O
        { shape: [[0,1,1], [1,1,0], [0,0,0]], color: 4 }, // S
        { shape: [[0,1,0], [1,1,1], [0,0,0]], color: 5 }, // T
        { shape: [[1,1,0], [0,1,1], [0,0,0]], color: 6 }  // Z
    ];
    
    const piece = shapes[Math.floor(Math.random() * shapes.length)];
    return {
        shape: JSON.parse(JSON.stringify(piece.shape)),
        color: piece.color,
        x: Math.floor(GRID.COLS / 2) - Math.floor(piece.shape[0].length / 2),
        y: 0
    };
}

/**
 * Move the current piece
 * @param {number} offsetX - X offset to move
 * @param {number} offsetY - Y offset to move
 * @returns {boolean} True if the move was successful
 */
function move(offsetX, offsetY) {
    if (gameState.isGameOver || gameState.isPaused) return false;
    
    const { currentPiece } = gameState;
    
    if (!currentPiece) return false;
    
    // Check if the move is valid
    if (!checkCollision(currentPiece.x + offsetX, currentPiece.y + offsetY, currentPiece.shape)) {
        currentPiece.x += offsetX;
        currentPiece.y += offsetY;
        return true;
    }
    
    // If moving down and can't move, lock the piece
    if (offsetY > 0) {
        lockPiece();
    }
    
    return false;
}

/**
 * Rotate the current piece
 */
function rotate() {
    if (gameState.isGameOver || gameState.isPaused || !gameState.currentPiece) return;
    
    const { currentPiece } = gameState;
    const newShape = [];
    
    // Create a rotated version of the shape
    for (let x = 0; x < currentPiece.shape[0].length; x++) {
        const newRow = [];
        for (let y = currentPiece.shape.length - 1; y >= 0; y--) {
            newRow.push(currentPiece.shape[y][x]);
        }
        newShape.push(newRow);
    }
    
    // Check if rotation is possible
    if (!checkCollision(currentPiece.x, currentPiece.y, newShape)) {
        currentPiece.shape = newShape;
    } else {
        // Try wall kicks (move left/right if rotation hits a wall)
        const kicks = [1, -1, 2, -2];
        for (const kick of kicks) {
            if (!checkCollision(currentPiece.x + kick, currentPiece.y, newShape)) {
                currentPiece.x += kick;
                currentPiece.shape = newShape;
                break;
            }
        }
    }
}

/**
 * Drop the current piece to the bottom instantly
 */
function hardDrop() {
    if (gameState.isGameOver || gameState.isPaused || !gameState.currentPiece) return;
    
    let dropDistance = 0;
    const { currentPiece } = gameState;
    
    // Calculate drop distance
    while (!checkCollision(currentPiece.x, currentPiece.y + dropDistance + 1, currentPiece.shape)) {
        dropDistance++;
    }
    
    if (dropDistance > 0) {
        currentPiece.y += dropDistance;
        gameState.score += dropDistance * GAME.POINTS.HARD_DROP;
        updateUI();
    }
    
    lockPiece();
}

/**
 * Lock the current piece in place and check for completed lines
 */
function lockPiece() {
    const { currentPiece, board } = gameState;
    
    // Add piece to the board
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                
                // If piece is locked above the visible area, game over
                if (boardY < 0) {
                    gameOver();
                    return;
                }
                
                board[boardY][boardX] = currentPiece.color + 1; // +1 because 0 is empty
            }
        }
    }
    
    // Check for completed lines
    clearLines();
    
    // Spawn a new piece
    spawnNewPiece();
}

/**
 * Spawn a new piece at the top of the board
 */
function spawnNewPiece() {
    gameState.currentPiece = gameState.nextPiece || createPiece();
    gameState.nextPiece = createPiece();
    
    // If the new piece immediately collides, game over
    if (checkCollision(
        gameState.currentPiece.x,
        gameState.currentPiece.y,
        gameState.currentPiece.shape
    )) {
        gameOver();
    }
}

/**
 * Clear completed lines and update the score
 */
function clearLines() {
    const { board } = gameState;
    let linesCleared = 0;
    
    // Check each row from bottom to top
    for (let y = board.length - 1; y >= 0; y--) {
        // If the row is full
        if (board[y].every(cell => cell !== 0)) {
            // Remove the row
            board.splice(y, 1);
            // Add a new empty row at the top
            board.unshift(Array(GRID.COLS).fill(0));
            linesCleared++;
            // Check the same row again since we just moved all rows down
            y++;
        }
    }
    
    if (linesCleared > 0) {
        updateScoreAfterLineClear(linesCleared);
        updateLevel();
    }
}

/**
 * Update the score based on the number of lines cleared
 * @param {number} linesCleared - Number of lines cleared
 */
function updateScoreAfterLineClear(linesCleared) {
    let points = 0;
    
    switch (linesCleared) {
        case 1: points = GAME.POINTS.SINGLE; break;
        case 2: points = GAME.POINTS.DOUBLE; break;
        case 3: points = GAME.POINTS.TRIPLE; break;
        case 4: points = GAME.POINTS.TETRIS; break;
    }
    
    gameState.score += points * gameState.level;
    gameState.lines += linesCleared;
    updateUI();
}

/**
 * Update the game level based on the number of lines cleared
 */
function updateLevel() {
    const newLevel = Math.floor(gameState.lines / GAME.LINES_PER_LEVEL) + 1;
    
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        // Increase speed, but don't go below minimum speed
        gameState.dropInterval = Math.max(
            GAME.MIN_SPEED,
            GAME.INITIAL_SPEED - ((gameState.level - 1) * GAME.SPEED_DECREMENT)
        );
        updateUI();
    }
}

/**
 * Check if a piece would collide at the given position
 * @param {number} x - X position to check
 * @param {number} y - Y position to check
 * @param {Array} shape - The shape to check for collisions
 * @returns {boolean} True if there would be a collision
 */
function checkCollision(x, y, shape) {
    const { board } = gameState;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardX = x + col;
                const boardY = y + row;
                
                // Check boundaries and collisions with other pieces
                if (
                    boardX < 0 ||
                    boardX >= GRID.COLS ||
                    boardY >= GRID.ROWS ||
                    (boardY >= 0 && board[boardY] && board[boardY][boardX])
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Draw the game board
 */
function drawBoard() {
    const { ctx, board } = gameState;
    
    // Clear the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw the background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw the grid
    drawGrid();
    
    // Draw all blocks on the board
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x]) {
                drawBlock(x, y, board[y][x] - 1);
            }
        }
    }
}

/**
 * Draw the grid lines on the game board
 */
function drawGrid() {
    const { ctx } = gameState;
    const { COLS, ROWS, BLOCK_SIZE } = GRID;
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

/**
 * Draw a single block on the canvas
 * @param {number} x - The x-coordinate of the block
 * @param {number} y - The y-coordinate of the block
 * @param {number} colorIndex - Index of the color in the COLORS array
 * @param {number} [alpha=1] - Opacity of the block (0-1)
 */
function drawBlock(x, y, colorIndex, alpha = 1) {
    const { ctx } = gameState;
    const { BLOCK_SIZE, COLORS } = GRID;
    
    // Set block color with alpha
    ctx.fillStyle = COLORS[colorIndex];
    ctx.globalAlpha = alpha;
    
    // Draw block with 3D effect
    const padding = 2;
    const innerPadding = 1;
    
    // Main block
    ctx.fillRect(
        x * BLOCK_SIZE + padding,
        y * BLOCK_SIZE + padding,
        BLOCK_SIZE - padding * 2,
        BLOCK_SIZE - padding * 2
    );
    
    // Highlight (top-left edge)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(
        x * BLOCK_SIZE + padding,
        y * BLOCK_SIZE + padding,
        BLOCK_SIZE - padding * 2,
        2
    );
    ctx.fillRect(
        x * BLOCK_SIZE + padding,
        y * BLOCK_SIZE + padding,
        2,
        BLOCK_SIZE - padding * 2
    );
    
    // Shadow (bottom-right edge)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(
        x * BLOCK_SIZE + padding,
        (y + 1) * BLOCK_SIZE - padding - 1,
        BLOCK_SIZE - padding * 2,
        2
    );
    ctx.fillRect(
        (x + 1) * BLOCK_SIZE - padding - 1,
        y * BLOCK_SIZE + padding,
        2,
        BLOCK_SIZE - padding * 2
    );
    
    // Reset global alpha
    ctx.globalAlpha = 1;
}

/**
 * Draw a tetromino piece on the canvas
 * @param {Object} piece - The piece to draw
 * @param {number} [alpha=1] - Opacity of the piece (0-1)
 */
function drawPiece(piece, alpha = 1) {
    const { shape, color, x, y } = piece;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                drawBlock(x + col, y + row, color, alpha);
            }
        }
    }
}

/**
 * Draw the ghost piece (preview of where the piece will land)
 */
function drawGhostPiece() {
    if (!gameState.currentPiece) return;
    
    const { currentPiece } = gameState;
    let dropDistance = 0;
    
    // Calculate drop distance
    while (!checkCollision(
        currentPiece.x,
        currentPiece.y + dropDistance + 1,
        currentPiece.shape
    )) {
        dropDistance++;
    }
    
    if (dropDistance > 0) {
        // Draw a semi-transparent version of the piece at the drop position
        const ghostPiece = {
            ...currentPiece,
            y: currentPiece.y + dropDistance
        };
        drawPiece(ghostPiece, 0.3);
    }
}

/**
 * Update the game UI elements (score, level, lines)
 */
function updateUI() {
    const { elements, score, level, lines } = gameState;
    
    if (elements.scoreDisplay) {
        elements.scoreDisplay.textContent = score.toString().padStart(6, '0');
    }
    
    if (elements.levelDisplay) {
        elements.levelDisplay.textContent = level;
    }
    
    if (elements.linesDisplay) {
        elements.linesDisplay.textContent = lines;
    }
}

/**
 * Toggle the pause state of the game
 */
function togglePause() {
    if (gameState.isGameOver) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    const { elements } = gameState;
    
    if (gameState.isPaused) {
        cancelAnimationFrame(gameState.animationId);
        if (elements.startPauseBtn) {
            elements.startPauseBtn.textContent = 'Resume';
        }
    } else {
        gameState.dropStart = performance.now();
        gameState.animationId = requestAnimationFrame(gameLoop);
        if (elements.startPauseBtn) {
            elements.startPauseBtn.textContent = 'Pause';
        }
    }
}

/**
 * Handle game over state
 */
function gameOver() {
    gameState.isGameOver = true;
    cancelAnimationFrame(gameState.animationId);
    
    const { elements } = gameState;
    
    if (elements.gameOverOverlay) {
        elements.gameOverOverlay.style.display = 'flex';
    }
    
    if (elements.finalScoreDisplay) {
        elements.finalScoreDisplay.textContent = gameState.score;
    }
    
    // Update button text
    if (elements.startPauseBtn) {
        elements.startPauseBtn.textContent = 'Start';
    }
    
    // Play game over sound if available
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        playGameOverSound();
    }
}

/**
 * Reset the game to its initial state
 */
function resetGame() {
    const { elements } = gameState;
    
    // Reset game state
    gameState.score = 0;
    gameState.level = GAME.INITIAL_LEVEL;
    gameState.lines = 0;
    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.dropInterval = GAME.INITIAL_SPEED;
    
    // Reset UI
    updateUI();
    
    // Hide game over overlay
    if (elements.gameOverOverlay) {
        elements.gameOverOverlay.style.display = 'none';
    }
    
    // Reset button text
    if (elements.startPauseBtn) {
        elements.startPauseBtn.textContent = 'Start';
    }
    
    // Clear the board and create a new piece
    createBoard();
    gameState.currentPiece = null;
    gameState.nextPiece = createPiece();
    
    // Start the game
    startGame();
}

/**
 * Start the game
 */
function startGame() {
    const { elements } = gameState;
    
    // If game is already running, do nothing
    if (gameState.animationId) {
        return;
    }
    
    // Reset game state if needed
    if (gameState.isGameOver) {
        resetGame();
        return;
    }
    
    // Set up initial pieces if needed
    if (!gameState.currentPiece) {
        gameState.currentPiece = createPiece();
    }
    
    if (!gameState.nextPiece) {
        gameState.nextPiece = createPiece();
    }
    
    // Update UI
    if (elements.startPauseBtn) {
        elements.startPauseBtn.textContent = 'Pause';
    }
    
    // Start the game loop
    gameState.dropStart = performance.now();
    gameState.animationId = requestAnimationFrame(gameLoop);
}

/**
 * Main game loop
 * @param {number} timestamp - Current timestamp from requestAnimationFrame
 */
function gameLoop(timestamp) {
    // Calculate time since last drop
    const deltaTime = timestamp - gameState.dropStart;
    
    // Check if it's time to drop the piece
    if (deltaTime > gameState.dropInterval) {
        move(0, 1); // Move down
        gameState.dropStart = timestamp;
    }
    
    // Draw everything
    drawBoard();
    
    // Draw ghost piece (preview)
    drawGhostPiece();
    
    // Draw current piece
    if (gameState.currentPiece) {
        drawPiece(gameState.currentPiece);
    }
    
    // Continue the game loop
    if (!gameState.isPaused && !gameState.isGameOver) {
        gameState.animationId = requestAnimationFrame(gameLoop);
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    // Add loaded class when scripts are ready
    document.documentElement.classList.add('js-enabled');
    
    // Initialize the game
    startGame();
});
