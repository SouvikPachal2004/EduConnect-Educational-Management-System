document.addEventListener('DOMContentLoaded', function() {
    // Initialize all dashboard components
    initializeDashboard();
    
    // Setup navigation and section switching
    setupNavigation();
    
    // Setup modal functionality
    setupModals();
    
    // Setup tab systems
    setupTabs();
    
    // Setup form submissions
    setupForms();
    
    // Setup calendar functionality
    setupCalendar();
    
    // Setup attendance system
    setupAttendance();
    
    // Setup search and filtering
    setupSearchAndFilters();
    
    // Setup interactive elements
    setupInteractiveElements();
    
    // Setup notification system
    setupNotifications();
    
    // Setup new modals
    setupClassDetailsModal();
    setupStudentDetailsModal();
    setupAssignmentDetailsModal();
    setupEditGradeModal();
    setupViewMessageModal();
});

// Initialize dashboard components
function initializeDashboard() {
    // Set current date for attendance
    const today = new Date();
    document.getElementById('attendanceDate').valueAsDate = today;
    
    // Set current month for calendar
    updateCalendarDisplay(today);
    
    // Initialize notification badge
    updateNotificationBadge(5);
    
    // Initialize mobile menu
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    mobileMenuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });
    
    // Fetch classes data from backend
    fetchClassesData();
    
    // Fetch assignments data from backend
    fetchAssignmentsData();
    
    // Fetch students data from backend
    fetchStudentsData();
    
    // Fetch resources data from backend
    fetchResourcesData();
    
    // Fetch attendance data from backend
    fetchAttendanceData();
    
    // Fetch grades data from backend
    fetchGradesData();
    
    // Fetch messages data from backend
    fetchMessagesData();
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
                
                // Update page title
                updatePageTitle(sectionId);
                
                // Scroll to top
                window.scrollTo(0, 0);
            }
            
            // Close mobile menu if open
            document.getElementById('sidebar').classList.remove('active');
        });
    });
}

// Update page title based on section
function updatePageTitle(sectionId) {
    const titles = {
        'overview': 'Teacher Dashboard',
        'classes': 'My Classes',
        'assignments': 'Assignments',
        'students': 'Students',
        'resources': 'Course Resources',
        'attendance': 'Attendance',
        'grades': 'Grade Management',
        'calendar': 'Academic Calendar',
        'messages': 'Messages'
    };
    
    const title = titles[sectionId] || 'Teacher Dashboard';
    document.querySelector('.page-title h1').textContent = title;
}

// Setup modal functionality
function setupModals() {
    // Create Class Modal
    setupModal('createClassBtn', 'createClassModal');
    
    // Create Assignment Modal
    setupModal('createAssignmentBtn', 'createAssignmentModal');
    
    // Upload Resource Modal
    setupModal('uploadResourceBtn', 'uploadResourceModal');
    
    // Start Class Modal
    setupModal('startClassModal', null, '.start-class');
    
    // Grade Assignment Modal
    setupModal('gradeAssignmentModal', null, '.grade-assignment');
    
    // Compose Message Modal
    setupModal('composeMessageBtn', 'composeMessageModal');
    
    // Add Event Modal
    setupModal('addEventBtn', 'addEventModal');
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Generic modal setup function
function setupModal(buttonId, modalId, selector) {
    let button, modal;
    
    if (buttonId) {
        button = document.getElementById(buttonId);
    }
    
    if (modalId) {
        modal = document.getElementById(modalId);
    }
    
    if (button && modal) {
        button.addEventListener('click', function() {
            modal.style.display = 'block';
        });
    }
    
    if (modal) {
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
    }
    
    // Handle selector-based modals
    if (selector) {
        document.querySelectorAll(selector).forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const dataAttr = this.getAttribute('data-class-id') || this.getAttribute('data-assignment-id') || this.getAttribute('data-student-id') || this.getAttribute('data-message-id');
                openSpecificModal(selector, dataAttr);
            });
        });
    }
}

// Open specific modals based on selector
function openSpecificModal(selector, dataId) {
    if (selector === '.start-class') {
        openStartClassModal(dataId);
    } else if (selector === '.grade-assignment') {
        openGradeAssignmentModal(dataId);
    } else if (selector === '.manage-class') {
        openClassDetailsModal(dataId);
    } else if (selector === '.view-student') {
        openStudentDetailsModal(dataId);
    } else if (selector === '.view-assignment') {
        openAssignmentDetailsModal(dataId);
    } else if (selector === '.edit-grade') {
        openEditGradeModal(dataId);
    } else if (selector === '.view-message') {
        openViewMessageModal(dataId);
    }
}

// Setup tab systems
function setupTabs() {
    // Assignment Tabs
    setupTabSystem('#assignments .tab-btn', '#assignments .tab-content');
    
    // Resource Tabs
    setupTabSystem('#resources .tab-btn', '#resources .tab-content');
    
    // Message Tabs
    setupTabSystem('#messages .tab-btn', '#messages .tab-content');
}

// Generic tab system setup
function setupTabSystem(buttonSelector, contentSelector) {
    const buttons = document.querySelectorAll(buttonSelector);
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll(contentSelector).forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab content
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Setup form submissions
function setupForms() {
    // Create Class Form
    setupForm('createClassForm', handleCreateClass);
    
    // Create Assignment Form
    setupForm('createAssignmentForm', handleCreateAssignment);
    
    // Upload Resource Form
    setupForm('uploadResourceForm', handleUploadResource, setupResourceForm);
    
    // Compose Message Form
    setupForm('composeMessageForm', handleComposeMessage, setupMessageForm);
    
    // Add Event Form
    setupForm('addEventForm', handleAddEvent);
}

// Generic form setup
function setupForm(formId, submitHandler, setupHandler) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    if (setupHandler) {
        setupHandler(form);
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitHandler(form);
    });
}

// Handle create class form submission
function handleCreateClass(form) {
    const formData = {
        name: document.getElementById('className').value,
        code: document.getElementById('classCode').value,
        schedule: document.getElementById('classSchedule').value,
        location: document.getElementById('classLocation').value,
        description: document.getElementById('classDescription').value
    };
    
    // Validate form
    if (!formData.name || !formData.code || !formData.schedule || !formData.location) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Simulate API call
    console.log('Creating class:', formData);
    
    // Show success message
    showNotification(`Class "${formData.name}" created successfully!`, 'success');
    
    // Reset form and close modal
    form.reset();
    document.getElementById('createClassModal').style.display = 'none';
    
    // In a real app, you would refresh the classes list
    refreshClassesList();
}

// Handle create assignment form submission
function handleCreateAssignment(form) {
    const formData = {
        title: document.getElementById('assignmentTitle').value,
        classId: document.getElementById('assignmentClass').value,
        description: document.getElementById('assignmentDescription').value,
        dueDate: document.getElementById('assignmentDueDate').value,
        points: document.getElementById('assignmentPoints').value,
        saveAsDraft: document.getElementById('saveAsDraft').checked
    };
    
    // Validate form
    if (!formData.title || !formData.classId || !formData.description || !formData.dueDate || !formData.points) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Simulate API call
    console.log('Creating assignment:', formData);
    
    // Show success message
    showNotification(`Assignment "${formData.title}" created successfully!`, 'success');
    
    // Reset form and close modal
    form.reset();
    document.getElementById('createAssignmentModal').style.display = 'none';
    
    // In a real app, you would refresh the assignments list
    refreshAssignmentsList();
}

// Setup resource form (dynamic fields)
function setupResourceForm(form) {
    const resourceTypeSelect = document.getElementById('resourceType');
    const fileUploadGroup = document.getElementById('fileUploadGroup');
    const linkUrlGroup = document.getElementById('linkUrlGroup');
    
    resourceTypeSelect.addEventListener('change', function() {
        if (this.value === 'link') {
            fileUploadGroup.style.display = 'none';
            linkUrlGroup.style.display = 'block';
        } else {
            fileUploadGroup.style.display = 'block';
            linkUrlGroup.style.display = 'none';
        }
    });
}

// Handle upload resource form submission
function handleUploadResource(form) {
    const formData = {
        title: document.getElementById('resourceTitle').value,
        classId: document.getElementById('resourceClass').value,
        type: document.getElementById('resourceType').value,
        description: document.getElementById('resourceDescription').value
    };
    
    // Add file or URL based on type
    if (formData.type === 'link') {
        formData.url = document.getElementById('resourceUrl').value;
    } else {
        formData.file = document.getElementById('resourceFile').files[0];
    }
    
    // Validate form
    if (!formData.title || !formData.classId || !formData.type) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Simulate API call
    console.log('Uploading resource:', formData);
    
    // Show success message
    showNotification(`Resource "${formData.title}" uploaded successfully!`, 'success');
    
    // Reset form and close modal
    form.reset();
    document.getElementById('uploadResourceModal').style.display = 'none';
    
    // In a real app, you would refresh the resources list
    refreshResourcesList();
}

// Setup message form (dynamic fields)
function setupMessageForm(form) {
    const messageRecipientSelect = document.getElementById('messageRecipient');
    const studentSelectGroup = document.getElementById('studentSelectGroup');
    const classSelectGroup = document.getElementById('classSelectGroup');
    
    messageRecipientSelect.addEventListener('change', function() {
        studentSelectGroup.style.display = 'none';
        classSelectGroup.style.display = 'none';
        
        if (this.value === 'student') {
            studentSelectGroup.style.display = 'block';
        } else if (this.value === 'class') {
            classSelectGroup.style.display = 'block';
        }
    });
}

// Handle compose message form submission
function handleComposeMessage(form) {
    const formData = {
        recipient: document.getElementById('messageRecipient').value,
        studentId: document.getElementById('messageStudent').value,
        classId: document.getElementById('messageClass').value,
        subject: document.getElementById('messageSubject').value,
        content: document.getElementById('messageContent').value,
        saveAsDraft: document.getElementById('saveMessageDraft').checked
    };
    
    // Validate form
    if (!formData.recipient || !formData.subject || !formData.content) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate recipient-specific fields
    if (formData.recipient === 'student' && !formData.studentId) {
        showNotification('Please select a student', 'error');
        return;
    }
    
    if (formData.recipient === 'class' && !formData.classId) {
        showNotification('Please select a class', 'error');
        return;
    }
    
    // Simulate API call
    console.log('Sending message:', formData);
    
    // Show success message
    showNotification('Message sent successfully!', 'success');
    
    // Reset form and close modal
    form.reset();
    document.getElementById('composeMessageModal').style.display = 'none';
    
    // In a real app, you would refresh the messages list
    refreshMessagesList();
}

// Handle add event form submission
function handleAddEvent(form) {
    const formData = {
        title: document.getElementById('eventTitle').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('eventLocation').value,
        description: document.getElementById('eventDescription').value,
        setReminder: document.getElementById('eventReminder').checked
    };
    
    // Validate form
    if (!formData.title || !formData.date || !formData.time) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Simulate API call
    console.log('Adding event:', formData);
    
    // Show success message
    showNotification(`Event "${formData.title}" added successfully!`, 'success');
    
    // Reset form and close modal
    form.reset();
    document.getElementById('addEventModal').style.display = 'none';
    
    // In a real app, you would refresh the calendar
    refreshCalendar();
}

// Setup calendar functionality
function setupCalendar() {
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    let currentDate = new Date();
    
    prevMonthBtn.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendarDisplay(currentDate);
    });
    
    nextMonthBtn.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendarDisplay(currentDate);
    });
    
    // Generate calendar days
    generateCalendarDays(currentDate);
}

// Update calendar display
function updateCalendarDisplay(date) {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    const currentMonthElement = document.getElementById('currentMonth');
    currentMonthElement.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    
    // Generate calendar days
    generateCalendarDays(date);
}

// Generate calendar days
function generateCalendarDays(date) {
    const calendarGrid = document.querySelector('.calendar-grid');
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Clear existing days (except headers)
    const existingDays = calendarGrid.querySelectorAll('.calendar-day');
    existingDays.forEach(day => day.remove());
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if this day is today
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Add event indicator (for demo, add to random days)
        if (Math.random() > 0.7) {
            const eventIndicator = document.createElement('div');
            eventIndicator.className = 'event-indicator';
            dayElement.appendChild(eventIndicator);
            dayElement.classList.add('has-event');
        }
        
        // Add click event to show events for this day
        dayElement.addEventListener('click', function() {
            showDayEvents(year, month, day);
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

// Show events for a specific day
function showDayEvents(year, month, day) {
    const dateStr = `${year}-${month + 1}-${day}`;
    
    // In a real app, you would fetch events for this date
    console.log(`Showing events for ${dateStr}`);
    
    // For demo, show a notification
    showNotification(`Events for ${dateStr} would be displayed here`, 'info');
}

// Setup attendance system
function setupAttendance() {
    const markAttendanceBtn = document.getElementById('markAttendanceBtn');
    
    markAttendanceBtn.addEventListener('click', function() {
        const classId = document.getElementById('attendanceClassFilter').value;
        const date = document.getElementById('attendanceDate').value;
        
        if (!classId || !date) {
            showNotification('Please select a class and date', 'error');
            return;
        }
        
        // Simulate API call
        console.log('Marking attendance:', { classId, date });
        
        // Show success message
        showNotification('Attendance marked successfully!', 'success');
        
        // Update attendance summary
        updateAttendanceSummary();
    });
    
    // Setup attendance buttons
    document.querySelectorAll('.mark-present, .mark-absent').forEach(button => {
        button.addEventListener('click', function() {
            const studentId = this.getAttribute('data-student-id');
            const status = this.classList.contains('mark-present') ? 'present' : 'absent';
            
            markAttendance(studentId, status);
        });
    });
}

// Mark attendance for a student
function markAttendance(studentId, status) {
    // Find the student row
    const studentRow = document.querySelector(`#attendanceTableBody tr:has(button[data-student-id="${studentId}"])`);
    
    if (studentRow) {
        // Update status badge
        const statusCell = studentRow.cells[2];
        statusCell.innerHTML = `<span class="badge badge-${status === 'present' ? 'success' : 'danger'}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
        
        // Simulate API call
        console.log(`Marked student ${studentId} as ${status}`);
        
        // Show notification
        showNotification(`Student marked as ${status}`, 'success');
        
        // Update attendance summary
        updateAttendanceSummary();
    }
}

// Update attendance summary
function updateAttendanceSummary() {
    const rows = document.querySelectorAll('#attendanceTableBody tr');
    let total = 0;
    let present = 0;
    
    rows.forEach(row => {
        total++;
        const statusBadge = row.cells[2].querySelector('.badge');
        if (statusBadge && statusBadge.textContent === 'Present') {
            present++;
        }
    });
    
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    // Update summary cards
    document.querySelector('#attendance .summary-card:nth-child(1) .summary-value').textContent = total;
    document.querySelector('#attendance .summary-card:nth-child(2) .summary-value').textContent = present;
    document.querySelector('#attendance .summary-card:nth-child(3) .summary-value').textContent = absent;
    document.querySelector('#attendance .summary-card:nth-child(4) .summary-value').textContent = `${percentage}%`;
}

// Setup search and filtering
function setupSearchAndFilters() {
    // Student search
    const studentSearchInput = document.getElementById('studentSearch');
    
    studentSearchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterStudents(searchTerm);
    });
    
    // Class filter for students
    const classFilter = document.getElementById('classFilter');
    
    classFilter.addEventListener('change', function() {
        const selectedClass = this.value;
        filterStudentsByClass(selectedClass);
    });
    
    // Class filter for attendance
    const attendanceClassFilter = document.getElementById('attendanceClassFilter');
    
    attendanceClassFilter.addEventListener('change', function() {
        const selectedClass = this.value;
        filterAttendanceByClass(selectedClass);
    });
    
    // Class filter for grades
    const gradeClassFilter = document.getElementById('gradeClassFilter');
    
    gradeClassFilter.addEventListener('change', function() {
        const selectedClass = this.value;
        filterGradesByClass(selectedClass);
    });
    
    // Export grades button
    const exportGradesBtn = document.getElementById('exportGradesBtn');
    
    exportGradesBtn.addEventListener('click', function() {
        const selectedClass = document.getElementById('gradeClassFilter').value;
        exportGrades(selectedClass);
    });
}

// Filter students by search term
function filterStudents(searchTerm) {
    const studentRows = document.querySelectorAll('#students tbody tr');
    
    studentRows.forEach(row => {
        const studentName = row.cells[1].textContent.toLowerCase();
        const studentId = row.cells[0].textContent.toLowerCase();
        
        if (studentName.includes(searchTerm) || studentId.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Filter students by class
function filterStudentsByClass(selectedClass) {
    const studentRows = document.querySelectorAll('#students tbody tr');
    
    studentRows.forEach(row => {
        const studentClass = row.cells[2].textContent;
        
        if (selectedClass === 'all' || studentClass.includes(getClassName(selectedClass))) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Filter attendance by class
function filterAttendanceByClass(selectedClass) {
    // In a real app, you would fetch attendance data for the selected class
    console.log('Filtering attendance by class:', selectedClass);
    
    // For demo, show a notification
    showNotification(`Showing attendance for ${getClassName(selectedClass)}`, 'info');
    
    // Reset attendance summary
    updateAttendanceSummary();
}

// Filter grades by class
function filterGradesByClass(selectedClass) {
    // In a real app, you would fetch grade data for the selected class
    console.log('Filtering grades by class:', selectedClass);
    
    // For demo, show a notification
    showNotification(`Showing grades for ${getClassName(selectedClass)}`, 'info');
}

// Export grades
function exportGrades(selectedClass) {
    // In a real app, you would generate and download a CSV file
    console.log('Exporting grades for class:', selectedClass);
    
    // For demo, show a notification
    showNotification(`Grades for ${getClassName(selectedClass)} exported successfully!`, 'success');
}

// Setup interactive elements
function setupInteractiveElements() {
    // Start Class buttons
    document.querySelectorAll('.start-class').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const classId = this.getAttribute('data-class-id');
            openStartClassModal(classId);
        });
    });
    
    // Manage Class buttons
    document.querySelectorAll('.manage-class').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const classId = this.getAttribute('data-class-id');
            openClassDetailsModal(classId);
        });
    });
    
    // Grade Assignment buttons
    document.querySelectorAll('.grade-assignment').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const assignmentId = this.getAttribute('data-assignment-id');
            openGradeAssignmentModal(assignmentId);
        });
    });
    
    // View Assignment buttons
    document.querySelectorAll('.view-assignment').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const assignmentId = this.getAttribute('data-assignment-id');
            openAssignmentDetailsModal(assignmentId);
        });
    });
    
    // Edit Assignment buttons
    document.querySelectorAll('.edit-assignment').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const assignmentId = this.getAttribute('data-assignment-id');
            editAssignment(assignmentId);
        });
    });
    
    // View Student buttons
    document.querySelectorAll('.view-student').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const studentId = this.getAttribute('data-student-id');
            openStudentDetailsModal(studentId);
        });
    });
    
    // Message Student buttons
    document.querySelectorAll('.message-student').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const studentId = this.getAttribute('data-student-id');
            openComposeMessageModal('student', studentId);
        });
    });
    
    // Download Resource buttons
    document.querySelectorAll('.download-resource').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const resourceId = this.getAttribute('data-resource-id');
            downloadResource(resourceId);
        });
    });
    
    // Share Resource buttons
    document.querySelectorAll('.share-resource').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const resourceId = this.getAttribute('data-resource-id');
            shareResource(resourceId);
        });
    });
    
    // Open Link buttons
    document.querySelectorAll('.open-link').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const resourceId = this.getAttribute('data-resource-id');
            openResourceLink(resourceId);
        });
    });
    
    // Edit Grade buttons
    document.querySelectorAll('.edit-grade').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const studentId = this.getAttribute('data-student-id');
            openEditGradeModal(studentId);
        });
    });
    
    // View Message buttons
    document.querySelectorAll('.view-message').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const messageId = this.getAttribute('data-message-id');
            openViewMessageModal(messageId);
        });
    });
    
    // Edit Message buttons
    document.querySelectorAll('.edit-message').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const messageId = this.getAttribute('data-message-id');
            editMessage(messageId);
        });
    });
    
    // Save Grade buttons in grade modal
    document.querySelectorAll('.save-grade').forEach(button => {
        button.addEventListener('click', function() {
            const studentId = this.getAttribute('data-student-id');
            const gradeInput = this.closest('tr').querySelector('.grade-input');
            const grade = gradeInput.value;
            
            saveStudentGrade(studentId, grade, this);
        });
    });
    
    // View Submission buttons in grade modal
    document.querySelectorAll('.view-submission').forEach(button => {
        button.addEventListener('click', function() {
            const studentId = this.getAttribute('data-student-id');
            viewStudentSubmission(studentId);
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function() {
        handleLogout();
    });
    
    // Notification icon
    const notificationIcon = document.getElementById('notificationIcon');
    notificationIcon.addEventListener('click', function() {
        showNotificationDropdown();
    });
}

// Handle logout
function handleLogout() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
        // Simulate logout process
        console.log('Logging out...');
        
        // Show notification
        showNotification('Logging out...', 'info');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

// Show notification dropdown
function showNotificationDropdown() {
    // Check if dropdown already exists
    let dropdown = document.querySelector('.notification-dropdown');
    
    if (dropdown) {
        // Remove existing dropdown
        dropdown.remove();
        return;
    }
    
    // Create dropdown
    dropdown = document.createElement('div');
    dropdown.className = 'notification-dropdown';
    
    // Create dropdown header
    const header = document.createElement('div');
    header.className = 'notification-dropdown-header';
    header.innerHTML = `
        <h3>Notifications</h3>
        <button class="mark-all-read">Mark all as read</button>
    `;
    dropdown.appendChild(header);
    
    // Create notification list
    const list = document.createElement('div');
    list.className = 'notification-list';
    
    // Add sample notifications
    const notifications = [
        {
            title: 'New Assignment Submission',
            message: 'Anurag Ray has submitted Binary Trees assignment',
            time: '2 hours ago',
            unread: true
        },
        {
            title: 'Department Meeting',
            message: 'Meeting scheduled for tomorrow at 10 AM',
            time: 'Yesterday',
            unread: false
        },
        {
            title: 'Doubt Clarification',
            message: 'Priya Sharma has a doubt about Graph Algorithms',
            time: '2 days ago',
            unread: true
        }
    ];
    
    notifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.unread ? 'unread' : ''}`;
        item.innerHTML = `
            <div class="notification-item-title">${notification.title}</div>
            <div class="notification-item-message">${notification.message}</div>
            <div class="notification-item-time">${notification.time}</div>
        `;
        
        item.addEventListener('click', function() {
            // Mark as read
            this.classList.remove('unread');
            
            // Show notification details
            showNotification(`Viewing: ${notification.title}`, 'info');
        });
        
        list.appendChild(item);
    });
    
    dropdown.appendChild(list);
    
    // Create dropdown footer
    const footer = document.createElement('div');
    footer.className = 'notification-dropdown-footer';
    footer.innerHTML = '<a href="#">View All Notifications</a>';
    dropdown.appendChild(footer);
    
    // Add to DOM
    document.body.appendChild(dropdown);
    
    // Position dropdown
    const icon = document.getElementById('notificationIcon');
    const iconRect = icon.getBoundingClientRect();
    dropdown.style.top = `${iconRect.bottom + 10}px`;
    dropdown.style.right = '20px';
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== notificationIcon) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
    
    // Mark all as read button
    header.querySelector('.mark-all-read').addEventListener('click', function() {
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
        });
        
        // Update notification badge
        updateNotificationBadge(0);
        
        showNotification('All notifications marked as read', 'success');
    });
}

// Open Start Class Modal
function openStartClassModal(classId) {
    const modal = document.getElementById('startClassModal');
    const classNameElement = document.getElementById('startClassName');
    const classCodeElement = document.getElementById('startClassCode');
    const classTimeElement = document.getElementById('startClassTime');
    
    // Set class information based on class ID
    const classInfo = getClassInfo(classId);
    classNameElement.textContent = classInfo.name;
    classCodeElement.textContent = classInfo.code;
    classTimeElement.textContent = classInfo.schedule;
    
    // Reset meeting link
    document.getElementById('meetingLinkContainer').style.display = 'none';
    
    modal.style.display = 'block';
    
    // Setup generate meeting link button
    const generateMeetingLinkBtn = document.getElementById('generateMeetingLink');
    generateMeetingLinkBtn.onclick = function() {
        const meetingLink = `https://meet.example.com/${classId}-${Date.now()}`;
        document.getElementById('meetingLink').value = meetingLink;
        document.getElementById('meetingLinkContainer').style.display = 'block';
    };
    
    // Setup copy link button
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    copyLinkBtn.onclick = function() {
        const meetingLinkInput = document.getElementById('meetingLink');
        meetingLinkInput.select();
        document.execCommand('copy');
        
        // Show copied message
        const originalText = this.textContent;
        this.textContent = 'Copied!';
        setTimeout(() => {
            this.textContent = originalText;
        }, 2000);
    };
    
    // Setup start class now button
    const startClassNowBtn = document.getElementById('startClassNow');
    startClassNowBtn.onclick = function() {
        const meetingLink = document.getElementById('meetingLink').value;
        startClass(classId, meetingLink);
        modal.style.display = 'none';
    };
}

// Get class information by ID
function getClassInfo(classId) {
    const classInfo = {
        'ds201': {
            name: 'Data Structures',
            code: 'CS201',
            schedule: 'Mon, Wed, Fri - 9:00 AM'
        },
        'algo301': {
            name: 'Algorithms',
            code: 'CS301',
            schedule: 'Tue, Thu - 11:00 AM'
        },
        'db301': {
            name: 'Database Systems',
            code: 'CS302',
            schedule: 'Mon, Wed, Fri - 2:00 PM'
        },
        'se401': {
            name: 'Software Engineering',
            code: 'CS401',
            schedule: 'Tue, Thu - 3:00 PM'
        }
    };
    
    return classInfo[classId] || { name: 'Unknown Class', code: classId, schedule: '' };
}

// Start a class
function startClass(classId, meetingLink) {
    // In a real app, you would start the class session
    console.log('Starting class:', { classId, meetingLink });
    
    // Show notification
    showNotification(`Class started successfully! Meeting link: ${meetingLink}`, 'success');
}

// Open Grade Assignment Modal
function openGradeAssignmentModal(assignmentId) {
    const modal = document.getElementById('gradeAssignmentModal');
    const assignmentTitleElement = document.getElementById('gradeAssignmentTitle');
    const assignmentClassElement = document.getElementById('gradeAssignmentClass');
    const assignmentPointsElement = document.getElementById('gradeAssignmentPoints');
    
    // Set assignment information based on assignment ID
    const assignmentInfo = getAssignmentInfo(assignmentId);
    assignmentTitleElement.textContent = assignmentInfo.title;
    assignmentClassElement.textContent = assignmentInfo.class;
    assignmentPointsElement.textContent = assignmentInfo.points;
    
    modal.style.display = 'block';
}

// Get assignment information by ID
function getAssignmentInfo(assignmentId) {
    const assignmentInfo = {
        'btrees': {
            title: 'Binary Trees Implementation',
            class: 'Data Structures',
            points: '100'
        },
        'graphalgo': {
            title: 'Graph Algorithms Project',
            class: 'Algorithms',
            points: '100'
        },
        'dbdesign': {
            title: 'Database Design Report',
            class: 'Database Systems',
            points: '100'
        }
    };
    
    return assignmentInfo[assignmentId] || { title: 'Unknown Assignment', class: '', points: '100' };
}

// Save student grade
function saveStudentGrade(studentId, grade, button) {
    // Validate grade
    if (grade < 0 || grade > 100) {
        showNotification('Grade must be between 0 and 100', 'error');
        return;
    }
    
    // In a real app, you would save this grade to the server
    console.log(`Saving grade ${grade} for student ${studentId}`);
    
    // Show saved message
    const originalText = button.textContent;
    button.textContent = 'Saved!';
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
    
    // Show notification
    showNotification('Grade saved successfully!', 'success');
}

// View student submission
function viewStudentSubmission(studentId) {
    // In a real app, you would open the submission
    console.log(`Viewing submission for student ${studentId}`);
    
    // Show notification
    showNotification(`Opening submission for student ${studentId}`, 'info');
}

// Open Compose Message Modal
function openComposeMessageModal(recipientType, recipientId) {
    const modal = document.getElementById('composeMessageModal');
    const recipientSelect = document.getElementById('messageRecipient');
    const studentSelectGroup = document.getElementById('studentSelectGroup');
    const classSelectGroup = document.getElementById('classSelectGroup');
    
    // Set recipient type
    recipientSelect.value = recipientType;
    
    // Show appropriate recipient selection
    studentSelectGroup.style.display = 'none';
    classSelectGroup.style.display = 'none';
    
    if (recipientType === 'student') {
        studentSelectGroup.style.display = 'block';
        document.getElementById('messageStudent').value = recipientId;
    } else if (recipientType === 'class') {
        classSelectGroup.style.display = 'block';
        document.getElementById('messageClass').value = recipientId;
    }
    
    modal.style.display = 'block';
}

// Show class details
function showClassDetails(classId) {
    const classInfo = getClassInfo(classId);
    
    // In a real app, you would navigate to class details page
    console.log('Showing class details:', classInfo);
    
    // Show notification
    showNotification(`Showing details for ${classInfo.name}`, 'info');
}

// Show assignment details
function showAssignmentDetails(assignmentId) {
    const assignmentInfo = getAssignmentInfo(assignmentId);
    
    // In a real app, you would navigate to assignment details page
    console.log('Showing assignment details:', assignmentInfo);
    
    // Show notification
    showNotification(`Showing details for ${assignmentInfo.title}`, 'info');
}

// Edit assignment
function editAssignment(assignmentId) {
    const assignmentInfo = getAssignmentInfo(assignmentId);
    
    // In a real app, you would open edit assignment form
    console.log('Editing assignment:', assignmentInfo);
    
    // Show notification
    showNotification(`Editing ${assignmentInfo.title}`, 'info');
}

// Show student details
function showStudentDetails(studentId) {
    // In a real app, you would navigate to student details page
    console.log('Showing student details:', studentId);
    
    // Show notification
    showNotification(`Showing details for student ${studentId}`, 'info');
}

// Download resource
function downloadResource(resourceId) {
    // In a real app, you would download the resource
    console.log('Downloading resource:', resourceId);
    
    // Show notification
    showNotification(`Downloading resource ${resourceId}`, 'info');
}

// Share resource
function shareResource(resourceId) {
    // In a real app, you would open share dialog
    console.log('Sharing resource:', resourceId);
    
    // Show notification
    showNotification(`Sharing resource ${resourceId}`, 'info');
}

// Open resource link
function openResourceLink(resourceId) {
    // In a real app, you would open the link
    console.log('Opening resource link:', resourceId);
    
    // Show notification
    showNotification(`Opening link for resource ${resourceId}`, 'info');
}

// Edit student grade
function editStudentGrade(studentId) {
    // In a real app, you would open edit grade form
    console.log('Editing grade for student:', studentId);
    
    // Show notification
    showNotification(`Editing grade for student ${studentId}`, 'info');
}

// Show message details
function showMessageDetails(messageId) {
    // In a real app, you would open message details
    console.log('Showing message details:', messageId);
    
    // Show notification
    showNotification(`Showing message ${messageId}`, 'info');
}

// Edit message
function editMessage(messageId) {
    // In a real app, you would open edit message form
    console.log('Editing message:', messageId);
    
    // Show notification
    showNotification(`Editing message ${messageId}`, 'info');
}

// Setup notification system
function setupNotifications() {
    // Already handled in setupInteractiveElements
}

// Update notification badge
function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Create icon
    const icon = document.createElement('div');
    icon.className = 'notification-icon';
    
    // Set icon based on type
    if (type === 'success') {
        icon.innerHTML = '<i class="fas fa-check-circle"></i>';
    } else if (type === 'error') {
        icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
    } else if (type === 'warning') {
        icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
    } else {
        icon.innerHTML = '<i class="fas fa-info-circle"></i>';
    }
    
    // Create content
    const content = document.createElement('div');
    content.className = 'notification-content';
    
    // Create message
    const messageElement = document.createElement('p');
    messageElement.className = 'notification-message';
    messageElement.textContent = message;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.addEventListener('click', function() {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Assemble notification
    content.appendChild(messageElement);
    notification.appendChild(icon);
    notification.appendChild(content);
    notification.appendChild(closeBtn);
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Get class name from class ID
function getClassName(classId) {
    const classNames = {
        'ds201': 'Data Structures',
        'algo301': 'Algorithms',
        'db301': 'Database Systems',
        'se401': 'Software Engineering'
    };
    
    return classNames[classId] || classId;
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
    fetch('http://localhost:5001/api/classes', {
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

// Update classes list in UI
function updateClassesList(classes) {
    // Update classes section
    const classesSection = document.getElementById('classes');
    if (classesSection) {
        const classList = classesSection.querySelector('.class-list');
        if (classList) {
            classList.innerHTML = '';
            
            classes.forEach(cls => {
                const classItem = document.createElement('li');
                classItem.className = 'class-item';
                
                classItem.innerHTML = `
                    <div class="class-details">
                        <div class="class-name">${cls.name}</div>
                        <div class="class-info">
                            <i class="fas fa-code"></i> ${cls.code || 'N/A'}
                            <i class="fas fa-users ml-3"></i> ${cls.students ? cls.students.length : 0} students
                            <i class="fas fa-clock ml-3"></i> ${cls.schedule ? `${cls.schedule.days.join(', ')} - ${cls.schedule.startTime}` : 'Schedule not set'}
                        </div>
                    </div>
                    <div class="class-action">
                        <a href="#" class="btn btn-primary btn-sm manage-class" data-class-id="${cls._id}">Manage</a>
                    </div>
                `;
                
                classList.appendChild(classItem);
            });
            
            // Reattach event listeners
            setupInteractiveElements();
        }
    }
    
    // Update overview section
    const overviewSection = document.getElementById('overview');
    if (overviewSection) {
        const classList = overviewSection.querySelector('.class-list');
        if (classList) {
            classList.innerHTML = '';
            
            // Show up to 3 upcoming classes
            const upcomingClasses = classes.slice(0, 3);
            
            upcomingClasses.forEach(cls => {
                const classItem = document.createElement('li');
                classItem.className = 'class-item';
                
                classItem.innerHTML = `
                    <div class="class-time">
                        <div class="time">${cls.schedule ? cls.schedule.startTime : 'N/A'}</div>
                        <div class="ampm">${cls.schedule && cls.schedule.startTime ? (cls.schedule.startTime.includes('PM') ? 'PM' : 'AM') : 'N/A'}</div>
                    </div>
                    <div class="class-details">
                        <div class="class-name">${cls.name}</div>
                        <div class="class-info">
                            <i class="fas fa-map-marker-alt"></i> ${cls.schedule ? cls.schedule.location : 'N/A'}
                            <i class="fas fa-users ml-3"></i> ${cls.students ? cls.students.length : 0} students
                        </div>
                    </div>
                    <div class="class-action">
                        <a href="#" class="btn btn-primary btn-sm start-class" data-class-id="${cls._id}">Start Class</a>
                    </div>
                `;
                
                classList.appendChild(classItem);
            });
            
            // Reattach event listeners
            setupInteractiveElements();
        }
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
    fetch('http://localhost:5001/api/assignments', {
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

// Update assignments list in UI
function updateAssignmentsList(assignments) {
    // Update assignments section
    const assignmentsSection = document.getElementById('assignments');
    if (assignmentsSection) {
        const pendingList = assignmentsSection.querySelector('#pending .assignment-list');
        const publishedList = assignmentsSection.querySelector('#published .assignment-list');
        const draftsList = assignmentsSection.querySelector('#drafts .assignment-list');
        
        if (pendingList) {
            pendingList.innerHTML = '';
            
            // Filter assignments by status
            const pendingAssignments = assignments.filter(a => a.status === 'published' && new Date(a.dueDate) > new Date());
            
            pendingAssignments.forEach(assignment => {
                const assignmentItem = document.createElement('li');
                assignmentItem.className = 'assignment-item';
                
                assignmentItem.innerHTML = `
                    <div class="assignment-icon">
                        <i class="fas fa-file-code"></i>
                    </div>
                    <div class="assignment-details">
                        <div class="assignment-title">${assignment.title}</div>
                        <div class="assignment-meta">
                            <i class="fas fa-book"></i> ${assignment.class ? assignment.class.name : 'N/A'}
                            <i class="fas fa-users ml-3"></i> ${assignment.submissions ? assignment.submissions.length : 0} submissions
                            <i class="fas fa-calendar ml-3"></i> Due: ${new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="assignment-action">
                        <a href="#" class="btn btn-primary btn-sm grade-assignment" data-assignment-id="${assignment._id}">Grade</a>
                    </div>
                `;
                
                pendingList.appendChild(assignmentItem);
            });
        }
        
        if (publishedList) {
            publishedList.innerHTML = '';
            
            // Filter assignments by status
            const publishedAssignments = assignments.filter(a => a.status === 'published');
            
            publishedAssignments.forEach(assignment => {
                const assignmentItem = document.createElement('li');
                assignmentItem.className = 'assignment-item';
                
                assignmentItem.innerHTML = `
                    <div class="assignment-icon">
                        <i class="fas fa-file-code"></i>
                    </div>
                    <div class="assignment-details">
                        <div class="assignment-title">${assignment.title}</div>
                        <div class="assignment-meta">
                            <i class="fas fa-book"></i> ${assignment.class ? assignment.class.name : 'N/A'}
                            <i class="fas fa-users ml-3"></i> ${assignment.submissions ? assignment.submissions.length : 0} students
                            <i class="fas fa-calendar ml-3"></i> Due: ${new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="assignment-action">
                        <a href="#" class="btn btn-outline btn-sm view-assignment" data-assignment-id="${assignment._id}">View</a>
                    </div>
                `;
                
                publishedList.appendChild(assignmentItem);
            });
        }
        
        if (draftsList) {
            draftsList.innerHTML = '';
            
            // Filter assignments by status
            const draftAssignments = assignments.filter(a => a.status === 'draft');
            
            draftAssignments.forEach(assignment => {
                const assignmentItem = document.createElement('li');
                assignmentItem.className = 'assignment-item';
                
                assignmentItem.innerHTML = `
                    <div class="assignment-icon">
                        <i class="fas fa-file-code"></i>
                    </div>
                    <div class="assignment-details">
                        <div class="assignment-title">${assignment.title}</div>
                        <div class="assignment-meta">
                            <i class="fas fa-book"></i> ${assignment.class ? assignment.class.name : 'N/A'}
                            <i class="fas fa-clock ml-3"></i> Last edited: ${new Date(assignment.updatedAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="assignment-action">
                        <a href="#" class="btn btn-primary btn-sm edit-assignment" data-assignment-id="${assignment._id}">Edit</a>
                    </div>
                `;
                
                draftsList.appendChild(assignmentItem);
            });
        }
        
        // Reattach event listeners
        setupInteractiveElements();
    }
}

// Fetch students data from backend
function fetchStudentsData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Fetch students data from backend
    fetch('http://localhost:5001/api/users?role=student', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store students data in localStorage
            localStorage.setItem('studentsData', JSON.stringify(data.data));
            
            // Update students list in UI
            updateStudentsList(data.data.users);
        } else {
            console.error('Failed to fetch students data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching students data:', error);
    });
}

// Update students list in UI
function updateStudentsList(students) {
    // Update students section
    const studentsSection = document.getElementById('students');
    if (studentsSection) {
        const studentTableBody = studentsSection.querySelector('tbody');
        if (studentTableBody) {
            studentTableBody.innerHTML = '';
            
            students.forEach(student => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${student.studentId || 'N/A'}</td>
                    <td>${student.name}</td>
                    <td>${student.department || 'N/A'}</td>
                    <td>${student.email}</td>
                    <td>0%</td>
                    <td><span class="badge badge-secondary">Not Available</span></td>
                    <td>
                        <a href="#" class="btn btn-sm btn-outline view-student" data-student-id="${student._id}">View</a>
                        <a href="#" class="btn btn-sm btn-outline message-student" data-student-id="${student._id}">Message</a>
                    </td>
                `;
                
                studentTableBody.appendChild(row);
            });
            
            // Reattach event listeners
            setupInteractiveElements();
        }
    }
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
    fetch('http://localhost:5001/api/resources', {
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

// Update resources list in UI
function updateResourcesList(resources) {
    // Update resources section
    const resourcesSection = document.getElementById('resources');
    if (resourcesSection) {
        const resourceGrid = resourcesSection.querySelector('.resource-grid');
        if (resourceGrid) {
            resourceGrid.innerHTML = '';
            
            resources.forEach(resource => {
                const resourceCard = document.createElement('div');
                resourceCard.className = 'resource-card';
                
                // Get resource icon based on type
                let iconClass = 'fa-file';
                if (resource.fileType) {
                    if (resource.fileType.includes('pdf')) {
                        iconClass = 'fa-file-pdf';
                    } else if (resource.fileType.includes('video')) {
                        iconClass = 'fa-file-video';
                    } else if (resource.fileType.includes('powerpoint') || resource.fileType.includes('presentation')) {
                        iconClass = 'fa-file-powerpoint';
                    } else if (resource.fileType.includes('zip') || resource.fileType.includes('archive')) {
                        iconClass = 'fa-file-archive';
                    } else if (resource.fileType.includes('image')) {
                        iconClass = 'fa-file-image';
                    }
                }
                
                resourceCard.innerHTML = `
                    <div class="resource-icon">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="resource-body">
                        <h3 class="resource-title">${resource.title}</h3>
                        <p class="resource-meta">${resource.teacher ? resource.teacher.name : 'N/A'} • ${resource.fileType ? resource.fileType.toUpperCase() : 'FILE'} • ${resource.fileSize ? (resource.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</p>
                        <div class="resource-actions">
                            <a href="#" class="btn btn-primary btn-sm download-resource" data-resource-id="${resource._id}">Download</a>
                            <a href="#" class="btn btn-outline btn-sm share-resource" data-resource-id="${resource._id}">Share</a>
                        </div>
                    </div>
                `;
                
                resourceGrid.appendChild(resourceCard);
            });
            
            // Reattach event listeners
            setupInteractiveElements();
        }
    }
}

// Fetch attendance data from backend
function fetchAttendanceData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Fetch attendance data from backend
    fetch('http://localhost:5001/api/attendance', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store attendance data in localStorage
            localStorage.setItem('attendanceData', JSON.stringify(data.data));
            
            // Update attendance list in UI
            updateAttendanceList(data.data.attendance);
        } else {
            console.error('Failed to fetch attendance data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching attendance data:', error);
    });
}

// Update attendance list in UI
function updateAttendanceList(attendance) {
    // Update attendance section
    const attendanceSection = document.getElementById('attendance');
    if (attendanceSection) {
        const attendanceTableBody = attendanceSection.querySelector('#attendanceTableBody');
        if (attendanceTableBody) {
            attendanceTableBody.innerHTML = '';
            
            attendance.forEach(record => {
                const row = document.createElement('tr');
                
                // Calculate attendance rate
                const rate = record.held > 0 ? Math.round((record.attended / record.held) * 100) : 0;
                
                // Determine status badge class
                let statusClass = 'badge-secondary';
                if (rate >= 90) {
                    statusClass = 'badge-success';
                } else if (rate >= 80) {
                    statusClass = 'badge-warning';
                } else {
                    statusClass = 'badge-danger';
                }
                
                row.innerHTML = `
                    <td>${record.student ? record.student.studentId : 'N/A'}</td>
                    <td>${record.student ? record.student.name : 'N/A'}</td>
                    <td><span class="badge ${statusClass}">${record.status || 'Present'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline mark-present" data-student-id="${record.student ? record.student._id : ''}">Mark Present</button>
                        <button class="btn btn-sm btn-outline mark-absent" data-student-id="${record.student ? record.student._id : ''}">Mark Absent</button>
                    </td>
                `;
                
                attendanceTableBody.appendChild(row);
            });
            
            // Reattach event listeners
            setupInteractiveElements();
        }
        
        // Update attendance summary
        const summaryCards = attendanceSection.querySelectorAll('.summary-card');
        if (summaryCards.length >= 4) {
            // Calculate overall attendance
            let totalStudents = attendance.length;
            let presentCount = attendance.filter(record => record.status === 'Present').length;
            
            const overallRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
            
            summaryCards[0].querySelector('.summary-value').textContent = totalStudents;
            summaryCards[1].querySelector('.summary-value').textContent = presentCount;
            summaryCards[2].querySelector('.summary-value').textContent = totalStudents - presentCount;
            summaryCards[3].querySelector('.summary-value').textContent = overallRate + '%';
        }
    }
}

// Fetch grades data from backend
function fetchGradesData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Fetch grades data from backend
    fetch('http://localhost:5001/api/grades', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store grades data in localStorage
            localStorage.setItem('gradesData', JSON.stringify(data.data));
            
            // Update grades list in UI
            updateGradesList(data.data.grades);
        } else {
            console.error('Failed to fetch grades data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching grades data:', error);
    });
}

// Update grades list in UI
function updateGradesList(grades) {
    // Update grades section
    const gradesSection = document.getElementById('grades');
    if (gradesSection) {
        const gradesTableBody = gradesSection.querySelector('#gradesTableBody');
        if (gradesTableBody) {
            gradesTableBody.innerHTML = '';
            
            grades.forEach(grade => {
                const row = document.createElement('tr');
                
                // Determine grade badge class
                let gradeClass = 'badge-secondary';
                if (grade.overallGrade) {
                    if (['A+', 'A', 'A-'].includes(grade.overallGrade)) {
                        gradeClass = 'badge-success';
                    } else if (['B+', 'B', 'B-'].includes(grade.overallGrade)) {
                        gradeClass = 'badge-primary';
                    } else if (['C+', 'C', 'C-'].includes(grade.overallGrade)) {
                        gradeClass = 'badge-warning';
                    } else {
                        gradeClass = 'badge-danger';
                    }
                }
                
                row.innerHTML = `
                    <td>${grade.student ? grade.student.studentId : 'N/A'}</td>
                    <td>${grade.student ? grade.student.name : 'N/A'}</td>
                    <td>${grade.assignments || 'N/A'}</td>
                    <td>${grade.midterm || 'N/A'}</td>
                    <td>${grade.final || 'N/A'}</td>
                    <td><span class="badge ${gradeClass}">${grade.overallGrade || 'N/A'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline edit-grade" data-student-id="${grade.student ? grade.student._id : ''}">Edit</button>
                    </td>
                `;
                
                gradesTableBody.appendChild(row);
            });
            
            // Reattach event listeners
            setupInteractiveElements();
        }
        
        // Update grade summary
        const summaryCards = gradesSection.querySelectorAll('.summary-card');
        if (summaryCards.length >= 4) {
            // Calculate overall statistics
            let totalGrades = grades.length;
            let gradeSum = 0;
            let highestGrade = 0;
            let lowestGrade = 100;
            let submittedGrades = 0;
            
            grades.forEach(grade => {
                if (grade.overallGrade) {
                    submittedGrades++;
                    // Convert grade to numeric value for calculation
                    let numericGrade = 0;
                    if (grade.overallGrade === 'A+') numericGrade = 95;
                    else if (grade.overallGrade === 'A') numericGrade = 90;
                    else if (grade.overallGrade === 'A-') numericGrade = 85;
                    else if (grade.overallGrade === 'B+') numericGrade = 80;
                    else if (grade.overallGrade === 'B') numericGrade = 75;
                    else if (grade.overallGrade === 'B-') numericGrade = 70;
                    else if (grade.overallGrade === 'C+') numericGrade = 65;
                    else if (grade.overallGrade === 'C') numericGrade = 60;
                    else if (grade.overallGrade === 'C-') numericGrade = 55;
                    else if (grade.overallGrade === 'D') numericGrade = 50;
                    else if (grade.overallGrade === 'F') numericGrade = 40;
                    
                    gradeSum += numericGrade;
                    if (numericGrade > highestGrade) highestGrade = numericGrade;
                    if (numericGrade < lowestGrade) lowestGrade = numericGrade;
                }
            });
            
            const averageGrade = submittedGrades > 0 ? Math.round(gradeSum / submittedGrades) : 0;
            const submissionRate = totalGrades > 0 ? Math.round((submittedGrades / totalGrades) * 100) : 0;
            
            // Convert average grade back to letter grade
            let averageLetterGrade = 'N/A';
            if (averageGrade >= 93) averageLetterGrade = 'A';
            else if (averageGrade >= 90) averageLetterGrade = 'A-';
            else if (averageGrade >= 87) averageLetterGrade = 'B+';
            else if (averageGrade >= 83) averageLetterGrade = 'B';
            else if (averageGrade >= 80) averageLetterGrade = 'B-';
            else if (averageGrade >= 77) averageLetterGrade = 'C+';
            else if (averageGrade >= 73) averageLetterGrade = 'C';
            else if (averageGrade >= 70) averageLetterGrade = 'C-';
            else if (averageGrade >= 67) averageLetterGrade = 'D+';
            else if (averageGrade >= 65) averageLetterGrade = 'D';
            else if (averageGrade < 65) averageLetterGrade = 'F';
            
            summaryCards[0].querySelector('.summary-value').textContent = averageLetterGrade;
            summaryCards[1].querySelector('.summary-value').textContent = highestGrade > 0 ? (highestGrade >= 93 ? 'A' : highestGrade >= 90 ? 'A-' : highestGrade >= 87 ? 'B+' : highestGrade >= 83 ? 'B' : highestGrade >= 80 ? 'B-' : highestGrade >= 77 ? 'C+' : highestGrade >= 73 ? 'C' : highestGrade >= 70 ? 'C-' : highestGrade >= 67 ? 'D+' : highestGrade >= 65 ? 'D' : 'F') : 'N/A';
            summaryCards[2].querySelector('.summary-value').textContent = lowestGrade < 100 ? (lowestGrade >= 93 ? 'A' : lowestGrade >= 90 ? 'A-' : lowestGrade >= 87 ? 'B+' : lowestGrade >= 83 ? 'B' : lowestGrade >= 80 ? 'B-' : lowestGrade >= 77 ? 'C+' : lowestGrade >= 73 ? 'C' : lowestGrade >= 70 ? 'C-' : lowestGrade >= 67 ? 'D+' : lowestGrade >= 65 ? 'D' : 'F') : 'N/A';
            summaryCards[3].querySelector('.summary-value').textContent = submissionRate + '%';
        }
    }
}

// Fetch messages data from backend
function fetchMessagesData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Fetch messages data from backend
    fetch('http://localhost:5001/api/messages', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store messages data in localStorage
            localStorage.setItem('messagesData', JSON.stringify(data.data));
            
            // Update messages list in UI
            updateMessagesList(data.data.messages);
        } else {
            console.error('Failed to fetch messages data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching messages data:', error);
    });
}

// Update messages list in UI
function updateMessagesList(messages) {
    // Update messages section
    const messagesSection = document.getElementById('messages');
    if (messagesSection) {
        const inboxList = messagesSection.querySelector('#inbox .message-list');
        const sentList = messagesSection.querySelector('#sent .message-list');
        const draftsList = messagesSection.querySelector('#drafts .message-list');
        
        if (inboxList) {
            inboxList.innerHTML = '';
            
            // Filter messages by type
            const inboxMessages = messages.filter(m => m.type === 'inbox' || !m.type);
            
            inboxMessages.forEach(message => {
                const messageItem = document.createElement('li');
                messageItem.className = `message-item ${message.read ? '' : 'unread'}`;
                
                messageItem.innerHTML = `
                    <div class="message-icon">
                        <i class="fas ${message.from && message.from.includes('Department') ? 'fa-bell' : 'fa-user'}"></i>
                    </div>
                    <div class="message-details">
                        <div class="message-title">${message.from || 'Unknown Sender'} - ${message.subject || 'No Subject'}</div>
                        <div class="message-meta">
                            <i class="fas fa-envelope"></i> Received on ${message.createdAt ? new Date(message.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div class="message-preview">
                            ${message.content ? message.content.substring(0, 100) + '...' : 'No content'}
                        </div>
                    </div>
                    <div class="message-actions">
                        <a href="#" class="btn btn-sm btn-outline view-message" data-message-id="${message._id}">View</a>
                    </div>
                `;
                
                inboxList.appendChild(messageItem);
            });
        }
        
        if (sentList) {
            sentList.innerHTML = '';
            
            // Filter messages by type
            const sentMessages = messages.filter(m => m.type === 'sent');
            
            sentMessages.forEach(message => {
                const messageItem = document.createElement('li');
                messageItem.className = 'message-item';
                
                messageItem.innerHTML = `
                    <div class="message-icon">
                        <i class="fas fa-paper-plane"></i>
                    </div>
                    <div class="message-details">
                        <div class="message-title">To: ${message.to || 'Unknown Recipient'} - ${message.subject || 'No Subject'}</div>
                        <div class="message-meta">
                            <i class="fas fa-envelope"></i> Sent on ${message.createdAt ? new Date(message.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div class="message-preview">
                            ${message.content ? message.content.substring(0, 100) + '...' : 'No content'}
                        </div>
                    </div>
                    <div class="message-actions">
                        <a href="#" class="btn btn-sm btn-outline view-message" data-message-id="${message._id}">View</a>
                    </div>
                `;
                
                sentList.appendChild(messageItem);
            });
        }
        
        if (draftsList) {
            draftsList.innerHTML = '';
            
            // Filter messages by type
            const draftMessages = messages.filter(m => m.type === 'draft');
            
            draftMessages.forEach(message => {
                const messageItem = document.createElement('li');
                messageItem.className = 'message-item';
                
                messageItem.innerHTML = `
                    <div class="message-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="message-details">
                        <div class="message-title">To: ${message.to || 'Unknown Recipient'} - ${message.subject || 'No Subject'}</div>
                        <div class="message-meta">
                            <i class="fas fa-edit"></i> Last edited on ${message.updatedAt ? new Date(message.updatedAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div class="message-preview">
                            ${message.content ? message.content.substring(0, 100) + '...' : 'No content'}
                        </div>
                    </div>
                    <div class="message-actions">
                        <a href="#" class="btn btn-sm btn-outline view-message" data-message-id="${message._id}">Edit</a>
                    </div>
                `;
                
                draftsList.appendChild(messageItem);
            });
        }
        
        // Reattach event listeners
        setupInteractiveElements();
        
        // Update notification badge
        updateNotificationBadge();
    }
}

// Refresh functions (for demo purposes)
function refreshClassesList() {
    console.log('Refreshing classes list');
    // In a real app, you would fetch updated classes data
}

function refreshAssignmentsList() {
    console.log('Refreshing assignments list');
    // In a real app, you would fetch updated assignments data
}

function refreshResourcesList() {
    console.log('Refreshing resources list');
    // In a real app, you would fetch updated resources data
}

function refreshMessagesList() {
    console.log('Refreshing messages list');
    // In a real app, you would fetch updated messages data
}

function refreshCalendar() {
    console.log('Refreshing calendar');
    // In a real app, you would fetch updated calendar data
    updateCalendarDisplay(new Date());
}

// Setup Class Details Modal
function setupClassDetailsModal() {
    const modal = document.getElementById('classDetailsModal');
    const closeBtn = modal.querySelector('.close');
    
    // Close modal when clicking the close button
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Setup tabs
    const tabBtns = modal.querySelectorAll('.class-tabs .tab-btn');
    const tabContents = modal.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Setup student actions
    modal.querySelectorAll('.view-student-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentCard = this.closest('.student-card');
            const studentName = studentCard.querySelector('.student-name').textContent;
            const studentId = studentCard.querySelector('.student-id').textContent;
            
            // Open student details modal
            openStudentDetailsModal(studentId, studentName);
        });
    });
    
    modal.querySelectorAll('.message-student-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentCard = this.closest('.student-card');
            const studentId = studentCard.querySelector('.student-id').textContent;
            
            // Open compose message modal
            openComposeMessageModal('student', studentId);
        });
    });
    
    // Setup resource actions
    modal.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const resourceCard = this.closest('.resource-card');
            const resourceTitle = resourceCard.querySelector('.resource-title').textContent;
            
            // Download resource
            showNotification(`Downloading ${resourceTitle}`, 'info');
        });
    });
    
    modal.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const resourceCard = this.closest('.resource-card');
            const resourceTitle = resourceCard.querySelector('.resource-title').textContent;
            
            // Share resource
            showNotification(`Sharing ${resourceTitle}`, 'info');
        });
    });
    
    // Setup add resource button
    modal.querySelector('.add-resource-btn').addEventListener('click', function() {
        // Open upload resource modal
        document.getElementById('uploadResourceModal').style.display = 'block';
    });
}

// Open Class Details Modal
function openClassDetailsModal(classId) {
    const modal = document.getElementById('classDetailsModal');
    const classInfo = getClassInfo(classId);
    
    // Set class information
    document.getElementById('detailClassName').textContent = classInfo.name;
    document.getElementById('detailClassCode').textContent = classInfo.code;
    document.getElementById('detailClassSchedule').textContent = classInfo.schedule;
    document.getElementById('detailClassLocation').textContent = 'Room 205';
    document.getElementById('detailClassStudents').textContent = '45 students';
    document.getElementById('detailClassDescription').textContent = 'This course covers fundamental data structures including arrays, linked lists, stacks, queues, trees, and graphs. Students will learn to implement these structures and analyze their efficiency.';
    
    // Show modal
    modal.style.display = 'block';
}

// Setup Student Details Modal
function setupStudentDetailsModal() {
    const modal = document.getElementById('studentDetailsModal');
    const closeBtn = modal.querySelector('.close');
    
    // Close modal when clicking the close button
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Setup tabs
    const tabBtns = modal.querySelectorAll('.student-tabs .tab-btn');
    const tabContents = modal.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Setup message student button
    modal.querySelector('.message-student-btn').addEventListener('click', function() {
        const studentId = document.getElementById('studentDetailId').textContent;
        
        // Open compose message modal
        openComposeMessageModal('student', studentId);
    });
}

// Open Student Details Modal
function openStudentDetailsModal(studentId, studentName) {
    const modal = document.getElementById('studentDetailsModal');
    
    // Get student information
    const studentInfo = getStudentInfo(studentId);
    
    // Set student information
    document.getElementById('studentDetailName').textContent = studentInfo.name || studentName || 'Unknown Student';
    document.getElementById('studentDetailId').textContent = studentId;
    document.getElementById('studentDetailEmail').textContent = studentInfo.email || 'student@college.edu';
    
    // Show modal
    modal.style.display = 'block';
}

// Get student information by ID
function getStudentInfo(studentId) {
    const studentInfo = {
        'CS2021001': {
            name: 'Anurag Ray',
            email: 'anurag.ray@college.edu'
        },
        'CS2021002': {
            name: 'Priya Sharma',
            email: 'priya.sharma@college.edu'
        },
        'CS2021003': {
            name: 'Rahul Verma',
            email: 'rahul.verma@college.edu'
        },
        'CS2021004': {
            name: 'Ananya Patel',
            email: 'ananya.patel@college.edu'
        },
        'CS2021005': {
            name: 'Vikram Singh',
            email: 'vikram.singh@college.edu'
        }
    };
    
    return studentInfo[studentId] || { name: 'Unknown Student', email: 'student@college.edu' };
}

// Setup Assignment Details Modal
function setupAssignmentDetailsModal() {
    const modal = document.getElementById('assignmentDetailsModal');
    const closeBtn = modal.querySelector('.close');
    
    // Close modal when clicking the close button
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Setup edit assignment button
    modal.querySelector('.edit-assignment-btn').addEventListener('click', function() {
        const assignmentId = modal.getAttribute('data-assignment-id');
        
        // Edit assignment
        showNotification('Editing assignment', 'info');
    });
    
    // Setup submission actions
    modal.querySelectorAll('.view-submission-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const submissionCard = this.closest('.submission-card');
            const studentName = submissionCard.querySelector('.student-name').textContent;
            
            // View submission
            showNotification(`Viewing submission by ${studentName}`, 'info');
        });
    });
    
    modal.querySelectorAll('.grade-submission-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const submissionCard = this.closest('.submission-card');
            const studentName = submissionCard.querySelector('.student-name').textContent;
            
            // Grade submission
            showNotification(`Grading submission by ${studentName}`, 'info');
        });
    });
    
    modal.querySelectorAll('.remind-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const submissionCard = this.closest('.submission-card');
            const studentName = submissionCard.querySelector('.student-name').textContent;
            
            // Remind student
            showNotification(`Reminder sent to ${studentName}`, 'success');
        });
    });
}

// Open Assignment Details Modal
function openAssignmentDetailsModal(assignmentId) {
    const modal = document.getElementById('assignmentDetailsModal');
    const assignmentInfo = getAssignmentInfo(assignmentId);
    
    // Set assignment information
    document.getElementById('assignmentDetailTitle').textContent = assignmentInfo.title;
    document.getElementById('assignmentDetailClass').textContent = assignmentInfo.class;
    document.getElementById('assignmentDetailDue').textContent = 'Due: Oct 5, 2025';
    document.getElementById('assignmentDetailPoints').textContent = '100 points';
    document.getElementById('assignmentDetailDescription').textContent = 'Implement a binary tree data structure with insertion, deletion, and traversal operations. Your implementation should include both recursive and iterative approaches for tree traversals.';
    
    // Store assignment ID for reference
    modal.setAttribute('data-assignment-id', assignmentId);
    
    // Show modal
    modal.style.display = 'block';
}

// Setup Edit Grade Modal
function setupEditGradeModal() {
    const modal = document.getElementById('editGradeModal');
    const closeBtn = modal.querySelector('.close');
    
    // Close modal when clicking the close button
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Setup save grade button
    document.getElementById('saveGradeBtn').addEventListener('click', function() {
        const studentId = modal.getAttribute('data-student-id');
        const assignmentGrade = document.getElementById('assignmentGrade').value;
        const midtermGrade = document.getElementById('midtermGrade').value;
        const finalGrade = document.getElementById('finalGrade').value;
        const overallGrade = document.getElementById('overallGrade').value;
        const comments = document.getElementById('gradeComments').value;
        
        // Validate grades
        if ((assignmentGrade && (assignmentGrade < 0 || assignmentGrade > 100)) ||
            (midtermGrade && (midtermGrade < 0 || midtermGrade > 100)) ||
            (finalGrade && (finalGrade < 0 || finalGrade > 100))) {
            showNotification('Grades must be between 0 and 100', 'error');
            return;
        }
        
        // Simulate API call
        console.log('Saving grades:', {
            studentId,
            assignmentGrade,
            midtermGrade,
            finalGrade,
            overallGrade,
            comments
        });
        
        // Show success message
        showNotification('Grades saved successfully!', 'success');
        
        // Close modal
        modal.style.display = 'none';
        
        // In a real app, you would refresh the grades table
    });
    
    // Setup cancel button
    document.getElementById('cancelGradeBtn').addEventListener('click', function() {
        modal.style.display = 'none';
    });
}

// Open Edit Grade Modal
function openEditGradeModal(studentId) {
    const modal = document.getElementById('editGradeModal');
    const studentInfo = getStudentInfo(studentId);
    
    // Set student information
    document.getElementById('editGradeStudentName').textContent = studentInfo.name;
    document.getElementById('editGradeStudentId').textContent = studentId;
    document.getElementById('editGradeStudentClass').textContent = 'Data Structures';
    
    // Clear form
    document.getElementById('assignmentGrade').value = '';
    document.getElementById('midtermGrade').value = '';
    document.getElementById('finalGrade').value = '';
    document.getElementById('overallGrade').value = '';
    document.getElementById('gradeComments').value = '';
    
    // Store student ID for reference
    modal.setAttribute('data-student-id', studentId);
    
    // Show modal
    modal.style.display = 'block';
}

// Setup View Message Modal
function setupViewMessageModal() {
    const modal = document.getElementById('viewMessageModal');
    const closeBtn = modal.querySelector('.close');
    
    // Close modal when clicking the close button
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Setup reply button
    document.getElementById('replyMessageBtn').addEventListener('click', function() {
        const messageId = modal.getAttribute('data-message-id');
        
        // Open compose message modal
        openComposeMessageModal('student', 'cs2021001');
        
        // Close current modal
        modal.style.display = 'none';
    });
    
    // Setup forward button
    document.getElementById('forwardMessageBtn').addEventListener('click', function() {
        const messageId = modal.getAttribute('data-message-id');
        
        // Open compose message modal
        openComposeMessageModal('student', 'cs2021002');
        
        // Close current modal
        modal.style.display = 'none';
    });
    
    // Setup delete button
    document.getElementById('deleteMessageBtn').addEventListener('click', function() {
        const messageId = modal.getAttribute('data-message-id');
        
        // Confirm deletion
        if (confirm('Are you sure you want to delete this message?')) {
            // Simulate API call
            console.log('Deleting message:', messageId);
            
            // Show success message
            showNotification('Message deleted successfully!', 'success');
            
            // Close modal
            modal.style.display = 'none';
            
            // In a real app, you would refresh the messages list
        }
    });
}

// Open View Message Modal
function openViewMessageModal(messageId) {
    const modal = document.getElementById('viewMessageModal');
    
    // Get message information
    const messageInfo = getMessageInfo(messageId);
    
    // Set message information
    document.getElementById('messageSender').textContent = messageInfo.sender;
    document.getElementById('messageDate').textContent = messageInfo.date;
    document.getElementById('messageSubject').textContent = messageInfo.subject;
    document.getElementById('messageContent').textContent = messageInfo.content;
    
    // Store message ID for reference
    modal.setAttribute('data-message-id', messageId);
    
    // Show modal
    modal.style.display = 'block';
}

// Get message information by ID
function getMessageInfo(messageId) {
    const messageInfo = {
        'msg1': {
            sender: 'Anurag Ray',
            date: 'Oct 3, 2025 - 2:30 PM',
            subject: 'Assignment Submission',
            content: 'I have submitted my Binary Trees assignment. Please let me know if you need any changes or if there are any issues with my submission. Thank you!'
        },
        'msg2': {
            sender: 'Dr. Suresh Kumar',
            date: 'Oct 2, 2025 - 10:15 AM',
            subject: 'Department Meeting',
            content: 'Please attend the department meeting scheduled for tomorrow at 10 AM in Conference Room A. We will be discussing the upcoming curriculum changes and faculty evaluations.'
        },
        'msg3': {
            sender: 'Priya Sharma',
            date: 'Oct 1, 2025 - 4:45 PM',
            subject: 'Doubt Clarification',
            content: 'I have a doubt regarding the Graph Algorithms lecture. Can you please clarify the difference between BFS and DFS? I\'m having trouble understanding when to use each algorithm.'
        },
        'msg4': {
            sender: 'To: Data Structures Class',
            date: 'Sep 30, 2025 - 9:00 AM',
            subject: 'Assignment Reminder',
            content: 'Reminder: Binary Trees assignment is due on October 5. Please submit your work before the deadline. Late submissions will be penalized as per the course policy.'
        },
        'msg5': {
            sender: 'To: Algorithms Class',
            date: 'Sep 29, 2025 - 3:30 PM',
            subject: 'Project Presentation',
            content: 'Draft message about the upcoming project presentation. Need to finalize the schedule and requirements for the project presentations next week.'
        }
    };
    
    return messageInfo[messageId] || { 
        sender: 'Unknown Sender',
        date: 'Unknown Date',
        subject: 'Unknown Subject',
        content: 'Message content not available.'
    };
}