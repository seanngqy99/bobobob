/*
Speech controlled Snake Game

The example lets you play Snake using the speech commands "up", "down", "left" and "right" via your microphone. 

Built with soundClassifier model from ml5js and p5js

Created by Andreas Refsgaard 2020

Snake Game adapted from https://p5js.org/examples/interaction-snake-game.html
by Prashant Gupta
*/


//Snake stuff
// the snake is divided into small segments, which are drawn and edited on each 'draw' call
let numSegments = 10;
let direction = 'right';

const xStart = 0; //starting x coordinate for snake
const yStart = 250; //starting y coordinate for snake
const diff = 10;

let xCor = [];
let yCor = [];

let xFruit = 0;
let yFruit = 0;
let scoreElem;

let classifier;
const options = {
  probabilityThreshold: 0.8
};
let label;
let confidence;
let instructions;

function preload() {
  // Load SpeechCommands18w sound classifier model
  classifier = ml5.soundClassifier('SpeechCommands18w', options);
}

function setup() {
  createCanvas(500, 500);
  scoreElem = createDiv('Score = 0');
  scoreElem.position(20, 20);
  scoreElem.id = 'score';
  scoreElem.style('color', 'white');

  frameRate(5);
  strokeWeight(10);
  stroke(255);
  updateFruitCoordinates();

  for (let i = 0; i < numSegments; i++) {
    xCor.push(xStart + i * diff);
    yCor.push(yStart);
  }
  // Create 'label' and 'confidence' div to hold results
  label = createDiv('Label: ...');
  confidence = createDiv('Confidence: ...');
  instructions = createDiv('Play Snake using the speech commands "up", "down", "left" and "right" via your microphone.');
  // Classify the sound from microphone in real time
  classifier.classify(gotResult);
}

// A function to run when we get any errors and the results
function gotResult(error, results) {
  // Display error in the console
  if (error) {
    console.error(error);
  }
  // The results are in an array ordered by confidence.
  //console.log(results);
  // Show the first label and confidence
  label.html('Label: ' + results[0].label);


  if (results[0].label == 'left' && direction !== 'right') {
    direction = 'left';
  }

  if (results[0].label == 'right' && direction !== 'left') {
    direction = 'right';
  }

  if (results[0].label == 'up' && direction !== 'down') {
    direction = 'up';
  }

  if (results[0].label == 'down' && direction !== 'up') {
    direction = 'down';
  }

  confidence.html('Confidence: ' + nf(results[0].confidence, 0, 2));
}


function draw() {
  background(0);
  for (let i = 0; i < numSegments - 1; i++) {
    line(xCor[i], yCor[i], xCor[i + 1], yCor[i + 1]);
  }
  updateSnakeCoordinates();
  checkGameStatus();
  checkForFruit();
}

//Click mouse to restart game
function mouseClicked() {
  numSegments = 10;
  direction = 'right';
  xCor = [];
  yCor = [];
  for (let i = 0; i < numSegments; i++) {
    xCor.push(xStart + i * diff);
    yCor.push(yStart);
  }

  scoreElem.html('Score = 0');
  loop();
}

function updateSnakeCoordinates() {
  for (let i = 0; i < numSegments - 1; i++) {
    xCor[i] = xCor[i + 1];
    yCor[i] = yCor[i + 1];
  }
  switch (direction) {
    case 'right':
      xCor[numSegments - 1] = xCor[numSegments - 2] + diff;
      yCor[numSegments - 1] = yCor[numSegments - 2];
      break;
    case 'up':
      xCor[numSegments - 1] = xCor[numSegments - 2];
      yCor[numSegments - 1] = yCor[numSegments - 2] - diff;
      break;
    case 'left':
      xCor[numSegments - 1] = xCor[numSegments - 2] - diff;
      yCor[numSegments - 1] = yCor[numSegments - 2];
      break;
    case 'down':
      xCor[numSegments - 1] = xCor[numSegments - 2];
      yCor[numSegments - 1] = yCor[numSegments - 2] + diff;
      break;
  }
}

/*
 I always check the snake's head position xCor[xCor.length - 1] and
 yCor[yCor.length - 1] to see if it touches the game's boundaries
 or if the snake hits itself.
*/
function checkGameStatus() {
  if (
    xCor[xCor.length - 1] > width ||
    xCor[xCor.length - 1] < 0 ||
    yCor[yCor.length - 1] > height ||
    yCor[yCor.length - 1] < 0 ||
    checkSnakeCollision()
  ) {
    noLoop();
    const scoreVal = parseInt(scoreElem.html().substring(8));
    scoreElem.html('Game ended! Your score was : ' + scoreVal + "\nClick mouse to start again");
  }
}

function checkSnakeCollision() {
  const snakeHeadX = xCor[xCor.length - 1];
  const snakeHeadY = yCor[yCor.length - 1];
  for (let i = 0; i < xCor.length - 1; i++) {
    if (xCor[i] === snakeHeadX && yCor[i] === snakeHeadY) {
      return true;
    }
  }
}

function checkForFruit() {
  point(xFruit, yFruit);
  if (xCor[xCor.length - 1] === xFruit && yCor[yCor.length - 1] === yFruit) {
    const prevScore = parseInt(scoreElem.html().substring(8));
    scoreElem.html('Score = ' + (prevScore + 1));
    xCor.unshift(xCor[0]);
    yCor.unshift(yCor[0]);
    numSegments++;
    updateFruitCoordinates();
  }
}

function updateFruitCoordinates() {
  xFruit = floor(random(10, (width - 100) / 10)) * 10;
  yFruit = floor(random(10, (height - 100) / 10)) * 10;
}