// Redirect to Login if Not Logged In
if (!sessionStorage.getItem("isLoggedIn") && !window.location.pathname.includes("login.html")) {
    console.log("User not logged in, redirecting to login page");
    window.location.href = "login.html";
}

// Hardcoded user data
const hardcodedUsers = [
    {
        userId: 'seanngqy',
        firstName: 'Sean',
        lastName: 'Ng',
        email: 'seanngqy@gmail.com',
        age: 26,
        gender: 'male',
        height: 173,
        weight: 98,
        profilePictureUrl: '/api/placeholder/120/120',
        primaryCondition: 'Upper Body Rehabilitation',
        currentStatus: 'Active Recovery',
        consultingPhysician: 'Dr. Bob Lee',
        membershipType: 'Premium',
        notificationStatus: 'Enabled',
        lastLogin: 'March 15, 2025'
    }
];

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Profile page initialized");

    // Get current user's ID from session storage
    const userId = sessionStorage.getItem('userId');

    if (userId) {
        loadProfileData(userId);
    } else {
        console.error('No user ID found');
        window.location.href = 'login.html';
    }
});

// Load profile data from hardcoded users
function loadProfileData(userId) {
    const userData = hardcodedUsers.find(user => user.userId === userId);

    if (userData) {
        // Update profile header
        document.getElementById('profileName').textContent = 
            `${userData.firstName} ${userData.lastName}`;
        document.getElementById('userEmail').textContent = userData.email;
        
        // Update personal information
        document.getElementById('userAge').textContent = userData.age;
        document.getElementById('userGender').textContent = userData.gender;
        document.getElementById('userHeight').textContent = userData.height;
        document.getElementById('userWeight').textContent = userData.weight;
        
        // Update medical profile
        document.getElementById('primaryCondition').textContent = userData.primaryCondition;
        document.getElementById('currentStatus').textContent = userData.currentStatus;
        document.getElementById('consultingPhysician').textContent = userData.consultingPhysician;
        
        // Update account settings
        document.getElementById('membershipType').textContent = userData.membershipType;
        document.getElementById('notificationStatus').textContent = userData.notificationStatus;
        document.getElementById('lastLogin').textContent = userData.lastLogin;
        
        // Update profile picture
        if (userData.profilePictureUrl) {
            document.getElementById('profilePicture').src = userData.profilePictureUrl;
        }
        
        // Pre-fill edit profile form
        document.getElementById('firstName').value = userData.firstName;
        document.getElementById('lastName').value = userData.lastName;
        document.getElementById('email').value = userData.email;
        document.getElementById('age').value = userData.age;
        document.getElementById('gender').value = userData.gender;
        document.getElementById('height').value = userData.height;
        document.getElementById('weight').value = userData.weight;
    } else {
        console.error('User not found');
        window.location.href = 'login.html';
    }
}

// Handle form submission
document.getElementById('editProfileForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Collect form data
    const formData = new FormData(event.target);
    
    // Get current user ID
    const userId = sessionStorage.getItem('userId');
    
    // Find the user in the hardcoded array
    const userIndex = hardcodedUsers.findIndex(user => user.userId === userId);
    
    if (userIndex !== -1) {
        // Update user data
        hardcodedUsers[userIndex] = {
            ...hardcodedUsers[userIndex],
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            age: parseInt(formData.get('age')),
            gender: formData.get('gender'),
            height: parseInt(formData.get('height')),
            weight: parseInt(formData.get('weight'))
        };
        
        // Update page content
        loadProfileData(userId);
        
        // Close the modal
        closeEditProfileModal();
        
        // Show success message
        alert('Profile updated successfully!');
    } else {
        alert('Failed to update profile');
    }
});

// Profile picture preview
document.getElementById('profilePictureUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profilePicture').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Modal control functions
function editProfile() {
    const editProfileModal = document.getElementById('editProfileModal');
    editProfileModal.style.display = 'block';
}

function closeEditProfileModal() {
    const editProfileModal = document.getElementById('editProfileModal');
    editProfileModal.style.display = 'none';
}

// Close modal if clicked outside of it
window.addEventListener('click', function(event) {
    const editProfileModal = document.getElementById('editProfileModal');
    if (event.target == editProfileModal) {
        editProfileModal.style.display = 'none';
    }
});

// Logout function
function logout() {
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

// Toggle mobile menu
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('show');
}