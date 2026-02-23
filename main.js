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
    selectedTile: null,
    gameMode: 'menu' // menu, playing, win, lose
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
// MATCH DETECTION & SPECIAL TILE CREATION
// ============================================

/**
 * Find all tiles that are part of a match and create special tiles
 */
function findMatches() {
    const matched = new Set();
    const specialTilesToCreate = []; // Array of {row, col, type}
    
    // Check horizontal matches
    for (let row = 0; row < CONFIG.gridSize; row++) {
        for (let col = 0; col < CONFIG.gridSize; col++) {
            const tile = getTile(row, col);
            if (!tile) continue;
            
            // Count consecutive tiles horizontally
            let matchCount = 1;
            for (let c = col + 1; c < CONFIG.gridSize; c++) {
                const nextTile = getTile(row, c);
                if (nextTile && nextTile.color.name === tile.color.name) {
                    matchCount++;
                } else {
                    break;
                }
            }
            
            // Process horizontal matches
            if (matchCount >= 3) {
                for (let c = col; c < col + matchCount; c++) {
                    matched.add(`${row},${c}`);
                }
                
                // Create special tiles based on match count
                if (matchCount === 4) {
                    // 4 in a row = Laser
                    specialTilesToCreate.push({ row, col, count: matchCount, type: 'laser' });
                } else if (matchCount >= 5) {
                    // 5+ in a row = Cookie
                    specialTilesToCreate.push({ row, col, count: matchCount, type: 'cookie' });
                }
            }
        }
    }
    
    // Check vertical matches
    for (let col = 0; col < CONFIG.gridSize; col++) {
        for (let row = 0; row < CONFIG.gridSize; row++) {
            const tile = getTile(row, col);
            if (!tile) continue;
            
            // Count consecutive tiles vertically
            let matchCount = 1;
            for (let r = row + 1; r < CONFIG.gridSize; r++) {
                const nextTile = getTile(r, col);
                if (nextTile && nextTile.color.name === tile.color.name) {
                    matchCount++;
                } else {
                    break;
                }
            }
            
            // Process vertical matches
            if (matchCount >= 3) {
                for (let r = row; r < row + matchCount; r++) {
                    matched.add(`${row},${col}`);
                }
                
                // Create special tiles based on match count
                if (matchCount === 4) {
                    // 4 in a row = Laser
                    specialTilesToCreate.push({ row, col, count: matchCount, type: 'laser' });
                } else if (matchCount >= 5) {
                    // 5+ in a row = Cookie
                    specialTilesToCreate.push({ row, col, count: matchCount, type: 'cookie' });
                }
            }
        }
    }
    
    // Check for T-shaped patterns (bomb)
    for (let row = 1; row < CONFIG.gridSize - 1; row++) {
        for (let col = 1; col < CONFIG.gridSize - 1; col++) {
            const center = getTile(row, col);
            if (!center || matched.has(`${row},${col}`)) continue;
            
            // Vertical T (|)
            const top = getTile(row - 1, col);
            const bottom = getTile(row + 1, col);
            const left = getTile(row, col - 1);
            const right = getTile(row, col + 1);
            
            // Vertical T: center + top + bottom + (left or right)
            if (top && bottom && (left || right) &&
                top.color.name === center.color.name &&
                bottom.color.name === center.color.name &&
                ((left && left.color.name === center.color.name) ||
                 (right && right.color.name === center.color.name))) {
                
                specialTilesToCreate.push({ row, col, type: 'bomb' });
                matched.add(`${row},${col}`);
                matched.add(`${row - 1},${col}`);
                matched.add(`${row + 1},${col}`);
                if (left && left.color.name === center.color.name) matched.add(`${row},${col - 1}`);
                if (right && right.color.name === center.color.name) matched.add(`${row},${col + 1}`);
            }
            
            // Horizontal T: center + left + right + (top or bottom)
            if (left && right && (top || bottom) &&
                left.color.name === center.color.name &&
                right.color.name === center.color.name &&
                ((top && top.color.name === center.color.name) ||
                 (bottom && bottom.color.name === center.color.name))) {
                
                specialTilesToCreate.push({ row, col, type: 'bomb' });
                matched.add(`${row},${col}`);
                matched.add(`${row},${col - 1}`);
                matched.add(`${row},${col + 1}`);
                if (top && top.color.name === center.color.name) matched.add(`${row - 1},${col}`);
                if (bottom && bottom.color.name === center.color.name) matched.add(`${row + 1},${col}`);
            }
        }
    }
    
    // Assign special tiles to matched positions (prioritize first match location)
    specialTilesToCreate.forEach(special => {
        if (matched.has(`${special.row},${special.col}`)) {
            const tile = getTile(special.row, special.col);
            if (tile) {
                tile.special = special.type;
            }
        }
    });
    
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
 * Apply laser effect (clears entire row and column)
 */
function activateLaser(row, col) {
    const cleared = new Set();
    
    // Clear entire row
    for (let c = 0; c < CONFIG.gridSize; c++) {
        if (getTile(row, c)) {
            setTile(row, c, null);
            cleared.add(`${row},${c}`);
        }
    }
    
    // Clear entire column
    for (let r = 0; r < CONFIG.gridSize; r++) {
        if (getTile(r, col)) {
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
            const cleared = activateLaser(row, col);
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
        // First, mark cleared tiles as null
        for (let row = 0; row < CONFIG.gridSize; row++) {
            if (clearedTiles.has(`${row},${col}`)) {
                setTile(row, col, null);
            }
        }
        
        // Then, compact non-null tiles downward
        let writePos = CONFIG.gridSize - 1;
        for (let row = CONFIG.gridSize - 1; row >= 0; row--) {
            const tile = getTile(row, col);
            if (tile !== null) {
                if (row !== writePos) {
                    setTile(writePos, col, tile);
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
                let tile = createTile();
                
                // Avoid creating immediate matches
                let validTile = false;
                while (!validTile) {
                    validTile = true;
                    
                    // Check horizontal matches
                    if (col >= 2) {
                        const left1 = getTile(row, col - 1);
                        const left2 = getTile(row, col - 2);
                        if (left1 && left2 && 
                            left1.color.name === tile.color.name &&
                            left2.color.name === tile.color.name) {
                            validTile = false;
                        }
                    }
                    
                    // Check vertical matches
                    if (row >= 2) {
                        const above1 = getTile(row - 1, col);
                        const above2 = getTile(row - 2, col);
                        if (above1 && above2 && 
                            above1.color.name === tile.color.name &&
                            above2.color.name === tile.color.name) {
                            validTile = false;
                        }
                    }
                    
                    if (!validTile) {
                        tile = createTile();
                    }
                }
                
                setTile(row, col, tile);
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
    const maxCascades = 10; // Prevent infinite loops
    
    while (matchesFound && cascades < maxCascades) {
        const matched = findMatches();
        
        if (matched.size === 0) {
            matchesFound = false;
        } else {
            cascades++;
            
            // Create a set of only this cascade's cleared tiles
            const cascadeCleared = new Set(matched);
            
            // Activate special tiles
            const specialCleared = activateSpecialTiles(matched);
            specialCleared.forEach(pos => cascadeCleared.add(pos));
            
            // Collapse and refill with only this cascade's tiles
            collapseGrid(cascadeCleared);
            refillGrid();
            
            // Add to total for scoring
            cascadeCleared.forEach(pos => totalCleared.add(pos));
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
    if (gameState.gameMode !== 'playing' || gameState.animating) return;
    
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
    gameState.gameMode = result;
    
    if (result === 'win') {
        document.getElementById('winScore').textContent = gameState.score;
        document.getElementById('winScreen').classList.add('active');
        document.getElementById('gameArea').style.display = 'none';
    } else if (result === 'lose') {
        document.getElementById('loseScore').textContent = gameState.score;
        document.getElementById('loseScreen').classList.add('active');
        document.getElementById('gameArea').style.display = 'none';
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
 * Start the game from menu
 */
function startGame() {
    gameState.gameMode = 'playing';
    document.getElementById('playScreen').classList.remove('active');
    document.getElementById('gameArea').style.display = 'block';
    
    reset();
}

/**
 * Reset and start a new game
 */
function reset() {
    gameState.score = 0;
    gameState.moves = CONFIG.initialMoves;
    gameState.gameMode = 'playing';
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
    reset: reset,
    startGame: startGame
};

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.addEventListener('click', onCanvasClick);
    
    // Show play screen initially
    gameState.gameMode = 'menu';
    document.getElementById('playScreen').classList.add('active');
    document.getElementById('gameArea').style.display = 'none';
    
    console.log('🎮 Match-3 Game Ready! Click tiles to swap and make matches.');
    console.log('📋 Configuration:', CONFIG);
});
