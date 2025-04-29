// ======== Constants and Variables ========

// Debug Mode
const DEBUG_MODE = true;

document.addEventListener('DOMContentLoaded', function () {
  // Get parameters from sessionStorage
  const storedReps = sessionStorage.getItem('exerciseReps');
  const storedSets = sessionStorage.getItem('exerciseSets');
  console.log("Session storage values on load:");
  console.log("Reps:", storedReps);
  console.log("Sets:", storedSets);
});

// Get parameters from sessionStorage
const storedReps = sessionStorage.getItem('exerciseReps');
const storedSets = sessionStorage.getItem('exerciseSets');

// ----------------- Sit/Stand Logic & Flow -----------------  
let targetReps = storedReps ? parseInt(storedReps) : 5; // Default value
let currentSet = 1;
let targetSets = storedSets ? parseInt(storedSets) : 3; // Default value
let isResting = false;
let restTimeRemaining = 0;
let restInterval;
const restBetweenSets = 15; // 15 seconds rest between sets
let repCount = 0;
let repStarted = false;
let isAssessmentActive = false;
let isCountdownRunning = false;
let countdownSeconds = 3;
let countdownCurrent = countdownSeconds;
let countdownInterval;
let frameCount = 0;
let lastStateChangeTime = 0;

// Angle tracking variables
let smoothedLeftAngle = 180;
let smoothedRightAngle = 180;
let currentRepMin = 180;
let currentRepMax = 0;
let minHipHeight = 1.0;
let maxHipHeight = 0.0;
const smoothingFactor = 0.3;

// Angle thresholds
const SITTING_THRESHOLD = 130; // Increased from 120 to 130 (more lenient)
const STANDING_THRESHOLD = 150; // Increased from 140 to 150
const MIN_ANGLE_RANGE = 20; // Reduced from 30 to 20 (easier to count a rep)
const SITTING_HYSTERESIS = 5;
const STANDING_HYSTERESIS = 5;

// Track completed rep ranges for display
let repRanges = [];

// DOM Elements
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const repInputElem = document.getElementById("repInput");
const startBtn = document.getElementById("startBtn");
const repCountText = document.getElementById("repCountText");
const statusText = document.getElementById("statusText");
const repProgress = document.getElementById("repProgress");

// Set canvas dimensions 
canvasElement.width = 800;
canvasElement.height = 600;

// Set initial values from sessionStorage if available
if (storedReps) {
  targetReps = parseInt(storedReps);
  console.log("Setting targetReps from sessionStorage:", targetReps);

  // Set the rep input
  if (repInputElem) {
    repInputElem.value = targetReps;
  }
}
if (storedSets) {
  targetSets = parseInt(storedSets);
  console.log("Setting targetSets from sessionStorage:", targetSets);
}

// ======== Utility Functions ========

function calculateAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return 180;

  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const crossProduct = v1.x * v2.y - v1.y * v2.x;
  const dotProduct = v1.x * v2.x + v1.y * v2.y;

  const angle = Math.atan2(crossProduct, dotProduct) * 180 / Math.PI;
  return Math.abs(angle);
}

function smoothAngle(prevAngle, rawAngle) {
  return prevAngle + smoothingFactor * (rawAngle - prevAngle);
}

function initRepProgressBars() {
  // Clear previous progress bars
  if (!repProgress) return;

  repProgress.innerHTML = "";

  // Reset rep ranges
  repRanges = [];

  // Create progress bars based on target reps
  for (let i = 1; i <= targetReps; i++) {
    const repElement = document.createElement('div');
    repElement.className = 'rep-indicator';
    repElement.innerHTML = `
      <div class="rep-number">${i}</div>
      <div class="rep-bar-container">
        <div id="rep-bar-${i}" class="rep-bar"></div>
      </div>
    `;
    repProgress.appendChild(repElement);
  }
}

function markRepCompleted(repNumber, angleRange) {
  // Get the rep indicator element
  const repSelector = `#rep-bar-${repNumber}`;
  const progressBar = document.querySelector(repSelector);

  if (progressBar) {
    // Add completed class to the parent of the progress bar
    const repIndicator = progressBar.parentElement.parentElement;
    repIndicator.classList.add('rep-complete');

    // Store the angle range for this rep
    repRanges[repNumber - 1] = angleRange;

    // Update the progress bar width based on angle range quality
    // Assuming 90 degrees is a perfect rep
    const quality = Math.min(angleRange / 90, 1);
    progressBar.style.width = `${quality * 100}%`;
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

function playSound(frequency, volume = 0.1, duration = 200) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';

    // Handle array of frequencies for chord
    if (Array.isArray(frequency)) {
      oscillator.frequency.value = frequency[0];
    } else {
      oscillator.frequency.value = frequency;
    }

    gainNode.gain.value = volume;

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, duration);
  } catch (e) {
    console.log("Audio not supported or blocked");
  }
}

// ======== Posture Detection ========

function detectPosture(landmarks) {
  // Calculate knee angles
  const lHip = landmarks[23];
  const lKnee = landmarks[25];
  const lAnkle = landmarks[27];
  const rHip = landmarks[24];
  const rKnee = landmarks[26];
  const rAnkle = landmarks[28];

  const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
  const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);

  // Apply smoothing
  smoothedLeftAngle = smoothAngle(smoothedLeftAngle, leftKneeAngle);
  smoothedRightAngle = smoothAngle(smoothedRightAngle, rightKneeAngle);

  // Track hip height (normalized to 0-1)
  const hipY = (lHip.y + rHip.y) / 2;
  minHipHeight = Math.min(minHipHeight, hipY);
  maxHipHeight = Math.max(maxHipHeight, hipY);

  // Calculate hip height change (0-1 scale)
  const hipHeightChange = maxHipHeight - minHipHeight;

  // Use minimum knee angle for sitting detection (more reliable)
  const minKneeAngle = Math.min(smoothedLeftAngle, smoothedRightAngle);

  // Average knee angle for standing detection
  const avgKneeAngle = (smoothedLeftAngle + smoothedRightAngle) / 2;

  // Log knee angles every 30 frames to avoid console spam
  if (DEBUG_MODE && frameCount % 30 === 0) {
    console.log(`Knee angles - Left: ${smoothedLeftAngle.toFixed(1)}°, Right: ${smoothedRightAngle.toFixed(1)}°, Min: ${minKneeAngle.toFixed(1)}°, Avg: ${avgKneeAngle.toFixed(1)}°`);
  }

  // Determine posture based on knee angle
  let posture = "transitioning";

  // Use minimum knee angle for sitting detection (more reliable)
  if (minKneeAngle < SITTING_THRESHOLD) {
    posture = "sitting";
  }
  // Use average knee angle for standing detection
  else if (avgKneeAngle > STANDING_THRESHOLD) {
    posture = "standing";
  }

  return {
    posture,
    kneeAngles: {
      left: smoothedLeftAngle,
      right: smoothedRightAngle,
      min: minKneeAngle,
      average: avgKneeAngle
    },
    hipHeight: hipY,
    hipHeightChange: hipHeightChange
  };
}

// ======== Rep Tracking ========

function trackRep(postureData) {
  if (!isAssessmentActive) return;

  const now = performance.now();
  const minKneeAngle = postureData.kneeAngles.min; // Use minimum knee angle
  const avgKneeAngle = postureData.kneeAngles.average;
  const posture = postureData.posture;

  // Minimum time between state changes (ms) to prevent flickering
  const MIN_STATE_CHANGE_TIME = 300;

  if (DEBUG_MODE && frameCount % 30 === 0) {
    console.log(`Current state: ${repStarted}, Posture: ${posture}, Min Angle: ${minKneeAngle.toFixed(1)}°, Avg Angle: ${avgKneeAngle.toFixed(1)}°`);
  }

  // State machine for rep counting
  switch (repStarted) {
    case false: // Not started a rep yet
      // Start in sitting position
      if (posture === "sitting" && now - lastStateChangeTime > MIN_STATE_CHANGE_TIME) {
        console.log("Starting rep from sitting position");
        console.log(`Min knee angle: ${minKneeAngle.toFixed(1)}°, Avg knee angle: ${avgKneeAngle.toFixed(1)}°`);

        repStarted = 1; // Move to state 1 (waiting for standing)
        lastStateChangeTime = now;
        currentRepMin = minKneeAngle; // Start tracking min angle from current
        currentRepMax = avgKneeAngle; // Start tracking max angle from current
        minHipHeight = 1.0;
        maxHipHeight = 0.0;

        // Play sound to indicate rep started
        playSound(440, 0.05, 100);
      }
      break;

    case 1: // Started rep, waiting for standing
      // Update min/max angles
      currentRepMin = Math.min(currentRepMin, minKneeAngle);
      currentRepMax = Math.max(currentRepMax, avgKneeAngle);

      // Reached standing position
      if (posture === "standing" && now - lastStateChangeTime > MIN_STATE_CHANGE_TIME) {
        console.log("Reached standing position");
        console.log(`Min knee angle: ${minKneeAngle.toFixed(1)}°, Avg knee angle: ${avgKneeAngle.toFixed(1)}°`);

        repStarted = 2; // Move to state 2 (waiting for sitting again)
        lastStateChangeTime = now;

        // Play sound to indicate standing reached
        playSound(660, 0.05, 100);
      }
      break;

    case 2: // Standing reached, waiting for sitting again
      // Update min/max angles
      currentRepMin = Math.min(currentRepMin, minKneeAngle);
      currentRepMax = Math.max(currentRepMax, avgKneeAngle);

      // Returned to sitting position - rep complete
      if (posture === "sitting" && now - lastStateChangeTime > MIN_STATE_CHANGE_TIME) {
        // Calculate angle range during this rep
        const angleRange = currentRepMax - currentRepMin;
        console.log("Returned to sitting position - Rep complete!");
        console.log(`Min knee angle: ${minKneeAngle.toFixed(1)}°, Avg knee angle: ${avgKneeAngle.toFixed(1)}°`);
        console.log(`Angle range during rep: ${angleRange.toFixed(1)}° (min: ${currentRepMin.toFixed(1)}°, max: ${currentRepMax.toFixed(1)}°)`);

        // Check if there was enough movement
        if (angleRange > MIN_ANGLE_RANGE) {
          repCount++;
          console.log(`Rep ${repCount} completed with angle range: ${angleRange.toFixed(1)}°`);

          // Mark this rep as complete with its range
          markRepCompleted(repCount, angleRange);

          // Play success sound
          playSuccessSound();

          // Check if set is complete
          if (repCount >= targetReps) {
            handleSetCompletion();
          }
        } else {
          console.log(`Movement too small to count as rep: ${angleRange.toFixed(1)}° < ${MIN_ANGLE_RANGE}°`);
          // Play error sound
          playSound(220, 0.1, 200);
        }

        // Reset for next rep
        repStarted = false;
        lastStateChangeTime = now;
        currentRepMin = 180;
        currentRepMax = 0;
        minHipHeight = 1.0;
        maxHipHeight = 0.0;
      }
      break;
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
      repCount = 0;
      repStarted = false;

      // Reset rep indicators for new set
      initRepProgressBars();

      // Start the next set
      isAssessmentActive = true;
      statusText.textContent = `Set ${currentSet} of ${targetSets}: Performing sit and stand`;

      // Play sound to indicate new set
      playSound(660, 0.1, 300);
    }
  }, 1000);
}

function updateUI() {
  // Update the rep count
  if (repCountText) {
    repCountText.textContent = `Reps: ${repCount}/${targetReps} • Set ${currentSet}/${targetSets}`;
  }

  // Update status text based on exercise state
  if (statusText) {
    if (isCountdownRunning) {
      statusText.textContent = `Get ready! Starting in ${countdownCurrent}...`;
    } else if (isResting) {
      statusText.textContent = `Rest time: ${restTimeRemaining} seconds until next set`;
    } else if (isAssessmentActive) {
      if (repCount >= targetReps) {
        if (currentSet >= targetSets) {
          statusText.textContent = `Exercise complete! Great job!`;
        } else {
          statusText.textContent = `Set ${currentSet} complete! Rest before next set.`;
        }
      } else {
        statusText.textContent = `Set ${currentSet} of ${targetSets}: Performing sit and stand. ${targetReps - repCount} reps remaining.`;
      }
    }
  }
}

function onStart() {
  // Read the number of reps from the input
  if (repInputElem) {
    targetReps = parseInt(repInputElem.value) || 5;
  }

  console.log("Starting exercise...");

  // Reset counters
  repCount = 0;
  repStarted = false;

  // Reset angle tracking
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

  // Initialize progress bars
  initRepProgressBars();

  if (!isCountdownRunning) {
    // Disable start button during exercise
    startBtn.disabled = true;
    startBtn.style.backgroundColor = '#adb5bd';

    countdownCurrent = countdownSeconds;
    isCountdownRunning = true;
    statusText.textContent = `Starting in ${countdownCurrent}...`;

    // Play start sound
    playSound(440, 0.1, 200);

    countdownInterval = setInterval(() => {
      countdownCurrent--;
      statusText.textContent = `Starting in ${countdownCurrent}...`;

      // Play tick sound
      playSound(330, 0.1, 100);

      if (countdownCurrent <= 0) {
        clearInterval(countdownInterval);
        isCountdownRunning = false;
        isAssessmentActive = true;
        statusText.textContent = `Set ${currentSet} of ${targetSets}: Performing sit and stand`;

        // Play start sound
        playSound(660, 0.1, 300);
      }
    }, 1000);
  }
}

function onResults(results) {
  // Increment frame counter
  frameCount++;

  try {
    // 1) Clear the canvas and draw the video frame
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw the video frame
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Draw the pose landmarks if available
    if (results.poseLandmarks) {
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
        { color: 'rgba(67, 97, 238, 0.7)', lineWidth: 3 });
      drawLandmarks(canvasCtx, results.poseLandmarks,
        { color: 'rgba(247, 37, 133, 0.8)', lineWidth: 2, radius: 5 });
    }

    canvasCtx.restore();

    // 2) If isAssessmentActive, do sit/stand logic 
    if (results.poseLandmarks && isAssessmentActive) {
      // Get posture data
      const postureData = detectPosture(results.poseLandmarks);
      const avgKneeAngle = postureData.kneeAngles.average;
      const posture = postureData.posture;

      // Draw knee angles
      const leftHip = results.poseLandmarks[23];
      const leftKnee = results.poseLandmarks[25];
      const leftAnkle = results.poseLandmarks[27];
      const rightHip = results.poseLandmarks[24];
      const rightKnee = results.poseLandmarks[26];
      const rightAnkle = results.poseLandmarks[28];

      // Convert normalized coordinates to pixel coordinates
      const leftKneeX = (1 - leftKnee.x) * canvasElement.width; // Mirror X coordinate
      const leftKneeY = leftKnee.y * canvasElement.height;
      const rightKneeX = (1 - rightKnee.x) * canvasElement.width; // Mirror X coordinate
      const rightKneeY = rightKnee.y * canvasElement.height;

      // Draw left knee angle text
      const leftAngleColor = (smoothedLeftAngle < SITTING_THRESHOLD || smoothedLeftAngle > STANDING_THRESHOLD) ?
        'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';
      canvasCtx.fillStyle = leftAngleColor;
      canvasCtx.font = 'bold 18px Arial';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(`L: ${smoothedLeftAngle.toFixed(0)}°`, leftKneeX, leftKneeY - 20);

      // Draw right knee angle text
      const rightAngleColor = (smoothedRightAngle < SITTING_THRESHOLD || smoothedRightAngle > STANDING_THRESHOLD) ?
        'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';
      canvasCtx.fillStyle = rightAngleColor;
      canvasCtx.fillText(`R: ${smoothedRightAngle.toFixed(0)}°`, rightKneeX, rightKneeY - 20);

      // Draw current posture status in top-right corner
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      canvasCtx.font = 'bold 24px Arial';
      canvasCtx.textAlign = 'right';
      canvasCtx.fillText(`Posture: ${posture.charAt(0).toUpperCase() + posture.slice(1)}`, canvasElement.width - 20, 30);

      // Draw current angle in top-left corner
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      canvasCtx.font = 'bold 24px Arial';
      canvasCtx.textAlign = 'left';
      canvasCtx.fillText(`Knee Angle: ${avgKneeAngle.toFixed(0)}°`, 20, 30);

      // Draw instruction text based on current state
      let instructionText = "";
      switch (repStarted) {
        case false:
          instructionText = "Start from seated position";
          break;
        case 1:
          instructionText = "Now stand up straight";
          break;
        case 2:
          instructionText = "Now sit back down";
          break;
      }

      // Draw instruction text at the bottom of the screen
      canvasCtx.fillStyle = 'rgba(67, 97, 238, 1)';
      canvasCtx.font = 'bold 24px Arial';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(instructionText, canvasElement.width / 2, canvasElement.height - 30);

      // Process rep tracking with improved state machine
      trackRep(postureData);
    } else if (results.poseLandmarks && isResting) {
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
    } else if (results.poseLandmarks && !isAssessmentActive && !isCountdownRunning && !isResting) {
      // Only show "Press Start" when not in rest period and not active
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      canvasCtx.font = 'bold 30px Arial';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText("Press Start to begin exercise", canvasElement.width / 2, canvasElement.height / 2);
    } else if (!results.poseLandmarks) {
      // No pose detected
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      canvasCtx.font = 'bold 30px Arial';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText("No pose detected - please stand in view of camera",
        canvasElement.width / 2, canvasElement.height / 2);
    }

    // Update UI elements
    updateUI();
  } catch (error) {
    console.error("Error in onResults function:", error);
  }
}

// Setup the Pose
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
    console.log('Camera started successfully (sit/stand).');
    statusText.textContent = 'Camera ready. Press Start Exercise to begin.';
    // Initialize progress bars
    initRepProgressBars();
  })
  .catch(err => {
    console.error('Error starting camera:', err);
    statusText.textContent = 'Error accessing webcam. Please check camera permissions and connection.';
    console.error('Error details:', err.name, err.message);
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