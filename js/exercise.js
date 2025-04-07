/**
 * Bob.AI - Exercise Library Page JavaScript
 * Handles exercise library functionality
 */

// Redirect to Login if Not Logged In
if (!sessionStorage.getItem("isLoggedIn") && !window.location.pathname.includes("login.html")) {
  console.log("User not logged in, redirecting to login page");
  window.location.href = "login.html";
}

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Exercise Library page initialized");
  
  // Load today's program
  loadTodaysProgram();
});

// Load Today's Workout Program
function loadTodaysProgram() {
  const programContainer = document.getElementById('todayProgram');
  if (!programContainer) {
    console.log("Program container not found");
    return;
  }
  
  // Clear the container first to prevent duplicates
  programContainer.innerHTML = '';
  
  // Get current user
  const userId = sessionStorage.getItem('userId');
  console.log("Current User ID:", userId);

  if (!userId) {
    console.error('No user ID found');
    programContainer.innerHTML = `
      <div class="centered-content">
        <h4>Recommended Exercises</h4>
        <p>No specific exercises found.</p>
      </div>
    `;
    return;
  }

  // Predefined list of exercises to match exactly with Firebase documents
  const exercisesToCheck = [
    "Arm Raises",
    "Bicep Curls",
    "Hand Exercise",
    "Leg Extension", 
    "Sit and Stand",
    "Finger Exercise",
    "Front Raises",
    "Head Tilts",
    "Games"
  ];

  // Check if Firebase is initialized
  if (!window.db) {
    console.error("Database not initialized");
    programContainer.innerHTML = `
      <div class="centered-content">
        <h4>Recommended Exercises</h4>
        <p>No specific exercises found.</p>
      </div>
    `;
    return;
  }

  // Show loading state
  programContainer.innerHTML = `
    <div class="centered-content">
      <h4>Loading recommended exercises...</h4>
    </div>
  `;

  // Fetch recommended exercises from Firebase
  const exercisePromises = exercisesToCheck.map(exerciseName => 
    window.db.collection('Client').doc(userId)
      .collection('workout').doc(exerciseName)
      .get()
  );

  Promise.all(exercisePromises)
    .then((snapshots) => {
      // Start building HTML with centered content
      let html = `<div class="centered-content"><h4>Recommended Exercises</h4>`;
      
      // Process regular exercises (non-games)
      const regularExercises = snapshots
        .filter((doc, index) => {
          // Keep only documents that exist, have proper sets/reps, and are not Games
          return doc.exists && 
                 doc.data().sets > 0 && 
                 doc.data().reps > 0 && 
                 exercisesToCheck[index] !== "Games";
        })
        .map((doc, index) => {
          const exerciseData = doc.data();
          return {
            name: exercisesToCheck[index],
            sets: exerciseData.sets,
            reps: exerciseData.reps
          };
        });
      
      // Find the Games document if it exists
      const gamesDoc = snapshots.find((doc, index) => 
        doc.exists && exercisesToCheck[index] === "Games"
      );
      
      // If no exercises and no games
      if (regularExercises.length === 0 && !gamesDoc) {
        html += `<p>No specific exercises found.</p></div>`;
        programContainer.innerHTML = html;
        return;
      }
      
      // Build the HTML for regular exercises with details
      if (regularExercises.length > 0) {
        html += `<ul class="exercise-list">`;
        regularExercises.forEach(exercise => {
          html += `<li>
            <strong>${exercise.name}</strong> 
            - ${exercise.sets} sets × ${exercise.reps} reps
          </li>`;
        });
        html += `</ul>`;
      }
      
      // Add the Games section if the Games document exists
      if (gamesDoc) {
        const gameData = gamesDoc.data();
        console.log("Game data from Firebase:", gameData);
        
        // Check if there's a game property or similar in the document
        if (gameData) {
          html += `<h4>Games</h4>`;
          html += `<ul class="exercise-list">`;
          
          // If game is a string, display a single game
          if (typeof gameData.game === 'string') {
            html += `<li>
              <a href="javascript:void(0)" onclick="playGame('${gameData.game.toLowerCase()}')">
                <strong>${gameData.game}</strong>
              </a>
            </li>`;
          } 
          // If there's a specific game name field
          else if (typeof gameData.name === 'string') {
            html += `<li>
              <a href="javascript:void(0)" onclick="playGame('${gameData.name.toLowerCase()}')">
                <strong>${gameData.name}</strong>
              </a>
            </li>`;
          }
          // If there are multiple games or generic entries in the document
          else {
            // Just use the document ID as fallback
            html += `<li>
              <a href="javascript:void(0)" onclick="playGame('games')">
                <strong>Games</strong>
              </a>
            </li>`;
          }
          
          html += `</ul>`;
        }
      }
      
      // Close the centered-content div
      html += `</div>`;
      
      // Update the program container only once
      programContainer.innerHTML = html;
      
      // Add CSS for centering if it doesn't exist
      if (!document.getElementById('centered-styles')) {
        const style = document.createElement('style');
        style.id = 'centered-styles';
        style.textContent = `
          .centered-content {
            text-align: center;
            max-width: 500px;
            margin: 0 auto;
          }
          .exercise-list {
            list-style: none;
            padding: 0;
          }
          .exercise-list li {
            margin-bottom: 10px;
            padding: 8px;
            background-color: #f9f9e0;
            border-radius: 5px;
          }
          .exercise-list a {
            text-decoration: none;
            color: inherit;
            display: block;
            width: 100%;
          }
        `;
        document.head.appendChild(style);
      }
    })
    .catch((error) => {
      console.error("Error fetching recommended exercises:", error);
      programContainer.innerHTML = `
        <div class="centered-content">
          <h4>Recommended Exercises</h4>
          <p>Error loading exercises. Please try again later.</p>
        </div>
      `;
    });
}

/**
 * Start an exercise with the selected parameters
 * @param {string} exerciseId - The ID of the exercise to start
 */
function startExercise(exerciseId) {
  // Get exercise parameters
  const setsInput = document.getElementById(`${exerciseId}-sets`);
  const repsInput = document.getElementById(`${exerciseId}-reps`);
  
  /// Validate inputs
  const sets = setsInput ? parseInt(setsInput.value) : '';
  const reps = repsInput ? parseInt(repsInput.value) : '';
  
  // Save selected parameters to sessionStorage
  sessionStorage.setItem('exerciseSets', sets);
  sessionStorage.setItem('exerciseReps', reps);
  
  console.log(`Starting exercise: ${exerciseId} with ${sets} sets, ${reps} reps`);
  
  // Redirect to the appropriate exercise page
  switch(exerciseId) {
    case 'bicep-curl':
      window.location.href = 'workout_html/bicep.html';
      break;
    case 'arm-raises':
      window.location.href = 'workout_html/armraises.html';
      break;
    case 'sit-and-stand':
      window.location.href = 'workout_html/sitandstand.html';
      break;
    case 'leg-extension':
      window.location.href = 'workout_html/legextension.html';
      break;
    case 'hand-exercise':
      window.location.href = 'workout_html/handexercise.html';
      break;
    case 'finger-exercise':
      window.location.href = 'workout_html/fingerexercise.html';
      break;
    case 'front-raises':
      window.location.href = 'workout_html/frontraises.html';
      break;
    case 'head-tilts':
      window.location.href = 'workout_html/headtilts.html';
      break;
    default:
      console.log('No specific page for this exercise');
  }
}

// Game function
function playGame(gameId) {
  console.log(`Launching game: ${gameId}`);
  
  // Game routing based on ID
  switch(gameId.toLowerCase()) {
    
    case 'memory-match':
      // Redirect to the memory match game
      window.location.href = 'workout_html/memorygame.html';
      break;
    case 'herosays':
      window.location.href = 'workout_html/herosays.html';      
      break;
    case 'starcatchergame':
      window.location.href = 'workout_html/starcatchergame.html';
      break;
    case 'snakegame':
      window.location.href = 'workout_html/snakegame.html';
      break;
    default:
      alert(`Game "${gameId}" would launch here. This feature is coming soon!`);
  }
}

// Logout function
function logout() {
  console.log("Logging out user");
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("userId");
  window.location.href = "login.html";
}

// Toggle mobile menu
function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('show');
  }
}