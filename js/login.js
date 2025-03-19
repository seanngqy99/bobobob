// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBffgdh_R6enZtaXoPkjI7aUw0iUeZLSK4",
    authDomain: "bobai-8c377.firebaseapp.com",
    projectId: "bobai-8c377",
    storageBucket: "bobai-8c377.appspot.com",
    messagingSenderId: "453258491853",
    appId: "1:453258491853:web:09880e222756b8719e7684",
    measurementId: "G-ZSZQYK2EC4"
  };
  console.log("Attempting to initialize Firebase...");
  
  // Check if Firebase is already initialized
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
      console.log("Firebase initialized successfully in login.js!");
      
      // Get a reference to Firestore database
      window.db = firebase.firestore(); // Use window.db instead of just db
      console.log("Firestore reference created successfully");
      
      // Handle Login Form
      if (document.getElementById("loginForm")) {
        console.log("Login form found, attaching event listener");
        
        // Password toggle
        document.getElementById("togglePassword").addEventListener("click", function () {
          const passwordField = document.getElementById("password");
          const isPasswordVisible = passwordField.type === "password";
          passwordField.type = isPasswordVisible ? "text" : "password";
          this.textContent = isPasswordVisible ? "🙈" : "👁️";
        });
        
        document.getElementById("loginForm").addEventListener("submit", function (event) {
          event.preventDefault(); // Prevent default form submission
          console.log("Login form submitted");
          
          const username = document.getElementById("username").value;
          const password = document.getElementById("password").value;
          
          console.log("Attempting login with username:", username);
          
          // Show loading state
          document.getElementById("message").textContent = "Checking credentials...";
          document.getElementById("message").style.color = "blue";
          
          console.log("Querying Firestore for document:", username);
          
          // Query Firestore for the client with matching document ID
          window.db.collection("Client").doc(username)
            .get()
            .then((docSnapshot) => {
              console.log("Query completed, document exists:", docSnapshot.exists);
              
              if (!docSnapshot.exists) {
                // No client found with that username
                console.log("No document found with ID:", username);
                document.getElementById("message").textContent = "Invalid username or password.";
                document.getElementById("message").style.color = "red";
                return;
              }
              
              // Client found, check password
              const clientData = docSnapshot.data();
              console.log("Document data retrieved, fields:", Object.keys(clientData));
              
              if (clientData.password === password) {
                // Password matches
                console.log("Password matched, logging in");
                sessionStorage.setItem("isLoggedIn", true); // Set session
                sessionStorage.setItem("user", clientData.Name); // Get Name from Firebase
                sessionStorage.setItem("userId", username);
                console.log("Redirecting to dashboard");
                window.location.href = "dashboard.html"; // Redirect to dashboard
              } else {
                // Password doesn't match
                console.log("Password did not match");
                document.getElementById("message").textContent = "Invalid username or password.";
                document.getElementById("message").style.color = "red";
              }
            })
            .catch((error) => {
              console.error("Error checking credentials:", error);
              console.error("Error code:", error.code);
              console.error("Error message:", error.message);
              document.getElementById("message").textContent = "An error occurred. Please try again.";
              document.getElementById("message").style.color = "red";
            });
        });
      }
      
    } catch (error) {
      console.error("Firebase initialization error:", error);
    }
  } else {
    console.log("Firebase already initialized, using existing instance");
    if (!window.db && firebase.firestore) {
      window.db = firebase.firestore();
    }
  }