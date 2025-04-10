// Current displayed month for calendar
let currentMonth = new Date();

// Initialize calendar when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Add Today button and info button to calendar
  enhanceCalendar();
  
  // Initialize the current month for calendar
  if (document.getElementById("activityCalendar")) {
    currentMonth = new Date();
    updateCalendar();
  }
});

// Function to add Today button and improve calendar
function enhanceCalendar() {
  const calendarHeader = document.querySelector('.calendar-header');
  if (!calendarHeader) return;
  
  // Add Today button to calendar header
  const todayButton = document.createElement('button');
  todayButton.className = 'calendar-nav today-btn';
  todayButton.textContent = 'Today';
  todayButton.onclick = goToToday;
  
  // Insert Today button between prev and next buttons
  calendarHeader.insertBefore(todayButton, calendarHeader.querySelector('.next'));
  
  // Add info button about calendar data
  const infoButton = document.createElement('div');
  infoButton.className = 'calendar-info-btn';
  infoButton.innerHTML = '<span>ⓘ</span>';
  infoButton.title = 'Calendar Information';
  infoButton.onclick = showCalendarInfo;
  calendarHeader.appendChild(infoButton);
}

// Function to navigate to previous month
function prevMonth() {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  updateCalendar();
}

// Function to navigate to next month
function nextMonth() {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  updateCalendar();
}

// Function to navigate to current month/today
function goToToday() {
  currentMonth = new Date();
  updateCalendar();
  
  // Highlight today's date in the calendar
  setTimeout(() => {
    const today = new Date();
    const todayCell = document.querySelector(`.calendar-day[data-day="${today.getDate()}"].today`);
    if (todayCell) {
      // Add a visual flash/highlight to draw attention to today's cell
      todayCell.classList.add('highlight-today');
      setTimeout(() => {
        todayCell.classList.remove('highlight-today');
      }, 1500);
      
      // Scroll to make today visible if needed
      todayCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

// Function to update calendar display
function updateCalendar() {
  const monthNames = ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"];
  
  const monthYear = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  
  // Update month title and display
  const titleElements = document.querySelectorAll('.calendar-title');
  const monthDisplayElements = document.querySelectorAll('.month-display');
  
  titleElements.forEach(el => {
    if (el) el.textContent = monthYear;
  });
  
  monthDisplayElements.forEach(el => {
    if (el) el.textContent = monthYear;
  });
  
  // Load activity data for the selected month
  loadCalendarData(currentMonth);
}

// Function to load calendar data from Firebase
function loadCalendarData(date) {
  if (!window.db) {
    console.error("Database not initialized");
    return;
  }
  
  const userId = sessionStorage.getItem('userId');
  if (!userId) return;
  
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // First, update the calendar grid with the correct dates
  generateCalendarGrid(year, month);
  
  // Get all session documents for this user
  window.db.collection("Client").doc(userId).collection("sessions")
    .get()
    .then((querySnapshot) => {
      // Create an object to store exercise data by day
      const exercisesByDay = {};
      
      // Process each session document
      querySnapshot.forEach((doc) => {
        const sessionId = doc.id;
        
        // Check if this session is from the current month
        // Parse the date from the document ID (format: DDMMYYYY)
        const day = parseInt(sessionId.substring(0, 2));
        const monthFromId = parseInt(sessionId.substring(2, 4)) - 1; // 0-based month
        const yearFromId = parseInt(sessionId.substring(4, 8));
        
        // Skip if not in the current month/year
        if (monthFromId !== month || yearFromId !== year) {
          return;
        }
        
        // Get the session data
        const data = doc.data();
        
        // Initialize data for this day if it doesn't exist
        if (!exercisesByDay[day]) {
          exercisesByDay[day] = {
            count: 0,
            duration: 0,
            intensity: 0,
            exercises: []
          };
        }
        
        // Count how many exercises by checking if there's an Exercise field
        if (data.Exercise) {
          exercisesByDay[day].count += 1;
          
          // Estimate duration based on number of reps
          let totalReps = 0;
          for (const field in data) {
            if (field.startsWith('set_') && field.includes('_rep_')) {
              totalReps += parseInt(data[field] || 0);
            }
          }
          
          // Estimate about 1 minute per 5 reps
          const estimatedDuration = Math.max(5, Math.ceil(totalReps / 5));
          exercisesByDay[day].duration += estimatedDuration;
          
          // Store exercise details
          exercisesByDay[day].exercises.push({
            name: data.Exercise,
            reps: totalReps,
            duration: estimatedDuration
          });
        }
        
        // Calculate intensity based on duration
        const intensity = Math.min(3, Math.ceil(exercisesByDay[day].duration / 15));
        exercisesByDay[day].intensity = intensity;
      });
      
      // Update the calendar with exercise data
      updateCalendarWithExercises(exercisesByDay);
      
      // Update the summary
      updateExerciseSummary(exercisesByDay);
    })
    .catch((error) => {
      console.error("Error getting session data:", error);
    });
}

// Function to generate the calendar grid for a given month
function generateCalendarGrid(year, month) {
  const calendarGrid = document.getElementById('activityCalendar');
  if (!calendarGrid) return;
  
  // Clear existing calendar
  calendarGrid.innerHTML = '';
  
  // Get first day of month and number of days in month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Add empty cells for days before the 1st of the month
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyDay);
  }
  
  // Add days of the month
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    dayCell.textContent = i;
    
    // Highlight today if we're viewing the current month and year
    if (today.getDate() === i && 
        today.getMonth() === month && 
        today.getFullYear() === year) {
      dayCell.classList.add('today');
    }
    
    // Add day data attribute for easier updates
    dayCell.dataset.day = i;
    
    calendarGrid.appendChild(dayCell);
  }
}

// Function to update calendar cells with exercise data
function updateCalendarWithExercises(exercisesByDay) {
  // For each day that has exercise data
  for (const day in exercisesByDay) {
    const intensity = exercisesByDay[day].intensity;
    
    // Find the calendar cell for this day
    const dayCell = document.querySelector(`.calendar-day[data-day="${day}"]`);
    if (dayCell) {
      // Remove any existing intensity classes
      dayCell.classList.remove('intensity-1', 'intensity-2', 'intensity-3');
      
      // Add the appropriate intensity class
      if (intensity > 0) {
        dayCell.classList.add(`intensity-${intensity}`);
      }
      
      // Add tooltip with exercise details
      dayCell.title = `${exercisesByDay[day].count} exercises, ${exercisesByDay[day].duration} minutes`;
      
      // Add click handler to show details
      dayCell.onclick = function() {
        showExerciseDetails(day, exercisesByDay[day]);
      };
    }
  }
}

// Enhanced exercise details popup
function showExerciseDetails(day, details) {
  // Format date for display
  const monthNames = ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"];
  const displayDate = `${monthNames[currentMonth.getMonth()]} ${day}, ${currentMonth.getFullYear()}`;
  
  // Calculate stats
  const avgDuration = Math.round(details.duration / details.count);
  const intensity = details.intensity === 1 ? "Light" : 
                   details.intensity === 2 ? "Moderate" : "Intense";
  
  // Create or update modal
  let modal = document.getElementById('exercise-details-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'exercise-details-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <div id="details-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add close button functionality
    modal.querySelector('.close-button').onclick = function() {
      modal.style.display = 'none';
    };
    
    // Close when clicking outside the modal
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    };
  }
  
  // Update content
  document.getElementById('details-body').innerHTML = `
    <h3>Exercise Details - ${displayDate}</h3>
    <div class="details-stats">
      <div class="detail-stat">
        <div class="stat-value">${details.count}</div>
        <div class="stat-label">Exercises</div>
      </div>
      <div class="detail-stat">
        <div class="stat-value">${details.duration}</div>
        <div class="stat-label">Minutes</div>
      </div>
      <div class="detail-stat">
        <div class="stat-value">${avgDuration}</div>
        <div class="stat-label">Avg Min/Exercise</div>
      </div>
      <div class="detail-stat">
        <div class="stat-value">${intensity}</div>
        <div class="stat-label">Intensity</div>
      </div>
    </div>
    <div class="details-actions">
      <button onclick="fetchDayExercises('${day}')">View Specific Exercises</button>
    </div>
    <div id="day-exercises" class="day-exercises">
      <!-- Specific exercises will be loaded here -->
    </div>
  `;
  
  // Show the modal
  modal.style.display = 'block';
}

// Function to fetch specific exercises for a day
function fetchDayExercises(day) {
  const exercisesContainer = document.getElementById('day-exercises');
  if (!exercisesContainer) return;
  
  exercisesContainer.innerHTML = '<p>Loading exercises...</p>';
  
  // If we have window.db, try to fetch the actual exercises
  if (window.db) {
    const userId = sessionStorage.getItem('userId');
    
    if (!userId) {
      exercisesContainer.innerHTML = '<p>No user information available.</p>';
      return;
    }
    
    // Format the day to match document ID format (DDMMYYYY)
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const formattedYear = String(currentMonth.getFullYear());
    const sessionId = formattedDay + formattedMonth + formattedYear;
    
    window.db.collection("Client").doc(userId).collection("sessions").doc(sessionId)
      .get()
      .then((docSnapshot) => {
        if (!docSnapshot.exists) {
          exercisesContainer.innerHTML = '<p>No exercise details found for this day.</p>';
          return;
        }
        
        const sessionData = docSnapshot.data();
        
        // Check if there's an Exercise field
        if (!sessionData.Exercise) {
          exercisesContainer.innerHTML = '<p>No specific exercise details found for this day.</p>';
          return;
        }
        
        let html = '<h4>Exercises Completed</h4><ul class="day-exercise-list">';
        
        // Count the number of sets and reps
        const repsBySet = {};
        
        // Look for set_X_rep_Y fields
        for (const field in sessionData) {
          if (field.startsWith('set_') && field.includes('_rep_')) {
            // Parse set and rep numbers
            const parts = field.split('_');
            if (parts.length === 4) {
              const setNum = parts[1];
              const repNum = parts[3];
              
              if (!repsBySet[setNum]) {
                repsBySet[setNum] = [];
              }
              
              repsBySet[setNum].push({
                repNum: repNum,
                value: sessionData[field]
              });
            }
          }
        }
        
        // Format exercise details
        html += `
          <li class="day-exercise-item">
            <div class="exercise-name">${sessionData.Exercise}</div>
            <div class="exercise-details">`;
        
        // Add each set and its reps
        for (const setNum in repsBySet) {
          // Sort reps by rep number
          repsBySet[setNum].sort((a, b) => parseInt(a.repNum) - parseInt(b.repNum));
          
          const repsText = repsBySet[setNum].map(rep => rep.value).join(', ');
          html += `<div>Set ${setNum}: ${repsText} reps</div>`;
        }
        
        html += `
            </div>
          </li>
        `;
        
        html += '</ul>';
        exercisesContainer.innerHTML = html;
      })
      .catch((error) => {
        console.error("Error fetching day exercises:", error);
        exercisesContainer.innerHTML = '<p>Error loading exercise details.</p>';
      });
  } else {
    exercisesContainer.innerHTML = '<p>Database not available to fetch exercise details.</p>';
  }
}

// Function to update the exercise summary
function updateExerciseSummary(exercisesByDay) {
  const activeDays = Object.keys(exercisesByDay).length;
  const summaryElement = document.querySelector('.progress-summary');
  
  if (summaryElement) {
    // Get current month name
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    const currentMonthName = monthNames[currentMonth.getMonth()];
    
    if (activeDays > 0) {
      // Calculate total duration
      let totalDuration = 0;
      for (const day in exercisesByDay) {
        totalDuration += exercisesByDay[day].duration;
      }
      
      // Update summary text
      summaryElement.innerHTML = `You've exercised on <strong>${activeDays} days</strong> in ${currentMonthName}, for a total of <strong>${totalDuration} minutes</strong>!`;
    } else {
      summaryElement.innerHTML = `No exercise data recorded for ${currentMonthName} yet. Start your journey today!`;
    }
  }
}

// Function to show calendar information
function showCalendarInfo() {
  // Create a modal or popup with calendar information
  const infoContent = `
    <h3>Exercise Activity Calendar</h3>
    <p>This calendar shows your exercise activity throughout the month:</p>
    <ul>
      <li><span class="legend-box no-activity"></span> No activity recorded for this day</li>
      <li><span class="legend-box intensity-1"></span> Light activity (less than 20 minutes)</li>
      <li><span class="legend-box intensity-2"></span> Moderate activity (20-40 minutes)</li>
      <li><span class="legend-box intensity-3"></span> Intense activity (more than 40 minutes)</li>
    </ul>
    <p>Click on any day to see details about your exercises for that day.</p>
    <p>Use the navigation buttons to move between months or return to today.</p>
  `;
  
  // Create modal container if it doesn't exist
  let modal = document.getElementById('calendar-info-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'calendar-info-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <div id="modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add close button functionality
    modal.querySelector('.close-button').onclick = function() {
      modal.style.display = 'none';
    };
    
    // Close when clicking outside the modal
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    };
  }
  
  // Update modal content and show it
  document.getElementById('modal-body').innerHTML = infoContent;
  modal.style.display = 'block';
}