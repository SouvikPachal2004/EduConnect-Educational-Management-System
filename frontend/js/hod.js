// HOD (Head of Department) data
const hodData = {
    name: "Dr. Priya Singh",
    id: "HOD12345",
    department: "Computer Engineering",
    faculty: [
        { id: "fac001", name: "Prof. Amit Patel", position: "Senior Professor", specialization: "Data Structures", courses: 3, email: "amit.patel@educonnect.edu", status: "Active" },
        { id: "fac002", name: "Dr. Neha Sharma", position: "Associate Professor", specialization: "Algorithms", courses: 2, email: "neha.sharma@educonnect.edu", status: "Active" },
        { id: "fac003", name: "Prof. Rohan Kumar", position: "Assistant Professor", specialization: "Database Systems", courses: 2, email: "rohan.kumar@educonnect.edu", status: "Active" },
        { id: "fac004", name: "Dr. Pooja Verma", position: "Lecturer", specialization: "Software Engineering", courses: 1, email: "pooja.verma@educonnect.edu", status: "Active" }
    ],
    courses: [
        { id: "cs301", name: "Data Structures", code: "CS301", instructor: "Prof. Amit Patel", credits: 4, students: 45, status: "Active", avgGrade: "B+", passRate: "92%", attendance: "89%" },
        { id: "cs302", name: "Algorithms", code: "CS302", instructor: "Dr. Neha Sharma", credits: 4, students: 38, status: "Active", avgGrade: "B", passRate: "87%", attendance: "72%" },
        { id: "cs303", name: "Database Systems", code: "CS303", instructor: "Prof. Rohan Kumar", credits: 3, students: 42, status: "Active", avgGrade: "A-", passRate: "95%", attendance: "94%" },
        { id: "cs304", name: "Software Engineering", code: "CS304", instructor: "Dr. Pooja Verma", credits: 3, students: 40, status: "Pending", avgGrade: "B+", passRate: "90%", attendance: "85%" }
    ],
    students: [
        { id: "CS2021001", name: "Alex Johnson", year: "3rd Year", gpa: 3.8, status: "Excellent", courses: ["Data Structures", "Algorithms", "Database Systems"] },
        { id: "CS2021002", name: "Sarah Williams", year: "2nd Year", gpa: 3.5, status: "Good", courses: ["Data Structures", "Algorithms"] },
        { id: "CS2021003", name: "Michael Brown", year: "4th Year", gpa: 2.8, status: "Average", courses: ["Database Systems", "Software Engineering"] },
        { id: "CS2021004", name: "Emily Davis", year: "3rd Year", gpa: 2.2, status: "At Risk", courses: ["Data Structures", "Software Engineering"] }
    ],
    timetable: [
        { time: "9:00 AM - 10:30 AM", monday: "Data Structures", tuesday: "Algorithms", wednesday: "Data Structures", thursday: "Algorithms", friday: "Data Structures" },
        { time: "11:00 AM - 12:30 PM", monday: "Database Systems", tuesday: "Software Engineering", wednesday: "Database Systems", thursday: "Software Engineering", friday: "Database Systems" },
        { time: "2:00 PM - 3:30 PM", monday: "Software Engineering", tuesday: "Algorithms Lab", wednesday: "Software Engineering", thursday: "Algorithms Lab", friday: "Software Engineering" },
        { time: "4:00 PM - 5:30 PM", monday: "Faculty Meeting", tuesday: "", wednesday: "Project Guidance", thursday: "", friday: "Department Review" }
    ],
    attendance: [
        { course: "Data Structures", instructor: "Prof. Amit Patel", totalClasses: 24, avgAttendance: "89%", highest: "96%", lowest: "78%" },
        { course: "Algorithms", instructor: "Dr. Neha Sharma", totalClasses: 22, avgAttendance: "72%", highest: "85%", lowest: "60%" },
        { course: "Database Systems", instructor: "Prof. Rohan Kumar", totalClasses: 20, avgAttendance: "94%", highest: "98%", lowest: "88%" },
        { course: "Software Engineering", instructor: "Dr. Pooja Verma", totalClasses: 18, avgAttendance: "85%", highest: "92%", lowest: "76%" }
    ],
    resources: [
        { name: "Department Handbook", type: "PDF", size: "2.4 MB", uploadedBy: "Dr. Priya Singh", date: "Oct 10, 2023" },
        { name: "Curriculum Guidelines", type: "PDF", size: "1.8 MB", uploadedBy: "Prof. Amit Patel", date: "Sep 15, 2023" },
        { name: "Lab Safety Video", type: "MP4", size: "125 MB", uploadedBy: "Prof. Rohan Kumar", date: "Sep 5, 2023" },
        { name: "Annual Report", type: "PDF", size: "3.2 MB", uploadedBy: "Dr. Pooja Verma", date: "Aug 20, 2023" }
    ],
    messages: [
        { id: "msg001", from: "Prof. Amit Patel", subject: "Request for Lab Equipment", preview: "I would like to request additional equipment for the Data Structures lab...", time: "Today, 09:30 AM", unread: true, content: "I would like to request additional equipment for the Data Structures lab. We need 5 more computers and a new projector. The current equipment is outdated and causing issues during practical sessions." },
        { id: "msg002", from: "Alex Johnson", subject: "Project Submission", preview: "I have submitted my final project for the Software Engineering course...", time: "Yesterday, 04:15 PM", unread: false, content: "I have submitted my final project for the Software Engineering course. Please let me know if you need any additional information or modifications." },
        { id: "msg003", from: "Mr. Rajeev Sharma", subject: "System Maintenance", preview: "Please be informed that there will be a scheduled system maintenance...", time: "Oct 12, 2023", unread: false, content: "Please be informed that there will be a scheduled system maintenance this weekend. The system will be unavailable from 10 PM Saturday to 6 AM Sunday. Please plan accordingly." }
    ],
    notifications: [
        { id: "notif001", title: "Faculty Meeting", message: "Faculty meeting scheduled for tomorrow at 10 AM in Conference Room A", time: "Today, 09:00 AM", read: false },
        { id: "notif002", title: "New Admission", message: "3 new students have been admitted to the department", time: "Yesterday, 02:30 PM", read: false },
        { id: "notif003", title: "Course Update", message: "Software Engineering course status has been updated to Active", time: "Oct 15, 2023", read: true },
        { id: "notif004", title: "Resource Upload", message: "New resource 'Department Handbook' has been uploaded", time: "Oct 10, 2023", read: true },
        { id: "notif005", title: "Report Generated", message: "Department performance report for September has been generated", time: "Oct 5, 2023", read: true }
    ]
};

// Initialize the HOD dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all event listeners
    initializeEventListeners();
    
    // Initialize dashboard
    initializeDashboard();
    
    // Load data from localStorage if available
    loadHodDataFromStorage();
    
    // Initialize notification dropdown
    initializeNotificationDropdown();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Mobile menu toggle
    document.getElementById('mobileMenuToggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Sidebar navigation
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
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
            document.getElementById(sectionId).classList.add('active');
            
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });
    });

    // Logout functionality
    document.querySelector('.logout-btn').addEventListener('click', function() {
        if(confirm('Are you sure you want to logout?')) {
            // In a real application, this would clear the session and redirect to login page
            window.location.href = 'login.html';
        }
    });

    // Add faculty button
    document.getElementById('addFacultyBtn').addEventListener('click', function() {
        openFacultyModal();
    });

    // Add course button
    document.getElementById('addCourseBtn').addEventListener('click', function() {
        openCourseModal();
    });

    // Upload resource button
    document.getElementById('uploadResourceBtn').addEventListener('click', function() {
        openResourceModal();
    });

    // Compose message button
    document.getElementById('composeMessageBtn').addEventListener('click', function() {
        openMessageModal();
    });

    // Generate timetable button
    document.getElementById('generateTimetableBtn').addEventListener('click', function() {
        generateTimetable();
    });

    // Generate report button
    document.getElementById('generateReportBtn').addEventListener('click', function() {
        generateReport();
    });

    // Faculty form submission
    document.getElementById('facultyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveFaculty();
    });

    // Course form submission
    document.getElementById('courseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCourse();
    });

    // Resource form submission
    document.getElementById('resourceForm').addEventListener('submit', function(e) {
        e.preventDefault();
        uploadResource();
    });

    // Message form submission
    document.getElementById('messageForm').addEventListener('submit', function(e) {
        e.preventDefault();
        sendMessage();
    });

    // Report form submission
    document.getElementById('reportForm').addEventListener('submit', function(e) {
        e.preventDefault();
        generateCustomReport();
    });

    // Modal close buttons
    document.querySelectorAll('.close, .cancel-btn, .close-detail').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Tab functionality for messages
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Mark all notifications as read
    document.querySelector('.mark-all-read').addEventListener('click', function() {
        markAllNotificationsAsRead();
    });
}

// Initialize notification dropdown
function initializeNotificationDropdown() {
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    notificationIcon.addEventListener('click', function() {
        notificationDropdown.classList.toggle('active');
        updateNotificationList();
    });
    
    // Close notification dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!notificationIcon.contains(event.target) && !notificationDropdown.contains(event.target)) {
            notificationDropdown.classList.remove('active');
        }
    });
}

// Initialize dashboard
function initializeDashboard() {
    // Update faculty list
    updateFacultyList();
    
    // Update courses list
    updateCoursesList();
    
    // Update students list
    updateStudentsList();
    
    // Update timetable
    updateTimetable();
    
    // Update attendance list
    updateAttendanceList();
    
    // Update resources list
    updateResourcesList();
    
    // Update messages list
    updateMessagesList();
    
    // Populate instructor dropdowns
    populateInstructorDropdowns();
    
    // Populate recipient dropdowns
    populateRecipientDropdowns();
}

// Load HOD data from localStorage
function loadHodDataFromStorage() {
    const storedData = localStorage.getItem('hodData');
    if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Merge with default data to ensure all properties exist
        Object.assign(hodData, parsedData);
    }
}

// Save HOD data to localStorage
function saveHodDataToStorage() {
    localStorage.setItem('hodData', JSON.stringify(hodData));
}

// Update faculty list
function updateFacultyList() {
    const facultyList = document.querySelector('.faculty-list');
    if (!facultyList) return;
    
    facultyList.innerHTML = '';
    
    hodData.faculty.forEach(faculty => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${faculty.name}</td>
            <td>${faculty.position}</td>
            <td>${faculty.specialization}</td>
            <td>${faculty.courses}</td>
            <td>${faculty.email}</td>
            <td>
                <button class="btn btn-sm btn-outline view-faculty" data-id="${faculty.id}">View</button>
                <button class="btn btn-sm btn-primary edit-faculty" data-id="${faculty.id}">Edit</button>
            </td>
        `;
        facultyList.appendChild(row);
    });
    
    // Add event listeners to view and edit buttons
    document.querySelectorAll('.view-faculty').forEach(button => {
        button.addEventListener('click', function() {
            const facultyId = this.getAttribute('data-id');
            viewFaculty(facultyId);
        });
    });
    
    document.querySelectorAll('.edit-faculty').forEach(button => {
        button.addEventListener('click', function() {
            const facultyId = this.getAttribute('data-id');
            editFaculty(facultyId);
        });
    });
}

// Update courses list
function updateCoursesList() {
    const coursesList = document.querySelector('.courses-list');
    if (!coursesList) return;
    
    coursesList.innerHTML = '';
    
    hodData.courses.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${course.code}</td>
            <td>${course.name}</td>
            <td>${course.instructor}</td>
            <td>${course.credits}</td>
            <td>${course.students}</td>
            <td><span class="status-badge ${course.status === 'Active' ? 'success' : course.status === 'Pending' ? 'warning' : 'danger'}">${course.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline view-course" data-id="${course.id}">View</button>
                <button class="btn btn-sm btn-primary edit-course" data-id="${course.id}">Edit</button>
            </td>
        `;
        coursesList.appendChild(row);
    });
    
    // Add event listeners to view and edit buttons
    document.querySelectorAll('.view-course').forEach(button => {
        button.addEventListener('click', function() {
            const courseId = this.getAttribute('data-id');
            viewCourse(courseId);
        });
    });
    
    document.querySelectorAll('.edit-course').forEach(button => {
        button.addEventListener('click', function() {
            const courseId = this.getAttribute('data-id');
            editCourse(courseId);
        });
    });
}

// Update students list
function updateStudentsList() {
    const studentsList = document.querySelector('.students-list');
    if (!studentsList) return;
    
    studentsList.innerHTML = '';
    
    hodData.students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.year}</td>
            <td>${student.gpa}</td>
            <td><span class="status-badge ${student.status === 'Excellent' || student.status === 'Good' ? 'success' : student.status === 'Average' ? 'warning' : 'danger'}">${student.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline view-student" data-id="${student.id}">View</button>
            </td>
        `;
        studentsList.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-student').forEach(button => {
        button.addEventListener('click', function() {
            const studentId = this.getAttribute('data-id');
            viewStudent(studentId);
        });
    });
}

// Update timetable
function updateTimetable() {
    const timetableBody = document.querySelector('.timetable-body');
    if (!timetableBody) return;
    
    timetableBody.innerHTML = '';
    
    hodData.timetable.forEach(slot => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="time-slot">${slot.time}</td>
            <td>${slot.monday ? `<div class="course-cell" data-course="${slot.monday}" data-time="${slot.time}" data-day="Monday">${slot.monday}</div>` : '-'}</td>
            <td>${slot.tuesday ? `<div class="course-cell" data-course="${slot.tuesday}" data-time="${slot.time}" data-day="Tuesday">${slot.tuesday}</div>` : '-'}</td>
            <td>${slot.wednesday ? `<div class="course-cell" data-course="${slot.wednesday}" data-time="${slot.time}" data-day="Wednesday">${slot.wednesday}</div>` : '-'}</td>
            <td>${slot.thursday ? `<div class="course-cell" data-course="${slot.thursday}" data-time="${slot.time}" data-day="Thursday">${slot.thursday}</div>` : '-'}</td>
            <td>${slot.friday ? `<div class="course-cell" data-course="${slot.friday}" data-time="${slot.time}" data-day="Friday">${slot.friday}</div>` : '-'}</td>
        `;
        timetableBody.appendChild(row);
    });
    
    // Add event listeners to course cells
    document.querySelectorAll('.course-cell').forEach(cell => {
        cell.addEventListener('click', function() {
            const course = this.getAttribute('data-course');
            const time = this.getAttribute('data-time');
            const day = this.getAttribute('data-day');
            viewTimetableDetails(course, time, day);
        });
    });
}

// Update attendance list
function updateAttendanceList() {
    const attendanceList = document.querySelector('.attendance-list');
    if (!attendanceList) return;
    
    attendanceList.innerHTML = '';
    
    hodData.attendance.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.course}</td>
            <td>${record.instructor}</td>
            <td>${record.totalClasses}</td>
            <td>${record.avgAttendance}</td>
            <td>${record.highest}</td>
            <td>${record.lowest}</td>
            <td>
                <button class="btn btn-sm btn-outline view-attendance" data-course="${record.course}">View Details</button>
            </td>
        `;
        attendanceList.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-attendance').forEach(button => {
        button.addEventListener('click', function() {
            const course = this.getAttribute('data-course');
            viewAttendanceDetails(course);
        });
    });
}

// Update resources list
function updateResourcesList() {
    const resourcesList = document.querySelector('.resources-list');
    if (!resourcesList) return;
    
    resourcesList.innerHTML = '';
    
    hodData.resources.forEach(resource => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${resource.name}</td>
            <td>${resource.type}</td>
            <td>${resource.size}</td>
            <td>${resource.uploadedBy}</td>
            <td>${resource.date}</td>
            <td>
                <button class="btn btn-sm btn-primary download-resource" data-name="${resource.name}">Download</button>
                <button class="btn btn-sm btn-outline view-resource" data-name="${resource.name}">View</button>
            </td>
        `;
        resourcesList.appendChild(row);
    });
    
    // Add event listeners to download and view buttons
    document.querySelectorAll('.download-resource').forEach(button => {
        button.addEventListener('click', function() {
            const resourceName = this.getAttribute('data-name');
            downloadResource(resourceName);
        });
    });
    
    document.querySelectorAll('.view-resource').forEach(button => {
        button.addEventListener('click', function() {
            const resourceName = this.getAttribute('data-name');
            viewResource(resourceName);
        });
    });
}

// Update messages list
function updateMessagesList() {
    const inboxMessages = document.getElementById('inboxMessages');
    const sentMessages = document.getElementById('sentMessages');
    const draftMessages = document.getElementById('draftMessages');
    
    if (inboxMessages) {
        inboxMessages.innerHTML = '';
        hodData.messages.forEach(message => {
            const messageItem = document.createElement('div');
            messageItem.className = `message-item ${message.unread ? 'unread' : ''}`;
            messageItem.innerHTML = `
                <div class="message-sender">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="sender-info">
                        <div class="sender-name">${message.from}</div>
                        <div class="message-time">${message.time}</div>
                    </div>
                </div>
                <div class="message-content">
                    <div class="message-subject">${message.subject}</div>
                    <div class="message-preview">${message.preview}</div>
                </div>
                <div class="message-actions">
                    <button class="btn btn-sm btn-outline view-message" data-id="${message.id}">View</button>
                    <button class="btn btn-sm btn-outline mark-read" data-id="${message.id}">${message.unread ? 'Mark as Read' : 'Archive'}</button>
                </div>
            `;
            inboxMessages.appendChild(messageItem);
        });
        
        // Add event listeners to view and mark as read buttons
        document.querySelectorAll('.view-message').forEach(button => {
            button.addEventListener('click', function() {
                const messageId = this.getAttribute('data-id');
                viewMessage(messageId);
            });
        });
        
        document.querySelectorAll('.mark-read').forEach(button => {
            button.addEventListener('click', function() {
                const messageId = this.getAttribute('data-id');
                markMessageAsRead(messageId);
            });
        });
    }
    
    if (sentMessages) {
        sentMessages.innerHTML = '<div class="empty-message">No sent messages</div>';
    }
    
    if (draftMessages) {
        draftMessages.innerHTML = '<div class="empty-message">No draft messages</div>';
    }
    
    // Update notification badge
    updateNotificationBadge();
}

// Populate instructor dropdowns
function populateInstructorDropdowns() {
    const instructorSelects = document.querySelectorAll('#courseInstructor');
    
    instructorSelects.forEach(select => {
        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add faculty members as options
        hodData.faculty.forEach(faculty => {
            const option = document.createElement('option');
            option.value = faculty.name;
            option.textContent = faculty.name;
            select.appendChild(option);
        });
    });
}

// Populate recipient dropdowns
function populateRecipientDropdowns() {
    const recipientSelects = document.querySelectorAll('#messageTo');
    
    recipientSelects.forEach(select => {
        // Clear existing options except the first ones
        while (select.options.length > 2) {
            select.remove(2);
        }
        
        // Add faculty members as options
        hodData.faculty.forEach(faculty => {
            const option = document.createElement('option');
            option.value = faculty.name;
            option.textContent = faculty.name;
            select.appendChild(option);
        });
        
        // Add students as options
        hodData.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.name;
            option.textContent = student.name;
            select.appendChild(option);
        });
    });
}

// Update notification list
function updateNotificationList() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    notificationList.innerHTML = '';
    
    hodData.notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
        notificationItem.innerHTML = `
            <div class="notification-item-title">${notification.title}</div>
            <div class="notification-item-message">${notification.message}</div>
            <div class="notification-item-time">${notification.time}</div>
        `;
        notificationList.appendChild(notificationItem);
        
        // Add click event to mark as read
        notificationItem.addEventListener('click', function() {
            if (!notification.read) {
                notification.read = true;
                this.classList.remove('unread');
                saveHodDataToStorage();
                updateNotificationBadge();
            }
        });
    });
}

// Update notification badge
function updateNotificationBadge() {
    const unreadCount = hodData.notifications.filter(n => !n.read).length;
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    hodData.notifications.forEach(notification => {
        notification.read = true;
    });
    
    saveHodDataToStorage();
    updateNotificationList();
    updateNotificationBadge();
}

// Open faculty modal
function openFacultyModal() {
    document.getElementById('modalTitle').textContent = 'Add New Faculty';
    document.getElementById('facultyForm').reset();
    document.getElementById('facultyId').value = '';
    document.getElementById('facultyModal').style.display = 'block';
}

// Edit faculty
function editFaculty(facultyId) {
    const faculty = hodData.faculty.find(f => f.id === facultyId);
    if (!faculty) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Faculty';
    document.getElementById('facultyId').value = faculty.id;
    document.getElementById('facultyName').value = faculty.name;
    document.getElementById('facultyPosition').value = faculty.position;
    document.getElementById('facultySpecialization').value = faculty.specialization;
    document.getElementById('facultyCourses').value = faculty.courses;
    document.getElementById('facultyEmail').value = faculty.email;
    document.getElementById('facultyStatus').value = faculty.status;
    document.getElementById('facultyModal').style.display = 'block';
}

// View faculty
function viewFaculty(facultyId) {
    const faculty = hodData.faculty.find(f => f.id === facultyId);
    if (!faculty) return;
    
    // Populate faculty details
    document.getElementById('detailFacultyName').textContent = faculty.name;
    document.getElementById('detailFacultyPosition').textContent = faculty.position;
    document.getElementById('detailFacultySpecialization').textContent = faculty.specialization;
    document.getElementById('detailFacultyCourses').textContent = faculty.courses;
    document.getElementById('detailFacultyEmail').textContent = faculty.email;
    document.getElementById('detailFacultyStatus').textContent = faculty.status;
    
    // Populate faculty courses
    const coursesList = document.querySelector('#facultyCoursesList .courses-list-detail');
    if (coursesList) {
        coursesList.innerHTML = '';
        
        const facultyCourses = hodData.courses.filter(course => course.instructor === faculty.name);
        facultyCourses.forEach(course => {
            const courseItem = document.createElement('li');
            courseItem.textContent = `${course.code} - ${course.name}`;
            coursesList.appendChild(courseItem);
        });
    }
    
    // Add event listener to edit button
    document.querySelector('.edit-faculty-detail').setAttribute('data-id', facultyId);
    document.querySelector('.edit-faculty-detail').addEventListener('click', function() {
        document.getElementById('facultyDetailModal').style.display = 'none';
        editFaculty(facultyId);
    });
    
    // Show modal
    document.getElementById('facultyDetailModal').style.display = 'block';
}

// Save faculty
function saveFaculty() {
    const facultyId = document.getElementById('facultyId').value;
    const facultyData = {
        name: document.getElementById('facultyName').value,
        position: document.getElementById('facultyPosition').value,
        specialization: document.getElementById('facultySpecialization').value,
        courses: parseInt(document.getElementById('facultyCourses').value),
        email: document.getElementById('facultyEmail').value,
        status: document.getElementById('facultyStatus').value
    };
    
    if (facultyId) {
        // Update existing faculty
        const index = hodData.faculty.findIndex(f => f.id === facultyId);
        if (index !== -1) {
            hodData.faculty[index] = { ...hodData.faculty[index], ...facultyData };
        }
    } else {
        // Add new faculty
        facultyData.id = 'fac' + Date.now();
        hodData.faculty.push(facultyData);
    }
    
    // Save to localStorage
    saveHodDataToStorage();
    
    // Update UI
    updateFacultyList();
    populateInstructorDropdowns();
    populateRecipientDropdowns();
    
    // Close modal
    document.getElementById('facultyModal').style.display = 'none';
    
    // Show notification
    showNotification(facultyId ? 'Faculty updated successfully' : 'Faculty added successfully');
}

// Open course modal
function openCourseModal() {
    document.getElementById('courseModalTitle').textContent = 'Add New Course';
    document.getElementById('courseForm').reset();
    document.getElementById('courseId').value = '';
    document.getElementById('courseModal').style.display = 'block';
}

// Edit course
function editCourse(courseId) {
    const course = hodData.courses.find(c => c.id === courseId);
    if (!course) return;
    
    document.getElementById('courseModalTitle').textContent = 'Edit Course';
    document.getElementById('courseId').value = course.id;
    document.getElementById('courseCode').value = course.code;
    document.getElementById('courseName').value = course.name;
    document.getElementById('courseInstructor').value = course.instructor;
    document.getElementById('courseCredits').value = course.credits;
    document.getElementById('courseStudents').value = course.students;
    document.getElementById('courseStatus').value = course.status;
    document.getElementById('courseModal').style.display = 'block';
}

// View course
function viewCourse(courseId) {
    const course = hodData.courses.find(c => c.id === courseId);
    if (!course) return;
    
    // Populate course details
    document.getElementById('detailCourseName').textContent = course.name;
    document.getElementById('detailCourseCode').textContent = course.code;
    document.getElementById('detailCourseInstructor').textContent = course.instructor;
    document.getElementById('detailCourseCredits').textContent = course.credits;
    document.getElementById('detailCourseStudents').textContent = course.students;
    document.getElementById('detailCourseStatus').textContent = course.status;
    
    // Populate course statistics
    if (course.avgGrade) {
        document.getElementById('detailCourseAvgGrade').textContent = course.avgGrade;
    }
    if (course.passRate) {
        document.getElementById('detailCoursePassRate').textContent = course.passRate;
    }
    if (course.attendance) {
        document.getElementById('detailCourseAttendance').textContent = course.attendance;
    }
    
    // Add event listener to edit button
    document.querySelector('.edit-course-detail').setAttribute('data-id', courseId);
    document.querySelector('.edit-course-detail').addEventListener('click', function() {
        document.getElementById('courseDetailModal').style.display = 'none';
        editCourse(courseId);
    });
    
    // Show modal
    document.getElementById('courseDetailModal').style.display = 'block';
}

// Save course
function saveCourse() {
    const courseId = document.getElementById('courseId').value;
    const courseData = {
        code: document.getElementById('courseCode').value,
        name: document.getElementById('courseName').value,
        instructor: document.getElementById('courseInstructor').value,
        credits: parseInt(document.getElementById('courseCredits').value),
        students: parseInt(document.getElementById('courseStudents').value),
        status: document.getElementById('courseStatus').value
    };
    
    if (courseId) {
        // Update existing course
        const index = hodData.courses.findIndex(c => c.id === courseId);
        if (index !== -1) {
            hodData.courses[index] = { ...hodData.courses[index], ...courseData };
        }
    } else {
        // Add new course
        courseData.id = 'course' + Date.now();
        hodData.courses.push(courseData);
    }
    
    // Save to localStorage
    saveHodDataToStorage();
    
    // Update UI
    updateCoursesList();
    
    // Close modal
    document.getElementById('courseModal').style.display = 'none';
    
    // Show notification
    showNotification(courseId ? 'Course updated successfully' : 'Course added successfully');
}

// View student
function viewStudent(studentId) {
    const student = hodData.students.find(s => s.id === studentId);
    if (!student) return;
    
    // Populate student details
    document.getElementById('detailStudentName').textContent = student.name;
    document.getElementById('detailStudentId').textContent = student.id;
    document.getElementById('detailStudentYear').textContent = student.year;
    document.getElementById('detailStudentGpa').textContent = student.gpa;
    document.getElementById('detailStudentStatus').textContent = student.status;
    
    // Populate student courses
    const coursesList = document.querySelector('#studentCoursesList .courses-list-detail');
    if (coursesList) {
        coursesList.innerHTML = '';
        
        if (student.courses && student.courses.length > 0) {
            student.courses.forEach(courseName => {
                const course = hodData.courses.find(c => c.name === courseName);
                if (course) {
                    const courseItem = document.createElement('li');
                    courseItem.textContent = `${course.code} - ${course.name}`;
                    coursesList.appendChild(courseItem);
                }
            });
        } else {
            coursesList.innerHTML = '<li>No courses enrolled</li>';
        }
    }
    
    // Add event listener to contact button
    document.querySelector('.contact-student').setAttribute('data-id', studentId);
    document.querySelector('.contact-student').addEventListener('click', function() {
        document.getElementById('studentDetailModal').style.display = 'none';
        contactStudent(studentId);
    });
    
    // Show modal
    document.getElementById('studentDetailModal').style.display = 'block';
    
    // Draw performance chart
    drawStudentPerformanceChart(student);
}

// View attendance details
function viewAttendanceDetails(course) {
    const attendance = hodData.attendance.find(a => a.course === course);
    if (!attendance) return;
    
    // Populate attendance details
    document.getElementById('detailAttendanceCourse').textContent = attendance.course;
    document.getElementById('detailAttendanceInstructor').textContent = attendance.instructor;
    document.getElementById('detailAttendanceTotal').textContent = attendance.totalClasses;
    document.getElementById('detailAttendanceAvg').textContent = attendance.avgAttendance;
    document.getElementById('detailAttendanceHighest').textContent = attendance.highest;
    document.getElementById('detailAttendanceLowest').textContent = attendance.lowest;
    
    // Populate low attendance students
    const lowAttendanceStudents = document.querySelector('.low-attendance-students');
    if (lowAttendanceStudents) {
        lowAttendanceStudents.innerHTML = '';
        
        // Generate some sample students with low attendance
        const sampleStudents = [
            { name: "John Smith", attendance: "65%" },
            { name: "Emma Johnson", attendance: "68%" },
            { name: "Michael Brown", attendance: "70%" }
        ];
        
        sampleStudents.forEach(student => {
            const studentItem = document.createElement('div');
            studentItem.className = 'low-attendance-student';
            studentItem.innerHTML = `
                <div class="student-name">${student.name}</div>
                <div class="student-attendance">${student.attendance}</div>
            `;
            lowAttendanceStudents.appendChild(studentItem);
        });
    }
    
    // Show modal
    document.getElementById('attendanceDetailModal').style.display = 'block';
    
    // Draw attendance chart
    drawAttendanceChart(attendance);
}

// View timetable details
function viewTimetableDetails(course, time, day) {
    // Populate timetable details
    document.getElementById('detailTimetableCourse').textContent = course;
    document.getElementById('detailTimetableTime').textContent = time;
    document.getElementById('detailTimetableDay').textContent = day;
    
    // Get instructor for this course
    const courseData = hodData.courses.find(c => c.name === course);
    if (courseData) {
        document.getElementById('detailTimetableInstructor').textContent = courseData.instructor;
    } else {
        document.getElementById('detailTimetableInstructor').textContent = 'Not assigned';
    }
    
    // Set a sample room
    document.getElementById('detailTimetableRoom').textContent = 'Room ' + Math.floor(Math.random() * 300 + 100);
    
    // Populate students list
    const studentsList = document.querySelector('.students-list-timetable');
    if (studentsList) {
        studentsList.innerHTML = '';
        
        // Generate some sample students
        const sampleStudents = [
            "Alex Johnson",
            "Sarah Williams",
            "Michael Brown",
            "Emily Davis",
            "David Wilson"
        ];
        
        sampleStudents.forEach(studentName => {
            const studentItem = document.createElement('div');
            studentItem.className = 'timetable-student';
            studentItem.textContent = studentName;
            studentsList.appendChild(studentItem);
        });
    }
    
    // Add event listener to edit button
    document.querySelector('.edit-timetable').addEventListener('click', function() {
        document.getElementById('timetableDetailModal').style.display = 'none';
        editTimetable(course, time, day);
    });
    
    // Show modal
    document.getElementById('timetableDetailModal').style.display = 'block';
}

// View message
function viewMessage(messageId) {
    const message = hodData.messages.find(m => m.id === messageId);
    if (!message) return;
    
    // Populate message details
    document.getElementById('detailMessageFrom').textContent = message.from;
    document.getElementById('detailMessageDate').textContent = message.time;
    document.getElementById('detailMessageSubject').textContent = message.subject;
    document.getElementById('detailMessageContent').textContent = message.content;
    
    // Add event listeners to action buttons
    document.querySelector('.reply-message-detail').setAttribute('data-id', messageId);
    document.querySelector('.reply-message-detail').addEventListener('click', function() {
        document.getElementById('messageDetailModal').style.display = 'none';
        replyToMessage(messageId);
    });
    
    document.querySelector('.forward-message-detail').setAttribute('data-id', messageId);
    document.querySelector('.forward-message-detail').addEventListener('click', function() {
        document.getElementById('messageDetailModal').style.display = 'none';
        forwardMessage(messageId);
    });
    
    document.querySelector('.delete-message-detail').setAttribute('data-id', messageId);
    document.querySelector('.delete-message-detail').addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this message?')) {
            deleteMessage(messageId);
            document.getElementById('messageDetailModal').style.display = 'none';
        }
    });
    
    // Mark as read if unread
    if (message.unread) {
        message.unread = false;
        saveHodDataToStorage();
        updateMessagesList();
    }
    
    // Show modal
    document.getElementById('messageDetailModal').style.display = 'block';
}

// Open resource modal
function openResourceModal() {
    document.getElementById('resourceForm').reset();
    document.getElementById('resourceModal').style.display = 'block';
}

// Upload resource
function uploadResource() {
    const resourceName = document.getElementById('resourceName').value;
    const resourceType = document.getElementById('resourceType').value;
    const resourceFile = document.getElementById('resourceFile').files[0];
    
    if (!resourceFile) {
        alert('Please select a file to upload');
        return;
    }
    
    // Calculate file size
    const fileSize = (resourceFile.size / (1024 * 1024)).toFixed(2) + ' MB';
    
    // Add new resource
    const newResource = {
        name: resourceName,
        type: resourceType,
        size: fileSize,
        uploadedBy: hodData.name,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    };
    
    hodData.resources.push(newResource);
    
    // Save to localStorage
    saveHodDataToStorage();
    
    // Update UI
    updateResourcesList();
    
    // Close modal
    document.getElementById('resourceModal').style.display = 'none';
    
    // Show notification
    showNotification('Resource uploaded successfully');
}

// Download resource
function downloadResource(resourceName) {
    const resource = hodData.resources.find(r => r.name === resourceName);
    if (!resource) return;
    
    // In a real application, this would initiate a file download
    showNotification(`Downloading ${resource.name}...`);
    
    // Simulate download
    setTimeout(() => {
        showNotification(`${resource.name} downloaded successfully`);
    }, 1500);
}

// View resource
function viewResource(resourceName) {
    const resource = hodData.resources.find(r => r.name === resourceName);
    if (!resource) return;
    
    // In a real application, this would open the resource in a viewer
    showNotification(`Opening ${resource.name}...`);
    
    // Simulate opening
    setTimeout(() => {
        showNotification(`${resource.name} opened successfully`);
    }, 1500);
}

// Open message modal
function openMessageModal() {
    document.getElementById('messageForm').reset();
    document.getElementById('messageModal').style.display = 'block';
}

// Reply to message
function replyToMessage(messageId) {
    const message = hodData.messages.find(m => m.id === messageId);
    if (!message) return;
    
    // Open message modal with pre-filled data
    document.getElementById('messageTo').value = message.from;
    document.getElementById('messageSubject').value = `Re: ${message.subject}`;
    document.getElementById('messageContent').value = `\n\n--- Original Message ---\nFrom: ${message.from}\nSubject: ${message.subject}\n\n${message.content}`;
    document.getElementById('messageModal').style.display = 'block';
}

// Forward message
function forwardMessage(messageId) {
    const message = hodData.messages.find(m => m.id === messageId);
    if (!message) return;
    
    // Open message modal with pre-filled data
    document.getElementById('messageTo').value = '';
    document.getElementById('messageSubject').value = `Fwd: ${message.subject}`;
    document.getElementById('messageContent').value = `\n\n--- Forwarded Message ---\nFrom: ${message.from}\nSubject: ${message.subject}\n\n${message.content}`;
    document.getElementById('messageModal').style.display = 'block';
}

// Delete message
function deleteMessage(messageId) {
    const index = hodData.messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
        hodData.messages.splice(index, 1);
        saveHodDataToStorage();
        updateMessagesList();
        showNotification('Message deleted successfully');
    }
}

// Mark message as read
function markMessageAsRead(messageId) {
    const message = hodData.messages.find(m => m.id === messageId);
    if (!message) return;
    
    message.unread = false;
    
    // Save to localStorage
    saveHodDataToStorage();
    
    // Update UI
    updateMessagesList();
    
    // Show notification
    showNotification('Message marked as read');
}

// Send message
function sendMessage() {
    const recipient = document.getElementById('messageTo').value;
    const subject = document.getElementById('messageSubject').value;
    const content = document.getElementById('messageContent').value;
    
    // In a real application, this would send the message
    showNotification('Sending message...');
    
    // Simulate sending
    setTimeout(() => {
        showNotification('Message sent successfully');
        document.getElementById('messageModal').style.display = 'none';
    }, 1500);
}

// Contact student
function contactStudent(studentId) {
    const student = hodData.students.find(s => s.id === studentId);
    if (!student) return;
    
    // Open message modal with pre-filled data
    document.getElementById('messageTo').value = student.name;
    document.getElementById('messageSubject').value = 'Regarding Your Academic Performance';
    document.getElementById('messageContent').value = `Dear ${student.name},\n\nI would like to discuss your academic performance and progress in the department.\n\nBest regards,\nDr. Priya Singh\nHOD, Computer Engineering`;
    document.getElementById('messageModal').style.display = 'block';
}

// Generate timetable
function generateTimetable() {
    const semester = document.getElementById('semesterSelect').value;
    
    // In a real application, this would generate a new timetable
    showNotification(`Generating timetable for ${semester}...`);
    
    // Simulate generation
    setTimeout(() => {
        showNotification('Timetable generated successfully');
    }, 1500);
}

// Edit timetable
function editTimetable(course, time, day) {
    // In a real application, this would open a modal to edit the timetable
    showNotification(`Editing timetable for ${course} on ${day} at ${time}...`);
    
    // Simulate editing
    setTimeout(() => {
        showNotification('Timetable updated successfully');
    }, 1500);
}

// Generate report
function generateReport() {
    // In a real application, this would generate a report
    showNotification('Generating report...');
    
    // Simulate generation
    setTimeout(() => {
        showNotification('Report generated successfully');
    }, 1500);
}

// Generate custom report
function generateCustomReport() {
    const reportType = document.getElementById('reportType').value;
    const reportFormat = document.getElementById('reportFormat').value;
    const reportDateRange = document.getElementById('reportDateRange').value;
    
    // In a real application, this would generate a custom report
    showNotification(`Generating ${reportType} report in ${reportFormat} format for ${reportDateRange}...`);
    
    // Simulate generation
    setTimeout(() => {
        showNotification(`${reportType} report generated successfully`);
    }, 1500);
}

// Export attendance report
function exportAttendanceReport() {
    // In a real application, this would export an attendance report
    showNotification('Exporting attendance report...');
    
    // Simulate export
    setTimeout(() => {
        showNotification('Attendance report exported successfully');
    }, 1500);
}

// Draw student performance chart
function drawStudentPerformanceChart(student) {
    const canvas = document.getElementById('studentPerformanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sample data for the chart
    const data = [
        { semester: 'Sem 1', gpa: 3.2 },
        { semester: 'Sem 2', gpa: 3.4 },
        { semester: 'Sem 3', gpa: 3.5 },
        { semester: 'Sem 4', gpa: 3.6 },
        { semester: 'Sem 5', gpa: 3.7 },
        { semester: 'Sem 6', gpa: student.gpa }
    ];
    
    // Chart dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Find max GPA for scaling
    const maxGpa = 4.0;
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#ddd';
    ctx.stroke();
    
    // Draw grid lines and labels
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = height - padding - (i / gridLines) * chartHeight;
        const gpaValue = (i / gridLines) * maxGpa;
        
        // Grid line
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.strokeStyle = '#f0f0f0';
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#666';
        ctx.font = '12px Poppins';
        ctx.textAlign = 'right';
        ctx.fillText(gpaValue.toFixed(1), padding - 5, y + 4);
    }
    
    // Draw data points and lines
    const barWidth = chartWidth / data.length;
    
    ctx.beginPath();
    ctx.moveTo(padding + barWidth / 2, height - padding - (data[0].gpa / maxGpa) * chartHeight);
    
    for (let i = 0; i < data.length; i++) {
        const x = padding + (i + 0.5) * barWidth;
        const y = height - padding - (data[i].gpa / maxGpa) * chartHeight;
        
        // Line
        if (i > 0) {
            const prevX = padding + (i - 0.5) * barWidth;
            const prevY = height - padding - (data[i - 1].gpa / maxGpa) * chartHeight;
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
        }
        
        // Point
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00897b';
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#666';
        ctx.font = '12px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText(data[i].semester, x, height - padding + 20);
    }
    
    // Draw line
    ctx.strokeStyle = '#00897b';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Chart title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('GPA Progression', width / 2, 20);
}

// Draw attendance chart
function drawAttendanceChart(attendance) {
    const canvas = document.getElementById('attendanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sample data for the chart
    const data = [
        { week: 'Week 1', attendance: 92 },
        { week: 'Week 2', attendance: 88 },
        { week: 'Week 3', attendance: 85 },
        { week: 'Week 4', attendance: 90 },
        { week: 'Week 5', attendance: 87 },
        { week: 'Week 6', attendance: 89 }
    ];
    
    // Chart dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Find max attendance for scaling
    const maxAttendance = 100;
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#ddd';
    ctx.stroke();
    
    // Draw grid lines and labels
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = height - padding - (i / gridLines) * chartHeight;
        const attendanceValue = (i / gridLines) * maxAttendance;
        
        // Grid line
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.strokeStyle = '#f0f0f0';
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#666';
        ctx.font = '12px Poppins';
        ctx.textAlign = 'right';
        ctx.fillText(attendanceValue + '%', padding - 5, y + 4);
    }
    
    // Draw bars
    const barWidth = chartWidth / data.length * 0.6;
    const barSpacing = chartWidth / data.length * 0.4;
    
    for (let i = 0; i < data.length; i++) {
        const x = padding + i * (barWidth + barSpacing) + barSpacing / 2;
        const barHeight = (data[i].attendance / maxAttendance) * chartHeight;
        const y = height - padding - barHeight;
        
        // Bar
        ctx.fillStyle = data[i].attendance < 80 ? '#F44336' : '#00897b';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Value label
        ctx.fillStyle = '#333';
        ctx.font = '12px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText(data[i].attendance + '%', x + barWidth / 2, y - 5);
        
        // Week label
        ctx.fillText(data[i].week, x + barWidth / 2, height - padding + 20);
    }
    
    // Chart title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('Weekly Attendance Trend', width / 2, 20);
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    // Add styles
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#fff';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    notification.style.zIndex = '1000';
    notification.style.minWidth = '300px';
    notification.style.animation = 'slideIn 0.3s ease';
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Add close functionality
    notification.querySelector('.toast-close').addEventListener('click', function() {
        notification.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Add animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-toast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px;
        border-left: 4px solid var(--primary-color);
    }
    
    .toast-content {
        display: flex;
        align-items: center;
    }
    
    .toast-content i {
        margin-right: 10px;
        color: var(--primary-color);
    }
    
    .toast-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
    }
    
    .empty-message {
        text-align: center;
        padding: 20px;
        color: #666;
        font-style: italic;
    }
    
    .detail-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .detail-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .detail-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: rgba(0, 137, 123, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: var(--primary-color);
    }
    
    .detail-info h3 {
        font-size: 1.3rem;
        color: var(--dark-color);
        margin-bottom: 0.3rem;
    }
    
    .detail-info p {
        color: #666;
    }
    
    .detail-row {
        display: flex;
        margin-bottom: 0.8rem;
    }
    
    .detail-label {
        font-weight: 500;
        color: #555;
        width: 150px;
        flex-shrink: 0;
    }
    
    .stats-grid-mini {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .stat-card-mini {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
    }
    
    .stat-card-mini .stat-card-title {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 0.5rem;
    }
    
    .stat-card-mini .stat-card-value {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--primary-color);
    }
    
    .courses-list-detail {
        list-style-type: none;
        padding-left: 0;
    }
    
    .courses-list-detail li {
        padding: 0.5rem 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .courses-list-detail li:last-child {
        border-bottom: none;
    }
    
    .performance-chart, .attendance-chart-container {
        width: 100%;
        height: 200px;
        margin-top: 1rem;
    }
    
    .low-attendance-students {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .low-attendance-student {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
    }
    
    .student-name {
        font-weight: 500;
        margin-bottom: 0.5rem;
    }
    
    .student-attendance {
        color: #F44336;
        font-weight: bold;
    }
    
    .students-list-timetable {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
        margin-top: 1rem;
    }
    
    .timetable-student {
        background-color: #f9f9f9;
        border-radius: 4px;
        padding: 0.5rem;
        text-align: center;
        font-size: 0.9rem;
    }
    
    .message-detail-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .message-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
    }
    
    .message-from, .message-date {
        font-weight: 500;
    }
    
    .message-subject {
        font-weight: 600;
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    
    .message-content {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 1rem;
        line-height: 1.6;
    }
    
    .timetable-detail-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .timetable-info {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .info-row {
        display: flex;
        margin-bottom: 0.8rem;
    }
    
    .info-label {
        font-weight: 500;
        color: #555;
        width: 100px;
        flex-shrink: 0;
    }
    
    .attendance-detail-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .attendance-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
    }
    
    .attendance-course, .attendance-instructor {
        font-weight: 600;
    }
    
    .attendance-stats {
        margin-bottom: 1rem;
    }
`;
document.head.appendChild(style);