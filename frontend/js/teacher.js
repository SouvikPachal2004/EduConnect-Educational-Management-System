// Teacher Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Teacher dashboard loaded');
    
    // Initialize dashboard
    initializeDashboard();
    
    // Setup all event listeners
    setupEventListeners();
});

// Initialize dashboard
function initializeDashboard() {
    console.log('Initializing teacher dashboard...');
    
    // Load teacher profile
    loadTeacherProfile();
    
    // Load initial data
    loadInitialData();
}

// Load teacher profile
function loadTeacherProfile() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Fetch teacher profile from backend
    fetch('http://localhost:5002/api/users/profile', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store teacher profile in localStorage
            localStorage.setItem('teacherProfile', JSON.stringify(data.data));
            localStorage.setItem('currentUser', JSON.stringify(data.data));
            
            // Update UI with teacher info
            updateTeacherInfo(data.data);
        } else {
            console.error('Failed to fetch teacher profile:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching teacher profile:', error);
    });
}

// Update teacher info in UI
function updateTeacherInfo(teacher) {
    // Update welcome message
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${teacher.name}`;
    }
    
    // Update teacher info in sidebar
    const teacherNameElement = document.querySelector('.user-info h3');
    const teacherEmailElement = document.querySelector('.user-info p');
    
    if (teacherNameElement) {
        teacherNameElement.textContent = teacher.name;
    }
    
    if (teacherEmailElement) {
        teacherEmailElement.textContent = teacher.email;
    }
}

// Load initial data
function loadInitialData() {
    // Load data for all sections
    fetchGradesData();
    fetchStudentsData();
    fetchClassesData();
    fetchAssignmentsData();
    fetchResourcesData();
    fetchAttendanceData();
    
    // Set up periodic refresh for students data
    setInterval(fetchStudentsData, 30000); // Refresh every 30 seconds
}

// Setup all event listeners
function setupEventListeners() {
    setupNavigation();
    setupModals();    setupTabs();
    setupForms();
    setupCalendar();
    setupAttendance();
    setupPrediction();
    setupSearchAndFilters();
    setupInteractiveElements();
    setupNotifications();
    setupClassDetailsModal();
    setupStudentDetailsModal();
    setupAssignmentDetailsModal();
    setupEditGradeModal();
    setupViewMessageModal();
}

// Setup navigation between sections
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get section ID
            const sectionId = this.getAttribute('data-section');
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Load data for the section if needed
                switch(sectionId) {
                    case 'dashboard':
                        // Dashboard data is already loaded
                        break;
                    case 'classes':
                        // Classes data is already loaded
                        break;
                    case 'students':
                        // Ensure students data is loaded
                        fetchStudentsData();
                        break;
                    case 'grades':
                        // Grades data is already loaded
                        break;
                    case 'assignments':
                        // Assignments data is already loaded
                        break;
                    case 'resources':
                        // Resources data is already loaded
                        break;
                    case 'attendance':
                        // Attendance data is already loaded
                        break;
                    case 'analytics':
                        // Analytics data is already loaded
                        break;
                    case 'calendar':
                        // Calendar data is already loaded
                        break;
                    case 'messages':
                        // Messages data is already loaded
                        break;
                    case 'prediction':
                        console.log('Showing prediction section');
                        // Load predictions data
                        loadPredictions();
                        break;
                }
            }
            
            // Close mobile menu on selection
            document.getElementById('sidebar').classList.remove('active');
        });
    });
}

// Setup modal functionality
function setupModals() {
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Close modals with ESC key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

// Setup tab systems
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabContainer = this.closest('.tab-container') || document;
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all buttons in this container
            const buttonsInContainer = tabContainer.querySelectorAll('.tab-btn');
            buttonsInContainer.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab content in this container
            const contentsInContainer = tabContainer.querySelectorAll('.tab-content');
            contentsInContainer.forEach(content => content.classList.remove('active'));
            
            // Show selected tab content
            const targetContent = tabContainer.querySelector(`#${tabName}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Setup form submissions
function setupForms() {
    // Handle form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Form submission logic would go here
        });
    });
}

// Setup calendar functionality
function setupCalendar() {
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const currentMonthElement = document.getElementById('currentMonth');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            // Calendar navigation logic
            navigateCalendar(-1);
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function() {
            // Calendar navigation logic
            navigateCalendar(1);
        });
    }
    
    // Load initial calendar data
    loadCalendarData();
}

// Navigate calendar by month
function navigateCalendar(monthOffset) {
    // Implementation for navigating calendar months
    loadCalendarData();
}

// Load calendar data from backend
function loadCalendarData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Get current date range for calendar
    const startDate = getCurrentMonthStartDate();
    const endDate = getCurrentMonthEndDate();
    
    // Fetch date-wise attendance data from backend
    fetch(`http://localhost:5002/api/attendance/date-wise?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update calendar UI with attendance data
            updateCalendarUI(data.data);
        } else {
            console.error('Failed to fetch calendar data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching calendar data:', error);
    });
}

// Get start date of current month
function getCurrentMonthStartDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

// Get end date of current month
function getCurrentMonthEndDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
}

// Update calendar UI with attendance data
function updateCalendarUI(attendanceData) {
    console.log('Updating calendar with data:', attendanceData);
    
    // Update calendar section
    const calendarSection = document.getElementById('calendar');
    if (calendarSection) {
        const calendarGrid = calendarSection.querySelector('.calendar-grid');
        if (calendarGrid) {
            // Clear existing calendar days (except headers)
            const headers = calendarGrid.querySelectorAll('.calendar-day-header');
            headers.forEach(header => {
                header.remove();
            });
            
            // Re-add headers
            const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayHeaders.forEach(day => {
                const header = document.createElement('div');
                header.className = 'calendar-day-header';
                header.textContent = day;
                calendarGrid.appendChild(header);
            });
            
            // Generate calendar days for current month
            generateCalendarDays(calendarGrid, attendanceData);
        }
    }
}

// Generate calendar days
function generateCalendarDays(calendarGrid, attendanceData) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add cells for each day of the month
    const daysInMonth = lastDay.getDate();
    const today = now.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const calendarDay = document.createElement('div');
        calendarDay.className = 'calendar-day';
        
        // Highlight today
        if (day === today) {
            calendarDay.classList.add('today');
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        calendarDay.appendChild(dayNumber);
        
        // Check if we have attendance data for this day
        const dateStr = new Date(year, month, day).toISOString().split('T')[0];
        if (attendanceData[dateStr]) {
            // Add attendance indicators
            const attendanceIndicators = document.createElement('div');
            attendanceIndicators.className = 'attendance-indicators';
            
            // Count different statuses
            let presentCount = 0;
            let absentCount = 0;
            let lateCount = 0;
            
            attendanceData[dateStr].forEach(record => {
                switch(record.status) {
                    case 'present':
                        presentCount++;
                        break;
                    case 'absent':
                        absentCount++;
                        break;
                    case 'late':
                        lateCount++;
                        break;
                }
            });
            
            // Add indicator dots
            if (presentCount > 0) {
                const presentDot = document.createElement('div');
                presentDot.className = 'indicator-dot present';
                presentDot.title = `${presentCount} present`;
                attendanceIndicators.appendChild(presentDot);
            }
            
            if (absentCount > 0) {
                const absentDot = document.createElement('div');
                absentDot.className = 'indicator-dot absent';
                absentDot.title = `${absentCount} absent`;
                attendanceIndicators.appendChild(absentDot);
            }
            
            if (lateCount > 0) {
                const lateDot = document.createElement('div');
                lateDot.className = 'indicator-dot late';
                lateDot.title = `${lateCount} late`;
                attendanceIndicators.appendChild(lateDot);
            }
            
            calendarDay.appendChild(attendanceIndicators);
        }
        
        calendarGrid.appendChild(calendarDay);
    }
}

// Store date-wise attendance data
function storeDateWiseAttendance(date, attendanceData) {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Send date-wise attendance data to backend
    fetch('http://localhost:5002/api/attendance/date-wise', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            date: date,
            attendanceData: attendanceData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Date-wise attendance stored successfully:', data.data);
            // Reload calendar data to reflect changes
            loadCalendarData();
        } else {
            console.error('Failed to store date-wise attendance:', data.message);
        }
    })
    .catch(error => {
        console.error('Error storing date-wise attendance:', error);
    });
}

// Setup attendance system
function setupAttendance() {
    // Add event listener for the "Take Attendance" button
    const markAttendanceBtn = document.getElementById('markAttendanceBtn');
    if (markAttendanceBtn) {
        markAttendanceBtn.addEventListener('click', function(e) {
            e.preventDefault();
            takeFaceRecognitionAttendance();
        });
    }
}

// Take attendance using face recognition
function takeFaceRecognitionAttendance() {
    // Show confirmation dialog
    if (confirm('Start face recognition attendance system? This will open your camera.')) {
        // Call the face recognition system directly without class dependency
        launchFaceRecognitionSystem();
    }
}

// Launch face recognition system
function launchFaceRecognitionSystem() {
    // Show loading indicator
    showNotification('Launching face recognition system... Please wait for the camera window to appear.', 'info');
    
    // Get auth token
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        showNotification('Authentication required', 'error');
        return;
    }
    
    // Prepare payload (no class dependency for now)
    const payload = {
        date: new Date().toISOString().split('T')[0] // Current date
    };
    
    // Send request to launch face recognition system
    fetch('http://localhost:5002/api/attendance/launch-face-recognition', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Face recognition system launched successfully. Please check for the camera window and follow the instructions.', 'success');
            // Refresh attendance data after a delay to show updated attendance
            setTimeout(() => {
                fetchAttendanceData();
            }, 5000);
        } else {
            showNotification(`Failed to launch face recognition: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        console.error('Error launching face recognition:', error);
        showNotification('Failed to launch face recognition due to network error. Please make sure the backend server is running.', 'error');
    });
}

// These functions were used for simulation but are no longer needed
// as we're now using the real face recognition system

// Send attendance data to backend
function sendAttendanceToBackend(classId, date, attendanceData, authToken) {
    // Prepare payload
    const payload = {
        classId: classId,
        date: date,
        attendance: attendanceData.map(record => ({
            studentId: record.studentId,
            status: record.status,
            notes: 'Marked by face recognition system'
        }))
    };
    
    // Send to backend via face recognition endpoint
    fetch('http://localhost:5002/api/attendance/face-recognition', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Attendance marked successfully via face recognition', 'success');
            // Refresh attendance data
            fetchAttendanceData();
        } else {
            showNotification(`Failed to mark attendance: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        console.error('Error marking attendance:', error);
        showNotification('Failed to mark attendance due to network error', 'error');
    });
}

// Setup prediction system
function setupPrediction() {
    console.log('Setting up prediction system...');
    // Add event listener for refresh predictions button
    const refreshBtn = document.getElementById('refreshPredictionsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            refreshPredictions();
        });
    }
    
    // Load initial predictions
    loadPredictions();
}

// Refresh predictions
function refreshPredictions() {
    loadPredictions();
}

// Load predictions from backend
function loadPredictions() {
    console.log('Loading predictions...');
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Show loading indicator
    const predictionTableBody = document.getElementById('predictionTableBody');
    if (predictionTableBody) {
        predictionTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Loading predictions...</td></tr>';
    }
    
    // Directly fetch at-risk students predictions
    fetch('http://localhost:5002/api/prediction/at-risk', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Received predictions data:', data);
        if (data.success) {
            // Check if we have data
            if (data.data && data.data.length > 0) {
                console.log('Updating predictions table with data:', data.data);
                // Update predictions table with the fetched data
                updatePredictionsTable(data.data);
            } else {
                console.log('No prediction data available');
                // Try to get all students and generate predictions
                fetchAllStudentsAndGeneratePredictions(authToken);
            }
        } else {
            console.error('Failed to fetch predictions data:', data.message);
            showPredictionError('Failed to load predictions data');
        }
    })
    .catch(error => {
        console.error('Error fetching predictions data:', error);
        showPredictionError('Network error while loading predictions data');
    });
}

// Process student predictions
function processStudentPredictions(students) {
    if (!students || students.length === 0) {
        showPredictionError('No students found');
        return;
    }
    
    // Filter out any invalid student objects
    const validStudents = students.filter(student => 
        student && (student.studentId || student._id || student.name));
    
    if (validStudents.length === 0) {
        showPredictionError('No valid students found');
        return;
    }
    
    // Get auth token
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showPredictionError('Authentication required');
        return;
    }
    
    // Fetch comprehensive student data including grades and attendance
    fetchComprehensiveStudentData(validStudents, authToken);
}

// Fetch comprehensive student data
function fetchComprehensiveStudentData(students, authToken) {
    // We need to fetch actual student data including:
    // 1. Student profiles
    // 2. Attendance records
    // 3. Grade records
    // 4. Generate predictions based on this data
    
    // First, get detailed student information
    Promise.all(students.map(student => 
        fetch(`http://localhost:5002/api/users/${student._id || student.studentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            }
        }).then(response => response.json())
    ))
    .then(studentData => {
        // Get attendance data for all students
        return fetch('http://localhost:5002/api/attendance/department', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            }
        })
        .then(attendanceResponse => attendanceResponse.json())
        .then(attendanceData => {
            // Get grade data for all students
            return fetch('http://localhost:5002/api/teacher/department-grades', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                }
            })
            .then(gradeResponse => gradeResponse.json())
            .then(gradeData => ({
                studentData,
                attendanceData,
                gradeData
            }));
        });
    })
    .then(({ studentData, attendanceData, gradeData }) => {
        // Process the student data to extract features for prediction
        const predictions = studentData
            .filter(data => data.success)
            .map(data => {
                const student = data.data;
                
                // Extract attendance rate
                let attendanceRate = 85; // Default value
                let totalAttendance = 100; // Default value
                
                if (attendanceData.success && attendanceData.data) {
                    // Find attendance record for this student
                    const studentAttendance = attendanceData.data.find(record => 
                        record.student.studentId === student.studentId || 
                        record.student._id === student._id
                    );
                    
                    if (studentAttendance && studentAttendance.attendance) {
                        attendanceRate = studentAttendance.attendance;
                    }
                }
                
                // Extract grade information
                let grade = 3.2; // Default GPA value
                
                if (gradeData.success && gradeData.data && gradeData.data.grades) {
                    // Find grade record for this student
                    const studentGrade = gradeData.data.grades.find(g => 
                        g.student.studentId === student.studentId || 
                        g.student._id === student._id
                    );
                    
                    if (studentGrade && studentGrade.cgpa !== undefined) {
                        grade = studentGrade.cgpa;
                    }
                }
                
                // Create features for prediction using only the two required attributes
                const features = {
                    attendanceRate: attendanceRate,
                    totalAttendance: totalAttendance,
                    grade: grade // This represents the student's academic performance
                };
                
                return {
                    studentId: student.studentId || student._id,
                    studentName: student.name,
                    features: features
                };
            });
        
        // Now get predictions for each student
        fetchPredictionsForStudents(predictions, authToken);
    })
    .catch(error => {
        console.error('Error fetching comprehensive student data:', error);
        // Fallback to realistic mock data
        generateRealisticPredictions(students);
    });
}

// Fetch predictions for students
function fetchPredictionsForStudents(studentsWithFeatures, authToken) {
    // Get predictions for each student
    Promise.all(studentsWithFeatures.map(student => 
        fetch(`http://localhost:5002/api/prediction/students/${student.studentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            }
        }).then(response => response.json())
    ))
    .then(predictionsData => {
        // Process the predictions data
        const predictions = predictionsData
            .filter(data => data.success)
            .map((data, index) => {
                const student = studentsWithFeatures[index];
                const prediction = data.data;
                
                // Calculate current score from attendance and grade data
                const currentScore = Math.round((student.features.attendanceRate + student.features.grade * 10) / 2);
                
                return {
                    studentId: student.studentId,
                    studentName: student.studentName,
                    currentScore: currentScore,
                    predictedScore: prediction.predictedScore,
                    predictedGrade: prediction.predictedGrade,
                    riskLevel: prediction.riskLevel
                };
            });
        
        updatePredictionsTable(predictions);
    })
    .catch(error => {
        console.error('Error fetching predictions:', error);
        // Show error in UI
        showPredictionError('Failed to load predictions');
    });
}

// Generate a realistic score based on typical student performance distribution
function generateRealisticScore() {
    // Use a more realistic distribution (normal distribution centered around 75-80)
    const random = Math.random();
    if (random < 0.1) return Math.floor(Math.random() * 20) + 40; // 10% chance of failing (40-59)
    if (random < 0.3) return Math.floor(Math.random() * 15) + 60; // 20% chance of below average (60-74)
    if (random < 0.7) return Math.floor(Math.random() * 15) + 75; // 40% chance of average (75-89)
    return Math.floor(Math.random() * 11) + 90; // 30% chance of good/excellent (90-100)
}

// Generate realistic prediction for a student
function generateRealisticPrediction(student) {
    // Use actual student grade/CGPA from database if available
    let actualGrade = student.grade || student.cgpa || 0;
    
    // If no grade is available, generate a realistic mock score
    if (actualGrade === null || actualGrade === undefined || actualGrade === 0) {
        actualGrade = generateRealisticScore();
    }
    
    // Convert CGPA (0-10 scale) to percentage (0-100 scale) for display consistency
    const predictedScore = (actualGrade <= 10) ? actualGrade * 10 : actualGrade;
    const riskLevel = calculateRiskLevel(predictedScore);
    const predictedGrade = convertScoreToGrade(predictedScore);
    
    return {
        studentId: student.studentId || student._id || 'N/A',
        studentName: student.name || 'Unknown Student',
        predictedScore: Math.round(predictedScore),
        predictedGrade: predictedGrade,
        riskLevel: riskLevel
    };
}

// Check if student exists in database
function isStudentInDatabase(student, databaseStudents) {
    if (!student || !databaseStudents || !Array.isArray(databaseStudents)) {
        return false;
    }
    
    // More robust matching - check multiple possible ID fields
    return databaseStudents.some(dbStudent => {
        // Match by studentId
        if (student.studentId && (dbStudent.studentId === student.studentId || dbStudent._id === student.studentId)) {
            return true;
        }
        
        // Match by _id
        if (student._id && (dbStudent.studentId === student._id || dbStudent._id === student._id)) {
            return true;
        }
        
        // Match by email
        if (student.email && dbStudent.email === student.email) {
            return true;
        }
        
        // Match by name (less reliable but sometimes necessary)
        if (student.studentName && dbStudent.name === student.studentName) {
            return true;
        }
        
        // Additional matching for different data structures
        if (student.name && dbStudent.name === student.name) {
            return true;
        }
        
        return false;
    });
}

// Generate realistic predictions for all students
function generateRealisticPredictions(students) {
    const predictions = students.map(student => generateRealisticPrediction(student));
    updatePredictionsTable(predictions);
}

// Calculate risk level based on score
function calculateRiskLevel(score) {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
}

// Generate mock prediction for a student
function generateMockPrediction(student) {
    // Generate realistic mock data
    const predictedScore = Math.floor(Math.random() * 40) + 60; // Between 60-99
    const riskLevels = ['low', 'medium', 'high'];
    const riskLevel = predictedScore < 70 ? 'high' : predictedScore < 80 ? 'medium' : 'low';
    const predictedGrade = convertScoreToGrade(predictedScore);
    
    return {
        studentId: student.studentId || student._id || 'N/A',
        studentName: student.name || 'Unknown Student',
        predictedScore: predictedScore,
        predictedGrade: predictedGrade,
        riskLevel: riskLevel
    };
}

// Generate mock predictions for all students
function generateMockPredictions(students) {
    const predictions = students.map(student => generateMockPrediction(student));
    updatePredictionsTable(predictions);
}

// Convert score to letter grade
function convertScoreToGrade(score) {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 65) return 'D';
    return 'F';
}

// Update predictions table with data
function updatePredictionsTable(predictions) {
    console.log('Updating predictions table with data:', predictions);
    const predictionTableBody = document.getElementById('predictionTableBody');
    if (!predictionTableBody) {
        console.log('Prediction table body not found');
        return;
    }
    
    // Handle different data structures
    let processedPredictions = [];
    
    // If predictions is an object with a data property, use that
    if (predictions && typeof predictions === 'object' && !Array.isArray(predictions) && predictions.data) {
        processedPredictions = Array.isArray(predictions.data) ? predictions.data : [predictions.data];
    } else if (Array.isArray(predictions)) {
        processedPredictions = predictions;
    } else if (predictions) {
        processedPredictions = [predictions];
    }
    
    console.log('Processed predictions:', processedPredictions);
    
    if (!processedPredictions || processedPredictions.length === 0) {
        predictionTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No predictions available</td></tr>';
        return;
    }
    
    predictionTableBody.innerHTML = '';
    
    processedPredictions.forEach(prediction => {
        const row = document.createElement('tr');
        
        // Determine risk level class
        let riskLevelClass = 'badge-success';
        if (prediction.riskLevel === 'medium') {
            riskLevelClass = 'badge-warning';
        } else if (prediction.riskLevel === 'high') {
            riskLevelClass = 'badge-danger';
        }
        
        // Use either studentId or studentName depending on data structure
        const studentId = prediction.studentId || prediction._id || 'N/A';
        const studentName = prediction.studentName || prediction.name || 'Unknown Student';
        const actualScore = prediction.currentScore || prediction.actualScore || 0;
        const predictedScore = prediction.predictedScore || 0;
        
        row.innerHTML = `
            <td>${studentId}</td>
            <td>${studentName}</td>
            <td>${actualScore}%</td>
            <td>${predictedScore}%</td>
            <td><span class="badge ${riskLevelClass}">${(prediction.riskLevel || 'low').charAt(0).toUpperCase() + (prediction.riskLevel || 'low').slice(1)}</span></td>
            <td>
                <button class="btn btn-sm btn-outline view-prediction" data-student-id="${studentId}">View Details</button>
            </td>
        `;
        
        predictionTableBody.appendChild(row);
    });
    
    // Update summary cards
    updatePredictionSummary(processedPredictions);
    
    // Attach event listeners to view detail buttons
    attachViewPredictionListeners();
}

// Update prediction summary cards
function updatePredictionSummary(predictions) {
    if (!predictions || predictions.length === 0) return;
    
    // Calculate statistics
    let atRiskCount = 0;
    let highPerformersCount = 0;
    let totalScore = 0;
    let interventionNeededCount = 0;
    
    predictions.forEach(prediction => {
        // Check risk level
        if (prediction.riskLevel === 'high') {
            atRiskCount++;
            interventionNeededCount++;
        } else if (prediction.riskLevel === 'medium') {
            interventionNeededCount++;
        }
        
        // Check if high performer (score >= 90)
        if (prediction.predictedScore >= 90) {
            highPerformersCount++;
        }
        
        // Add to total score
        totalScore += prediction.predictedScore;
    });
    
    const avgScore = Math.round(totalScore / predictions.length);
    
    // Update summary cards
    const summaryCards = document.querySelectorAll('.summary-card');
    if (summaryCards.length >= 4) {
        summaryCards[0].querySelector('.summary-value').textContent = atRiskCount;
        summaryCards[1].querySelector('.summary-value').textContent = highPerformersCount;
        summaryCards[2].querySelector('.summary-value').textContent = `${avgScore}%`;
        summaryCards[3].querySelector('.summary-value').textContent = interventionNeededCount;
    }
}

// Attach event listeners to view prediction buttons
function attachViewPredictionListeners() {
    // Remove any existing event listeners to prevent duplicates
    document.querySelectorAll('.view-prediction').forEach(button => {
        button.removeEventListener('click', handleViewPredictionClick);
        button.addEventListener('click', handleViewPredictionClick);
    });
}

// Handle view prediction click event
function handleViewPredictionClick(e) {
    e.preventDefault();
    const studentId = this.getAttribute('data-student-id');
    viewStudentPrediction(studentId);
}

// View student prediction details
function viewStudentPrediction(studentId) {
    // In a real implementation, this would fetch detailed prediction data
    // For now, we'll show a more informative message
    showNotification(`Viewing details for student ${studentId}. In a full implementation, this would show detailed performance analytics.`, 'info');
}

// Show prediction error
function showPredictionError(message) {
    const predictionTableBody = document.getElementById('predictionTableBody');
    if (predictionTableBody) {
        predictionTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${message}</td></tr>`;
    }
}

// Fetch all students and generate predictions
function fetchAllStudentsAndGeneratePredictions(authToken) {
    console.log('Fetching all students to generate predictions...');
    
    // Fetch all students in the teacher's department
    fetch('http://localhost:5002/api/teacher/students', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Received students data:', data);
        if (data.success && data.data && data.data.users && data.data.users.length > 0) {
            // Generate predictions for all students
            const students = data.data.users;
            const predictions = students.map(student => {
                // Calculate current score from grade (assuming 100% attendance for mock data)
                const currentScore = student.grade ? (student.grade <= 10 ? Math.round((100 + student.grade * 10) / 2) : Math.round((100 + student.grade) / 2)) : Math.floor(Math.random() * 40) + 60;
                const predictedScore = student.grade ? (student.grade <= 10 ? student.grade * 10 : student.grade) : Math.floor(Math.random() * 40) + 60;
                
                return {
                    studentId: student.studentId || student._id,
                    studentName: student.name,
                    currentScore: currentScore,
                    predictedScore: predictedScore,
                    riskLevel: student.grade ? (student.grade < 6 ? 'high' : student.grade < 7 ? 'medium' : 'low') : 'medium'
                };
            });
            
            console.log('Generated predictions:', predictions);
            updatePredictionsTable(predictions);
        } else {
            console.log('No students found, showing error');
            showPredictionError('No predictions available');
        }
    })
    .catch(error => {
        console.error('Error fetching students data:', error);
        showPredictionError('Failed to load student data for predictions');
    });
}

// Setup search and filtering
function setupSearchAndFilters() {
    // Search and filter logic
}

// Setup interactive elements
function setupInteractiveElements() {
    // Add event listener for export grades button
    const exportGradesBtn = document.getElementById('exportGradesBtn');
    if (exportGradesBtn) {
        exportGradesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportGradesToCSV();
        });
    }
    
    // Add event listener for create assignment button
    const createAssignmentBtn = document.getElementById('createAssignmentBtn');
    if (createAssignmentBtn) {
        createAssignmentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Open the create assignment modal
            const modal = document.getElementById('createAssignmentModal');
            if (modal) {
                modal.style.display = 'block';
            }
        });
    }
}

// Setup notification system
function setupNotifications() {
    // Notification system logic
}

// Setup class details modal
function setupClassDetailsModal() {
    // Class details modal logic
}

// Setup student details modal
function setupStudentDetailsModal() {
    // Student details modal logic
}

// Setup assignment details modal
function setupAssignmentDetailsModal() {
    // Handle create assignment form submission
    const createAssignmentForm = document.getElementById('createAssignmentForm');
    if (createAssignmentForm) {
        createAssignmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createAssignment();
        });
    }
    
    // Handle assignment file input change to show file name
    const assignmentFileInput = document.getElementById('assignmentFile');
    if (assignmentFileInput) {
        assignmentFileInput.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'Choose file';
            const label = this.nextElementSibling || this.parentElement.querySelector('label');
            if (label) {
                label.textContent = fileName;
            }
        });
    }
}

// Create assignment with file upload
function createAssignment() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Authentication required', 'error');
        return;
    }
    
    const form = document.getElementById('createAssignmentForm');
    const formData = new FormData(form);
    
    // Get form values
    const title = document.getElementById('assignmentTitle').value;
    const classId = document.getElementById('assignmentClass').value;
    const description = document.getElementById('assignmentDescription').value;
    const dueDate = document.getElementById('assignmentDueDate').value;
    const maxPoints = document.getElementById('assignmentPoints').value;
    const saveAsDraft = document.getElementById('saveAsDraft').checked;
    
    // Validate required fields
    if (!title || !classId || !description || !dueDate || !maxPoints) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Append form data
    formData.append('title', title);
    formData.append('classId', classId);
    formData.append('description', description);
    formData.append('dueDate', dueDate);
    formData.append('maxPoints', maxPoints);
    formData.append('status', saveAsDraft ? 'draft' : 'published');
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creating...';
    submitButton.disabled = true;
    
    // Send request to create assignment
    fetch('http://localhost:5002/api/assignments', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Assignment created successfully!', 'success');
            
            // Reset form
            form.reset();
            
            // Close modal
            const modal = document.getElementById('createAssignmentModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Refresh assignments list
            fetchAssignmentsData();
        } else {
            showNotification(data.message || 'Failed to create assignment', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating assignment:', error);
        showNotification('Failed to create assignment', 'error');
    })
    .finally(() => {
        // Restore button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

// Generate assignment card preview
function generateAssignmentCard(title, description, dueDate, classId, maxPoints, file = null) {
    // Format the due date for display
    const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Get class name from classId
    const classNames = {
        'ds201': 'Data Structures',
        'algo301': 'Algorithms',
        'db301': 'Database Systems',
        'se401': 'Software Engineering'
    };
    
    const className = classNames[classId] || classId;
    
    // Create card HTML
    const cardHTML = `
        <div class="assignment-preview-card">
            <div class="card-header">
                <h3>${title}</h3>
                <div class="assignment-meta">
                    <span class="class-tag">${className}</span>
                    <span class="points">${maxPoints} points</span>
                </div>
            </div>
            <div class="card-body">
                <p class="assignment-description">${description}</p>
                <div class="assignment-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>Due: ${formattedDueDate}</span>
                    </div>
                    ${file ? `
                    <div class="detail-item">
                        <i class="fas fa-paperclip"></i>
                        <span>Attachment: ${file.name}</span>
                    </div>` : ''}
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-primary" onclick="confirmCreateAssignment()">Confirm & Create</button>
                <button class="btn btn-outline" onclick="cancelAssignmentPreview()">Cancel</button>
            </div>
        </div>
    `;
    
    return cardHTML;
}

// Show assignment preview card
function showAssignmentPreview() {
    // Get form values
    const title = document.getElementById('assignmentTitle').value;
    const classId = document.getElementById('assignmentClass').value;
    const description = document.getElementById('assignmentDescription').value;
    const dueDate = document.getElementById('assignmentDueDate').value;
    const maxPoints = document.getElementById('assignmentPoints').value;
    const fileInput = document.getElementById('assignmentFile');
    
    // Validate required fields
    if (!title || !classId || !description || !dueDate || !maxPoints) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Get file if selected
    const file = fileInput.files.length > 0 ? fileInput.files[0] : null;
    
    // Generate card
    const cardHTML = generateAssignmentCard(title, description, dueDate, classId, maxPoints, file);
    
    // Show preview in modal
    const modalBody = document.querySelector('#createAssignmentModal .modal-body');
    modalBody.innerHTML = cardHTML;
    
    // Change modal title
    document.querySelector('#createAssignmentModal .modal-header h2').textContent = 'Review Assignment';
    
    // Store form data for confirmation
    window.assignmentFormData = {
        title,
        classId,
        description,
        dueDate,
        maxPoints,
        file,
        saveAsDraft: document.getElementById('saveAsDraft').checked
    };
}

// Confirm and create assignment from preview
function confirmCreateAssignment() {
    // Restore form
    restoreAssignmentForm();
    
    // Create assignment
    createAssignment();
}

// Cancel assignment preview
function cancelAssignmentPreview() {
    // Restore form
    restoreAssignmentForm();
}

// Restore assignment form after preview
function restoreAssignmentForm() {
    const modalBody = document.querySelector('#createAssignmentModal .modal-body');
    
    // Restore original form
    modalBody.innerHTML = `
        <form id="createAssignmentForm">
            <div class="form-group">
                <label for="assignmentTitle">Assignment Title</label>
                <input type="text" id="assignmentTitle" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="assignmentClass">Class</label>
                <select id="assignmentClass" class="form-control" required>
                    <option value="">Select a class</option>
                    <option value="ds201">Data Structures</option>
                    <option value="algo301">Algorithms</option>
                    <option value="db301">Database Systems</option>
                    <option value="se401">Software Engineering</option>
                </select>
            </div>
            <div class="form-group">
                <label for="assignmentDescription">Description</label>
                <textarea id="assignmentDescription" class="form-control" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label for="assignmentDueDate">Due Date</label>
                <input type="datetime-local" id="assignmentDueDate" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="assignmentPoints">Total Points</label>
                <input type="number" id="assignmentPoints" class="form-control" min="1" required>
            </div>
            <div class="form-group">
                <label for="assignmentFile">Attachment (Optional)</label>
                <input type="file" id="assignmentFile" class="form-control">
                <label for="assignmentFile" class="file-label">Choose file</label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="saveAsDraft"> Save as Draft
                </label>
            </div>
            <button type="button" class="btn btn-secondary" onclick="showAssignmentPreview()">Preview</button>
            <button type="submit" class="btn btn-primary">Create Assignment</button>
        </form>
    `;
    
    // Restore modal title
    document.querySelector('#createAssignmentModal .modal-header h2').textContent = 'Create Assignment';
    
    // Reattach event listeners
    setupAssignmentDetailsModal();
    
    // Re-populate form if we have data
    if (window.assignmentFormData) {
        document.getElementById('assignmentTitle').value = window.assignmentFormData.title;
        document.getElementById('assignmentClass').value = window.assignmentFormData.classId;
        document.getElementById('assignmentDescription').value = window.assignmentFormData.description;
        document.getElementById('assignmentDueDate').value = window.assignmentFormData.dueDate;
        document.getElementById('assignmentPoints').value = window.assignmentFormData.maxPoints;
        document.getElementById('saveAsDraft').checked = window.assignmentFormData.saveAsDraft;
        
        // Clean up
        delete window.assignmentFormData;
    }
}

// Setup edit grade modal
function setupEditGradeModal() {
    // Edit grade modal logic
}

// Setup view message modal
function setupViewMessageModal() {
    // View message modal logic
}

// Download assignment file
function downloadAssignmentFile(assignmentId, filename) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Authentication required', 'error');
        return;
    }
    
    // Create download link
    const downloadUrl = `http://localhost:5002/api/assignments/${assignmentId}/download/${filename}`;
    
    // Create temporary link element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download submission file
function downloadSubmissionFile(submissionId, filename) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Authentication required', 'error');
        return;
    }
    
    // Create download link
    const downloadUrl = `http://localhost:5002/api/assignments/submissions/${submissionId}/download/${filename}`;
    
    // Create temporary link element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Fetch classes data from backend
function fetchClassesData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Fetch classes data from backend
    fetch('http://localhost:5002/api/classes', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store classes data in localStorage
            localStorage.setItem('classesData', JSON.stringify(data.data));
            
            // Update classes list in UI
            updateClassesList(data.data.classes);
        } else {
            console.error('Failed to fetch classes data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching classes data:', error);
    });
}

// Fetch assignments data from backend
function fetchAssignmentsData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Fetch assignments data from backend
    fetch('http://localhost:5002/api/assignments', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store assignments data in localStorage
            localStorage.setItem('assignmentsData', JSON.stringify(data.data));
            
            // Update assignments list in UI
            updateAssignmentsList(data.data.assignments);
        } else {
            console.error('Failed to fetch assignments data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching assignments data:', error);
    });
}

// Fetch students data from backend
function fetchStudentsData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Use the new teacher-specific endpoint to get students in the teacher's department
    const url = 'http://localhost:5002/api/teacher/students';
    
    console.log('Fetching students data from:', url);
    
    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        console.log('Received response from students API:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Students data received:', data);
        if (data.success) {
            const students = data.data.users;
            console.log('Students found:', students);
            
            // Store students data in localStorage
            localStorage.setItem('studentsData', JSON.stringify({ users: students }));
            
            // Update students list in UI
            updateStudentsList(students);
        } else {
            console.error('Failed to fetch students data:', data.message);
            // Show error in UI
            updateStudentsList([]); // Pass empty array to show "No students found" message
        }
    })
    .catch(error => {
        console.error('Error fetching students data:', error);
        // Show error in UI
        updateStudentsList([]); // Pass empty array to show "No students found" message
    });
}

// Fetch resources data from backend
function fetchResourcesData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Fetch resources data from backend
    fetch('http://localhost:5002/api/resources', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store resources data in localStorage
            localStorage.setItem('resourcesData', JSON.stringify(data.data));
            
            // Update resources list in UI
            updateResourcesList(data.data.resources);
        } else {
            console.error('Failed to fetch resources data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching resources data:', error);
    });
}

// Fetch attendance data from backend
function fetchAttendanceData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Use the new department-wise endpoint to get attendance data
    const url = 'http://localhost:5002/api/attendance/department';
    
    console.log('Fetching department attendance data from:', url);
    
    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Department attendance data received:', data.data);
            // Store attendance data in localStorage
            localStorage.setItem('attendanceData', JSON.stringify(data.data));
            
            // Update attendance list in UI
            updateAttendanceList(data.data);
        } else {
            console.error('Failed to fetch attendance data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching attendance data:', error);
    });
}

// Fetch grades data from backend
function fetchGradesData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Use the teacher-specific endpoint to get students in the teacher's department
    const url = 'http://localhost:5002/api/teacher/students';
    
    console.log('Fetching students data for grades section from:', url);
    
    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        console.log('Received response from students API:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Students data received:', data);
        if (data.success) {
            const students = data.data.users;
            console.log('Students found:', students);
            
            // Store students data in localStorage
            localStorage.setItem('gradesData', JSON.stringify({ users: students }));
            
            // Update grades list in UI with students data
            updateGradesList(students);
        } else {
            console.error('Failed to fetch students data:', data.message);
            // Show error in UI
            updateGradesList([]); // Pass empty array to show "No students found" message
        }
    })
    .catch(error => {
        console.error('Error fetching students data:', error);
        // Show error in UI
        updateGradesList([]); // Pass empty array to show "No students found" message
    });
}

// Update classes list in UI
function updateClassesList(classes) {
    console.log('Updating classes list with data:', classes);
    
    // Update classes section
    const classesSection = document.getElementById('classes');
    if (classesSection) {
        const classList = classesSection.querySelector('.class-list');
        if (classList) {
            classList.innerHTML = '';
            
            // Check if classes array is empty
            if (!classes || classes.length === 0) {
                classList.innerHTML = '<li class="no-data">No classes found</li>';
                return;
            }
            
            classes.forEach(cls => {
                const li = document.createElement('li');
                li.className = 'class-item';
                li.innerHTML = `
                    <div class="class-details">
                        <div class="class-name">${cls.name}</div>
                        <div class="class-info">
                            <i class="fas fa-code"></i> ${cls.code}
                            <i class="fas fa-users ml-3"></i> ${cls.students ? cls.students.length : 0} students
                            <i class="fas fa-clock ml-3"></i> ${cls.schedule || 'Not specified'}
                        </div>
                    </div>
                    <div class="class-action">
                        <a href="#" class="btn btn-primary btn-sm manage-class" data-class-id="${cls._id}">Manage</a>
                    </div>
                `;
                classList.appendChild(li);
            });
        }
    }
}

// Update assignments list in UI
function updateAssignmentsList(assignments) {
    console.log('Updating assignments list with data:', assignments);
    
    // Update assignments section
    const assignmentsSection = document.getElementById('assignments');
    if (assignmentsSection) {
        const pendingList = assignmentsSection.querySelector('#pendingAssignmentsList');
        const completedList = assignmentsSection.querySelector('#completedAssignmentsList');
        
        if (pendingList) {
            pendingList.innerHTML = '';
            
            // Filter pending assignments (not yet due)
            const pendingAssignments = assignments.filter(assignment => {
                const dueDate = new Date(assignment.dueDate);
                const now = new Date();
                return dueDate > now;
            });
            
            // Check if pending assignments array is empty
            if (!pendingAssignments || pendingAssignments.length === 0) {
                pendingList.innerHTML = '<li class="no-data">No pending assignments</li>';
            } else {
                pendingAssignments.forEach(assignment => {
                    const li = document.createElement('li');
                    li.className = 'assignment-item';
                    
                    // Build attachments HTML if attachments exist
                    let attachmentsHtml = '';
                    if (assignment.attachments && assignment.attachments.length > 0) {
                        attachmentsHtml = `
                            <div class="assignment-attachments">
                                <strong>Attachments:</strong>
                                ${assignment.attachments.map(att => `
                                    <div class="attachment-item">
                                        <i class="fas fa-paperclip"></i>
                                        <a href="#" onclick="downloadAssignmentFile('${assignment._id}', '${att.fileName}')">${att.fileName}</a>
                                        <small>(${(att.fileSize / 1024).toFixed(1)} KB)</small>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }
                    
                    li.innerHTML = `
                        <div class="assignment-details">
                            <div class="assignment-title">${assignment.title}</div>
                            <div class="assignment-meta">
                                <i class="fas fa-book"></i> ${assignment.class ? assignment.class.name : 'Unknown Class'}
                                <i class="fas fa-clock ml-3"></i> Due: ${new Date(assignment.dueDate).toLocaleDateString()}
                            </div>
                            <div class="assignment-description">
                                ${assignment.description || 'No description provided'}
                            </div>
                            ${attachmentsHtml}
                        </div>
                        <div class="assignment-action">
                            <a href="#" class="btn btn-primary btn-sm grade-assignment" data-assignment-id="${assignment._id}">Grade</a>
                            <a href="#" class="btn btn-outline btn-sm view-assignment" data-assignment-id="${assignment._id}">View</a>
                        </div>
                    `;
                    pendingList.appendChild(li);
                });
            }
        }
        
        if (completedList) {
            completedList.innerHTML = '';
            
            // Filter completed assignments (due or graded)
            const completedAssignments = assignments.filter(assignment => {
                const dueDate = new Date(assignment.dueDate);
                const now = new Date();
                return dueDate <= now;
            });
            
            // Check if completed assignments array is empty
            if (!completedAssignments || completedAssignments.length === 0) {
                completedList.innerHTML = '<li class="no-data">No completed assignments</li>';
            } else {
                completedAssignments.forEach(assignment => {
                    const li = document.createElement('li');
                    li.className = 'assignment-item';
                    
                    // Build attachments HTML if attachments exist
                    let attachmentsHtml = '';
                    if (assignment.attachments && assignment.attachments.length > 0) {
                        attachmentsHtml = `
                            <div class="assignment-attachments">
                                <strong>Attachments:</strong>
                                ${assignment.attachments.map(att => `
                                    <div class="attachment-item">
                                        <i class="fas fa-paperclip"></i>
                                        <a href="#" onclick="downloadAssignmentFile('${assignment._id}', '${att.fileName}')">${att.fileName}</a>
                                        <small>(${(att.fileSize / 1024).toFixed(1)} KB)</small>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }
                    
                    li.innerHTML = `
                        <div class="assignment-details">
                            <div class="assignment-title">${assignment.title}</div>
                            <div class="assignment-meta">
                                <i class="fas fa-book"></i> ${assignment.class ? assignment.class.name : 'Unknown Class'}
                                <i class="fas fa-clock ml-3"></i> Due: ${new Date(assignment.dueDate).toLocaleDateString()}
                            </div>
                            <div class="assignment-description">
                                ${assignment.description || 'No description provided'}
                            </div>
                            ${attachmentsHtml}
                        </div>
                        <div class="assignment-action">
                            ${assignment.isGraded ? 
                                `<a href="#" class="btn btn-success btn-sm">Graded</a>` : 
                                `<a href="#" class="btn btn-primary btn-sm edit-assignment" data-assignment-id="${assignment._id}">Edit</a>`
                            }
                            <a href="#" class="btn btn-outline btn-sm view-assignment" data-assignment-id="${assignment._id}">View</a>
                        </div>
                    `;
                    completedList.appendChild(li);
                });
            }
        }
    }
}

// Update students list in UI
function updateStudentsList(students) {
    console.log('Updating students list with data:', students);
    
    // Update students section
    const studentsSection = document.getElementById('students');
    console.log('Students section element:', studentsSection);
    
    if (studentsSection) {
        const studentGrid = studentsSection.querySelector('#studentGrid');
        console.log('Student grid element:', studentGrid);
        
        if (studentGrid) {
            studentGrid.innerHTML = '';
            
            // Check if students array is empty
            if (!students || students.length === 0) {
                studentGrid.innerHTML = '<div class="no-data">No students found in your department</div>';
                return;
            }
            
            console.log('Number of students to display:', students.length);
            students.forEach((student, index) => {
                console.log(`Processing student ${index + 1}:`, student);
                const div = document.createElement('div');
                div.className = 'student-card';
                div.innerHTML = `
                    <div class="student-avatar">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <div class="student-info">
                        <div class="student-name">${student.name}</div>
                        <div class="student-id">${student.studentId || student._id || 'N/A'}</div>
                    </div>
                    <div class="student-actions">
                        <button class="btn btn-sm btn-outline view-student-btn" data-student-id="${student._id}">View</button>
                        <button class="btn btn-sm btn-outline message-student-btn" data-student-id="${student._id}">Message</button>
                    </div>
                `;
                studentGrid.appendChild(div);
            });
        }
    }
}

// Update resources list in UI
function updateResourcesList(resources) {
    console.log('Updating resources list with data:', resources);
    
    // Update resources section
    const resourcesSection = document.getElementById('resources');
    if (resourcesSection) {
        const resourceList = resourcesSection.querySelector('.resource-list');
        if (resourceList) {
            resourceList.innerHTML = '';
            
            // Check if resources array is empty
            if (!resources || resources.length === 0) {
                resourceList.innerHTML = '<li class="no-data">No resources found</li>';
                return;
            }
            
            resources.forEach(resource => {
                const li = document.createElement('li');
                li.className = 'resource-item';
                li.innerHTML = `
                    <div class="resource-icon">
                        <i class="fas fa-file-${getResourceIcon(resource.type)}"></i>
                    </div>
                    <div class="resource-details">
                        <div class="resource-title">${resource.title}</div>
                        <div class="resource-meta">
                            <i class="fas fa-book"></i> ${resource.class ? resource.class.name : 'General'}
                            <i class="fas fa-clock ml-3"></i> ${new Date(resource.uploadedAt).toLocaleDateString()}
                        </div>
                        <div class="resource-description">
                            ${resource.description || 'No description provided'}
                        </div>
                    </div>
                    <div class="resource-action">
                        <a href="${resource.fileUrl}" class="btn btn-primary btn-sm" target="_blank">Download</a>
                    </div>
                `;
                resourceList.appendChild(li);
            });
        }
    }
}

// Helper function to get resource icon based on type
function getResourceIcon(type) {
    const icons = {
        'pdf': 'pdf',
        'doc': 'word',
        'docx': 'word',
        'xls': 'excel',
        'xlsx': 'excel',
        'ppt': 'powerpoint',
        'pptx': 'powerpoint',
        'zip': 'archive',
        'default': 'alt'
    };
    return icons[type] || icons.default;
}

// Update attendance list in UI
function updateAttendanceList(attendance) {
    console.log('Updating attendance list with data:', attendance);
    
    // Update attendance section
    const attendanceSection = document.getElementById('attendance');
    if (attendanceSection) {
        const attendanceTableBody = attendanceSection.querySelector('#attendanceTableBody');
        if (attendanceTableBody) {
            attendanceTableBody.innerHTML = '';
            
            // Check if attendance array is empty
            if (!attendance || attendance.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="4" class="text-center">No attendance records found</td>';
                attendanceTableBody.appendChild(row);
                // Update summary with zeros
                updateAttendanceSummary(0, 0, 0, 0);
                return;
            }
            
            // Display attendance records
            attendance.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.student.studentId || record.student._id || 'N/A'}</td>
                    <td>${record.student.name || 'Unknown Student'}</td>
                    <td>${record.attendance || 'N/A'}</td>
                    <td><span class="badge badge-${record.todaysAttendance === 'Present' ? 'success' : record.todaysAttendance === 'Absent' ? 'danger' : 'secondary'}">${record.todaysAttendance || 'Not Marked'}</span></td>
                `;
                attendanceTableBody.appendChild(row);
            });
            
            // Calculate and update summary statistics
            updateAttendanceSummaryFromData(attendance);
        }
    }
}

// Update attendance summary from data
function updateAttendanceSummaryFromData(attendanceData) {
    const totalStudents = attendanceData.length;
    
    // Count present and absent students based on today's attendance
    let presentCount = 0;
    let absentCount = 0;
    
    attendanceData.forEach(record => {
        if (record.todaysAttendance === 'Present') {
            presentCount++;
        } else if (record.todaysAttendance === 'Absent') {
            absentCount++;
        }
    });
    
    // Calculate attendance rate
    const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    
    // Update the summary cards
    updateAttendanceSummary(totalStudents, presentCount, absentCount, attendanceRate);
}

// Update attendance summary cards
function updateAttendanceSummary(totalStudents, presentCount, absentCount, attendanceRate) {
    const attendanceSection = document.getElementById('attendance');
    if (!attendanceSection) return;
    
    const summaryCards = attendanceSection.querySelectorAll('.summary-card');
    if (summaryCards.length >= 4) {
        summaryCards[0].querySelector('.summary-value').textContent = totalStudents;
        summaryCards[1].querySelector('.summary-value').textContent = presentCount;
        summaryCards[2].querySelector('.summary-value').textContent = absentCount;
        summaryCards[3].querySelector('.summary-value').textContent = `${attendanceRate}%`;
    }
}

// Update grades list in UI
function updateGradesList(students) {
    console.log('Updating grades list with student data:', students);
    
    // Update grades section
    const gradesSection = document.getElementById('grades');
    if (gradesSection) {
        const gradesTableBody = gradesSection.querySelector('#gradesTableBody');
        if (gradesTableBody) {
            gradesTableBody.innerHTML = '';
            
            // Check if students array is empty
            if (!students || students.length === 0) {
                console.log('No students data available');
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="5" class="text-center">No students found in your department</td>
                `;
                gradesTableBody.appendChild(row);
                return;
            }
            
            // Filter students to ensure they belong to the teacher's department
            const teacherDepartment = getCurrentTeacherDepartment();
            console.log('Teacher department for filtering:', teacherDepartment);
            
            const filteredStudents = students.filter(student => {
                // If we can't determine the teacher's department or student's department, show all students
                if (!teacherDepartment || !student.department) {
                    console.log('Showing student without department filtering:', student);
                    return true;
                }
                // Only show students in the same department as the teacher
                const isSameDepartment = student.department === teacherDepartment;
                console.log(`Student ${student.name} in department ${student.department} - Same as teacher (${teacherDepartment}): ${isSameDepartment}`);
                return isSameDepartment;
            });
            
            console.log('Filtered students:', filteredStudents);
            
            // Check if filtered students array is empty
            if (filteredStudents.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="5" class="text-center">No students found in your department</td>
                `;
                gradesTableBody.appendChild(row);
                return;
            }
            
            filteredStudents.forEach(student => {
                const row = document.createElement('tr');
                
                // Extract student information
                const studentId = student.studentId || student._id || 'N/A';
                const studentName = student.name || 'Unknown Student';
                const studentEmail = student.email || 'N/A';
                const studentCGPA = student.cgpa || student.grade || 'N/A';
                const studentIdForEdit = student._id || student.studentId || 'N/A';
                
                row.innerHTML = `
                    <td>${studentId}</td>
                    <td>${studentName}</td>
                    <td>${studentEmail}</td>
                    <td>${studentCGPA}</td>
                    <td>
                        <a href="#" class="btn btn-sm btn-outline edit-grade" data-student-id="${studentIdForEdit}">Edit</a>
                    </td>
                `;
                
                gradesTableBody.appendChild(row);
            });
            
            // Reattach event listeners for edit grade buttons
            attachEditGradeListeners();
        }
    }
}

// Attach event listeners for edit grade buttons
function attachEditGradeListeners() {
    document.querySelectorAll('.edit-grade').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const studentId = this.getAttribute('data-student-id');
            console.log('Edit student grade clicked:', studentId);
            
            // Get student data from the row
            const row = this.closest('tr');
            const studentName = row.cells[1].textContent;
            const studentIdText = row.cells[0].textContent;
            const studentEmail = row.cells[2].textContent;
            const currentCGPA = row.cells[3].textContent;
            
            // Populate the edit grade modal with student data
            document.getElementById('editGradeStudentName').textContent = studentName;
            document.getElementById('editGradeStudentId').textContent = studentIdText;
            document.getElementById('editGradeStudentId').setAttribute('data-student-id', studentId);
            document.getElementById('editGradeStudentEmail').textContent = studentEmail;
            document.getElementById('editGradeCurrentCGPA').textContent = currentCGPA;
            document.getElementById('newCGPA').value = currentCGPA === 'N/A' ? '' : currentCGPA;
            document.getElementById('gradeNotes').value = '';
            
            // Show the edit grade modal
            const editGradeModal = document.getElementById('editGradeModal');
            if (editGradeModal) {
                editGradeModal.style.display = 'block';
            }
        });
    });
}

// Get current teacher's department from localStorage
function getCurrentTeacherDepartment() {
    // Log for debugging
    console.log('Getting teacher department...');
    
    // Try to get from teacherProfile first (set during initialization)
    const teacherProfile = localStorage.getItem('teacherProfile');
    if (teacherProfile) {
        try {
            const teacher = JSON.parse(teacherProfile);
            console.log('Teacher profile from localStorage:', teacher);
            if (teacher.role === 'teacher' && teacher.department) {
                console.log('Found department in teacherProfile:', teacher.department);
                return teacher.department;
            }
        } catch (e) {
            console.error('Error parsing teacherProfile from localStorage:', e);
        }
    }
    
    // Fallback to currentUser
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            console.log('Current user from localStorage:', user);
            if (user.role === 'teacher' && user.department) {
                console.log('Found department in currentUser:', user.department);
                return user.department;
            }
        } catch (e) {
            console.error('Error parsing currentUser from localStorage:', e);
        }
    }
    
    console.log('No department found for teacher');
    return null;
}

// Update grade summary cards
function updateGradeSummary(grades) {
    const gradesSection = document.getElementById('grades');
    if (!gradesSection) return;
    
    // Get summary cards
    const summaryCards = gradesSection.querySelectorAll('.summary-card');
    if (summaryCards.length < 4) return;
    
    // If no grades, set default values
    if (!grades || grades.length === 0) {
        summaryCards[0].querySelector('.summary-value').textContent = 'N/A';
        summaryCards[1].querySelector('.summary-value').textContent = 'N/A';
        summaryCards[2].querySelector('.summary-value').textContent = 'N/A';
        summaryCards[3].querySelector('.summary-value').textContent = '0%';
        return;
    }
    
    // Calculate statistics
    const percentages = grades.map(grade => grade.percentage || 0);
    const classAverage = percentages.reduce((sum, val) => sum + val, 0) / percentages.length;
    const highestGrade = Math.max(...percentages);
    const lowestGrade = Math.min(...percentages);
    
    // Convert percentages to letter grades
    const getLetterGrade = (percentage) => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };
    
    // Update summary cards
    summaryCards[0].querySelector('.summary-value').textContent = getLetterGrade(classAverage);
    summaryCards[1].querySelector('.summary-value').textContent = getLetterGrade(highestGrade);
    summaryCards[2].querySelector('.summary-value').textContent = getLetterGrade(lowestGrade);
    // For demonstration purposes, we'll show 100% as we're showing all grades
    // In a real implementation, this would be calculated based on total students vs graded students
    summaryCards[3].querySelector('.summary-value').textContent = '100%';
}

// Update student CGPA
function updateStudentCGPA(studentId, cgpa, notes = '') {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert('Authentication required');
        return;
    }
    
    // Send update request to backend
    fetch('http://localhost:5002/api/teacher/department-grades', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            studentId: studentId,
            cgpa: cgpa,
            notes: notes
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`CGPA updated successfully to ${cgpa}`, 'success');
            // Refresh the grades list to show updated CGPA
            fetchGradesData();
        } else {
            showNotification(`Failed to update CGPA: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        console.error('Error updating CGPA:', error);
        showNotification('Failed to update CGPA due to network error', 'error');
    });
}

// Export grades to CSV
function exportGradesToCSV() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert('Authentication required');
        return;
    }
    
    // Redirect to export endpoint which will trigger download
    window.location.href = `http://localhost:5002/api/teacher/department-grades/export?token=${authToken}`;
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}