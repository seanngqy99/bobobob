
let video;
let bodyPose;
let poses = [];
let connections;

function preload() {
  bodyPose = ml5.bodyPose();
}

function setup() {
  let canvas = createCanvas(640, 480);
  canvas.parent('videoContainer');

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  bodyPose.detectStart(video, gotPoses);
  connections = bodyPose.getSkeleton();
}

function draw() {

  // Mirror the video feed
  push();
  translate(width, 0);
  scale(-1, 1);

  //Adjust image position to center zoomed out feed
  image(video, -0, -0, width, height);
  pop();

  // Draw skeleton and angles
  for (let pose of poses) {
    drawSkeleton(pose);
    drawAngles(pose);
  }
}

function drawSkeleton(pose) {
  for (let connection of connections) {
    let [pointAIndex, pointBIndex] = connection;
    let pointA = pose.keypoints[pointAIndex];
    let pointB = pose.keypoints[pointBIndex];

    if (pointA.score > 0.1 && pointB.score > 0.1) {
      stroke(255, 0, 0);
      strokeWeight(2);
      line(mirrorX(pointA.x), pointA.y, mirrorX(pointB.x), pointB.y);
    }
  }

  // Draw keypoints
  for (let keypoint of pose.keypoints) {
    if (keypoint.score > 0.1) {
      fill(0, 255, 0);
      noStroke();
      circle(mirrorX(keypoint.x), keypoint.y, 10);
    }
  }
}

function drawAngles(pose) {
  // Right side (appears on left in mirrored view)
  let rShoulder = pose.keypoints[6];
  let rElbow = pose.keypoints[8];
  let rWrist = pose.keypoints[10];
  let rHip = pose.keypoints[12];

  // Left side (appears on right in mirrored view)
  let lShoulder = pose.keypoints[5];
  let lElbow = pose.keypoints[7];
  let lWrist = pose.keypoints[9];
  let lHip = pose.keypoints[11];

  // Right elbow angle (left side of screen)
  if (rShoulder.score > 0.1 && rElbow.score > 0.1 && rWrist.score > 0.1) {
    let rElbowAngle = calculateAngle(rShoulder, rElbow, rWrist);
    drawAngle(rElbow, rElbowAngle, "R Elbow");
  }

  // Right shoulder angle (left side of screen)
  if (rHip.score > 0.1 && rShoulder.score > 0.1 && rElbow.score > 0.1) {
    let rShoulderAngle = calculateAngle(rHip, rShoulder, rElbow);
    drawAngle(rShoulder, rShoulderAngle, "R Shoulder");
  }

  // Left elbow angle (right side of screen)
  if (lShoulder.score > 0.1 && lElbow.score > 0.1 && lWrist.score > 0.1) {
    let lElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
    drawAngle(lElbow, lElbowAngle, "L Elbow");
  }

  // Left shoulder angle (right side of screen)
  if (lHip.score > 0.1 && lShoulder.score > 0.1 && lElbow.score > 0.1) {
    let lShoulderAngle = calculateAngle(lHip, lShoulder, lElbow);
    drawAngle(lShoulder, lShoulderAngle, "L Shoulder");
  }
}

function drawAngle(joint, angle, label) {
  fill(255, 255, 255);
  textSize(16);
  textAlign(CENTER, BOTTOM);
  text(`${label}: ${nf(angle, 0, 2)}°`, mirrorX(joint.x), joint.y - 20);
}

function calculateAngle(p1, p2, p3) {
  let v1 = createVector(p1.x - p2.x, p1.y - p2.y);
  let v2 = createVector(p3.x - p2.x, p3.y - p2.y);
  return degrees(v1.angleBetween(v2));
}

function mirrorX(x) {
  return width - x;
}

function gotPoses(results) {
  poses = results;
}