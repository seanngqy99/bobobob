// Head Rotation Exercise using MediaPipe Face Mesh
// This script handles the head rotation rehabilitation exercise

// Global variables
let video;
let canvas;
let ctx;
let detector;
let faces = [];

// Exercise variables
let exerciseActive = false;
let selectedDirection = 'left'; // Default to left rotation
let repCount = 0;
let targetRepCount = 10; // Default value, will be updated from session storage
let totalSets = 1; // Default value, will be updated from session storage
let currentSet = 1;
let exerciseStartTime;
let exerciseDuration = 0;

// Head rotation variables
let rotationAngle = 0;
let rotationThreshold = 45; // Degrees of rotation required to count as a rep
let holdTime = 1000; // Milliseconds to hold the rotation
let holdStartTime = 0;
let isHolding = false;
let inTransition = false;
let instructionTimer = null;
let inRotationPhase = false; // Flag to track if we're in rotating or returning phase

// Rest period variables
let isResting = false;
let restTimeRemaining = 0;
let restInterval;
const restBetweenSets = 5; // 30 seconds rest between sets

// UI Elements
let repCountDisplay;
let setsDisplay;
let statusDisplay;
let startButton;
let resetButton;
let rotationDirectionSelect;
let progressContainer;

// Get parameters from sessionStorage
const storedReps = sessionStorage.getItem('exerciseReps');
const storedSets = sessionStorage.getItem('exerciseSets');
const storedDirection = sessionStorage.getItem('exerciseDirection');

// ----------------- Head Rotation Logic & Flow -----------------
let rotationChoice = "left";
let targetReps = storedReps ? parseInt(storedReps) : 5; // Default value
let targetSets = storedSets ? parseInt(storedSets) : 3; // Default value

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

// Angle thresholds for head rotation
const CENTER_THRESHOLD = 10; // Angle within which we consider head "centered"
const ROTATION_THRESHOLD = 45; // Angle above which we consider head "rotated"

// DOM Elements
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const rotationSelectElems = document.getElementsByName("tiltSelect");
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
}

if (storedSets) {
    targetSets = parseInt(storedSets);
}

if (storedDirection) {
    rotationChoice = storedDirection;

    // Set the correct radio button
    for (let radio of rotationSelectElems) {
        if (radio.value === rotationChoice) {
            radio.checked = true;
            break;
        }
    }
}

// =============================
// Initialize Camera and MediaPipe Face Mesh
// =============================
async function initializeFaceTracking() {
    // Get UI elements
    repCountDisplay = document.getElementById('repCount');
    setsDisplay = document.getElementById('setsDisplay');
    statusDisplay = document.getElementById('exerciseStatus');
    startButton = document.getElementById('startExercise');
    resetButton = document.getElementById('resetExercise');
    rotationDirectionSelect = document.getElementById('tiltDirection');
    progressContainer = document.getElementById('headProgress');

    // Disable start button until model is loaded
    if (startButton) startButton.disabled = true;

    // Add event listeners
    if (startButton) startButton.addEventListener('click', startExercise);
    if (resetButton) resetButton.addEventListener('click', resetExercise);
    if (rotationDirectionSelect) {
        rotationDirectionSelect.addEventListener('change', (e) => {
            selectedDirection = e.target.value;
            updateStatus(`Selected ${selectedDirection} rotation direction`);
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
        updateStatus('Loading face tracking model...');

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
                // Load MediaPipe Face Mesh model
                const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
                const detectorConfig = {
                    runtime: 'mediapipe',
                    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
                    refineLandmarks: true
                };

                detector = await faceLandmarksDetection.createDetector(model, detectorConfig);

                // Enable start button once model is loaded
                if (startButton) startButton.disabled = false;
                updateStatus('Ready! Press Start to begin.');

                // Hide loading overlay
                if (loadingOverlay) loadingOverlay.style.display = 'none';

                // Start the detection loop
                detectFaces();

            } catch (err) {
                console.error("Error initializing face detector:", err);
                updateStatus('Error loading face detector. Please refresh.');

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

// =============================
// Get Exercise Parameters from Session Storage
// =============================
function getExerciseParameters() {
    // Check for stored parameters from session storage
    const storedReps = sessionStorage.getItem('exerciseReps');
    const storedSets = sessionStorage.getItem('exerciseSets');
    const storedDirection = sessionStorage.getItem('exerciseDirection');

    console.log("Session storage values on load:");
    console.log("Reps:", storedReps);
    console.log("Sets:", storedSets);
    console.log("Direction:", storedDirection);

    // Apply rep count if stored
    if (storedReps) {
        targetRepCount = parseInt(storedReps);
    }

    // Apply sets count if stored
    if (storedSets) {
        totalSets = parseInt(storedSets);
        currentSet = parseInt(sessionStorage.getItem('currentExerciseSet') || '1');
        updateSetsDisplay();
    }

    // Apply direction if stored
    if (storedDirection) {
        selectedDirection = storedDirection;
        if (rotationDirectionSelect) {
            rotationDirectionSelect.value = selectedDirection;
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
    inTransition = false;
    inRotationPhase = true; // Start with rotation phase

    // Reset UI
    updateRepCount();
    updateProgressIndicators();
    updateStatus(`Rotate your head to the ${selectedDirection}`);
    if (startButton) startButton.disabled = true;

    // Start session timer
    startSessionTimer();
}

function resetExercise() {
    exerciseActive = false;
    repCount = 0;
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
            localStorage.setItem('lastHeadRotationExerciseSession',
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
// Face Detection and Processing
// =============================
async function detectFaces() {
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
                // Estimate faces with MediaPipe
                const estimationConfig = { flipHorizontal: true }; // Flip because we're mirroring
                faces = await detector.estimateFaces(video, estimationConfig);

                // Draw face mesh
                drawFaceMesh();

                // Process head rotation if exercise is active
                if (exerciseActive) {
                    processHeadRotation();
                }
            }
        } catch (err) {
            console.error("Error detecting faces:", err);
        }

        // Display exercise instructions
        if (exerciseActive) {
            displayInstructions();
        }

        requestAnimationFrame(render);
    }

    render();
}

function drawFaceMesh() {
    if (faces.length === 0) return;

    const face = faces[0];
    const keypoints = face.keypoints;

    // Set styles
    ctx.strokeStyle = 'rgba(0, 191, 255, 0.7)';
    ctx.lineWidth = 2;

    // Draw face mesh
    const connections = face.keypoints.map((_, i) => i);
    for (let i = 0; i < connections.length - 1; i++) {
        const start = keypoints[connections[i]];
        const end = keypoints[connections[i + 1]];

        if (start && end) {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }

    // Draw keypoints
    keypoints.forEach(keypoint => {
        ctx.fillStyle = 'rgba(0, 191, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function processHeadRotation() {
    if (faces.length === 0) return;

    const face = faces[0];
    const keypoints = face.keypoints;

    // Get key points for rotation calculation
    const nose = keypoints[1]; // Nose tip
    const leftEye = keypoints[33]; // Left eye
    const rightEye = keypoints[263]; // Right eye

    if (!nose || !leftEye || !rightEye) return;

    // Calculate rotation angle
    const eyeLine = {
        x: rightEye.x - leftEye.x,
        y: rightEye.y - leftEye.y
    };

    // Calculate angle between eye line and horizontal
    rotationAngle = Math.atan2(eyeLine.y, eyeLine.x) * (180 / Math.PI);

    // Check if we're in the rotation phase or return phase
    if (inRotationPhase) {
        // Rotation phase - we're looking for the head to rotate to the target angle
        if (selectedDirection === 'left' && rotationAngle < -rotationThreshold ||
            selectedDirection === 'right' && rotationAngle > rotationThreshold ||
            selectedDirection === 'both' && (rotationAngle < -rotationThreshold || rotationAngle > rotationThreshold)) {

            if (!isHolding) {
                isHolding = true;
                holdStartTime = Date.now();
            }

            // Check if we've held the rotation long enough
            if (Date.now() - holdStartTime >= holdTime && !inTransition) {
                inTransition = true;
                inRotationPhase = false;
                updateStatus('Now return your head to center');

                // Allow transition after a short delay
                setTimeout(() => {
                    inTransition = false;
                }, 500);
            }
        } else {
            isHolding = false;
        }
    } else {
        // Return phase - we're looking for the head to return to center
        if (Math.abs(rotationAngle) < 5 && !inTransition) {
            inTransition = true;
            inRotationPhase = true;

            // Increment rep count
            repCount++;
            updateRepCount();
            updateProgressIndicators();

            // Check if exercise is complete
            if (repCount >= targetRepCount) {
                completeExercise();
                return;
            }

            updateStatus(`Rotate your head to the ${selectedDirection}`);

            // Allow transition after a short delay
            setTimeout(() => {
                inTransition = false;
            }, 500);
        }
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
    if (inRotationPhase) {
        instructionText = `Rotate your head to the ${selectedDirection}`;
    } else {
        instructionText = "Now return your head to center";
    }

    ctx.fillText(instructionText, canvas.width / 2, 50);

    // Draw progress text
    const progressText = `Rep ${repCount + 1}/${targetRepCount}`;
    ctx.font = "14px Arial";
    ctx.fillText(progressText, canvas.width / 2, 75);

    // Draw rep instructions
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(canvas.width / 2 - 230, canvas.height - 50, 460, 40);

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        `Rotate head ${selectedDirection} and return to center - ${repCount} of ${targetRepCount} reps completed`,
        canvas.width / 2,
        canvas.height - 25
    );
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
    // Initialize the face tracking
    initializeFaceTracking();
};

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

// Calculate head rotation angle
function calculateHeadRotationAngle(faceLandmarks) {
    // Get key points for rotation calculation
    const nose = faceLandmarks[1]; // Nose tip
    const leftEye = faceLandmarks[33]; // Left eye
    const rightEye = faceLandmarks[263]; // Right eye
    const leftMouth = faceLandmarks[61]; // Left mouth corner
    const rightMouth = faceLandmarks[291]; // Right mouth corner

    if (!nose || !leftEye || !rightEye || !leftMouth || !rightMouth) return 0;

    // Calculate the center point of the face
    const faceCenter = {
        x: (leftEye.x + rightEye.x + leftMouth.x + rightMouth.x) / 4,
        y: (leftEye.y + rightEye.y + leftMouth.y + rightMouth.y) / 4
    };

    // Calculate the vector from nose to face center
    const noseToCenter = {
        x: faceCenter.x - nose.x,
        y: faceCenter.y - nose.y
    };

    // Calculate the angle between the nose-to-center vector and vertical
    // This gives us the rotation angle
    return Math.atan2(noseToCenter.x, noseToCenter.y) * (180 / Math.PI);
}

function smoothAngle(prevAngle, rawAngle) {
    return prevAngle + smoothingFactor * (rawAngle - prevAngle);
}

function drawProgressArc(ctx, x, y, angle) {
    const minA = 0;
    const maxA = 90;
    const norm = Math.min(Math.max((angle - minA) / (maxA - minA), 0), 1);

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.arc(x, y, 25, 0, 2 * Math.PI);
    ctx.stroke();

    // Use color gradient based on angle
    let color;
    if (Math.abs(angle) < CENTER_THRESHOLD) {
        color = '#f72585'; // Color for centered
    } else if (Math.abs(angle) > ROTATION_THRESHOLD) {
        color = '#4cc9f0'; // Color for rotated
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

    // Only show the progress container for the selected direction(s)
    if (rotationChoice === "left" || rotationChoice === "both") {
        leftRepProgress.style.display = "block";
    } else {
        leftRepProgress.style.display = "none";
    }

    if (rotationChoice === "right" || rotationChoice === "both") {
        rightRepProgress.style.display = "block";
    } else {
        rightRepProgress.style.display = "none";
    }

    // Create progress bars based on target reps
    for (let i = 1; i <= targetReps; i++) {
        // Left rotation progress bars
        if (rotationChoice === "left" || rotationChoice === "both") {
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

        // Right rotation progress bars
        if (rotationChoice === "right" || rotationChoice === "both") {
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

    // Calculate progress percentage (based on ideal range of 90 degrees for head rotation)
    const idealRange = 90; // From 0 (centered) to 90 (fully rotated)
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

// Track rep counting logic for head rotation
function trackRep(angle, side) {
    if (side === "left") {
        // Update min/max angle for current rep
        currentLeftAngleMin = Math.min(currentLeftAngleMin, angle);
        currentLeftAngleMax = Math.max(currentLeftAngleMax, angle);

        // Update progress for current rep
        const currentRepNumber = leftCount + 1;
        updateCurrentRepProgress('left', currentRepNumber, currentLeftAngleMin, currentLeftAngleMax);

        // Rep logic for head rotation: 
        // If angle starts near center, then goes beyond ROTATION_THRESHOLD, then returns to center
        if (!leftRepStarted && Math.abs(angle) < CENTER_THRESHOLD) {
            // Head is centered, ready to start
            leftRepStarted = 1;
        } else if (leftRepStarted === 1 && angle < -ROTATION_THRESHOLD) {
            // Head is rotated left
            leftRepStarted = 2;
        } else if (leftRepStarted === 2 && Math.abs(angle) < CENTER_THRESHOLD) {
            // Head back to center - rep complete
            leftCount++;
            const rangeAchieved = currentLeftAngleMax - currentLeftAngleMin;
            markRepCompleted('left', leftCount, rangeAchieved);

            // Reset angle tracking for next rep
            leftRepStarted = 0;
            currentLeftAngleMin = 180;
            currentLeftAngleMax = 0;
        }
    } else { // Right rotation
        // Update min/max angle for current rep
        currentRightAngleMin = Math.min(currentRightAngleMin, angle);
        currentRightAngleMax = Math.max(currentRightAngleMax, angle);

        // Update progress for current rep
        const currentRepNumber = rightCount + 1;
        updateCurrentRepProgress('right', currentRepNumber, currentRightAngleMin, currentRightAngleMax);

        // Rep logic for head rotation
        if (!rightRepStarted && Math.abs(angle) < CENTER_THRESHOLD) {
            // Head is centered, ready to start
            rightRepStarted = 1;
        } else if (rightRepStarted === 1 && angle > ROTATION_THRESHOLD) {
            // Head is rotated right
            rightRepStarted = 2;
        } else if (rightRepStarted === 2 && Math.abs(angle) < CENTER_THRESHOLD) {
            // Head back to center - rep complete
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
            statusText.textContent = `Set ${currentSet} of ${targetSets}: Tracking ${rotationChoice} rotation(s), ${targetReps} reps`;

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
    if (rotationChoice === "left" || rotationChoice === "both") {
        leftCountText.textContent = `Left Rotation: ${leftCount}/${targetReps} reps • Set ${currentSet}/${targetSets}`;
    } else {
        leftCountText.textContent = "";
    }

    if (rotationChoice === "right" || rotationChoice === "both") {
        rightCountText.textContent = `Right Rotation: ${rightCount}/${targetReps} reps • Set ${currentSet}/${targetSets}`;
    } else {
        rightCountText.textContent = "";
    }

    const leftDone = (leftCount >= targetReps);
    const rightDone = (rightCount >= targetReps);

    // Check if current set is complete
    if (!isResting && (
        (rotationChoice === "left" && leftDone) ||
        (rotationChoice === "right" && rightDone) ||
        (rotationChoice === "both" && leftDone && rightDone))) {

        handleSetCompletion();
    }
}

function onStart() {
    // Read which rotation direction(s)
    for (let radio of rotationSelectElems) {
        if (radio.checked) {
            rotationChoice = radio.value;
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
                statusText.textContent = `Set ${currentSet} of ${targetSets}: Performing head rotations with ${rotationChoice} direction(s)`;
            }
        }, 1000);
    }
}

function onResults(results) {
    // 1) Clear & mirror the video feed
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Mirror transform for the video and face mesh
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);

    // Draw the mirrored image
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Draw the face mesh mirrored
    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
                { color: 'rgba(67, 97, 238, 0.7)', lineWidth: 1 });
            drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE,
                { color: 'rgba(247, 37, 133, 0.8)', lineWidth: 2 });
            drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE,
                { color: 'rgba(247, 37, 133, 0.8)', lineWidth: 2 });
        }
    }

    canvasCtx.restore();

    // 2) If isAssessmentActive, do angle logic
    if (results.multiFaceLandmarks && isAssessmentActive) {
        const face = results.multiFaceLandmarks[0];
        if (face) {
            // Calculate head rotation angle
            const rawAngle = calculateHeadRotationAngle(face);

            // Smooth the angle
            if (rotationChoice === "left" || rotationChoice === "both") {
                smoothedLeftAngle = smoothAngle(smoothedLeftAngle, rawAngle);
            }
            if (rotationChoice === "right" || rotationChoice === "both") {
                smoothedRightAngle = smoothAngle(smoothedRightAngle, rawAngle);
            }

            // Get nose position for display
            const nose = face[1];
            const noseX = nose.x * canvasElement.width;
            const noseY = nose.y * canvasElement.height;

            // Text at mirrored location
            const textX = canvasElement.width - noseX;
            const textY = noseY;

            // Draw angle display
            canvasCtx.save();
            canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            canvasCtx.font = 'bold 18px Poppins';
            canvasCtx.textAlign = 'center';
            canvasCtx.fillText(`${rawAngle.toFixed(0)}°`, textX, textY - 30);

            // Draw progress arc
            drawProgressArc(canvasCtx, textX, textY, rawAngle);

            // Draw guidance for rep state
            let instructionText = "";
            if (leftRepStarted === 0 || rightRepStarted === 0) {
                instructionText = "Start with head centered";
            } else if (leftRepStarted === 1 || rightRepStarted === 1) {
                instructionText = "Rotate head to the side";
            } else if (leftRepStarted === 2 || rightRepStarted === 2) {
                instructionText = "Return head to center";
            }

            canvasCtx.fillStyle = 'rgb(238, 215, 67)';
            canvasCtx.font = 'bold 16px Poppins';
            canvasCtx.fillText(instructionText, textX, textY - 60);

            canvasCtx.restore();

            // Track reps for left rotation
            if (rotationChoice === "left" || rotationChoice === "both") {
                if (leftCount < targetReps) {
                    trackRep(smoothedLeftAngle, "left");
                }
            }

            // Track reps for right rotation
            if (rotationChoice === "right" || rotationChoice === "both") {
                if (rightCount < targetReps) {
                    trackRep(smoothedRightAngle, "right");
                }
            }
        }

        // Draw overall instruction at the top of the screen
        canvasCtx.fillStyle = 'rgb(9, 197, 178)';
        canvasCtx.font = 'bold 20px Poppins';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText(`Head Rotations: Rotate head to the side, then return to center`, canvasElement.width / 2, 30);

        updateUI();
    }

    // Add this block after drawing landmarks but before other UI elements
    if (results.multiFaceLandmarks && isResting) {
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
    else if (results.multiFaceLandmarks && !isAssessmentActive && !isCountdownRunning && !isResting) {
        // Only show "Press Start" when not in rest period and not active
        canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        canvasCtx.font = 'bold 30px Arial';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText("Press Start to begin exercise", canvasElement.width / 2, canvasElement.height / 2);
    }
}

// Setup the Face Mesh
const faceMesh = new FaceMesh({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
});
faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

// Setup camera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({ image: videoElement });
    },
    width: 800,
    height: 600
});
camera.start()
    .then(() => {
        console.log('Camera started successfully (head rotation).');
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