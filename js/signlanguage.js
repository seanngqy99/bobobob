// Sign Language Trainer
// A game that teaches sign language by tracking hand gestures

// Global variables
let video;
let canvas;
let ctx;
let detector;
let hands = [];

// Game state
let gameActive = false;
let debugMode = false;
let currentCategory = 'alphabet';
let currentWord = '';
let currentWordIndex = -1;
let score = 0;
let totalAttempts = 0;
let difficulty = 'medium';
let matchThreshold = 0.7; // Default threshold for medium difficulty
let maxDetectionTime = 5000; // 5 seconds to detect the sign
let detectionStartTime = 0;
let detectionTimeout;
let signRecognized = false;

// Track completed words
let completedWords = {};

// Sign language data
const signData = {
    alphabet: {
        'A': {
            image: createLetterSVG('A'),
            fingerPositions: {
                // Thumb should be extended, all other fingers closed
                thumbExtended: true,
                indexClosed: true,
                middleClosed: true,
                ringClosed: true,
                pinkyClosed: true,
                // Palm facing camera
                palmFacingCamera: true
            }
        },
        'B': {
            image: createLetterSVG('B'),
            fingerPositions: {
                // All fingers extended, thumb tucked
                thumbTucked: true,
                indexExtended: true,
                middleExtended: true,
                ringExtended: true,
                pinkyExtended: true,
                // Palm facing camera
                palmFacingCamera: true
            }
        },
        'C': {
            image: createLetterSVG('C'),
            fingerPositions: {
                // Curved hand, all fingers aligned in C shape
                thumbCurved: true,
                fingersCurved: true,
                // Palm facing sideways
                palmFacingSideways: true
            }
        },
        'Y': {
            image: createLetterSVG('Y'),
            fingerPositions: {
                // Thumb and pinky extended, others closed
                thumbExtended: true,
                indexClosed: true,
                middleClosed: true,
                ringClosed: true,
                pinkyExtended: true
            }
        }
        // More alphabet signs can be added
    },
    numbers: {
        '1': {
            image: createNumberSVG('1'),
            fingerPositions: {
                // Index extended, all others closed
                thumbClosed: true,
                indexExtended: true,
                middleClosed: true,
                ringClosed: true,
                pinkyClosed: true,
                // Palm facing camera
                palmFacingCamera: true
            }
        },
        '5': {
            image: createNumberSVG('5'),
            fingerPositions: {
                // All fingers extended
                thumbExtended: true,
                indexExtended: true,
                middleExtended: true,
                ringExtended: true,
                pinkyExtended: true,
                // Palm facing camera
                palmFacingCamera: true
            }
        }
        // More number signs can be added
    },
    greetings: {
        'Hello': {
            image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20fill%3D%22%23282828%22%20width%3D%22240%22%20height%3D%22240%22%2F%3E%3Ctext%20fill%3D%22%23ffffff%22%20font-family%3D%22Arial%22%20font-size%3D%2240%22%20x%3D%22120%22%20y%3D%22120%22%20text-anchor%3D%22middle%22%3EHello%3C%2Ftext%3E%3C%2Fsvg%3E',
            fingerPositions: {
                // Open hand, palm facing out, fingers spread
                thumbExtended: true,
                indexExtended: true,
                middleExtended: true,
                ringExtended: true,
                pinkyExtended: true,
                // Waving motion (this would need special detection logic)
                waving: true
            }
        }
        // More greeting signs can be added
    },
    common: {
        'Thank You': {
            image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20fill%3D%22%23282828%22%20width%3D%22240%22%20height%3D%22240%22%2F%3E%3Ctext%20fill%3D%22%23ffffff%22%20font-family%3D%22Arial%22%20font-size%3D%2230%22%20x%3D%22120%22%20y%3D%22120%22%20text-anchor%3D%22middle%22%3EThank%20You%3C%2Ftext%3E%3C%2Fsvg%3E',
            fingerPositions: {
                // Flat hand, fingers together, touch mouth then move outward
                fingersFlat: true,
                // Moving from mouth outward (would need special detection)
                mouthToOutward: true
            }
        }
        // More common signs can be added
    }
};

// UI Elements
let startButton;
let skipButton;
let difficultySelect;
let currentWordDisplay;
let signImageDisplay;
let progressFill;
let scoreDisplay;
let accuracyDisplay;
let feedbackDisplay;
let statusDisplay;
let handMetricsDisplay;
let debugToggle;
let categoryListContainer;
let wordListContainer;

// =============================
// Initialize the Application
// =============================
async function initializeApp() {
    // Get UI elements
    startButton = document.getElementById('startButton');
    skipButton = document.getElementById('skipButton');
    difficultySelect = document.getElementById('difficultySelect');
    currentWordDisplay = document.getElementById('currentWord');
    signImageDisplay = document.getElementById('signImage');
    progressFill = document.getElementById('progressFill');
    scoreDisplay = document.getElementById('scoreDisplay');
    accuracyDisplay = document.getElementById('accuracyDisplay');
    feedbackDisplay = document.getElementById('feedback');
    statusDisplay = document.getElementById('statusDisplay');
    handMetricsDisplay = document.getElementById('handMetrics');
    debugToggle = document.getElementById('debugToggle');
    categoryListContainer = document.getElementById('categoryList');
    wordListContainer = document.getElementById('wordList');
    
    // Disable buttons until model is loaded
    if (startButton) startButton.disabled = true;
    if (skipButton) skipButton.disabled = true;
    
    // Add event listeners
    if (startButton) startButton.addEventListener('click', toggleGameState);
    if (skipButton) skipButton.addEventListener('click', skipCurrentWord);
    if (difficultySelect) {
        difficultySelect.addEventListener('change', (e) => {
            difficulty = e.target.value;
            updateDifficultySettings();
        });
    }
    if (debugToggle) {
        debugToggle.addEventListener('click', toggleDebugMode);
    }
    
    // Setup category selection
    setupCategorySelection();
    
    // Populate initial word list
    populateWordList(currentCategory);
    
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
        updateStatus('Loading hand tracking model...');
        
        // Show loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Wait for video to be ready
        video.onloadedmetadata = async () => {
            try {
                // Initialize detector
                await initializeDetector();
                
                // Enable start button once model is loaded
                if (startButton) startButton.disabled = false;
                updateStatus('Ready! Select a category and sign to practice.');
                
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

// Initialize MediaPipe Hands detector
async function initializeDetector() {
    // Load MediaPipe Hands model
    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
        maxHands: 1 // Focus on one hand for sign language
    };
    
    console.log("Initializing hand detector");
    detector = await handPoseDetection.createDetector(model, detectorConfig);
}

// =============================
// UI Setup and Management
// =============================
function setupCategorySelection() {
    if (!categoryListContainer) return;
    
    // Add click handlers to category items
    const categoryItems = categoryListContainer.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            categoryItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Update current category
            currentCategory = item.dataset.category;
            
            // Populate word list for this category
            populateWordList(currentCategory);
            
            // Update UI
            updateStatus(`Selected category: ${currentCategory}`);
        });
    });
}

function populateWordList(category) {
    if (!wordListContainer) return;
    
    // Clear existing word list
    wordListContainer.innerHTML = '';
    
    // Get words for this category
    const wordsInCategory = signData[category];
    
    // Create word items
    for (const word in wordsInCategory) {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        if (completedWords[word]) {
            wordItem.classList.add('completed');
        }
        wordItem.textContent = word;
        wordItem.dataset.word = word;
        
        // Add click handler
        wordItem.addEventListener('click', () => {
            selectWord(word);
        });
        
        wordListContainer.appendChild(wordItem);
    }
}
// SVG Creation Utilities for Sign Language Trainer

function createLetterSVG(letter) {
    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "240");
    svg.setAttribute("height", "240");
    svg.setAttribute("viewBox", "0 0 240 240");

    // Background
    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    background.setAttribute("width", "240");
    background.setAttribute("height", "240");
    background.setAttribute("fill", "#282828");
    svg.appendChild(background);

    // Letter
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "120");
    text.setAttribute("y", "140");
    text.setAttribute("font-family", "Arial");
    text.setAttribute("font-size", "120");
    text.setAttribute("fill", "white");
    text.setAttribute("text-anchor", "middle");
    text.textContent = letter;
    svg.appendChild(text);

    // Convert to data URL
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;

    return dataUrl;
}

function createNumberSVG(number) {
    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "240");
    svg.setAttribute("height", "240");
    svg.setAttribute("viewBox", "0 0 240 240");

    // Background
    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    background.setAttribute("width", "240");
    background.setAttribute("height", "240");
    background.setAttribute("fill", "#282828");
    svg.appendChild(background);

    // Number
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "120");
    text.setAttribute("y", "140");
    text.setAttribute("font-family", "Arial");
    text.setAttribute("font-size", "120");
    text.setAttribute("fill", "white");
    text.setAttribute("text-anchor", "middle");
    text.textContent = number;
    svg.appendChild(text);

    // Convert to data URL
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;

    return dataUrl;
}

// Helper functions for hand matching
function calculateDistance(point1, point2) {
    return Math.sqrt(
        Math.pow(point1.x - point2.x, 2) + 
        Math.pow(point1.y - point2.y, 2)
    );
}

function calculateAngle(point1, point2, point3) {
    // Calculate vectors
    const vector1 = {
        x: point1.x - point2.x,
        y: point1.y - point2.y
    };
    
    const vector2 = {
        x: point3.x - point2.x,
        y: point3.y - point2.y
    };
    
    // Calculate dot product
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    
    // Calculate magnitudes
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
    
    // Calculate angle
    const cosAngle = dotProduct / (magnitude1 * magnitude2);
    return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}

function matchHandSign(detectedFeatures, expectedSign) {
    let matchScore = 0;
    let maxPossibleScore = 0;
    
    // Check normalized distances
    if (expectedSign.thumbExtended !== undefined) {
        maxPossibleScore++;
        matchScore += (expectedSign.thumbExtended && detectedFeatures.extensions.thumb > 0.8) || 
                      (!expectedSign.thumbExtended && detectedFeatures.extensions.thumb < 0.5) ? 1 : 0;
    }
    
    if (expectedSign.indexExtended !== undefined) {
        maxPossibleScore++;
        matchScore += (expectedSign.indexExtended && detectedFeatures.extensions.index > 0.8) || 
                      (!expectedSign.indexExtended && detectedFeatures.extensions.index < 0.5) ? 1 : 0;
    }
    
    if (expectedSign.middleExtended !== undefined) {
        maxPossibleScore++;
        matchScore += (expectedSign.middleExtended && detectedFeatures.extensions.middle > 0.8) || 
                      (!expectedSign.middleExtended && detectedFeatures.extensions.middle < 0.5) ? 1 : 0;
    }
    
    if (expectedSign.ringExtended !== undefined) {
        maxPossibleScore++;
        matchScore += (expectedSign.ringExtended && detectedFeatures.extensions.ring > 0.8) || 
                      (!expectedSign.ringExtended && detectedFeatures.extensions.ring < 0.5) ? 1 : 0;
    }
    
    if (expectedSign.pinkyExtended !== undefined) {
        maxPossibleScore++;
        matchScore += (expectedSign.pinkyExtended && detectedFeatures.extensions.pinky > 0.8) || 
                      (!expectedSign.pinkyExtended && detectedFeatures.extensions.pinky < 0.5) ? 1 : 0;
    }
    
    // Check palm orientation
    if (expectedSign.palmFacingCamera !== undefined) {
        maxPossibleScore++;
        matchScore += expectedSign.palmFacingCamera === detectedFeatures.orientation.facingCamera ? 1 : 0;
    }
    
    if (expectedSign.palmFacingSideways !== undefined) {
        maxPossibleScore++;
        matchScore += expectedSign.palmFacingSideways === detectedFeatures.orientation.facingSideways ? 1 : 0;
    }
    
    // Normalize score
    const finalScore = maxPossibleScore > 0 ? (matchScore / maxPossibleScore) : 0;
    
    return {
        score: finalScore,
        details: {
            matchScore,
            maxPossibleScore
        }
    };
}

// Sound effects
function playSuccessSound() {
    try {
        const audio = new Audio('path/to/success-sound.mp3');
        audio.play();
    } catch (error) {
        console.warn('Could not play success sound:', error);
    }
}

function playFailSound() {
    try {
        const audio = new Audio('path/to/fail-sound.mp3');
        audio.play();
    } catch (error) {
        console.warn('Could not play fail sound:', error);
    }
}
function selectWord(word) {
    // Set the current word
    currentWord = word;
    
    // Find index of word in current category
    const words = Object.keys(signData[currentCategory]);
    currentWordIndex = words.indexOf(word);
    
    // Update UI
    currentWordDisplay.textContent = word;
    signImageDisplay.src = signData[currentCategory][word].image;
    
    // Update status
    updateStatus(`Selected sign: ${word}. Press Start to begin practice.`);
    updateFeedback('neutral', 'Press Start to practice this sign');
    
    // Enable start button if it was disabled
    if (startButton && startButton.disabled && startButton.textContent === "Start Practice") {
        startButton.disabled = false;
    }
}

function toggleGameState() {
    if (gameActive) {
        // Stop the game
        endGame();
        startButton.textContent = "Start Practice";
        skipButton.disabled = true;
    } else {
        // Start the game if a word is selected
        if (!currentWord) {
            updateStatus("Please select a sign to practice first.");
            return;
        }
        
        startGame();
        startButton.textContent = "Stop Practice";
        skipButton.disabled = false;
    }
}

function startGame() {
    gameActive = true;
    signRecognized = false;
    
    // Reset detection timer
    detectionStartTime = Date.now();
    if (detectionTimeout) clearTimeout(detectionTimeout);
    
    // Set timeout for this detection attempt
    detectionTimeout = setTimeout(() => {
        if (gameActive && !signRecognized) {
            // Time's up for this attempt
            totalAttempts++;
            updateAccuracy();
            updateFeedback('fail', `Time's up! Try again to sign "${currentWord}"`);
            
            // Reset detection timer
            detectionStartTime = Date.now();
            
            // Set new timeout
            detectionTimeout = setTimeout(() => {
                if (gameActive && !signRecognized) {
                    skipCurrentWord();
                }
            }, maxDetectionTime);
        }
    }, maxDetectionTime);
    
    // Update UI
    updateStatus(`Practice started! Try to sign "${currentWord}"`);
    updateFeedback('trying', `Show the sign for "${currentWord}"`);
    
    // Disable difficulty change during game
    if (difficultySelect) difficultySelect.disabled = true;
}

function endGame() {
    gameActive = false;
    
    // Clear any timeouts
    if (detectionTimeout) clearTimeout(detectionTimeout);
    
    // Update UI
    updateStatus(`Practice stopped. Select a sign to continue.`);
    
    // Re-enable difficulty selection
    if (difficultySelect) difficultySelect.disabled = false;
}

function skipCurrentWord() {
    if (!gameActive) return;
    
    // Count as failed attempt
    totalAttempts++;
    updateAccuracy();
    
    // Move to next word in category if available
    const words = Object.keys(signData[currentCategory]);
    currentWordIndex = (currentWordIndex + 1) % words.length;
    currentWord = words[currentWordIndex];
    
    // Update UI
    currentWordDisplay.textContent = currentWord;
    signImageDisplay.src = signData[currentCategory][currentWord].image;
    
    // Reset detection
    signRecognized = false;
    if (detectionTimeout) clearTimeout(detectionTimeout);
    detectionStartTime = Date.now();
    
    // Set new timeout
    detectionTimeout = setTimeout(() => {
        if (gameActive && !signRecognized) {
            totalAttempts++;
            updateAccuracy();
            updateFeedback('fail', `Time's up! Try again to sign "${currentWord}"`);
            
            // Reset detection timer
            detectionStartTime = Date.now();
            
            // Set new timeout
            detectionTimeout = setTimeout(() => {
                if (gameActive && !signRecognized) {
                    skipCurrentWord();
                }
            }, maxDetectionTime);
        }
    }, maxDetectionTime);
    
    // Update feedback
    updateFeedback('trying', `Show the sign for "${currentWord}"`);
    updateStatus(`Skipped to next sign: "${currentWord}"`);
}

function updateDifficultySettings() {
    // Adjust thresholds based on difficulty level
    switch(difficulty) {
        case 'easy':
            matchThreshold = 0.6; // More lenient matching
            maxDetectionTime = 8000; // 8 seconds to detect
            break;
        case 'medium':
            matchThreshold = 0.7; // Default matching
            maxDetectionTime = 5000; // 5 seconds to detect
            break;
        case 'hard':
            matchThreshold = 0.8; // Stricter matching
            maxDetectionTime = 3000; // 3 seconds to detect
            break;
    }
    
    updateStatus(`Difficulty set to ${difficulty}`);
}

function toggleDebugMode() {
    debugMode = !debugMode;
    
    // Toggle visibility of hand metrics display
    if (handMetricsDisplay) {
        handMetricsDisplay.style.display = debugMode ? 'block' : 'none';
    }
    
    // Update button text
    if (debugToggle) {
        debugToggle.textContent = debugMode ? 'Hide Debug' : 'Show Debug';
    }
}

// =============================
// Score and Feedback Functions
// =============================
function updateScore() {
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
    
    // Update progress bar
    const totalWords = Object.keys(signData[currentCategory]).length;
    const progress = (Object.keys(completedWords).length / totalWords) * 100;
    progressFill.style.width = `${progress}%`;
}

function updateAccuracy() {
    if (totalAttempts === 0) return;
    
    const accuracy = Math.round((score / totalAttempts) * 100);
    accuracyDisplay.textContent = `Accuracy: ${accuracy}%`;
}

function updateFeedback(type, message) {
    if (!feedbackDisplay) return;
    
    // Remove all classes
    feedbackDisplay.classList.remove('success', 'trying', 'fail');
    
    // Add appropriate class
    if (type === 'success') {
        feedbackDisplay.classList.add('success');
        playSuccessSound();
    } else if (type === 'trying') {
        feedbackDisplay.classList.add('trying');
    } else if (type === 'fail') {
        feedbackDisplay.classList.add('fail');
        playFailSound();
    }
    
    // Update message
    feedbackDisplay.textContent = message;
}

function updateStatus(message) {
    if (statusDisplay) {
        statusDisplay.textContent = message;
    }
    
    console.log(`Status: ${message}`);
}

function markWordAsCompleted(word) {
    completedWords[word] = true;
    
    // Update word item in the list
    const wordItems = wordListContainer.querySelectorAll('.word-item');
    wordItems.forEach(item => {
        if (item.dataset.word === word) {
            item.classList.add('completed');
        }
    });
}

// =============================
// Hand Detection and Analysis
// =============================
async function detectHands() {
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
                // Estimate hands with MediaPipe
                const estimationConfig = {
                    flipHorizontal: true, // Flip because we're mirroring
                    staticImageMode: false // Better for continuous tracking
                };
                
                hands = await detector.estimateHands(video, estimationConfig);
                
                // Draw hands
                drawHands();
                
                // Process hand sign if game is active
                if (gameActive && !signRecognized && hands.length > 0) {
                    processHandSign();
                }
                
                // Update debug metrics
                if (debugMode) {
                    updateHandMetrics();
                }
            }
        } catch (err) {
            console.error("Error detecting hands:", err);
        }
        
        requestAnimationFrame(render);
    }
    
    render();
}

function drawHands() {
    if (hands.length === 0) return;
    
    hands.forEach(hand => {
        const handedness = hand.handedness.toLowerCase();
        const color = handedness === 'left' ? 'rgba(255, 165, 0, 0.7)' : 'rgba(0, 191, 255, 0.7)';
        
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
            // Different styles for different finger parts
            const isFingertip = [4, 8, 12, 16, 20].includes(index);
            const isPalmBase = [0, 1, 5, 9, 13, 17].includes(index);
            
            let pointColor = color;
            let pointSize = 5;
            
            if (isFingertip) {
                pointColor = 'white';
                pointSize = 8;
            } else if (isPalmBase) {
                pointColor = 'rgba(255, 255, 255, 0.7)';
                pointSize = 6;
            }
            
            // Draw keypoint
            ctx.fillStyle = pointColor;
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, pointSize, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // If in game mode, show visual cue about current sign attempt
        if (gameActive) {
            // Show time remaining
            const timeElapsed = Date.now() - detectionStartTime;
            const timeRemaining = Math.max(0, maxDetectionTime - timeElapsed);
            const timePercent = (timeRemaining / maxDetectionTime) * 100;
            
            // Draw timer bar at the top
            ctx.fillStyle = `hsl(${timePercent}, 80%, 50%)`;
            ctx.fillRect(0, 0, canvas.width * (timeRemaining / maxDetectionTime), 10);
            
            // Show current word in overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 10, canvas.width, 40);
            
            ctx.fillStyle = 'white';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Sign: ${currentWord}`, canvas.width / 2, 38);
        }
    });
}

function processHandSign() {
    if (hands.length === 0 || !currentWord) return;
    
    // Get the first hand detected
    const hand = hands[0];
    
    // Get the expected sign configuration
    const expectedSign = signData[currentCategory][currentWord].fingerPositions;
    
    // Analyze the hand pose to extract features
    const handFeatures = analyzeHandPose(hand);
    
    // Match detected features with expected sign
    const matchResult = matchHandSign(handFeatures, expectedSign);
    
    // Display match percentage in debug mode
    if (debugMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(20, canvas.height - 60, 200, 30);
        
        ctx.fillStyle = matchResult.score > matchThreshold ? 'lime' : 'red';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Match: ${Math.round(matchResult.score * 100)}% / Threshold: ${Math.round(matchThreshold * 100)}%`, 30, canvas.height - 40);
    }
    
    // If match exceeds threshold, count as recognized
    if (matchResult.score >= matchThreshold && !signRecognized) {
        signRecognized = true;
        
        // Update score
        score++;
        totalAttempts++;
        updateScore();
        updateAccuracy();
        
        // Mark word as completed
        markWordAsCompleted(currentWord);
        
        // Show success feedback
        updateFeedback('success', `Great job! You signed "${currentWord}" correctly!`);
        
        // Clear detection timeout
        if (detectionTimeout) clearTimeout(detectionTimeout);
        
        // Move to next word after a short delay
        setTimeout(() => {
            if (gameActive) {
                // Find next uncompleted word
                const words = Object.keys(signData[currentCategory]);
                let nextWordIndex = currentWordIndex;
                let allWordsCompleted = true;
                
                // Check if all words are completed
                for (let i = 0; i < words.length; i++) {
                    if (!completedWords[words[i]]) {
                        allWordsCompleted = false;
                        break;
                    }
                }
                
                if (allWordsCompleted) {
                    // All words completed, show completion message
                    updateStatus(`Congratulations! You've completed all signs in this category.`);
                    endGame();
                    startButton.textContent = "Start Practice";
                    return;
                }
                
                // Find next uncompleted word
                let loopCount = 0;
                do {
                    nextWordIndex = (nextWordIndex + 1) % words.length;
                    loopCount++;
                    
                    // Avoid infinite loop
                    if (loopCount > words.length) {
                        break;
                    }
                } while (completedWords[words[nextWordIndex]]);
                
                currentWordIndex = nextWordIndex;
                currentWord = words[currentWordIndex];
                
                // Update UI
                currentWordDisplay.textContent = currentWord;
                signImageDisplay.src = signData[currentCategory][currentWord].image;
                
                // Reset detection
                signRecognized = false;
                detectionStartTime = Date.now();
                
                // Set new timeout
                detectionTimeout = setTimeout(() => {
                    if (gameActive && !signRecognized) {
                        totalAttempts++;
                        updateAccuracy();
                        updateFeedback('fail', `Time's up! Try again to sign "${currentWord}"`);
                        
                        // Reset detection timer
                        detectionStartTime = Date.now();
                        
                        // Set new timeout
                        detectionTimeout = setTimeout(() => {
                            if (gameActive && !signRecognized) {
                                skipCurrentWord();
                            }
                        }, maxDetectionTime);
                    }
                }, maxDetectionTime);
                
                // Update feedback
                updateFeedback('trying', `Show the sign for "${currentWord}"`);
                updateStatus(`Next sign: "${currentWord}"`);
            }
        }, 2000);
    }
}

function analyzeHandPose(hand) {
    // Extract key points for each finger
    const wrist = hand.keypoints[0];
    const thumbTip = hand.keypoints[4];
    const indexTip = hand.keypoints[8];
    const middleTip = hand.keypoints[12];
    const ringTip = hand.keypoints[16];
    const pinkyTip = hand.keypoints[20];
    
    // Get bases of fingers (MCP joints)
    const thumbBase = hand.keypoints[1];
    const indexBase = hand.keypoints[5];
    const middleBase = hand.keypoints[9];
    const ringBase = hand.keypoints[13];
    const pinkyBase = hand.keypoints[17];
    
    // Get palm center (average of bases)
    const palmCenter = {
        x: (indexBase.x + middleBase.x + ringBase.x + pinkyBase.x) / 4,
        y: (indexBase.y + middleBase.y + ringBase.y + pinkyBase.y) / 4
    };
    
    // Calculate distances from tips to palm center
    const thumbDist = calculateDistance(thumbTip, palmCenter);
    const indexDist = calculateDistance(indexTip, palmCenter);
    const middleDist = calculateDistance(middleTip, palmCenter);
    const ringDist = calculateDistance(ringTip, palmCenter);
    const pinkyDist = calculateDistance(pinkyTip, palmCenter);
    
    // Calculate distances from bases to tips
    const thumbLength = calculateDistance(thumbBase, thumbTip);
    const indexLength = calculateDistance(indexBase, indexTip);
    const middleLength = calculateDistance(middleBase, middleTip);
    const ringLength = calculateDistance(ringBase, ringTip);
    const pinkyLength = calculateDistance(pinkyBase, pinkyTip);
    
    // Calculate hand width for scaling
    const handWidth = calculateDistance(indexBase, pinkyBase);
    
    // Calculate normalized distances (as ratios to hand width)
    const normThumbDist = thumbDist / handWidth;
    const normIndexDist = indexDist / handWidth;
    const normMiddleDist = middleDist / handWidth;
    const normRingDist = ringDist / handWidth;
    const normPinkyDist = pinkyDist / handWidth;
    
    // Calculate finger extension ratio (how straight the finger is)
    // A fully extended finger will have a ratio close to 1
    // A curled finger will have a lower ratio
    const thumbExt = thumbDist / thumbLength;
    const indexExt = indexDist / indexLength;
    const middleExt = middleDist / middleLength;
    const ringExt = ringDist / ringLength;
    const pinkyExt = pinkyDist / pinkyLength;
    
    // Calculate angles between fingers
    const thumbIndexAngle = calculateAngle(thumbTip, palmCenter, indexTip);
    const indexMiddleAngle = calculateAngle(indexTip, palmCenter, middleTip);
    const middleRingAngle = calculateAngle(middleTip, palmCenter, ringTip);
    const ringPinkyAngle = calculateAngle(ringTip, palmCenter, pinkyTip);
    
    // Determine if palm is facing the camera
    // Based on the visibility/z-coordinate of keypoints
    const isPalmFacingCamera = indexBase.z < wrist.z;
    
    // Determine if palm is facing sideways
    // This would need additional analysis with z-coordinates
    // or possibly the relative positions of thumb and pinky
    const isPalmSideways = Math.abs(thumbBase.x - pinkyBase.x) < handWidth / 2;
    
    // Return analyzed features
    return {
        // Normalized distances from palm center
        normDistances: {
            thumb: normThumbDist,
            index: normIndexDist,
            middle: normMiddleDist,
            ring: normRingDist,
            pinky: normPinkyDist
        },
        
        // Extension ratios
        extensions: {
            thumb: thumbExt,
            index: indexExt,
            middle: middleExt,
            ring: ringExt,
            pinky: pinkyExt
        },
        
        // Angles between fingers
        angles: {
            thumbIndex: thumbIndexAngle,
            indexMiddle: indexMiddleAngle,
            middleRing: middleRingAngle,
            ringPinky: ringPinkyAngle
        },
        
        // Palm orientation
        orientation: {
            facingCamera: isPalmFacingCamera,
            facingSideways: isPalmSideways
        },
        
        // Raw positions for additional analysis
        positions: {
            wrist,
            thumbTip,
            indexTip,
            middleTip,
            ringTip,
            pinkyTip,
            thumbBase,
            indexBase,
            middleBase,
            ringBase,
            pinkyBase,
            palmCenter
        },
        
        // Hand size for scaling
        handWidth
    };
}
// Add this at the end of your script
document.addEventListener('DOMContentLoaded', initializeApp);