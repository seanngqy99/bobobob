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

// ----------------- Front Raise Logic & Flow -----------------
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

// Angle thresholds for front raise
const DOWN_THRESHOLD = 160; // Angle above which we consider arm "down" (close to torso)
const UP_THRESHOLD = 90; // Angle below which we consider arm "raised" forward

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

// Calculate a different angle for front raises - between spine and arm in frontal plane
function calculateFrontRaiseAngle(spine, shoulder, elbow) {
  // Create vectors for calculation
  // For front raises, we need to ignore x-axis movement and focus on y-axis
  const spineToShoulder = {
    x: 0, // Ignore x-axis for vertical alignment
    y: spine.y - shoulder.y
  };
  
  const shoulderToElbow = {
    x: 0, // Ignore x-axis for vertical alignment
    y: elbow.y - shoulder.y
  };
  
  // Calculate angle between spine vector and arm vector
  const dotProduct = spineToShoulder.y * shoulderToElbow.y;
  const spineLength = Math.sqrt(spineToShoulder.y * spineToShoulder.y);
  const armLength = Math.sqrt(shoulderToElbow.y * shoulderToElbow.y);
  
  // Avoid division by zero
  if (spineLength * armLength < 0.0001) return 0;
  
  // Calculate angle in radians and convert to degrees
  const cosAngle = dotProduct / (spineLength * armLength);
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));
  
  let angle = Math.acos(clampedCosAngle) * (180 / Math.PI);
  
  // If arm is raised above shoulder, calculate differently
  if (elbow.y < shoulder.y) {
    angle = 180 - angle;
  }
  
  return angle;
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
    color = '#4cc9f0'; // Color for arm fully raised forward
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
  
  // Calculate progress percentage (based on ideal range of 90 degrees for front raise)
  const idealRange = 90; // From down (0) to horizontal (90)
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

// Check for form in front raises
function checkFrontRaiseForm(ctx, shoulder, elbow, wrist) {
  // Check if arm is moving too far outward (should be straight forward)
  if (shoulder && elbow && wrist) {
    // Compare x-coordinates - in a good front raise, shoulder and elbow x should be similar
    const shoulderX = shoulder.x * canvasElement.width;
    const elbowX = elbow.x * canvasElement.width;
    const wristX = wrist.x * canvasElement.width;
    
    // Calculate deviation (how far sideways the arm is moving)
    // For a front raise, want minimal horizontal deviation
    const horizontalDeviation = Math.abs(shoulderX - elbowX) + Math.abs(elbowX - wristX);
    
    if (horizontalDeviation > canvasElement.width * 0.1) { // More than 10% of screen width
      const textX = canvasElement.width - (shoulder.x * canvasElement.width);
      const textY = shoulder.y * canvasElement.height;
      
      ctx.fillStyle = 'rgba(247, 37, 133, 0.9)'; // Warning color
      ctx.font = 'bold 16px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText('Keep arm straight forward', textX, textY - 60);
    }
  }
}

// Track rep counting logic for front raise
function trackRep(angle, side) {
  if (side === "left") {
    // Update min/max angle for current rep
    currentLeftAngleMin = Math.min(currentLeftAngleMin, angle);
    currentLeftAngleMax = Math.max(currentLeftAngleMax, angle);
    
    // Update progress for current rep
    const currentRepNumber = leftCount + 1;
    updateCurrentRepProgress('left', currentRepNumber, currentLeftAngleMin, currentLeftAngleMax);
    
    // Rep logic for front raise: 
    // If angle starts high (arm down), then goes below UP_THRESHOLD (arm raised), then returns above DOWN_THRESHOLD
    if (!leftRepStarted && angle > DOWN_THRESHOLD) {
      // Arm is down, ready to start
      leftRepStarted = 1;
    } else if (leftRepStarted === 1 && angle < UP_THRESHOLD) {
      // Arm is raised forward
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
    
    // Rep logic for front raise
    if (!rightRepStarted && angle > DOWN_THRESHOLD) {
      // Arm is down, ready to start
      rightRepStarted = 1;
    } else if (rightRepStarted === 1 && angle < UP_THRESHOLD) {
      // Arm is raised forward
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
        statusText.textContent = `Set ${currentSet} of ${targetSets}: Performing front raises with ${armChoice} arm(s)`;
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
    // Get neck position (midpoint between ears or a similar point)
    const neck = {
      x: (results.poseLandmarks[11].x + results.poseLandmarks[12].x) / 2,
      y: (results.poseLandmarks[11].y + results.poseLandmarks[12].y) / 2 - 0.05, // Slightly above shoulders
    };
    
    // For left arm front raise: neck, left shoulder (11), left elbow (13)
    if (armChoice === "left" || armChoice === "both") {
      const lShoulder = results.poseLandmarks[11];
      const lElbow = results.poseLandmarks[13];
      const lWrist = results.poseLandmarks[15];
      
      if (neck && lShoulder && lElbow) {
        // Calculate angle for front raise
        const rawLeftAngle = calculateFrontRaiseAngle(neck, lShoulder, lElbow);
        smoothedLeftAngle = smoothAngle(smoothedLeftAngle, rawLeftAngle);
        
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
          instructionText = "Raise arm forward";
        } else if (leftRepStarted === 2) {
          instructionText = "Lower arm down";
        }
        
        canvasCtx.fillStyle = 'rgb(238, 215, 67)';
        canvasCtx.font = 'bold 16px Poppins';
        canvasCtx.fillText(instructionText, textX, textY - 60);
        
        // Check form
        checkFrontRaiseForm(canvasCtx, lShoulder, lElbow, lWrist);
        
        canvasCtx.restore();

        if (leftCount < targetReps) {
          trackRep(smoothedLeftAngle, "left");
        }
      }
    }

    // For right arm front raise: neck, right shoulder (12), right elbow (14)
    if (armChoice === "right" || armChoice === "both") {
      const rShoulder = results.poseLandmarks[12];
      const rElbow = results.poseLandmarks[14];
      const rWrist = results.poseLandmarks[16];
      
      if (neck && rShoulder && rElbow) {
        // Calculate angle for front raise
        const rawRightAngle = calculateFrontRaiseAngle(neck, rShoulder, rElbow);
        smoothedRightAngle = smoothAngle(smoothedRightAngle, rawRightAngle);
        
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
          instructionText = "Raise arm forward";
        } else if (rightRepStarted === 2) {
          instructionText = "Lower arm down";
        }
        
        canvasCtx.fillStyle = 'rgb(238, 215, 67)';
        canvasCtx.font = 'bold 16px Poppins';
        canvasCtx.fillText(instructionText, textX, textY - 60);
        
        // Check form
        checkFrontRaiseForm(canvasCtx, rShoulder, rElbow, rWrist);
        
        canvasCtx.restore();

        if (rightCount < targetReps) {
          trackRep(smoothedRightAngle, "right");
        }
      }
    }
  }
  
  // Update the UI counters/status
  updateUI();
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

// Set up UI event listeners
function setupUIListeners() {
  // Add event listener to the start button
  if (startBtn) {
    startBtn.addEventListener('click', onStart);
  }
  
  // Add event listeners to arm selection radios
  for (let radio of armSelectElems) {
    radio.addEventListener('change', function() {
      armChoice = this.value;
      savePreferences();
    });
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
  }
  
  // Add event listener to rep input
  if (repInputElem) {
    repInputElem.addEventListener('change', function() {
      targetReps = parseInt(this.value) || 5;
      savePreferences();
    });
  }
  
  // Add set input listener if it exists
  const setInputElem = document.getElementById("setInput");
  if (setInputElem) {
    setInputElem.addEventListener('change', function() {
      targetSets = parseInt(this.value) || 3;
      savePreferences();
    });
  }


// Initialize MediaPipe pose detection
function initPoseDetection() {
  const pose = new Pose({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
  });
  
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  pose.onResults(onResults);
  
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({image: videoElement});
    },
    width: 800,
    height: 600
  });
  
  // Start camera
  camera.start()
    .then(() => {
      console.log("Camera started successfully");
      
      // Enable start button once camera is ready
      if (startBtn) {
        startBtn.disabled = false;
      }
    })
    .catch(err => {
      console.error("Error starting camera:", err);
      
      // Show error message to user
      if (statusText) {
        statusText.textContent = "Error: Could not access camera. Please check permissions.";
      }
    })};