/**
 * Teleconsultation Management Script
 */

// Redirect to Login if Not Logged In
if (!sessionStorage.getItem("isLoggedIn") && !window.location.pathname.includes("login.html")) {
    console.log("User not logged in, redirecting to login page");
    window.location.href = "login.html";
}

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Teleconsultation page initialized");
    
    // Initialize appointment booking functionality
    initAppointmentBooking();
});

// Initialize appointment booking functionality
function initAppointmentBooking() {
    const calendar = document.getElementById('appointment-calendar');
    if (!calendar) return;

    // Additional setup for appointment booking
    setupAppointmentSelection();
}

// Setup appointment date selection
function setupAppointmentSelection() {
    const calendar = document.getElementById('appointment-calendar');
    
    // Example of how to handle date selection
    calendar.addEventListener('dateClick', function(info) {
        const selectedDate = info.dateStr;
        bookAppointment(selectedDate);
    });
}

// Book an appointment
function bookAppointment(date) {
    // Validate date
    if (!date) {
        alert('Please select a valid date.');
        return;
    }

    // Confirmation dialog
    const confirm = window.confirm(`Do you want to book a consultation on ${date}?`);
    
    if (confirm) {
        // Here you would typically send the booking to your backend
        try {
            // Example of storing appointment in sessionStorage
            sessionStorage.setItem('pendingAppointment', date);
            
            // Update UI
            updateAppointmentStatus(date);
            
            alert(`Appointment booked for ${date}. We'll confirm details via email.`);
        } catch (error) {
            console.error('Appointment booking error:', error);
            alert('Failed to book appointment. Please try again.');
        }
    }
}

// Update appointment status in UI
function updateAppointmentStatus(date) {
    const statusElement = document.querySelector('.consultation-status');
    if (statusElement) {
        statusElement.innerHTML = `
            <p><strong>Next Consultation:</strong> ${date}</p>
            <p><strong>Status:</strong> Pending Confirmation</p>
        `;
    }
}

// Join Zoom Video Call
function joinVideoCall() {
    // Zoom Meeting Configuration 
    // Replace with your actual Zoom meeting details
    const zoomMeetingUrl = "https://zoom.us/j/your_meeting_id";
    
    // Check if user is logged in
    if (!sessionStorage.getItem("isLoggedIn")) {
        alert("Please log in to join the video consultation.");
        return;
    }

    // Check if there's a scheduled consultation
    const pendingAppointment = sessionStorage.getItem('pendingAppointment');
    if (!pendingAppointment) {
        alert("No upcoming consultation scheduled.");
        return;
    }

    // Confirm joining the call
    const confirmJoin = window.confirm("Are you ready to join the video consultation?");
    
    if (confirmJoin) {
        // Open Zoom meeting in a new window
        window.open(zoomMeetingUrl, "_blank");
    }
}

// Logout function
function logout() {
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

// Medical Notes Management
function loadMedicalNotes() {
    // In a real-world scenario, this would fetch notes from a backend
    const medicalNotesContainer = document.querySelector('.notes-container');
    
    if (!medicalNotesContainer) return;

    // Example hardcoded notes (would be replaced by backend data)
    const notes = [
        {
            title: "Progress Review",
            date: "March 1, 2025",
            content: "Patient showing significant improvement in upper body mobility. Recommended continued physical therapy."
        },
        {
            title: "Treatment Plan Update", 
            date: "February 15, 2025",
            content: "Adjusted exercise intensity. Focus on gradual strength building and range of motion exercises."
        }
    ];

    // Render notes
    medicalNotesContainer.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-header">
                <h3>${note.title}</h3>
                <span class="note-date">${note.date}</span>
            </div>
            <p>${note.content}</p>
        </div>
    `).join('');
}

// Initialize medical notes on page load
document.addEventListener('DOMContentLoaded', loadMedicalNotes);