// ===== GAME CONSTANTS =====
const GRID = {
    COLS: 10,
    ROWS: 20,
    BLOCK_SIZE: 30,
    COLORS: [
        '#00f0f0', // I - Cyan
        '#0000f0', // J - Blue
        '#f0a000', // L - Orange
        '#f0f000', // O - Yellow
        '#00f000', // S - Green
        '#a000f0', // T - Purple
        '#f00000'  // Z - Red
    ]
};

const GAME = {
    INITIAL_LEVEL: 1,
    LINES_PER_LEVEL: 10,
    INITIAL_SPEED: 1000, // ms
    SPEED_DECREMENT: 100, // ms
    MIN_SPEED: 100, // ms
    POINTS: {
        SINGLE: 100,
        DOUBLE: 300,
        TRIPLE: 500,
        TETRIS: 800,
        SOFT_DROP: 1,
        HARD_DROP: 2
    }
};

// ===== GAME STATE =====
const gameState = {
    // Canvas elements
    canvas: null,
    ctx: null,
    
    // Game state
    board: [],
    currentPiece: null,
    nextPiece: null,
    score: 0,
    level: GAME.INITIAL_LEVEL,
    lines: 0,
    isGameOver: false,
    isPaused: false,
    dropStart: 0,
    dropInterval: GAME.INITIAL_SPEED,
    animationId: null,
    
    // DOM elements
    elements: {
        score: null,
        level: null,
        lines: null,
        startPauseBtn: null,
        restartBtn: null,
        gameOverScreen: null,
        finalScore: null,
        gameOverRestartBtn: null
    }
};

// ===== TETROMINO SHAPES =====
const TETROMINOES = [
    // I
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J
    [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    // L
    [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    // O
    [
        [1, 1],
        [1, 1]
    ],
    // S
    [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    // T
    [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    // Z
    [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
];

// ===== GAME INITIALIZATION =====
function init() {
    // Initialize canvas and context
    gameState.canvas = document.getElementById('tetris');
    gameState.ctx = gameState.canvas.getContext('2d');
    
    // Set canvas size
    gameState.canvas.width = GRID.COLS * GRID.BLOCK_SIZE;
    gameState.canvas.height = GRID.ROWS * GRID.BLOCK_SIZE;
    
    // Cache DOM elements
    cacheElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize game
    resetGame();
    
    // Start the game loop
    gameLoop();
}

// Cache DOM elements for better performance
function cacheElements() {
    gameState.elements = {
        score: document.getElementById('score'),
        level: document.getElementById('level'),
        lines: document.getElementById('lines'),
        startPauseBtn: document.getElementById('startPause'),
        restartBtn: document.getElementById('restart'),
        gameOverScreen: document.getElementById('gameOver'),
        finalScore: document.getElementById('finalScore'),
        gameOverRestartBtn: document.getElementById('gameOverRestart')
    };
}

// Set up all event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Button controls
    const { startPauseBtn, restartBtn, gameOverRestartBtn } = gameState.elements;
    
    startPauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', resetGame);
    gameOverRestartBtn.addEventListener('click', () => {
        gameState.elements.gameOverScreen.classList.remove('active');
        resetGame();
    });
    
    // Touch controls
    setupTouchControls();
}

// Set up touch controls for mobile
function setupTouchControls() {
    const controlButtons = ['left', 'right', 'down', 'rotate', 'drop'];
    
    controlButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleControl(buttonId);
            });
            button.addEventListener('click', () => handleControl(buttonId));
        }
    });
}

// Handle control button presses
function handleControl(control) {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    switch (control) {
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
}

// ===== GAME LOGIC =====

// Reset the game to initial state
function resetGame() {
    // Clear any existing game loop
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
    }
    
    // Reset game state
    gameState.board = createMatrix(GRID.COLS, GRID.ROWS);
    gameState.score = 0;
    gameState.level = GAME.INITIAL_LEVEL;
    gameState.lines = 0;
    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.dropInterval = GAME.INITIAL_SPEED;
    
    // Update UI
    updateUI();
    
    // Create new pieces
    gameState.currentPiece = createPiece();
    gameState.nextPiece = createPiece();
    
    // Hide game over screen
    gameState.elements.gameOverScreen.classList.remove('active');
    
    // Update button text
    gameState.elements.startPauseBtn.textContent = 'PAUSE';
    
    // Start the game loop
    gameState.dropStart = performance.now();
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// Create a new game board matrix
function createMatrix(width, height) {
    const matrix = [];
    for (let y = 0; y < height; y++) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

// Create a new random tetromino piece
function createPiece() {
    const shape = JSON.parse(JSON.stringify(
        TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)]
    ));
    
    return {
        shape,
        pos: { x: Math.floor(GRID.COLS / 2) - Math.floor(shape[0].length / 2), y: 0 },
        colorIndex: Math.floor(Math.random() * GRID.COLORS.length)
    };
}

// Main game loop
function gameLoop(timestamp) {
    if (gameState.isGameOver) {
        gameOver();
        return;
    }
    
    if (gameState.isPaused) {
        gameState.animationId = requestAnimationFrame(gameLoop);
        return;
    }
    
    const deltaTime = timestamp - gameState.dropStart;
    
    if (deltaTime > gameState.dropInterval) {
        move(0, 1);
        gameState.dropStart = timestamp;
    }
    
    draw();
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// Draw the game state
function draw() {
    // Clear the canvas
    gameState.ctx.fillStyle = '#1a1a1a';
    gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Draw the board
    drawBoard();
    
    // Draw the current piece
    if (gameState.currentPiece) {
        drawPiece(gameState.currentPiece);
    }
    
    // Draw grid lines
    drawGrid();
    
    // Draw ghost piece
    if (gameState.currentPiece) {
        drawGhostPiece();
    }
}

// Draw the game board
function drawBoard() {
    gameState.board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(x, y, value - 1);
            }
        });
    });
}

// Draw a single block
function drawBlock(x, y, colorIndex, alpha = 1) {
    const size = GRID.BLOCK_SIZE - 1;
    const xPos = x * GRID.BLOCK_SIZE;
    const yPos = y * GRID.BLOCK_SIZE;
    
    // Main block
    gameState.ctx.fillStyle = GRID.COLORS[colorIndex];
    if (alpha < 1) {
        gameState.ctx.globalAlpha = alpha;
    }
    gameState.ctx.fillRect(xPos, yPos, size, size);
    
    // Highlight
    gameState.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    gameState.ctx.fillRect(xPos, yPos, size, size / 2);
    
    // Border
    gameState.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    gameState.ctx.lineWidth = 1;
    gameState.ctx.strokeRect(xPos, yPos, size, size);
    
    // Reset alpha
    if (alpha < 1) {
        gameState.ctx.globalAlpha = 1;
    }
}

// Draw grid lines
function drawGrid() {
    gameState.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    gameState.ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = 0; x <= GRID.COLS; x++) {
        const xPos = x * GRID.BLOCK_SIZE;
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(xPos, 0);
        gameState.ctx.lineTo(xPos, gameState.canvas.height);
        gameState.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= GRID.ROWS; y++) {
        const yPos = y * GRID.BLOCK_SIZE;
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(0, yPos);
        gameState.ctx.lineTo(gameState.canvas.width, yPos);
        gameState.ctx.stroke();
    }
}

// Draw a tetromino piece
function drawPiece(piece, alpha = 1) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(
                    piece.pos.x + x,
                    piece.pos.y + y,
                    piece.colorIndex,
                    alpha
                );
            }
        });
    });
}

// Draw ghost piece (preview of where the piece will land)
function drawGhostPiece() {
    const ghostPiece = {
        ...gameState.currentPiece,
        pos: { ...gameState.currentPiece.pos }
    };
    
    // Move ghost piece down until it collides
    while (!checkCollision(ghostPiece.pos.x, ghostPiece.pos.y + 1, ghostPiece.shape)) {
        ghostPiece.pos.y++;
    }
    
    // Draw semi-transparent ghost piece
    drawPiece(ghostPiece, 0.3);
}

// ===== GAME CONTROLS =====

// Handle keyboard input
function handleKeyPress(e) {
    if (gameState.isGameOver || gameState.isPaused) {
        if (e.key === 'p') {
            togglePause();
        }
        return;
    }
    
    switch (e.key) {
        case 'ArrowLeft':
            move(-1, 0);
            break;
        case 'ArrowRight':
            move(1, 0);
            break;
        case 'ArrowDown':
            move(0, 1);
            break;
        case 'ArrowUp':
            rotate();
            break;
        case ' ':
            hardDrop();
            e.preventDefault(); // Prevent page scroll on spacebar
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }
}

// Move the current piece
function move(offsetX, offsetY) {
    if (gameState.isGameOver || gameState.isPaused) return false;
    
    if (!checkCollision(
        gameState.currentPiece.pos.x + offsetX,
        gameState.currentPiece.pos.y + offsetY,
        gameState.currentPiece.shape
    )) {
        gameState.currentPiece.pos.x += offsetX;
        gameState.currentPiece.pos.y += offsetY;
        
        // Update score for soft drop
        if (offsetY > 0) {
            gameState.score += GAME.POINTS.SOFT_DROP;
            updateUI();
        }
        
        return true;
    }
    
    // If we can't move down, lock the piece
    if (offsetY > 0) {
        lockPiece();
    }
    
    return false;
}

// Rotate the current piece
function rotate() {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    const originalShape = gameState.currentPiece.shape;
    const rows = originalShape.length;
    const cols = originalShape[0].length;
    const newShape = [];
    
    // Create a new rotated shape (90 degrees clockwise)
    for (let col = 0; col < cols; col++) {
        const newRow = [];
        for (let row = rows - 1; row >= 0; row--) {
            newRow.push(originalShape[row][col]);
        }
        newShape.push(newRow);
    }
    
    // Check if the rotation is valid
    if (!checkCollision(
        gameState.currentPiece.pos.x,
        gameState.currentPiece.pos.y,
        newShape
    )) {
        gameState.currentPiece.shape = newShape;
    }
}

// Drop the piece all the way down
function hardDrop() {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    let dropDistance = 0;
    
    // Calculate drop distance
    while (!checkCollision(
        gameState.currentPiece.pos.x,
        gameState.currentPiece.pos.y + dropDistance + 1,
        gameState.currentPiece.shape
    )) {
        dropDistance++;
    }
    
    // Move piece to drop position
    gameState.currentPiece.pos.y += dropDistance;
    
    // Add score for hard drop
    gameState.score += dropDistance * GAME.POINTS.HARD_DROP;
    updateUI();
    
    // Lock the piece in place
    lockPiece();
}

// Check if a piece would collide at the given position
function checkCollision(posX, posY, shape) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                const boardX = posX + x;
                const boardY = posY + y;
                
                // Check boundaries
                if (
                    boardX < 0 ||
                    boardX >= GRID.COLS ||
                    boardY >= GRID.ROWS ||
                    (boardY >= 0 && gameState.board[boardY][boardX] !== 0)
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Lock the current piece in place and check for completed lines
function lockPiece() {
    const { shape, pos, colorIndex } = gameState.currentPiece;
    
    // Add piece to the board
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                const boardY = pos.y + y;
                const boardX = pos.x + x;
                
                // Check for game over (piece locked above the visible board)
                if (boardY < 0) {
                    gameOver();
                    return;
                }
                
                gameState.board[boardY][boardX] = colorIndex + 1; // +1 because 0 is empty
            }
        }
    }
    
    // Check for completed lines
    clearLines();
    
    // Spawn a new piece
    spawnNewPiece();
}

// Spawn a new piece
function spawnNewPiece() {
    gameState.currentPiece = gameState.nextPiece || createPiece();
    gameState.nextPiece = createPiece();
    
    // Check for game over (new piece collides immediately)
    if (checkCollision(
        gameState.currentPiece.pos.x,
        gameState.currentPiece.pos.y,
        gameState.currentPiece.shape
    )) {
        gameOver();
    }
}

// Clear completed lines and update score
function clearLines() {
    let linesCleared = 0;
    
    // Check each row from bottom to top
    for (let y = GRID.ROWS - 1; y >= 0; y--) {
        // If the row is full
        if (gameState.board[y].every(cell => cell !== 0)) {
            // Remove the row
            gameState.board.splice(y, 1);
            // Add a new empty row at the top
            gameState.board.unshift(new Array(GRID.COLS).fill(0));
            // Since we removed a row, check the same index again
            y++;
            linesCleared++;
        }
    }
    
    if (linesCleared > 0) {
        // Update score based on number of lines cleared
        updateScoreAfterLineClear(linesCleared);
        // Update level if needed
        updateLevel();
        // Update UI
        updateUI();
    }
}

// Update score after clearing lines
function updateScoreAfterLineClear(linesCleared) {
    let points = 0;
    
    switch (linesCleared) {
        case 1:
            points = GAME.POINTS.SINGLE;
            break;
        case 2:
            points = GAME.POINTS.DOUBLE;
            break;
        case 3:
            points = GAME.POINTS.TRIPLE;
            break;
        case 4:
            points = GAME.POINTS.TETRIS;
            break;
    }
    
    // Apply level multiplier
    gameState.score += points * gameState.level;
    gameState.lines += linesCleared;
}

// Update level if enough lines have been cleared
function updateLevel() {
    const newLevel = Math.floor(gameState.lines / GAME.LINES_PER_LEVEL) + 1;
    
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        // Increase game speed (but don't go below minimum speed)
        gameState.dropInterval = Math.max(
            GAME.MIN_SPEED,
            GAME.INITIAL_SPEED - ((gameState.level - 1) * GAME.SPEED_DECREMENT)
        );
    }
}

// Update the UI with current game state
function updateUI() {
    const { score, level, lines } = gameState.elements;
    
    if (score) score.textContent = gameState.score;
    if (level) level.textContent = gameState.level;
    if (lines) lines.textContent = gameState.lines;
}

// Toggle pause state
function togglePause() {
    if (gameState.isGameOver) return;
    
    gameState.isPaused = !gameState.isPaused;
    const { startPauseBtn } = gameState.elements;
    
    if (gameState.isPaused) {
        startPauseBtn.textContent = 'RESUME';
        // Pause the game loop by not requesting the next frame
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    } else {
        startPauseBtn.textContent = 'PAUSE';
        // Resume the game loop
        gameState.dropStart = performance.now();
        gameState.animationId = requestAnimationFrame(gameLoop);
    }
}

// Handle game over
function gameOver() {
    gameState.isGameOver = true;
    gameState.isPaused = true;
    
    // Cancel the game loop
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }
    
    // Show game over screen
    const { gameOverScreen, finalScore } = gameState.elements;
    if (finalScore) finalScore.textContent = gameState.score;
    if (gameOverScreen) gameOverScreen.classList.add('active');
    
    // Update button text
    gameState.elements.startPauseBtn.textContent = 'START';
}

// Initialize the game when the page loads
window.addEventListener('load', init);
