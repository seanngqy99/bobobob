import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

let video;
let canvas;
let ctx;
let detector;
let poses = [];
let connections;

// =============================
// Initialize Camera and BlazePose
// =============================
async function initializeBlazePose() {
  const videoContainer = document.getElementById("videoContainer");

  // Create video element
  video = document.createElement("video");
  video.width = 640;
  video.height = 480;
  video.autoplay = true;
  videoContainer.appendChild(video);

  // Access webcam
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  // Create canvas for rendering
  canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  videoContainer.appendChild(canvas);

  ctx = canvas.getContext("2d");

  video.onloadedmetadata = async () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    detector = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
      runtime: 'tfjs',
      modelType: 'full',
    });

    connections = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.BlazePose);

    detectPoses();
  };
}

// =============================
// Detect Poses and Render
// =============================
async function detectPoses() {
  async function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw mirrored video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const results = await detector.estimatePoses(video);

    if (results.length > 0) {
      poses = results;
      drawSkeleton(poses[0].keypoints);
      drawAngles(poses[0].keypoints);
    }

    requestAnimationFrame(render);
  }
  render();
}

// =============================
// Draw Skeleton
// =============================
function drawSkeleton(keypoints) {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;

  connections.forEach(([i, j]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];

    if (kp1.score > 0.5 && kp2.score > 0.5) {
      ctx.beginPath();
      ctx.moveTo(mirrorX(kp1.x), kp1.y);
      ctx.lineTo(mirrorX(kp2.x), kp2.y);
      ctx.stroke();
    }
  });

  keypoints.forEach((keypoint) => {
    if (keypoint.score > 0.5) {
      ctx.fillStyle = "green";
      ctx.beginPath();
      ctx.arc(mirrorX(keypoint.x), keypoint.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}

// =============================
// Draw Angles
// =============================
function drawAngles(keypoints) {
  const calculateAndDraw = (p1, p2, p3, label) => {
    if (p1.score > 0.5 && p2.score > 0.5 && p3.score > 0.5) {
      const angle = calculateAngle(p1, p2, p3);
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.fillText(`${label}: ${Math.round(angle)}°`, mirrorX(p2.x), p2.y - 10);
    }
  };

  // Right side (mirrored)
  calculateAndDraw(keypoints[12], keypoints[14], keypoints[16], "R Elbow");
  calculateAndDraw(keypoints[24], keypoints[12], keypoints[14], "R Shoulder");

  // Left side (mirrored)
  calculateAndDraw(keypoints[11], keypoints[13], keypoints[15], "L Elbow");
  calculateAndDraw(keypoints[23], keypoints[11], keypoints[13], "L Shoulder");
}

// =============================
// Calculate Angle
// =============================
function calculateAngle(p1, p2, p3) {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dotProduct = v1.x * v2.x + v1.y * v2.y;
  const magnitude1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
  const magnitude2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

  const angleInRadians = Math.acos(dotProduct / (magnitude1 * magnitude2));
  return (angleInRadians * 180) / Math.PI;
}

// =============================
// Utility Functions
// =============================
function mirrorX(x) {
  return canvas.width - x;
}

// =============================
// Initialize on Page Load
// =============================
initializeBlazePose();
