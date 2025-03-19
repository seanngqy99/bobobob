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
  let currentLeftAngleMin = 180;
  let currentLeftAngleMax = 0;
  let currentRightAngleMin = 180;
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
  const DOWN_THRESHOLD = 30; // Angle below which we consider arm "down"
  const UP_THRESHOLD = 90; // Angle above which we consider arm "raised"
  
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
  
  // For arm raise, we need to calculate the angle against vertical
  function calculateVerticalAngle(shoulder, elbow, wrist) {
    // First get the arm vector from shoulder to wrist
    const armVectorX = wrist.x - shoulder.x;
    const armVectorY = wrist.y - shoulder.y;
    
    // The vertical vector is (0, -1) (pointing upward in canvas coordinates)
    const verticalX = 0;
    const verticalY = -1;
    
    // Calculate dot product
    const dotProduct = armVectorX * verticalX + armVectorY * verticalY;
    
    // Calculate magnitudes
    const armMagnitude = Math.sqrt(armVectorX * armVectorX + armVectorY * armVectorY);
    const verticalMagnitude = 1; // Length of unit vector
    
    // Avoid division by zero
    if (armMagnitude < 0.0001) return 0;
    
    // Calculate angle in radians and convert to degrees
    const cosAngle = dotProduct / (armMagnitude * verticalMagnitude);
    // Clamp cosAngle to [-1, 1] to avoid potential numerical errors
    const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));
    const angle = Math.acos(clampedCosAngle) * (180 / Math.PI);
    
    // Determine if the arm is to the right or left of vertical
    // to ensure we get the correct angle
    const crossProduct = armVectorX * verticalY - armVectorY * verticalX;
    
    return crossProduct >= 0 ? angle : 360 - angle;
  }
  
  // Main angle calculation function
  function calculateAngle(p1, p2, p3) {
    // For arm raise, we use the special vertical angle calculation
    if (p2 && p3) {
      return calculateVerticalAngle(p2, p2, p3); // Using shoulder and wrist
    } else {
      // Fall back to regular angle calculation if needed
      if (p1.z !== undefined && p2.z !== undefined && p3.z !== undefined) {
        return calculate3DAngle(p1, p2, p3);
      } else {
        return calculate2DAngle(p1, p2, p3);
      }
    }
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
    if (angle < DOWN_THRESHOLD) {
      color = '#f72585'; // Color for arm down
    } else if (angle > UP_THRESHOLD) {
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
      // If angle starts low, then goes above UP_THRESHOLD, then returns below DOWN_THRESHOLD
      if (!leftRepStarted && angle < DOWN_THRESHOLD) {
        // Arm is down, ready to start
        leftRepStarted = 1;
      } else if (leftRepStarted === 1 && angle > UP_THRESHOLD) {
        // Arm is raised
        leftRepStarted = 2;
      } else if (leftRepStarted === 2 && angle < DOWN_THRESHOLD) {
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
      if (!rightRepStarted && angle < DOWN_THRESHOLD) {
        // Arm is down, ready to start
        rightRepStarted = 1;
      } else if (rightRepStarted === 1 && angle > UP_THRESHOLD) {
        // Arm is raised
        rightRepStarted = 2;
      } else if (rightRepStarted === 2 && angle < DOWN_THRESHOLD) {
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
        leftRepStarted = 0;
        rightRepStarted = 0;
        currentLeftAngleMin = 180;
        currentLeftAngleMax = 0;
        currentRightAngleMin = 180;
        currentRightAngleMax = 0;
        
        // Initialize progress bars for the new set
        initRepProgressBars();
        
        // Start the next set
        isAssessmentActive = true;
        statusText.textContent = `Set ${currentSet} of ${targetSets}: Performing arm raises with ${armChoice} arm(s)`;
      }
    }, 1000);
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
  
  function onStart() {
    // read which arm(s)
    for (let radio of armSelectElems) {
      if (radio.checked) {
        armChoice = radio.value;
      }
    }
  
    // Reset counters
    leftCount = 0; 
    rightCount = 0;
    leftRepStarted = 0; 
    rightRepStarted = 0;
    smoothedLeftAngle = 0; 
    smoothedRightAngle = 0;
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
      // For left arm: 11 (shoulder), 13 (elbow), 15 (wrist)
      if (armChoice === "left" || armChoice === "both") {
        const lShoulder = results.poseLandmarks[11];
        const lElbow = results.poseLandmarks[13];
        const lWrist = results.poseLandmarks[15];
  
        if (lShoulder && lElbow && lWrist) {
          // Calculate angle against vertical axis
          const rawLeftAngle = calculateVerticalAngle(lShoulder, lElbow, lWrist);
          smoothedLeftAngle = smoothAngle(smoothedLeftAngle, rawLeftAngle);
  
          // Convert normalized -> pixel
          const sX = lShoulder.x * canvasElement.width;
          const sY = lShoulder.y * canvasElement.height;
  
          // Text at mirrored location
          const textX = canvasElement.width - sX;
          const textY = sY;
  
          // Decide color
          const angleColor = (smoothedLeftAngle < DOWN_THRESHOLD || smoothedLeftAngle > UP_THRESHOLD) ? 
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
          
          canvasCtx.fillStyle = 'rgba(67, 97, 238, 1)';
          canvasCtx.font = 'bold 16px Poppins';
          canvasCtx.fillText(instructionText, textX, textY - 60);
          
          canvasCtx.restore();
  
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
          // Calculate angle against vertical axis
          const rawRightAngle = calculateVerticalAngle(rShoulder, rElbow, rWrist);
          smoothedRightAngle = smoothAngle(smoothedRightAngle, rawRightAngle);
  
          // Convert normalized -> pixel
          const sX = rShoulder.x * canvasElement.width;
          const sY = rShoulder.y * canvasElement.height;
  
          // Text at mirrored location
          const textX = canvasElement.width - sX;
          const textY = sY;
  
          // Decide color
          const angleColor = (smoothedRightAngle < DOWN_THRESHOLD || smoothedRightAngle > UP_THRESHOLD) ? 
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
          
          canvasCtx.fillStyle = 'rgba(67, 97, 238, 1)';
          canvasCtx.font = 'bold 16px Poppins';
          canvasCtx.fillText(instructionText, textX, textY - 60);
          
          canvasCtx.restore();
  
          if (rightCount < targetReps) {
            trackRep(smoothedRightAngle, "right");
          }
        }
      }
  
      // Draw overall instruction at the top of the screen
      canvasCtx.fillStyle = 'rgba(67, 97, 238, 1)';
      canvasCtx.font = 'bold 20px Poppins';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(`Lateral Raises: Lift arms to the side, then lower`, canvasElement.width / 2, 30);
  
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