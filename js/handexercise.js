function onHandStateChange(newState) {
    // If we go from open to closed, that's one complete rep
    if (lastHandState === 'open' && newState === 'closed') {
      repCount++;
      updateRepCount();
      updateProgressIndicators();
      
      // Play a success sound or visual feedback
      createSuccessFeedback();
      
      // Check if exercise is complete
      if (repCount >= targetRepCount) {
        completeExercise();
      }
    }
  }// Hand Opening and Closing Exercise using MediaPipe Hands
  // This script handles the hand opening and closing rehabilitation exercise
  
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
  let handState = 'unknown'; // 'open', 'closed', or 'unknown'
  let lastHandState = 'unknown';
  let exerciseStartTime;
  let exerciseDuration = 0;
  let consecutiveFrames = 0; // Track consecutive frames in a state for debouncing
  const requiredConsecutiveFrames = 5; // How many consecutive frames to confirm a state change
  
  // Rest period variables
  let isResting = false;
  let restTimeRemaining = 0;
  let restInterval;
  const restBetweenSets = 30; // 30 seconds rest between sets
  
  // Finger distance thresholds - IMPROVED VALUES
  const openHandThreshold = 130; // Increased threshold for more reliable open hand detection
  const closedHandThreshold = 60; // Increased threshold for more reliable closed hand detection
  
  // UI Elements
  let repCountDisplay;
  let setsDisplay;
  let statusDisplay;
  let startButton;
  let resetButton;
  let handSelect;
  let progressContainer;
  
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
        
        // Important: Reinitialize the detector when hand selection changes
        reinitializeDetector();
        
        if (document.getElementById('currentHandDisplay')) {
          document.getElementById('currentHandDisplay').textContent = 
            selectedHand.charAt(0).toUpperCase() + selectedHand.slice(1);
        }
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
      
      // Remove the rep count select dropdown since we're removing this option
      const repCountSelect = document.getElementById('repCountSelect');
      if (repCountSelect) {
        const repSelectContainer = repCountSelect.closest('.control-group');
        if (repSelectContainer) {
          repSelectContainer.style.display = 'none';
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
    
    // Log status changes for debugging
    console.log(`Status updated: ${message}`);
  }
  
  // =============================
  // Exercise Control Functions
  // =============================
  function startExercise() {
    if (exerciseActive || isResting) return;
    
    exerciseActive = true;
    exerciseStartTime = Date.now();
    repCount = 0;
    handState = 'unknown';
    lastHandState = 'unknown';
    consecutiveFrames = 0;
    
    // Reset UI
    updateRepCount();
    updateProgressIndicators();
    updateStatus(`Set ${currentSet}/${totalSets}: Open and close your hand to begin`);
    if (startButton) startButton.disabled = true;
    
    // Start session timer
    startSessionTimer();
    
    // Clear any existing rest interval
    if (restInterval) {
      clearInterval(restInterval);
      isResting = false;
    }
  }
  
  function resetExercise() {
    exerciseActive = false;
    repCount = 0;
    handState = 'unknown';
    lastHandState = 'unknown';
    consecutiveFrames = 0;
    
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
        localStorage.setItem('lastHandExerciseSession', 
          `${dateString} ${timeString} - ${repCount} reps × ${totalSets} sets`);
      }
      
      // Play completion sound
      playCompletionSound();
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
        
        // Enable start button for next set
        if (startButton) startButton.disabled = false;
        updateStatus(`Ready for Set ${currentSet}. Press Start to begin.`);
        
        // Play sound to indicate new set is ready
        playReadySound();
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
  
  // Sound functions
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
  
  function playReadySound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 660; // E5 note
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
      }, 300);
    } catch (e) {
      console.log("Audio not supported or blocked");
    }
  }
  
  function playCompletionSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5 note
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
      }, 500);
    } catch (e) {
      console.log("Audio not supported or blocked");
    }
  }
  
  // =============================
  // Hand Detection and Processing
  // =============================
  async function detectHands() {
    async function render() {
      // Clear the canvas
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
          const estimationConfig = {
            flipHorizontal: true, // Flip because we're mirroring
            staticImageMode: false // Set to false for video to improve tracking
          };
          
          hands = await detector.estimateHands(video, estimationConfig);
          
          // Check for correct number of hands detected
          if (selectedHand === 'both' && hands.length < 2) {
            // Not enough hands detected for 'both' mode
            if (!exerciseActive) {
              // Only show warning when not actively exercising
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 40, 400, 80);
              
              ctx.fillStyle = 'white';
              ctx.font = 'bold 20px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(
                `Please show both hands`,
                canvas.width / 2,
                canvas.height / 2
              );
              
              ctx.font = '16px Arial';
              ctx.fillText(
                `${hands.length}/2 hands detected`,
                canvas.width / 2,
                canvas.height / 2 + 30
              );
            }
          } else if (selectedHand !== 'both' && hands.length === 0) {
            // No hands detected for single hand mode
            if (!exerciseActive) {
              // Only show warning when not actively exercising
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 40, 400, 80);
              
              ctx.fillStyle = 'white';
              ctx.font = 'bold 20px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(
                `Please show your ${selectedHand} hand`,
                canvas.width / 2,
                canvas.height / 2
              );
            }
          }
          
          // Draw hands
          drawHands();
          
          // Process hand state if exercise is active
          if (exerciseActive) {
            processHandState();
          }
        }
      } catch (err) {
        console.error("Error detecting hands:", err);
      }
      
      // Display current hand state
      if (exerciseActive) {
        displayHandState();
      }
      
      requestAnimationFrame(render);
    }
    
    render();
  }
  
  function drawHands() {
    if (hands.length === 0) return;
    
    // Display how many hands detected
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Hands detected: ${hands.length}`, 10, canvas.height - 70);
    
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
        
        // Add shadow for depth
        ctx.shadowColor = pointColor;
        ctx.shadowBlur = 5;
        
        // Draw keypoint
        ctx.fillStyle = isFingertip ? 'white' : pointColor;
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Label fingertips
        if (isFingertip) {
          const fingerNames = ['thumb', 'index', 'middle', 'ring', 'pinky'];
          const fingerIndex = [4, 8, 12, 16, 20].indexOf(index);
          
          if (fingerIndex !== -1) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(fingerNames[fingerIndex], keypoint.x, keypoint.y - 15);
          }
        }
      });
      
      // Add a label for which hand this is
      const wrist = hand.keypoints[0];
      if (wrist) {
        ctx.fillStyle = color;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${handedness.toUpperCase()} HAND`, 
          wrist.x, 
          wrist.y + 30
        );
      }
    });
  }
  
  function processHandState() {
    // Check if we have any hands detected
    if (hands.length === 0) {
      handState = 'unknown';
      consecutiveFrames = 0;
      return;
    }
    
    // Variables to track state across hands
    let handsToProcess = [];
    
    // Determine which hands to process based on selection
    if (selectedHand === 'both') {
      // Process all detected hands (up to 2)
      handsToProcess = hands;
    } else {
      // Find hand(s) matching the selected side
      const matchingHand = hands.find(hand => hand.handedness.toLowerCase() === selectedHand);
      if (matchingHand) {
        handsToProcess.push(matchingHand);
      }
    }
    
    if (handsToProcess.length === 0) {
      // No matching hand found
      handState = 'unknown';
      consecutiveFrames = 0;
      return;
    }
    
    // Process each relevant hand
    let handStates = [];
    
    handsToProcess.forEach((hand, index) => {
      // Process this hand and get its state
      const handResult = processIndividualHand(hand, index);
      if (handResult) {
        handStates.push(handResult);
      }
    });
    
    // Combine results from all hands
    if (handStates.length === 0) {
      handState = 'unknown';
      consecutiveFrames = 0;
      return;
    }
    
    // For "both" hands mode, require both hands to be in same state
    // For single hand mode, just use the state of the processed hand
    let currentState;
    
    if (selectedHand === 'both' && handStates.length > 1) {
      // Check if both hands are in the same state
      if (handStates[0].state === handStates[1].state) {
        currentState = handStates[0].state;
      } else {
        // Hands are in different states, consider unknown
        currentState = 'unknown';
      }
      
      // Display combined state
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Combined state: ${currentState}`, 10, canvas.height - 20);
    } else {
      // Single hand mode or only one hand detected in both mode
      currentState = handStates[0].state;
    }
    
    // Use consecutive frames for state change to avoid flickering
    if (currentState === handState) {
      consecutiveFrames++;
    } else {
      consecutiveFrames = 0;
      handState = currentState;
    }
    
    // If we have enough consecutive frames in a state, confirm the change
    if (consecutiveFrames >= requiredConsecutiveFrames) {
      if (handState !== lastHandState) {
        onHandStateChange(handState);
        lastHandState = handState;
      }
    }
    
    // Debug: show current state and frames
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Hand state: ${handState} (${consecutiveFrames}/${requiredConsecutiveFrames})`, 10, canvas.height - 40);
  }
  
  // Process a single hand and return its state
  function processIndividualHand(hand, handIndex) {
    // Get handedness
    const handedness = hand.handedness.toLowerCase();
    
    // IMPROVED HAND DETECTION - Use different approach
    // Get all fingertips and base positions
    const thumbTip = hand.keypoints[4]; // Thumb tip
    const indexTip = hand.keypoints[8]; // Index fingertip
    const middleTip = hand.keypoints[12]; // Middle fingertip
    const ringTip = hand.keypoints[16]; // Ring fingertip
    const pinkyTip = hand.keypoints[20]; // Pinky fingertip
    
    // Get palm center (average of metacarpal joints)
    const indexBase = hand.keypoints[5]; // Index metacarpal
    const middleBase = hand.keypoints[9]; // Middle metacarpal
    const ringBase = hand.keypoints[13]; // Ring metacarpal
    const pinkyBase = hand.keypoints[17]; // Pinky metacarpal
    
    if (!indexBase || !middleBase || !ringBase || !pinkyBase || 
        !thumbTip || !indexTip || !middleTip || !ringTip || !pinkyTip) {
      return { state: 'unknown' };
    }
    
    // Calculate palm center
    const palmCenter = {
      x: (indexBase.x + middleBase.x + ringBase.x + pinkyBase.x) / 4,
      y: (indexBase.y + middleBase.y + ringBase.y + pinkyBase.y) / 4
    };
    
    // Calculate distances from fingertips to palm center
    const distances = [
      { finger: 'thumb', distance: calculateDistance(thumbTip, palmCenter) },
      { finger: 'index', distance: calculateDistance(indexTip, palmCenter) },
      { finger: 'middle', distance: calculateDistance(middleTip, palmCenter) },
      { finger: 'ring', distance: calculateDistance(ringTip, palmCenter) },
      { finger: 'pinky', distance: calculateDistance(pinkyTip, palmCenter) }
    ];
    
    // Calculate ratios between fingertip-palm distances and hand size
    // Using distance between index base and pinky base as hand size reference
    const handWidth = calculateDistance(indexBase, pinkyBase);
    
    // Normalize distances by hand width
    distances.forEach(item => {
      item.ratio = item.distance / handWidth;
    });
    
    // Calculate average ratio
    const avgRatio = distances.reduce((sum, item) => sum + item.ratio, 0) / distances.length;
    
    // Debug: show the distances on screen at appropriate position based on hand index
    const xOffset = handIndex * 120;
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    // Label which hand we're showing data for
    ctx.fillText(`${handedness.toUpperCase()} HAND:`, 10 + xOffset, 20);
    
    // Show ratios for each finger
    distances.forEach((item, index) => {
      ctx.fillText(`${item.finger}: ${item.ratio.toFixed(2)}`, 10 + xOffset, 40 + index * 20);
    });
    
    // Show average ratio
    ctx.fillText(`Avg ratio: ${avgRatio.toFixed(2)}`, 10 + xOffset, 140);
    
    // Determine hand state based on normalized ratios
    let handState = 'unknown';
    
    if (avgRatio > 1.2) {
      handState = 'open';
    } else if (avgRatio < 0.8) {
      handState = 'closed';
    }
    
    // Show state for this hand
    ctx.fillText(`State: ${handState}`, 10 + xOffset, 160);
    
    // Visualize the palm center with color based on hand
    ctx.fillStyle = handedness === 'left' ? 'orange' : 'cyan';
    ctx.beginPath();
    ctx.arc(palmCenter.x, palmCenter.y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add text label for the hand
    ctx.fillStyle = 'white';
    ctx.fillText(handedness.toUpperCase(), palmCenter.x, palmCenter.y - 15);
    
    return {
      handedness,
      state: handState,
      avgRatio
    };
  }
  
  function displayHandState() {
    // Background for state display
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(canvas.width / 2 - 120, 20, 240, 60);
    
    // Draw state icon and text
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    
    if (handState === 'open') {
      ctx.fillStyle = "#4CAF50"; // Green
      ctx.fillText("✋ OPEN", canvas.width / 2, 60);
    } else if (handState === 'closed') {
      ctx.fillStyle = "#FF5722"; // Orange
      ctx.fillText("✊ CLOSED", canvas.width / 2, 60);
    } else {
      ctx.fillStyle = "#FFFFFF"; // White
      ctx.fillText("👋 WAITING", canvas.width / 2, 60);
    }
    
    // Draw rep instructions
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(canvas.width / 2 - 230, canvas.height - 50, 460, 40);
    
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    
    let handInstructions = '';
    if (selectedHand === 'both') {
      handInstructions = "Open and close both hands together";
    } else {
      handInstructions = `Open and close your ${selectedHand} hand`;
    }
    
    ctx.fillText(
      `${handInstructions} - ${repCount} of ${targetRepCount} reps completed`,
      canvas.width / 2,
      canvas.height - 25
    );
  }
  
  function createSuccessFeedback() {
    // Visual feedback - pulse effect on the progress indicator
    const indicators = document.querySelectorAll('.rep-indicator');
    if (indicators && indicators[repCount - 1]) {
      indicators[repCount - 1].classList.add('success-pulse');
      setTimeout(() => {
        indicators[repCount - 1].classList.remove('success-pulse');
      }, 1000);
    }
    
    // Sound feedback could be added here
    // const successSound = new Audio('success.mp3');
    // successSound.play();
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
  window.onload = function() {
    // Initialize the hand tracking
    initializeHandTracking();
    
    // Hide rep count selection dropdown
    const repCountSelect = document.getElementById('repCountSelect');
    if (repCountSelect) {
      const repSelectContainer = repCountSelect.closest('.control-group');
      if (repSelectContainer) {
        repSelectContainer.style.display = 'none';
      }
    }
  };