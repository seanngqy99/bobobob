// DOM Elements
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startGameBtn = document.getElementById('startGameBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const skipBtn = document.getElementById('skipBtn');
const gameStatus = document.querySelector('.game-status');
const instruction = document.querySelector('.instruction');
const poseImage = document.getElementById('poseImage');
const feedback = document.querySelector('.feedback');
const scoreValue = document.getElementById('scoreValue');
const finalScore = document.getElementById('finalScore');
const timerBar = document.getElementById('timerBar');
const INHIBITION_REWARD_DELAY = 5000; // 5 seconds of correct inhibition needed

// Game state
let isGameActive = false;
let currentPose = null;
let score = 0;
let skipsRemaining = 3;
let poseTimer = null;
let countdownTimer = null;
let poseStartTime = 0;
let heroSays = false;
let correctInhibitionStartTime = null;

// Pose detection state
let poses = [];

// Predefined poses
const availablePoses = [
  { 
    id: 'hands_up', 
    name: 'Hands Up', 
    description: 'Raise both hands above your head',
    imageUrl: '../images/herosays/herohandsup.png',
    check: (landmarks) => {
      if (!landmarks) return false;
      
      // Check if both wrists are above the head
      const nose = landmarks[0];
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      
      return leftWrist.y < nose.y && rightWrist.y < nose.y;
    }
  },
  { 
    id: 'hands_on_shoulders', 
    name: 'Hands on Shoulders', 
    description: 'Touch both shoulders with your hands',
    imageUrl: '../images/herosays/herohandschest.png',
    check: (landmarks) => {
      if (!landmarks) return false;
      
      // Check if hands are close to shoulders
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      
      // Calculate distance between wrist and shoulder
      const leftDist = Math.sqrt(
        Math.pow(leftWrist.x - leftShoulder.x, 2) + 
        Math.pow(leftWrist.y - leftShoulder.y, 2)
      );
      
      const rightDist = Math.sqrt(
        Math.pow(rightWrist.x - rightShoulder.x, 2) + 
        Math.pow(rightWrist.y - rightShoulder.y, 2)
      );
      
      // Check if both hands are close to shoulders (threshold of 0.15 for more leniency)
      return leftDist < 0.15 && rightDist < 0.15;
    }
  },
  { 
    id: 'left_hand_up', 
    name: 'Left Hand Up', 
    description: 'Raise only your left hand',
    imageUrl: '../images/herosays/heroraiseleft.png',
    check: (landmarks) => {
      if (!landmarks) return false;
      
      // Check if left wrist is above the head and right wrist is below shoulder
      const nose = landmarks[0];
      const rightShoulder = landmarks[12];
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      
      return leftWrist.y < nose.y && rightWrist.y > rightShoulder.y;
    }
  },
  { 
    id: 'right_hand_up', 
    name: 'Right Hand Up', 
    description: 'Raise only your right hand',
    imageUrl: '../images/herosays/heroraiseright.png',
    check: (landmarks) => {
      if (!landmarks) return false;
      
      // Check if right wrist is above the head and left wrist is below shoulder
      const nose = landmarks[0];
      const leftShoulder = landmarks[11];
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      
      return rightWrist.y < nose.y && leftWrist.y > leftShoulder.y;
    }
  },
  { 
    id: 'touch_head', 
    name: 'Touch Head', 
    description: 'Touch your head with both hands',
    imageUrl: '../images/herosays/herotohead.png',
    check: (landmarks) => {
      if (!landmarks) return false;
      
      // Check if both hands are close to the head
      const nose = landmarks[0];
      const leftEye = landmarks[2];
      const rightEye = landmarks[5];
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      
      // Calculate the head area
      const headCenterX = (leftEye.x + rightEye.x) / 2;
      const headCenterY = nose.y;
      
      // Distance from wrists to head center
      const leftDist = Math.sqrt(
        Math.pow(leftWrist.x - headCenterX, 2) + 
        Math.pow(leftWrist.y - headCenterY, 2)
      );
      
      const rightDist = Math.sqrt(
        Math.pow(rightWrist.x - headCenterX, 2) + 
        Math.pow(rightWrist.y - headCenterY, 2)
      );
      
      // Check if both hands are close to head (threshold of 0.2 for more leniency)
      return leftDist < 0.2 && rightDist < 0.2;
    }
  },
  { 
    id: 'hands_on_hips', 
    name: 'Hands on Hips', 
    description: 'Place your hands on your hips',
    imageUrl: '../images/herosays/herotohip.png',
    check: (landmarks) => {
      if (!landmarks) return false;
      
      // Check if hands are close to hips
      const leftHip = landmarks[23];
      const rightHip = landmarks[24];
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      
      // Calculate distance between wrists and hips
      const leftDist = Math.sqrt(
        Math.pow(leftWrist.x - leftHip.x, 2) + 
        Math.pow(leftWrist.y - leftHip.y, 2)
      );
      
      const rightDist = Math.sqrt(
        Math.pow(rightWrist.x - rightHip.x, 2) + 
        Math.pow(rightWrist.y - rightHip.y, 2)
      );
      
      // Check if both hands are close to hips (threshold of 0.15 for more leniency)
      return leftDist < 0.15 && rightDist < 0.15;
    }
  },
  { 
    id: 'arms_crossed', 
    name: 'Arms Crossed', 
    description: 'Cross your arms over your chest',
    imageUrl: '../images/herosays/heroarmcross.png',
    check: (landmarks) => {
      if (!landmarks) return false;
      
      // Check if wrists are crossed in front of the chest
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      
      // Calculate the chest center point
      const chestX = (leftShoulder.x + rightShoulder.x) / 2;
      const chestY = (leftShoulder.y + rightShoulder.y) / 2;
      
      // Check if wrists are in the chest area
      const leftWristInChestArea = 
        Math.abs(leftWrist.x - chestX) < 0.25 && 
        Math.abs(leftWrist.y - chestY) < 0.25;
      
      const rightWristInChestArea = 
        Math.abs(rightWrist.x - chestX) < 0.25 && 
        Math.abs(rightWrist.y - chestY) < 0.25;
      
      // Check if wrists are crossed (left wrist is on the right side and vice versa)
      const wristsCrossed = 
        (leftWrist.x > chestX && rightWrist.x < chestX) || 
        (leftWrist.x < chestX && rightWrist.x > chestX);
      
      return leftWristInChestArea && rightWristInChestArea && wristsCrossed;
    }
  }
];

// Start button event listener
startGameBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', restartGame);
skipBtn.addEventListener('click', skipPose);

// Initialize game
function startGame() {
  startOverlay.style.display = 'none';
  isGameActive = true;
  score = 0;
  skipsRemaining = 3;
  updateScore();
  skipBtn.disabled = false;
  skipBtn.textContent = `Skip (${skipsRemaining} remaining)`;
  
  // Start the first pose after a countdown
  showCountdown(3, () => {
    selectRandomPose();
  });
  
  // Hide the timer bar since we're not using timers for rehabilitation patients
  if (timerBar) {
    timerBar.style.display = 'none';
  }
}

function restartGame() {
  gameOverOverlay.style.display = 'none';
  startGame();
}

function gameOver() {
  isGameActive = false;
  clearTimeout(poseTimer);
  finalScore.textContent = score;
  gameOverOverlay.style.display = 'flex';
}

function skipPose() {
  if (skipsRemaining <= 0) return;
  
  skipsRemaining--;
  skipBtn.textContent = `Skip (${skipsRemaining} remaining)`;
  if (skipsRemaining <= 0) {
    skipBtn.disabled = true;
  }
  
  clearTimeout(poseTimer);
  feedback.textContent = 'Pose skipped!';
  feedback.className = 'feedback';
  
  // Move to next pose
  setTimeout(() => {
    selectRandomPose();
  }, 1000);
}

function showCountdown(seconds, callback) {
  gameStatus.textContent = `Starting in...`;
  instruction.textContent = seconds;
  poseImage.style.display = 'none';
  
  if (seconds <= 0) {
    gameStatus.textContent = 'Go!';
    instruction.textContent = '';
    callback();
    return;
  }
  
  setTimeout(() => {
    showCountdown(seconds - 1, callback);
  }, 1000);
}

function selectRandomPose() {
  // Randomly decide if "Hero says"
  heroSays = Math.random() > 0.3; // 70% chance of "Hero says"
  
  // Select a random pose
  const randomIndex = Math.floor(Math.random() * availablePoses.length);
  currentPose = availablePoses[randomIndex];
  
  // Display the instruction
  gameStatus.textContent = heroSays ? 'Hero says:' : 'Do NOT do this:';
  instruction.textContent = currentPose.description;
  
  // Show the pose image
  if (currentPose.imageUrl) {
    poseImage.src = currentPose.imageUrl;
    poseImage.alt = currentPose.name;
    poseImage.style.display = 'block';
  } else {
    poseImage.style.display = 'none';
  }
  
  feedback.textContent = '';
  feedback.className = 'feedback';
  
  // For rehabilitation, we don't set a timer
  // Instead, we continuously check for the pose and give positive feedback
  poseStartTime = Date.now();
}

function updateScore() {
  scoreValue.textContent = score;
}

function checkPose(landmarks) {
  if (!currentPose || !isGameActive) return;
  
  // Check if the current pose is being performed
  const isPoseCorrect = currentPose.check(landmarks);
  
  if (isPoseCorrect) {
    // Reset inhibition timer if they're moving
    correctInhibitionStartTime = null;
    
    // If Hero says and pose is done - correct
    if (heroSays) {
      if (!feedback.classList.contains('success')) {
        feedback.textContent = 'Great job! Take your time. When you\'re ready, click "Next Pose"';
        feedback.className = 'feedback success';
        score += 10;
        updateScore();
        showNextPoseButton();
      }
    } 
    // If not Hero says and pose is done - wrong!
    else {
      if (!feedback.classList.contains('failure')) {
        feedback.textContent = 'Hero didn\'t say to do that! Try to follow instructions carefully.';
        feedback.className = 'feedback failure';
        
        setTimeout(() => {
          feedback.textContent = 'Let\'s try another pose!';
          feedback.className = 'feedback';
          selectRandomPose();
        }, 3000);
      }
    }
  } 
  else {
    // Handle correct inhibition (not doing the pose when it's "Do NOT do")
    if (!heroSays) {
      if (correctInhibitionStartTime === null) {
        correctInhibitionStartTime = Date.now();
      } 
      else if (Date.now() - correctInhibitionStartTime > INHIBITION_REWARD_DELAY) {
        if (!feedback.classList.contains('success')) {
          feedback.textContent = 'Excellent ! Moving to next pose...';
          feedback.className = 'feedback success';
          score += 15; // Bonus points for inhibition
          updateScore();
          
          setTimeout(() => {
            selectRandomPose();
            feedback.textContent = '';
            feedback.className = 'feedback';
          }, 2000);
        }
      }
      else {
        // Show countdown to reward
        const remaining = Math.ceil((INHIBITION_REWARD_DELAY - (Date.now() - correctInhibitionStartTime))/1000);
        feedback.textContent = `Keep holding... ${remaining}s`;
        feedback.className = 'feedback';
      }
    }
    // Handle exiting a correct "Hero says" pose
    else if (feedback.classList.contains('success')) {
      feedback.textContent = 'Try to get back into the pose. Take your time.';
      feedback.className = 'feedback';
    }
  }
}

function showNextPoseButton() {
  // Create next pose button if it doesn't exist
  if (!document.getElementById('nextPoseBtn')) {
    const nextPoseBtn = document.createElement('button');
    nextPoseBtn.id = 'nextPoseBtn';
    nextPoseBtn.textContent = 'Next Pose';
    nextPoseBtn.className = 'next-pose-btn';
    nextPoseBtn.addEventListener('click', () => {
      // Remove the button
      nextPoseBtn.remove();
      // Go to next pose
      selectRandomPose();
    });
    
    // Add button near the feedback
    feedback.parentNode.insertBefore(nextPoseBtn, feedback.nextSibling);
  }
}

// Setup BlazePose
function setupPoseDetection() {
  const pose = new Pose({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
  });
  
  // Improve camera settings for better clarity
  pose.setOptions({
    modelComplexity: 2, // Use the highest model complexity for better accuracy
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });
  
  pose.onResults(onResults);
  
  // Increase camera resolution for better clarity
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({image: videoElement});
    },
    width: 1280, // Higher resolution
    height: 720,
    facingMode: 'user'
  });
  
  camera.start()
    .then(() => {
      console.log('Camera started successfully');
      // Set video element to high quality
      videoElement.setAttribute('playsinline', true);
      videoElement.setAttribute('width', '1280px');
      videoElement.setAttribute('height', '720px');
    })
    .catch(err => {
      console.error('Error starting camera:', err);
      gameStatus.textContent = 'Error accessing webcam. Please check camera permissions.';
    });
}

function onResults(results) {
  // Set canvas to match video dimensions for clearer image
  if (canvasElement.width !== results.image.width || 
      canvasElement.height !== results.image.height) {
    canvasElement.width = results.image.width;
    canvasElement.height = results.image.height;
  }
  
  // Draw the camera feed and pose landmarks
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Mirror the image
  canvasCtx.translate(canvasElement.width, 0);
  canvasCtx.scale(-1, 1);
  
  // Draw the mirrored image with improved quality
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  
  // Restore original context to draw landmarks correctly
  canvasCtx.restore();
  
  // Improve landmark visualization for better visibility
  if (results.poseLandmarks) {
    // Save the context again to apply mirroring to landmarks
    canvasCtx.save();
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    
    // Draw connections with higher visibility
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
      {color: 'rgba(0, 255, 0, 0.8)', lineWidth: 5});
    
    // Draw landmarks with higher visibility
    drawLandmarks(canvasCtx, results.poseLandmarks,
      {color: 'rgba(255, 0, 0, 0.8)', lineWidth: 2, radius: 8});
    
    canvasCtx.restore();
    
    // Check if the current pose is being performed
    // We don't need to mirror the landmarks for pose checking
    checkPose(results.poseLandmarks);
  }
}

// Add custom CSS for the Next Pose button
const style = document.createElement('style');
style.textContent = `
  .next-pose-btn {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 12px 25px;
    text-align: center;
    font-size: 18px;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 15px;
    margin-bottom: 15px;
    font-weight: bold;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s;
  }
  
  .next-pose-btn:hover {
    background-color: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  
  .feedback.success {
    color: #4CAF50;
    font-size: 22px;
  }
  
  .feedback.failure {
    color: #f44336;
    font-size: 22px;
  }
`;
document.head.appendChild(style);

// Initialize pose detection on page load
document.addEventListener('DOMContentLoaded', setupPoseDetection);