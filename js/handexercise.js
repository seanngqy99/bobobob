let handPose;
let video;
let hands = [];
// Define your own hand skeleton connections
const handSkeleton = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // index finger
  [0, 9], [9, 10], [10, 11], [11, 12],   // middle finger
  [0, 13], [13, 14], [14, 15], [15, 16],  // ring finger
  [0, 17], [17, 18], [18, 19], [19, 20]   // pinky
];
let isHandOpen = false;
let gestureHistory = [];
let gestureConfidence = 0;
const HISTORY_LENGTH = 10;
let exerciseActive = false;
let targetReps = 10;
let currentReps = 0;
let selectedHand = 'right';
let lastGestureState = null;
let repComplete = false;

function preload() {
    handPose = ml5.handPose();
}

function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();
    
    handPose.detectStart(video, gotHands);
    // Optionally, you can remove the getConnections() call and use handSkeleton defined above.
    // connections = handPose.getConnections();
    
    // Create status display
    createDiv('Hand Status: ').id('status');
    createDiv('Gesture Confidence: ').id('confidence');

    // Add event listeners
    document.getElementById('startExercise').addEventListener('click', startExercise);
    document.getElementById('resetExercise').addEventListener('click', resetExercise);
    document.getElementById('handSelect').addEventListener('change', (e) => {
        selectedHand = e.target.value;
    });
    document.getElementById('repsInput').addEventListener('change', (e) => {
        targetReps = parseInt(e.target.value);
        updateExerciseStatus();
    });
}

function calculateHandOpenness(hand) {
    // Get fingertip and palm positions
    const palm = hand.keypoints[0];
    const fingertips = [
        hand.keypoints[4],  // thumb
        hand.keypoints[8],  // index
        hand.keypoints[12], // middle
        hand.keypoints[16], // ring
        hand.keypoints[20]  // pinky
    ];
    
    // Calculate average distance of fingertips from palm
    let totalDistance = 0;
    fingertips.forEach(tip => {
        const distance = dist(palm.x, palm.y, tip.x, tip.y);
        totalDistance += distance;
    });
    
    // Normalize by palm width (distance between index and pinky base)
    const palmWidth = dist(
        hand.keypoints[5].x, hand.keypoints[5].y,
        hand.keypoints[17].x, hand.keypoints[17].y
    );
    
    return totalDistance / (5 * palmWidth);
}

function updateGestureHistory(isOpen) {
    gestureHistory.push(isOpen);
    if (gestureHistory.length > HISTORY_LENGTH) {
        gestureHistory.shift();
    }
    
    // Calculate confidence based on consistency
    const trueCount = gestureHistory.filter(x => x).length;
    gestureConfidence = trueCount / gestureHistory.length;
}

function startExercise() {
    exerciseActive = true;
    currentReps = 0;
    targetReps = parseInt(document.getElementById('repsInput').value);
    document.getElementById('startExercise').disabled = true;
    document.getElementById('exerciseStatus').textContent = 'Status: In Progress';
    updateExerciseStatus();
}

function resetExercise() {
    exerciseActive = false;
    currentReps = 0;
    lastGestureState = null;
    repComplete = false;
    document.getElementById('startExercise').disabled = false;
    document.getElementById('exerciseStatus').textContent = 'Status: Not Started';
    updateExerciseStatus();
}

function updateExerciseStatus() {
    document.getElementById('repCount').textContent = `Reps: ${currentReps} / ${targetReps}`;
    if (currentReps >= targetReps && exerciseActive) {
        exerciseActive = false;
        document.getElementById('exerciseStatus').textContent = 'Status: Exercise Complete!';
        document.getElementById('startExercise').disabled = false;
    }
}

function checkHandedness(hand) {
    // Determine if the detected hand matches the selected hand
    // This is a simple implementation - you might need to adjust based on your needs
    const handCenter = hand.keypoints[0];
    const isRightHand = handCenter.x > width/2;
    
    return selectedHand === 'both' || 
           (selectedHand === 'right' && isRightHand) ||
           (selectedHand === 'left' && !isRightHand);
}

function draw() {
    // Set up mirroring transformation
    push();
    translate(width, 0);
    scale(-1, 1);
    
    // Draw video with mirroring
    image(video, 0, 0, width, height);

    if (hands.length > 0) {
        const hand = hands[0];
        const openness = calculateHandOpenness(hand);
        
        // Determine if hand is open (threshold can be adjusted)
        isHandOpen = openness > 1.2;
        updateGestureHistory(isHandOpen);
        
        // Draw skeleton connections using our defined handSkeleton
        stroke(255, 0, 0);
        strokeWeight(2);
        for (let i = 0; i < handSkeleton.length; i++) {
            const connection = handSkeleton[i];
            const pointA = hand.keypoints[connection[0]];
            const pointB = hand.keypoints[connection[1]];
            line(pointA.x, pointA.y, pointB.x, pointB.y);
        }
        
        // Draw keypoints
        for (let keypoint of hand.keypoints) {
            fill(0, 255, 0);
            noStroke();
            circle(keypoint.x, keypoint.y, 10);
        }
        
        pop(); // End mirroring transformation
        
        // Update status displays
        select('#status').html(`Hand Status: ${isHandOpen ? 'Open' : 'Closed'}`);
        select('#confidence').html(`Gesture Confidence: ${(gestureConfidence * 100).toFixed(1)}%`);
        
        if (exerciseActive && checkHandedness(hand)) {
            const currentState = isHandOpen;
            
            // Check for a complete open-close cycle
            if (lastGestureState !== null) {
                if (currentState && !lastGestureState && !repComplete) {
                    // Hand just opened
                    repComplete = true;
                } else if (!currentState && lastGestureState && repComplete) {
                    // Hand just closed, completing the rep
                    currentReps++;
                    repComplete = false;
                    updateExerciseStatus();
                }
            }
            lastGestureState = currentState;
        }
        
        // Update exercise status display
        if (exerciseActive) {
            select('#exerciseStatus').html(`Status: ${isHandOpen ? 'Open' : 'Close'} your hand`);
        }
    } else {
        // No hands detected
        select('#status').html('Hand Status: No hand detected');
        select('#confidence').html('Gesture Confidence: 0%');
    }
}

function gotHands(results) {
    hands = results;
}

// Add window resize handling
function windowResized() {
    resizeCanvas(640, 480);
}
