document.addEventListener('DOMContentLoaded', function() {
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

// ----------------- Arm Raise Logic & Flow -----------------
let armChoice = "left";
let targetReps = storedReps ? parseInt(storedReps) : 5; // Default value
let currentSet = 1;
let targetSets = storedSets ? parseInt(storedSets) : 3; // Default value
let isResting = false;
let restTimeRemaining = 0;
let restInterval;
const restBetweenSets = 30; // 30 seconds rest between sets

let leftCount = 0;
let rightCount = 0;
let leftRepStarted = false;
let rightRepStarted = false;

// Track current angle range for progress bars
let currentLeftAngleMin = 0;
let currentLeftAngleMax = 0;
let currentRightAngleMin = 0;
let currentRightAngleMax = 0;

let smoothedLeftAngle = 0;
let smoothedRightAngle = 0;
const smoothingFactor = 0.2;

let isAssessmentActive = false;
let isCountdownRunning = false;
let countdownSeconds = 3;
let countdownCurrent = countdownSeconds;
let countdownInterval;

// Track completed rep ranges for display
let leftRepRanges = [];
let rightRepRanges = [];

// Angle thresholds for arm raise
const DOWN_THRESHOLD = 160; // Angle above which we consider arm "down" (close to torso)
const UP_THRESHOLD = 100; // Angle below which we consider arm "raised" (away from torso)

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
  
  // Set the rep input
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

// Calculate angle between two vectors in 2D
function calculateAngleBetweenVectors(v1, v2) {
  // Calculate dot product
  const dotProduct = v1.x * v2.x + v1.y * v2.y;
  
  // Calculate magnitudes
  const v1Magnitude = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const v2Magnitude = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  // Avoid division by zero
  if (v1Magnitude * v2Magnitude < 0.0001) return 0;
  
  // Calculate angle in radians and convert to degrees
  const cosAngle = dotProduct / (v1Magnitude * v2Magnitude);
  // Clamp cosAngle to [-1, 1] to avoid potential numerical errors
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));
  return Math.acos(clampedCosAngle) * (180 / Math.PI);
}

// Calculate angle between arm and torso
function calculateArmTorsoAngle(shoulder, hip, wrist) {
  // Create torso vector (from hip to shoulder)
  const torsoVector = {
    x: shoulder.x - hip.x,
    y: shoulder.y - hip.y
  };
  
  // Create arm vector (from shoulder to wrist)
  const armVector = {
    x: wrist.x - shoulder.x,
    y: wrist.y - shoulder.y
  };
  
  // Calculate angle between these vectors
  return calculateAngleBetweenVectors(torsoVector, armVector);
}

// Calculate angle between arm and torso for left and right sides
function calculateLeftArmAngle(landmarks) {
  const leftShoulder = landmarks[11];
  const leftHip = landmarks[23];
  const leftWrist = landmarks[15];
  
  return calculateArmTorsoAngle(leftShoulder, leftHip, leftWrist);
}

function calculateRightArmAngle(landmarks) {
  const rightShoulder = landmarks[12];
  const rightHip = landmarks[24];
  const rightWrist = landmarks[16];
  
  return calculateArmTorsoAngle(rightShoulder, rightHip, rightWrist);
}

function smoothAngle(prevAngle, rawAngle) {
  return prevAngle + smoothingFactor*(rawAngle - prevAngle);
}

function drawProgressArc(ctx, x, y, angle) {
  const minA = 0;
  const maxA = 90;
  const norm = Math.min(Math.max((angle - minA)/(maxA - minA),0),1);

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 3;
  ctx.arc(x, y, 25, 0, 2*Math.PI);
  ctx.stroke();

  // Use color gradient based on angle
  let color;
  if (angle > DOWN_THRESHOLD) {
    color = '#f72585'; // Color for arm down
  } else if (angle < UP_THRESHOLD) {
    color = '#4cc9f0'; // Color for arm up
  } else {
    color = '#4361ee'; // Color for in-between
  }
  
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.arc(x, y, 25, 0, norm*2*Math.PI);
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
  
  // Calculate progress percentage (based on ideal range of 90 degrees for arm raise)
  const idealRange = 90; // From 0 (down) to 90 (horizontal)
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

// Track rep counting logic for arm raise
function trackRep(angle, side) {
  if (side === "left") {
    // Update min/max angle for current rep
    currentLeftAngleMin = Math.min(currentLeftAngleMin, angle);
    currentLeftAngleMax = Math.max(currentLeftAngleMax, angle);
    
    // Update progress for current rep
    const currentRepNumber = leftCount + 1;
    updateCurrentRepProgress('left', currentRepNumber, currentLeftAngleMin, currentLeftAngleMax);
    
    // Rep logic for arm raise: 
    // If angle starts high (arm down), then goes below UP_THRESHOLD (arm raised), then returns above DOWN_THRESHOLD
    if (!leftRepStarted && angle > DOWN_THRESHOLD) {
      // Arm is down, ready to start
      leftRepStarted = 1;
    } else if (leftRepStarted === 1 && angle < UP_THRESHOLD) {
      // Arm is raised
      leftRepStarted = 2;
    } else if (leftRepStarted === 2 && angle > DOWN_THRESHOLD) {
      // Arm back down - rep complete
      leftCount++;
      const rangeAchieved = currentLeftAngleMax - currentLeftAngleMin;
      markRepCompleted('left', leftCount, rangeAchieved);
      
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
    
    // Rep logic for arm raise
    if (!rightRepStarted && angle > DOWN_THRESHOLD) {
      // Arm is down, ready to start
      rightRepStarted = 1;
    } else if (rightRepStarted === 1 && angle < UP_THRESHOLD) {
      // Arm is raised
      rightRepStarted = 2;
    } else if (rightRepStarted === 2 && angle > DOWN_THRESHOLD) {
      // Arm back down - rep complete
      rightCount++;
      const rangeAchieved = currentRightAngleMax - currentRightAngleMin;
      markRepCompleted('right', rightCount, rangeAchieved);
      
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
      currentLeftAngleMin = 0;
      currentLeftAngleMax = 0;
      currentRightAngleMin = 0;
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
  smoothedLeftAngle = 0; 
  smoothedRightAngle = 0;
  currentLeftAngleMin = 0;
  currentLeftAngleMax = 0;
  currentRightAngleMin = 0;
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
        statusText.textContent = `Set ${currentSet} of ${targetSets}: Performing arm raises with ${armChoice} arm(s)`;
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
      {color: 'rgba(67, 97, 238, 0.7)', lineWidth: 3});
    drawLandmarks(canvasCtx, results.poseLandmarks,
      {color: 'rgba(247, 37, 133, 0.8)', lineWidth: 2, radius: 5});
  }

  canvasCtx.restore();

  // 2) If isAssessmentActive, do angle logic
  if (results.poseLandmarks && isAssessmentActive) {
    // For left arm: 11 (shoulder), 23 (hip), 15 (wrist)
    if (armChoice === "left" || armChoice === "both") {
      // Calculate angle between arm and torso
      const rawLeftAngle = calculateLeftArmAngle(results.poseLandmarks);
      smoothedLeftAngle = smoothAngle(smoothedLeftAngle, rawLeftAngle);

      const lShoulder = results.poseLandmarks[11];
      
      // Convert normalized -> pixel
      const sX = lShoulder.x * canvasElement.width;
      const sY = lShoulder.y * canvasElement.height;

      // Text at mirrored location
      const textX = canvasElement.width - sX;
      const textY = sY;

      // Decide color
      const angleColor = (smoothedLeftAngle > DOWN_THRESHOLD || smoothedLeftAngle < UP_THRESHOLD) ? 
                        'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';

      canvasCtx.save();
      canvasCtx.fillStyle = angleColor;
      canvasCtx.font = 'bold 18px Poppins';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(`${smoothedLeftAngle.toFixed(0)}°`, textX, textY - 30);
      
      // Draw progress arc
      drawProgressArc(canvasCtx, textX, textY, smoothedLeftAngle);
      
      // Draw guidance for rep state
      let instructionText = "";
      if (leftRepStarted === 0) {
        instructionText = "Start with arms down";
      } else if (leftRepStarted === 1) {
        instructionText = "Raise arm up";
      } else if (leftRepStarted === 2) {
        instructionText = "Lower arm down";
      }
      
      canvasCtx.fillStyle = 'rgb(238, 215, 67)';
      canvasCtx.font = 'bold 16px Poppins';
      canvasCtx.fillText(instructionText, textX, textY - 60);
      
      canvasCtx.restore();

      if (leftCount < targetReps) {
        trackRep(smoothedLeftAngle, "left");
      }
    }

    // For right arm: 12 (shoulder), 24 (hip), 16 (wrist)
    if (armChoice === "right" || armChoice === "both") {
      // Calculate angle between arm and torso
      const rawRightAngle = calculateRightArmAngle(results.poseLandmarks);
      smoothedRightAngle = smoothAngle(smoothedRightAngle, rawRightAngle);

      const rShoulder = results.poseLandmarks[12];
      
      // Convert normalized -> pixel
      const sX = rShoulder.x * canvasElement.width;
      const sY = rShoulder.y * canvasElement.height;

      // Text at mirrored location
      const textX = canvasElement.width - sX;
      const textY = sY;

      // Decide color
      const angleColor = (smoothedRightAngle > DOWN_THRESHOLD || smoothedRightAngle < UP_THRESHOLD) ? 
                        'rgba(247, 37, 133, 0.9)' : 'rgba(76, 201, 240, 0.9)';
      
      canvasCtx.save();
      canvasCtx.fillStyle = angleColor;
      canvasCtx.font = 'bold 18px Poppins';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(`${smoothedRightAngle.toFixed(0)}°`, textX, textY - 30);
      
      // Draw progress arc
      drawProgressArc(canvasCtx, textX, textY, smoothedRightAngle);
      
      // Draw guidance for rep state
      let instructionText = "";
      if (rightRepStarted === 0) {
        instructionText = "Start with arms down";
      } else if (rightRepStarted === 1) {
        instructionText = "Raise arm up";
      } else if (rightRepStarted === 2) {
        instructionText = "Lower arm down";
      }
      
      canvasCtx.fillStyle = 'rgb(238, 215, 67)';
      canvasCtx.font = 'bold 16px Poppins';
      canvasCtx.fillText(instructionText, textX, textY - 60);
      
      canvasCtx.restore();

      if (rightCount < targetReps) {
        trackRep(smoothedRightAngle, "right");
      }
    }

    // Draw overall instruction at the top of the screen
    canvasCtx.fillStyle = 'rgb(9, 197, 178)';
    canvasCtx.font = 'bold 20px Poppins';
    canvasCtx.textAlign = 'center';
    canvasCtx.fillText(`Lateral Raises: Lift arms to the side, then lower`, canvasElement.width / 2, 30);

    updateUI();
  }

  // Draw target zones
  if (results.poseLandmarks) {
    const lShoulder = results.poseLandmarks[11];
    const lElbow = results.poseLandmarks[13];
    const lHip = results.poseLandmarks[23];
    const rShoulder = results.poseLandmarks[12];
    const rElbow = results.poseLandmarks[14];
    const rHip = results.poseLandmarks[24];
    
    // Draw target zones for both arms
    drawTargetZone(canvasCtx, lShoulder, lElbow, lHip, true);
    drawTargetZone(canvasCtx, rShoulder, rElbow, rHip, false);
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

// Updated drawTargetZone function for arm raises with proper mirroring
function drawTargetZone(ctx, shoulder, elbow, hip, isLeftSide) {
  // Extract coordinates with mirroring
  const shoulderX = (1 - shoulder.x) * canvasElement.width; // Mirror X coordinate
  const shoulderY = shoulder.y * canvasElement.height;
  const hipX = (1 - hip.x) * canvasElement.width; // Mirror X coordinate
  const hipY = hip.y * canvasElement.height;
  
  // Calculate the center point for the arc
  const centerX = shoulderX;
  const centerY = shoulderY;
  
  // Draw the target zone arc
  ctx.beginPath();
  ctx.setLineDash([5, 5]); // Create dashed line
  ctx.strokeStyle = 'rgba(76, 201, 240, 0.5)'; // Light blue, more visible
  ctx.lineWidth = 15;
  
  // Draw an arc showing the target range (0° to 90°)
  // Adjust angles based on left or right side
  let startAngle, endAngle;
  
  if (isLeftSide) {
    // Left arm (mirrored, so angles are flipped)
    startAngle = Math.PI / 2; // Down position
    endAngle = Math.PI; // Up position (arm raised to shoulder height)
  } else {
    // Right arm
    startAngle = Math.PI / 2; // Down position
    endAngle = 0; // Up position (arm raised to shoulder height)
  }
  
  // Draw the arc with a radius based on arm length
  const armLength = Math.sqrt(
    Math.pow(shoulderX - hipX, 2) + 
    Math.pow(shoulderY - hipY, 2)
  );
  const radius = armLength * 0.8;
  
  ctx.arc(centerX, centerY, radius, startAngle, endAngle, isLeftSide ? false : true);
  ctx.stroke();
  
  // Reset line dash
  ctx.setLineDash([]);
  
  // Add labels for start and end positions
  ctx.font = 'bold 14px Poppins';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'center';
  
  // Calculate positions for labels
  const startX = centerX + radius * Math.cos(startAngle);
  const startY = centerY + radius * Math.sin(startAngle);
  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY + radius * Math.sin(endAngle);
  
  // Position labels differently based on side
  if (isLeftSide) {
    ctx.fillText('Start', startX - 20, startY);
    ctx.fillText('Target', endX - 20, endY);
  } else {
    ctx.fillText('Start', startX + 20, startY);
    ctx.fillText('Target', endX, endY - 10);
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
    await pose.send({image: videoElement});
  },
  width: 800,
  height: 600
});
camera.start()
  .then(() => {
    console.log('Camera started successfully (arm raise).');
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