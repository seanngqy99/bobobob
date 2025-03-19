// Get parameters from sessionStorage
const storedReps = sessionStorage.getItem('exerciseReps');
const storedSets = sessionStorage.getItem('exerciseSets');

// Exercise state variables - initialize with default values, will update from sessionStorage if available
let targetReps = storedReps ? parseInt(storedReps) : 5; // Use stored reps, default to 5
let targetSets = storedSets ? parseInt(storedSets) : 3; // Use stored sets, default to 3
let currentSet = 1;
let repCount = 0;
let repStarted = false;

// For angle smoothing
let smoothedLeftAngle = 180;
let smoothedRightAngle = 180;
const smoothingFactor = 0.2;

// For tracking current rep range
let currentRepMin = 180;
let currentRepMax = 0;

// Track rep ranges for display
let repRanges = [];

// Flow control
let isAssessmentActive = false;
let isCountdownRunning = false;
let isResting = false;
let restTimeRemaining = 0;
let restInterval;
const countdownSeconds = 3;
let countdownCurrent = countdownSeconds;
let countdownInterval;
const restBetweenSets = 30; // 30 seconds rest between sets

// Angle thresholds for sit-to-stand rep counting
const SITTING_THRESHOLD = 110; // Angle below which we consider "sitting"
const STANDING_THRESHOLD = 160; // Angle above which we consider "standing"

// DOM element references
let videoElement, canvasElement, canvasCtx, repInputElem, setInputElem;
let startBtn, repCountText, statusText, repProgress;

// Initialize DOM references after the document has loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Session storage values on load:");
  console.log("Reps:", sessionStorage.getItem('exerciseReps'));
  console.log("Sets:", sessionStorage.getItem('exerciseSets'));

  // Get DOM elements
  videoElement = document.getElementsByClassName('input_video')[0];
  canvasElement = document.getElementsByClassName('output_canvas')[0];
  canvasCtx = canvasElement.getContext('2d');
  repInputElem = document.getElementById("repInput");
  setInputElem = document.getElementById("setInput");
  startBtn = document.getElementById("startBtn");
  repCountText = document.getElementById("repCountText");
  statusText = document.getElementById("statusText");
  repProgress = document.getElementById("repProgress");
  
  // Set canvas dimensions
  canvasElement.width = 800;
  canvasElement.height = 600;
  
  // Apply stored values from sessionStorage if available
  if (storedReps) {
    targetReps = parseInt(storedReps);
    console.log("Setting targetReps from sessionStorage:", targetReps);
    if (repInputElem) {
      repInputElem.value = targetReps;
    }
  }
  
  if (storedSets) {
    targetSets = parseInt(storedSets);
    console.log("Setting targetSets from sessionStorage:", targetSets);
    if (setInputElem) {
      setInputElem.value = targetSets;
    }
  }
  
  // Initialize exercise
  initExercise();
});

function initExercise() {
  // Initialize BlazePose
  const pose = new Pose({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
  });
  
  pose.setOptions({
    modelComplexity: 2, // Use highest complexity for better detection
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  pose.onResults(onResults);
  
  // Setup camera
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({image: videoElement});
    },
    width: 800,
    height: 600
  });
  
  camera.start()
    .then(() => {
      console.log('Camera started successfully (mirror video, normal text).');
      statusText.textContent = 'Camera ready. Press Start Exercise to begin.';
      // Initialize progress indicators
      initRepProgressIndicators();
    })
    .catch(err => {
      console.error('Error starting camera:', err);
      statusText.textContent = 'Error accessing webcam. Please check camera permissions.';
    });
  
  startBtn.addEventListener('click', onStart);
}

// ======== Angle Calculation Functions ========

// 2D angle calculation (original)
function calculate2DAngle(p1, p2, p3) {
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x)
                - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// 3D angle calculation using vectors and dot product
function calculate3DAngle(p1, p2, p3) {
  // Create 3D vectors
  const vector1 = {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z
  };
  
  const vector2 = {
    x: p3.x - p2.x,
    y: p3.y - p2.y,
    z: p3.z - p2.z
  };
  
  // Calculate dot product
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
  
  // Calculate magnitudes
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y + vector1.z * vector1.z);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y + vector2.z * vector2.z);
  
  // Avoid division by zero or numerical errors
  if (magnitude1 * magnitude2 < 0.0001) return 0;
  
  // Calculate angle in radians and convert to degrees
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  // Clamp cosAngle to [-1, 1] to avoid potential numerical errors
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));
  return Math.acos(clampedCosAngle) * (180 / Math.PI);
}

// Use this as the main angle calculation function
function calculateAngle(p1, p2, p3) {
  // Check if z coordinates are available and valid
  if (p1.z !== undefined && p2.z !== undefined && p3.z !== undefined) {
    return calculate3DAngle(p1, p2, p3);
  } else {
    // Fall back to 2D calculation if z coordinates are not available
    return calculate2DAngle(p1, p2, p3);
  }
}

function smoothAngle(prevAngle, rawAngle) {
  return prevAngle + smoothingFactor * (rawAngle - prevAngle);
}

// ======== UI Drawing Functions ========

function drawProgressArc(ctx, x, y, angle) {
  const minA = SITTING_THRESHOLD - 10; // Adjust lower bound slightly
  const maxA = STANDING_THRESHOLD + 10; // Adjust upper bound slightly
  const norm = Math.min(Math.max((angle - minA) / (maxA - minA), 0), 1);

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 3;
  ctx.arc(x, y, 25, 0, 2 * Math.PI);
  ctx.stroke();

  // Use color gradient based on progress
  let color;
  if (angle < SITTING_THRESHOLD) {
    color = '#f72585'; // Color for seated
  } else if (angle > STANDING_THRESHOLD) {
    color = '#4cc9f0'; // Color for standing
  } else {
    color = '#4361ee'; // Color for in-between
  }

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.arc(x, y, 25, 0, norm*2*Math.PI);
  ctx.stroke();
}

// Check for form issues
function checkKneeForm(ctx, hip, knee, ankle) {
  // Calculate the 2D x distance between knee and ankle
  const kneeAnkleXDist = Math.abs(knee.x - ankle.x);
  
  // If knees are too far forward relative to ankles
  if (kneeAnkleXDist > 0.1) {
    const textX = mirrorX(knee.x);
    const textY = knee.y * canvasElement.height;
    
    ctx.fillStyle = 'rgba(247, 37, 133, 0.9)'; // Warning color
    ctx.font = 'bold 24px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('✕', textX, textY - 60);
    
    // Add feedback text
    ctx.font = 'bold 16px Poppins';
    ctx.fillText('Knees behind toes', textX, textY - 90);
  }
}

// ======== Rep Progress Functions ========

// Update progress for the current rep in progress
function updateCurrentRepProgress(repNumber, angleMin, angleMax) {
  // Calculate the angle range achieved
  const rangeAchieved = Math.max(0, angleMax - angleMin);
  
  // Calculate progress percentage (based on ideal range between sitting and standing)
  const idealRange = STANDING_THRESHOLD - SITTING_THRESHOLD;
  const progressPercent = Math.min((rangeAchieved / idealRange) * 100, 100);
  
  // Update the progress bar
  const barSelector = `#rep-bar-${repNumber}`;
  const progressBar = document.querySelector(barSelector);
  
  // Update the range display text
  const rangeSelector = `#range-${repNumber}`;
  const rangeDisplay = document.querySelector(rangeSelector);
  
  if (progressBar) {
    progressBar.style.width = `${progressPercent}%`;
  }
  
  if (rangeDisplay) {
    rangeDisplay.textContent = `${Math.round(rangeAchieved)}°`;
  }
}

// Mark a rep as completed
function markRepCompleted(repNumber, rangeAchieved) {
  // Get the rep indicator element
  const repSelector = `#rep-indicator-${repNumber}`;
  const repIndicator = document.querySelector(repSelector);
  
  if (repIndicator) {
    // Add completed class to the indicator
    repIndicator.classList.add('rep-complete');
    
    // Save the range for this rep
    repRanges[repNumber - 1] = rangeAchieved;
    
    // Play completion sound
    playSuccessSound();
  }
}

// Multi-state rep tracking (similar to bicep.js)
function trackRep(leftAngle, rightAngle) {
  // Update min/max for current rep
  const avgAngle = (leftAngle + rightAngle) / 2;
  currentRepMin = Math.min(currentRepMin, avgAngle);
  currentRepMax = Math.max(currentRepMax, avgAngle);
  
  // Update progress for current rep
  const currentRepNumber = repCount + 1;
  updateCurrentRepProgress(currentRepNumber, currentRepMin, currentRepMax);
  
  // Rep counting logic with three states:
  // false = not started
  // 1 = started from sitting (first stage)
  // 2 = reached standing (second stage)
  // 3 = returned to sitting (rep complete)
  
  if (repStarted === false && leftAngle < SITTING_THRESHOLD && rightAngle < SITTING_THRESHOLD) {
    // Start in sitting position
    repStarted = 1;
    console.log("Rep started in sitting position");
  } else if (repStarted === 1 && leftAngle > STANDING_THRESHOLD && rightAngle > STANDING_THRESHOLD) {
    // Reached standing position
    repStarted = 2;
    console.log("Reached standing position");
  } else if (repStarted === 2 && leftAngle < SITTING_THRESHOLD && rightAngle < SITTING_THRESHOLD) {
    // Returned to sitting position - rep complete
    repCount++;
    repStarted = false;
    console.log("Rep completed - returned to sitting");
    
    // Mark this rep as complete with its range
    const rangeAchieved = currentRepMax - currentRepMin;
    markRepCompleted(repCount, rangeAchieved);
    
    // Reset angle tracking for next rep
    currentRepMin = 180;
    currentRepMax = 0;
  }
}

function playSuccessSound() {
  // Create a simple beep sound
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, 150);
  } catch (e) {
    console.log("Audio not supported or blocked");
  }
}

// ======== Exercise Management Functions ========

function updateUI() {
  repCountText.textContent = `Reps: ${repCount}/${targetReps} • Set ${currentSet}/${targetSets}`;
  
  if (repCount >= targetReps && !isResting) {
    // Set is complete
    handleSetCompletion();
  }
}

function handleSetCompletion() {
  // Mark set as complete
  currentSet++;
  
  if (currentSet > targetSets) {
    // All sets completed
    statusText.textContent = "All sets completed! Great job!";
    isAssessmentActive = false;
    return;
  }
  
  // Start rest period
  isAssessmentActive = false;
  isResting = true;
  restTimeRemaining = restBetweenSets;
  
  // Update UI for rest period
  statusText.textContent = `Set ${currentSet-1} complete! Rest for ${restTimeRemaining} seconds`;
  
  // Reset the rest timer every second
  restInterval = setInterval(() => {
    restTimeRemaining--;
    statusText.textContent = `Rest period: ${restTimeRemaining} seconds remaining...`;
    
    if (restTimeRemaining <= 0) {
      clearInterval(restInterval);
      isResting = false;
      
      // Reset for next set
      repCount = 0;
      repStarted = false;
      currentRepMin = 180;
      currentRepMax = 0;
      
      // Reset progress indicators for new set
      initRepProgressIndicators();
      
      // Start the next set
      isAssessmentActive = true;
      statusText.textContent = `Set ${currentSet} of ${targetSets}: Perform sit-to-stand-to-sit movements`;
    }
  }, 1000);
}

function mirrorX(x) {
  return canvasElement.width - (x * canvasElement.width);
}

function initRepProgressIndicators() {
  // Clear previous indicators
  repProgress.innerHTML = '';
  
  // Reset rep ranges
  repRanges = [];
  
  // Create progress indicators based on target reps
  for (let i = 1; i <= targetReps; i++) {
    const repElement = document.createElement('div');
    repElement.className = 'rep-indicator';
    repElement.id = `rep-indicator-${i}`;
    repElement.innerHTML = `
      <div class="rep-number">${i}</div>
      <div class="rep-bar-container">
        <div id="rep-bar-${i}" class="rep-bar"></div>
      </div>
      <div id="range-${i}" class="range-display">0°</div>
    `;
    repProgress.appendChild(repElement);
  }
}

function onStart() {
  // Reset counters
  repCount = 0;
  repStarted = false;
  smoothedLeftAngle = 180;
  smoothedRightAngle = 180;
  currentRepMin = 180;
  currentRepMax = 0;
  
  // Reset set counter
  currentSet = 1;
  
  // Clear any existing rest interval
  if (restInterval) {
    clearInterval(restInterval);
  }
  isResting = false;
  isAssessmentActive = false;
  
  // Initialize progress indicators
  initRepProgressIndicators();

  if (!isCountdownRunning) {
    // Disable start button during exercise
    startBtn.disabled = true;
    startBtn.style.backgroundColor = '#adb5bd';
    
    countdownCurrent = countdownSeconds;
    isCountdownRunning = true;
    statusText.textContent = `Starting in ${countdownCurrent}...`;

    countdownInterval = setInterval(() => {
      countdownCurrent--;
      statusText.textContent = `Starting in ${countdownCurrent}...`;
      if (countdownCurrent <= 0) {
        clearInterval(countdownInterval);
        isCountdownRunning = false;
        isAssessmentActive = true;
        statusText.textContent = `Set ${currentSet} of ${targetSets}: Perform complete sit-to-stand-to-sit movements`;
      }
    }, 1000);
  }
}

// ======== Main Processing Function ========

function onResults(results) {
  // 1) Clear & mirror the video feed
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Mirror transform for the video and skeleton
  canvasCtx.translate(canvasElement.width, 0);
  canvasCtx.scale(-1, 1);

  // Draw the mirrored image
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  // Draw the skeleton mirrored
  if (results.poseLandmarks) {
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
      {color: 'rgba(67, 97, 238, 0.7)', lineWidth: 3});
    drawLandmarks(canvasCtx, results.poseLandmarks,
      {color: 'rgba(247, 37, 133, 0.8)', lineWidth: 2, radius: 5});
  }

  canvasCtx.restore();

  // 2) If isAssessmentActive, do angle logic, but text is drawn in normal orientation
  if (results.poseLandmarks && isAssessmentActive) {
    // Process leg angles
    const lHip = results.poseLandmarks[23];
    const lKnee = results.poseLandmarks[25];
    const lAnkle = results.poseLandmarks[27];
    const rHip = results.poseLandmarks[24];
    const rKnee = results.poseLandmarks[26];
    const rAnkle = results.poseLandmarks[28];

    if (lHip && lKnee && lAnkle && rHip && rKnee && rAnkle) {
      // Calculate angles using 3D when available
      const rawLeftAngle = calculateAngle(lHip, lKnee, lAnkle);
      const rawRightAngle = calculateAngle(rHip, rKnee, rAnkle);
      
      smoothedLeftAngle = smoothAngle(smoothedLeftAngle, rawLeftAngle);
      smoothedRightAngle = smoothAngle(smoothedRightAngle, rawRightAngle);

      // Convert normalized -> pixel
      const leftKneeX = lKnee.x * canvasElement.width;
      const leftKneeY = lKnee.y * canvasElement.height;
      const rightKneeX = rKnee.x * canvasElement.width;
      const rightKneeY = rKnee.y * canvasElement.height;

      // Mirrored coordinates for text
      const textLX = canvasElement.width - leftKneeX;
      const textLY = leftKneeY;
      const textRX = canvasElement.width - rightKneeX;
      const textRY = rightKneeY;

      canvasCtx.save();
      // Draw left knee angle
      const leftAngleColor = (smoothedLeftAngle < SITTING_THRESHOLD || smoothedLeftAngle > STANDING_THRESHOLD) ? 
                            'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';
      canvasCtx.fillStyle = leftAngleColor;
      canvasCtx.font = 'bold 18px Poppins';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(`L: ${smoothedLeftAngle.toFixed(0)}°`, textLX, textLY - 45);
      drawProgressArc(canvasCtx, textLX, textLY, smoothedLeftAngle);

      // Draw right knee angle
      const rightAngleColor = (smoothedRightAngle < SITTING_THRESHOLD || smoothedRightAngle > STANDING_THRESHOLD) ? 
                             'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';
      canvasCtx.fillStyle = rightAngleColor;
      canvasCtx.fillText(`R: ${smoothedRightAngle.toFixed(0)}°`, textRX, textRY - 45);
      drawProgressArc(canvasCtx, textRX, textRY, smoothedRightAngle);
      
      // Check form issues
      checkKneeForm(canvasCtx, lHip, lKnee, lAnkle);
      checkKneeForm(canvasCtx, rHip, rKnee, rAnkle);
      
      // Add instruction text based on rep state
      let instructionText = "";
      switch(repStarted) {
        case false: 
          instructionText = "Start from seated position";
          break;
        case 1:
          instructionText = "Now stand up";
          break;
        case 2:
          instructionText = "Now sit back down";
          break;
      }
      
      // Draw the instruction text
      canvasCtx.fillStyle = 'rgba(67, 97, 238, 1)';
      canvasCtx.font = 'bold 20px Poppins';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(instructionText, canvasElement.width / 2, 40);
      canvasCtx.restore();

      // Track reps
      trackRep(smoothedLeftAngle, smoothedRightAngle);
      updateUI();
    }
  }
}

// Enable button after exercise is complete
setInterval(() => {
  if (startBtn && !isAssessmentActive && !isCountdownRunning) {
    startBtn.disabled = false;
    startBtn.style.backgroundColor = '';
  }
}, 1000);