name: "Chair Squat (Partial)",
            image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22240%22%20height%3D%22240%22%2F%3E%3Ctext%20fill%3D%22%232c3e50%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20x%3D%22120%22%20y%3D%2230%22%20text-anchor%3D%22middle%22%3EChair%20Squat%3C%2Ftext%3E%3Cpath%20d%3D%22M120%2050%20L120%20150%20M120%2080%20L80%20110%20M120%2080%20L160%20110%20M120%20150%20L100%20240%20M120%20150%20L140%20240%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Ccircle%20cx%3D%22120%22%20cy%3D%2250%22%20r%3D%2210%22%20fill%3D%22%233498db%22%2F%3E%3C%2Fsvg%3E",
            instructions: "Perform a partial squat as if sitting down in a chair",
            checkFunction: (keypoints) => {
                return checkChairSquat(keypoints);
            }
        },
        {
            name: "Weight Shift",
            image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22240%22%20height%3D%22240%22%2F%3E%3Ctext%20fill%3D%22%232c3e50%22%20font-family%3D%22Arial%22%20font-size%3D%2224%22%20x%3D%22120%22%20y%3D%2230%22%20text-anchor%3D%22middle%22%3EWeight%20Shift%3C%2Ftext%3E%3Cpath%20d%3D%22M140%2050%20L140%20180%20M140%2080%20L100%20110%20M140%2080%20L180%20110%20M140%20180%20L100%20240%20M140%20180%20L160%20240%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%2250%22%20r%3D%2210%22%20fill%3D%22%233498db%22%2F%3E%3C%2Fsvg%3E",
            instructions: "Shift your weight to one side",
            checkFunction: (keypoints) => {
                return checkWeightShift(keypoints);
            }
        },
        {
            name: "Diagonal Reach",
            image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22240%22%20height%3D%22240%22%2F%3E%3Ctext%20fill%3D%22%232c3e50%22%20font-family%3D%22Arial%22%20font-size%3D%2224%22%20x%3D%22120%22%20y%3D%2230%22%20text-anchor%3D%22middle%22%3EDiagonal%20Reach%3C%2Ftext%3E%3Cpath%20d%3D%22M120%2050%20L120%20180%20M120%2080%20L60%2040%20M120%2080%20L160%20110%20M120%20180%20L100%20240%20M120%20180%20L140%20240%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Ccircle%20cx%3D%22120%22%20cy%3D%2250%22%20r%3D%2210%22%20fill%3D%22%233498db%22%2F%3E%3C%2Fsvg%3E",
            instructions: "Reach diagonally upward with one arm",
            checkFunction: (keypoints) => {
                return checkDiagonalReach(keypoints);
            }
        }
    ],
    advanced: [
        {
            name: "Standing Leg Lift",
            image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22240%22%20height%3D%22240%22%2F%3E%3Ctext%20fill%3D%22%232c3e50%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20x%3D%22120%22%20y%3D%2230%22%20text-anchor%3D%22middle%22%3EStanding%20Leg%20Lift%3C%2Ftext%3E%3Cpath%20d%3D%22M120%2050%20L120%20180%20M120%2080%20L80%20110%20M120%2080%20L160%20110%20M120%20180%20L120%20240%20M120%20180%20L160%20180%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Ccircle%20cx%3D%22120%22%20cy%3D%2250%22%20r%3D%2210%22%20fill%3D%22%233498db%22%2F%3E%3C%2Fsvg%3E",
            instructions: "While standing, lift one leg to the side",
            checkFunction: (keypoints) => {
                return checkStandingLegLift(keypoints);
            }
        },
        {
            name: "Double Arm Raise",
            image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22240%22%20height%3D%22240%22%2F%3E%3Ctext%20fill%3D%22%232c3e50%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20x%3D%22120%22%20y%3D%2230%22%20text-anchor%3D%22middle%22%3EDouble%20Arm%20Raise%3C%2Ftext%3E%3Cpath%20d%3D%22M120%2050%20L120%20180%20M120%2080%20L60%2040%20M120%2080%20L180%2040%20M120%20180%20L100%20240%20M120%20180%20L140%20240%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Ccircle%20cx%3D%22120%22%20cy%3D%2250%22%20r%3D%2210%22%20fill%3D%22%233498db%22%2F%3E%3C%2Fsvg%3E",
            instructions: "Raise both arms out to the sides and upward",
            checkFunction: (keypoints) => {
                return checkDoubleArmRaise(keypoints);
            }
        },
        {
            name: "Standing Toe Raise",
            image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22240%22%20height%3D%22240%22%2F%3E%3Ctext%20fill%3D%22%232c3e50%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20x%3D%22120%22%20y%3D%2230%22%20text-anchor%3D%22middle%22%3EStanding%20Toe%20Raise%3C%2Ftext%3E%3Cpath%20d%3D%22M120%2050%20L120%20180%20M120%2080%20L80%20110%20M120%2080%20L160%20110%20M120%20180%20L100%20220%20M120%20180%20L140%20220%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Ccircle%20cx%3D%22120%22%20cy%3D%2250%22%20r%3D%2210%22%20fill%3D%22%233498db%22%2F%3E%3C%2Fsvg%3E",
            instructions: "Rise up onto your toes while standing",
            checkFunction: (keypoints) => {
                return checkToeRaise(keypoints);
            }
        },
        {
            name: "Cross-Body Reach",
            image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22240%22%20height%3D%22240%22%2F%3E%3Ctext%20fill%3D%22%232c3e50%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20x%3D%22120%22%20y%3D%2230%22%20text-anchor%3D%22middle%22%3ECross-Body%20Reach%3C%2Ftext%3E%3Cpath%20d%3D%22M120%2050%20L120%20180%20M120%2080%20L170%20110%20M120%2080%20L70%2060%20M120%20180%20L100%20240%20M120%20180%20L140%20240%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Ccircle%20cx%3D%22120%22%20cy%3D%2250%22%20r%3D%2210%22%20fill%3D%22%233498db%22%2F%3E%3C%2Fsvg%3E",
            instructions: "Reach across your body with one arm",
            checkFunction: (keypoints) => {
                return checkCrossBodyReach(keypoints);
            }
        },
        {
            name: "Step Forward",
            image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22240%22%20height%3D%22240%22%2F%3E%3Ctext%20fill%3D%22%232c3e50%22%20font-family%3D%22Arial%22%20font-size%3D%2224%22%20x%3D%22120%22%20y%3D%2230%22%20text-anchor%3D%22middle%22%3EStep%20Forward%3C%2Ftext%3E%3Cpath%20d%3D%22M120%2050%20L120%20180%20M120%2080%20L80%20110%20M120%2080%20L160%20110%20M120%20180%20L80%20230%20M120%20180%20L150%20200%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Ccircle%20cx%3D%22120%22%20cy%3D%2250%22%20r%3D%2210%22%20fill%3D%22%233498db%22%2F%3E%3C%2Fsvg%3E",
            instructions: "Take a small step forward with one foot",
            checkFunction: (keypoints) => {
                return checkStepForward(keypoints);
            }
        }
    ]
};

// =============================
// Initialize the Application
// =============================
async function initializeApp() {
    // Get UI elements
    startButton = document.getElementById('startButton');
    skipButton = document.getElementById('skipButton');
    difficultySelect = document.getElementById('difficultySelect');
    poseName = document.getElementById('poseName');
    poseImage = document.getElementById('poseImage');
    timerDisplay = document.getElementById('timer');
    scoreDisplay = document.getElementById('scoreDisplay');
    roundDisplay = document.getElementById('roundDisplay');
    feedbackDisplay = document.getElementById('feedback');
    simonSaysIndicator = document.getElementById('simonSaysIndicator');
    resultsTable = document.getElementById('resultsTable');
    debugPanel = document.getElementById('debugPanel');
    debugToggle = document.getElementById('debugToggle');
    
    // Disable buttons until model is loaded
    if (startButton) startButton.disabled = true;
    if (skipButton) skipButton.disabled = true;
    
    // Add event listeners
    if (startButton) startButton.addEventListener('click', toggleGameState);
    if (skipButton) skipButton.addEventListener('click', skipPose);
    if (difficultySelect) {
        difficultySelect.addEventListener('change', (e) => {
            difficulty = e.target.value;
            updateDifficultySettings();
        });
    }
    if (debugToggle) {
        debugToggle.addEventListener('click', toggleDebugMode);
    }
    
    // Create canvas for rendering
    const videoContainer = document.getElementById('videoContainer');
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
        
        // Update status
        updateFeedback('warning', 'Loading pose detection model...');
        
        // Show loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Wait for video to be ready
        video.onloadedmetadata = async () => {
            try {
                // Initialize detector
                await initializePoseDetector();
                
                // Enable start button once model is loaded
                if (startButton) startButton.disabled = false;
                updateFeedback('warning', 'Ready! Select a level and press Start to begin.');
                
                // Hide loading overlay
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                
                // Start the detection loop
                detectPoses();
                
            } catch (err) {
                console.error("Error initializing pose detector:", err);
                updateFeedback('error', 'Error loading pose detector. Please refresh the page.');
                
                // Update loading overlay to show error
                if (loadingOverlay) {
                    loadingOverlay.innerHTML = '<p>Error loading model. Please refresh the page.</p>';
                }
            }
        };
        
    } catch (err) {
        console.error("Error accessing webcam:", err);
        updateFeedback('error', 'Error accessing webcam. Please check permissions.');
    }
}

// Initialize MediaPipe Pose detector
async function initializePoseDetector() {
    // Load MediaPipe Pose model
    const model = poseDetection.SupportedModels.BlazePose;
    const detectorConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose',
        modelType: 'lite' // Use lite for better performance
    };
    
    console.log("Initializing pose detector");
    detector = await poseDetection.createDetector(model, detectorConfig);
}

// =============================
// Game Control Functions
// =============================
function toggleGameState() {
    if (gameActive) {
        // Stop the game
        endGame();
        startButton.textContent = "Start Exercise";
        skipButton.disabled = true;
    } else {
        // Start the game
        startGame();
        startButton.textContent = "Stop Exercise";
        skipButton.disabled = false;
    }
}

function startGame() {
    gameActive = true;
    score = 0;
    currentRound = 0;
    results = [];
    
    // Update UI
    updateScoreDisplay();
    updateRoundDisplay();
    clearResultsTable();
    
    // Select first pose
    selectNextPose();
    
    // Disable difficulty selection during game
    if (difficultySelect) difficultySelect.disabled = true;
}

function endGame() {
    gameActive = false;
    
    // Clear any active timers
    if (poseTimer) {
        clearTimeout(poseTimer);
        poseTimer = null;
    }
    
    // Update UI
    updateFeedback('warning', 'Exercise session ended. Press Start to begin again.');
    
    // Reset timer display
    updateTimerDisplay(0);
    
    // Re-enable difficulty selection
    if (difficultySelect) difficultySelect.disabled = false;
}

function skipPose() {
    if (!gameActive) return;
    
    // Record as skipped in results
    recordResult(currentPose.name, 'Skipped', 0);
    
    // Move to next pose
    selectNextPose();
}

function selectNextPose() {
    currentRound++;
    
    // Check if we've reached the end of the game
    if (currentRound > totalRounds) {
        completeGame();
        return;
    }
    
    // Update round display
    updateRoundDisplay();
    
    // Randomly select a pose from the current difficulty level
    const availablePoses = rehabExercises[difficulty];
    const randomIndex = Math.floor(Math.random() * availablePoses.length);
    currentPose = availablePoses[randomIndex];
    
    // Decide if this is a Simon Says round (70% chance)
    currentlySaysSimon = Math.random() < 0.7;
    
    // Update UI
    poseName.textContent = currentPose.name;
    poseImage.src = currentPose.image;
    
    // Update Simon Says indicator
    updateSimonSaysIndicator();
    
    // Reset pose detection state
    poseDetected = false;
    
    // Start pose timer
    poseStartTime = Date.now();
    updateTimerDisplay(poseDuration);
    
    // Set timeout for pose duration
    if (poseTimer) {
        clearTimeout(poseTimer);
    }
    
    poseTimer = setTimeout(() => {
        // Time's up for this pose
        if (poseDetected) {
            // Already detected and scored
            return;
        }
        
        // Record as timeout
        recordResult(currentPose.name, 'Timeout', 0);
        
        // Move to next pose
        selectNextPose();
    }, poseDuration);
    
    // Update feedback with instructions
    if (currentlySaysSimon) {
        updateFeedback('warning', `${currentPose.instructions}`);
    } else {
        updateFeedback('warning', `Do NOT do this movement unless Simon says so!`);
    }
}

function completeGame() {
    gameActive = false;
    
    // Clear any active timers
    if (poseTimer) {
        clearTimeout(poseTimer);
        poseTimer = null;
    }
    
    // Update UI
    poseName.textContent = "Exercise Complete!";
    poseImage.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22240%22%20height%3D%22240%22%2F%3E%3Ctext%20fill%3D%22%232c3e50%22%20font-family%3D%22Arial%22%20font-size%3D%2230%22%20x%3D%22120%22%20y%3D%22120%22%20text-anchor%3D%22middle%22%3EComplete!%3C%2Ftext%3E%3Ctext%20fill%3D%22%233498db%22%20font-family%3D%22Arial%22%20font-size%3D%2250%22%20x%3D%22120%22%20y%3D%22180%22%20text-anchor%3D%22middle%22%3E%E2%9C%93%3C%2Ftext%3E%3C%2Fsvg%3E";
    updateFeedback('success', `Great job! You completed all ${totalRounds} exercises with a score of ${score}!`);
    simonSaysIndicator.textContent = "Session Complete";
    simonSaysIndicator.classList.remove('active', 'inactive');
    
    // Reset UI
    startButton.textContent = "Start Exercise";
    skipButton.disabled = true;
    
    // Re-enable difficulty selection
    if (difficultySelect) difficultySelect.disabled = false;
}

function updateDifficultySettings() {
    // Adjust pose duration based on difficulty
    switch (difficulty) {
        case 'beginner':
            poseDuration = 8000; // More time for beginners
            totalRounds = 6;     // Fewer rounds
            break;
        case 'intermediate':
            poseDuration = 6000; // Standard time
            totalRounds = 8;     // Standard rounds
            break;
        case 'advanced':
            poseDuration = 5000; // Less time for advanced
            totalRounds = 10;    // More rounds
            break;
    }
    
    // Update UI
    updateFeedback('warning', `Level set to ${difficultySelect.options[difficultySelect.selectedIndex].text}`);
}

function toggleDebugMode() {
    debugMode = !debugMode;
    
    if (debugPanel) {
        debugPanel.style.display = debugMode ? 'block' : 'none';
    }
    
    if (debugToggle) {
        debugToggle.textContent = debugMode ? 'Hide Debug' : 'Show Debug';
    }
}

// =============================
// UI Update Functions
// =============================
function updateScoreDisplay() {
    if (scoreDisplay) {
        scoreDisplay.textContent = `Score: ${score}`;
    }
}

function updateRoundDisplay() {
    if (roundDisplay) {
        roundDisplay.textContent = `Round: ${currentRound}/${totalRounds}`;
    }
}

function updateTimerDisplay(duration) {
    if (!timerDisplay) return;
    
    // Calculate remaining time
    const current = Date.now();
    const elapsed = current - poseStartTime;
    const remaining = Math.max(0, duration - elapsed);
    
    // Convert to seconds
    const seconds = Math.ceil(remaining / 1000);
    
    // Format display
    timerDisplay.textContent = `${seconds}`;
    
    // Schedule next update if still active
    if (gameActive && remaining > 0) {
        requestAnimationFrame(() => updateTimerDisplay(duration));
    }
}

function updateFeedback(type, message) {
    if (!feedbackDisplay) return;
    
    // Remove all classes
    feedbackDisplay.classList.remove('success', 'warning', 'error');
    
    // Add appropriate class
    if (type === 'success') {
        feedbackDisplay.classList.add('success');
    } else if (type === 'warning') {
        feedbackDisplay.classList.add('warning');
    } else if (type === 'error') {
        feedbackDisplay.classList.add('error');
    }
    
    // Update text
    feedbackDisplay.textContent = message;
}

function updateSimonSaysIndicator() {
    if (!simonSaysIndicator) return;
    
    if (currentlySaysSimon) {
        simonSaysIndicator.textContent = "Simon Says";
        simonSaysIndicator.classList.add('active');
        simonSaysIndicator.classList.remove('inactive');
    } else {
        simonSaysIndicator.textContent = "Simon Doesn't Say";
        simonSaysIndicator.classList.add('inactive');
        simonSaysIndicator.classList.remove('active');
    }
}

function clearResultsTable() {
    if (resultsTable) {
        resultsTable.innerHTML = '';
    }
}

function recordResult(poseName, status, points) {
    // Add to results array
    results.push({
        round: currentRound,
        pose: poseName,
        status: status,
        points: points
    });
    
    // Update results table
    if (resultsTable) {
        const row = document.createElement('tr');
        
        const roundCell = document.createElement('td');
        roundCell.textContent = currentRound;
        row.appendChild(roundCell);
        
        const poseCell = document.createElement('td');
        poseCell.textContent = poseName;
        row.appendChild(poseCell);
        
        const statusCell = document.createElement('td');
        statusCell.textContent = status;
        row.appendChild(statusCell);
        
        const pointsCell = document.createElement('td');
        pointsCell.textContent = points;
        row.appendChild(pointsCell);
        
        resultsTable.appendChild(row);
    }
    
    // Update score
    score += points;
    updateScoreDisplay();
}

// =============================
// Pose Detection Functions
// =============================
async function detectPoses() {
    async function render() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw mirrored video
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        
        try {
            if (detector) {
                // Estimate poses with MediaPipe
                const estimationConfig = {
                    flipHorizontal: true // Flip because we're mirroring
                };
                
                poses = await detector.estimateHands(video, estimationConfig);
                
                if (gameActive && currentPose) {
                    // If Simon Says and pose not yet detected, check for match
                    if (!poseDetected) {
                        checkForPoseMatch();
                    }
                }
                
                // Draw the detected pose
                drawPose();
                
                // Update debug info if enabled
                if (debugMode) {
                    updateDebugInfo();
                }
            }
        } catch (err) {
            console.error("Error detecting poses:", err);
        }
        
        requestAnimationFrame(render);
    }
    
    render();
}

function checkForPoseMatch() {
    if (poses.length === 0) return;
    
    // Get the pose with highest confidence
    const pose = poses[0];
    
    // Skip if pose confidence is too low
    if (pose.score < minPoseConfidence) return;
    
    // Extract keypoints
    const keypoints = pose.keypoints;
    
    // Check if the pose matches the current exercise
    const matchesTargetPose = currentPose.checkFunction(keypoints);
    
    // Simon Says logic
    if (matchesTargetPose) {
        if (currentlySaysSimon) {
            // Correct - following Simon's instruction
            poseDetected = true;
            const pointsEarned = 10;
            recordResult(currentPose.name, 'Correct', pointsEarned);
            updateFeedback('success', `Great job! You correctly performed the ${currentPose.name}. +${pointsEarned} points!`);
            playSuccessSound();
            
            // Clear pose timer
            if (poseTimer) {
                clearTimeout(poseTimer);
            }
            
            // Wait a moment before moving to next pose
            setTimeout(() => {
                if (gameActive) {
                    selectNextPose();
                }
            }, 1500);
        } else {
            // Incorrect - doing the movement when Simon didn't say
            poseDetected = true;
            recordResult(currentPose.name, 'Incorrect', 0);
            updateFeedback('error', `Oops! Simon didn't say to do this movement. No points awarded.`);
            playErrorSound();
            
            // Clear pose timer
            if (poseTimer) {
                clearTimeout(poseTimer);
            }
            
            // Wait a moment before moving to next pose
            setTimeout(() => {
                if (gameActive) {
                    selectNextPose();
                }
            }, 1500);
        }
    }
}

function drawPose() {
    if (poses.length === 0) return;
    
    const pose = poses[0];
    
    // Draw connections between keypoints
    const connections = [
        // Face
        ['nose', 'left_eye_inner'],
        ['left_eye_inner', 'left_eye'],
        ['left_eye', 'left_eye_outer'],
        ['left_eye_outer', 'left_ear'],
        ['nose', 'right_eye_inner'],
        ['right_eye_inner', 'right_eye'],
        ['right_eye', 'right_eye_outer'],
        ['right_eye_outer', 'right_ear'],
        ['mouth_left', 'mouth_right'],
        
        // Upper body
        ['left_shoulder', 'right_shoulder'],
        ['left_shoulder', 'left_elbow'],
        ['left_elbow', 'left_wrist'],
        ['right_shoulder', 'right_elbow'],
        ['right_elbow', 'right_wrist'],
        
        // Torso
        ['left_shoulder', 'left_hip'],
        ['right_shoulder', 'right_hip'],
        ['left_hip', 'right_hip'],
        
        // Lower body
        ['left_hip', 'left_knee'],
        ['left_knee', 'left_ankle'],
        ['right_hip', 'right_knee'],
        ['right_knee', 'right_ankle']
    ];
    
    // Create a map of keypoint names to indices
    const keypointMap = {};
    pose.keypoints.forEach((keypoint, index) => {
        keypointMap[keypoint.name] = index;
    });
    
    // Draw connections
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 4;
    
    connections.forEach(([startPoint, endPoint]) => {
        if (keypointMap[startPoint] !== undefined && keypointMap[endPoint] !== undefined) {
            const start = pose.keypoints[keypointMap[startPoint]];
            const end = pose.keypoints[keypointMap[endPoint]];
            
            if (start.score >= minKeypointConfidence && end.score >= minKeypointConfidence) {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
            }
        }
    });
    
    // Draw keypoints
    pose.keypoints.forEach(keypoint => {
        if (keypoint.score >= minKeypointConfidence) {
            // Different colors for different body parts
            let color = '#3498db'; // Default blue
            
            if (keypoint.name.includes('shoulder') || keypoint.name.includes('elbow') || keypoint.name.includes('wrist')) {
                color = '#e74c3c'; // Red for arms
            } else if (keypoint.name.includes('hip') || keypoint.name.includes('knee') || keypoint.name.includes('ankle')) {
                color = '#2ecc71'; // Green for legs
            } else if (keypoint.name.includes('eye') || keypoint.name.includes('nose') || keypoint.name.includes('ear')) {
                color = '#f39c12'; // Orange for face
            }
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
}

function updateDebugInfo() {
    if (!debugPanel || poses.length === 0) return;
    
    const pose = poses[0];
    
    // Format debug info
    let debugInfo = `Pose Score: ${pose.score.toFixed(2)}<br>`;
    debugInfo += `Current Exercise: ${currentPose ? currentPose.name : 'None'}<br>`;
    debugInfo += `Simon Says: ${currentlySaysSimon ? 'Yes' : 'No'}<br>`;
    debugInfo += `Current Round: ${currentRound}/${totalRounds}<br>`;
    debugInfo += `Score: ${score}<br>`;
    debugInfo += `Pose Detected: ${poseDetected ? 'Yes' : 'No'}<br>`;
    
    // Display keypoint information for specific joints
    const keyJoints = ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'];
    
    debugInfo += '<br>Key Joints:<br>';
    
    keyJoints.forEach(jointName => {
        const joint = pose.keypoints.find(kp => kp.name === jointName);
        if (joint) {
            debugInfo += `${jointName}: (${Math.round(joint.x)}, ${Math.round(joint.y)}) - ${joint.score.toFixed(2)}<br>`;
        }
    });
    
    // Update debug panel
    debugPanel.innerHTML = debugInfo;
}

// =============================
// Exercise Checking Functions
// =============================

// Function to check for arm raise to front
function checkArmRaiseFront(keypoints) {
    // Find required keypoints
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const leftElbow = findKeypoint(keypoints, 'left_elbow');
    const rightElbow = findKeypoint(keypoints, 'right_elbow');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    // Skip if any keypoints are missing
    if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow || !leftWrist || !rightWrist) {
        return false;
    }
    
    // Check if either arm is raised to front at approximately shoulder height
    // First check left arm
    const leftArmRaised = (
        leftWrist.y < leftShoulder.y && // Wrist is higher than shoulder
        Math.abs(leftWrist.y - leftShoulder.y) > 50 && // Raised significantly
        Math.abs(leftWrist.x - leftShoulder.x) < 100 // Not too far to the side
    );
    
    // Then check right arm
    const rightArmRaised = (
        rightWrist.y < rightShoulder.y && // Wrist is higher than shoulder
        Math.abs(rightWrist.y - rightShoulder.y) > 50 && // Raised significantly 
        Math.abs(rightWrist.x - rightShoulder.x) < 100 // Not too far to the side
    );
    
    // Return true if either arm is in the correct position
    return leftArmRaised || rightArmRaised;
}

// Function to check for shoulder shrug
function checkShoulderShrug(keypoints) {
    // Find required keypoints
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const leftEar = findKeypoint(keypoints, 'left_ear');
    const rightEar = findKeypoint(keypoints, 'right_ear');
    
    // Skip if any keypoints are missing
    if (!leftShoulder || !rightShoulder || !leftEar || !rightEar) {
        return false;
    }
    
    // Check if shoulders are raised (closer to ears than normal)
    const leftShoulderRaised = (leftEar.y - leftShoulder.y) < 120; // Reduced distance between ear and shoulder
    const rightShoulderRaised = (rightEar.y - rightShoulder.y) < 120;
    
    // Both shoulders should be raised for a proper shrug
    return leftShoulderRaised && rightShoulderRaised;
}

// Function to check for seated knee lift
function checkKneeLift(keypoints) {
    // Find required keypoints
    const leftHip = findKeypoint(keypoints, 'left_hip');
    const rightHip = findKeypoint(keypoints, 'right_hip');
    const leftKnee = findKeypoint(keypoints, 'left_knee');
    const rightKnee = findKeypoint(keypoints, 'right_knee');
    
    // Skip if any keypoints are missing
    if (!leftHip || !rightHip || !leftKnee || !rightKnee) {
        return false;
    }
    
    // Check if either knee is lifted (higher than hip)
    const leftKneeLift = leftKnee.y < leftHip.y - 30; // Knee is higher than hip
    const rightKneeLift = rightKnee.y < rightHip.y - 30;
    
    // Return true if either knee is lifted
    return leftKneeLift || rightKneeLift;
}

// Function to check for head turn
function checkHeadTurn(keypoints) {
    // Find required keypoints
    const nose = findKeypoint(keypoints, 'nose');
    const leftEar = findKeypoint(keypoints, 'left_ear');
    const rightEar = findKeypoint(keypoints, 'right_ear');
    
    // Skip if any keypoints are missing
    if (!nose || !leftEar || !rightEar) {
        return false;
    }
    
    // Check if head is turned to either side
    // When head turns right, the left ear becomes more visible and the right ear less visible
    // When head turns left, the right ear becomes more visible and the left ear less visible
    
    // Calculate ear visibility difference
    const leftEarVisible = leftEar.score > 0.7;
    const rightEarVisible = rightEar.score > 0.7;
    
    // Check if nose is closer to one ear (indicating a turn)
    const noseToLeftEarX = Math.abs(nose.x - leftEar.x);
    const noseToRightEarX = Math.abs(nose.x - rightEar.x);
    
    const headTurned = Math.abs(noseToLeftEarX - noseToRightEarX) > 20;
    
    return headTurned || (leftEarVisible && !rightEarVisible) || (!leftEarVisible && rightEarVisible);
}

// Function to check for wrist extension
function checkWristExtension(keypoints) {
    // Find required keypoints
    const leftElbow = findKeypoint(keypoints, 'left_elbow');
    const rightElbow = findKeypoint(keypoints, 'right_elbow');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    // Skip if any keypoints are missing
    if (!leftElbow || !rightElbow || !leftWrist || !rightWrist) {
        return false;
    }
    
    // Check if either arm has elbow bent and wrist extended
    // This is difficult to detect precisely with MediaPipe, so we'll check for approximate positioning
    
    // Check left arm
    const leftArmBent = Math.abs(leftElbow.y - leftWrist.y) < 50; // Wrist and elbow at similar height
    
    // Check right arm
    const rightArmBent = Math.abs(rightElbow.y - rightWrist.y) < 50;
    
    // Return true if either arm is in position
    return leftArmBent || rightArmBent;
}

// Function to check for arm raise to side
function checkArmRaiseSide(keypoints) {
    // Find required keypoints
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const leftElbow = findKeypoint(keypoints, 'left_elbow');
    const rightElbow = findKeypoint(keypoints, 'right_elbow');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    // Skip if any keypoints are missing
    if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow || !leftWrist || !rightWrist) {
        return false;
    }
    
    // Check if either arm is raised to the side at approximately shoulder height
    
    // Left arm check
    const leftArmRaised = (
        Math.abs(leftWrist.y - leftShoulder.y) < 30 && // Wrist at shoulder height
        leftWrist.x < leftShoulder.x - 50 // Wrist is to the left of shoulder (extended outward)
    );
    
    // Right arm check
    const rightArmRaised = (
        Math.abs(rightWrist.y - rightShoulder.y) < 30 && // Wrist at shoulder height
        rightWrist.x > rightShoulder.x + 50 // Wrist is to the right of shoulder (extended outward)
    );
    
    // Return true if either arm is raised correctly
    return leftArmRaised || rightArmRaised;
}

// Function to check for trunk rotation
function checkTrunkRotation(keypoints) {
    // Find required keypoints
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const leftHip = findKeypoint(keypoints, 'left_hip');
    const rightHip = findKeypoint(keypoints, 'right_hip');
    
    // Skip if any keypoints are missing
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
        return false;
    }
    
    // Calculate the angle between the shoulder line and hip line
    const shoulderVector = {
        x: rightShoulder.x - leftShoulder.x,
        y: rightShoulder.y - leftShoulder.y
    };
    
    const hipVector = {
        x: rightHip.x - leftHip.x,
        y: rightHip.y - leftHip.y
    };
    
    // Calculate angle between vectors
    const dotProduct = shoulderVector.x * hipVector.x + shoulderVector.y * hipVector.y;
    const shoulderMagnitude = Math.sqrt(shoulderVector.x * shoulderVector.x + shoulderVector.y * shoulderVector.y);
    const hipMagnitude = Math.sqrt(hipVector.x * hipVector.x + hipVector.y * hipVector.y);
    
    const angleRad = Math.acos(dotProduct / (shoulderMagnitude * hipMagnitude));
    const angleDeg = angleRad * (180 / Math.PI);
    
    // If angle is greater than 15 degrees, consider it a rotation
    return angleDeg > 15;
}

// Function to check for chair squat
function checkChairSquat(keypoints) {
    // Find required keypoints
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const leftHip = findKeypoint(keypoints, 'left_hip');
    const rightHip = findKeypoint(keypoints, 'right_hip');
    const leftKnee = findKeypoint(keypoints, 'left_knee');
    const rightKnee = findKeypoint(keypoints, 'right_knee');
    
    // Skip if any keypoints are missing
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftKnee || !rightKnee) {
        return false;
    }
    
    // Calculate shoulder height (average of both shoulders)
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    
    // Calculate hip height (average of both hips)
    const hipY = (leftHip.y + rightHip.y) / 2;
    
    // Calculate knee height (average of both knees)
    const kneeY = (leftKnee.y + rightKnee.y) / 2;
    
    // Check if hips are lower than starting position but not too low (partial squat)
    // and knees are bent
    const isPartialSquat = (
        hipY > shoulderY + 50 && // Hips lower than shoulders
        hipY < kneeY && // Hips higher than knees (not a full squat)
        Math.abs(leftKnee.x - rightKnee.x) > 30 // Knees apart
    );
    
    return isPartialSquat;
}

// Function to check for weight shift
function checkWeightShift(keypoints) {
    // Find required keypoints
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const leftHip = findKeypoint(keypoints, 'left_hip');
    const rightHip = findKeypoint(keypoints, 'right_hip');
    
    // Skip if any keypoints are missing
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
        return false;
    }
    
    // Calculate midpoints
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    
    // Check if upper body is shifted to either side
    // When weight is shifted, the shoulder midpoint will not be aligned with hip midpoint
    const shiftDistance = Math.abs(shoulderMidX - hipMidX);
    
    // If shifted more than 20 pixels, consider it a weight shift
    return shiftDistance > 20;
}

// Function to check for diagonal reach
function checkDiagonalReach(keypoints) {
    // Find required keypoints
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    // Skip if any keypoints are missing
    if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
        return false;
    }
    
    // Check for diagonal reach with left arm (up and right)
    const leftDiagonalReach = (
        leftWrist.y < leftShoulder.y - 50 && // Wrist is higher than shoulder
        leftWrist.x > leftShoulder.x + 50 // Wrist is to the right of shoulder
    );
    
    // Check for diagonal reach with right arm (up and left)
    const rightDiagonalReach = (
        rightWrist.y < rightShoulder.y - 50 && // Wrist is higher than shoulder
        rightWrist.x < rightShoulder.x - 50 // Wrist is to the left of shoulder
    );
    
    // Return true if either arm is in a diagonal reach position
    return leftDiagonalReach || rightDiagonalReach;
}

// Function to check for standing leg lift
function checkStandingLegLift(keypoints) {
    // Find required keypoints
    const leftHip = findKeypoint(keypoints, 'left_hip');
    const rightHip = findKeypoint(keypoints, 'right_hip');
    const leftKnee = findKeypoint(keypoints, 'left_knee');
    const rightKnee = findKeypoint(keypoints, 'right_knee');
    const leftAnkle = findKeypoint(keypoints, 'left_ankle');
    const rightAnkle = findKeypoint(keypoints, 'right_ankle');
    
    // Skip if any keypoints are missing
    if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
        return false;
    }
    
    // Check if either leg is lifted outward
    // Left leg lifted
    const leftLegLifted = (
        Math.abs(leftKnee.y - leftHip.y) < 30 && // Knee near hip height
        leftKnee.x < leftHip.x - 40 // Knee is outward from hip
    );
    
    // Right leg lifted
    const rightLegLifted = (
        Math.abs(rightKnee.y - rightHip.y) < 30 && // Knee near hip height
        rightKnee.x > rightHip.x + 40 // Knee is outward from hip
    );
    
    return leftLegLifted || rightLegLifted;
}

// Function to check for double arm raise
function checkDoubleArmRaise(keypoints) {
    // Find required keypoints
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    // Skip if any keypoints are missing
    if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
        return false;
    }
    
    // Check if both arms are raised
    const leftArmRaised = leftWrist.y < leftShoulder.y - 50; // Left wrist above left shoulder
    const rightArmRaised = rightWrist.y < rightShoulder.y - 50; // Right wrist above right shoulder
    
    // Both arms must be raised for this exercise
    return leftArmRaised && rightArmRaised;
}

// Function to check for toe raise (difficult to detect precisely with upper body pose)
function checkToeRaise(keypoints) {
    // With top-down view of MediaPipe, toe raises are difficult to detect accurately
    // We'll use an approximation based on the relative height of shoulders
    
    // Find required keypoints
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const nose = findKeypoint(keypoints, 'nose');
    
    // Skip if any keypoints are missing
    if (!leftShoulder || !rightShoulder || !nose) {
        return false;
    }
    
    // Calculate average shoulder height
    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    
    // When someone raises on their toes, their whole body moves up slightly
    // So the distance from nose to shoulders might decrease slightly
    const noseToShouldersDistance = nose.y - avgShoulderY;
    
    // This is an approximation - a decrease in the nose-to-shoulders distance
    // Note: may not be very accurate in practice, but it's a reasonable proxy
    return noseToShouldersDistance < 80; // Threshold would need calibration
}

// Function to check for cross-body reach
function checkCrossBodyReach(keypoints) {
    // Find required keypoints
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    // Skip if any keypoints are missing
    if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
        return false;
    }
    
    // Check if left wrist has crossed to the right side of body
    const leftWristCrossed = leftWrist.x > rightShoulder.x;
    
    // Check if right wrist has crossed to the left side of body
    const rightWristCrossed = rightWrist.x < leftShoulder.x;
    
    // Either arm crossing the body counts
    return leftWristCrossed || rightWristCrossed;
}

// Function to check for step forward
function checkStepForward(keypoints) {
    // Find required keypoints
    const leftKnee = findKeypoint(keypoints, 'left_knee');
    const rightKnee = findKeypoint(keypoints, 'right_knee');
    const leftAnkle = findKeypoint(keypoints, 'left_ankle');
    const rightAnkle = findKeypoint(keypoints, 'right_ankle');
    
    // Skip if any keypoints are missing
    if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
        return false;
    }
    
    // Calculate knee-to-ankle distances (when stepping, one will be greater)
    const leftLegExtension = Math.abs(leftAnkle.y - leftKnee.y);
    const rightLegExtension = Math.abs(rightAnkle.y - rightKnee.y);
    
    // Check if one leg is more extended than the other (indicating a step)
    const stepDetected = Math.abs(leftLegExtension - rightLegExtension) > 20;
    
    return stepDetected;
}

// =============================
// Utility Functions
// =============================
function findKeypoint(keypoints, name) {
    return keypoints.find(kp => kp.name === name && kp.score >= minKeypointConfidence);
}

function playSuccessSound() {
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
        
        // Play success melody (rising tone)
        setTimeout(() => { oscillator.frequency.value = 523.25; }, 100); // C5
        setTimeout(() => { oscillator.frequency.value = 659.25; }, 200); // E5
        setTimeout(() => { oscillator.frequency.value = 783.99; }, 300); // G5
        
        setTimeout(() => { 
            oscillator.stop();
        }, 400);
    } catch (e) {
        console.log("Audio not supported or blocked");
    }
}

function playErrorSound() {
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
        
        // Play error sound (falling tone)
        setTimeout(() => { oscillator.frequency.value = 349.23; }, 100); // F4
        setTimeout(() => { oscillator.frequency.value = 293.66; }, 200); // D4
        
        setTimeout(() => { 
            oscillator.stop();
        }, 300);
    } catch (e) {
        console.log("Audio not supported or blocked");
    }
}

// Initialize the application when window loads
window.onload = function() {
    initializeApp();
};// Stroke Rehabilitation Simon Says Game
// A game that combines pose detection with Simon Says rules
// Specifically designed for stroke rehabilitation exercises

// Global variables
let video;
let canvas;
let ctx;
let detector;
let poses = [];

// Game state
let gameActive = false;
let debugMode = false;
let difficulty = 'intermediate';
let currentRound = 0;
let totalRounds = 8;
let score = 0;
let currentPose = null;
let poseTimer = null;
let poseStartTime = 0;
let poseDuration = 6000; // Time to hold pose (ms) - longer for rehab movements
let currentlySaysSimon = false; // Whether current pose is "Simon Says"
let poseDetected = false;
let results = [];

// Pose detection parameters
let minPoseConfidence = 0.3;
let minKeypointConfidence = 0.65;

// UI Elements
let startButton;
let skipButton;
let difficultySelect;
let poseName;
let poseImage;
let timerDisplay;
let scoreDisplay;
let roundDisplay;
let feedbackDisplay;
let simonSaysIndicator;
let resultsTable;
let debugPanel;
let debugToggle;

