// Student data - now will be populated dynamically from API
let studentData = {
    name: "",
    id: "",
    department: "",
    classes: [],
    assignments: {
        pending: [],
        completed: []
    },
    resources: [],
    attendance: [],
    grades: [],
    messages: [],
    achievements: [],
    announcements: [],
    notifications: []
};

// Memory management variables
let eventListeners = [];
let notificationInterval = null;

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load data from localStorage if available
    loadStudentDataFromStorage();
    
    // Fetch all student data from backend
    fetchAllStudentData();
    
    // Initialize all event listeners
    initializeEventListeners();
    
    // Initialize calendar
    initializeCalendar();
    
    // Update notification badge
    updateNotificationBadge();
    
    // Initialize upcoming classes
    updateUpcomingClasses();
    
    // Initialize announcements
    updateAnnouncements();
    
    // Initialize resources
    updateResources();
    
    // Initialize messages
    updateMessages();
    
    // Initialize assignments
    updateAssignments();
    
    // Initialize notifications
    updateNotifications();
    
    // Simulate real-time updates with memory-efficient interval
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
    notificationInterval = setInterval(simulateRealTimeUpdates, 60000); // Check for updates every minute
});

// Fetch all student data from backend API
function fetchAllStudentData() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Fetch current user data
    fetch('http://localhost:5001/api/auth/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update student profile data
            studentData.name = data.data.name;
            studentData.id = data.data.studentId || data.data._id;
            studentData.department = data.data.department || 'Not specified';
            
            // Update UI with student name
            const studentNameElements = document.querySelectorAll('.student-name');
            studentNameElements.forEach(el => {
                if (el.tagName === 'INPUT') {
                    el.value = studentData.name;
                } else {
                    el.textContent = studentData.name;
                }
            });
            
            // Update student ID
            const studentIdElements = document.querySelectorAll('.student-id');
            studentIdElements.forEach(el => {
                el.textContent = studentData.id;
            });
            
            // Update department
            const departmentElements = document.querySelectorAll('.student-department');
            departmentElements.forEach(el => {
                el.textContent = studentData.department;
            });
        } else {
            console.error('Failed to fetch user data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
    });
    
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
            // Transform classes data to match frontend format
            studentData.classes = data.data.classes.map(cls => ({
                id: cls._id,
                name: cls.name,
                instructor: cls.teacher ? cls.teacher.name : 'Unknown',
                schedule: cls.schedule ? `${cls.schedule.days.join(', ')} - ${cls.schedule.startTime}` : 'Not scheduled',
                room: cls.schedule ? cls.schedule.location : 'Not specified',
                type: 'offline' // Default type
            }));
            
            // Update classes UI
            updateStudentClassesList(studentData.classes);
            updateUpcomingClasses();
        } else {
            console.error('Failed to fetch classes data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching classes data:', error);
    });
    
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
            // For now, we'll put all assignments in pending
            // In a real implementation, we would separate based on submission status
            studentData.assignments.pending = data.data.assignments.map(assignment => ({
                id: assignment._id,
                title: assignment.title,
                course: assignment.class ? assignment.class.name : 'Unknown Class',
                instructor: assignment.teacher ? assignment.teacher.name : 'Unknown',
                deadline: new Date(assignment.dueDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                }),
                time: new Date(assignment.dueDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                description: assignment.description,
                submitted: false // Default to not submitted
            }));
            
            // Update assignments UI
            updateAssignments();
        } else {
            console.error('Failed to fetch assignments data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching assignments data:', error);
    });
    
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
            // Transform resources data to match frontend format
            studentData.resources = data.data.resources.map(resource => ({
                id: resource._id,
                title: resource.title,
                instructor: resource.teacher ? resource.teacher.name : 'Unknown',
                type: resource.fileType || 'PDF',
                size: resource.fileSize ? `${(resource.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
                downloaded: false // Default to not downloaded
            }));
            
            // Update resources UI
            updateResources();
        } else {
            console.error('Failed to fetch resources data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching resources data:', error);
    });
    
    // Fetch attendance data from backend
    fetch('http://localhost:5001/api/attendance/summary/student', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Transform attendance data to match frontend format
            // This is a simplified version - in a real implementation, we would have more detailed data
            studentData.attendance = [{
                course: 'Overall Attendance',
                instructor: 'All Classes',
                held: data.data.totalClasses || 0,
                attended: data.data.present || 0,
                rate: data.data.attendanceRate ? `${data.data.attendanceRate}%` : '0%',
                status: data.data.attendanceRate >= 90 ? 'Excellent' : 
                       data.data.attendanceRate >= 80 ? 'Good' : 
                       data.data.attendanceRate >= 70 ? 'Satisfactory' : 'Needs Improvement'
            }];
        } else {
            console.error('Failed to fetch attendance data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching attendance data:', error);
    });
    
    // Fetch grades data from backend
    fetch('http://localhost:5001/api/grades/student', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Transform grades data to match frontend format
            studentData.grades = data.data.map(grade => ({
                course: grade.class ? grade.class.name : 'Unknown Class',
                instructor: grade.gradedBy ? grade.gradedBy.name : 'Unknown',
                assignments: `${grade.percentage || 0}%`,
                midterm: '-', // Not available in current data structure
                final: '-', // Not available in current data structure
                overall: grade.letterGrade || 'N/A'
            }));
        } else {
            console.error('Failed to fetch grades data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching grades data:', error);
    });
    
    // Fetch messages data from backend
    fetch('http://localhost:5001/api/messages?folder=inbox', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Transform messages data to match frontend format
            studentData.messages = data.data.messages.map(message => ({
                id: message._id,
                from: message.sender ? message.sender.name : 'Unknown',
                subject: message.subject || 'No Subject',
                date: new Date(message.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                }),
                content: message.content || 'No content',
                read: message.isRead || false
            }));
            
            // Update messages UI
            updateMessages();
            updateNotificationBadge();
        } else {
            console.error('Failed to fetch messages data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching messages data:', error);
    });
}

// Update student classes list in UI
function updateStudentClassesList(classes) {
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
                            <i class="fas fa-user"></i> ${cls.instructor}
                            <i class="fas fa-clock ml-3"></i> ${cls.schedule}
                        </div>
                    </div>
                    <div class="class-action">
                        <a href="#" class="btn btn-primary btn-sm view-class" data-class-id="${cls.id}">View Details</a>
                    </div>
                `;
                
                classList.appendChild(classItem);
            });
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
                
                // Extract time from schedule
                const timeParts = cls.schedule.split(' - ');
                const time = timeParts.length > 1 ? timeParts[1] : 'N/A';
                
                classItem.innerHTML = `
                    <div class="class-time">
                        <div class="time">${time.split(':')[0] || 'N/A'}</div>
                        <div class="ampm">${time.includes('PM') ? 'PM' : time.includes('AM') ? 'AM' : 'N/A'}</div>
                    </div>
                    <div class="class-details">
                        <div class="class-name">${cls.name}</div>
                        <div class="class-info">
                            <i class="fas fa-map-marker-alt"></i> ${cls.room}
                            <i class="fas fa-user ml-3"></i> ${cls.instructor}
                        </div>
                    </div>
                    <div class="class-action">
                        <a href="#" class="btn btn-primary btn-sm join-class" data-class-id="${cls.id}">Join</a>
                    </div>
                `;
                
                classList.appendChild(classItem);
            });
            
            // If no classes, show a message
            if (upcomingClasses.length === 0) {
                classList.innerHTML = '<li class="class-item"><div class="class-details"><p>No classes available</p></div></li>';
            }
        }
    }
}

// Load student data from localStorage
function loadStudentDataFromStorage() {
    const storedData = localStorage.getItem('studentData');
    if (storedData) {
        try {
            const parsedData = JSON.parse(storedData);
            // Merge with default data to ensure all properties exist
            Object.assign(studentData, parsedData);
        } catch (e) {
            console.error('Error parsing student data from localStorage:', e);
            // If there's an error, remove the corrupted data
            localStorage.removeItem('studentData');
        }
    }
}

// Save student data to localStorage - memory efficient version
function saveStudentDataToStorage() {
    try {
        // Only save essential data to reduce memory footprint
        const essentialData = {
            assignments: studentData.assignments,
            resources: studentData.resources,
            notifications: studentData.notifications,
            messages: studentData.messages
        };
        localStorage.setItem('studentData', JSON.stringify(essentialData));
    } catch (e) {
        console.error('Error saving student data to localStorage:', e);
        // If localStorage is full, clear some data
        if (e.name === 'QuotaExceededError') {
            clearOldNotifications();
            try {
                const essentialData = {
                    assignments: studentData.assignments,
                    resources: studentData.resources
                };
                localStorage.setItem('studentData', JSON.stringify(essentialData));
            } catch (e2) {
                console.error('Unable to save even reduced data:', e2);
            }
        }
    }
}

// Clear old notifications to free up memory
function clearOldNotifications() {
    // Keep only the latest 10 notifications
    if (studentData.notifications.length > 10) {
        studentData.notifications = studentData.notifications.slice(0, 10);
    }
    
    // Remove read messages older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    studentData.messages = studentData.messages.filter(message => {
        if (message.read) {
            const messageDate = new Date(message.date);
            return messageDate > thirtyDaysAgo;
        }
        return true; // Keep all unread messages
    });
}

// Initialize all event listeners with cleanup
function initializeEventListeners() {
    // Clean up existing event listeners to prevent memory leaks
    cleanupEventListeners();
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        const handler = function() {
            document.getElementById('sidebar').classList.toggle('active');
        };
        mobileMenuToggle.addEventListener('click', handler);
        eventListeners.push({element: mobileMenuToggle, event: 'click', handler: handler});
    }
    
    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        const handler = function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            document.querySelectorAll('.sidebar-menu a').forEach(l => {
                l.classList.remove('active');
            });
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all content sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected content section
            const sectionId = this.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('active');
            }
        };
        link.addEventListener('click', handler);
        eventListeners.push({element: link, event: 'click', handler: handler});
    });

    // Logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        const handler = function() {
            if(confirm('Are you sure you want to logout?')) {
                // Clear authentication data
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('studentData');
                
                // Clear intervals and timeouts
                if (notificationInterval) {
                    clearInterval(notificationInterval);
                    notificationInterval = null;
                }
                
                // Clean up event listeners
                cleanupEventListeners();
                
                // Redirect to login page
                window.location.href = 'login.html';
            }
        };
        logoutBtn.addEventListener('click', handler);
        eventListeners.push({element: logoutBtn, event: 'click', handler: handler});
    }
    
    // Notification icon click
    const notificationIcon = document.getElementById('notificationIcon');
    if (notificationIcon) {
        const handler = function() {
            toggleNotificationSidebar();
        };
        notificationIcon.addEventListener('click', handler);
        eventListeners.push({element: notificationIcon, event: 'click', handler: handler});
    }
    
    // Close notification sidebar
    const closeNotifications = document.getElementById('closeNotifications');
    if (closeNotifications) {
        const handler = function() {
            toggleNotificationSidebar();
        };
        closeNotifications.addEventListener('click', handler);
        eventListeners.push({element: closeNotifications, event: 'click', handler: handler});
    }
    
    // Notification filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        const handler = function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active filter button
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            // Filter notifications
            filterNotifications(filter);
        };
        btn.addEventListener('click', handler);
        eventListeners.push({element: btn, event: 'click', handler: handler});
    });
    
    // Mark all notifications as read
    const markAllRead = document.getElementById('markAllRead');
    if (markAllRead) {
        const handler = function() {
            markAllNotificationsAsRead();
        };
        markAllRead.addEventListener('click', handler);
        eventListeners.push({element: markAllRead, event: 'click', handler: handler});
    }
    
    // Clear all notifications
    const clearNotifications = document.getElementById('clearNotifications');
    if (clearNotifications) {
        const handler = function() {
            if (confirm('Are you sure you want to clear all notifications?')) {
                clearAllNotifications();
            }
        };
        clearNotifications.addEventListener('click', handler);
        eventListeners.push({element: clearNotifications, event: 'click', handler: handler});
    }
    
    // Join class functionality (for all join-class buttons)
    const joinClassHandler = function(e) {
        if (e.target.classList.contains('join-class')) {
            e.preventDefault();
            const classId = e.target.getAttribute('data-class-id');
            
            // Find class details from student data
            const classData = studentData.classes.find(c => c.id === classId);
            
            if (classData) {
                // Populate modal with class details
                document.getElementById('joinClassName').textContent = classData.name;
                document.getElementById('joinClassInstructor').textContent = classData.instructor;
                document.getElementById('joinClassTime').textContent = classData.schedule;
                document.getElementById('joinClassDepartment').textContent = studentData.department;
                
                // Show modal
                document.getElementById('joinClassModal').style.display = 'block';
                
                // Add notification
                addNotification(`Joined ${classData.name} class`);
            }
        }
    };
    document.addEventListener('click', joinClassHandler);
    eventListeners.push({element: document, event: 'click', handler: joinClassHandler});

    // View class details
    const viewClassHandler = function(e) {
        if (e.target.classList.contains('view-class')) {
            e.preventDefault();
            const classId = e.target.getAttribute('data-class-id');
            
            // Find class details from student data
            const classData = studentData.classes.find(c => c.id === classId);
            
            if (classData) {
                // Create a detailed view modal
                showClassDetailsModal(classData);
            }
        }
    };
    document.addEventListener('click', viewClassHandler);
    eventListeners.push({element: document, event: 'click', handler: viewClassHandler});

    // Submit assignment
    const submitAssignmentHandler = function(e) {
        if (e.target.classList.contains('submit-assignment')) {
            e.preventDefault();
            const assignmentId = e.target.getAttribute('data-assignment-id');
            
            // Find assignment details from student data
            const assignmentData = studentData.assignments.pending.find(a => a.id === assignmentId);
            
            if (assignmentData) {
                // Populate modal with assignment details
                document.getElementById('assignmentTitle').value = assignmentData.title;
                document.getElementById('studentName').value = studentData.name;
                document.getElementById('studentDepartment').value = studentData.department;
                
                // Store current assignment ID for form submission
                document.getElementById('assignmentForm').setAttribute('data-assignment-id', assignmentId);
                
                // Show modal
                document.getElementById('assignmentModal').style.display = 'block';
            }
        }
    };
    document.addEventListener('click', submitAssignmentHandler);
    eventListeners.push({element: document, event: 'click', handler: submitAssignmentHandler});

    // Download/view resource
    const resourceHandler = function(e) {
        if (e.target.classList.contains('download-resource') || e.target.classList.contains('view-resource')) {
            e.preventDefault();
            const resourceId = e.target.getAttribute('data-resource-id');
            const action = e.target.classList.contains('download-resource') ? 'Download' : 'View';
            
            // Find resource details from student data
            const resourceData = studentData.resources.find(r => r.id === resourceId);
            
            if (resourceData) {
                if (action === 'Download') {
                    // Mark as downloaded
                    resourceData.downloaded = true;
                    saveStudentDataToStorage();
                    updateResources();
                    
                    // Simulate download
                    simulateDownload(resourceData);
                } else {
                    // Open resource viewer
                    openResourceViewer(resourceData);
                }
            }
        }
    };
    document.addEventListener('click', resourceHandler);
    eventListeners.push({element: document, event: 'click', handler: resourceHandler});

    // View message
    const messageHandler = function(e) {
        if (e.target.classList.contains('view-message')) {
            e.preventDefault();
            const messageId = e.target.getAttribute('data-message-id');
            
            // Find message details from student data
            const messageData = studentData.messages.find(m => m.id === messageId);
            
            if (messageData) {
                // Populate modal with message details
                document.getElementById('messageFrom').textContent = messageData.from;
                document.getElementById('messageDate').textContent = messageData.date;
                document.getElementById('messageSubject').textContent = messageData.subject;
                document.getElementById('messageContent').innerHTML = messageData.content;
                
                // Store current message ID for actions
                document.getElementById('messageModal').setAttribute('data-message-id', messageId);
                
                // Show modal
                document.getElementById('messageModal').style.display = 'block';
                
                // Mark message as read
                messageData.read = true;
                saveStudentDataToStorage();
                updateMessages();
                updateNotificationBadge();
            }
        }
    };
    document.addEventListener('click', messageHandler);
    eventListeners.push({element: document, event: 'click', handler: messageHandler});

    // Join class with code
    const joinClassBtn = document.getElementById('joinClassBtn');
    if (joinClassBtn) {
        const handler = function() {
            const classCode = document.getElementById('joinClassCode').value.trim();
            
            if (classCode === '') {
                showNotification('Please enter a class code', 'error');
                return;
            }
            
            // Simulate joining class with code
            joinClassWithCode(classCode);
            
            // Clear input
            document.getElementById('joinClassCode').value = '';
        };
        joinClassBtn.addEventListener('click', handler);
        eventListeners.push({element: joinClassBtn, event: 'click', handler: handler});
    }

    // Assignment form submission
    const assignmentForm = document.getElementById('assignmentForm');
    if (assignmentForm) {
        const handler = function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('submissionFile');
            if (fileInput.files.length === 0) {
                showNotification('Please select a file to upload', 'error');
                return;
            }
            
            const assignmentId = this.getAttribute('data-assignment-id');
            const notes = document.getElementById('submissionNotes').value;
            
            // Submit assignment
            submitAssignment(assignmentId, fileInput.files[0], notes);
            
            // Close modal
            document.getElementById('assignmentModal').style.display = 'none';
            
            // Reset form
            this.reset();
        };
        assignmentForm.addEventListener('submit', handler);
        eventListeners.push({element: assignmentForm, event: 'submit', handler: handler});
    }

    // Modal close functionality
    const closeBtns = document.querySelectorAll('.modal .close');
    closeBtns.forEach(closeBtn => {
        const handler = function() {
            this.closest('.modal').style.display = 'none';
        };
        closeBtn.addEventListener('click', handler);
        eventListeners.push({element: closeBtn, event: 'click', handler: handler});
    });

    // Close modal when clicking outside of it
    const modalClickHandler = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
    window.addEventListener('click', modalClickHandler);
    eventListeners.push({element: window, event: 'click', handler: modalClickHandler});

    // Reply to message
    const replyMessage = document.getElementById('replyMessage');
    if (replyMessage) {
        const handler = function() {
            const messageId = document.getElementById('messageModal').getAttribute('data-message-id');
            const messageData = studentData.messages.find(m => m.id === messageId);
            
            if (messageData) {
                // Open reply modal
                openReplyModal(messageData);
            }
        };
        replyMessage.addEventListener('click', handler);
        eventListeners.push({element: replyMessage, event: 'click', handler: handler});
    }

    // Delete message
    const deleteMessage = document.getElementById('deleteMessage');
    if (deleteMessage) {
        const handler = function() {
            if (confirm('Are you sure you want to delete this message?')) {
                const messageId = document.getElementById('messageModal').getAttribute('data-message-id');
                
                // Find and remove message
                const index = studentData.messages.findIndex(m => m.id === messageId);
                if (index !== -1) {
                    studentData.messages.splice(index, 1);
                    saveStudentDataToStorage();
                    updateMessages();
                    updateNotificationBadge();
                    
                    showNotification('Message deleted successfully', 'success');
                    document.getElementById('messageModal').style.display = 'none';
                }
            }
        };
        deleteMessage.addEventListener('click', handler);
        eventListeners.push({element: deleteMessage, event: 'click', handler: handler});
    }

    // Join class via browser
    const joinViaBrowser = document.getElementById('joinViaBrowser');
    if (joinViaBrowser) {
        const handler = function() {
            const className = document.getElementById('joinClassName').textContent;
            
            // Simulate joining class via browser
            showNotification(`Joining ${className} via browser...`, 'info');
            
            // Create a virtual classroom simulation
            setTimeout(() => {
                showNotification(`Successfully joined ${className} virtual classroom`, 'success');
                document.getElementById('joinClassModal').style.display = 'none';
                
                // Update attendance
                updateAttendanceForClass(className);
            }, 2000);
        };
        joinViaBrowser.addEventListener('click', handler);
        eventListeners.push({element: joinViaBrowser, event: 'click', handler: handler});
    }

    // Join class via app
    const joinViaApp = document.getElementById('joinViaApp');
    if (joinViaApp) {
        const handler = function() {
            const className = document.getElementById('joinClassName').textContent;
            
            // Simulate joining class via app
            showNotification(`Opening ${className} in mobile app...`, 'info');
            
            setTimeout(() => {
                showNotification(`Successfully joined ${className} via mobile app`, 'success');
                document.getElementById('joinClassModal').style.display = 'none';
                
                // Update attendance
                updateAttendanceForClass(className);
            }, 2000);
        };
        joinViaApp.addEventListener('click', handler);
        eventListeners.push({element: joinViaApp, event: 'click', handler: handler});
    }

    // Compose new message
    const composeMessage = document.querySelector('.compose-message');
    if (composeMessage) {
        const handler = function() {
            openComposeMessageModal();
        };
        composeMessage.addEventListener('click', handler);
        eventListeners.push({element: composeMessage, event: 'click', handler: handler});
    }
    
    // Tab functionality for assignments
    const assignmentTabs = document.querySelectorAll('.assignment-tabs .tab-btn');
    assignmentTabs.forEach(tabBtn => {
        const handler = function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('.assignment-tabs .tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('#assignments .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        };
        tabBtn.addEventListener('click', handler);
        eventListeners.push({element: tabBtn, event: 'click', handler: handler});
    });
    
    // Tab functionality for resources
    const resourceTabs = document.querySelectorAll('.resource-tabs .tab-btn');
    resourceTabs.forEach(tabBtn => {
        const handler = function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('.resource-tabs .tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('#resources .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        };
        tabBtn.addEventListener('click', handler);
        eventListeners.push({element: tabBtn, event: 'click', handler: handler});
    });
    
    // Tab functionality for messages
    const messageTabs = document.querySelectorAll('.message-tabs .tab-btn');
    messageTabs.forEach(tabBtn => {
        const handler = function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('.message-tabs .tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('#messages .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        };
        tabBtn.addEventListener('click', handler);
        eventListeners.push({element: tabBtn, event: 'click', handler: handler});
    });
    
    // Tab functionality for class details modal
    const classDetailsTabHandler = function(e) {
        if (e.target.classList.contains('tab-btn') && e.target.closest('#classDetailsModal')) {
            const tabId = e.target.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('#classDetailsModal .tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('#classDetailsModal .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked tab and corresponding content
            e.target.classList.add('active');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        }
    };
    document.addEventListener('click', classDetailsTabHandler);
    eventListeners.push({element: document, event: 'click', handler: classDetailsTabHandler});
}

// Cleanup event listeners to prevent memory leaks
function cleanupEventListeners() {
    eventListeners.forEach(listener => {
        if (listener.element && listener.handler) {
            listener.element.removeEventListener(listener.event, listener.handler);
        }
    });
    eventListeners = [];
}

// Toggle notification sidebar
function toggleNotificationSidebar() {
    const sidebar = document.getElementById('notificationSidebar');
    sidebar.classList.toggle('active');
    
    // Mark all notifications as read when opening
    if (sidebar.classList.contains('active')) {
        markAllNotificationsAsRead();
    }
}

// Update notifications in the sidebar
function updateNotifications() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    notificationList.innerHTML = '';
    
    if (studentData.notifications.length === 0) {
        notificationList.innerHTML = '<p class="no-notifications">No notifications at this time.</p>';
        return;
    }
    
    studentData.notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
        notificationItem.setAttribute('data-id', notification.id);
        
        notificationItem.innerHTML = `
            <div class="notification-item-header">
                <div class="notification-item-title">${notification.title}</div>
                <div class="notification-item-time">${notification.time}</div>
            </div>
            <div class="notification-item-content">${notification.message}</div>
        `;
        
        const clickHandler = function() {
            // Mark as read when clicked
            if (!notification.read) {
                notification.read = true;
                saveStudentDataToStorage();
                updateNotifications();
                updateNotificationBadge();
            }
        };
        notificationItem.addEventListener('click', clickHandler);
        eventListeners.push({element: notificationItem, event: 'click', handler: clickHandler});
        
        notificationList.appendChild(notificationItem);
    });
}

// Filter notifications
function filterNotifications(filter) {
    const notificationItems = document.querySelectorAll('.notification-item');
    
    notificationItems.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'block';
        } else if (filter === 'unread') {
            item.style.display = item.classList.contains('unread') ? 'block' : 'none';
        }
    });
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    studentData.notifications.forEach(notification => {
        notification.read = true;
    });
    
    saveStudentDataToStorage();
    updateNotifications();
    updateNotificationBadge();
}

// Clear all notifications
function clearAllNotifications() {
    studentData.notifications = [];
    saveStudentDataToStorage();
    updateNotifications();
    updateNotificationBadge();
}

// Update notification badge
function updateNotificationBadge() {
    // Count unread messages
    const unreadMessages = studentData.messages.filter(m => !m.read).length;
    
    // Count unread notifications
    const unreadNotifications = studentData.notifications.filter(n => !n.read).length;
    
    // Total unread count
    const totalUnread = unreadMessages + unreadNotifications;
    
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        if (totalUnread > 0) {
            badge.textContent = totalUnread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Update upcoming classes
function updateUpcomingClasses() {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Get today's classes
    const todayClasses = studentData.classes.filter(cls => {
        const scheduleDays = cls.schedule.split(' - ')[0].split(', ');
        const dayMap = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };
        
        return scheduleDays.some(day => {
            const dayIndex = dayMap[day.substring(0, 3)];
            return dayIndex === currentDay;
        });
    });
    
    // Sort by time
    todayClasses.sort((a, b) => {
        const timeA = a.schedule.split(' - ')[1];
        const timeB = b.schedule.split(' - ')[1];
        
        const hourA = parseInt(timeA.split(':')[0]);
        const minuteA = parseInt(timeA.split(':')[1].substring(0, 2));
        const periodA = timeA.includes('PM') && hourA !== 12 ? 12 : 0;
        
        const hourB = parseInt(timeB.split(':')[0]);
        const minuteB = parseInt(timeB.split(':')[1].substring(0, 2));
        const periodB = timeB.includes('PM') && hourB !== 12 ? 12 : 0;
        
        return (hourA + periodA) * 60 + minuteA - (hourB + periodB) * 60 - minuteB;
    });
    
    // Find the upcoming classes section in the overview
    const upcomingClassesCard = document.querySelector('#overview .card');
    if (!upcomingClassesCard) return;
    
    const classList = upcomingClassesCard.querySelector('.class-list');
    if (!classList) return;
    
    classList.innerHTML = '';
    
    // Show up to 3 upcoming classes for today
    const upcomingClasses = todayClasses.slice(0, 3);
    
    if (upcomingClasses.length === 0) {
        classList.innerHTML = '<li class="class-item"><div class="class-details"><p>No classes scheduled for today</p></div></li>';
        return;
    }
    
    upcomingClasses.forEach(cls => {
        const time = cls.schedule.split(' - ')[1];
        const hour = parseInt(time.split(':')[0]);
        const minute = parseInt(time.split(':')[1].substring(0, 2));
        const period = time.includes('PM') && hour !== 12 ? 12 : 0;
        const totalMinutes = (hour + period) * 60 + minute;
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        
        const isUpcoming = totalMinutes > currentTotalMinutes;
        const isOngoing = totalMinutes <= currentTotalMinutes && totalMinutes + 60 > currentTotalMinutes;
        
        const classItem = document.createElement('li');
        classItem.className = 'class-item';
        
        if (isOngoing) {
            classItem.classList.add('ongoing');
        }
        
        // Ensure at least two classes have a "Join" button
        const showJoinButton = isOngoing || isUpcoming || upcomingClasses.indexOf(cls) < 2;
        
        classItem.innerHTML = `
            <div class="class-time">
                <div class="time">${time.split(':')[0]}</div>
                <div class="ampm">${time.includes('PM') ? 'PM' : 'AM'}</div>
            </div>
            <div class="class-details">
                <div class="class-name">${cls.name}</div>
                <div class="class-info">
                    <i class="fas fa-map-marker-alt"></i> ${cls.room}
                    <i class="fas fa-user ml-3"></i> ${cls.instructor}
                </div>
            </div>
            <div class="class-action">
                ${showJoinButton ? 
                    `<a href="#" class="btn btn-primary btn-sm join-class" data-class-id="${cls.id}">Join</a>` : 
                    `<span class="class-status">Completed</span>`
                }
            </div>
        `;
        
        classList.appendChild(classItem);
    });
}

// Update announcements
function updateAnnouncements() {
    const announcementList = document.querySelector('#overview .announcement-list');
    if (!announcementList) return;
    
    announcementList.innerHTML = '';
    
    // Sample announcements - in a real implementation, these would come from the backend
    const sampleAnnouncements = [
        { title: "Welcome to EduConnect", date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), content: "Welcome to your new educational platform. Get started by joining your classes." },
        { title: "System Update", date: new Date(Date.now() - 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), content: "We've updated our system with new features. Check them out!" }
    ];
    
    sampleAnnouncements.forEach(announcement => {
        const announcementItem = document.createElement('li');
        announcementItem.className = 'announcement-item';
        
        announcementItem.innerHTML = `
            <div class="announcement-details">
                <div class="announcement-title">${announcement.title}</div>
                <div class="announcement-info">
                    <i class="fas fa-calendar-alt"></i> Posted on ${announcement.date}
                </div>
                <div class="announcement-content">
                    ${announcement.content}
                </div>
            </div>
        `;
        
        announcementList.appendChild(announcementItem);
    });
}

// Update resources
function updateResources() {
    const resourceGrid = document.querySelector('#resources .resource-grid');
    if (!resourceGrid) return;
    
    resourceGrid.innerHTML = '';
    
    studentData.resources.forEach(resource => {
        const resourceCard = document.createElement('div');
        resourceCard.className = 'resource-card';
        
        resourceCard.innerHTML = `
            <div class="resource-icon">
                <i class="fas ${getResourceIcon(resource.type)}"></i>
            </div>
            <div class="resource-body">
                <h3 class="resource-title">${resource.title}</h3>
                <p class="resource-meta">${resource.instructor} • ${resource.type} • ${resource.size}</p>
                <div class="resource-actions">
                    <a href="#" class="btn btn-primary btn-sm download-resource" data-resource-id="${resource.id}">${resource.downloaded ? 'Downloaded' : 'Download'}</a>
                    <a href="#" class="btn btn-outline btn-sm view-resource" data-resource-id="${resource.id}">View</a>
                </div>
            </div>
        `;
        
        resourceGrid.appendChild(resourceCard);
    });
}

// Update messages
function updateMessages() {
    const messageList = document.querySelector('#messages .message-list');
    if (!messageList) return;
    
    messageList.innerHTML = '';
    
    studentData.messages.forEach(message => {
        const messageItem = document.createElement('li');
        messageItem.className = `message-item ${message.read ? '' : 'unread'}`;
        
        messageItem.innerHTML = `
            <div class="message-icon">
                <i class="fas ${message.from.includes('Department') ? 'fa-bell' : 'fa-user'}"></i>
            </div>
            <div class="message-details">
                <div class="message-title">${message.from} - ${message.subject}</div>
                <div class="message-meta">
                    <i class="fas fa-envelope"></i> Received on ${message.date}
                </div>
                <div class="message-preview">
                    ${message.content.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
                </div>
            </div>
            <div class="message-actions">
                <a href="#" class="btn btn-sm btn-outline view-message" data-message-id="${message.id}">View</a>
            </div>
        `;
        
        messageList.appendChild(messageItem);
    });
}

// Update assignments
function updateAssignments() {
    // Update pending assignments
    const pendingList = document.querySelector('#pending .assignment-list');
    if (!pendingList) return;
    
    pendingList.innerHTML = '';
    
    studentData.assignments.pending.forEach(assignment => {
        const assignmentItem = document.createElement('li');
        assignmentItem.className = 'assignment-item';
        
        // Check if deadline is urgent (within 3 days)
        const deadlineDate = new Date(assignment.deadline);
        const today = new Date();
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isUrgent = diffDays <= 3;
        
        assignmentItem.innerHTML = `
            <div class="assignment-icon">
                <i class="fas ${getAssignmentIcon(assignment.course)}"></i>
            </div>
            <div class="assignment-details">
                <div class="assignment-title">${assignment.title}</div>
                <div class="assignment-meta">
                    <i class="fas fa-book"></i> ${assignment.course}
                    <i class="fas fa-user ml-3"></i> ${assignment.instructor}
                </div>
            </div>
            <div class="assignment-deadline">
                <div class="deadline-date ${isUrgent ? 'deadline-urgent' : ''}">${assignment.deadline}</div>
                <div class="deadline-time">${assignment.time}</div>
            </div>
            <div class="assignment-action">
                <a href="#" class="btn btn-primary btn-sm submit-assignment" data-assignment-id="${assignment.id}">Submit</a>
            </div>
        `;
        
        pendingList.appendChild(assignmentItem);
    });
    
    // Update completed assignments
    const completedList = document.querySelector('#completed .assignment-list');
    if (!completedList) return;
    
    completedList.innerHTML = '';
    
    studentData.assignments.completed.forEach(assignment => {
        const assignmentItem = document.createElement('li');
        assignmentItem.className = 'assignment-item';
        
        assignmentItem.innerHTML = `
            <div class="assignment-icon">
                <i class="fas ${getAssignmentIcon(assignment.course)}"></i>
            </div>
            <div class="assignment-details">
                <div class="assignment-title">${assignment.title}</div>
                <div class="assignment-meta">
                    <i class="fas fa-book"></i> ${assignment.course}
                    <i class="fas fa-user ml-3"></i> ${assignment.instructor}
                </div>
            </div>
            <div class="assignment-deadline">
                <div class="deadline-date">Grade: ${assignment.grade}</div>
                <div class="deadline-time">Submitted on ${assignment.date}</div>
            </div>
        `;
        
        completedList.appendChild(assignmentItem);
    });
}

// Initialize calendar
function initializeCalendar() {
    // Initialize calendar with current month
    const today = new Date();
    generateCalendar(today.getFullYear(), today.getMonth());

    // Calendar navigation
    const prevMonth = document.getElementById('prevMonth');
    if (prevMonth) {
        const handler = function() {
            const currentMonthText = document.getElementById('currentMonth').textContent;
            const [monthName, year] = currentMonthText.split(' ');
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            const monthIndex = monthNames.indexOf(monthName);
            
            if (monthIndex === 0) {
                generateCalendar(parseInt(year) - 1, 11);
            } else {
                generateCalendar(parseInt(year), monthIndex - 1);
            }
        };
        prevMonth.addEventListener('click', handler);
        eventListeners.push({element: prevMonth, event: 'click', handler: handler});
    }

    const nextMonth = document.getElementById('nextMonth');
    if (nextMonth) {
        const handler = function() {
            const currentMonthText = document.getElementById('currentMonth').textContent;
            const [monthName, year] = currentMonthText.split(' ');
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            const monthIndex = monthNames.indexOf(monthName);
            
            if (monthIndex === 11) {
                generateCalendar(parseInt(year) + 1, 0);
            } else {
                generateCalendar(parseInt(year), monthIndex + 1);
            }
        };
        nextMonth.addEventListener('click', handler);
        eventListeners.push({element: nextMonth, event: 'click', handler: handler});
    }
}

// Generate calendar for a specific month and year
function generateCalendar(year, month) {
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get current month name
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Clear existing calendar days
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) return;
    
    const dayHeaders = calendarGrid.querySelectorAll('.calendar-day-header');
    calendarGrid.innerHTML = '';
    dayHeaders.forEach(header => calendarGrid.appendChild(header));
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyDay);
    }
    
    // Create events for the month
    const events = generateCalendarEvents(year, month);
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;
        
        // Check if this day has events
        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day && 
                   eventDate.getMonth() === month && 
                   eventDate.getFullYear() === year;
        });
        
        if (dayEvents.length > 0) {
            dayElement.classList.add('has-event');
            const eventIndicator = document.createElement('div');
            eventIndicator.classList.add('event-indicator');
            dayElement.appendChild(eventIndicator);
            
            // Add tooltip with event details
            dayElement.title = dayEvents.map(event => `${event.title}: ${event.time}`).join('\n');
            
            // Add click event to show event details
            const clickHandler = function() {
                showDayEvents(dayEvents, day, monthNames[month], year);
            };
            dayElement.addEventListener('click', clickHandler);
            eventListeners.push({element: dayElement, event: 'click', handler: clickHandler});
        }
        
        // Highlight today
        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        calendarGrid.appendChild(dayElement);
    }
}

// Generate calendar events
function generateCalendarEvents(year, month) {
    const events = [];
    
    // Add assignment deadlines
    studentData.assignments.pending.forEach(assignment => {
        const deadlineDate = new Date(assignment.deadline);
        if (deadlineDate.getFullYear() === year && deadlineDate.getMonth() === month) {
            events.push({
                title: `Assignment: ${assignment.title}`,
                date: assignment.deadline,
                time: assignment.time,
                type: 'assignment'
            });
        }
    });
    
    // Add class schedules
    studentData.classes.forEach(cls => {
        const scheduleDays = cls.schedule.split(' - ')[0].split(', ');
        const time = cls.schedule.split(' - ')[1];
        
        scheduleDays.forEach(day => {
            const dayMap = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };
            const dayIndex = dayMap[day.substring(0, 3)];
            
            // Find all dates for this day in the month
            for (let date = 1; date <= 31; date++) {
                const dateObj = new Date(year, month, date);
                if (dateObj.getDay() === dayIndex && dateObj.getMonth() === month) {
                    events.push({
                        title: `Class: ${cls.name}`,
                        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`,
                        time: time,
                        type: 'class'
                    });
                }
            }
        });
    });
    
    // Add exam dates (sample data)
    if (month === 8) { // September
        events.push({
            title: 'Midterm Exam: Data Structures',
            date: `${year}-09-15`,
            time: '9:00 AM',
            type: 'exam'
        });
        
        events.push({
            title: 'Midterm Exam: Algorithms',
            date: `${year}-09-18`,
            time: '11:00 AM',
            type: 'exam'
        });
        
        events.push({
            title: 'Midterm Exam: Database Systems',
            date: `${year}-09-22`,
            time: '2:00 PM',
            type: 'exam'
        });
    }
    
    return events;
}

// Show day events
function showDayEvents(events, day, month, year) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h2>Events for ${month} ${day}, ${year}</h2>
        <span class="close">&times;</span>
    `;
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    if (events.length === 0) {
        modalBody.innerHTML = '<p>No events scheduled for this day.</p>';
    } else {
        const eventList = document.createElement('ul');
        eventList.className = 'event-list';
        
        events.forEach(event => {
            const eventItem = document.createElement('li');
            eventItem.className = `event-item ${event.type}`;
            
            const icon = event.type === 'assignment' ? 'fa-tasks' : 
                         event.type === 'class' ? 'fa-video' : 
                         event.type === 'exam' ? 'fa-file-alt' : 'fa-calendar';
            
            eventItem.innerHTML = `
                <div class="event-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="event-details">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">${event.time}</div>
                </div>
            `;
            
            eventList.appendChild(eventItem);
        });
        
        modalBody.appendChild(eventList);
    }
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeHandler = function() {
        document.body.removeChild(modal);
    };
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeHandler);
        eventListeners.push({element: closeBtn, event: 'click', handler: closeHandler});
    }
    
    const modalClickHandler = function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    };
    modal.addEventListener('click', modalClickHandler);
    eventListeners.push({element: modal, event: 'click', handler: modalClickHandler});
}

// Get resource icon based on type
function getResourceIcon(type) {
    switch (type) {
        case 'PDF': return 'fa-file-pdf';
        case 'ZIP': return 'fa-file-archive';
        case 'PPTX': return 'fa-file-powerpoint';
        case 'EXE': return 'fa-file-code';
        case 'MP4': return 'fa-file-video';
        default: return 'fa-file';
    }
}

// Get assignment icon based on course
function getAssignmentIcon(course) {
    switch (course) {
        case 'Data Structures': return 'fa-laptop-code';
        case 'Algorithms': return 'fa-project-diagram';
        case 'Database Systems': return 'fa-database';
        case 'Computer Networks': return 'fa-network-wired';
        case 'Software Engineering': return 'fa-code-branch';
        case 'Engineering Mathematics': return 'fa-calculator';
        default: return 'fa-tasks';
    }
}

// Simulate download
function simulateDownload(resource) {
    showNotification(`Downloading ${resource.title} (${resource.size})...`, 'info');
    
    // Simulate download progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        showNotification(`Download progress: ${progress}%`, 'info');
        
        if (progress >= 100) {
            clearInterval(interval);
            showNotification(`${resource.title} downloaded successfully`, 'success');
        }
    }, 500);
}

// Open resource viewer
function openResourceViewer(resource) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '1000px';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h2>${resource.title}</h2>
        <span class="close">&times;</span>
    `;
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    // Create a simulated viewer based on resource type
    if (resource.type === 'PDF') {
        modalBody.innerHTML = `
            <div class="pdf-viewer">
                <div class="pdf-header">
                    <div class="pdf-info">
                        <p><strong>Title:</strong> ${resource.title}</p>
                        <p><strong>Instructor:</strong> ${resource.instructor}</p>
                        <p><strong>Size:</strong> ${resource.size}</p>
                    </div>
                    <div class="pdf-controls">
                        <button class="btn btn-outline btn-sm" id="prevPage">Previous</button>
                        <span id="pageInfo">Page 1 of 10</span>
                        <button class="btn btn-outline btn-sm" id="nextPage">Next</button>
                        <button class="btn btn-primary btn-sm" id="downloadPdf">Download</button>
                    </div>
                </div>
                <div class="pdf-content">
                    <div class="pdf-page">
                        <p>This is a simulated PDF viewer for ${resource.title}.</p>
                        <p>In a real implementation, this would display the actual PDF content.</p>
                        <div style="height: 500px; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                            <p>PDF Content Would Be Displayed Here</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add PDF viewer controls
        let currentPage = 1;
        const totalPages = 10;
        
        const prevPage = modalBody.querySelector('#prevPage');
        if (prevPage) {
            const handler = function() {
                if (currentPage > 1) {
                    currentPage--;
                    const pageInfo = modalBody.querySelector('#pageInfo');
                    if (pageInfo) {
                        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
                    }
                }
            };
            prevPage.addEventListener('click', handler);
            eventListeners.push({element: prevPage, event: 'click', handler: handler});
        }
        
        const nextPage = modalBody.querySelector('#nextPage');
        if (nextPage) {
            const handler = function() {
                if (currentPage < totalPages) {
                    currentPage++;
                    const pageInfo = modalBody.querySelector('#pageInfo');
                    if (pageInfo) {
                        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
                    }
                }
            };
            nextPage.addEventListener('click', handler);
            eventListeners.push({element: nextPage, event: 'click', handler: handler});
        }
        
        const downloadPdf = modalBody.querySelector('#downloadPdf');
        if (downloadPdf) {
            const handler = function() {
                resource.downloaded = true;
                saveStudentDataToStorage();
                updateResources();
                simulateDownload(resource);
            };
            downloadPdf.addEventListener('click', handler);
            eventListeners.push({element: downloadPdf, event: 'click', handler: handler});
        }
    } else if (resource.type === 'PPTX') {
        modalBody.innerHTML = `
            <div class="ppt-viewer">
                <div class="ppt-header">
                    <div class="ppt-info">
                        <p><strong>Title:</strong> ${resource.title}</p>
                        <p><strong>Instructor:</strong> ${resource.instructor}</p>
                        <p><strong>Size:</strong> ${resource.size}</p>
                    </div>
                    <div class="ppt-controls">
                        <button class="btn btn-outline btn-sm" id="prevSlide">Previous</button>
                        <span id="slideInfo">Slide 1 of 15</span>
                        <button class="btn btn-outline btn-sm" id="nextSlide">Next</button>
                        <button class="btn btn-primary btn-sm" id="downloadPpt">Download</button>
                    </div>
                </div>
                <div class="ppt-content">
                    <div class="ppt-slide">
                        <h3>${resource.title}</h3>
                        <p>This is a simulated PowerPoint viewer for ${resource.title}.</p>
                        <p>In a real implementation, this would display the actual PowerPoint slides.</p>
                        <div style="height: 500px; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                            <p>PowerPoint Slide Would Be Displayed Here</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add PowerPoint viewer controls
        let currentSlide = 1;
        const totalSlides = 15;
        
        const prevSlide = modalBody.querySelector('#prevSlide');
        if (prevSlide) {
            const handler = function() {
                if (currentSlide > 1) {
                    currentSlide--;
                    const slideInfo = modalBody.querySelector('#slideInfo');
                    if (slideInfo) {
                        slideInfo.textContent = `Slide ${currentSlide} of ${totalSlides}`;
                    }
                }
            };
            prevSlide.addEventListener('click', handler);
            eventListeners.push({element: prevSlide, event: 'click', handler: handler});
        }
        
        const nextSlide = modalBody.querySelector('#nextSlide');
        if (nextSlide) {
            const handler = function() {
                if (currentSlide < totalSlides) {
                    currentSlide++;
                    const slideInfo = modalBody.querySelector('#slideInfo');
                    if (slideInfo) {
                        slideInfo.textContent = `Slide ${currentSlide} of ${totalSlides}`;
                    }
                }
            };
            nextSlide.addEventListener('click', handler);
            eventListeners.push({element: nextSlide, event: 'click', handler: handler});
        }
        
        const downloadPpt = modalBody.querySelector('#downloadPpt');
        if (downloadPpt) {
            const handler = function() {
                resource.downloaded = true;
                saveStudentDataToStorage();
                updateResources();
                simulateDownload(resource);
            };
            downloadPpt.addEventListener('click', handler);
            eventListeners.push({element: downloadPpt, event: 'click', handler: handler});
        }
    } else if (resource.type === 'MP4') {
        modalBody.innerHTML = `
            <div class="video-viewer">
                <div class="video-header">
                    <div class="video-info">
                        <p><strong>Title:</strong> ${resource.title}</p>
                        <p><strong>Instructor:</strong> ${resource.instructor}</p>
                        <p><strong>Size:</strong> ${resource.size}</p>
                    </div>
                    <div class="video-controls">
                        <button class="btn btn-primary btn-sm" id="playVideo">Play</button>
                        <button class="btn btn-outline btn-sm" id="pauseVideo">Pause</button>
                        <button class="btn btn-primary btn-sm" id="downloadVideo">Download</button>
                    </div>
                </div>
                <div class="video-content">
                    <div class="video-player">
                        <p>This is a simulated video player for ${resource.title}.</p>
                        <p>In a real implementation, this would display the actual video content.</p>
                        <div style="height: 500px; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                            <p>Video Content Would Be Displayed Here</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add video player controls
        const downloadVideo = modalBody.querySelector('#downloadVideo');
        if (downloadVideo) {
            const handler = function() {
                resource.downloaded = true;
                saveStudentDataToStorage();
                updateResources();
                simulateDownload(resource);
            };
            downloadVideo.addEventListener('click', handler);
            eventListeners.push({element: downloadVideo, event: 'click', handler: handler});
        }
    } else {
        modalBody.innerHTML = `
            <div class="file-viewer">
                <div class="file-info">
                    <p><strong>Title:</strong> ${resource.title}</p>
                    <p><strong>Instructor:</strong> ${resource.instructor}</p>
                    <p><strong>Type:</strong> ${resource.type}</p>
                    <p><strong>Size:</strong> ${resource.size}</p>
                </div>
                <div class="file-content">
                    <p>This is a simulated file viewer for ${resource.title}.</p>
                    <p>In a real implementation, this would display the actual file content or provide appropriate viewer.</p>
                    <div style="height: 500px; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                        <p>File Content Would Be Displayed Here</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-primary" id="downloadFile">Download</button>
                </div>
            </div>
        `;
        
        const downloadFile = modalBody.querySelector('#downloadFile');
        if (downloadFile) {
            const handler = function() {
                resource.downloaded = true;
                saveStudentDataToStorage();
                updateResources();
                simulateDownload(resource);
            };
            downloadFile.addEventListener('click', handler);
            eventListeners.push({element: downloadFile, event: 'click', handler: handler});
        }
    }
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeHandler = function() {
        document.body.removeChild(modal);
    };
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeHandler);
        eventListeners.push({element: closeBtn, event: 'click', handler: closeHandler});
    }
    
    const modalClickHandler = function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    };
    modal.addEventListener('click', modalClickHandler);
    eventListeners.push({element: modal, event: 'click', handler: modalClickHandler});
}

// Show class details modal
function showClassDetailsModal(classData) {
    // Populate modal with class details
    const modalClassName = document.getElementById('modalClassName');
    if (modalClassName) {
        modalClassName.textContent = classData.name;
    }
    
    const modalClassInstructor = document.getElementById('modalClassInstructor');
    if (modalClassInstructor) {
        modalClassInstructor.textContent = classData.instructor;
    }
    
    const modalClassSchedule = document.getElementById('modalClassSchedule');
    if (modalClassSchedule) {
        modalClassSchedule.textContent = classData.schedule;
    }
    
    const modalClassRoom = document.getElementById('modalClassRoom');
    if (modalClassRoom) {
        modalClassRoom.textContent = classData.room;
    }
    
    const modalClassType = document.getElementById('modalClassType');
    if (modalClassType) {
        modalClassType.textContent = classData.type === 'online' ? 'Online Class' : 'Offline Class';
    }
    
    // Show modal
    const classDetailsModal = document.getElementById('classDetailsModal');
    if (classDetailsModal) {
        classDetailsModal.style.display = 'block';
    }
    
    // Add notification
    addNotification(`Viewed details for ${classData.name}`);
}

// Submit assignment
function submitAssignment(assignmentId, file, notes) {
    // Find assignment in pending list
    const assignmentIndex = studentData.assignments.pending.findIndex(a => a.id === assignmentId);
    
    if (assignmentIndex === -1) {
        showNotification('Assignment not found', 'error');
        return;
    }
    
    const assignment = studentData.assignments.pending[assignmentIndex];
    
    // Simulate submission
    showNotification(`Submitting ${assignment.title}...`, 'info');
    
    setTimeout(() => {
        // Move assignment from pending to completed
        studentData.assignments.pending.splice(assignmentIndex, 1);
        
        // Add to completed with a grade (simulated)
        const grade = generateRandomGrade();
        studentData.assignments.completed.push({
            id: assignment.id,
            title: assignment.title,
            course: assignment.course,
            instructor: assignment.instructor,
            grade: grade,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            description: assignment.description,
            submissionNotes: notes,
            fileName: file.name,
            fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        });
        
        // Save to localStorage
        saveStudentDataToStorage();
        
        // Update UI
        updateAssignments();
        
        // Show success message
        showNotification(`${assignment.title} submitted successfully!`, 'success');
        
        // Add notification
        addNotification(`Assignment submitted: ${assignment.title}`);
    }, 2000);
}

// Generate random grade
function generateRandomGrade() {
    const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D'];
    const weights = [5, 10, 15, 20, 20, 15, 8, 5, 1, 0.5, 0.5];
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < grades.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
            return grades[i];
        }
    }
    
    return 'D';
}

// Simulate real-time updates
function simulateRealTimeUpdates() {
    // In a real implementation, this would fetch new data from the server
    // For now, we'll just add a sample notification occasionally
    if (Math.random() < 0.3) { // 30% chance of a new notification
        addNotification('New announcement posted');
    }
}

// Add notification
function addNotification(message) {
    const notification = {
        id: Date.now(),
        title: 'System Notification',
        message: message,
        time: 'Just now',
        read: false
    };
    
    studentData.notifications.unshift(notification);
    
    // Keep only the latest 20 notifications
    if (studentData.notifications.length > 20) {
        studentData.notifications = studentData.notifications.slice(0, 20);
    }
    
    saveStudentDataToStorage();
    updateNotifications();
    updateNotificationBadge();
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Join class with code
function joinClassWithCode(code) {
    showNotification(`Joining class with code: ${code}`, 'info');
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Successfully joined class!', 'success');
    }, 1500);
}

// Update attendance for class
function updateAttendanceForClass(className) {
    // In a real implementation, this would make an API call to update attendance
    addNotification(`Attendance marked for ${className}`);
}

// Open reply modal
function openReplyModal(messageData) {
    // In a real implementation, this would open a reply modal
    showNotification('Reply functionality would open here', 'info');
}

// Open compose message modal
function openComposeMessageModal() {
    // In a real implementation, this would open a compose modal
    showNotification('Compose message functionality would open here', 'info');
}