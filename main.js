// ============================================
// CONFIGURATION OBJECT - Easy to customize
// ============================================
const CONFIG = {
    gridSize: 8,
    tileSize: 75,
    matchLength: 3,
    initialMoves: 20,
    scoreGoal: 500,
    
    // Tile colors with names
    colors: [
        { name: 'red', hex: '#FF6B6B' },
        { name: 'blue', hex: '#4ECDC4' },
        { name: 'yellow', hex: '#FFE66D' },
        { name: 'green', hex: '#95E1D3' },
        { name: 'purple', hex: '#C7CEEA' },
        { name: 'orange', hex: '#FFB347' },
    ],
    
    // Special tile types with their effects
    specialTiles: {
        bomb: {
            symbol: '💣',
            description: 'Clears 3x3 area',
            range: 1
        },
        laser: {
            symbol: '⚡',
            description: 'Clears row/column',
            range: -1 // Indicates full row/column
        },
        cookie: {
            symbol: '🍪',
            description: 'Clears all same color',
            range: -2 // Indicates all same color
        }
    }
};

// ============================================
// GAME STATE
// ============================================
const gameState = {
    grid: [],
    score: 0,
    moves: CONFIG.initialMoves,
    gameOver: false,
    animating: false,
    selectedTile: null
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get a random color from the config
 */
function getRandomColor() {
    return CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
}

/**
 * Create a random tile
 */
function createTile() {
    return {
        color: getRandomColor(),
        special: null // Can be 'bomb', 'laser', or 'cookie'
    };
}

/**
 * Check if coordinates are valid
 */
function isValidPosition(row, col) {
    return row >= 0 && row < CONFIG.gridSize && col >= 0 && col < CONFIG.gridSize;
}

/**
 * Get tile at specific position
 */
function getTile(row, col) {
    if (!isValidPosition(row, col)) return null;
    return gameState.grid[row][col];
}

/**
 * Set tile at specific position
 */
function setTile(row, col, tile) {
    if (isValidPosition(row, col)) {
        gameState.grid[row][col] = tile;
    }
}

// ============================================
// GRID GENERATION
// ============================================

/**
 * Initialize the game grid with random tiles
 */
function initializeGrid() {
    gameState.grid = [];
    
    for (let row = 0; row < CONFIG.gridSize; row++) {
        gameState.grid[row] = [];
        for (let col = 0; col < CONFIG.gridSize; col++) {
            let tile = createTile();
            
            // Avoid initial matches by checking horizontally and vertically
            let validTile = false;
            while (!validTile) {
                validTile = true;
                
                // Check horizontal
                if (col >= 2) {
                    if (gameState.grid[row][col - 1].color.name === tile.color.name &&
                        gameState.grid[row][col - 2].color.name === tile.color.name) {
                        validTile = false;
                    }
                }
                
                // Check vertical
                if (row >= 2) {
                    if (gameState.grid[row - 1][col].color.name === tile.color.name &&
                        gameState.grid[row - 2][col].color.name === tile.color.name) {
                        validTile = false;
                    }
                }
                
                if (!validTile) {
                    tile = createTile();
                }
            }
            
            gameState.grid[row][col] = tile;
        }
    }
}

// ============================================
// MATCH DETECTION
// ============================================

/**
 * Find all tiles that are part of a match
 */
function findMatches() {
    const matched = new Set();
    
    // Check horizontal matches
    for (let row = 0; row < CONFIG.gridSize; row++) {
        for (let col = 0; col < CONFIG.gridSize - 2; col++) {
            const tile1 = getTile(row, col);
            const tile2 = getTile(row, col + 1);
            const tile3 = getTile(row, col + 2);
            
            if (tile1 && tile2 && tile3 &&
                tile1.color.name === tile2.color.name &&
                tile2.color.name === tile3.color.name) {
                matched.add(`${row},${col}`);
                matched.add(`${row},${col + 1}`);
                matched.add(`${row},${col + 2}`);
            }
        }
    }
    
    // Check vertical matches
    for (let col = 0; col < CONFIG.gridSize; col++) {
        for (let row = 0; row < CONFIG.gridSize - 2; row++) {
            const tile1 = getTile(row, col);
            const tile2 = getTile(row + 1, col);
            const tile3 = getTile(row + 2, col);
            
            if (tile1 && tile2 && tile3 &&
                tile1.color.name === tile2.color.name &&
                tile2.color.name === tile3.color.name) {
                matched.add(`${row},${col}`);
                matched.add(`${row + 1},${col}`);
                matched.add(`${row + 2},${col}`);
            }
        }
    }
    
    return matched;
}

// ============================================
// SPECIAL TILE ACTIVATION
// ============================================

/**
 * Apply bomb effect (clears 3x3 area)
 */
function activateBomb(row, col) {
    const range = CONFIG.specialTiles.bomb.range;
    const cleared = new Set();
    
    for (let r = row - range; r <= row + range; r++) {
        for (let c = col - range; c <= col + range; c++) {
            if (isValidPosition(r, c)) {
                setTile(r, c, null);
                cleared.add(`${r},${c}`);
            }
        }
    }
    
    return cleared;
}

/**
 * Apply laser effect (clears row or column)
 */
function activateLaser(row, col, direction) {
    const cleared = new Set();
    
    if (direction === 'horizontal') {
        // Clear entire row
        for (let c = 0; c < CONFIG.gridSize; c++) {
            setTile(row, c, null);
            cleared.add(`${row},${c}`);
        }
    } else {
        // Clear entire column
        for (let r = 0; r < CONFIG.gridSize; r++) {
            setTile(r, col, null);
            cleared.add(`${r},${col}`);
        }
    }
    
    return cleared;
}

/**
 * Apply cookie effect (clears all tiles of same color)
 */
function activateCookie(row, col) {
    const tile = getTile(row, col);
    if (!tile || !tile.color) return new Set();
    
    const colorName = tile.color.name;
    const cleared = new Set();
    
    for (let r = 0; r < CONFIG.gridSize; r++) {
        for (let c = 0; c < CONFIG.gridSize; c++) {
            const t = getTile(r, c);
            if (t && t.color.name === colorName) {
                setTile(r, c, null);
                cleared.add(`${r},${c}`);
            }
        }
    }
    
    return cleared;
}

/**
 * Check and activate special tiles
 */
function activateSpecialTiles(matchedTiles) {
    let additionalCleared = new Set();
    
    matchedTiles.forEach(pos => {
        const [row, col] = pos.split(',').map(Number);
        const tile = getTile(row, col);
        
        if (tile && tile.special === 'bomb') {
            const cleared = activateBomb(row, col);
            cleared.forEach(p => additionalCleared.add(p));
        } else if (tile && tile.special === 'laser') {
            // Randomly choose direction
            const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
            const cleared = activateLaser(row, col, direction);
            cleared.forEach(p => additionalCleared.add(p));
        } else if (tile && tile.special === 'cookie') {
            const cleared = activateCookie(row, col);
            cleared.forEach(p => additionalCleared.add(p));
        }
    });
    
    return additionalCleared;
}

// ============================================
// GRID PHYSICS (COLLAPSE & REFILL)
// ============================================

/**
 * Remove matched tiles and collapse the grid
 */
function collapseGrid(clearedTiles) {
    for (let col = 0; col < CONFIG.gridSize; col++) {
        let writePos = CONFIG.gridSize - 1;
        
        // Move tiles down from bottom to top
        for (let row = CONFIG.gridSize - 1; row >= 0; row--) {
            if (!clearedTiles.has(`${row},${col}`)) {
                if (row !== writePos) {
                    setTile(writePos, col, getTile(row, col));
                    setTile(row, col, null);
                }
                writePos--;
            }
        }
    }
}

/**
 * Refill empty tiles at the top of the grid
 */
function refillGrid() {
    for (let col = 0; col < CONFIG.gridSize; col++) {
        for (let row = 0; row < CONFIG.gridSize; row++) {
            if (getTile(row, col) === null) {
                setTile(row, col, createTile());
            }
        }
    }
}

// ============================================
// GAME LOGIC
// ============================================

/**
 * Process a match: remove tiles, apply special effects, calculate score
 */
function processMatches() {
    let totalCleared = new Set();
    let matchesFound = true;
    let cascades = 0;
    
    while (matchesFound) {
        const matched = findMatches();
        
        if (matched.size === 0) {
            matchesFound = false;
        } else {
            cascades++;
            matched.forEach(pos => totalCleared.add(pos));
            
            // Activate special tiles
            const specialCleared = activateSpecialTiles(matched);
            specialCleared.forEach(pos => totalCleared.add(pos));
            
            // Collapse and refill
            collapseGrid(totalCleared);
            refillGrid();
        }
    }
    
    // Calculate score based on tiles cleared
    const score = totalCleared.size * 10 * (1 + cascades * 0.5);
    gameState.score += Math.floor(score);
    
    return totalCleared.size > 0;
}

/**
 * Swap two tiles
 */
function swapTiles(row1, col1, row2, col2) {
    if (gameState.animating || gameState.gameOver) return;
    
    // Check if adjacent
    const distance = Math.abs(row1 - row2) + Math.abs(col1 - col2);
    if (distance !== 1) return;
    
    // Perform swap
    const temp = getTile(row1, col1);
    setTile(row1, col1, getTile(row2, col2));
    setTile(row2, col2, temp);
    
    gameState.animating = true;
    
    // Check for matches
    if (processMatches()) {
        gameState.moves--;
        
        // Check win/lose conditions
        if (gameState.score >= CONFIG.scoreGoal) {
            endGame('win');
        } else if (gameState.moves === 0) {
            endGame('lose');
        }
    } else {
        // Swap back if no matches
        const temp = getTile(row1, col1);
        setTile(row1, col1, getTile(row2, col2));
        setTile(row2, col2, temp);
    }
    
    gameState.animating = false;
    updateUI();
}

/**
 * Handle tile click
 */
function onCanvasClick(e) {
    if (gameState.gameOver || gameState.animating) return;
    
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / CONFIG.tileSize);
    const row = Math.floor(y / CONFIG.tileSize);
    
    if (!isValidPosition(row, col)) return;
    
    if (gameState.selectedTile === null) {
        // First tile selected
        gameState.selectedTile = { row, col };
    } else {
        // Second tile selected
        const { row: row1, col: col1 } = gameState.selectedTile;
        
        if (row === row1 && col === col1) {
            // Same tile clicked - deselect
            gameState.selectedTile = null;
        } else {
            // Different tile - attempt swap
            swapTiles(row1, col1, row, col);
            gameState.selectedTile = null;
        }
    }
    
    render();
}

/**
 * End the game
 */
function endGame(result) {
    gameState.gameOver = true;
    
    if (result === 'win') {
        document.getElementById('winScore').textContent = gameState.score;
        document.getElementById('winScreen').classList.add('active');
    } else {
        document.getElementById('loseScore').textContent = gameState.score;
        document.getElementById('loseScreen').classList.add('active');
    }
}

/**
 * Update UI elements
 */
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('moves').textContent = gameState.moves;
}

/**
 * Reset and start a new game
 */
function reset() {
    gameState.score = 0;
    gameState.moves = CONFIG.initialMoves;
    gameState.gameOver = false;
    gameState.animating = false;
    gameState.selectedTile = null;
    
    document.getElementById('winScreen').classList.remove('active');
    document.getElementById('loseScreen').classList.remove('active');
    
    initializeGrid();
    updateUI();
    render();
}

// ============================================
// RENDERING
// ============================================

/**
 * Draw the game grid on canvas
 */
function render() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw tiles
    for (let row = 0; row < CONFIG.gridSize; row++) {
        for (let col = 0; col < CONFIG.gridSize; col++) {
            const tile = getTile(row, col);
            const x = col * CONFIG.tileSize;
            const y = row * CONFIG.tileSize;
            
            if (tile) {
                drawTile(ctx, x, y, tile, row, col);
            }
        }
    }
    
    // Draw selection highlight
    if (gameState.selectedTile) {
        const { row, col } = gameState.selectedTile;
        const x = col * CONFIG.tileSize;
        const y = row * CONFIG.tileSize;
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 4, y + 4, CONFIG.tileSize - 8, CONFIG.tileSize - 8);
    }
}

/**
 * Draw a single tile
 */
function drawTile(ctx, x, y, tile, row, col) {
    const size = CONFIG.tileSize - 8;
    const padding = 4;
    
    // Draw tile background
    ctx.fillStyle = tile.color.hex;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(x + padding, y + padding, size, size);
    ctx.shadowColor = 'transparent';
    
    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + padding, y + padding, size, size);
    
    // Draw special tile symbol
    if (tile.special) {
        ctx.fillStyle = '#000';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(CONFIG.specialTiles[tile.special].symbol, x + CONFIG.tileSize / 2, y + CONFIG.tileSize / 2);
    }
}

// ============================================
// INITIALIZATION
// ============================================

const game = {
    reset: reset
};

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.addEventListener('click', onCanvasClick);
    
    initializeGrid();
    updateUI();
    render();
    
    console.log('🎮 Match-3 Game Ready! Click tiles to swap and make matches.');
    console.log('📋 Configuration:', CONFIG);
});
