document.addEventListener('DOMContentLoaded', function () {
  // Get parameters from sessionStorage
  const storedReps = sessionStorage.getItem('exerciseReps');
  const storedSets = sessionStorage.getItem('exerciseSets');
  const storedArm = sessionStorage.getItem('exerciseArm');

  console.log("Session storage values on load:");
  console.log("Reps:", storedReps);
  console.log("Sets:", storedSets);
  console.log("Arm:", storedArm);
});

// Get parameters from sessionStorage
const storedReps = sessionStorage.getItem('exerciseReps');
const storedSets = sessionStorage.getItem('exerciseSets');
const storedArm = sessionStorage.getItem('exerciseArm');

// ----------------- Tricep Extension Logic & Flow -----------------
let armChoice = "left";
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

let smoothedLeftAngle = 110;
let smoothedRightAngle = 110;
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
const FLEXED_THRESHOLD = 110; // Angle below which we consider elbow "flexed"
const EXTENDED_THRESHOLD = 160; // Angle above which we consider elbow "extended"
const MIN_ANGLE_RANGE = 50; // Minimum angle range to count as valid rep

// DOM Elements
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const armSelectElems = document.getElementsByName("armSelect");
const repInputElem = document.getElementById("repInput");
const startBtn = document.getElementById("startBtn");
const leftCountText = document.getElementById("leftCountText");
const rightCountText = document.getElementById("rightCountText");
const statusText = document.getElementById("statusText");
const leftRepProgress = document.getElementById("leftRepProgress");
const rightRepProgress = document.getElementById("rightRepProgress");

// Set canvas dimensions
canvasElement.width = 800;
canvasElement.height = 600;

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
  const minA = 90;
  const maxA = 180;
  const norm = Math.min(Math.max((angle - minA) / (maxA - minA), 0), 1);

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 3;
  ctx.arc(x, y, 25, 0, 2 * Math.PI);
  ctx.stroke();

  // Use color gradient based on angle
  let color;
  if (angle < 110) {
    color = '#f72585'; // Color for flexed
  } else if (angle > 160) {
    color = '#4cc9f0'; // Color for extended
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

// Update progress for the current rep in progress
function updateCurrentRepProgress(side, repNumber, angleMin, angleMax) {
  // Calculate the angle range achieved
  const rangeAchieved = Math.max(0, angleMax - angleMin);

  // Calculate progress percentage (based on ideal range of 70 degrees for tricep extension)
  const idealRange = 70; // From 110 (flexed) to 180 (extended)
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

function analyzeArmForm(ctx, shoulder, elbow, wrist) {
  // Check if all landmarks are available
  if (!shoulder || !elbow || !wrist) return;

  // Check shoulder position - for triceps extension, shoulder should stay relatively still
  // You can customize this based on your exercise needs

  // Convert to pixel coordinates
  const shoulderX = canvasElement.width - (shoulder.x * canvasElement.width);
  const shoulderY = shoulder.y * canvasElement.height;
  const elbowX = canvasElement.width - (elbow.x * canvasElement.width);
  const elbowY = elbow.y * canvasElement.height;

  // Check if arm is too far from body
  const shoulderElbowDist = Math.sqrt(
    Math.pow(shoulderX - elbowX, 2) +
    Math.pow(shoulderY - elbowY, 2)
  );

  // Provide feedback
  if (shoulderElbowDist > canvasElement.width * 0.2) {
    ctx.fillStyle = 'rgba(247, 37, 133, 0.9)'; // Warning color
    ctx.font = 'bold 16px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('Keep upper arm close to body', elbowX, elbowY - 70);
  }
}

// Track rep counting logic for arm extension
function trackRep(angle, side) {
  if (side === "left") {
    // Update min/max angle for current rep
    currentLeftAngleMin = Math.min(currentLeftAngleMin, angle);
    currentLeftAngleMax = Math.max(currentLeftAngleMax, angle);

    // Update progress for current rep
    const currentRepNumber = leftCount + 1;
    updateCurrentRepProgress('left', currentRepNumber, currentLeftAngleMin, currentLeftAngleMax);

    // Rep logic for tricep extension:
    // Start at a flexed position < FLEXED_THRESHOLD
    // Extend to > EXTENDED_THRESHOLD
    // Return to flexed position

    if (!leftRepStarted && angle < FLEXED_THRESHOLD) {
      // Arm is in flexed position, ready to start
      leftRepStarted = 1;
    } else if (leftRepStarted === 1 && angle > EXTENDED_THRESHOLD) {
      // Arm is extended
      leftRepStarted = 2;
    } else if (leftRepStarted === 2 && angle < FLEXED_THRESHOLD) {
      // Arm back to flexed position - rep complete
      // Check if the range of motion was sufficient
      const angleRange = currentLeftAngleMax - currentLeftAngleMin;

      if (angleRange >= MIN_ANGLE_RANGE) {
        leftCount++;
        markRepCompleted('left', leftCount, angleRange);
      }

      // Reset angle tracking for next rep
      leftRepStarted = 0;
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

    // Rep logic for tricep extension
    if (!rightRepStarted && angle < FLEXED_THRESHOLD) {
      // Arm is in flexed position, ready to start
      rightRepStarted = 1;
    } else if (rightRepStarted === 1 && angle > EXTENDED_THRESHOLD) {
      // Arm is extended
      rightRepStarted = 2;
    } else if (rightRepStarted === 2 && angle < FLEXED_THRESHOLD) {
      // Arm back to flexed position - rep complete
      // Check if the range of motion was sufficient
      const angleRange = currentRightAngleMax - currentRightAngleMin;

      if (angleRange >= MIN_ANGLE_RANGE) {
        rightCount++;
        markRepCompleted('right', rightCount, angleRange);
      }

      // Reset angle tracking for next rep
      rightRepStarted = 0;
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
  console.log(`Set ${currentSet} complete!`);

  if (currentSet >= targetSets) {
    // Exercise complete!
    console.log("Exercise complete!");
    isAssessmentActive = false;
    statusText.textContent = "All sets completed! Great job!";

    // Play completion sound
    playSound(880, 0.1, 500);
    return;
  }

  // Start rest period 
  isAssessmentActive = false;
  isResting = true;
  restTimeRemaining = restBetweenSets;

  // Start the rest timer
  statusText.textContent = `Set ${currentSet} complete! Rest for ${restTimeRemaining} seconds`;

  // Play rest period sound
  playSound([440, 550], 0.1, 300);

  // Update the rest timer every second
  restInterval = setInterval(() => {
    restTimeRemaining--;
    statusText.textContent = `Rest period: ${restTimeRemaining} seconds remaining...`;

    if (restTimeRemaining <= 0) {
      clearInterval(restInterval);
      isResting = false;

      // Start next set
      currentSet++;

      // Reset for next set
      leftCount = 0;
      rightCount = 0;
      leftRepStarted = false;
      rightRepStarted = false;
      currentLeftAngleMin = 180;
      currentLeftAngleMax = 0;
      currentRightAngleMin = 180;
      currentRightAngleMax = 0;

      // Reset rep indicators for new set
      initRepProgressBars();

      // Start the next set
      isAssessmentActive = true;
      statusText.textContent = `Set ${currentSet} of ${targetSets}: Tracking ${armChoice} arm(s), ${targetReps} reps`;

      // Play sound to indicate new set
      playSound(660, 0.1, 300);
    }
  }, 1000);
}

function playSound(frequency, volume, duration) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (Array.isArray(frequency)) {
      // Play a chord
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency[0];

      // Create additional oscillators for chord
      const oscillators = [oscillator];
      for (let i = 1; i < frequency.length; i++) {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = frequency[i];
        osc.connect(gainNode);
        oscillators.push(osc);
      }

      // Start all oscillators
      oscillators.forEach(osc => osc.start());

      // Stop all oscillators after duration
      setTimeout(() => {
        oscillators.forEach(osc => osc.stop());
      }, duration);
    } else {
      // Play a single tone
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.value = volume;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
      }, duration);
    }
  } catch (e) {
    console.log("Audio not supported or blocked");
  }
}

function updateUI() {
  // Update the rep counts
  if (armChoice === "left" || armChoice === "both") {
    leftCountText.textContent = `Left Arm: ${leftCount}/${targetReps} reps • Set ${currentSet}/${targetSets}`;
  } else {
    leftCountText.textContent = "";
  }

  if (armChoice === "right" || armChoice === "both") {
    rightCountText.textContent = `Right Arm: ${rightCount}/${targetReps} reps • Set ${currentSet}/${targetSets}`;
  } else {
    rightCountText.textContent = "";
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

function onStart() {
  // Read the number of reps from the input
  if (repInputElem) {
    targetReps = parseInt(repInputElem.value) || 5;
  }

  // Read which arm(s)
  for (let radio of armSelectElems) {
    if (radio.checked) {
      armChoice = radio.value;
    }
  }

  // Reset counters
  leftCount = 0;
  rightCount = 0;
  leftRepStarted = false;
  rightRepStarted = false;
  smoothedLeftAngle = 110;
  smoothedRightAngle = 110;
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
        statusText.textContent = `Set ${currentSet} of ${targetSets}: Performing tricep extensions with ${armChoice} arm(s)`;
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
    // For left arm: 11 (shoulder), 13 (elbow), 15 (wrist)
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

        // Because we already mirrored the image, text location is mirrored x
        const textX = canvasElement.width - eX;
        const textY = eY;

        // Decide color
        const angleColor = (smoothedLeftAngle < FLEXED_THRESHOLD || smoothedLeftAngle > EXTENDED_THRESHOLD) ?
          'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';

        canvasCtx.save();
        // no mirror transform here => text is normal orientation
        canvasCtx.fillStyle = angleColor;
        canvasCtx.font = 'bold 18px Poppins';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText(`${smoothedLeftAngle.toFixed(0)}°`, textX, textY - 45);

        // Draw the progress arc at mirrored location
        drawProgressArc(canvasCtx, textX, textY, smoothedLeftAngle);

        // Draw guidance for rep state
        let instructionText = "";
        if (leftRepStarted === 0) {
          instructionText = "Start with elbow bent";
        } else if (leftRepStarted === 1) {
          instructionText = "Extend arm straight";
        } else if (leftRepStarted === 2) {
          instructionText = "Bend elbow back";
        }

        canvasCtx.fillStyle = 'rgb(238, 215, 67)';
        canvasCtx.font = 'bold 16px Poppins';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText(instructionText, textX, textY - 75);

        // Check form
        analyzeArmForm(canvasCtx, lShoulder, lElbow, lWrist);

        canvasCtx.restore();

        // Rep counting
        if (leftCount < targetReps) {
          trackRep(smoothedLeftAngle, "left");
        }
      }
    }

    // For right arm: 12 (shoulder), 14 (elbow), 16 (wrist)
    if (armChoice === "right" || armChoice === "both") {
      const rShoulder = results.poseLandmarks[12];
      const rElbow = results.poseLandmarks[14];
      const rWrist = results.poseLandmarks[16];

      if (rShoulder && rElbow && rWrist) {
        // Use 3D angle calculation if z-coordinates are available
        const rawRightAngle = calculateAngle(rShoulder, rElbow, rWrist);
        smoothedRightAngle = smoothAngle(smoothedRightAngle, rawRightAngle);

        // Convert normalized -> pixel
        const eX = rElbow.x * canvasElement.width;
        const eY = rElbow.y * canvasElement.height;

        // Text at mirrored location
        const textX = canvasElement.width - eX;
        const textY = eY;

        // Decide color
        const angleColor = (smoothedRightAngle < FLEXED_THRESHOLD || smoothedRightAngle > EXTENDED_THRESHOLD) ?
          'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';

        canvasCtx.save();
        canvasCtx.fillStyle = angleColor;
        canvasCtx.font = 'bold 18px Poppins';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText(`${smoothedRightAngle.toFixed(0)}°`, textX, textY - 45);

        // Draw the progress arc
        drawProgressArc(canvasCtx, textX, textY, smoothedRightAngle);

        // Draw guidance for rep state
        let instructionText = "";
        if (rightRepStarted === 0) {
          instructionText = "Start with elbow bent";
        } else if (rightRepStarted === 1) {
          instructionText = "Extend arm straight";
        } else if (rightRepStarted === 2) {
          instructionText = "Bend elbow back";
        }

        canvasCtx.fillStyle = 'rgb(238, 215, 67)';
        canvasCtx.font = 'bold 16px Poppins';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText(instructionText, textX, textY - 75);

        // Check form
        analyzeArmForm(canvasCtx, rShoulder, rElbow, rWrist);

        canvasCtx.restore();

        // Rep counting
        if (rightCount < targetReps) {
          trackRep(smoothedRightAngle, "right");
        }
      }
    }

    // Draw general instruction at the top of the screen
    canvasCtx.fillStyle = 'rgba(67, 97, 238, 1)';
    canvasCtx.font = 'bold 20px Poppins';
    canvasCtx.textAlign = 'center';
    canvasCtx.fillText('Tricep Extensions: Keep upper arm still, bend and extend at elbow', canvasElement.width / 2, 30);

    updateUI();
  }

  // Add this block after drawing landmarks but before other UI elements
  if (results.poseLandmarks && isResting) {
    // Draw rest period information
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    canvasCtx.font = 'bold 30px Arial';
    canvasCtx.textAlign = 'center';
    canvasCtx.fillText(`Rest Period: ${restTimeRemaining} seconds`, canvasElement.width / 2, canvasElement.height / 2 - 40);
    canvasCtx.fillText(`Next Set: ${currentSet + 1} of ${targetSets}`, canvasElement.width / 2, canvasElement.height / 2 + 40);

    // Draw progress bar for rest period
    const barWidth = 400;
    const barHeight = 20;
    const barX = (canvasElement.width - barWidth) / 2;
    const barY = canvasElement.height / 2;
    const progress = (restBetweenSets - restTimeRemaining) / restBetweenSets;

    // Draw background bar
    canvasCtx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    canvasCtx.fillRect(barX, barY, barWidth, barHeight);

    // Draw progress
    canvasCtx.fillStyle = 'rgba(76, 201, 240, 0.9)';
    canvasCtx.fillRect(barX, barY, barWidth * progress, barHeight);
  }

  // Modify the "Press Start" condition to exclude rest periods
  else if (results.poseLandmarks && !isAssessmentActive && !isCountdownRunning && !isResting) {
    // Only show "Press Start" when not in rest period and not active
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    canvasCtx.font = 'bold 30px Arial';
    canvasCtx.textAlign = 'center';
    canvasCtx.fillText("Press Start to begin exercise", canvasElement.width / 2, canvasElement.height / 2);
  }
}

// Save preferences to sessionStorage
function savePreferences() {
  // Save current settings to sessionStorage
  sessionStorage.setItem('exerciseReps', targetReps);
  sessionStorage.setItem('exerciseSets', targetSets);
  sessionStorage.setItem('exerciseArm', armChoice);

  console.log("Saved preferences to sessionStorage:");
  console.log("Reps:", targetReps);
  console.log("Sets:", targetSets);
  console.log("Arm:", armChoice);
}

// Setup the Pose detection
function initPoseDetection() {
  const pose = new Pose({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
  });

  pose.setOptions({
    modelComplexity: 2, // Highest complexity for better accuracy
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
      console.log('Camera started successfully (tricep extension).');
      statusText.textContent = 'Camera ready. Press Start Exercise to begin.';
      // Initialize progress bars
      initRepProgressBars();
    })
    .catch(err => {
      console.error('Error starting camera:', err);
      statusText.textContent = 'Error accessing webcam. Please check camera permissions.';
    });
}

// Set up UI event listeners
function setupUIListeners() {
  // Add event listener to the start button
  if (startBtn) {
    startBtn.addEventListener('click', onStart);
  }

  // Add event listeners to arm selection radios
  for (let radio of armSelectElems) {
    radio.addEventListener('change', function () {
      armChoice = this.value;
      savePreferences();
    });
  }

  // Add event listener to rep input
  if (repInputElem) {
    repInputElem.addEventListener('change', function () {
      targetReps = parseInt(this.value) || 5;
      savePreferences();
    });
  }

  // Add set input listener if it exists
  const setInputElem = document.getElementById("setInput");
  if (setInputElem) {
    setInputElem.addEventListener('change', function () {
      targetSets = parseInt(this.value) || 3;
      savePreferences();
    });
  }

  // Enable button after exercise is complete
  setInterval(() => {
    if (!isAssessmentActive && !isCountdownRunning) {
      startBtn.disabled = false;
      startBtn.style.backgroundColor = '';
    }
  }, 1000);
}

// Initialize the app
function initApp() {
  // Set up the UI event listeners
  setupUIListeners();

  // Initialize the rep progress bars
  initRepProgressBars();

  // Initialize pose detection
  initPoseDetection();

  // Display initial status
  if (statusText) {
    statusText.textContent = "Ready to start. Select options and press Start.";
  }
}

// Run the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);