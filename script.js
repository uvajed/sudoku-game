/**
 * SUDOKU GAME
 * A bilingual (English/Albanian) Sudoku puzzle game
 */

// ==========================================
// LANGUAGE TRANSLATIONS
// ==========================================
const translations = {
    en: {
        difficulty: 'Difficulty',
        time: 'Time',
        mistakes: 'Mistakes',
        congratulations: 'Congratulations!',
        solvedPuzzle: 'You solved the puzzle!',
        gameOver: 'Game Over',
        tooManyMistakes: 'Too many mistakes!',
        playAgain: 'Play Again',
        tryAgain: 'Try Again',
        undo: 'Undo',
        notes: 'Notes',
        hint: 'Hint',
        difficultyLabel: 'Difficulty:',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        newGame: 'New Game',
        instructions: 'Use keyboard (1-9) or click numbers to play'
    },
    al: {
        difficulty: 'Vështirësia',
        time: 'Koha',
        mistakes: 'Gabimet',
        congratulations: 'Urime!',
        solvedPuzzle: 'Ju e zgjidhët enigmën!',
        gameOver: 'Loja Mbaroi',
        tooManyMistakes: 'Shumë gabime!',
        playAgain: 'Luaj Përsëri',
        tryAgain: 'Provo Përsëri',
        undo: 'Zhbëj',
        notes: 'Shënime',
        hint: 'Ndihmë',
        difficultyLabel: 'Vështirësia:',
        easy: 'Lehtë',
        medium: 'Mesatar',
        hard: 'Vështirë',
        newGame: 'Lojë e Re',
        instructions: 'Përdorni tastierën (1-9) ose klikoni numrat për të luajtur'
    }
};

// ==========================================
// GAME STATE
// ==========================================
let currentLanguage = 'en';
let board = [];
let solution = [];
let initialBoard = [];
let selectedCell = null;
let mistakes = 0;
let maxMistakes = 3;
let hints = 3;
let timer = 0;
let timerInterval = null;
let isNotesMode = false;
let notes = Array(81).fill(null).map(() => new Set());
let history = [];
let difficulty = 'easy';
let isGameOver = false;
let isGameWon = false;

// Difficulty settings (number of cells to remove)
const difficultyLevels = {
    easy: 35,
    medium: 45,
    hard: 55
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const sudokuBoard = document.getElementById('sudokuBoard');
const timerDisplay = document.getElementById('timerDisplay');
const mistakesCount = document.getElementById('mistakesCount');
const difficultyDisplay = document.getElementById('difficultyDisplay');
const hintCount = document.getElementById('hintCount');
const numberPad = document.getElementById('numberPad');
const langToggle = document.getElementById('langToggle');
const currentLangSpan = document.getElementById('currentLang');
const newGameBtn = document.getElementById('newGameBtn');
const undoBtn = document.getElementById('undoBtn');
const notesBtn = document.getElementById('notesBtn');
const hintBtn = document.getElementById('hintBtn');
const winOverlay = document.getElementById('winOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const playAgainBtn = document.getElementById('playAgainBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const winTime = document.getElementById('winTime');
const winMistakes = document.getElementById('winMistakes');

// ==========================================
// SUDOKU GENERATOR & SOLVER
// ==========================================

/**
 * Check if a number is valid in a given position
 */
function isValid(board, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
    }

    // Check 3x3 box
    const startRow = row - row % 3;
    const startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num) return false;
        }
    }

    return true;
}

/**
 * Solve the Sudoku using backtracking
 */
function solveSudoku(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) {
                            return true;
                        }
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

/**
 * Generate a complete valid Sudoku board
 */
function generateCompleteBoard() {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));

    // Fill diagonal 3x3 boxes first (they are independent)
    for (let box = 0; box < 9; box += 3) {
        fillBox(board, box, box);
    }

    // Solve the rest
    solveSudoku(board);
    return board;
}

/**
 * Fill a 3x3 box with random numbers
 */
function fillBox(board, row, col) {
    const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let index = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            board[row + i][col + j] = nums[index++];
        }
    }
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Remove numbers to create a puzzle
 */
function createPuzzle(completeBoard, cellsToRemove) {
    const puzzle = completeBoard.map(row => [...row]);
    const positions = [];

    for (let i = 0; i < 81; i++) {
        positions.push(i);
    }

    const shuffledPositions = shuffleArray(positions);

    for (let i = 0; i < cellsToRemove; i++) {
        const pos = shuffledPositions[i];
        const row = Math.floor(pos / 9);
        const col = pos % 9;
        puzzle[row][col] = 0;
    }

    return puzzle;
}

// ==========================================
// GAME LOGIC
// ==========================================

/**
 * Initialize a new game
 */
function initGame() {
    // Reset game state
    mistakes = 0;
    hints = 3;
    timer = 0;
    selectedCell = null;
    isNotesMode = false;
    isGameOver = false;
    isGameWon = false;
    notes = Array(81).fill(null).map(() => new Set());
    history = [];

    // Generate new puzzle
    const completeBoard = generateCompleteBoard();
    solution = completeBoard.map(row => [...row]);
    board = createPuzzle(completeBoard, difficultyLevels[difficulty]);
    initialBoard = board.map(row => [...row]);

    // Update UI
    updateMistakesDisplay();
    updateHintCount();
    updateDifficultyDisplay();
    updateNotesButton();
    hideOverlays();

    // Start timer
    startTimer();

    // Render board
    renderBoard();
    updateNumberPadCounts();
}

/**
 * Render the Sudoku board
 */
function renderBoard() {
    sudokuBoard.innerHTML = '';

    for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.dataset.row = row;
        cell.dataset.col = col;

        const value = board[row][col];

        if (value !== 0) {
            cell.textContent = value;
            if (initialBoard[row][col] !== 0) {
                cell.classList.add('fixed');
            } else {
                cell.classList.add('user-input');
            }
        } else if (notes[i].size > 0) {
            renderNotes(cell, notes[i]);
        }

        cell.addEventListener('click', () => selectCell(i));
        sudokuBoard.appendChild(cell);
    }
}

/**
 * Render notes in a cell
 */
function renderNotes(cell, cellNotes) {
    const notesContainer = document.createElement('div');
    notesContainer.className = 'notes';

    for (let n = 1; n <= 9; n++) {
        const noteSpan = document.createElement('span');
        noteSpan.className = 'note';
        noteSpan.textContent = cellNotes.has(n) ? n : '';
        notesContainer.appendChild(noteSpan);
    }

    cell.appendChild(notesContainer);
}

/**
 * Select a cell
 */
function selectCell(index) {
    if (isGameOver || isGameWon) return;

    const cells = document.querySelectorAll('.cell');

    // Remove previous highlights
    cells.forEach(c => {
        c.classList.remove('selected', 'highlighted', 'same-number');
    });

    selectedCell = index;
    const row = Math.floor(index / 9);
    const col = index % 9;
    const selectedValue = board[row][col];

    // Highlight related cells
    cells.forEach((cell, i) => {
        const cellRow = Math.floor(i / 9);
        const cellCol = i % 9;
        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);
        const cellBoxRow = Math.floor(cellRow / 3);
        const cellBoxCol = Math.floor(cellCol / 3);

        // Same row, column, or box
        if (cellRow === row || cellCol === col ||
            (cellBoxRow === boxRow && cellBoxCol === boxCol)) {
            cell.classList.add('highlighted');
        }

        // Same number
        if (selectedValue !== 0 && board[cellRow][cellCol] === selectedValue) {
            cell.classList.add('same-number');
        }
    });

    // Mark selected cell
    cells[index].classList.add('selected');
    cells[index].classList.remove('highlighted');
}

/**
 * Input a number
 */
function inputNumber(num) {
    if (selectedCell === null || isGameOver || isGameWon) return;

    const row = Math.floor(selectedCell / 9);
    const col = selectedCell % 9;

    // Can't modify fixed cells
    if (initialBoard[row][col] !== 0) return;

    const cell = document.querySelectorAll('.cell')[selectedCell];

    if (isNotesMode && num !== 0) {
        // Toggle note
        if (board[row][col] === 0) {
            // Save state for undo
            history.push({
                type: 'note',
                index: selectedCell,
                notes: new Set(notes[selectedCell])
            });

            if (notes[selectedCell].has(num)) {
                notes[selectedCell].delete(num);
            } else {
                notes[selectedCell].add(num);
            }
            renderBoard();
            selectCell(selectedCell);
        }
    } else {
        // Save state for undo
        history.push({
            type: 'value',
            index: selectedCell,
            value: board[row][col],
            notes: new Set(notes[selectedCell])
        });

        if (num === 0) {
            // Erase
            board[row][col] = 0;
            notes[selectedCell].clear();
            renderBoard();
            selectCell(selectedCell);
            updateNumberPadCounts();
        } else {
            // Check if correct
            if (num !== solution[row][col]) {
                mistakes++;
                updateMistakesDisplay();

                // Show error animation without re-rendering
                cell.classList.add('error');
                cell.textContent = num;
                cell.classList.add('user-input');

                // Remove error and clear cell after animation
                setTimeout(() => {
                    cell.classList.remove('error');
                    cell.textContent = '';
                    cell.classList.remove('user-input');
                }, 600);

                if (mistakes >= maxMistakes) {
                    setTimeout(() => {
                        gameOver();
                    }, 600);
                    return;
                }
            } else {
                board[row][col] = num;
                notes[selectedCell].clear();

                // Remove notes from related cells
                removeRelatedNotes(row, col, num);

                renderBoard();
                selectCell(selectedCell);
                updateNumberPadCounts();

                // Add correct animation to the new cell
                const newCell = document.querySelectorAll('.cell')[selectedCell];
                newCell.classList.add('correct-animation');
                setTimeout(() => {
                    newCell.classList.remove('correct-animation');
                }, 300);

                // Check for win
                if (checkWin()) {
                    winGame();
                    return;
                }
            }
        }
    }
}

/**
 * Remove notes from related cells when a number is placed
 */
function removeRelatedNotes(row, col, num) {
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartCol = Math.floor(col / 3) * 3;

    for (let i = 0; i < 9; i++) {
        // Same row
        notes[row * 9 + i].delete(num);
        // Same column
        notes[i * 9 + col].delete(num);
    }

    // Same box
    for (let r = boxStartRow; r < boxStartRow + 3; r++) {
        for (let c = boxStartCol; c < boxStartCol + 3; c++) {
            notes[r * 9 + c].delete(num);
        }
    }
}

/**
 * Undo last action
 */
function undo() {
    if (history.length === 0 || isGameOver || isGameWon) return;

    const lastAction = history.pop();
    const row = Math.floor(lastAction.index / 9);
    const col = lastAction.index % 9;

    if (lastAction.type === 'value') {
        board[row][col] = lastAction.value;
        notes[lastAction.index] = lastAction.notes;
    } else if (lastAction.type === 'note') {
        notes[lastAction.index] = lastAction.notes;
    }

    renderBoard();
    selectCell(lastAction.index);
    updateNumberPadCounts();
}

/**
 * Use a hint
 */
function useHint() {
    if (hints <= 0 || isGameOver || isGameWon) return;

    // Find empty cells
    const emptyCells = [];
    for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        if (board[row][col] === 0) {
            emptyCells.push(i);
        }
    }

    if (emptyCells.length === 0) return;

    // Pick a random empty cell
    const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const row = Math.floor(randomIndex / 9);
    const col = randomIndex % 9;

    // Save state for undo
    history.push({
        type: 'value',
        index: randomIndex,
        value: board[row][col],
        notes: new Set(notes[randomIndex])
    });

    // Fill with correct value
    board[row][col] = solution[row][col];
    notes[randomIndex].clear();
    removeRelatedNotes(row, col, solution[row][col]);

    hints--;
    updateHintCount();

    renderBoard();
    selectCell(randomIndex);
    updateNumberPadCounts();

    // Flash the cell
    const cell = document.querySelectorAll('.cell')[randomIndex];
    cell.classList.add('correct-animation');
    setTimeout(() => {
        cell.classList.remove('correct-animation');
    }, 300);

    // Check for win
    if (checkWin()) {
        winGame();
    }
}

/**
 * Toggle notes mode
 */
function toggleNotesMode() {
    isNotesMode = !isNotesMode;
    updateNotesButton();
}

/**
 * Check if the puzzle is solved
 */
function checkWin() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== solution[row][col]) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Win the game
 */
function winGame() {
    isGameWon = true;
    stopTimer();
    winTime.textContent = formatTime(timer);
    winMistakes.textContent = mistakes;
    winOverlay.classList.add('active');
    createConfetti();
}

/**
 * Create confetti celebration effect
 */
function createConfetti() {
    const colors = ['#58a6ff', '#3fb950', '#f85149', '#d29922', '#a371f7', '#79c0ff'];
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = -10 + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';

        // Random shapes
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        }

        confettiContainer.appendChild(confetti);

        // Trigger animation
        setTimeout(() => confetti.classList.add('active'), 10);
    }

    // Remove confetti after animation
    setTimeout(() => {
        confettiContainer.remove();
    }, 5000);
}

/**
 * Game over
 */
function gameOver() {
    isGameOver = true;
    stopTimer();
    gameOverOverlay.classList.add('active');
}

/**
 * Hide overlays
 */
function hideOverlays() {
    winOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
}

// ==========================================
// TIMER
// ==========================================

function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        timer++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timer);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ==========================================
// UI UPDATES
// ==========================================

function updateMistakesDisplay() {
    mistakesCount.textContent = mistakes;
}

function updateHintCount() {
    hintCount.textContent = hints;
}

function updateDifficultyDisplay() {
    const t = translations[currentLanguage];
    const diffText = {
        easy: t.easy,
        medium: t.medium,
        hard: t.hard
    };
    difficultyDisplay.textContent = diffText[difficulty];
}

function updateNotesButton() {
    if (isNotesMode) {
        notesBtn.classList.add('active');
    } else {
        notesBtn.classList.remove('active');
    }
}

function updateNumberPadCounts() {
    const counts = Array(10).fill(0);

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== 0) {
                counts[board[row][col]]++;
            }
        }
    }

    const numButtons = document.querySelectorAll('.num-btn[data-number]');
    numButtons.forEach(btn => {
        const num = parseInt(btn.dataset.number);
        if (num >= 1 && num <= 9) {
            if (counts[num] >= 9) {
                btn.classList.add('disabled');
            } else {
                btn.classList.remove('disabled');
            }
        }
    });
}

// ==========================================
// LANGUAGE SWITCHING
// ==========================================

function switchLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'al' : 'en';
    currentLangSpan.textContent = currentLanguage.toUpperCase();

    // Update all translatable elements
    document.querySelectorAll('[data-en]').forEach(el => {
        el.textContent = el.dataset[currentLanguage];
    });

    updateDifficultyDisplay();
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Language toggle
langToggle.addEventListener('click', switchLanguage);

// New game button
newGameBtn.addEventListener('click', initGame);

// Play again buttons
playAgainBtn.addEventListener('click', initGame);
tryAgainBtn.addEventListener('click', initGame);

// Undo button
undoBtn.addEventListener('click', undo);

// Notes button
notesBtn.addEventListener('click', toggleNotesMode);

// Hint button
hintBtn.addEventListener('click', useHint);

// Number pad
numberPad.addEventListener('click', (e) => {
    const btn = e.target.closest('.num-btn');
    if (btn && !btn.classList.contains('disabled')) {
        const num = parseInt(btn.dataset.number);
        inputNumber(num);
    }
});

// Difficulty buttons
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = btn.dataset.difficulty;
    });
});

// Keyboard input
document.addEventListener('keydown', (e) => {
    if (isGameOver || isGameWon) return;

    if (e.key >= '1' && e.key <= '9') {
        inputNumber(parseInt(e.key));
    } else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
        inputNumber(0);
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
    } else if (e.key === 'n' || e.key === 'N') {
        toggleNotesMode();
    } else if (e.key === 'h' || e.key === 'H') {
        useHint();
    } else if (e.key === 'ArrowUp' && selectedCell !== null) {
        e.preventDefault();
        const newIndex = selectedCell - 9;
        if (newIndex >= 0) selectCell(newIndex);
    } else if (e.key === 'ArrowDown' && selectedCell !== null) {
        e.preventDefault();
        const newIndex = selectedCell + 9;
        if (newIndex < 81) selectCell(newIndex);
    } else if (e.key === 'ArrowLeft' && selectedCell !== null) {
        e.preventDefault();
        const col = selectedCell % 9;
        if (col > 0) selectCell(selectedCell - 1);
    } else if (e.key === 'ArrowRight' && selectedCell !== null) {
        e.preventDefault();
        const col = selectedCell % 9;
        if (col < 8) selectCell(selectedCell + 1);
    }
});

// ==========================================
// INITIALIZE GAME
// ==========================================
initGame();
