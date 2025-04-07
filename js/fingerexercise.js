// Fingertip Touching Exercise using MediaPipe Hands
// This script handles the fingertip touching rehabilitation exercise

// Global variables
let video;
let canvas;
let ctx;
let detector;
let hands = [];

// Exercise variables
let exerciseActive = false;
let selectedHand = 'right'; // Default to right hand
let repCount = 0;
let targetRepCount = 10; // Default value, will be updated from session storage
let totalSets = 1; // Default value, will be updated from session storage
let currentSet = 1;
let exerciseStartTime;
let exerciseDuration = 0;

// Finger touching variables
let currentFingerIndex = 0; // 0: thumb-index, 1: thumb-middle, 2: thumb-ring, 3: thumb-pinky
const fingerNames = ['index', 'middle', 'ring', 'pinky'];
let touchedFingers = [false, false, false, false];
let touchThreshold = 25; // Distance threshold to consider fingers as touching
let inTransition = false; // Flag to prevent multiple touches during transition
let instructionTimer = null;
let inTouchPhase = false; // Flag to track if we're in touching or separating phase

// Add these variables at the top with other exercise variables
let isResting = false;
let restTimeRemaining = 0;
let restInterval;
const restBetweenSets = 5; // 5 seconds rest between sets

// UI Elements
let repCountDisplay;
let setsDisplay;
let statusDisplay;
let startButton;
let resetButton;
let handSelect;
let progressContainer;

// Add these variables at the top with other exercise variables
let leftHandState = {
  touchedFingers: [false, false, false, false],
  inTouchPhase: false
};
let rightHandState = {
  touchedFingers: [false, false, false, false],
  inTouchPhase: false
};

// =============================
// Initialize Camera and MediaPipe Hands
// =============================
async function initializeHandTracking() {
  // Get UI elements
  repCountDisplay = document.getElementById('repCount');
  setsDisplay = document.getElementById('setsDisplay');
  statusDisplay = document.getElementById('exerciseStatus');
  startButton = document.getElementById('startExercise');
  resetButton = document.getElementById('resetExercise');
  handSelect = document.getElementById('handSelect');
  progressContainer = document.getElementById('handProgress');

  // Disable start button until model is loaded
  if (startButton) startButton.disabled = true;

  // Add event listeners
  if (startButton) startButton.addEventListener('click', startExercise);
  if (resetButton) resetButton.addEventListener('click', resetExercise);
  if (handSelect) {
    handSelect.addEventListener('change', (e) => {
      selectedHand = e.target.value;
      updateStatus(`Selected ${selectedHand} hand(s)`);
      // Reinitialize detector with new hand count
      reinitializeDetector();
    });
  }

  // Get parameters from session storage
  getExerciseParameters();

  // Create canvas for rendering
  const videoContainer = document.getElementById('canvasContainer');
  canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  videoContainer.appendChild(canvas);

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

    // Initialize progress indicators
    createProgressIndicators();

    // Update status
    updateStatus('Loading hand tracking model...');

    // Initialize rep counter
    updateRepCount();

    // Update sets display
    updateSetsDisplay();

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
        updateStatus('Ready! Press Start to begin.');

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

// Separate function to initialize detector with proper settings
async function initializeDetector() {
  // Load MediaPipe Hands model
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
    maxHands: selectedHand === 'both' ? 2 : 1
  };

  console.log(`Initializing detector with maxHands: ${selectedHand === 'both' ? 2 : 1}`);
  detector = await handPoseDetection.createDetector(model, detectorConfig);
}

// Function to reinitialize detector when hand selection changes
async function reinitializeDetector() {
  try {
    updateStatus('Updating hand tracking model...');

    // Reinitialize with new settings
    await initializeDetector();

    updateStatus(`Ready with ${selectedHand} hand(s) selected. Press Start to begin.`);
  } catch (err) {
    console.error("Error reinitializing detector:", err);
    updateStatus('Error updating hand detector. Please refresh.');
  }
}

// =============================
// Get Exercise Parameters from Session Storage
// =============================
function getExerciseParameters() {
  // Check for stored parameters from session storage
  const storedReps = sessionStorage.getItem('exerciseReps');
  const storedSets = sessionStorage.getItem('exerciseSets');
  const storedArm = sessionStorage.getItem('exerciseArm');

  console.log("Session storage values on load:");
  console.log("Reps:", storedReps);
  console.log("Sets:", storedSets);
  console.log("Arm:", storedArm);

  // Apply rep count if stored
  if (storedReps) {
    targetRepCount = parseInt(storedReps);

    // Update rep count select if it exists
    if (document.getElementById('repCountSelect')) {
      const repCountSelect = document.getElementById('repCountSelect');

      // Check if the value exists in our dropdown
      const repOption = Array.from(repCountSelect.options).find(option =>
        parseInt(option.value) === targetRepCount
      );

      if (repOption) {
        // If the value exists in dropdown, select it
        repCountSelect.value = targetRepCount;
      } else {
        // If not, add a new option
        const newOption = document.createElement('option');
        newOption.value = targetRepCount;
        newOption.text = `${targetRepCount} Reps`;
        repCountSelect.add(newOption);
        repCountSelect.value = targetRepCount;
      }
    }
  }

  // Apply sets count if stored
  if (storedSets) {
    totalSets = parseInt(storedSets);

    // Reset current set to 1
    currentSet = parseInt(sessionStorage.getItem('currentExerciseSet') || '1');

    // Update sets display if it exists
    updateSetsDisplay();
  }

  // Apply arm/hand selection if stored
  if (storedArm) {
    // Map exercise arm to our hand selection
    let handValue = 'right'; // Default

    if (storedArm === 'left') {
      handValue = 'left';
    } else if (storedArm === 'both') {
      handValue = 'both';
    }

    // Set value
    selectedHand = handValue;

    // Set dropdown value if it exists
    if (handSelect) {
      handSelect.value = handValue;

      // Hide the hand selection if needed
      const armSelectionSection = document.querySelector('.control-group:has(#handSelect)');
      if (armSelectionSection) {
        armSelectionSection.style.display = 'none';
      }
    }

    // Update the display
    if (document.getElementById('currentHandDisplay')) {
      document.getElementById('currentHandDisplay').textContent =
        selectedHand.charAt(0).toUpperCase() + selectedHand.slice(1);
    }
  }
}

// =============================
// UI and Progress Display Functions
// =============================
function createProgressIndicators() {
  // Clear existing indicators
  if (!progressContainer) return;

  progressContainer.innerHTML = '';

  // Create indicator for each rep
  for (let i = 0; i < targetRepCount; i++) {
    const indicator = document.createElement('div');
    indicator.className = 'rep-indicator';
    indicator.setAttribute('data-rep', i + 1);
    progressContainer.appendChild(indicator);
  }
}

function updateProgressIndicators() {
  if (!progressContainer) return;

  // Update progress indicators based on completed reps
  const indicators = document.querySelectorAll('.rep-indicator');

  indicators.forEach((indicator, index) => {
    if (index < repCount) {
      indicator.classList.add('completed');
    } else {
      indicator.classList.remove('completed');
    }
  });
}

function updateRepCount() {
  if (repCountDisplay) {
    repCountDisplay.textContent = `Reps: ${repCount} / ${targetRepCount}`;
  }
}

function updateSetsDisplay() {
  if (setsDisplay) {
    setsDisplay.textContent = `Sets: ${currentSet} / ${totalSets}`;
  }
}

function updateStatus(message) {
  if (statusDisplay) {
    statusDisplay.textContent = `Status: ${message}`;
  }
}

// =============================
// Exercise Control Functions
// =============================
function startExercise() {
  if (exerciseActive) return;

  exerciseActive = true;
  exerciseStartTime = Date.now();
  repCount = 0;
  currentFingerIndex = 0;
  inTransition = false;
  inTouchPhase = true; // Start with touch phase

  // Reset hand states
  leftHandState = {
    touchedFingers: [false, false, false, false],
    inTouchPhase: true
  };
  rightHandState = {
    touchedFingers: [false, false, false, false],
    inTouchPhase: true
  };

  // Reset UI
  updateRepCount();
  updateProgressIndicators();
  updateStatus(`Touch your thumb to your ${fingerNames[currentFingerIndex]} finger`);
  if (startButton) startButton.disabled = true;

  // Start session timer
  startSessionTimer();
}

function resetExercise() {
  exerciseActive = false;
  repCount = 0;
  currentFingerIndex = 0;
  touchedFingers = [false, false, false, false];
  inTransition = false;

  // Clear instruction timer if it's running
  if (instructionTimer) {
    clearTimeout(instructionTimer);
    instructionTimer = null;
  }

  // Reset UI
  updateRepCount();
  updateProgressIndicators();
  updateStatus('Exercise reset. Press Start to begin again.');
  if (startButton) startButton.disabled = false;

  // Stop session timer
  if (window.sessionInterval) {
    clearInterval(window.sessionInterval);
  }
}

function completeExercise() {
  exerciseActive = false;
  exerciseDuration = (Date.now() - exerciseStartTime) / 1000;

  // Stop the session timer
  if (window.sessionInterval) {
    clearInterval(window.sessionInterval);
  }

  // Handle sets if available
  if (currentSet < totalSets) {
    // Start rest period
    startRestPeriod();
  } else {
    // All sets complete
    updateStatus(`Exercise complete! All ${totalSets} sets finished.`);
    if (startButton) startButton.disabled = false;

    // Reset current set for next time
    sessionStorage.setItem('currentExerciseSet', '1');

    // Save last session info
    const lastSessionDisplay = document.getElementById('lastSessionDisplay');
    if (lastSessionDisplay) {
      const currentDate = new Date();
      const dateString = currentDate.toLocaleDateString();
      const timeString = currentDate.toLocaleTimeString();
      lastSessionDisplay.textContent = `${dateString} ${timeString}`;

      // Save to localStorage for persistence
      localStorage.setItem('lastFingerTouchExerciseSession',
        `${dateString} ${timeString} - ${repCount} reps × ${totalSets} sets`);
    }
  }
}

function startRestPeriod() {
  // Start rest period
  isResting = true;
  restTimeRemaining = restBetweenSets;

  // Update status
  updateStatus(`Set ${currentSet} complete! Rest for ${restTimeRemaining} seconds`);

  // Play rest period sound
  playRestSound();

  // Start the rest timer
  restInterval = setInterval(() => {
    restTimeRemaining--;
    updateStatus(`Rest time: ${restTimeRemaining} seconds until next set`);

    // Update rest timer display in the middle column
    displayRestTimer();

    if (restTimeRemaining <= 0) {
      clearInterval(restInterval);
      isResting = false;

      // Move to next set
      currentSet++;
      sessionStorage.setItem('currentExerciseSet', currentSet.toString());

      // Reset rep count
      repCount = 0;

      // Update UI
      updateSetsDisplay();
      updateRepCount();
      updateProgressIndicators();

      // Start next set automatically
      startExercise();
    }
  }, 1000);
}

function displayRestTimer() {
  // Only run this if canvas and context exist
  if (!canvas || !ctx) return;

  // Clear canvas before drawing rest timer
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw a semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw rest period text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`REST PERIOD`, canvas.width / 2, canvas.height / 2 - 60);
  ctx.fillText(`${restTimeRemaining} seconds`, canvas.width / 2, canvas.height / 2);

  // Draw info about next set
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`Next: Set ${currentSet + 1} of ${totalSets}`, canvas.width / 2, canvas.height / 2 + 60);

  // Draw progress bar
  const barWidth = 400;
  const barHeight = 30;
  const barX = (canvas.width - barWidth) / 2;
  const barY = canvas.height / 2 + 100;
  const progress = (restBetweenSets - restTimeRemaining) / restBetweenSets;

  // Draw background bar
  ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Draw progress fill
  ctx.fillStyle = 'rgba(75, 201, 240, 0.9)';
  ctx.fillRect(barX, barY, barWidth * progress, barHeight);
}

// Add sound functions
function playRestSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = 440; // A4 note
    gainNode.gain.value = 0.1;

    oscillator.start();
    setTimeout(() => {
      oscillator.frequency.value = 550;
      setTimeout(() => {
        oscillator.stop();
      }, 150);
    }, 150);
  } catch (e) {
    console.log("Audio not supported or blocked");
  }
}

// =============================
// Hand Detection and Processing
// =============================
async function detectHands() {
  async function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If in rest period, only show the rest timer
    if (isResting) {
      displayRestTimer();
      requestAnimationFrame(render);
      return;
    }

    // Draw mirrored video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    try {
      if (detector) {
        // Estimate hands with MediaPipe
        const estimationConfig = { flipHorizontal: true }; // Flip because we're mirroring
        hands = await detector.estimateHands(video, estimationConfig);

        // Draw hands
        drawHands();

        // Process finger touches if exercise is active
        if (exerciseActive) {
          processFingerTouches();
        }
      }
    } catch (err) {
      console.error("Error detecting hands:", err);
    }

    // Display exercise instructions
    if (exerciseActive) {
      displayInstructions();
    }

    requestAnimationFrame(render);
  }

  render();
}

function drawHands() {
  if (hands.length === 0) return;

  hands.forEach(hand => {
    const handedness = hand.handedness.toLowerCase();

    // Only draw the selected hand (or both)
    if (selectedHand !== 'both' && handedness !== selectedHand) return;

    // Set styles based on hand
    const color = handedness === 'left' ? 'rgba(255, 165, 0, 0.7)' : 'rgba(0, 191, 255, 0.7)';
    const pointColor = handedness === 'left' ? '#FFA500' : '#00BFFF';

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
      const isWrist = index === 0;

      // Draw larger circles for fingertips and wrist
      const radius = isFingertip ? 8 : isWrist ? 10 : 5;

      // Highlight the current target fingertip and thumb
      const isCurrentTarget = exerciseActive &&
        (index === 4 || // Thumb
          (currentFingerIndex === 0 && index === 8) || // Index
          (currentFingerIndex === 1 && index === 12) || // Middle
          (currentFingerIndex === 2 && index === 16) || // Ring
          (currentFingerIndex === 3 && index === 20)); // Pinky

      // Add shadow for depth
      ctx.shadowColor = isCurrentTarget ? '#FFFF00' : pointColor;
      ctx.shadowBlur = isCurrentTarget ? 15 : 5;

      // Draw keypoint
      ctx.fillStyle = isCurrentTarget ? '#FFFF00' : isFingertip ? 'white' : pointColor;
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, isCurrentTarget ? radius * 1.5 : radius, 0, 2 * Math.PI);
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Label fingertips
      if (isFingertip) {
        const fingerNames = ['thumb', 'index', 'middle', 'ring', 'pinky'];
        const fingerIndex = [4, 8, 12, 16, 20].indexOf(index);

        if (fingerIndex !== -1) {
          ctx.fillStyle = isCurrentTarget ? '#FFFF00' : 'white';
          ctx.font = isCurrentTarget ? 'bold 14px Arial' : '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(fingerNames[fingerIndex], keypoint.x, keypoint.y - 15);
        }
      }
    });

    // If exercise is active, draw a line between the current finger and thumb
    if (exerciseActive) {
      const thumb = hand.keypoints[4]; // Thumb tip
      let targetFinger = null;

      // Get the target fingertip based on currentFingerIndex
      if (currentFingerIndex === 0) targetFinger = hand.keypoints[8]; // Index
      else if (currentFingerIndex === 1) targetFinger = hand.keypoints[12]; // Middle
      else if (currentFingerIndex === 2) targetFinger = hand.keypoints[16]; // Ring
      else if (currentFingerIndex === 3) targetFinger = hand.keypoints[20]; // Pinky

      if (thumb && targetFinger) {
        const distance = calculateDistance(thumb, targetFinger);

        // Change line color based on how close the fingers are
        if (distance <= touchThreshold) {
          ctx.strokeStyle = 'lime'; // Green when touching
        } else if (distance <= touchThreshold * 2) {
          ctx.strokeStyle = 'yellow'; // Yellow when close
        } else {
          ctx.strokeStyle = 'white'; // White when far apart
        }

        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.beginPath();
        ctx.moveTo(thumb.x, thumb.y);
        ctx.lineTo(targetFinger.x, targetFinger.y);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line style

        // Show distance
        const midX = (thumb.x + targetFinger.x) / 2;
        const midY = (thumb.y + targetFinger.y) / 2;

        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${distance.toFixed(0)}px`, midX, midY);
      }
    }
  });
}

function processFingerTouches() {
  // Get the hands that match the selected hand
  let handsToProcess = [];

  if (selectedHand === 'both') {
    // If both hands are selected, process all detected hands
    handsToProcess = hands;
  } else if (hands.length > 0) {
    // Find the hand matching the selected side
    const matchingHand = hands.find(hand => hand.handedness.toLowerCase() === selectedHand);
    if (matchingHand) {
      handsToProcess.push(matchingHand);
    }
  }

  if (handsToProcess.length === 0) {
    // No matching hand found
    return;
  }

  // Process each hand
  let allHandsComplete = true;

  handsToProcess.forEach(hand => {
    const handedness = hand.handedness.toLowerCase();
    const handState = handedness === 'left' ? leftHandState : rightHandState;

    // Get thumb and current target finger
    const thumb = hand.keypoints[4]; // Thumb tip
    let targetFinger = null;

    // Get the target fingertip based on currentFingerIndex
    if (currentFingerIndex === 0) targetFinger = hand.keypoints[8]; // Index
    else if (currentFingerIndex === 1) targetFinger = hand.keypoints[12]; // Middle
    else if (currentFingerIndex === 2) targetFinger = hand.keypoints[16]; // Ring
    else if (currentFingerIndex === 3) targetFinger = hand.keypoints[20]; // Pinky

    if (!thumb || !targetFinger) {
      allHandsComplete = false;
      return;
    }

    // Calculate distance between thumb and target finger
    const distance = calculateDistance(thumb, targetFinger);

    // Check if we're in the touch phase or separation phase
    if (handState.inTouchPhase) {
      // Touch phase - we're looking for the fingers to touch
      if (distance <= touchThreshold && !handState.touchedFingers[currentFingerIndex] && !inTransition) {
        // Fingers are touching
        handState.touchedFingers[currentFingerIndex] = true;

        // Play touch sound/effect
        createTouchFeedback(thumb.x, thumb.y);
      }
    } else {
      // Separation phase - we're looking for the fingers to separate
      if (distance > touchThreshold * 2 && handState.touchedFingers[currentFingerIndex] && !inTransition) {
        // Fingers are separated enough
        handState.touchedFingers[currentFingerIndex] = false;
      }
    }

    // Check if this hand has completed the current phase
    if (handState.inTouchPhase && !handState.touchedFingers[currentFingerIndex]) {
      allHandsComplete = false;
    } else if (!handState.inTouchPhase && handState.touchedFingers[currentFingerIndex]) {
      allHandsComplete = false;
    }
  });

  // If all hands have completed the current phase, move to next phase
  if (allHandsComplete && !inTransition) {
    inTransition = true;

    if (inTouchPhase) {
      // Move from touch to separation phase
      inTouchPhase = false;
      // Update both hand states
      leftHandState.inTouchPhase = false;
      rightHandState.inTouchPhase = false;
      updateStatus(`Now separate your thumb and ${fingerNames[currentFingerIndex]} finger`);
    } else {
      // Move from separation to next finger or complete rep
      inTouchPhase = true;
      // Update both hand states
      leftHandState.inTouchPhase = true;
      rightHandState.inTouchPhase = true;

      // Move to next finger
      currentFingerIndex = (currentFingerIndex + 1) % 4;

      // If we've come back to the first finger, that's one complete rep
      if (currentFingerIndex === 0) {
        repCount++;
        updateRepCount();
        updateProgressIndicators();

        // Check if exercise is complete
        if (repCount >= targetRepCount) {
          completeExercise();
          return;
        }
      }

      // Reset touched state for the new target
      leftHandState.touchedFingers = [false, false, false, false];
      rightHandState.touchedFingers = [false, false, false, false];

      // Update instruction for next finger
      updateStatus(`Touch your thumb to your ${fingerNames[currentFingerIndex]} finger`);
    }

    // Allow transition after a short delay
    setTimeout(() => {
      inTransition = false;
    }, 500);
  }
}

function displayInstructions() {
  // Background for instruction display
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(canvas.width / 2 - 200, 20, 400, 60);

  // Draw instruction text
  ctx.font = "18px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";

  let instructionText = "";
  if (inTouchPhase) {
    instructionText = `Touch your thumb to your ${fingerNames[currentFingerIndex]} finger`;
  } else {
    instructionText = `Now separate your thumb and ${fingerNames[currentFingerIndex]} finger`;
  }

  ctx.fillText(instructionText, canvas.width / 2, 50);

  // Draw progress text
  const progressText = `Finger ${currentFingerIndex + 1}/4 • Rep ${repCount + 1}/${targetRepCount}`;
  ctx.font = "14px Arial";
  ctx.fillText(progressText, canvas.width / 2, 75);

  // Draw rep instructions
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(canvas.width / 2 - 230, canvas.height - 50, 460, 40);

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    `Touch thumb to each finger in sequence - ${repCount} of ${targetRepCount} reps completed`,
    canvas.width / 2,
    canvas.height - 25
  );
}

function createTouchFeedback(x, y) {
  // Visual feedback - pulse effect on the screen
  ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, 2 * Math.PI);
  ctx.fill();

  // Visual feedback - pulse effect on the progress indicator
  const indicators = document.querySelectorAll('.rep-indicator');
  if (indicators && indicators[repCount]) {
    // Get the sub-indicator for the current finger if it exists
    const subIndicator = indicators[repCount].querySelector(`.finger-${currentFingerIndex}`);
    if (subIndicator) {
      subIndicator.classList.add('success-pulse');
      setTimeout(() => {
        subIndicator.classList.remove('success-pulse');
      }, 500);
    } else {
      // Pulse the whole indicator
      indicators[repCount].classList.add('success-pulse');
      setTimeout(() => {
        indicators[repCount].classList.remove('success-pulse');
      }, 500);
    }
  }

  // Sound feedback could be added here
  // const touchSound = new Audio('touch.mp3');
  // touchSound.play();
}

// =============================
// Utility Functions
// =============================
function calculateDistance(point1, point2) {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

// Session timer
function startSessionTimer() {
  // Clear any existing timer
  if (window.sessionInterval) clearInterval(window.sessionInterval);

  const startTime = Date.now();
  const timeDisplay = document.getElementById('sessionTimeDisplay');

  if (!timeDisplay) return;

  window.sessionInterval = setInterval(() => {
    if (!exerciseActive) {
      clearInterval(window.sessionInterval);
      return;
    }

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

// =============================
// Initialize on Page Load
// =============================
window.onload = function () {
  // Initialize the hand tracking
  initializeHandTracking();
};