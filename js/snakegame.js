// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const currentScoreEl = document.getElementById('currentScore');
const finalScoreEl = document.getElementById('finalScore');
const highScoreEl = document.getElementById('highScore');
const livesEl = document.getElementById('lives'); // Add reference to lives display element
const detectedCommandEl = document.getElementById('detectedCommand');
const confidenceLevelEl = document.getElementById('confidenceLevel');

// Game variables
let snake;
let food;
let powerUps = [];
let gridSize = 20;
let gameWidth = 500;
let gameHeight = 500;
let gameCanvas;
let score = 0;
let highScore = 0;
let lives = 5; // Add lives counter, starting with 5 lives
let gameSpeed = 3; // Very slow speed
let gameActive = false;
let gamePaused = false;
let ghostMode = false;
let lastPowerUpTime = 0;
let powerUpInterval = 15000; // 15 seconds between power-ups

// Snake animation variables
let eyeBlinkTimer = 0;
let isBlinking = false;
let tongueOut = false;
let tongueTimer = 0;

// Speech recognition variables
let recognizer;
let recognizerActive = false;
let directionalCommands = ['up', 'down', 'left', 'right'];

// Add event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
pauseBtn.addEventListener('click', togglePause);

// Initialize speech recognition as soon as the page loads
document.addEventListener('DOMContentLoaded', initializeSpeechRecognition);

// P5.js setup function
function setup() {
  gameCanvas = createCanvas(gameWidth, gameHeight);
  gameCanvas.parent('game-canvas');
  
  // Set initial frame rate
  frameRate(0); // Start with 0 to pause the game until started
  
  // Initialize game elements but don't start yet
  initializeGame();
  
  // Hide loading screen after everything is loaded
  loadingScreen.style.display = 'none';
}

function initializeGame() {
  // Create snake
  snake = new Snake();
  
  // Create food
  food = createFood();
  
  // Clear power-ups
  powerUps = [];
  
  // Reset game states
  score = 0;
  lives = 5; // Reset lives to 5
  ghostMode = false;
  lastPowerUpTime = 0;
  updateScore();
  updateLives(); // Update lives display
  
  // Reset animation timers
  eyeBlinkTimer = 0;
  isBlinking = false;
  tongueOut = false;
  tongueTimer = 0;
}

// Initialize speech recognition immediately when the page loads
async function initializeSpeechRecognition() {
  // Show loading state on the page
  loadingScreen.style.display = 'flex';
  
  try {
    // Create and initialize the speech recognizer
    if (!recognizer) {
      recognizer = speechCommands.create('BROWSER_FFT');
      
      // Load the model
      await recognizer.ensureModelLoaded();
      console.log('Speech recognition model loaded');
      
      // Log the available commands
      console.log('Available commands:', recognizer.wordLabels());
    }
    
    // Start listening immediately
    if (!recognizerActive) {
      recognizer.listen(result => {
        // Process the speech recognition results
        const scores = result.scores;
        
        // Find the command with the highest confidence
        let maxScore = 0;
        let bestCommand = '';
        
        // Check only the directional commands
        directionalCommands.forEach(command => {
          const commandIndex = recognizer.wordLabels().indexOf(command);
          if (commandIndex !== -1 && scores[commandIndex] > maxScore) {
            maxScore = scores[commandIndex];
            bestCommand = command;
          }
        });
        
        // Update UI with the detected command
        if (maxScore > 0) {
          detectedCommandEl.textContent = bestCommand;
          confidenceLevelEl.style.width = (maxScore * 100) + '%';
          
          // Process the command if confidence is high enough
          if (maxScore > 0.75) {
            processCommand(bestCommand);
          }
        }
      }, {
        includeSpectrogram: false,
        probabilityThreshold: 0.75,
        invokeCallbackOnNoiseAndUnknown: false
      });
      
      recognizerActive = true;
    }
    
    // Hide loading screen once speech recognition is initialized
    loadingScreen.style.display = 'none';
    
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
    alert('Failed to initialize speech recognition. Please try again.');
    loadingScreen.style.display = 'none';
  }
}

// Start the game (now only starts the game mechanics, not the speech recognition)
async function startGame() {
  // Start the actual game
  startActualGame();
}

function startActualGame() {
  // Hide the start overlay and start the game
  startOverlay.style.display = 'none';
  gameActive = true;
  gamePaused = false;
  frameRate(gameSpeed);
}

function restartGame() {
  gameOverOverlay.style.display = 'none';
  initializeGame();
  gameActive = true;
  gamePaused = false;
  frameRate(gameSpeed);
}

function togglePause() {
  if (!gameActive) return;
  
  gamePaused = !gamePaused;
  
  if (gamePaused) {
    frameRate(0);
    pauseBtn.textContent = 'Resume';
  } else {
    frameRate(gameSpeed);
    pauseBtn.textContent = 'Pause';
  }
}

function updateScore() {
  currentScoreEl.textContent = score;
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = highScore;
  }
}

// New function to update lives display
function updateLives() {
  if (livesEl) {
    livesEl.textContent = lives;
  }
}

function loseLife() {
  lives--;
  updateLives();
  
  // Flash the screen red to indicate damage
  background(255, 0, 0, 100);
  
  // If out of lives, game over
  if (lives <= 0) {
    gameOver();
    return true;
  }
  
  // Otherwise, reset snake position but keep the score
  snake = new Snake();
  
  // Brief pause to show the player they lost a life
  gamePaused = true;
  setTimeout(() => {
    if (gameActive) {
      gamePaused = false;
      frameRate(gameSpeed);
    }
  }, 1000);
  
  return false;
}

function gameOver() {
  gameActive = false;
  frameRate(0);
  finalScoreEl.textContent = score;
  gameOverOverlay.style.display = 'flex';
  
  // We don't stop the recognizer anymore, just let it keep running
}

function processCommand(command) {
  if (!gameActive || gamePaused) return;
  
  // Direction controls
  switch (command.toLowerCase()) {
    case 'up':
      if (snake.yDir !== 1) {
        snake.setDirection(0, -1);
      }
      break;
    case 'down':
      if (snake.yDir !== -1) {
        snake.setDirection(0, 1);
      }
      break;
    case 'left':
      if (snake.xDir !== 1) {
        snake.setDirection(-1, 0);
      }
      break;
    case 'right':
      if (snake.xDir !== -1) {
        snake.setDirection(1, 0);
      }
      break;
  }
}

function createFood() {
  // Create food at a random position that's not inside the snake
  let x, y;
  let validPosition = false;
  
  while (!validPosition) {
    x = floor(random(width / gridSize)) * gridSize;
    y = floor(random(height / gridSize)) * gridSize;
    
    validPosition = true;
    // Check if position overlaps with snake
    for (let i = 0; i < snake.body.length; i++) {
      if (x === snake.body[i].x && y === snake.body[i].y) {
        validPosition = false;
        break;
      }
    }
  }
  
  return { x, y };
}

function createPowerUp() {
  // Don't create power-ups if there are already 2 on screen
  if (powerUps.length >= 2) return;
  
  // Create power-up at a random position
  let x = floor(random(width / gridSize)) * gridSize;
  let y = floor(random(height / gridSize)) * gridSize;
  
  // Random power-up type: 0=speed, 1=slow, 2=ghost
  let type = floor(random(3));
  
  powerUps.push({ x, y, type });
}

function Snake() {
  this.body = [];
  this.body.push({ x: 240, y: 200 });
  this.body.push({ x: 220, y: 200 });
  this.body.push({ x: 200, y: 200 });
  
  this.xDir = 1;
  this.yDir = 0;
  
  this.setDirection = function(x, y) {
    this.xDir = x;
    this.yDir = y;
    
    // When changing direction, stick out tongue occasionally
    if (random() < 0.3) {
      tongueOut = true;
      tongueTimer = 0;
    }
  };
  
  this.update = function() {
    // Create a new head segment
    let head = { 
      x: this.body[0].x + this.xDir * gridSize, 
      y: this.body[0].y + this.yDir * gridSize 
    };
    
    // Check for wall collisions
    if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
      if (ghostMode) {
        // In ghost mode, wrap around the screen
        if (head.x < 0) head.x = width - gridSize;
        if (head.x >= width) head.x = 0;
        if (head.y < 0) head.y = height - gridSize;
        if (head.y >= height) head.y = 0;
        ghostMode = false; // Use up ghost mode
      } else {
        // Lose a life instead of immediate game over
        if (loseLife()) return; // If loseLife returns true, game is over
        return; // Skip the rest of the update for this cycle
      }
    }
    
    // Check for self collision
    for (let i = 0; i < this.body.length; i++) {
      if (head.x === this.body[i].x && head.y === this.body[i].y) {
        if (ghostMode) {
          ghostMode = false; // Use up ghost mode
        } else {
          // Lose a life instead of immediate game over
          if (loseLife()) return; // If loseLife returns true, game is over
          return; // Skip the rest of the update for this cycle
        }
      }
    }
    
    // Add the new head to the beginning of the body
    this.body.unshift(head);
    
    // Check if snake ate the food - using a larger hit area for food
    const foodRadius = gridSize * 0.7; // Bigger food collision radius
    const distToFood = dist(head.x + gridSize/2, head.y + gridSize/2, 
                           food.x + gridSize/2, food.y + gridSize/2);
    
    if (distToFood < foodRadius + gridSize/2) {
      // Create new food
      food = createFood();
      // Increase score
      score += 10;
      updateScore();
      
      // Stick out tongue when eating
      tongueOut = true;
      tongueTimer = 0;
    } else {
      // Remove the last segment if no food was eaten
      this.body.pop();
    }
    
    // Check if snake ate a power-up
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (head.x === powerUps[i].x && head.y === powerUps[i].y) {
        // Apply power-up effect
        switch (powerUps[i].type) {
          case 0: // Speed boost
            frameRate(gameSpeed * 1.5);
            setTimeout(() => {
              if (gameActive && !gamePaused) frameRate(gameSpeed);
            }, 5000); // Speed boost lasts 5 seconds
            break;
          case 1: // Slow motion
            frameRate(gameSpeed * 0.5);
            setTimeout(() => {
              if (gameActive && !gamePaused) frameRate(gameSpeed);
            }, 5000); // Slow motion lasts 5 seconds
            break;
          case 2: // Ghost mode
            ghostMode = true;
            break;
        }
        
        // Remove the power-up
        powerUps.splice(i, 1);
        
        // Add bonus points
        score += 5;
        updateScore();
      }
    }
    
    // Update animation timers
    eyeBlinkTimer++;
    tongueTimer++;
    
    // Handle blinking
    if (eyeBlinkTimer > 60 && !isBlinking) { // Blink every ~2 seconds
      if (random() < 0.3) { // 30% chance to blink
        isBlinking = true;
      }
      eyeBlinkTimer = 0;
    }
    
    // Reset blink state after a short period
    if (isBlinking && eyeBlinkTimer > 5) {
      isBlinking = false;
    }
    
    // Retract tongue after a short time
    if (tongueOut && tongueTimer > 15) {
      tongueOut = false;
    }
  };
  
  this.draw = function() {
    // Draw the snake cartoon-style
    noStroke();
    
    // Set the base snake colors
    const snakeGreen = color(50, 168, 82); // Brighter green
    const snakeDarkGreen = color(35, 120, 60); // Darker green for patterns
    const headColor = color(60, 180, 96); // Slightly different color for head
    
    // Apply transparency if in ghost mode
    if (ghostMode) {
      snakeGreen.setAlpha(150);
      snakeDarkGreen.setAlpha(150);
      headColor.setAlpha(150);
    }
    
    // Draw each segment of the snake
    for (let i = 0; i < this.body.length; i++) {
      // Set color based on position (create pattern)
      if (i % 2 === 0) {
        fill(snakeGreen);
      } else {
        fill(snakeDarkGreen);
      }
      
      // Get the position of this segment
      const x = this.body[i].x;
      const y = this.body[i].y;
      
      // Draw body segments as rounded rectangles
      const cornerRadius = 8;
      rect(x, y, gridSize, gridSize, cornerRadius);
      
      // For head segment, add cartoon features
      if (i === 0) {
        fill(headColor);
        rect(x, y, gridSize, gridSize, cornerRadius);
        
        // Determine eye positions based on direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        let eyeSize = 5;
        
        if (this.xDir === 1) { // Moving right
          leftEyeX = x + gridSize - 7;
          leftEyeY = y + 7;
          rightEyeX = x + gridSize - 7;
          rightEyeY = y + gridSize - 7;
        } else if (this.xDir === -1) { // Moving left
          leftEyeX = x + 7;
          leftEyeY = y + 7;
          rightEyeX = x + 7;
          rightEyeY = y + gridSize - 7;
        } else if (this.yDir === -1) { // Moving up
          leftEyeX = x + 7;
          leftEyeY = y + 7;
          rightEyeX = x + gridSize - 7;
          rightEyeY = y + 7;
        } else { // Moving down
          leftEyeX = x + 7;
          leftEyeY = y + gridSize - 7;
          rightEyeX = x + gridSize - 7;
          rightEyeY = y + gridSize - 7;
        }
        
        // Draw eyes
        if (!isBlinking) {
          fill(255); // White eyes
          ellipse(leftEyeX, leftEyeY, eyeSize * 2);
          ellipse(rightEyeX, rightEyeY, eyeSize * 2);
          
          // Draw pupils
          fill(0); // Black pupils
          let pupilOffset = 1; // Offset for pupil movement
          
          // Move pupils in the direction of movement
          if (this.xDir === 1) pupilOffset = 1;
          else if (this.xDir === -1) pupilOffset = -1;
          else if (this.yDir === 1) pupilOffset = 1;
          else if (this.yDir === -1) pupilOffset = -1;
          
          ellipse(leftEyeX + pupilOffset, leftEyeY + pupilOffset, eyeSize);
          ellipse(rightEyeX + pupilOffset, rightEyeY + pupilOffset, eyeSize);
        } else {
          // Draw closed eyes (simple lines)
          stroke(0);
          strokeWeight(2);
          line(leftEyeX - eyeSize/2, leftEyeY, leftEyeX + eyeSize/2, leftEyeY);
          line(rightEyeX - eyeSize/2, rightEyeY, rightEyeX + eyeSize/2, rightEyeY);
          noStroke();
        }
        
        // Draw forked tongue occasionally
        if (tongueOut) {
          fill(255, 50, 50);
          let tongueX, tongueY, tongueLength = 12;
          
          if (this.xDir === 1) { // Right
            tongueX = x + gridSize;
            tongueY = y + gridSize/2;
            // Draw forked tongue
            beginShape();
            vertex(tongueX, tongueY);
            vertex(tongueX + tongueLength, tongueY - 4);
            vertex(tongueX + tongueLength - 3, tongueY);
            vertex(tongueX + tongueLength, tongueY + 4);
            vertex(tongueX, tongueY);
            endShape();
          } else if (this.xDir === -1) { // Left
            tongueX = x;
            tongueY = y + gridSize/2;
            beginShape();
            vertex(tongueX, tongueY);
            vertex(tongueX - tongueLength, tongueY - 4);
            vertex(tongueX - tongueLength + 3, tongueY);
            vertex(tongueX - tongueLength, tongueY + 4);
            vertex(tongueX, tongueY);
            endShape();
          } else if (this.yDir === -1) { // Up
            tongueX = x + gridSize/2;
            tongueY = y;
            beginShape();
            vertex(tongueX, tongueY);
            vertex(tongueX - 4, tongueY - tongueLength);
            vertex(tongueX, tongueY - tongueLength + 3);
            vertex(tongueX + 4, tongueY - tongueLength);
            vertex(tongueX, tongueY);
            endShape();
          } else if (this.yDir === 1) { // Down
            tongueX = x + gridSize/2;
            tongueY = y + gridSize;
            beginShape();
            vertex(tongueX, tongueY);
            vertex(tongueX - 4, tongueY + tongueLength);
            vertex(tongueX, tongueY + tongueLength - 3);
            vertex(tongueX + 4, tongueY + tongueLength);
            vertex(tongueX, tongueY);
            endShape();
          }
        }
      }
    }
  };
}

function draw() {
  if (!gameActive || gamePaused) return;
  
  // Clear the background with a nice grass green
  background(35, 90, 50);
  
  // Draw lives as little heart icons at the top of the screen
  drawLives();
  
  // Draw grid lines (subtle)
  stroke(39, 100, 45, 80);
  strokeWeight(1);
  for (let i = 0; i < width; i += gridSize) {
    line(i, 0, i, height);
  }
  for (let i = 0; i < height; i += gridSize) {
    line(0, i, width, i);
  }
  
  // Update and draw the snake
  snake.update();
  snake.draw();
  
  // Draw the food as a big red apple with animation
  noStroke();
  
  // Apple stem
  fill(101, 67, 33);
  rect(food.x + gridSize/2 - 2, food.y + gridSize/2 - 15, 4, 8);
  
  // Bigger apple size (1.5x normal)
  const appleSize = gridSize * 1.5;
  
  // Animate the apple with a slight pulse
  let pulseFactor = sin(frameCount * 0.05) * 0.05 + 0.95;
  let currentAppleSize = appleSize * pulseFactor;
  
  // Draw shadow
  fill(0, 0, 0, 30);
  ellipse(food.x + gridSize/2 + 2, food.y + gridSize/2 + 2, currentAppleSize, currentAppleSize);
  
  // Apple body
  fill(220, 30, 30); // Bright red for apple
  ellipse(food.x + gridSize/2, food.y + gridSize/2, currentAppleSize, currentAppleSize);
  
  // Apple highlight
  fill(255, 255, 255, 80);
  ellipse(food.x + gridSize/2 - 5, food.y + gridSize/2 - 5, currentAppleSize * 0.3, currentAppleSize * 0.3);
  
  // Apple leaf
  fill(60, 180, 60);
  beginShape();
  vertex(food.x + gridSize/2 + 3, food.y + gridSize/2 - 13);
  bezierVertex(
    food.x + gridSize/2 + 10, food.y + gridSize/2 - 15,
    food.x + gridSize/2 + 15, food.y + gridSize/2 - 10,
    food.x + gridSize/2 + 8, food.y + gridSize/2 - 5
  );
  bezierVertex(
    food.x + gridSize/2 + 5, food.y + gridSize/2 - 8,
    food.x + gridSize/2 + 3, food.y + gridSize/2 - 10,
    food.x + gridSize/2 + 3, food.y + gridSize/2 - 13
  );
  endShape();
  
  // Draw power-ups with animation
  for (let i = 0; i < powerUps.length; i++) {
    // Animate power-ups with pulsing effect
    let powerUpPulse = sin(frameCount * 0.1 + i) * 0.15 + 0.85;
    let powerUpSize = gridSize * 0.9 * powerUpPulse;
    
    switch (powerUps[i].type) {
      case 0: // Speed boost (red)
        fill(255, 107, 107);
        break;
      case 1: // Slow motion (blue)
        fill(72, 219, 251);
        break;
      case 2: // Ghost mode (purple)
        fill(165, 94, 234);
        break;
    }
    
    // Draw power-up with glow effect
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = color(255, 255, 255, 150);
    ellipse(powerUps[i].x + gridSize/2, powerUps[i].y + gridSize/2, powerUpSize, powerUpSize);
    drawingContext.shadowBlur = 0;
  }
  
  // Create power-ups periodically
  if (millis() - lastPowerUpTime > powerUpInterval) {
    createPowerUp();
    lastPowerUpTime = millis();
  }
}

// Function to draw lives as hearts
function drawLives() {
  const heartSize = 15;
  const startX = 10;
  const startY = 10;
  const spacing = 20;
  
  fill(255, 50, 50); // Red color for hearts
  noStroke();
  
  for (let i = 0; i < lives; i++) {
    const x = startX + (i * spacing);
    const y = startY;
    
    // Draw a heart shape
    beginShape();
    // Left half of heart
    vertex(x, y);
    bezierVertex(x - heartSize/2, y - heartSize/2, 
                 x - heartSize, y + heartSize/3, 
                 x, y + heartSize/2);
    // Right half of heart
    bezierVertex(x + heartSize, y + heartSize/3, 
                 x + heartSize/2, y - heartSize/2, 
                 x, y);
    endShape(CLOSE);
  }
}

// Clean up resources when the page is closed or navigated away from
window.addEventListener('beforeunload', () => {
  // Stop the speech recognition if it's active
  if (recognizer && recognizerActive) {
    recognizer.stopListening();
  }
});

// Keyboard controls as a fallback
function keyPressed() {
  if (!gameActive || gamePaused) return;
  
  switch(keyCode) {
    case UP_ARROW:
      if (snake.yDir !== 1) {
        snake.setDirection(0, -1);
      }
      break;
    case DOWN_ARROW:
      if (snake.yDir !== -1) {
        snake.setDirection(0, 1);
      }
      break;
    case LEFT_ARROW:
      if (snake.xDir !== 1) {
        snake.setDirection(-1, 0);
      }
      break;
    case RIGHT_ARROW:
      if (snake.xDir !== -1) {
        snake.setDirection(1, 0);
      }
      break;
    case 32: // Space bar
      togglePause();
      break;
  }
}

// Add a mobile-friendly control option
function touchStarted() {
  if (!gameActive || gamePaused) return;
  
  // Simple touch controls based on which quadrant of the screen was touched
  const touchX = mouseX; 
  const touchY = mouseY;
  
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Determine direction based on touch position relative to center
  const xDiff = touchX - centerX;
  const yDiff = touchY - centerY;
  
  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    // Horizontal movement is larger
    if (xDiff > 0 && snake.xDir !== -1) {
      snake.setDirection(1, 0); // Right
    } else if (xDiff < 0 && snake.xDir !== 1) {
      snake.setDirection(-1, 0); // Left
    }
  } else {
    // Vertical movement is larger
    if (yDiff > 0 && snake.yDir !== -1) {
      snake.setDirection(0, 1); // Down
    } else if (yDiff < 0 && snake.yDir !== 1) {
      snake.setDirection(0, -1); // Up
    }
  }
  
  // Prevent default behavior to avoid unwanted scrolling
  return false;
}