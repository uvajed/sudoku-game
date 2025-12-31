# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A bilingual (English/Albanian) Sudoku puzzle game with a dark theme inspired by e-studios.eu design. Pure vanilla JavaScript with no framework dependencies.

**Live URL:** https://sudoku-estudios.vercel.app

## Development

This is a static site with no build step. To run locally:

```bash
# Open directly in browser
open index.html

# Or use a local server
python3 -m http.server 8000
```

## Deployment

Hosted on Vercel. To deploy:

```bash
npx vercel --prod
npx vercel alias <deployment-url> sudoku-estudios.vercel.app
```

## Architecture

### Files
- `index.html` - Single HTML file with all markup and bilingual data attributes (`data-en`, `data-al`)
- `styles.css` - All styling with CSS variables for theming
- `script.js` - Complete game logic

### Key JavaScript Structure

**Game State** (lines 55-70): Global variables for board, solution, selected cell, mistakes, hints, timer, notes, history, and game status.

**Sudoku Generator** (lines 130-215): Uses backtracking algorithm - `generateCompleteBoard()` fills diagonal 3x3 boxes first, then solves the rest. `createPuzzle()` removes cells based on difficulty.

**Core Functions:**
- `initGame()` - Resets state and generates new puzzle
- `renderBoard()` - Creates 81 cell divs with click handlers
- `selectCell(index)` - Highlights row/column/box and same numbers
- `inputNumber(num)` - Handles input with error checking and animations
- `checkWin()` - Compares board to solution

**Bilingual Support:** HTML elements use `data-en` and `data-al` attributes. `switchLanguage()` updates all translatable elements and saves preference to localStorage.

### Difficulty Levels
- Easy: 35 cells removed
- Medium: 45 cells removed
- Hard: 55 cells removed

## Design System

Dark theme using CSS variables:
- Primary background: `#0d1117`
- Accent color: `#58a6ff`
- Typography: Armata (headings) + Inter (body)
