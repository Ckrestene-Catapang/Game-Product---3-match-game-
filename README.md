# 🍬 Candy Crush - Match-3 Puzzle Game

A fully modular, web-based match-3 puzzle game inspired by Candy Crush, built with vanilla HTML, CSS, and JavaScript. Ready to run locally and deploy to GitHub!

## Features

✨ **Core Gameplay**
- 8x8 grid of colorful tiles
- Click and swap adjacent tiles to make matches of 3+ tiles
- Automatic grid collapse and refill
- Score tracking with a goal-based win condition
- Limited moves system with lose condition
- Win/Lose screens with play again functionality

🎯 **Special Tiles**
- **💣 Bomb**: Clears a 3x3 area around the tile
- **⚡ Laser**: Clears an entire row or column (randomly chosen)
- **🍪 Cookie**: Clears all tiles of the same color on the board

🏗️ **Modular Architecture**
- Clean, well-documented code with clear separation of concerns
- `CONFIG` object for easy customization of:
  - Grid size and tile size
  - Available colors
  - Game difficulty (moves and score goal)
  - Special tile types and effects
- Easy to add new tile types, levels, or features

## Quick Start

### Option 1: Live Server (VS Code)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` and select "Open with Live Server"
3. The game will open in your default browser

### Option 2: Python HTTP Server
```bash
# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```
Then open `http://localhost:8000` in your browser.

### Option 3: Node.js HTTP Server
```bash
# Install http-server globally
npm install -g http-server

# Run in the project directory
http-server
```

## How to Play

1. **Make Matches**: Click on a tile to select it, then click on an adjacent tile to swap
2. **Score Points**: Match 3 or more tiles of the same color horizontally or vertically
3. **Use Special Tiles**: Create special tiles by making matches and use them to clear large areas
4. **Win**: Reach the score goal within the move limit
5. **Lose**: Run out of moves before reaching the goal

### Controls
- **Click**: Select a tile
- **Click Adjacent**: Swap and attempt to make matches
- **Play Again**: Restart after winning or losing

## Customization

Edit the `CONFIG` object in `main.js` to customize:

```javascript
const CONFIG = {
    gridSize: 8,              // Change grid size (8x8, 10x10, etc.)
    tileSize: 75,             // Tile dimensions in pixels
    initialMoves: 20,         // Starting number of moves
    scoreGoal: 500,           // Score needed to win
    colors: [...],            // Available tile colors
    specialTiles: {...}       // Special tile definitions
};
```

## Project Structure

```
candy-crush-web/
├── index.html          # Main HTML file with game canvas and UI
├── style.css          # Styling and responsive design
├── main.js            # Complete game logic (modular and documented)
└── README.md          # This file
```

## File Descriptions

### index.html
- Contains the game canvas element
- HUD for score, moves, and goal tracking
- Win/Lose screen overlays
- Simple and semantic structure

### style.css
- Modern gradient background
- Responsive design for mobile and desktop
- Animated overlays for win/lose screens
- Canvas-based tile rendering

### main.js
Well-organized into functional modules:

- **Configuration**: `CONFIG` object for easy customization
- **Game State**: Central state management
- **Utilities**: Position validation, tile creation
- **Grid Generation**: Initial grid creation without initial matches
- **Match Detection**: Horizontal and vertical match finding
- **Special Tiles**: Bomb, laser, and cookie activation logic
- **Grid Physics**: Collapse and refill mechanics
- **Game Logic**: Swap, match processing, win/lose conditions
- **Rendering**: Canvas-based tile drawing and UI updates

## Features Highlight

### Cascade Matching
When matches are cleared and the grid collapses, new matches may form automatically—chain them together for bonus points!

### Special Tile Bonuses
Tiles created by matches have a small chance to become special tiles, providing powerful effects when activated.

### Smooth Game Flow
The game prevents interaction during animations and matches to ensure a smooth, responsive experience.

### Responsive Design
Works on desktop and mobile devices with proper viewport configuration.

## Future Enhancement Ideas

- Add more tile types (cross, spiral, etc.)
- Implement multiple levels with increasing difficulty
- Add sound effects and animations
- Create a high-score tracking system (localStorage)
- Add power-ups and boosters
- Implement AI-powered hint system
- Create a time-based game mode

## Technical Details

- **No Dependencies**: Pure vanilla JavaScript, HTML, and CSS
- **Browser Compatibility**: Works in all modern browsers
- **Performance**: Efficient grid algorithms and canvas rendering
- **Scalability**: Modular code structure for easy feature additions

## License

This project is open source and available for personal and educational use.

## Troubleshooting

**Game not loading?**
- Ensure all three files (index.html, style.css, main.js) are in the same directory
- Check browser console for any errors (F12 → Console)

**Tiles not responsive?**
- Try refreshing the page (Ctrl+R or Cmd+R)
- Ensure JavaScript is enabled in your browser

**Grid looks stretched?**
- This is normal on mobile due to responsive design
- The game maintains proper aspect ratio

---

Enjoy playing! 🎮✨
