document.addEventListener('DOMContentLoaded', function () {
  // Get parameters from sessionStorage
  const storedReps = sessionStorage.getItem('exerciseReps');
  const storedSets = sessionStorage.getItem('exerciseSets');
  const storedLeg = sessionStorage.getItem('exerciseArm');

  console.log("Session storage values on load:");
  console.log("Reps:", storedReps);
  console.log("Sets:", storedSets);
  console.log("Leg:", storedLeg);
});

// Get parameters from sessionStorage
const storedReps = sessionStorage.getItem('exerciseReps');
const storedSets = sessionStorage.getItem('exerciseSets');
const storedLeg = sessionStorage.getItem('exerciseArm');

// ----------------- Leg Extension Logic & Flow -----------------
let legChoice = "left";
let targetReps = storedReps ? parseInt(storedReps) : 5; // Default value
let currentSet = 1;
let targetSets = storedSets ? parseInt(storedSets) : 3; // Default value
let isResting = false;
let restTimeRemaining = 0;
let restInterval;
const restBetweenSets = 15; // 15 seconds rest between sets

let leftCount = 0;
let rightCount = 0;
let leftRepStarted = false;
let rightRepStarted = false;

// Track current angle range for progress bars
let currentLeftAngleMin = 180;
let currentLeftAngleMax = 0;
let currentRightAngleMin = 180;
let currentRightAngleMax = 0;

let smoothedLeftAngle = 170;
let smoothedRightAngle = 170;
const smoothingFactor = 0.2;

let isAssessmentActive = false;
let isCountdownRunning = false;
let countdownSeconds = 3;
let countdownCurrent = countdownSeconds;
let countdownInterval;

// Track completed rep ranges for display
let leftRepRanges = [];
let rightRepRanges = [];

// DOM Elements
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const legSelectElems = document.getElementsByName("legSelect");
const repInputElem = document.getElementById("repInput");
const startBtn = document.getElementById("startBtn");
const leftCountText = document.getElementById("leftCountText");
const rightCountText = document.getElementById("rightCountText");
const statusText = document.getElementById("statusText");
const leftRepProgress = document.getElementById("leftRepProgress");
const rightRepProgress = document.getElementById("rightRepProgress");

// Set canvas dimensions
canvasElement.width = 640;
canvasElement.height = 480;

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

if (storedLeg) {
  legChoice = storedLeg;

  // Set the correct radio button
  for (let radio of legSelectElems) {
    if (radio.value === legChoice) {
      radio.checked = true;
      break;
    }
  }
}

// Utility Functions

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
  return prevAngle + smoothingFactor * (rawAngle - prevAngle);
}

function drawProgressArc(ctx, x, y, angle) {
  const minA = 150;
  const maxA = 180;
  const norm = Math.min(Math.max((angle - minA) / (maxA - minA), 0), 1);

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 3;
  ctx.arc(x, y, 25, 0, 2 * Math.PI);
  ctx.stroke();

  // Use color gradient based on angle
  let color;
  if (angle < 140) {
    color = '#f72585'; // Color for fully bent
  } else if (angle > 150) {
    color = '#4cc9f0'; // Color for fully extended
  } else {
    color = '#4361ee'; // Color for in-between
  }

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.arc(x, y, 25, 0, norm * 2 * Math.PI);
  ctx.stroke();
}

// Initialize rep progress bars
function initRepProgressBars() {
  // Clear previous progress bars
  leftRepProgress.innerHTML = "";
  rightRepProgress.innerHTML = "";

  // Reset rep ranges
  leftRepRanges = [];
  rightRepRanges = [];

  // Only show the progress container for the selected leg(s)
  if (legChoice === "left" || legChoice === "both") {
    leftRepProgress.style.display = "block";
  } else {
    leftRepProgress.style.display = "none";
  }

  if (legChoice === "right" || legChoice === "both") {
    rightRepProgress.style.display = "block";
  } else {
    rightRepProgress.style.display = "none";
  }

  // Create progress bars based on target reps
  for (let i = 1; i <= targetReps; i++) {
    // Left leg progress bars
    if (legChoice === "left" || legChoice === "both") {
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

    // Right leg progress bars
    if (legChoice === "right" || legChoice === "both") {
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

// Update progress for the current rep in progress
function updateCurrentRepProgress(side, repNumber, angleMin, angleMax) {
  // Calculate the angle range achieved
  const rangeAchieved = Math.max(0, angleMax - angleMin);

  // Calculate progress percentage (based on ideal range of 30 degrees)
  const idealRange = 30; // 180-150
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

// Check for leg extension form issues
function checkLegForm(ctx, hip, knee, ankle) {
  // For leg extension exercise, check if ankle is not extending fully forward
  if (ankle && knee && hip) {
    // For a leg extension, check if the angle between knee and ankle is not fully extended
    const ankleKneeAngle = Math.atan2(ankle.y - knee.y, ankle.x - knee.x) * (180 / Math.PI);

    // If ankle is not extending forward enough
    if (Math.abs(ankleKneeAngle) < 70) {
      const textX = canvasElement.width - (knee.x * canvasElement.width);
      const textY = knee.y * canvasElement.height;

      ctx.fillStyle = 'rgba(247, 37, 133, 0.9)'; // Warning color
      ctx.font = 'bold 16px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText('Extend fully forward', textX, textY - 70);
    }
  }
}

// Track rep counting logic
function trackRep(angle, side) {
  if (side === "left") {
    // Update min/max angle for current rep
    currentLeftAngleMin = Math.min(currentLeftAngleMin, angle);
    currentLeftAngleMax = Math.max(currentLeftAngleMax, angle);

    // Update progress for current rep
    const currentRepNumber = leftCount + 1;
    updateCurrentRepProgress('left', currentRepNumber, currentLeftAngleMin, currentLeftAngleMax);

    // Rep logic for leg extension: 
    // If angle goes below 160 (bending) and then above 170 (extending)
    if (!leftRepStarted && angle < 150) {
      leftRepStarted = true;
    } else if (leftRepStarted && angle > 150) {
      leftCount++;
      const rangeAchieved = currentLeftAngleMax - currentLeftAngleMin;
      markRepCompleted('left', leftCount, rangeAchieved);

      // Reset angle tracking for next rep
      leftRepStarted = false;
      currentLeftAngleMin = 180;
      currentLeftAngleMax = 0;
    }
  } else { // Right leg
    // Update min/max angle for current rep
    currentRightAngleMin = Math.min(currentRightAngleMin, angle);
    currentRightAngleMax = Math.max(currentRightAngleMax, angle);

    // Update progress for current rep
    const currentRepNumber = rightCount + 1;
    updateCurrentRepProgress('right', currentRepNumber, currentRightAngleMin, currentRightAngleMax);

    // Rep logic for leg extension
    if (!rightRepStarted && angle < 150) {
      rightRepStarted = true;
    } else if (rightRepStarted && angle > 150) {
      rightCount++;
      const rangeAchieved = currentRightAngleMax - currentRightAngleMin;
      markRepCompleted('right', rightCount, rangeAchieved);

      // Reset angle tracking for next rep
      rightRepStarted = false;
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
  statusText.textContent = `Set ${currentSet - 1} complete! Rest for ${restTimeRemaining} seconds`;

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
      statusText.textContent = `Set ${currentSet} of ${targetSets}: Tracking ${legChoice} leg(s), ${targetReps} reps`;
    }
  }, 1000);
}

function updateUI() {
  leftCountText.textContent = "";
  rightCountText.textContent = "";

  if (legChoice === "left" || legChoice === "both") {
    leftCountText.textContent = `Left Leg: ${leftCount}/${targetReps} reps • Set ${currentSet}/${targetSets}`;
  }

  if (legChoice === "right" || legChoice === "both") {
    rightCountText.textContent = `Right Leg: ${rightCount}/${targetReps} reps • Set ${currentSet}/${targetSets}`;
  }

  const leftDone = (leftCount >= targetReps);
  const rightDone = (rightCount >= targetReps);

  // Check if current set is complete
  if (!isResting && (
    (legChoice === "left" && leftDone) ||
    (legChoice === "right" && rightDone) ||
    (legChoice === "both" && leftDone && rightDone))) {

    handleSetCompletion();
  }
}

function onStart() {
  // read which leg(s)
  for (let radio of legSelectElems) {
    if (radio.checked) {
      legChoice = radio.value;
    }
  }

  // Reset counters
  leftCount = 0;
  rightCount = 0;
  leftRepStarted = false;
  rightRepStarted = false;
  smoothedLeftAngle = 170;
  smoothedRightAngle = 170;
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
        statusText.textContent = `Set ${currentSet} of ${targetSets}: Tracking ${legChoice} leg(s), ${targetReps} reps`;
      }
    }, 1000);
  }
}

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
      { color: 'rgba(67, 97, 238, 0.7)', lineWidth: 3 });
    drawLandmarks(canvasCtx, results.poseLandmarks,
      { color: 'rgba(247, 37, 133, 0.8)', lineWidth: 2, radius: 5 });
  }

  canvasCtx.restore();

  // 2) If isAssessmentActive, do angle logic, but text is drawn in normal orientation
  if (results.poseLandmarks && isAssessmentActive) {
    // For left leg: 23 (hip), 25 (knee), 27 (ankle)
    if (legChoice === "left" || legChoice === "both") {
      const lHip = results.poseLandmarks[23];
      const lKnee = results.poseLandmarks[25];
      const lAnkle = results.poseLandmarks[27];

      if (lHip && lKnee && lAnkle) {
        // Use 3D angle calculation if z-coordinates are available
        const rawLeftAngle = calculateAngle(lHip, lKnee, lAnkle);
        smoothedLeftAngle = smoothAngle(smoothedLeftAngle, rawLeftAngle);

        // Convert normalized -> pixel
        const kX = lKnee.x * canvasElement.width;
        const kY = lKnee.y * canvasElement.height;

        // Because we already mirrored the image, text location is mirrored x
        const textX = canvasElement.width - kX;
        const textY = kY;

        // Decide color
        const angleColor = (smoothedLeftAngle < 150 || smoothedLeftAngle > 150) ?
          'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';

        canvasCtx.save();
        // no mirror transform here => text is normal orientation
        canvasCtx.fillStyle = angleColor;
        canvasCtx.font = 'bold 18px Poppins';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText(`${smoothedLeftAngle.toFixed(0)}°`, textX, textY - 45);

        // Draw the progress arc at mirrored location
        drawProgressArc(canvasCtx, textX, textY, smoothedLeftAngle);

        // Check form
        checkLegForm(canvasCtx, lHip, lKnee, lAnkle);

        if (leftCount < targetReps) {
          trackRep(smoothedLeftAngle, "left");
        }
        canvasCtx.restore();
      }
    }

    // For right leg: 24 (hip), 26 (knee), 28 (ankle)
    if (legChoice === "right" || legChoice === "both") {
      const rHip = results.poseLandmarks[24];
      const rKnee = results.poseLandmarks[26];
      const rAnkle = results.poseLandmarks[28];

      if (rHip && rKnee && rAnkle) {
        // Use 3D angle calculation if z-coordinates are available
        const rawRightAngle = calculateAngle(rHip, rKnee, rAnkle);
        smoothedRightAngle = smoothAngle(smoothedRightAngle, rawRightAngle);

        const kX = rKnee.x * canvasElement.width;
        const kY = rKnee.y * canvasElement.height;

        // mirrored coords
        const textX = canvasElement.width - kX;
        const textY = kY;

        const angleColor = (smoothedRightAngle < 140 || smoothedRightAngle > 150) ?
          'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';

        canvasCtx.save();
        canvasCtx.fillStyle = angleColor;
        canvasCtx.font = 'bold 18px Poppins';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText(`${smoothedRightAngle.toFixed(0)}°`, textX, textY - 45);

        drawProgressArc(canvasCtx, textX, textY, smoothedRightAngle);

        // Check form
        checkLegForm(canvasCtx, rHip, rKnee, rAnkle);

        if (rightCount < targetReps) {
          trackRep(smoothedRightAngle, "right");
        }
        canvasCtx.restore();
      }
    }

    // Add instruction text based on movement state
    let instructionText = "";
    if ((legChoice === "left" || legChoice === "both") && leftRepStarted) {
      instructionText = "Now extend leg fully";
    } else if ((legChoice === "right" || legChoice === "both") && rightRepStarted) {
      instructionText = "Now extend leg fully";
    } else {
      instructionText = "Bend leg, then extend";
    }

    // Draw the instruction text
    canvasCtx.fillStyle = 'rgba(67, 97, 238, 1)';
    canvasCtx.font = 'bold 20px Poppins';
    canvasCtx.textAlign = 'center';
    canvasCtx.fillText(instructionText, canvasElement.width / 2, 30);

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
    await pose.send({ image: videoElement });
  },
  width: 800,
  height: 600
});
camera.start()
  .then(() => {
    console.log('Camera started successfully (leg extension).');
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