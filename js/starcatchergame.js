// Star Catcher Game
// A game where players catch stars by closing their hand on them
// Uses MediaPipe Hands for hand tracking

// Global variables
let video;
let canvas;
let ctx;
let detector;
let hands = [];

// Game variables
let gameActive = false;
let gameLevel = "medium"; // "easy", "medium", "hard"
let score = 0;
let gameStartTime;
let gameDuration = 60; // 60 seconds game
let timeRemaining = gameDuration;
let gameInterval;

// Star variables
let stars = [];
const starEmoji = "⭐";
let starSpawnRate = 2000; // milliseconds between star spawns
let starLifetime = 5000; // how long a star stays on screen
let starSize = 40; // size of the star
let starSpawnInterval;

// Hand state tracking
let handStates = {
  left: 'unknown',
  right: 'unknown'
};
let lastHandStates = {
  left: 'unknown',
  right: 'unknown'
};
let consecutiveFrames = {
  left: 0,
  right: 0
};
const requiredConsecutiveFrames = 3; // frames needed to confirm state change

// UI Elements
let scoreDisplay;
let timeDisplay;
let startButton;
let levelSelect;
let statusDisplay;

// =============================
// Initialize the game
// =============================
async function initializeGame() {
  // Get UI elements
  scoreDisplay = document.getElementById('scoreDisplay');
  timeDisplay = document.getElementById('timeDisplay');
  startButton = document.getElementById('startGame');
  levelSelect = document.getElementById('levelSelect');
  statusDisplay = document.getElementById('gameStatus');
  
  // Disable start button until model is loaded
  if (startButton) startButton.disabled = true;
  
  // Add event listeners
  if (startButton) startButton.addEventListener('click', startGame);
  if (levelSelect) {
    levelSelect.addEventListener('change', (e) => {
      gameLevel = e.target.value;
      updateDifficultySettings();
      updateStatus(`Difficulty set to ${gameLevel}`);
    });
  }
  
  // Create canvas for rendering
  const gameContainer = document.getElementById('gameContainer');
  canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  gameContainer.appendChild(canvas);
  
  ctx = canvas.getContext('2d');
  
  // Create video element
  video = document.createElement('video');
  video.width = canvas.width;
  video.height = canvas.height;
  video.autoplay = true;
  video.style.display = 'none'; // Hide the video element
  document.body.appendChild(video);
  
  try {
    // Access webcam
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    
    // Update status
    updateStatus('Loading hand tracking model...');
    
    // Initialize score display
    updateScoreDisplay();
    
    // Show loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    // Wait for video to be ready
    video.onloadedmetadata = async () => {
      try {
        // Initialize detector with proper settings
        await initializeDetector();
        
        // Enable start button once model is loaded
        if (startButton) startButton.disabled = false;
        updateStatus('Ready! Select difficulty and press Start to begin.');
        
        // Hide loading overlay
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        
        // Start the detection loop
        detectHands();
        
      } catch (err) {
        console.error("Error initializing hand detector:", err);
        updateStatus('Error loading hand detector. Please refresh.');
        
        // Update loading overlay to show error
        if (loadingOverlay) {
          loadingOverlay.innerHTML = '<p>Error loading model. Please refresh the page.</p>';
        }
      }
    };
    
  } catch (err) {
    console.error("Error accessing webcam:", err);
    updateStatus('Error accessing webcam. Please check permissions.');
  }
}

// Initialize MediaPipe Hands detector
async function initializeDetector() {
  // Load MediaPipe Hands model
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
    maxHands: 2 // Track both hands
  };
  
  console.log("Initializing detector for both hands");
  detector = await handPoseDetection.createDetector(model, detectorConfig);
}

// =============================
// Game Mechanics
// =============================
function startGame() {
  if (gameActive) return;
  
  // Reset game state
  gameActive = true;
  score = 0;
  stars = [];
  timeRemaining = gameDuration;
  
  // Update difficulty settings
  updateDifficultySettings();
  
  // Start game timer
  gameStartTime = Date.now();
  gameInterval = setInterval(updateGameTimer, 1000);
  
  // Start spawning stars
  starSpawnInterval = setInterval(spawnStar, starSpawnRate);
  
  // Update UI
  updateScoreDisplay();
  updateStatus(`Game started! Catch stars by closing your hand on them!`);
  if (startButton) startButton.disabled = true;
  if (levelSelect) levelSelect.disabled = true;
}

function endGame() {
  gameActive = false;
  
  // Stop timers
  clearInterval(gameInterval);
  clearInterval(starSpawnInterval);
  
  // Show game over message
  updateStatus(`Game Over! Final Score: ${score}. Press Start to play again.`);
  
  // Enable buttons
  if (startButton) startButton.disabled = false;
  if (levelSelect) levelSelect.disabled = false;
  
  // Play game over sound
  playGameOverSound();
}

function updateDifficultySettings() {
  // Adjust game difficulty based on selected level
  switch(gameLevel) {
    case "easy":
      starSpawnRate = 3000; // slower spawn
      starLifetime = 7000;  // stars last longer
      starSize = 50;        // larger stars
      break;
    case "medium":
      starSpawnRate = 2000; // default spawn rate
      starLifetime = 5000;  // default lifetime
      starSize = 40;        // default size
      break;
    case "hard":
      starSpawnRate = 1000; // faster spawn
      starLifetime = 3000;  // stars disappear faster
      starSize = 30;        // smaller stars
      break;
  }
  
  // If game is running, clear and restart the spawn interval
  if (gameActive && starSpawnInterval) {
    clearInterval(starSpawnInterval);
    starSpawnInterval = setInterval(spawnStar, starSpawnRate);
  }
}

function updateGameTimer() {
  timeRemaining--;
  
  if (timeDisplay) {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timeDisplay.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // End game when time runs out
  if (timeRemaining <= 0) {
    endGame();
  }
}

// =============================
// Star Management
// =============================
function spawnStar() {
  if (!gameActive) return;
  
  // Create a new star with random position
  const newStar = {
    x: Math.random() * (canvas.width - starSize * 2) + starSize,
    y: Math.random() * (canvas.height - starSize * 2) + starSize,
    createdAt: Date.now(),
    caught: false,
    scale: 0,  // for animation
    opacity: 0 // for animation
  };
  
  stars.push(newStar);
  
  // Play spawn sound
  playStarSpawnSound();
}

function updateStars() {
  const currentTime = Date.now();
  
  // Update existing stars
  stars = stars.filter(star => {
    // Remove stars that have been caught or expired
    const age = currentTime - star.createdAt;
    const expired = age > starLifetime;
    
    if (expired && !star.caught) {
      // Add disappearing animation
      star.scale = Math.max(0, star.scale - 0.1);
      star.opacity = Math.max(0, star.opacity - 0.1);
      
      // Remove when animation completes
      return star.scale > 0;
    }
    
    // Animate appearance
    if (star.scale < 1 && !star.caught) {
      star.scale = Math.min(1, star.scale + 0.1);
      star.opacity = Math.min(1, star.opacity + 0.1);
    }
    
    return !star.caught && !expired;
  });
}

function drawStars() {
  stars.forEach(star => {
    ctx.save();
    ctx.globalAlpha = star.opacity;
    ctx.font = `${starSize * star.scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw star with pulsing effect
    const pulseFactor = 1 + 0.1 * Math.sin(Date.now() / 200);
    ctx.font = `${starSize * star.scale * pulseFactor}px Arial`;
    
    // Show remaining time on star as a circular progress
    const age = Date.now() - star.createdAt;
    const remainingTime = 1 - (age / starLifetime);
    
    // Draw background circle
    ctx.beginPath();
    ctx.arc(star.x, star.y, (starSize / 1.6) * star.scale, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * star.opacity})`;
    ctx.fill();
    
    // Draw progress circle
    ctx.beginPath();
    ctx.arc(star.x, star.y, (starSize / 1.6) * star.scale, -Math.PI/2, -Math.PI/2 + (remainingTime * 2 * Math.PI));
    ctx.lineWidth = 3 * star.scale;
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 * star.opacity})`;
    ctx.stroke();
    
    // Draw star emoji
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fillText(starEmoji, star.x, star.y);
    
    ctx.restore();
  });
}

// =============================
// Hand Detection and Processing
// =============================
async function detectHands() {
  async function render() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw mirrored video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    
    try {
      if (detector) {
        // Estimate hands with MediaPipe
        const estimationConfig = {
          flipHorizontal: true,
          staticImageMode: false
        };
        
        hands = await detector.estimateHands(video, estimationConfig);
        
        // Process hand states
        processHandStates();
        
        // Draw hands
        drawHands();
        
        // Update and draw stars
        if (gameActive) {
          updateStars();
          drawStars();
          
          // Check for star catches
          checkStarCatches();
        }
        
        // Draw game status
        drawGameStatus();
      }
    } catch (err) {
      console.error("Error detecting hands:", err);
    }
    
    requestAnimationFrame(render);
  }
  
  render();
}

function processHandStates() {
  // Reset states if no hands detected
  if (hands.length === 0) {
    handStates.left = 'unknown';
    handStates.right = 'unknown';
    consecutiveFrames.left = 0;
    consecutiveFrames.right = 0;
    return;
  }
  
  // Process each detected hand
  hands.forEach(hand => {
    const handedness = hand.handedness.toLowerCase();
    
    // Only process left or right hands
    if (handedness !== 'left' && handedness !== 'right') return;
    
    // Get hand state
    const state = determineHandState(hand);
    
    // Update consecutive frames for this hand
    if (state === handStates[handedness]) {
      consecutiveFrames[handedness]++;
    } else {
      handStates[handedness] = state;
      consecutiveFrames[handedness] = 1;
    }
    
    // If we have enough consecutive frames, confirm state change
    if (consecutiveFrames[handedness] >= requiredConsecutiveFrames) {
      if (handStates[handedness] !== lastHandStates[handedness]) {
        // Handle state change
        onHandStateChange(handedness, handStates[handedness]);
        lastHandStates[handedness] = handStates[handedness];
      }
    }
  });
}

function determineHandState(hand) {
  // Get keypoints
  const thumbTip = hand.keypoints[4]; // Thumb tip
  const indexTip = hand.keypoints[8]; // Index fingertip
  const middleTip = hand.keypoints[12]; // Middle fingertip
  const ringTip = hand.keypoints[16]; // Ring fingertip
  const pinkyTip = hand.keypoints[20]; // Pinky fingertip
  
  // Get palm center (average of metacarpal joints)
  const indexBase = hand.keypoints[5]; // Index metacarpal
  const middleBase = hand.keypoints[9]; // Middle metacarpal
  const ringBase = hand.keypoints[13]; // Ring metacarpal
  const pinkyBase = hand.keypoints[17]; // Pinky metacarpal
  
  if (!indexBase || !middleBase || !ringBase || !pinkyBase || 
      !thumbTip || !indexTip || !middleTip || !ringTip || !pinkyTip) {
    return 'unknown';
  }
  
  // Calculate palm center
  const palmCenter = {
    x: (indexBase.x + middleBase.x + ringBase.x + pinkyBase.x) / 4,
    y: (indexBase.y + middleBase.y + ringBase.y + pinkyBase.y) / 4
  };
  
  // Calculate distances from fingertips to palm center
  const distances = [
    { finger: 'thumb', distance: calculateDistance(thumbTip, palmCenter) },
    { finger: 'index', distance: calculateDistance(indexTip, palmCenter) },
    { finger: 'middle', distance: calculateDistance(middleTip, palmCenter) },
    { finger: 'ring', distance: calculateDistance(ringTip, palmCenter) },
    { finger: 'pinky', distance: calculateDistance(pinkyTip, palmCenter) }
  ];
  
  // Calculate hand width for normalization
  const handWidth = calculateDistance(indexBase, pinkyBase);
  
  // Normalize distances by hand width
  distances.forEach(item => {
    item.ratio = item.distance / handWidth;
  });
  
  // Calculate average ratio
  const avgRatio = distances.reduce((sum, item) => sum + item.ratio, 0) / distances.length;
  
  // Determine hand state based on average ratio
  if (avgRatio > 1.2) {
    return 'open';
  } else if (avgRatio < 0.8) {
    return 'closed';
  } else {
    return 'unknown';
  }
}

function onHandStateChange(handedness, newState) {
  // We only care about state changes during active game
  if (!gameActive) return;
  
  // Debug log
  console.log(`${handedness} hand state changed to ${newState}`);
  
  // We check for star catches in the main game loop
}

function checkStarCatches() {
  // Process each hand
  hands.forEach(hand => {
    const handedness = hand.handedness.toLowerCase();
    
    // Only process if hand is closed
    if (handStates[handedness] !== 'closed') return;
    
    // Get index fingertip as reference point
    const indexTip = hand.keypoints[8];
    if (!indexTip) return;
    
    // Adjust hand position for star detection
    const handPos = {
      x: indexTip.x, 
      y: indexTip.y
    };
    
    // Check if hand is touching any stars
    stars.forEach(star => {
      // Skip already caught stars
      if (star.caught) return;
      
      // Calculate distance between hand and star
      const distance = calculateDistance(handPos, star);
      
      // If hand is close enough to star and hand is closed, catch it
      if (distance < starSize * 1.2) {
        catchStar(star);
      }
    });
  });
}

function catchStar(star) {
  // Mark star as caught
  star.caught = true;
  
  // Increment score
  score++;
  updateScoreDisplay();
  
  // Play catch sound
  playCatchSound();
  
  // Create visual feedback
  createCatchFeedback(star.x, star.y);
}

function createCatchFeedback(x, y) {
  // Create particle effect at catch location
  const particleCount = 10;
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const speed = 2 + Math.random() * 2;
    
    const particle = {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30,
      size: 10 + Math.random() * 10,
      color: `hsl(${50 + Math.random() * 10}, 100%, 50%)`
    };
    
    // Add particle effect
    const drawParticle = () => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.size *= 0.95;
      
      if (particle.life > 0) {
        // Draw particle
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Continue animation
        requestAnimationFrame(drawParticle);
      }
    };
    
    // Start particle animation
    drawParticle();
  }
}

// =============================
// Drawing Functions
// =============================
function drawHands() {
  hands.forEach(hand => {
    const handedness = hand.handedness.toLowerCase();
    const color = handedness === 'left' ? 'rgba(255, 165, 0, 0.7)' : 'rgba(0, 191, 255, 0.7)';
    const state = handStates[handedness];
    
    // Draw connections between keypoints
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    // Draw palm connections
    const palmIndices = [0, 1, 2, 5, 9, 13, 17, 0];
    for (let i = 0; i < palmIndices.length - 1; i++) {
      const start = hand.keypoints[palmIndices[i]];
      const end = hand.keypoints[palmIndices[i + 1]];
      
      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    }
    
    // Draw finger connections
    const fingerIndices = [
      [1, 2, 3, 4],        // Thumb
      [5, 6, 7, 8],        // Index
      [9, 10, 11, 12],     // Middle
      [13, 14, 15, 16],    // Ring
      [17, 18, 19, 20]     // Pinky
    ];
    
    fingerIndices.forEach(finger => {
      for (let i = 0; i < finger.length - 1; i++) {
        const start = hand.keypoints[finger[i]];
        const end = hand.keypoints[finger[i + 1]];
        
        if (start && end) {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      }
    });
    
    // Draw keypoints
    hand.keypoints.forEach((keypoint, index) => {
      // Determine if it's a fingertip (indices 4, 8, 12, 16, 20)
      const isFingertip = [4, 8, 12, 16, 20].includes(index);
      
      ctx.fillStyle = isFingertip ? 'white' : color;
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, isFingertip ? 6 : 3, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Show hand state indicator
    const wrist = hand.keypoints[0];
    if (wrist) {
      // Draw a small label
      ctx.fillStyle = state === 'open' ? '#4CAF50' : state === 'closed' ? '#FF5722' : '#FFFFFF';
      ctx.beginPath();
      ctx.arc(wrist.x, wrist.y - 20, 10, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add text label
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${handedness.toUpperCase()} ${state.toUpperCase()}`, 
        wrist.x, 
        wrist.y - 35
      );
    }
  });
}

function drawGameStatus() {
  if (!gameActive) {
    // Show "Press Start" message if game is not active
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 40, 400, 80);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Star Catcher Game`,
      canvas.width / 2,
      canvas.height / 2 - 10
    );
    
    ctx.font = '18px Arial';
    ctx.fillText(
      `Select difficulty and press Start to play`,
      canvas.width / 2,
      canvas.height / 2 + 20
    );
    
    return;
  }
  
  // Draw score and time in top corners
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(10, 10, 120, 40);
  ctx.fillRect(canvas.width - 130, 10, 120, 40);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 20, 35);
  
  ctx.textAlign = 'right';
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width - 20, 35);
  
  // Draw level indicator
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(canvas.width / 2 - 50, 10, 100, 30);
  
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${gameLevel.toUpperCase()}`, canvas.width / 2, 30);
  
  // Draw instructions at the bottom
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(canvas.width / 2 - 200, canvas.height - 40, 400, 30);
  
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Close your hand on stars to catch them!`, canvas.width / 2, canvas.height - 20);
}

// =============================
// UI Update Functions
// =============================
function updateScoreDisplay() {
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${score}`;
  }
}

function updateStatus(message) {
  if (statusDisplay) {
    statusDisplay.textContent = message;
  }
  
  console.log(`Status: ${message}`);
}

// =============================
// Sound Effects
// =============================
function playCatchSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 880; // A5 note
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    
    // Pitch up for success sound
    oscillator.frequency.exponentialRampToValueAtTime(
      1760, audioCtx.currentTime + 0.2
    );
    
    setTimeout(() => {
      oscillator.stop();
    }, 200);
  } catch (e) {
    console.log("Audio not supported or blocked");
  }
}

function playStarSpawnSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 660; // E5 note
    gainNode.gain.value = 0.05;
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, 80);
  } catch (e) {
    console.log("Audio not supported or blocked");
  }
}

function playGameOverSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create multiple oscillators for a chord
    const frequencies = [440, 554.37, 659.25]; // A4, C#5, E5 (A major chord)
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.value = 0.1;
      
      // Stagger start times slightly
      setTimeout(() => {
        oscillator.start();
        // Fade out
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
        setTimeout(() => oscillator.stop(), 1500);
      }, index * 100);
    });
  } catch (e) {
    console.log("Audio not supported or blocked");
  }
}

// =============================
// Utility Functions
// =============================
function calculateDistance(point1, point2) {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

function endGame() {
  gameActive = false;
  
  // Stop timers
  clearInterval(gameInterval);
  clearInterval(starSpawnInterval);
  
  // Show game over message
  updateStatus(`Game Over! Final Score: ${score}. Press Start to play again.`);
  
  // Enable buttons
  if (startButton) startButton.disabled = false;
  if (stopButton) stopButton.disabled = true;
  if (levelSelect) levelSelect.disabled = false;
  
  // Play game over sound
  playGameOverSound();
}

// =============================
// Initialize on Page Load
// =============================
window.onload = function() {
  // Initialize the game
  initializeGame();
};