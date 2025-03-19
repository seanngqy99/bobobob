// Game Configuration
const CONFIG = {
    DIFFICULTY: {
      easy: { starSpeed: 2, starSpawnRate: 1000, gameTime: 60 },
      medium: { starSpeed: 3, starSpawnRate: 750, gameTime: 45 },
      hard: { starSpeed: 4, starSpawnRate: 500, gameTime: 30 }
    },
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    STAR_SIZE: 40,
    CAPTURE_RADIUS: 50
  };
  
  // Star Class
  class Star {
    constructor(x, y, speed) {
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.radius = CONFIG.STAR_SIZE / 2;
    }
  
    update() {
      this.y += this.speed;
    }
  
    draw(ctx) {
      ctx.beginPath();
      ctx.fillStyle = 'yellow';
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Game State
  class GameState {
    constructor() {
      this.stars = [];
      this.score = 0;
      this.starsCollected = 0;
      this.timeRemaining = 0;
      this.isGameRunning = false;
      this.difficulty = 'easy';
      this.mode = 'timed';
    }
  
    reset() {
      this.stars = [];
      this.score = 0;
      this.starsCollected = 0;
      this.timeRemaining = CONFIG.DIFFICULTY[this.difficulty].gameTime;
      this.isGameRunning = false;
    }
  }
  
  // Game Controller
  class StarCatcherGame {
    constructor() {
      // DOM Elements
      this.videoElement = document.getElementById('videoElement');
      this.gameCanvas = document.getElementById('gameCanvas');
      this.outputCanvas = document.getElementById('outputCanvas');
      this.statusText = document.getElementById('statusText');
      this.startButton = document.getElementById('startButton');
      this.playAgainButton = document.getElementById('playAgainButton');
  
      // Canvas Setup
      this.gameCtx = this.gameCanvas.getContext('2d');
      this.outputCtx = this.outputCanvas.getContext('2d');
  
      // Game State
      this.state = new GameState();
  
      // Bind methods to maintain context
      this.setupEventListeners = this.setupEventListeners.bind(this);
      this.initializeCamera = this.initializeCamera.bind(this);
      this.setupMediaPipe = this.setupMediaPipe.bind(this);
      this.onPoseResults = this.onPoseResults.bind(this);
      this.startGame = this.startGame.bind(this);
  
      // Initialize
      this.setupEventListeners();
      this.initializeCamera();
    }
  
    setupEventListeners() {
      // Difficulty and mode selection
      const difficultySelects = document.querySelectorAll('input[name="difficulty"]');
      const modeSelects = document.querySelectorAll('input[name="mode"]');
  
      difficultySelects.forEach(select => {
        select.addEventListener('change', (e) => {
          this.state.difficulty = e.target.value;
        });
      });
  
      modeSelects.forEach(select => {
        select.addEventListener('change', (e) => {
          this.state.mode = e.target.value;
        });
      });
  
      // Start and Play Again buttons
      if (this.startButton) {
        this.startButton.addEventListener('click', this.startGame);
      }
  
      if (this.playAgainButton) {
        this.playAgainButton.addEventListener('click', this.resetGame.bind(this));
      }
    }
  
    async initializeCamera() {
      try {
        // Update status
        if (this.statusText) {
          this.statusText.textContent = 'Requesting camera access...';
        }
  
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: CONFIG.CANVAS_WIDTH },
            height: { ideal: CONFIG.CANVAS_HEIGHT }
          } 
        });
  
        // Set video source
        this.videoElement.srcObject = stream;
  
        // Wait for video to be ready
        await new Promise((resolve) => {
          this.videoElement.onloadedmetadata = () => {
            this.videoElement.play();
            resolve();
          };
        });
  
        // Setup canvas dimensions
        this.gameCanvas.width = CONFIG.CANVAS_WIDTH;
        this.gameCanvas.height = CONFIG.CANVAS_HEIGHT;
        this.outputCanvas.width = CONFIG.CANVAS_WIDTH;
        this.outputCanvas.height = CONFIG.CANVAS_HEIGHT;
  
        // Setup MediaPipe
        this.setupMediaPipe();
  
        // Update status
        if (this.statusText) {
          this.statusText.textContent = 'Camera ready. Press Start to begin!';
        }
      } catch (error) {
        console.error('Camera initialization error:', error);
        
        // Update status text with error
        if (this.statusText) {
          this.statusText.textContent = `Camera error: ${error.message}. Please check camera permissions.`;
        }
      }
    }
  
    setupMediaPipe() {
      // Ensure MediaPipe Pose is available
      if (!window.Pose) {
        console.error('MediaPipe Pose not loaded');
        return;
      }
  
      // Create Pose detector
      this.pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });
  
      // Configure pose detection
      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
  
      // Set up results handler
      this.pose.onResults(this.onPoseResults);
  
      // Create camera
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          await this.pose.send({image: this.videoElement});
        },
        width: CONFIG.CANVAS_WIDTH,
        height: CONFIG.CANVAS_HEIGHT
      });
    }
  
    onPoseResults(results) {
      // Clear previous drawings
      this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
      this.outputCtx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
  
      // Draw stars
      if (this.state.isGameRunning) {
        this.state.stars.forEach(star => {
            star.update();
            star.draw(this.gameCtx);
          });
    
          // Check star collection if game is running and pose landmarks are detected
          if (results.poseLandmarks) {
            // Get wrist positions (proxy for hand/palm)
            const leftWrist = results.poseLandmarks[15];
            const rightWrist = results.poseLandmarks[16];
    
            // Check star collection
            this.checkStarCollection(leftWrist, rightWrist);
    
            // Remove stars that go off screen
            this.state.stars = this.state.stars.filter(star => star.y < this.gameCanvas.height);
          }
        }
      }
    
      checkStarCollection(leftWrist, rightWrist) {
        if (!leftWrist || !rightWrist) return;
    
        // Convert normalized coordinates to canvas coordinates
        const leftHandX = leftWrist.x * this.gameCanvas.width;
        const leftHandY = leftWrist.y * this.gameCanvas.height;
        const rightHandX = rightWrist.x * this.gameCanvas.width;
        const rightHandY = rightWrist.y * this.gameCanvas.height;
    
        // Check collision with stars
        this.state.stars = this.state.stars.filter(star => {
          const distanceLeft = Math.hypot(star.x - leftHandX, star.y - leftHandY);
          const distanceRight = Math.hypot(star.x - rightHandX, star.y - rightHandY);
    
          if (distanceLeft < CONFIG.CAPTURE_RADIUS || distanceRight < CONFIG.CAPTURE_RADIUS) {
            this.collectStar();
            return false; // Remove this star
          }
          return true;
        });
      }
    
      collectStar() {
        this.state.starsCollected++;
        this.state.score += 10;
        this.updateMetrics();
      }
    
      startGame() {
        // Reset game state
        this.state.reset();
    
        // Get selected difficulty and mode
        const difficultySelect = document.querySelector('input[name="difficulty"]:checked');
        const modeSelect = document.querySelector('input[name="mode"]:checked');
    
        if (difficultySelect) this.state.difficulty = difficultySelect.value;
        if (modeSelect) this.state.mode = modeSelect.value;
        
        const config = CONFIG.DIFFICULTY[this.state.difficulty];
        this.state.timeRemaining = config.gameTime;
        this.state.isGameRunning = true;
    
        // Start camera
        this.camera.start();
    
        // Start countdown
        this.startCountdown();
    
        // Start star spawner and timer
        this.startStarSpawner(config);
        this.startTimer();
    
        // Disable start button
        if (this.startButton) this.startButton.disabled = true;
      }
    
      startCountdown() {
        const overlay = document.getElementById('countdownOverlay');
        if (overlay) {
          overlay.style.display = 'flex';
          overlay.textContent = '3';
          let count = 3;
          
          const countdownInterval = setInterval(() => {
            if (overlay) {
              overlay.textContent = count;
              count--;
    
              if (count < 0) {
                clearInterval(countdownInterval);
                overlay.style.display = 'none';
              }
            }
          }, 1000);
        }
      }
    
      startStarSpawner(config) {
        this.starSpawner = setInterval(() => {
          if (!this.state.isGameRunning) return;
    
          const x = Math.random() * (this.gameCanvas.width - CONFIG.STAR_SIZE);
          const star = new Star(x, -CONFIG.STAR_SIZE, config.starSpeed);
          this.state.stars.push(star);
        }, config.starSpawnRate);
      }
    
      startTimer() {
        this.timer = setInterval(() => {
          if (!this.state.isGameRunning) return;
    
          this.state.timeRemaining--;
          this.updateMetrics();
    
          if (this.state.timeRemaining <= 0 || 
              (this.state.mode === 'target' && this.state.starsCollected >= 30)) {
            this.endGame();
          }
        }, 1000);
      }
    
      updateMetrics() {
        const starsCollectedEl = document.getElementById('starsCollected');
        const timeRemainingEl = document.getElementById('timeRemaining');
        const scoreDisplayEl = document.getElementById('scoreDisplay');
    
        if (starsCollectedEl) starsCollectedEl.textContent = this.state.starsCollected;
        if (timeRemainingEl) timeRemainingEl.textContent = `${this.state.timeRemaining}s`;
        if (scoreDisplayEl) scoreDisplayEl.textContent = this.state.score;
      }
    
      endGame() {
        this.state.isGameRunning = false;
        clearInterval(this.starSpawner);
        clearInterval(this.timer);
        
        // Stop camera
        if (this.camera) this.camera.stop();
    
        // Show game over overlay
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        const finalScoreEl = document.getElementById('finalScore');
        const finalStarsEl = document.getElementById('finalStars');
        const startButton = document.getElementById('startButton');
    
        if (gameOverOverlay) gameOverOverlay.style.display = 'block';
        if (finalScoreEl) finalScoreEl.textContent = this.state.score;
        if (finalStarsEl) finalStarsEl.textContent = this.state.starsCollected;
        if (startButton) startButton.disabled = false;
      }
    
      resetGame() {
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        const starsCollectedEl = document.getElementById('starsCollected');
        const timeRemainingEl = document.getElementById('timeRemaining');
        const scoreDisplayEl = document.getElementById('scoreDisplay');
    
        if (gameOverOverlay) gameOverOverlay.style.display = 'none';
        
        // Reset game state
        this.state.reset();
        this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        // Reset display metrics
        if (starsCollectedEl) starsCollectedEl.textContent = '0';
        if (timeRemainingEl) timeRemainingEl.textContent = '60s';
        if (scoreDisplayEl) scoreDisplayEl.textContent = '0';
    
        // Reinitialize camera
        this.initializeCamera();
      }
    }
    
    // Initialize the game when the page loads
    document.addEventListener('DOMContentLoaded', () => {
      try {
        new StarCatcherGame();
      } catch (error) {
        console.error('Error initializing Star Catcher Game:', error);
        const statusText = document.getElementById('statusText');
        if (statusText) {
          statusText.textContent = 'Game initialization failed. Please check console for details.';
        }
      }
    });