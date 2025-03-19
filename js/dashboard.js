/**
 * Bob.AI - Dashboard Page JavaScript
 * Handles dashboard-specific functionality
 */

// Redirect to Login if Not Logged In
if (!sessionStorage.getItem("isLoggedIn") && !window.location.pathname.includes("login.html")) {
  console.log("User not logged in, redirecting to login page");
  window.location.href = "login.html";
}

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Dashboard page initialized");
  
  // Update welcome message
  const welcomeMessageElement = document.getElementById("welcomeMessage");
  if (welcomeMessageElement) {
    console.log("Welcome message element found, populating");
    const user = sessionStorage.getItem("user") || "User";
    welcomeMessageElement.textContent = `Welcome, ${user}!`;
    console.log("Set welcome message to:", welcomeMessageElement.textContent);
  }
  
  // Update dashboard stats
  updateDashboardStats();
  
  // Fetch motivational quote
  if (document.getElementById('quote')) {
    fetchQuote();
  }
});

// Update dashboard statistics
function updateDashboardStats() {
  // This could fetch real-time data from your database
  // For now, it's just a placeholder
  console.log("Updating dashboard stats");
  
  // Example of how you might fetch real data
  if (window.db) {
    const userId = sessionStorage.getItem('userId') || sessionStorage.getItem('user');
    
    // Fetch session count
    window.db.collection("Exercises")
      .where("userId", "==", userId)
      .get()
      .then(snapshot => {
        if (!snapshot.empty) {
          // Count could be updated based on real data
          const sessionCount = snapshot.docs.length;
          const sessionCountElement = document.querySelector('.session-count');
          if (sessionCountElement) {
            sessionCountElement.textContent = sessionCount;
          }
        }
      })
      .catch(error => {
        console.error("Error fetching session data:", error);
      });
  }
}



// Logout function
function logout() {
  console.log("Logging out user");
  sessionStorage.removeItem("isLoggedIn"); // Clear session
  sessionStorage.removeItem("user"); // Clear user data
  sessionStorage.removeItem("userId"); // Clear user ID
  window.location.href = "login.html"; // Redirect to login page
}

// Navigation Handlers for Dashboard Links
function goToExerciseLibrary() {
  window.location.href = "exercise-library.html";
}

function goToProfile() {
  window.location.href = "profile.html";
}

function goToTeleconsultation() {
  window.location.href = "teleconsultation.html";
}

function backToDashboard() {
  window.location.href = "dashboard.html";
}

// Function to toggle mobile menu
function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('show');
  }
}