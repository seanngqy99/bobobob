document.addEventListener('DOMContentLoaded', function() {
  // If there's already an arm choice from the library page, hide the arm selection
  if (storedArm) {
    const armSelectionSection = document.querySelector('.arm-selection-section');
    if (armSelectionSection) {
      armSelectionSection.style.display = 'none';
    }
  }
  
  console.log("Session storage values on load:");
  console.log("Reps:", sessionStorage.getItem('exerciseReps'));
  console.log("Sets:", sessionStorage.getItem('exerciseSets'));
});

// Get parameters from sessionStorage
const storedReps = sessionStorage.getItem('exerciseReps');
const storedSets = sessionStorage.getItem('exerciseSets');
const storedArm = sessionStorage.getItem('exerciseArm');

// ----------------- Bicep Curl Logic & Flow -----------------
let armChoice = "left";
let targetReps = storedReps ? parseInt(storedReps) : 5; // Use stored reps, default to 5
let currentSet = 1;
let targetSets = storedSets ? parseInt(storedSets) : 3; // Use stored sets, default to 3
let isResting = false;
let restTimeRemaining = 0;
let restInterval;
const restBetweenSets = 30; // 30 seconds rest between sets

let leftCount = 0;
let rightCount = 0;
let leftRepStarted = false;
let rightRepStarted = false;

// Track current angle range for progress bars
let currentLeftAngleMin = 180;
let currentLeftAngleMax = 0;
let currentRightAngleMin = 180;
let currentRightAngleMax = 0;

let smoothedLeftAngle = 180;
let smoothedRightAngle = 180;
const smoothingFactor = 0.2;

let isAssessmentActive = false;
let isCountdownRunning = false;
let countdownSeconds = 3;
let countdownCurrent = countdownSeconds;
let countdownInterval;

// Track completed rep ranges for display
let leftRepRanges = [];
let rightRepRanges = [];

// Modified angle thresholds for rep counting
const STARTING_THRESHOLD = 160; // Lower threshold to consider arm "straight"
const MOVEMENT_THRESHOLD = 100; // Angle below which we consider movement significant

// DOM Elements
const videoElement   = document.getElementsByClassName('input_video')[0];
const canvasElement  = document.getElementsByClassName('output_canvas')[0];
const canvasCtx      = canvasElement.getContext('2d');
const armSelectElems = document.getElementsByName("armSelect");
const repInputElem   = document.getElementById("repInput");
const startBtn       = document.getElementById("startBtn");
const leftCountText  = document.getElementById("leftCountText");
const rightCountText = document.getElementById("rightCountText");
const statusText     = document.getElementById("statusText");
const leftRepProgress = document.getElementById("leftRepProgress");
const rightRepProgress = document.getElementById("rightRepProgress");

// Set initial values from sessionStorage if available
if (storedReps) {
  targetReps = parseInt(storedReps);
  console.log("Setting targetReps from sessionStorage:", targetReps);
  
  // Set the hidden rep input
  if (repInputElem) {
    repInputElem.value = targetReps;
  }
}

if (storedSets) {
  targetSets = parseInt(storedSets);
  console.log("Setting targetSets from sessionStorage:", targetSets);
}

if (storedArm) {
  armChoice = storedArm;
  
  // Set the correct radio button
  for (let radio of armSelectElems) {
    if (radio.value === armChoice) {
      radio.checked = true;
      break;
    }
  }
}

canvasElement.width  = 800;
canvasElement.height = 600;

// Handle set completion
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
  
  // Start the rest timer
  statusText.textContent = `Set ${currentSet-1} complete! Rest for ${restTimeRemaining} seconds`;
  
  // Update the rest timer every second
  restInterval = setInterval(() => {
    restTimeRemaining--;
    statusText.textContent = `Rest period: ${restTimeRemaining} seconds remaining...`;
    
    if (restTimeRemaining <= 0) {
      clearInterval(restInterval);
      isResting = false;
      
      // Reset for next set
      leftCount = 0;
      rightCount = 0;
      leftRepStarted = false;
      rightRepStarted = false;
      currentLeftAngleMin = 180;
      currentLeftAngleMax = 0;
      currentRightAngleMin = 180;
      currentRightAngleMax = 0;
      
      // Initialize progress bars for the new set
      initRepProgressBars();
      
      // Start the next set
      isAssessmentActive = true;
      statusText.textContent = `Set ${currentSet} of ${targetSets}: Tracking ${armChoice} arm(s), ${targetReps} reps`;
    }
  }, 1000);
}

// Initialize rep progress bars
function initRepProgressBars() {
  // Clear previous progress bars
  leftRepProgress.innerHTML = "";
  rightRepProgress.innerHTML = "";
  
  // Reset rep ranges
  leftRepRanges = [];
  rightRepRanges = [];
  
  // Only show the progress container for the selected arm(s)
  if (armChoice === "left" || armChoice === "both") {
    leftRepProgress.style.display = "block";
  } else {
    leftRepProgress.style.display = "none";
  }
  
  if (armChoice === "right" || armChoice === "both") {
    rightRepProgress.style.display = "block";
  } else {
    rightRepProgress.style.display = "none";
  }
  
  // Log the current targetReps value to confirm it's correct
  console.log("Initializing progress bars with targetReps:", targetReps);
  
  // Create progress bars based on target reps
  for (let i = 1; i <= targetReps; i++) {
    // Left arm progress bars
    if (armChoice === "left" || armChoice === "both") {
      const leftRepElement = document.createElement('div');
      leftRepElement.className = 'rep-indicator';
      leftRepElement.innerHTML = `
        <div class="rep-number">${i}</div>
        <div class="rep-bar-container">
          <div id="left-rep-bar-${i}" class="rep-bar"></div>
        </div>
        <div id="left-range-${i}" class="range-display">0°</div>
      `;
      leftRepProgress.appendChild(leftRepElement);
    }
    
    // Right arm progress bars
    if (armChoice === "right" || armChoice === "both") {
      const rightRepElement = document.createElement('div');
      rightRepElement.className = 'rep-indicator';
      rightRepElement.innerHTML = `
        <div class="rep-number">${i}</div>
        <div class="rep-bar-container">
          <div id="right-rep-bar-${i}" class="rep-bar"></div>
        </div>
        <div id="right-range-${i}" class="range-display">0°</div>
      `;
      rightRepProgress.appendChild(rightRepElement);
    }
  }
}

// ------------- Utility angle & rep functions ---------------

// 2D angle calculation (original)
function calculate2DAngle(p1, p2, p3) {
  // p1, p2, p3 are normalized [0..1]
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x)
                - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
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

// Main angle calculation function - uses 3D if available, falls back to 2D
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
  return prevAngle + smoothingFactor*(rawAngle - prevAngle);
}

function drawProgressArc(ctx, x, y, angle) {
  const minA = 30;
  const maxA = 180;
  const norm = Math.min(Math.max((angle - minA)/(maxA - minA),0),1);

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 3;
  ctx.arc(x, y, 25, 0, 2*Math.PI);
  ctx.stroke();

  // Use color gradient based on angle
  let color;
  if (angle < 60) {
    color = '#f72585'; // Color for fully bent
  } else if (angle > 150) {
    color = '#4cc9f0'; // Color for fully extended
  } else {
    color = '#4361ee'; // Color for in-between
  }
  
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.arc(x, y, 25, 0, norm*2*Math.PI);
  ctx.stroke();
}

function checkElbowDrift(ctx, shoulder, elbow) {
  // If elbow.x < shoulder.x - 40 => draw 'X'
  // Note that these coords are now in normal orientation after we revert
  if (elbow.x < shoulder.x - 40) {
    ctx.fillStyle = 'rgba(247, 37, 133, 0.9)'; // Warning color
    ctx.font = 'bold 24px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('✕', elbow.x, elbow.y-30);
    
    // Add feedback text
    ctx.font = 'bold 16px Poppins';
    ctx.fillText('Keep elbow close', elbow.x, elbow.y-60);
  }
}

// Update progress for the current rep in progress
function updateCurrentRepProgress(side, repNumber, angleMin, angleMax) {
  // Calculate the angle range achieved
  const rangeAchieved = Math.max(0, angleMax - angleMin);
  
  // Calculate progress percentage (based on ideal range of 150 degrees)
  const idealRange = 150; // 180-30
  const progressPercent = Math.min((rangeAchieved / idealRange) * 100, 100);
  
  // Update the progress bar
  const barSelector = `#${side}-rep-bar-${repNumber}`;
  const progressBar = document.querySelector(barSelector);
  
  // Update the range display text
  const rangeSelector = `#${side}-range-${repNumber}`;
  const rangeDisplay = document.querySelector(rangeSelector);
  
  if (progressBar) {
    progressBar.style.width = `${progressPercent}%`;
  }
  
  if (rangeDisplay) {
    rangeDisplay.textContent = `${Math.round(rangeAchieved)}°`;
  }
}

// Update a completed rep's progress
function markRepCompleted(side, repNumber, rangeAchieved) {
  // Get the rep indicator element
  const repSelector = `#${side}-rep-bar-${repNumber}`;
  const progressBar = document.querySelector(repSelector);
  
  if (progressBar) {
    // Add completed class to the parent of the progress bar
    const repIndicator = progressBar.parentElement.parentElement;
    repIndicator.classList.add('rep-complete');
    
    // Save the range for this rep
    if (side === 'left') {
      leftRepRanges[repNumber - 1] = rangeAchieved;
    } else {
      rightRepRanges[repNumber - 1] = rangeAchieved;
    }
    
    // Play completion sound
    playSuccessSound();
  }
}

function trackRep(angle, side) {
  // Using the modified thresholds
  
  if (side === "left") {
    // Update min/max angle for current rep
    currentLeftAngleMin = Math.min(currentLeftAngleMin, angle);
    currentLeftAngleMax = Math.max(currentLeftAngleMax, angle);
    
    // Update progress for current rep
    const currentRepNumber = leftCount + 1;
    updateCurrentRepProgress('left', currentRepNumber, currentLeftAngleMin, currentLeftAngleMax);
    
    // Rep logic: Start when arm begins to bend, count when returns to starting position
    if (!leftRepStarted && angle > STARTING_THRESHOLD) {
      // Arm is in starting position, ready to begin
      leftRepStarted = true;
    } else if (leftRepStarted && angle < MOVEMENT_THRESHOLD) {
      // User has moved the arm - confirmed movement
      leftRepStarted = 2; // Use 2 to indicate movement has occurred
    } else if (leftRepStarted === 2 && angle > STARTING_THRESHOLD) {
      // User has returned to starting position - count the rep
      leftCount++;
      leftRepStarted = false;
      
      // Mark this rep as complete with its range
      const rangeAchieved = currentLeftAngleMax - currentLeftAngleMin;
      markRepCompleted('left', leftCount, rangeAchieved);
      
      // Reset angle tracking for next rep
      currentLeftAngleMin = 180;
      currentLeftAngleMax = 0;
    }
  } else { // Right arm
    // Update min/max angle for current rep
    currentRightAngleMin = Math.min(currentRightAngleMin, angle);
    currentRightAngleMax = Math.max(currentRightAngleMax, angle);
    
    // Update progress for current rep
    const currentRepNumber = rightCount + 1;
    updateCurrentRepProgress('right', currentRepNumber, currentRightAngleMin, currentRightAngleMax);
    
    // Rep logic: Start when arm begins to bend, count when returns to starting position
    if (!rightRepStarted && angle > STARTING_THRESHOLD) {
      // Arm is in starting position, ready to begin
      rightRepStarted = true;
    } else if (rightRepStarted && angle < MOVEMENT_THRESHOLD) {
      // User has moved the arm - confirmed movement
      rightRepStarted = 2; // Use 2 to indicate movement has occurred
    } else if (rightRepStarted === 2 && angle > STARTING_THRESHOLD) {
      // User has returned to starting position - count the rep
      rightCount++;
      rightRepStarted = false;
      
      // Mark this rep as complete with its range
      const rangeAchieved = currentRightAngleMax - currentRightAngleMin;
      markRepCompleted('right', rightCount, rangeAchieved);
      
      // Reset angle tracking for next rep
      currentRightAngleMin = 180;
      currentRightAngleMax = 0;
    }
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

function updateUI() {
  leftCountText.textContent = "";
  rightCountText.textContent = "";

  if (armChoice === "left" || armChoice === "both") {
    leftCountText.textContent = `Left Arm: ${leftCount}/${targetReps} reps • Set ${currentSet}/${targetSets}`;
  }
  
  if (armChoice === "right" || armChoice === "both") {
    rightCountText.textContent = `Right Arm: ${rightCount}/${targetReps} reps • Set ${currentSet}/${targetSets}`;
  }

  const leftDone = (leftCount >= targetReps);
  const rightDone = (rightCount >= targetReps);

  // Check if current set is complete
  if (!isResting && (
      (armChoice === "left" && leftDone) || 
      (armChoice === "right" && rightDone) || 
      (armChoice === "both" && leftDone && rightDone))) {
    
    handleSetCompletion();
  }
}

// The 3s countdown logic
function onStart() {
  // read which arm(s)
  for (let radio of armSelectElems) {
    if (radio.checked) {
      armChoice = radio.value;
    }
  }
  
  // IMPORTANT: Don't override the stored rep/set values!
  // Keep using the values from sessionStorage

  // Reset counters
  leftCount = 0; 
  rightCount = 0;
  leftRepStarted = false; 
  rightRepStarted = false;
  smoothedLeftAngle = 180; 
  smoothedRightAngle = 180;
  currentLeftAngleMin = 180;
  currentLeftAngleMax = 0;
  currentRightAngleMin = 180;
  currentRightAngleMax = 0;
  isAssessmentActive = false;
  
  // Reset set counter
  currentSet = 1;
  
  // Clear any existing rest interval
  if (restInterval) {
    clearInterval(restInterval);
  }
  isResting = false;
  
  // Initialize progress bars
  initRepProgressBars();

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
        statusText.textContent = `Set ${currentSet} of ${targetSets}: Tracking ${armChoice} arm(s), ${targetReps} reps`;
      }
    }, 1000);
  }
}

// The onResults callback => MIRROR the video, but normal text
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
    // We'll do the angle calcs in normal coordinate space, 
    // but visually the user sees themselves mirrored.

    // For left arm: 11,13,15
    if (armChoice === "left" || armChoice === "both") {
      const lShoulder = results.poseLandmarks[11];
      const lElbow = results.poseLandmarks[13];
      const lWrist = results.poseLandmarks[15];

      if (lShoulder && lElbow && lWrist) {
        // Use 3D angle calculation if z-coordinates are available
        const rawLeftAngle = calculateAngle(lShoulder, lElbow, lWrist);
        smoothedLeftAngle = smoothAngle(smoothedLeftAngle, rawLeftAngle);

        // Convert normalized -> pixel
        const eX = lElbow.x * canvasElement.width;
        const eY = lElbow.y * canvasElement.height;

        // Because we already mirrored the image, if we want the text not to be reversed,
        // we do this text in normal coordinate system. But we want it 
        // to appear at the mirrored elbow location. The mirrored elbow x is 
        // (canvasWidth - eX). Let's do that:
        const textX = canvasElement.width - eX;
        const textY = eY;

        // Decide color
        const angleColor = (smoothedLeftAngle < 30 || smoothedLeftAngle > 150) ? 
                          'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';

        canvasCtx.save();
        // no mirror transform here => text is normal orientation
        canvasCtx.fillStyle = angleColor;
        canvasCtx.font = 'bold 18px Poppins';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText(`${smoothedLeftAngle.toFixed(0)}°`, textX, textY - 45);
        
        // Draw the progress arc at mirrored location
        drawProgressArc(canvasCtx, textX, textY, smoothedLeftAngle);

        // Check elbow drift in normal coords => we must also mirror the x of shoulder & elbow
        const sX = canvasElement.width - (lShoulder.x*canvasElement.width);
        const sY = lShoulder.y*canvasElement.height;
        const eDriftX = textX; 
        const eDriftY = textY;
        checkElbowDrift(canvasCtx, {x:sX,y:sY},{x:eDriftX,y:eDriftY});
        canvasCtx.restore();

        // Rep counting
        if (leftCount < targetReps) {
          trackRep(smoothedLeftAngle, "left");
        }
      }
    }

    // For right arm: 12,14,16
    if (armChoice === "right" || armChoice === "both") {
      const rShoulder = results.poseLandmarks[12];
      const rElbow = results.poseLandmarks[14];
      const rWrist = results.poseLandmarks[16];

      if (rShoulder && rElbow && rWrist) {
        // Use 3D angle calculation if z-coordinates are available
        const rawRightAngle = calculateAngle(rShoulder, rElbow, rWrist);
        smoothedRightAngle = smoothAngle(smoothedRightAngle, rawRightAngle);

        const eX = rElbow.x * canvasElement.width;
        const eY = rElbow.y * canvasElement.height;

        // mirrored coords
        const textX = canvasElement.width - eX;
        const textY = eY;

        const angleColor = (smoothedRightAngle < 30 || smoothedRightAngle > 150) ? 
                          'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';
        
        canvasCtx.save();
        canvasCtx.fillStyle = angleColor;
        canvasCtx.font = 'bold 18px Poppins';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText(`${smoothedRightAngle.toFixed(0)}°`, textX, textY - 45);

        drawProgressArc(canvasCtx, textX, textY, smoothedRightAngle);

        const sX = canvasElement.width - (rShoulder.x*canvasElement.width);
        const sY = rShoulder.y*canvasElement.height;
        checkElbowDrift(canvasCtx, {x:sX,y:sY},{x:textX,y:textY});
        canvasCtx.restore();

        if (rightCount < targetReps) {
          trackRep(smoothedRightAngle, "right");
        }
      }
    }

    updateUI();
  }
}

// Setup the Pose
const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  }
});
pose.setOptions({
  modelComplexity: 2, // Increase to 2 for better 3D accuracy
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
  width: 640,
  height: 480
});
camera.start()
  .then(() => {
    console.log('Camera started successfully (mirror video, normal text).');
    statusText.textContent = 'Camera ready. Press Start Exercise to begin.';
    // Initialize progress bars
    initRepProgressBars();
  })
  .catch(err => {
    console.error('Error starting camera:', err);
    statusText.textContent = 'Error accessing webcam. Please check camera permissions.';
  });

// Start button => 3-second countdown => assessmentActive
startBtn.addEventListener('click', onStart);

// Enable button after exercise is complete
setInterval(() => {
  if (!isAssessmentActive && !isCountdownRunning) {
    startBtn.disabled = false;
    startBtn.style.backgroundColor = '';
  }
}, 1000);