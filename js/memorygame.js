/**
 * Memory Match Game
 * A simple card matching game with multiple difficulty levels
 * Using wider game board layouts
 */

// Game state
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let totalPairs = 6;  // Default for level 1
let attempts = 0;
let isProcessing = false;
let currentLevel = 1;  // Default level

// All symbols for the game
const allSymbols = [
    '🐶', '🐶', // Dog
    '🐱', '🐱', // Cat
    '🐭', '🐭', // Mouse
    '🐰', '🐰', // Rabbit
    '🦊', '🦊', // Fox
    '🐻', '🐻', // Bear
    '🐼', '🐼', // Panda
    '🦁', '🦁', // Lion
    '🐯', '🐯', // Tiger
    '🐨', '🐨', // Koala
    '🐸', '🐸', // Frog
    '🦄', '🦄'  // Unicorn
];

// DOM elements
const gameBoard = document.getElementById('game-board');
const matchesDisplay = document.getElementById('matches');
const attemptsDisplay = document.getElementById('attempts');
const messageOverlay = document.getElementById('message-overlay');
const messageTitle = document.getElementById('message-title');
const messageText = document.getElementById('message-text');
const finalMatches = document.getElementById('final-matches');
const finalAttempts = document.getElementById('final-attempts');
const resetButton = document.getElementById('reset-btn');
const playAgainButton = document.getElementById('play-again-btn');
const levelButtons = document.querySelectorAll('.level-btn');
const currentLevelDisplay = document.getElementById('current-level');

// Initialize the game
function initGame() {
    resetGameState();
    setDifficultyLevel(currentLevel);
    createCards();
    updateStats();
    
    // Set active level button
    updateActiveLevelButton();
    
    // Event listeners
    resetButton.addEventListener('click', initGame);
    
    playAgainButton.addEventListener('click', () => {
        messageOverlay.classList.remove('show');
        initGame();
    });
    
    // Setup level buttons
    levelButtons.forEach(button => {
        button.addEventListener('click', () => {
            const level = parseInt(button.dataset.level);
            setDifficultyLevel(level);
            initGame();
        });
    });
}

// Update active level button
function updateActiveLevelButton() {
    levelButtons.forEach(button => {
        if (parseInt(button.dataset.level) === currentLevel) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    if (currentLevelDisplay) {
        currentLevelDisplay.textContent = currentLevel;
    }
}

// Set difficulty level - UPDATED for wider layouts
function setDifficultyLevel(level) {
    currentLevel = level;
    
    switch(level) {
        case 1:  // Easy
            totalPairs = 6;  // 12 cards total
            gameBoard.className = 'game-board grid-4-3';  // 4x3 grid (wider)
            break;
        case 2:  // Medium
            totalPairs = 8;  // 16 cards total
            gameBoard.className = 'game-board grid-4-4';  // 4x4 grid
            break;
        case 3:  // Hard
            totalPairs = 12;  // 24 cards total 
            gameBoard.className = 'game-board grid-6-4';  // 6x4 grid (wider)
            break;
        default:
            totalPairs = 6;
            gameBoard.className = 'game-board grid-4-3';
    }
}

// Reset game state
function resetGameState() {
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    attempts = 0;
    isProcessing = false;
    gameBoard.innerHTML = '';
}

// Create and shuffle cards
function createCards() {
    // Get symbols for current level
    const levelSymbols = allSymbols.slice(0, totalPairs * 2);
    
    // Shuffle the symbols
    const shuffledSymbols = [...levelSymbols].sort(() => Math.random() - 0.5);
    
    // Create card elements
    shuffledSymbols.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front"></div>
                <div class="card-back">
                    <div class="card-symbol">${symbol}</div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => flipCard(card, index, symbol));
        gameBoard.appendChild(card);
        cards.push({
            element: card,
            symbol: symbol,
            isFlipped: false,
            isMatched: false
        });
    });
}

// Handle card flip
function flipCard(cardElement, index, symbol) {
    // Prevent flipping if already processing a pair or card is already flipped/matched
    if (isProcessing || cards[index].isFlipped || cards[index].isMatched) {
        return;
    }
    
    // Flip the card
    cardElement.classList.add('flipped');
    cards[index].isFlipped = true;
    flippedCards.push({ index, symbol });
    
    // Check if we have a pair
    if (flippedCards.length === 2) {
        attempts++;
        updateStats();
        
        // Prevent further flips while processing
        isProcessing = true;
        
        // Check for match
        if (flippedCards[0].symbol === flippedCards[1].symbol) {
            handleMatch();
        } else {
            handleMismatch();
        }
    }
}

// Handle matching cards
function handleMatch() {
    matchedPairs++;
    
    // Mark cards as matched
    flippedCards.forEach(card => {
        const cardObj = cards[card.index];
        cardObj.isMatched = true;
        cardObj.element.classList.add('matched');
    });
    
    // Reset for next turn
    flippedCards = [];
    isProcessing = false;
    
    // Update stats
    updateStats();
    
    // Check for game completion
    if (matchedPairs === totalPairs) {
        setTimeout(showGameComplete, 500);
    }
}

// Handle mismatched cards
function handleMismatch() {
    // Time before flipping back depends on difficulty level
    let flipBackTime = 1000;  // Default for level 1
    if (currentLevel === 2) flipBackTime = 800;
    if (currentLevel === 3) flipBackTime = 600;  // Less time for hard level
    
    setTimeout(() => {
        // Flip cards back
        flippedCards.forEach(card => {
            const cardObj = cards[card.index];
            cardObj.isFlipped = false;
            cardObj.element.classList.remove('flipped');
        });
        
        // Reset for next turn
        flippedCards = [];
        isProcessing = false;
    }, flipBackTime);
}

// Update game statistics
function updateStats() {
    matchesDisplay.textContent = matchedPairs;
    attemptsDisplay.textContent = attempts;
}

// Show game completion message
function showGameComplete() {
    let levelText = 'Easy';
    if (currentLevel === 2) levelText = 'Medium';
    if (currentLevel === 3) levelText = 'Hard';
    
    let ratingText = '';
    const accuracy = (matchedPairs / attempts) * 100;
    
    if (accuracy >= 80) {
        ratingText = 'Excellent memory!';
    } else if (accuracy >= 60) {
        ratingText = 'Good job!';
    } else {
        ratingText = 'Keep practicing!';
    }
    
    messageTitle.textContent = "Congratulations!";
    messageText.textContent = `You've completed level ${currentLevel} (${levelText})! ${ratingText}`;
    finalMatches.textContent = matchedPairs;
    finalAttempts.textContent = attempts;
    messageOverlay.classList.add('show');
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', initGame);