// Teacher Dashboard JavaScript

// Check authentication and role
function checkTeacherAuthentication() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    if (!authToken || !currentUser) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const user = JSON.parse(currentUser);
        if (user.role !== 'teacher') {
            const dashboards = {
                'student': 'student-dashboard.html',
                'hod': 'HOD-dashboard.html',
                'admin': 'admin-dashboard.html',
                'managing_authority': 'managing-authority.html'
            };
            window.location.href = dashboards[user.role] || 'login.html';
            return false;
        }
        return true;
    } catch (e) {
        window.location.href = 'login.html';
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Teacher dashboard loaded');

    // Check authentication first
    if (!checkTeacherAuthentication()) return;

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('teacherProfile');
                localStorage.removeItem('classesData');
                window.location.href = 'login.html';
            }
        });
    }

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
    fetch('/api/auth/me', {
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

    // Update header welcome text
    const headerSubtitle = document.querySelector('.page-title p');
    if (headerSubtitle) {
        headerSubtitle.textContent = `Welcome back, ${teacher.name}! Here's what's happening today.`;
    }
    
    // Update teacher info in sidebar
    const teacherNameElement = document.querySelector('#userName') || document.querySelector('.user-info h3');
    const teacherDeptElement = document.querySelector('#userDepartment');
    const teacherProgElement = document.querySelector('#userProgram');
    
    if (teacherNameElement) {
        teacherNameElement.textContent = teacher.name;
    }
    
    if (teacherDeptElement) {
        teacherDeptElement.textContent = teacher.department || teacher.email;
    }

    // Show program name above department
    if (teacherProgElement) {
        const dept = (teacher.department || '').toUpperCase();
        let prog = 'B.Tech';
        if (dept.includes('BCA')) prog = 'BCA';
        else if (dept.includes('MCA')) prog = 'MCA';
        teacherProgElement.textContent = prog;
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
    // Load subjects assigned by HOD
    loadAssignedSubjects();
    // Load assigned classes into dashboard card
    loadDashboardClasses();
    
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
    fetch(`/api/attendance/date-wise?startDate=${startDate}&endDate=${endDate}`, {
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
    fetch('/api/attendance/date-wise', {
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
    fetch('/api/attendance/launch-face-recognition', {
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
    fetch('/api/attendance/face-recognition', {
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
    fetch('/api/prediction/at-risk', {
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
        fetch(`/api/users/${student._id || student.studentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            }
        }).then(response => response.json())
    ))
    .then(studentData => {
        // Get attendance data for all students
        return fetch('/api/attendance/department', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            }
        })
        .then(attendanceResponse => attendanceResponse.json())
        .then(attendanceData => {
            // Get grade data for all students
            return fetch('/api/teacher/department-grades', {
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
        fetch(`/api/prediction/students/${student.studentId}`, {
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
    fetch('/api/teacher/students', {
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
    const modal = document.getElementById('studentDetailsModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Handle clicks on View button (delegated from studentGrid)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-student-btn') || e.target.closest('.view-student-btn')) {
            const btn = e.target.classList.contains('view-student-btn') ? e.target : e.target.closest('.view-student-btn');
            const studentId = btn.getAttribute('data-student-id');
            if (studentId) {
                openStudentDetailsModal(studentId);
            }
        }

        // Handle clicks on Message button (delegated from studentGrid)
        if (e.target.classList.contains('message-student-btn') || e.target.closest('.message-student-btn')) {
            const btn = e.target.classList.contains('message-student-btn') ? e.target : e.target.closest('.message-student-btn');
            const studentId = btn.getAttribute('data-student-id');
            if (studentId) {
                openMessageModalForStudent(studentId);
            }
        }
    });

    // Handle Message button in modal
    const messageBtn = modal.querySelector('.message-student-btn');
    if (messageBtn) {
        messageBtn.addEventListener('click', function() {
            const studentId = this.getAttribute('data-student-id');
            if (studentId) {
                modal.style.display = 'none';
                openMessageModalForStudent(studentId);
            }
        });
    }
}

// Open student details modal
// Open student details modal — HOD-style card with real CGPA chart
let _teacherStudentChartInstance = null;

async function openStudentDetailsModal(studentId) {
    const modal = document.getElementById('studentDetailsModal');
    if (!modal) return;
    const authToken = localStorage.getItem('authToken');
    if (!authToken) { showNotification('Authentication required', 'error'); return; }

    // Show modal with loading
    document.getElementById('studentDetailName').textContent = 'Loading...';
    document.getElementById('studentDetailId').textContent = '';
    document.getElementById('studentDetailEmail').textContent = '';
    document.getElementById('studentDetailGpa').textContent = '—';
    document.getElementById('studentDetailStatus').textContent = '—';
    document.getElementById('studentDetailCourses').textContent = 'Loading...';
    document.getElementById('teacherStudentChartNote').textContent = '';
    modal.style.display = 'block';
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };

    try {
        const students = window._teacherStudentsData || [];
        const student = students.find(s => String(s._id) === String(studentId));
        if (!student) { showNotification('Student not found', 'error'); modal.style.display = 'none'; return; }

        const gpa    = student.grade != null ? parseFloat(student.grade).toFixed(2) : 'N/A';
        const gpaN   = parseFloat(gpa) || 0;
        const status = gpaN >= 8 ? 'Excellent' : gpaN >= 7 ? 'Good' : gpaN >= 6 ? 'Average' : gpa === 'N/A' ? 'No Grade' : 'At Risk';

        document.getElementById('studentDetailName').textContent   = student.name;
        document.getElementById('studentDetailId').textContent     = student.studentId || studentId;
        document.getElementById('studentDetailEmail').textContent  = student.email || 'N/A';
        document.getElementById('studentDetailGpa').textContent    = gpa;
        document.getElementById('studentDetailStatus').textContent = status;

        const msgBtn = document.getElementById('studentDetailMsgBtn');
        if (msgBtn) msgBtn.onclick = () => { modal.style.display = 'none'; openMessageModalForStudent(studentId); };

        // Enrolled courses
        try {
            const classRes = await fetch('/api/classes', { headers: { 'Authorization': `Bearer ${authToken}` } });
            const classData = await classRes.json();
            const classes = classData.success ? classData.data.classes : [];
            const enrolled = classes.filter(c => (c.students || []).some(s => String(s._id || s) === String(studentId)));
            const coursesEl = document.getElementById('studentDetailCourses');
            if (enrolled.length > 0) {
                coursesEl.innerHTML = enrolled.map(c =>
                    `<span style="display:inline-block;background:#f5f3ff;color:#7c3aed;padding:0.2rem 0.6rem;border-radius:6px;font-size:0.82rem;margin:0.2rem;border:1px solid #e9d5ff;">${c.name}</span>`
                ).join('');
            } else { coursesEl.textContent = 'No courses enrolled'; }
        } catch (e) { document.getElementById('studentDetailCourses').textContent = 'Could not load courses'; }

        // Real CGPA data — year-wise (avg of 2 sems per year) + linear regression prediction
        let labels = [], values = [], predictedLabel = null, predictedValue = null;
        try {
            const userRes = await fetch('/api/teacher/students', { headers: { 'Authorization': `Bearer ${authToken}` } });
            const userData = await userRes.json();
            const allStudents = userData.success ? (userData.data?.users || []) : [];
            const full = allStudents.find(s => String(s._id) === String(studentId));

            // semesterCgpas: [sem1, sem2, sem3, ..., sem8]
            const semCgpas = (full?.semesterCgpas || []).map(v => parseFloat(v) || 0);

            // Group into years: Year N = avg(sem(2N-1), sem(2N))
            for (let y = 0; y < 4; y++) {
                const s1 = semCgpas[y * 2] || 0;
                const s2 = semCgpas[y * 2 + 1] || 0;
                const count = (s1 > 0 ? 1 : 0) + (s2 > 0 ? 1 : 0);
                if (count > 0) {
                    labels.push(`Year ${y + 1}`);
                    values.push(parseFloat(((s1 + s2) / count).toFixed(2)));
                }
            }

            // Linear regression prediction for next year
            if (values.length >= 2) {
                const n = values.length;
                const xMean = (n - 1) / 2;
                const yMean = values.reduce((a, b) => a + b, 0) / n;
                let num = 0, den = 0;
                values.forEach((v, i) => { num += (i - xMean) * (v - yMean); den += (i - xMean) ** 2; });
                const slope = den !== 0 ? num / den : 0;
                const intercept = yMean - slope * xMean;
                const predicted = Math.min(10, Math.max(0, parseFloat((slope * n + intercept).toFixed(2))));
                const lastYear = parseInt((labels[labels.length - 1] || 'Year 0').replace('Year ', '')) || values.length;
                if (lastYear < 4) {
                    predictedLabel = `Year ${lastYear + 1} (pred.)`;
                    predictedValue = predicted;
                }
            }
        } catch(e) { console.error('CGPA fetch error', e); }

        if (values.length === 0 && gpaN > 0) { labels = ['Overall']; values = [gpaN]; }
        drawTeacherStudentCgpaChart(labels, values, predictedLabel, predictedValue);

        const noteEl = document.getElementById('teacherStudentChartNote');
        if (values.length === 0) {
            noteEl.textContent = 'No CGPA data available yet.';
        } else if (predictedLabel) {
            noteEl.textContent = `Predicted ${predictedLabel.replace(' (pred.)', '')} CGPA: ${predictedValue}`;
        } else if (values.length < 2) {
            noteEl.textContent = 'Enter semester CGPAs in student dashboard to see prediction.';
        } else {
            noteEl.textContent = '';
        }

    } catch (err) {
        console.error('openStudentDetailsModal error:', err);
        showNotification('Error loading student details', 'error');
        modal.style.display = 'none';
    }
}

function drawTeacherStudentCgpaChart(labels, values, predictedLabel, predictedValue) {
    const canvas = document.getElementById('teacherStudentCgpaChart');
    if (!canvas) return;
    if (_teacherStudentChartInstance) { _teacherStudentChartInstance.destroy(); _teacherStudentChartInstance = null; }
    if (!values.length || !values.some(v => v > 0)) {
        document.getElementById('teacherStudentChartNote').textContent = 'No CGPA data available yet.';
        return;
    }
    if (typeof Chart === 'undefined') return;

    // Build datasets — actual data + optional prediction point with connecting dashed line
    const allLabels = [...labels];
    const actualData = [...values];
    // predictData: nulls until second-to-last, then last actual value, then predicted
    // This makes the dashed line visibly connect from last actual to prediction
    const predictData = new Array(Math.max(0, values.length - 1)).fill(null);
    if (values.length > 0) predictData.push(values[values.length - 1]);

    if (predictedLabel && predictedValue) {
        allLabels.push(predictedLabel);
        actualData.push(null);
        predictData.push(predictedValue);
    }

    _teacherStudentChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                {
                    label: 'Actual CGPA',
                    data: actualData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102,126,234,0.12)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#667eea',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.35,
                    fill: true,
                    spanGaps: false,
                },
                {
                    label: 'Predicted',
                    data: predictData,
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168,85,247,0.15)',
                    borderWidth: 2,
                    borderDash: [5, 4],
                    pointBackgroundColor: '#a855f7',
                    pointStyle: 'triangle',
                    pointRadius: 7,
                    pointHoverRadius: 9,
                    tension: 0,
                    fill: false,
                    spanGaps: true,
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: !!predictedLabel,
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 11 }, color: '#64748b' }
                },
                tooltip: {
                    callbacks: {
                        label: c => c.parsed.y != null ? ` ${c.dataset.label}: ${c.parsed.y.toFixed(2)}` : ''
                    }
                }
            },
            scales: {
                y: {
                    min: 0, max: 10,
                    ticks: { stepSize: 2, font: { size: 11 }, color: '#94a3b8' },
                    grid: { color: '#f1f5f9' }
                },
                x: {
                    ticks: { font: { size: 11 }, color: '#64748b' },
                    grid: { display: false }
                }
            }
        }
    });
}
// Display student grades and CGPA chart
function displayStudentGrades(grades, cgpa) {
    const performanceTab = document.getElementById('performance');
    if (!performanceTab) return;

    let gradesHTML = '<div class="performance-chart"><h4>Academic Performance</h4>';

    if (grades.length > 0) {
        // Show grades table
        gradesHTML += `
            <div class="grades-table-container">
                <table class="grades-table">
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th>Grade</th>
                            <th>Points</th>
                            <th>Credits</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        grades.forEach(grade => {
            gradesHTML += `
                <tr>
                    <td>${grade.class?.name || 'N/A'}</td>
                    <td><span class="grade-badge">${grade.grade || 'N/A'}</span></td>
                    <td>${grade.gradePoints !== undefined ? grade.gradePoints.toFixed(2) : 'N/A'}</td>
                    <td>${grade.credits || 'N/A'}</td>
                </tr>
            `;
        });

        gradesHTML += `
                    </tbody>
                </table>
            </div>
        `;

        // Add CGPA visualization
        gradesHTML += `
            <div class="cgpa-visualization" style="margin-top: 20px;">
                <h5>CGPA: ${cgpa.toFixed(2)}/10.0</h5>
                <div class="cgpa-bar-container" style="width: 100%; height: 30px; background: #e0e0e0; border-radius: 15px; overflow: hidden;">
                    <div class="cgpa-bar" style="width: ${(cgpa/10)*100}%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.5s ease;"></div>
                </div>
                <div class="cgpa-chart" style="margin-top: 20px; height: 200px; display: flex; align-items: flex-end; gap: 10px; justify-content: center;">
        `;

        // Simple bar chart for grades
        const gradeDistribution = {};
        grades.forEach(g => {
            const grade = g.grade || 'N/A';
            gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
        });

        const maxCount = Math.max(...Object.values(gradeDistribution), 1);
        Object.entries(gradeDistribution).forEach(([grade, count]) => {
            const height = (count / maxCount) * 150;
            gradesHTML += `
                <div class="bar-item" style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
                    <div class="bar-count" style="font-size: 12px; font-weight: bold;">${count}</div>
                    <div class="bar" style="width: 40px; height: ${height}px; background: #2196F3; border-radius: 5px 5px 0 0;"></div>
                    <div class="bar-label" style="font-size: 12px;">${grade}</div>
                </div>
            `;
        });

        gradesHTML += `
                </div>
            </div>
        `;

    } else {
        gradesHTML += '<p class="no-data">No grades available for this student.</p>';
    }

    gradesHTML += '</div>';

    performanceTab.innerHTML = gradesHTML;
}

// Open message modal for a specific student
function openMessageModalForStudent(studentId) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Authentication required', 'error');
        return;
    }

    // Fetch student details to populate recipient
    fetch(`/api/teacher/students`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const allStudents = data.data?.users || data.data?.students || [];
            const student = allStudents.find(s => s._id === studentId || s._id?.toString() === studentId) || { name: 'Student', studentId: '' };
            
            // Navigate to messages section
            const messagesLink = document.querySelector('a[data-section="messages"]');
            if (messagesLink) {
                messagesLink.click();
            }

            // Open compose modal
            setTimeout(() => {
                const composeBtn = document.getElementById('composeMessageBtn');
                if (composeBtn) {
                    composeBtn.click();
                } else {
                    // Fallback: open the modal directly
                    const composeModal = document.getElementById('teacherComposeModal');
                    if (composeModal) {
                        composeModal.style.display = 'block';
                        if (typeof populateTeacherRecipients === 'function') populateTeacherRecipients();
                    }
                }

                // Pre-fill recipient in the teacher message dropdown
                setTimeout(() => {
                    const recipientSelect = document.getElementById('teacherMsgTo');
                    if (recipientSelect) {
                        // Create option if not exists
                        let option = recipientSelect.querySelector(`option[value="${studentId}"]`);
                        if (!option) {
                            option = document.createElement('option');
                            option.value = studentId;
                            option.textContent = `${student.name} (${student.studentId || 'Student'})`;
                            recipientSelect.appendChild(option);
                        }
                        option.selected = true;
                    }

                    // Pre-fill subject
                    const subjectInput = document.getElementById('teacherMsgSubject');
                    if (subjectInput && !subjectInput.value) {
                        subjectInput.value = `Message for ${student.name}`;
                    }
                }, 500);
            }, 400);
        } else {
            showNotification('Failed to load student details', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading student details:', error);
        showNotification('Error loading student details', 'error');
    });
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
    fetch('/api/assignments', {
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
    // Handled by the dynamic message system below
}

// Download assignment file
function downloadAssignmentFile(assignmentId, filename) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Authentication required', 'error');
        return;
    }
    
    // Create download link
    const downloadUrl = `/api/assignments/${assignmentId}/download/${filename}`;
    
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
    const downloadUrl = `/api/assignments/submissions/${submissionId}/download/${filename}`;
    
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
    fetch('/api/classes', {
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

/**
 * Load teacher's assigned subjects + created classes into the dashboard "My Assigned Subjects" card.
 * Shows subjects assigned by HOD (even if no class created yet) AND created classes with mode/start buttons.
 */
async function loadDashboardClasses() {
    const list = document.getElementById('dashboardClassList');
    if (!list) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    list.innerHTML = '<li class="class-item" style="color:#94a3b8; padding:1rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</li>';

    try {
        // Fetch both assigned subjects AND created classes in parallel
        const [subjectsRes, classesRes] = await Promise.all([
            fetch('/api/teacher/my-subjects', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/classes', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]);

        const subjects = (subjectsRes.success && subjectsRes.data?.subjects) ? subjectsRes.data.subjects : [];
        const classes  = (classesRes.success && classesRes.data?.classes)   ? classesRes.data.classes   : [];

        // Build a map of classId  class object for quick lookup
        const classById = {};
        classes.forEach(c => { classById[String(c._id)] = c; });

        // Also track which subjects already have a class (by classId from subject record)
        const subjectClassIds = new Set(subjects.map(s => s.classId ? String(s.classId._id || s.classId) : null).filter(Boolean));

        // Classes that are NOT linked to any subject (standalone)
        const standaloneClasses = classes.filter(c => !subjectClassIds.has(String(c._id)));

        if (subjects.length === 0 && standaloneClasses.length === 0) {
            list.innerHTML = '<li class="class-item" style="color:#94a3b8; padding:1rem; text-align:center;"><i class="fas fa-info-circle"></i> No subjects assigned yet. Ask your HOD to assign a subject.</li>';
            return;
        }

        list.innerHTML = '';

        // ---- Render subjects (with or without a class) 
        subjects.forEach(sub => {
            const cls = sub.classId ? classById[String(sub.classId._id || sub.classId)] : null;
            const studentCount = cls?.students?.length ?? 0;
            const location = cls?.schedule?.location || '';
            const mode = cls?.mode || 'physical';
            const meetingLink = cls?.meetingLink || '';

            const modeBadge = mode === 'virtual'
                ? `<span style="background:#ede9fe;color:#7c3aed;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">Virtual</span>`
                : `<span style="background:#d1fae5;color:#065f46;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">Physical</span>`;

            const locationDisplay = mode === 'virtual' && meetingLink
                ? `<span><i class="fas fa-link"></i> <a href="${meetingLink}" target="_blank" style="color:#667eea;">Join Meeting</a></span>`
                : location ? `<span><i class="fas fa-map-marker-alt"></i> ${location}</span>` : '';

            const statusBadge = cls
                ? `<span style="background:#d1fae5;color:#065f46;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">Active</span>`
                : `<span style="background:#fef3c7;color:#92400e;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">Assigned</span>`;

            const actionBtns = cls
                ? `<div style="display:flex;gap:0.5rem;flex-shrink:0;">
                       <button class="btn btn-outline btn-sm" onclick="openClassModeModal('${cls._id}','${cls.name.replace(/'/g,"\\'")}','${mode}','${(location||'').replace(/'/g,"\\'")}','${(meetingLink||'').replace(/'/g,"\\'")}')">
                           <i class="fas fa-cog"></i> Update Mode
                       </button>
                       <a href="#" class="btn btn-primary btn-sm start-class" data-class-id="${cls._id}">
                           <i class="fas fa-play"></i> Start Class
                       </a>
                   </div>`
                : `<div style="flex-shrink:0;">
                       <span style="color:#94a3b8;font-size:0.85rem;font-style:italic;">Go to My Classes - Create Class</span>
                   </div>`;

            const li = document.createElement('li');
            li.className = 'class-item';
            li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;flex-wrap:nowrap;gap:1rem;width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1rem 1.2rem;margin-bottom:0.75rem;box-shadow:0 1px 4px rgba(0,0,0,0.05);list-style:none;';
            li.innerHTML = `
                <div class="class-details" style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;flex-wrap:wrap;">
                        <div class="class-name" style="font-weight:600;font-size:1rem;color:#1e293b;">${sub.name}</div>
                        ${statusBadge}
                        ${cls ? modeBadge : ''}
                    </div>
                    <div style="color:#64748b;font-size:0.85rem;display:flex;gap:0.8rem;flex-wrap:wrap;">
                        <span><i class="fas fa-code"></i> ${sub.code || (cls?.code || 'N/A')}</span>
                        ${locationDisplay}
                        ${cls ? `<span><i class="fas fa-users"></i> ${studentCount} student${studentCount!==1?'s':''}</span>` : ''}
                        <span><i class="fas fa-star"></i> ${sub.credits || cls?.credits || 10} credits</span>
                    </div>
                </div>
                ${actionBtns}
            `;
            list.appendChild(li);
        });

        // ---- Render standalone classes (no subject record) 
        standaloneClasses.forEach(cls => {
            const studentCount = cls.students?.length ?? 0;
            const location = cls.schedule?.location || '';
            const mode = cls.mode || 'physical';
            const meetingLink = cls.meetingLink || '';

            const modeBadge = mode === 'virtual'
                ? `<span style="background:#ede9fe;color:#7c3aed;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">Virtual</span>`
                : `<span style="background:#d1fae5;color:#065f46;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">Physical</span>`;

            const locationDisplay = mode === 'virtual' && meetingLink
                ? `<span><i class="fas fa-link"></i> <a href="${meetingLink}" target="_blank" style="color:#667eea;">Join Meeting</a></span>`
                : location ? `<span><i class="fas fa-map-marker-alt"></i> ${location}</span>` : '';

            const li = document.createElement('li');
            li.className = 'class-item';
            li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;flex-wrap:nowrap;gap:1rem;width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1rem 1.2rem;margin-bottom:0.75rem;box-shadow:0 1px 4px rgba(0,0,0,0.05);list-style:none;';
            li.innerHTML = `
                <div class="class-details" style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;flex-wrap:wrap;">
                        <div class="class-name" style="font-weight:600;font-size:1rem;color:#1e293b;">${cls.name}</div>
                        <span style="background:#d1fae5;color:#065f46;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">Active</span>
                        ${modeBadge}
                    </div>
                    <div style="color:#64748b;font-size:0.85rem;display:flex;gap:0.8rem;flex-wrap:wrap;">
                        <span><i class="fas fa-code"></i> ${cls.code || 'N/A'}</span>
                        ${locationDisplay}
                        <span><i class="fas fa-users"></i> ${studentCount} student${studentCount!==1?'s':''}</span>
                        <span><i class="fas fa-star"></i> ${cls.credits || 10} credits</span>
                    </div>
                </div>
                <div style="display:flex;gap:0.5rem;flex-shrink:0;">
                    <button class="btn btn-outline btn-sm" onclick="openClassModeModal('${cls._id}','${cls.name.replace(/'/g,"\\'")}','${mode}','${(location||'').replace(/'/g,"\\'")}','${(meetingLink||'').replace(/'/g,"\\'")}')">
                        <i class="fas fa-cog"></i> Update Mode
                    </button>
                    <a href="#" class="btn btn-primary btn-sm start-class" data-class-id="${cls._id}">
                        <i class="fas fa-play"></i> Start Class
                    </a>
                </div>
            `;
            list.appendChild(li);
        });

    } catch (err) {
        console.error('loadDashboardClasses error:', err);
        list.innerHTML = '<li class="class-item" style="color:#f44336; padding:1rem;">Failed to load subjects.</li>';
    }
}

// ---- Class Mode Modal 
let _classModeCurrentId = null;
let _classModeSelected = 'physical';

function openClassModeModal(classId, className, currentMode, currentLocation, currentLink) {
    _classModeCurrentId = classId;
    _classModeSelected = currentMode || 'physical';

    document.getElementById('classModeClassName').textContent = className;
    document.getElementById('classModeRoom').value = currentLocation || '';

    // Pre-fill today date/time for virtual scheduling
    const now = new Date();
    const dateEl = document.getElementById('virtualClassDate');
    const timeEl = document.getElementById('virtualClassTime');
    if (dateEl) dateEl.value = now.toISOString().slice(0, 10);
    if (timeEl) timeEl.value = now.toTimeString().slice(0, 5);

    selectClassMode(_classModeSelected);
    document.getElementById('classModeModal').style.display = 'flex';
}

function closeClassModeModal() {
    document.getElementById('classModeModal').style.display = 'none';
    _classModeCurrentId = null;
}

function selectClassMode(mode) {
    _classModeSelected = mode;
    const physBtn = document.getElementById('modePhysicalBtn');
    const virtBtn = document.getElementById('modeVirtualBtn');
    const physFields = document.getElementById('physicalFields');
    const virtFields = document.getElementById('virtualFields');

    if (mode === 'physical') {
        physBtn.style.background = '#667eea'; physBtn.style.color = '#fff'; physBtn.style.borderColor = '#667eea';
        virtBtn.style.background = '#fff'; virtBtn.style.color = '#64748b'; virtBtn.style.borderColor = '#e2e8f0';
        physFields.style.display = 'block';
        virtFields.style.display = 'none';
    } else {
        virtBtn.style.background = '#667eea'; virtBtn.style.color = '#fff'; virtBtn.style.borderColor = '#667eea';
        physBtn.style.background = '#fff'; physBtn.style.color = '#64748b'; physBtn.style.borderColor = '#e2e8f0';
        physFields.style.display = 'none';
        virtFields.style.display = 'block';
    }
}

async function saveClassMode() {
    if (!_classModeCurrentId) return;

    const mode = _classModeSelected;
    const token = localStorage.getItem('authToken');
    if (!token) { showNotification('Authentication required', 'error'); return; }

    const btn = document.getElementById('saveClassModeBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        if (mode === 'virtual') {
            const scheduledDate = document.getElementById('virtualClassDate')?.value;
            const scheduledTime = document.getElementById('virtualClassTime')?.value;

            if (!scheduledDate || !scheduledTime) {
                showNotification('Please enter the class date and time', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> Save & Notify Students';
                return;
            }

            // Save schedule only  no meeting link created yet (link is created on Start Class)
            const res = await fetch(`/api/classes/${_classModeCurrentId}/mode`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'virtual', scheduledDate, scheduledTime })
            });
            const data = await res.json();
            if (data.success || res.ok) {
                showNotification(`Virtual class scheduled for ${scheduledDate} at ${scheduledTime}. Students notified.`, 'success');
                closeClassModeModal();
                loadDashboardClasses();
            } else {
                showNotification(data.message || 'Failed to update class mode', 'error');
            }
        } else {
            const room = document.getElementById('classModeRoom').value.trim();
            if (!room) {
                showNotification('Please enter a room/location', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> Save & Notify Students';
                return;
            }
            const res = await fetch(`/api/classes/${_classModeCurrentId}/mode`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'physical', location: room })
            });
            const data = await res.json();
            if (data.success || res.ok) {
                showNotification('Class set to Physical. Students have been notified.', 'success');
                closeClassModeModal();
                loadDashboardClasses();
            } else {
                showNotification(data.message || 'Failed to update class mode', 'error');
            }
        }
    } catch (err) {
        console.error('saveClassMode error:', err);
        showNotification('Failed to update class mode', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save & Notify Students';
    }
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
    fetch('/api/assignments', {
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
    const url = '/api/teacher/students';
    
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
    fetch('/api/resources', {
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
    const url = '/api/attendance/department';
    
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
    const url = '/api/teacher/students';
    
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

    // Update dashboard stat card for classes count
    const classesStatEl = document.querySelector('.stat-card:nth-child(1) .stat-card-value');
    if (classesStatEl && classes) {
        classesStatEl.textContent = classes.length;
    }
    
    // Update classes section  target the dynamic list
    const classList = document.getElementById('teacherClassList') ||
                      document.querySelector('#classes .class-list');
    if (classList) {
        classList.innerHTML = '';
        
        if (!classes || classes.length === 0) {
            classList.innerHTML = '<li class="class-item" style="color:#94a3b8;padding:1rem;">No classes yet. Create a class from an assigned subject above.</li>';
            return;
        }
        
        classes.forEach(async (cls) => {
            const li = document.createElement('li');
            li.className = 'class-item';
            const scheduleText = cls.schedule?.scheduledDate && cls.schedule?.scheduledTime
                ? `${cls.schedule.scheduledDate} at ${cls.schedule.scheduledTime}`
                : cls.schedule && cls.schedule.days && cls.schedule.days.length
                ? `${cls.schedule.days.join(', ')} ${cls.schedule.startTime || ''}`
                : 'Not specified';
            const subjectId = cls.subject || '';
            
            // Fetch enrollment stats to get actual enrolled student count
            let enrolledCount = 0;
            try {
                const token = localStorage.getItem('authToken');
                const statsRes = await fetch(`/api/enrollments/class/${cls._id}/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    if (statsData.success && statsData.data) {
                        // Use the enrolled count from the class.students array
                        enrolledCount = statsData.data.enrolled || 0;
                        console.log(`Class ${cls.name}: enrolled count = ${enrolledCount}, accepted = ${statsData.data.accepted}`);
                    } else {
                        console.warn(`Stats API returned unsuccessful for class ${cls.name}`);
                        enrolledCount = cls.students ? cls.students.length : 0;
                    }
                } else {
                    console.warn(`Stats API failed with status ${statsRes.status} for class ${cls.name}`);
                    enrolledCount = cls.students ? cls.students.length : 0;
                }
            } catch (err) {
                console.error('Error fetching enrollment stats:', err);
                // Fallback to class.students length
                enrolledCount = cls.students ? cls.students.length : 0;
            }
            
            li.innerHTML = `
                <div class="class-details">
                    <div class="class-name">${cls.name}</div>
                    <div class="class-info">
                        <i class="fas fa-code"></i> ${cls.code || 'N/A'}
                        <i class="fas fa-users ml-3"></i> <span class="enrolled-count-${cls._id}">${enrolledCount}</span> students enrolled
                        <i class="fas fa-clock ml-3"></i> ${scheduleText}
                    </div>
                </div>
                <div class="class-action" style="display: flex; gap: 0.5rem;">
                    ${enrolledCount > 0 ? `
                        <span class="btn btn-sm btn-success" style="cursor: default; opacity: 0.8;">
                            <i class="fas fa-check-circle"></i> ${enrolledCount} Enrolled
                        </span>
                    ` : `
                        <button class="btn btn-sm btn-primary enroll-btn-${cls._id}" onclick="sendEnrollmentInvites('${cls._id}', '${subjectId}', this)" title="Automatically enroll all students in this course">
                            <i class="fas fa-user-plus"></i> Enroll Students
                        </button>
                    `}
                    <a href="#" class="btn btn-primary btn-sm manage-class" data-class-id="${cls._id}">Manage</a>
                </div>
            `;
            classList.appendChild(li);
        });
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

    // â”€â”€ Stats row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const total = students ? students.length : 0;
    const withGrade = students ? students.filter(s => s.grade != null && s.grade > 0) : [];
    const totalCgpa = withGrade.reduce((sum, s) => sum + (parseFloat(s.grade) || 0), 0);
    const avgCgpa = withGrade.length > 0 ? (totalCgpa / withGrade.length).toFixed(2) : 'N/A';
    const atRisk = students ? students.filter(s => s.grade != null && parseFloat(s.grade) < 7.5).length : 0;
    const safe   = students ? students.filter(s => s.grade != null && parseFloat(s.grade) > 8.0).length : 0;

    const el = id => document.getElementById(id);
    if (el('teacherPerfTotal'))   el('teacherPerfTotal').textContent   = total;
    if (el('teacherPerfAvgCgpa')) el('teacherPerfAvgCgpa').textContent = avgCgpa;
    if (el('teacherPerfCgpaLabel')) el('teacherPerfCgpaLabel').textContent = avgCgpa !== 'N/A' ? `Total ${totalCgpa.toFixed(2)} / ${withGrade.length} students` : 'No grade data yet';
    if (el('teacherPerfAtRisk'))  el('teacherPerfAtRisk').textContent  = atRisk;
    if (el('teacherPerfSafe'))    el('teacherPerfSafe').textContent    = safe;

    // Also update dashboard stat card
    const studentsStatEl = document.querySelector('.stat-card:nth-child(2) .stat-card-value');
    if (studentsStatEl) studentsStatEl.textContent = total;

    // â”€â”€ Table body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const tbody = document.getElementById('teacherStudentTableBody');
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8;">No students found in your department</td></tr>';
        return;
    }

    // Store for search filtering
    window._teacherStudentsData = students;

    tbody.innerHTML = students.map(student => {
        const gpa   = student.grade != null ? parseFloat(student.grade).toFixed(2) : 'N/A';
        const gpaN  = parseFloat(gpa) || 0;
        const status = gpaN >= 8 ? 'Excellent' : gpaN >= 7 ? 'Good' : gpaN >= 6 ? 'Average' : gpa === 'N/A' ? 'No Grade' : 'At Risk';
        const badgeCls = (status === 'Excellent' || status === 'Good') ? 'success' : status === 'Average' ? 'warning' : status === 'No Grade' ? '' : 'danger';
        return `<tr>
            <td>${student.studentId || student._id || 'N/A'}</td>
            <td><strong>${student.name}</strong></td>
            <td style="color:#64748b;font-size:0.88rem;">${student.email || 'N/A'}</td>
            <td><strong>${gpa}</strong></td>
            <td><span class="status-badge ${badgeCls}" style="${!badgeCls ? 'background:#f1f5f9;color:#64748b;' : ''}">${status}</span></td>
            <td style="display:flex;gap:0.5rem;">
                <button class="btn btn-sm btn-outline view-student-btn" data-student-id="${student._id}" onclick="openStudentDetailsModal('${student._id}'); return false;">View</button>
                <button class="btn btn-sm btn-outline message-student-btn" data-student-id="${student._id}" onclick="openMessageModalForStudent('${student._id}'); return false;">Message</button>
            </td>
        </tr>`;
    }).join('');
}

// Filter teacher student table by search query
function filterTeacherStudentTable(query) {
    const students = window._teacherStudentsData || [];
    const q = query.toLowerCase().trim();
    const filtered = q ? students.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.studentId || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
    ) : students;
    updateStudentsList(filtered);
}

// Export teacher student report as CSV
function exportTeacherStudentReport() {
    const students = window._teacherStudentsData || [];
    if (!students.length) { showNotification('No data to export', 'error'); return; }
    const rows = [['Student ID', 'Name', 'Email', 'GPA', 'Status']];
    students.forEach(s => {
        const gpa = s.grade != null ? parseFloat(s.grade).toFixed(2) : 'N/A';
        const gpaN = parseFloat(gpa) || 0;
        const status = gpaN >= 8 ? 'Excellent' : gpaN >= 7 ? 'Good' : gpaN >= 6 ? 'Average' : gpa === 'N/A' ? 'No Grade' : 'At Risk';
        rows.push([s.studentId || s._id, s.name, s.email || '', gpa, status]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'student_performance.csv';
    a.click();
    showNotification('Report exported!', 'success');
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
    fetch('/api/teacher/department-grades', {
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
    window.location.href = `/api/teacher/department-grades/export?token=${authToken}`;
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

// ==================== RESOURCE MANAGEMENT ====================

// Setup resource upload functionality
function setupResourceUpload() {
    // Handle resource type change to show/hide appropriate fields
    const resourceTypeSelect = document.getElementById('resourceType');
    if (resourceTypeSelect) {
        resourceTypeSelect.addEventListener('change', function() {
            handleResourceTypeChange(this.value);
        });
    }
    
    // Handle resource form submission
    const uploadResourceForm = document.getElementById('uploadResourceForm');
    if (uploadResourceForm) {
        uploadResourceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            uploadResource();
        });
    }
    
    // Handle upload resource button
    const uploadResourceBtn = document.getElementById('uploadResourceBtn');
    if (uploadResourceBtn) {
        uploadResourceBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openResourceModal();
        });
    }
    
    // Load classes into resource form
    loadClassesForResourceForm();
}

// Handle resource type change
function handleResourceTypeChange(resourceType) {
    const fileUploadGroup = document.getElementById('fileUploadGroup');
    const linkUrlGroup = document.getElementById('linkUrlGroup');
    const urlHint = document.getElementById('urlHint');
    const resourceFile = document.getElementById('resourceFile');
    const resourceUrl = document.getElementById('resourceUrl');
    
    // Reset required attributes
    if (resourceFile) resourceFile.removeAttribute('required');
    if (resourceUrl) resourceUrl.removeAttribute('required');
    
    // Show/hide appropriate fields based on type
    switch(resourceType) {
        case 'file':
            fileUploadGroup.style.display = 'block';
            linkUrlGroup.style.display = 'none';
            resourceFile.setAttribute('required', 'required');
            break;
            
        case 'youtube':
            fileUploadGroup.style.display = 'none';
            linkUrlGroup.style.display = 'block';
            resourceUrl.setAttribute('required', 'required');
            resourceUrl.placeholder = 'https://www.youtube.com/watch?v=...';
            urlHint.textContent = 'Enter YouTube video URL';
            break;
            
        case 'drive':
            fileUploadGroup.style.display = 'none';
            linkUrlGroup.style.display = 'block';
            resourceUrl.setAttribute('required', 'required');
            resourceUrl.placeholder = 'https://drive.google.com/file/d/...';
            urlHint.textContent = 'Enter Google Drive share link';
            break;
            
        case 'url':
            fileUploadGroup.style.display = 'none';
            linkUrlGroup.style.display = 'block';
            resourceUrl.setAttribute('required', 'required');
            resourceUrl.placeholder = 'https://example.com';
            urlHint.textContent = 'Enter website URL';
            break;
            
        default:
            fileUploadGroup.style.display = 'none';
            linkUrlGroup.style.display = 'none';
    }
}

// Open resource modal
function openResourceModal() {
    const modal = document.getElementById('uploadResourceModal');
    if (modal) {
        // Reset form
        const form = document.getElementById('uploadResourceForm');
        if (form) {
            form.reset();
            // Reset visibility
            document.getElementById('fileUploadGroup').style.display = 'none';
            document.getElementById('linkUrlGroup').style.display = 'none';
        }
        modal.style.display = 'block';
    }
}

// Load classes for resource form
function loadClassesForResourceForm() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    
    fetch('/api/classes', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data && data.data.classes) {
            const classSelect = document.getElementById('resourceClass');
            if (classSelect) {
                // Clear existing options except the first one
                classSelect.innerHTML = '<option value="">Select a class</option>';
                
                // Add classes
                data.data.classes.forEach(classItem => {
                    const option = document.createElement('option');
                    option.value = classItem._id;
                    option.textContent = `${classItem.name} (${classItem.students ? classItem.students.length : 0} students)`;
                    classSelect.appendChild(option);
                });
            }
        }
    })
    .catch(error => {
        console.error('Error loading classes for resource form:', error);
    });
}

// Upload resource
function uploadResource() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Authentication required', 'error');
        return;
    }
    
    // Get form values
    const title = document.getElementById('resourceTitle').value;
    const classId = document.getElementById('resourceClass').value;
    const resourceType = document.getElementById('resourceType').value;
    const description = document.getElementById('resourceDescription').value;
    const isPublic = document.getElementById('resourcePublic').checked;
    
    // Validate required fields
    if (!title || !classId || !resourceType) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('classId', classId);
    formData.append('resourceType', resourceType);
    formData.append('description', description);
    formData.append('isPublic', isPublic);
    
    // Handle file upload or URL
    if (resourceType === 'file') {
        const fileInput = document.getElementById('resourceFile');
        if (!fileInput.files || fileInput.files.length === 0) {
            showNotification('Please select a file to upload', 'error');
            return;
        }
        formData.append('file', fileInput.files[0]);
    } else {
        // URL-based resource
        const url = document.getElementById('resourceUrl').value;
        if (!url) {
            showNotification('Please enter a URL', 'error');
            return;
        }
        
        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            showNotification('Please enter a valid URL', 'error');
            return;
        }
        
        formData.append('url', url);
        formData.append('urlType', resourceType);
    }
    
    // Show loading state
    const submitButton = document.querySelector('#uploadResourceForm button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Uploading...';
    submitButton.disabled = true;
    
    // Send request to create resource
    fetch('/api/resources', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const studentsCount = data.studentsNotified || 0;
            showNotification(`Resource uploaded successfully! ${studentsCount} students can now access it.`, 'success');
            
            // Reset form
            document.getElementById('uploadResourceForm').reset();
            
            // Close modal
            const modal = document.getElementById('uploadResourceModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Refresh resources list
            fetchResourcesData();
        } else {
            showNotification(data.message || 'Failed to upload resource', 'error');
        }
    })
    .catch(error => {
        console.error('Error uploading resource:', error);
        showNotification('Failed to upload resource due to network error', 'error');
    })
    .finally(() => {
        // Restore button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

// Fetch resources data

// Update resources table
function updateResourcesTable(resources) {
    const resourcesTableBody = document.getElementById('resourcesTableBody');
    if (!resourcesTableBody) return;
    
    if (!resources || resources.length === 0) {
        resourcesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No resources available</td></tr>';
        return;
    }
    
    resourcesTableBody.innerHTML = '';
    
    resources.forEach(resource => {
        const row = document.createElement('tr');
        
        // Determine resource type icon
        let typeIcon = 'fa-file';
        let typeLabel = 'File';
        
        switch(resource.resourceType) {
            case 'youtube':
                typeIcon = 'fa-youtube';
                typeLabel = 'YouTube';
                break;
            case 'drive':
                typeIcon = 'fa-google-drive';
                typeLabel = 'Drive';
                break;
            case 'url':
                typeIcon = 'fa-link';
                typeLabel = 'Website';
                break;
            case 'video':
                typeIcon = 'fa-video';
                typeLabel = 'Video';
                break;
            case 'document':
                typeIcon = 'fa-file-alt';
                typeLabel = 'Document';
                break;
        }
        
        // Format date
        const uploadDate = new Date(resource.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        row.innerHTML = `
            <td>${resource.title}</td>
            <td><i class="fas ${typeIcon}"></i> ${typeLabel}</td>
            <td>${resource.class ? resource.class.name : 'N/A'}</td>
            <td>${uploadDate}</td>
            <td>${resource.views || 0}</td>
            <td>
                <button class="btn btn-sm btn-outline view-resource" data-resource-id="${resource._id}">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline delete-resource" data-resource-id="${resource._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        resourcesTableBody.appendChild(row);
    });
    
    // Attach event listeners
    attachResourceEventListeners();
}

// Attach event listeners to resource buttons
function attachResourceEventListeners() {
    // View resource buttons
    document.querySelectorAll('.view-resource').forEach(button => {
        button.addEventListener('click', function() {
            const resourceId = this.getAttribute('data-resource-id');
            viewResource(resourceId);
        });
    });
    
    // Delete resource buttons
    document.querySelectorAll('.delete-resource').forEach(button => {
        button.addEventListener('click', function() {
            const resourceId = this.getAttribute('data-resource-id');
            if (confirm('Are you sure you want to delete this resource?')) {
                deleteResource(resourceId);
            }
        });
    });
}

// View resource
function viewResource(resourceId) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    
    fetch(`/api/resources/${resourceId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            const resource = data.data;
            
            // Open resource based on type
            if (resource.url) {
                window.open(resource.url, '_blank');
            } else if (resource.filePath) {
                window.open(`/api/resources/${resourceId}/download`, '_blank');
            }
        }
    })
    .catch(error => {
        console.error('Error viewing resource:', error);
        showNotification('Failed to open resource', 'error');
    });
}

// Delete resource
function deleteResource(resourceId) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    
    fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Resource deleted successfully', 'success');
            fetchResourcesData();
        } else {
            showNotification(data.message || 'Failed to delete resource', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting resource:', error);
        showNotification('Failed to delete resource', 'error');
    });
}

// Initialize resource upload on page load
document.addEventListener('DOMContentLoaded', function() {
    setupResourceUpload();
});


// ==================== ASSIGNED SUBJECTS (HOD  Teacher workflow) ====================

// Load assigned subjects when classes section is shown
document.addEventListener('DOMContentLoaded', function () {
    // Load assigned subjects when navigating to classes section
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        if (link.getAttribute('data-section') === 'classes') {
            link.addEventListener('click', function () {
                loadAssignedSubjects();
            });
        }
    });

    // Also load on initial page load if classes section is active
    if (document.querySelector('#classes.active')) {
        loadAssignedSubjects();
    }

    // Create class for subject form
    const form = document.getElementById('createSubjectClassForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            submitCreateSubjectClass();
        });
    }
});

// Load subjects assigned to this teacher by HOD
function loadAssignedSubjects() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    const container = document.getElementById('assignedSubjectsList');
    if (!container) return;

    container.innerHTML = '<p style="color:#94a3b8;">Loading...</p>';

    fetch('/api/teacher/my-subjects', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(r => r.json())
        .then(data => {
            if (data.success && data.data.subjects && data.data.subjects.length > 0) {
                renderAssignedSubjects(data.data.subjects);
            } else {
                container.innerHTML = '<p style="color:#94a3b8;padding:1rem;">No subjects assigned yet. Your HOD will assign subjects to you.</p>';
            }
        })
        .catch(() => {
            container.innerHTML = '<p style="color:#ef4444;">Failed to load assigned subjects.</p>';
        });
}

// Render assigned subjects as cards
function renderAssignedSubjects(subjects) {
    const container = document.getElementById('assignedSubjectsList');
    if (!container) return;

    container.innerHTML = '';
    subjects.forEach(subject => {
        const hasClass = !!subject.classId;
        const card = document.createElement('div');
        card.style.cssText = `
            background: white;
            border-radius: 14px;
            padding: 1.2rem;
            box-shadow: 0 2px 12px rgba(0,0,0,0.07);
            border: 2px solid ${hasClass ? '#d1fae5' : '#e0e7ff'};
            position: relative;
        `;

        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.6rem;">
                <div>
                    <span style="font-size:0.75rem;font-weight:700;color:#667eea;background:#e0e7ff;padding:2px 8px;border-radius:6px;">${subject.code}</span>
                    ${subject.semester ? `<span style="font-size:0.75rem;color:#64748b;margin-left:6px;">${subject.semester}</span>` : ''}
                </div>
                <span style="font-size:0.75rem;font-weight:600;color:${hasClass ? '#059669' : '#d97706'};background:${hasClass ? '#d1fae5' : '#fef3c7'};padding:2px 8px;border-radius:6px;">
                    ${hasClass ? ' Class Created' : 'Needs Class'}
                </span>
            </div>
            <h4 style="font-size:1rem;font-weight:700;color:#1e293b;margin-bottom:0.3rem;">${subject.name}</h4>
            <p style="font-size:0.85rem;color:#64748b;margin-bottom:0.8rem;">${subject.credits} Credits${subject.description ? '  ' + subject.description.substring(0, 60) + (subject.description.length > 60 ? '...' : '') : ''}</p>
            ${hasClass
                ? `<div style="font-size:0.82rem;color:#059669;"><i class="fas fa-check-circle"></i> Class: <strong>${subject.classId.name}</strong></div>`
                : `<button class="btn btn-primary btn-sm create-subject-class-btn" data-id="${subject._id}" data-name="${subject.name}" data-code="${subject.code}" data-desc="${subject.description || ''}" style="width:100%;margin-top:0.3rem;">
                    <i class="fas fa-plus"></i> Create Class
                   </button>`
            }
        `;
        container.appendChild(card);
    });

    // Attach listeners
    document.querySelectorAll('.create-subject-class-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            openCreateSubjectClassModal(this.dataset.id, this.dataset.name, this.dataset.code, this.dataset.desc);
        });
    });
}

// Open modal to create class for a subject
function openCreateSubjectClassModal(subjectId, subjectName, subjectCode, subjectDesc) {
    document.getElementById('subjectClassSubjectId').value = subjectId;
    document.getElementById('subjectClassDescription').value = subjectDesc || '';
    document.getElementById('subjectClassInfo').innerHTML = `
        <strong style="color:#667eea;">${subjectName}</strong>
        <span style="margin-left:8px;font-size:0.85rem;color:#64748b;">(${subjectCode})</span>
        <p style="margin-top:4px;font-size:0.85rem;color:#475569;">Creating a class for this subject will automatically enroll all students from your department.</p>
    `;
    document.getElementById('createSubjectClassModal').style.display = 'block';
}

// Submit create class for subject
function submitCreateSubjectClass() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    const subjectId = document.getElementById('subjectClassSubjectId').value;
    const description = document.getElementById('subjectClassDescription').value.trim();
    const scheduleText = document.getElementById('subjectClassSchedule').value.trim();
    const location = document.getElementById('subjectClassLocation').value.trim();

    const btn = document.querySelector('#createSubjectClassForm button[type="submit"]');
    btn.textContent = 'Creating...';
    btn.disabled = true;

    const payload = {
        description,
        schedule: scheduleText || location ? {
            days: [],
            startTime: '',
            endTime: '',
            location: location || '',
        } : {},
    };

    fetch(`/api/teacher/subjects/${subjectId}/create-class`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showNotification(
                    `Class created! ${data.data.studentsEnrolled} students auto-enrolled.`,
                    'success'
                );
                document.getElementById('createSubjectClassModal').style.display = 'none';
                document.getElementById('createSubjectClassForm').reset();
                // Refresh all lists
                loadAssignedSubjects();
                fetchClassesData();
                loadDashboardClasses();
            } else {
                showNotification(data.message || 'Failed to create class', 'error');
            }
        })
        .catch(() => showNotification('Network error. Please try again.', 'error'))
        .finally(() => {
            btn.textContent = 'Create Class & Enroll Students';
            btn.disabled = false;
        });
}


// ============ ENROLLMENT SYSTEM ============

/**
 * Send enrollment invites to all students in department (Auto-enrolls them)
 * @param {string} classId - The class ID
 * @param {string} subjectId - The subject ID (optional)
 * @param {HTMLElement} button - The button element that triggered this
 */
function sendEnrollmentInvites(classId, subjectId, button) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        alert('Please login again');
        window.location.href = 'login.html';
        return;
    }

    // Disable button during request
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enrolling...';
    }

    const payload = { classId };
    if (subjectId) payload.subjectId = subjectId;

    fetch('/api/enrollments/invite', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const enrolled = data.data.enrolled || 0;
            const total = data.data.currentEnrollmentCount || 0;
            const msg = ` Successfully enrolled ${enrolled} new student(s)!\nTotal enrolled: ${total} students`;
            alert(msg);
            console.log('Auto-enrollment result:', data.data);
            
            // Update the enrollment count display in the class card
            const enrollCountSpan = document.querySelector(`.enrolled-count-${classId}`);
            if (enrollCountSpan) {
                enrollCountSpan.textContent = total;
                console.log(`Updated enrollment count display to: ${total}`);
            }
            
            // Permanently replace the button with enrollment status badge
            if (button && button.parentElement) {
                const statusBadge = document.createElement('span');
                statusBadge.className = 'btn btn-sm btn-success';
                statusBadge.style.cursor = 'default';
                statusBadge.style.opacity = '0.8';
                statusBadge.innerHTML = `<i class="fas fa-check-circle"></i> ${total} Enrolled`;
                
                // Replace the button with the status badge
                button.parentElement.replaceChild(statusBadge, button);
            }
        } else {
            alert(' Failed to enroll students: ' + data.message);
            if (button) {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-user-plus"></i> Enroll Students';
            }
        }
    })
    .catch(error => {
        console.error('Error enrolling students:', error);
        alert(' Error enrolling students: ' + error.message);
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-user-plus"></i> Enroll Students';
        }
    });
}

/**
 * Get enrollment stats for a class
 * @param {string} classId - The class ID
 */
function getEnrollmentStats(classId) {
    const token = localStorage.getItem('authToken');
    
    fetch(`/api/enrollments/class/${classId}/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            console.log('Enrollment stats:', data.data);
            return data.data;
        }
    })
    .catch(error => {
        console.error('Error fetching enrollment stats:', error);
    });
}

// Make functions available globally
window.sendEnrollmentInvites = sendEnrollmentInvites;
window.getEnrollmentStats = getEnrollmentStats;


// ============ ENROLLMENT MANAGEMENT ============

/**
 * Open enrollment management modal for a class
 * Shows enrolled students
 */
async function openEnrollmentManagement(classId, className) {
    const modal = document.getElementById('enrollmentManagementModal');
    if (!modal) {
        console.error('Enrollment management modal not found');
        return;
    }

    // Show modal
    modal.style.display = 'block';

    // Set class info
    document.getElementById('enrollmentClassName').textContent = className || 'Class';
    document.getElementById('enrollmentClassInfo').textContent = 'Loading enrollment data...';

    // Fetch enrollment stats and requests
    const token = localStorage.getItem('authToken');
    
    try {
        // Fetch enrollment stats
        const statsRes = await fetch(`/api/enrollments/class/${classId}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const statsData = await statsRes.json();

        if (statsData.success) {
            const { total, accepted, pending, rejected, enrolled } = statsData.data;
            
            // Update stats - Use 'enrolled' from class.students array
            document.getElementById('statTotal').textContent = total || 0;
            document.getElementById('statEnrolled').textContent = enrolled || 0; // Changed from 'accepted'
            // Pending and Rejected removed - auto-enrollment flow only

            // Update class info to show actual enrolled students
            document.getElementById('enrollmentClassInfo').textContent = 
                `${enrolled || 0} students enrolled out of ${total || 0} invitations sent`;
        }

        // Fetch the actual class data to get enrolled students
        console.log('Fetching class data for classId:', classId);
        const classRes = await fetch(`/api/classes/${classId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Class API response status:', classRes.status);
        
        if (classRes.ok) {
            const classData = await classRes.json();
            console.log('Class API response:', classData);
            
            if (classData.success && classData.data) {
                // Populate tables with actual enrolled students
                await populateEnrollmentTablesFromClass(classData.data, token);
            } else {
                console.error('Invalid class data structure');
                document.getElementById('enrolledStudentsTable').innerHTML = 
                    '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#f44336;">Invalid class data</td></tr>';
            }
        } else {
            console.error('Class API failed with status:', classRes.status);
            // Fallback: Try to fetch enrollment requests
            const requestsRes = await fetch(`/api/enrollments/class/${classId}/requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (requestsRes.ok) {
                const requestsData = await requestsRes.json();
                if (requestsData.success) {
                    populateEnrollmentTables(requestsData.data.requests);
                }
            } else {
                await loadEnrollmentRequestsManually(classId, token);
            }
        }
    } catch (error) {
        console.error('Error loading enrollment data:', error);
        document.getElementById('enrollmentClassInfo').textContent = 'Error loading enrollment data';
    }
}

/**
 * Fallback: Load enrollment requests by fetching class and checking students
 */
async function loadEnrollmentRequestsManually(classId, token) {
    document.getElementById('enrolledStudentsTable').innerHTML = 
        '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#999;">Could not load enrollment data. Please refresh.</td></tr>';
}

/**
 * Populate enrollment tables from class data (shows actual enrolled students)
 */
async function populateEnrollmentTablesFromClass(classData, token) {
    console.log('populateEnrollmentTablesFromClass called with class:', classData);
    
    // Use the populated students array directly from class data
    const enrolledStudents = classData.students || [];
    console.log('Enrolled students from class data:', enrolledStudents);
    
    // Populate enrolled students table
    const enrolledTable = document.getElementById('enrolledStudentsTable');
    
    if (enrolledStudents.length === 0) {
        console.log('No enrolled students, showing empty state');
        enrolledTable.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#999;">No enrolled students yet</td></tr>';
        return;
    }
    
    console.log(`Displaying ${enrolledStudents.length} enrolled students`);
    
    // Display the enrolled students (already populated from the class API)
    enrolledTable.innerHTML = enrolledStudents.map(student => {
        // Handle both populated (object) and non-populated (string ID) students
        const studentData = typeof student === 'object' ? student : { _id: student };
        return `
            <tr>
                <td>${studentData.studentId || 'N/A'}</td>
                <td><strong>${studentData.name || 'Unknown'}</strong></td>
                <td>${studentData.email || 'N/A'}</td>
                <td>${new Date().toLocaleDateString('en-IN')}</td>
                <td><span class="status-badge success"><i class="fas fa-check-circle"></i> Enrolled</span></td>
            </tr>
        `;
    }).join('');
    
    // All students are auto-enrolled, no pending or rejected states needed
}

/**
 * Populate enrollment tables with data (auto-enrollment: only shows enrolled students)
 */
function populateEnrollmentTables(requests) {
    const enrolled = requests.filter(r => r.status === 'accepted');

    // Populate enrolled table
    const enrolledTable = document.getElementById('enrolledStudentsTable');
    if (enrolled.length === 0) {
        enrolledTable.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#999;">No enrolled students yet</td></tr>';
    } else {
        enrolledTable.innerHTML = enrolled.map(req => `
            <tr>
                <td>${req.student?.studentId || 'N/A'}</td>
                <td><strong>${req.student?.name || 'Unknown'}</strong></td>
                <td>${req.student?.email || 'N/A'}</td>
                <td>${new Date(req.respondedAt || req.createdAt).toLocaleDateString('en-IN')}</td>
                <td><span class="status-badge success"><i class="fas fa-check-circle"></i> Enrolled</span></td>
            </tr>
        `).join('');
    }
}

/**
 * Switch enrollment tabs
 */
function switchEnrollmentTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.enrollment-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.enrollment-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(`${tabName}Tab`).style.display = 'block';
}

/**
 * Close enrollment management modal
 */
function closeEnrollmentModal() {
    const modal = document.getElementById('enrollmentManagementModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Make functions available globally
window.openEnrollmentManagement = openEnrollmentManagement;
window.switchEnrollmentTab = switchEnrollmentTab;
window.closeEnrollmentModal = closeEnrollmentModal;

// Add click handler for manage-class buttons
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('manage-class') || e.target.closest('.manage-class')) {
        e.preventDefault();
        const btn = e.target.classList.contains('manage-class') ? e.target : e.target.closest('.manage-class');
        const classId = btn.getAttribute('data-class-id');
        
        // Get class name from the parent element
        const classItem = btn.closest('.class-item');
        const className = classItem ? classItem.querySelector('.class-name')?.textContent : 'Class';
        
        await openEnrollmentManagement(classId, className);
    }
});


// ----
//  TEACHER MEETING ROOM  invitations from HOD
// ----
async function loadTeacherMeetingInvites() {
    const container = document.getElementById('teacherMeetingInvites');
    if (!container) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages?folder=inbox&limit=50', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const messages = data.success ? (data.data?.messages || []) : [];

        // Only show meeting invites sent by HOD or Principal  filter by sender role
        const allowedRoles = ['hod', 'managing_authority', 'admin'];
        const invites = messages.filter(m =>
            (m.subject || '').includes('Live Meeting') &&
            m.sender &&
            allowedRoles.includes(m.sender.role)
        );

        if (invites.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:1.5rem;">No meeting invitations yet. Your HOD will send meeting links here.</p>';
            return;
        }

        container.innerHTML = invites.map(m => {
            const linkMatch = (m.content || '').match(/https?:\/\/[^\s]+meeting-room\.html[^\s]*/);
            const link = linkMatch ? linkMatch[0] : null;
            const from = m.sender ? m.sender.name : 'Unknown';
            const senderRole = m.sender?.role === 'hod' ? 'HOD' : m.sender?.role === 'managing_authority' ? 'Principal' : '';
            const time = new Date(m.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
            const title = (m.subject || '').replace(' Live Meeting:', '').trim();

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:0.75rem;">
                    <div>
                        <div style="font-weight:600; color:#1e293b;">${title}</div>
                        <div style="color:#94a3b8; font-size:0.82rem;"><i class="fas fa-user"></i> from ${from}${senderRole ? ` (${senderRole})` : ''}  ${time}</div>
                    </div>
                    ${link
                        ? `<button onclick="window.open('${link}','_blank')" style="padding:0.5rem 1.1rem; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.85rem;"><i class="fas fa-video"></i> Join</button>`
                        : '<span style="color:#94a3b8; font-size:0.82rem;">Link unavailable</span>'}
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('loadTeacherMeetingInvites error:', err);
        container.innerHTML = '<p style="color:#f44336; text-align:center; padding:1.5rem;">Failed to load invitations.</p>';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.sidebar-menu a[data-section="meetingroom"]').forEach(link => {
        link.addEventListener('click', loadTeacherMeetingInvites);
    });
});


// ----
//  START CLASS FLOW (Set time  Physical or Virtual)
// ----
let _startClassId = null;
let _startClassName = null;

// Wire the Start Class button (delegated click on .start-class elements)
document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (e) {
        const btn = e.target.classList.contains('start-class')
            ? e.target
            : e.target.closest('.start-class');
        if (!btn) return;
        e.preventDefault();

        _startClassId = btn.getAttribute('data-class-id') || btn.dataset.classId;

        // Find class name from the surrounding li
        const li = btn.closest('li');
        _startClassName = li
            ? (li.querySelector('.class-name')?.textContent || 'Class')
            : 'Class';

        openStartClassModal(_startClassId, _startClassName);
    });
});

function openStartClassModal(classId, className) {
    _startClassId = classId;
    _startClassName = className;
    const nameEl = document.getElementById('startClassSubjectName');
    if (nameEl) nameEl.textContent = className;
    const modal = document.getElementById('startClassModal');
    if (modal) modal.style.display = 'flex';
}

function closeStartClassModal() {
    const modal = document.getElementById('startClassModal');
    if (modal) modal.style.display = 'none';
    _startClassId = null;
    _startClassName = null;
}

async function startClassVirtual() {
    if (!_startClassId) return;

    const btn = document.getElementById('startVirtualBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating room...'; }

    try {
        const token = localStorage.getItem('authToken');

        // Load class to get scheduled date/time set via Update Mode
        const classRes = await fetch(`/api/classes/${_startClassId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const classData = await classRes.json();

        if (!classData.success) {
            showNotification('Failed to load class details', 'error');
            return;
        }

        const cls = classData.data;
        const scheduledDate = cls.schedule?.scheduledDate;
        const scheduledTime = cls.schedule?.scheduledTime;

        if (!scheduledDate || !scheduledTime) {
            showNotification('Please set the class date and time using "Update Mode" first.', 'error');
            closeStartClassModal();
            return;
        }

        // Check 15-minute window
        const now = new Date();
        const [h, m] = scheduledTime.split(':').map(Number);
        const sched = new Date(scheduledDate);
        sched.setHours(h, m, 0, 0);
        const earlyAccess = new Date(sched.getTime() - 15 * 60 * 1000);

        if (now < earlyAccess) {
            const mins = Math.ceil((earlyAccess - now) / 60000);
            showNotification(`Class link opens 15 minutes before ${scheduledTime}. Please wait ${mins} more minute(s).`, 'info');
            return;
        }

        const title = `${_startClassName}  ${scheduledDate} ${scheduledTime}`;

        // Create the meeting room and send link to students
        const meetRes = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, classId: _startClassId, audience: 'class-students', scheduledDate, scheduledTime })
        });
        const meetData = await meetRes.json();

        if (meetData.success && meetData.data?.meeting) {
            const { roomCode, meetingLink } = meetData.data.meeting;

            // Save the live meeting link on the class record (simple direct endpoint)
            await fetch(`/api/classes/${_startClassId}/meeting-link`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingLink })
            });

            showNotification(`Virtual room created! ${meetData.data.notified} student(s) notified. Opening meeting...`, 'success');
            closeStartClassModal();
            window.open(`/meeting-room.html?room=${roomCode}&title=${encodeURIComponent(title)}`, '_blank');
            loadDashboardClasses();
        } else {
            showNotification(meetData.message || 'Failed to create virtual room', 'error');
        }
    } catch (err) {
        console.error('startClassVirtual error:', err);
        showNotification('Failed to create virtual room', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-video"></i> Start Virtual Class'; }
    }
}

// ----
// ---- ANNOUNCEMENTS SECTION 
// ----

async function loadTeacherAnnouncements() {
    const container = document.getElementById('teacherAnnouncementsList');
    if (!container) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/announcements', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const announcements = data.success ? (data.data?.announcements || []) : [];
        if (announcements.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:2rem;">No announcements at this time.</p>';
            return;
        }
        const colors = { high: '#dc2626', medium: '#d97706', low: '#16a34a' };
        container.innerHTML = announcements.map(a => {
            const c = colors[a.priority] || colors.medium;
            const date = new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const postedBy = a.postedBy ? a.postedBy.name : (a.postedByName || 'Principal');
            return `<div style="border:1px solid #e2e8f0;border-left:4px solid ${c};border-radius:8px;padding:1rem;margin-bottom:0.75rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;flex-wrap:wrap;gap:0.4rem;">
                    <strong style="color:#1e293b;">${a.title}</strong>
                    <span style="color:#94a3b8;font-size:0.78rem;">${date}</span>
                </div>
                <p style="margin:0 0 0.5rem;color:#374151;font-size:0.9rem;line-height:1.5;">${a.content}</p>
                <div style="display:flex;gap:0.75rem;font-size:0.78rem;color:#64748b;">
                    <span><i class="fas fa-user"></i> ${postedBy}</span>
                    <span style="background:${c}15;color:${c};padding:0.1rem 0.5rem;border-radius:4px;font-weight:600;">${a.priority}</span>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error('loadTeacherAnnouncements error:', err);
        if (container) container.innerHTML = '<p style="color:#f44336;text-align:center;padding:1rem;">Failed to load announcements.</p>';
    }
}

// ----
// ---- DYNAMIC MESSAGES SECTION 
// ----

let _teacherMsgData = { students: [], hod: null, currentMsgId: null };

// Load inbox messages
async function loadTeacherInbox() {
    const container = document.getElementById('teacherInboxMessages');
    if (!container) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages?folder=inbox&limit=50', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const messages = data.success ? (data.data?.messages || []) : [];

        if (messages.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:2rem;">No messages yet.</p>';
            return;
        }

        container.innerHTML = messages.map(m => {
            const from = m.sender ? m.sender.name : 'Unknown';
            const time = new Date(m.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            const isUnread = !m.isRead;
            return `
                <div class="message-item ${isUnread ? 'unread' : ''}" style="display:flex;justify-content:space-between;align-items:center;padding:1rem;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:0.75rem;${isUnread ? 'background:#f0f4ff;border-left:4px solid #667eea;' : ''}">
                    <div style="flex:1;">
                        <div style="font-weight:${isUnread ? '700' : '600'};color:#1e293b;">${from} - ${m.subject || 'No Subject'}</div>
                        <div style="color:#94a3b8;font-size:0.82rem;margin-top:0.2rem;"><i class="fas fa-clock"></i> ${time}</div>
                        <div style="color:#64748b;font-size:0.88rem;margin-top:0.3rem;">${(m.content || '').substring(0, 80)}${(m.content || '').length > 80 ? '...' : ''}</div>
                    </div>
                    <button onclick="viewTeacherMessage('${m._id}','inbox')" class="btn btn-sm btn-outline" style="white-space:nowrap;">View</button>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('loadTeacherInbox error:', err);
        container.innerHTML = '<p style="color:#f44336;text-align:center;padding:1rem;">Failed to load messages.</p>';
    }
}

// Load sent messages
async function loadTeacherSent() {
    const container = document.getElementById('teacherSentMessages');
    if (!container) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages?folder=sent&limit=50', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const messages = data.success ? (data.data?.messages || []) : [];

        if (messages.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:2rem;">No sent messages.</p>';
            return;
        }

        container.innerHTML = messages.map(m => {
            const recipients = (m.recipients || []).map(r => r.name || 'Unknown');
            const toDisplay = recipients.length > 3 ? `${recipients.slice(0, 3).join(', ')} +${recipients.length - 3} more` : recipients.join(', ');
            const time = new Date(m.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            return `
                <div class="message-item" style="display:flex;justify-content:space-between;align-items:center;padding:1rem;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:0.75rem;">
                    <div style="flex:1;">
                        <div style="font-weight:600;color:#1e293b;">To: ${toDisplay}</div>
                        <div style="color:#667eea;font-weight:600;font-size:0.9rem;margin-top:0.2rem;">${m.subject || 'No Subject'}</div>
                        <div style="color:#94a3b8;font-size:0.82rem;margin-top:0.2rem;"><i class="fas fa-clock"></i> ${time}</div>
                    </div>
                    <button onclick="viewTeacherMessage('${m._id}','sent')" class="btn btn-sm btn-outline" style="white-space:nowrap;">View</button>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('loadTeacherSent error:', err);
        container.innerHTML = '<p style="color:#f44336;text-align:center;padding:1rem;">Failed to load sent messages.</p>';
    }
}

// View message detail with reply thread
async function viewTeacherMessage(msgId, folder) {
    _teacherMsgData.currentMsgId = msgId;
    const modal = document.getElementById('teacherMsgDetailModal');
    if (!modal) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/messages/${msgId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const msg = data.success ? data.data : null;
        if (!msg) { showNotification('Message not found', 'error'); return; }

        const fromLabel = document.getElementById('teacherMsgFromLabel');
        if (folder === 'sent') {
            fromLabel.textContent = 'To:';
            const recipients = (msg.recipients || []).map(r => r.name || 'Unknown');
            document.getElementById('teacherMsgFrom').textContent = recipients.join(', ');
        } else {
            fromLabel.textContent = 'From:';
            document.getElementById('teacherMsgFrom').textContent = msg.sender ? msg.sender.name : 'Unknown';
        }
        document.getElementById('teacherMsgDate').textContent = new Date(msg.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        document.getElementById('teacherMsgSubjectDetail').textContent = msg.subject || 'No Subject';
        document.getElementById('teacherMsgContentDetail').textContent = msg.content || '';

        // Load replies
        const threadEl = document.getElementById('teacherReplyThread');
        const listEl = document.getElementById('teacherReplyList');
        threadEl.style.display = 'none';
        listEl.innerHTML = '';
        document.getElementById('teacherReplyBox').style.display = 'none';

        try {
            const rRes = await fetch(`/api/messages/${msgId}/replies`, { headers: { 'Authorization': `Bearer ${token}` } });
            const rData = await rRes.json();
            if (rData.success && rData.data && rData.data.length > 0) {
                threadEl.style.display = 'block';
                listEl.innerHTML = rData.data.map(reply => {
                    const name = reply.sender ? reply.sender.name : 'Unknown';
                    const t = new Date(reply.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                    return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:0.85rem;border-left:4px solid #667eea;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;">
                            <strong style="color:#667eea;font-size:0.9rem;">${name}</strong>
                            <span style="color:#94a3b8;font-size:0.8rem;">${t}</span>
                        </div>
                        <p style="margin:0;white-space:pre-wrap;font-size:0.9rem;color:#374151;">${reply.content}</p>
                    </div>`;
                }).join('');
            }
        } catch (_) {}

        modal.style.display = 'block';
    } catch (err) {
        showNotification('Failed to load message', 'error');
    }
}

// Send reply
async function sendTeacherReply() {
    const content = document.getElementById('teacherReplyContent').value.trim();
    if (!content) { showNotification('Please write a reply', 'error'); return; }
    if (!_teacherMsgData.currentMsgId) return;

    try {
        const token = localStorage.getItem('authToken');
        // Get the original message to find sender
        const msgRes = await fetch(`/api/messages/${_teacherMsgData.currentMsgId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const msgData = await msgRes.json();
        const msg = msgData.success ? msgData.data : null;
        if (!msg) { showNotification('Cannot find original message', 'error'); return; }

        const recipients = msg.sender ? [msg.sender._id || msg.sender] : [];
        const subject = `Re: ${msg.subject || 'No Subject'}`;

        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipients, subject, content, parentId: _teacherMsgData.currentMsgId })
        });
        const data = await res.json();
        if (data.success || res.ok) {
            showNotification('Reply sent!', 'success');
            document.getElementById('teacherReplyBox').style.display = 'none';
            document.getElementById('teacherReplyContent').value = '';
            viewTeacherMessage(_teacherMsgData.currentMsgId, 'inbox');
        } else {
            showNotification(data.message || 'Failed to send reply', 'error');
        }
    } catch (err) {
        showNotification('Failed to send reply', 'error');
    }
}

// Send new message
async function sendTeacherMessage(e) {
    e.preventDefault();
    const recipientValue = document.getElementById('teacherMsgTo').value;
    const subject = document.getElementById('teacherMsgSubject').value.trim();
    const content = document.getElementById('teacherMsgContent').value.trim();

    if (!recipientValue || !subject || !content) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    let recipients = [];
    const token = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (recipientValue === '__all_students__') {
        // Get all students in teacher's classes
        try {
            const classRes = await fetch('/api/classes?myOwn=true', { headers: { 'Authorization': `Bearer ${token}` } });
            const classData = await classRes.json();
            const classes = classData.success ? (classData.data?.classes || []) : [];
            const studentSet = new Set();
            classes.forEach(cls => {
                (cls.students || []).forEach(s => studentSet.add(s._id || s));
            });
            recipients = Array.from(studentSet);
        } catch (_) {}
    } else if (recipientValue === '__hod__') {
        // Find HOD of teacher's department
        try {
            const dept = currentUser.department || '';
            const hodRes = await fetch('/api/users?role=hod', { headers: { 'Authorization': `Bearer ${token}` } });
            const hodData = await hodRes.json();
            if (hodData.success) {
                const hods = hodData.data?.users || hodData.data || [];
                const myHod = hods.find(h => h.department === dept);
                if (myHod) recipients = [myHod._id];
            }
        } catch (_) {}
        // Fallback: try hod/teachers endpoint
        if (recipients.length === 0) {
            try {
                const tRes = await fetch('/api/hod/teachers', { headers: { 'Authorization': `Bearer ${token}` } });
                const tData = await tRes.json();
                if (tData.success && tData.data?.teachers) {
                    const hod = tData.data.teachers.find(t => t.role === 'hod');
                    if (hod) recipients = [hod._id];
                }
            } catch (_) {}
        }
    } else {
        recipients = [recipientValue];
    }

    if (recipients.length === 0) {
        showNotification('No valid recipients found', 'error');
        return;
    }

    showNotification('Sending message...');

    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipients, subject, content })
        });
        const data = await res.json();
        if (data.success || res.ok) {
            showNotification(`Message sent to ${recipients.length} recipient(s)!`, 'success');
            document.getElementById('teacherComposeModal').style.display = 'none';
            document.getElementById('teacherMessageForm').reset();
            loadTeacherSent();
        } else {
            showNotification(data.message || 'Failed to send message', 'error');
        }
    } catch (err) {
        showNotification('Failed to send message', 'error');
    }
}

// Populate the recipient dropdown with individual students
async function populateTeacherRecipients() {
    const sel = document.getElementById('teacherMsgTo');
    if (!sel) return;

    // Remove any previously appended options (keep first 3: Select, All Students, HOD)
    while (sel.options.length > 3) {
        sel.remove(3);
    }

    const token = localStorage.getItem('authToken');

    try {
        // Fetch all department students using teacher-specific endpoint
        const res = await fetch('/api/teacher/students', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        let students = [];

        if (data.success) {
            // The endpoint returns { data: { users: [...] } }
            students = data.data?.users || data.data?.students || [];
            if (Array.isArray(data.data)) students = data.data;
        }

        console.log('Teacher recipients - students found:', students.length);

        // Add separator and individual students
        if (students.length > 0) {
            const sep = document.createElement('option');
            sep.disabled = true;
            sep.textContent = ` Individual Students (${students.length}) `;
            sel.appendChild(sep);

            // Sort students alphabetically
            students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            students.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s._id;
                opt.textContent = `${s.name}${s.studentId ? ' (' + s.studentId + ')' : ''}`;
                sel.appendChild(opt);
            });
        } else {
            console.warn('No students found from /api/teacher/students. Response:', data);
        }
    } catch (err) {
        console.error('populateTeacherRecipients error:', err);
    }
}

// ---- Wire everything on DOM load 
document.addEventListener('DOMContentLoaded', function () {
    // Load announcements
    setTimeout(loadTeacherAnnouncements, 800);

    // Load messages when navigating to messages section
    document.querySelectorAll('.sidebar-menu a[data-section="messages"]').forEach(link => {
        link.addEventListener('click', function () {
            loadTeacherInbox();
            loadTeacherSent();
        });
    });

    // Load announcements when navigating to section
    document.querySelectorAll('.sidebar-menu a[data-section="announcements"]').forEach(link => {
        link.addEventListener('click', function () {
            loadTeacherAnnouncements();
        });
    });

    // Compose button
    const composeBtn = document.getElementById('composeMessageBtn');
    if (composeBtn) {
        composeBtn.addEventListener('click', function () {
            document.getElementById('teacherComposeModal').style.display = 'block';
            populateTeacherRecipients();
        });
    }

    // Message form submit
    const msgForm = document.getElementById('teacherMessageForm');
    if (msgForm) msgForm.addEventListener('submit', sendTeacherMessage);

    // Reply button
    const replyBtn = document.getElementById('teacherReplyBtn');
    if (replyBtn) {
        replyBtn.addEventListener('click', function () {
            document.getElementById('teacherReplyBox').style.display = 'block';
            document.getElementById('teacherReplyContent').focus();
        });
    }

    // Send reply button
    const sendReplyBtn = document.getElementById('teacherSendReplyBtn');
    if (sendReplyBtn) sendReplyBtn.addEventListener('click', sendTeacherReply);

    // Close modals
    document.querySelectorAll('#teacherComposeModal .close, #teacherComposeModal .cancel-btn').forEach(el => {
        el.addEventListener('click', () => { document.getElementById('teacherComposeModal').style.display = 'none'; });
    });
    document.querySelectorAll('#teacherMsgDetailModal .close, #teacherMsgDetailModal .close-detail').forEach(el => {
        el.addEventListener('click', () => { document.getElementById('teacherMsgDetailModal').style.display = 'none'; });
    });

    // Tab switching for messages
    document.querySelectorAll('#messages .message-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('#messages .message-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#messages .tab-content').forEach(tc => tc.classList.remove('active'));
            this.classList.add('active');
            const tab = this.getAttribute('data-tab');
            const el = document.getElementById(tab);
            if (el) el.classList.add('active');
            if (tab === 'inbox') loadTeacherInbox();
            if (tab === 'sent') loadTeacherSent();
        });
    });

    // Initial load of inbox
    setTimeout(loadTeacherInbox, 1200);
});


// ----
