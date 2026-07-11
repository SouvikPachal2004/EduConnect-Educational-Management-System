//  Authentication 
function checkAuthentication() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    if (!authToken || !currentUser) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const user = JSON.parse(currentUser);
        if (user.role !== 'hod') {
            const dashboards = {
                'student': 'student-dashboard.html',
                'teacher': 'teacher-dashboard.html',
                'admin': 'admin-dashboard.html',
                'managing_authority': 'managing-authority.html'
            };
            window.location.href = dashboards[user.role] || 'login.html';
            return;
        }
        // Update sidebar with real user info
        updateHodSidebarInfo(user);
    } catch (e) {
        console.error('Auth error:', e);
        window.location.href = 'login.html';
    }
}

function updateHodSidebarInfo(user) {
    const nameEl    = document.getElementById('hodName') || document.querySelector('.user-info h3');
    const deptEl    = document.getElementById('hodDept');
    const programEl = document.getElementById('hodProgram');

    if (nameEl) nameEl.textContent = user.name || 'HOD';
    if (deptEl) deptEl.textContent = 'HOD: ' + (user.department || 'Department');

    // Show program name above department
    if (programEl) {
        const dept = (user.department || '').toUpperCase();
        let prog = 'B.Tech';
        if (dept.includes('BCA')) prog = 'BCA';
        else if (dept.includes('MCA')) prog = 'MCA';
        programEl.textContent = prog;
    }

    // Update header welcome message
    const headerTitle = document.querySelector('.page-title p');
    if (headerTitle) {
        headerTitle.textContent = `Welcome back, ${user.name}! Here's what's happening in your department.`;
    }
}

//  API Helper 
const API_BASE = '/api';

function apiGet(endpoint) {
    const token = localStorage.getItem('authToken');
    return fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }).then(r => r.json());
}

function apiPost(endpoint, body) {
    const token = localStorage.getItem('authToken');
    return fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(r => r.json());
}

//  Load Dynamic Data from Backend 
function loadDynamicData() {
    // Load dashboard stats + students + courses (subjects with class info) together
    Promise.all([
        apiGet('/hod/dashboard').catch(() => ({ success: false })),
        apiGet('/hod/students').catch(() => ({ success: false })),
        apiGet('/hod/courses').catch(() => ({ success: false }))   // uses Subject model  has credits + student count
    ]).then(([dashData, studData, courseData]) => {
        //  Overview top-4 stat boxes 
        const stats = dashData.success ? dashData.data.stats : {};
        const facultyCount = stats.teacherCount || 0;
        const studentCount = stats.studentCount || 0;
        const courses = courseData.success ? (courseData.data.courses || []) : [];
        const coursesCount = courses.length;

        //  Compute CGPA from User.grade field (stored directly on User model, 0-10 scale) 
        const students = studData.success ? (studData.data.students || []) : [];
        const withCgpa = students.filter(s => s.grade != null && s.grade > 0);
        const totalCgpa = withCgpa.reduce((sum, s) => sum + s.grade, 0);
        const totalStudentsWithGrades = withCgpa.length;
        const avgCgpa = totalStudentsWithGrades > 0
            ? (totalCgpa / totalStudentsWithGrades).toFixed(2)
            : 'N/A';
        const atRisk = students.filter(s => s.grade != null && s.grade < 7.0).length;
        const safe   = students.filter(s => s.grade != null && s.grade > 8.0).length;

        //  Overview 4 stat boxes 
        if (document.getElementById('overviewFacultyCount')) {
            document.getElementById('overviewFacultyCount').textContent = facultyCount;
            document.getElementById('overviewFacultyLabel').textContent = `${facultyCount} total faculty`;
            document.getElementById('overviewStudentsCount').textContent = studentCount;
            document.getElementById('overviewStudentsLabel').textContent = `${studentCount} enrolled`;
            document.getElementById('overviewCoursesCount').textContent = coursesCount;
            document.getElementById('overviewCoursesLabel').textContent = `${coursesCount} active courses`;
            document.getElementById('overviewAvgCgpa').textContent = avgCgpa;
            document.getElementById('overviewCgpaLabel').textContent = avgCgpa !== 'N/A'
                ? `Total ${totalCgpa.toFixed(2)} / ${totalStudentsWithGrades} students`
                : 'No grade data yet';
        }

        //  Student Performance 4 boxes 
        if (document.getElementById('perfTotalStudents')) {
            document.getElementById('perfTotalStudents').textContent = studentCount;
            document.getElementById('perfAvgCgpa').textContent = avgCgpa;
            document.getElementById('perfCgpaLabel').textContent = avgCgpa !== 'N/A'
                ? `Total ${totalCgpa.toFixed(2)} / ${totalStudentsWithGrades} students`
                : 'No grade data yet';
            document.getElementById('perfAtRisk').textContent = atRisk;
            document.getElementById('perfSafe').textContent = safe;
        }

        //  Build a teacher  course count map (stringify IDs for safe comparison) 
        const teacherCourseCount = {};
        courses.forEach(c => {
            if (c.teacher && c.teacher._id) {
                const tid = String(c.teacher._id);
                teacherCourseCount[tid] = (teacherCourseCount[tid] || 0) + 1;
            }
        });

        //  hodData.students  use User.grade directly 
        hodData._rawStudents = students; // store raw for semesterCgpas access
        hodData.students = students.map(s => {
            const cgpa = s.grade || 0;
            return {
                id: s.studentId || s._id,
                _mongoId: String(s._id),   //  MongoDB _id for API calls (messaging etc.)
                name: s.name,
                email: s.email || 'N/A',
                gpa: cgpa,
                status: cgpa >= 8 ? 'Excellent' : cgpa >= 7 ? 'Good' : cgpa >= 6 ? 'Average' : 'At Risk',
                courses: []
            };
        });
        updateStudentsList();
        populateRecipientDropdowns();

        //  hodData.courses  from backend (Subject or Class model) 
        hodData.courses = courses.map(c => ({
            id: String(c._id),
            name: c.name,
            code: c.code || '',
            instructor: c.teacher ? c.teacher.name : 'Unassigned',
            instructorId: c.teacher ? String(c.teacher._id) : null,
            credits: c.credits || 3,
            students: c.students || 0,
            status: c.status || 'Active',
            source: c.source || 'class',  //  preserve source field
            avgGrade: 'N/A',
            passRate: 'N/A',
            attendance: 'N/A'
        }));
        updateCoursesList();
        loadDeptPerformanceTable(hodData.courses);

        // Load faculty  after courses are known, update their course counts
        apiGet('/hod/teachers').then(tData => {
            if (tData.success && tData.data.teachers) {
                hodData.faculty = tData.data.teachers.map(t => ({
                    id: String(t._id),
                    name: t.name,
                    position: t.role === 'hod' ? 'Head of Department' : 'Faculty',
                    specialization: t.department || 'N/A',
                    courses: teacherCourseCount[String(t._id)] || 0,  //  stringify for safe key match
                    email: t.email,
                    status: t.isActive ? 'Active' : 'Inactive'
                }));
                updateFacultyList();
                populateInstructorDropdowns();
                populateRecipientDropdowns();
            }
        }).catch(err => console.error('Faculty load error:', err));

    }).catch(err => console.error('loadDynamicData error:', err));

    // Load attendance from API
    apiGet('/hod/attendance').then(data => {
        if (data.success && data.data.attendanceSummary) {
            hodData.attendance = data.data.attendanceSummary.map(a => ({
                course: a.className,
                instructor: 'N/A',
                totalClasses: a.total,
                avgAttendance: `${a.rate}%`,
                highest: `${a.rate}%`,
                lowest: `${Math.max(0, a.rate - 15)}%`
            }));
            updateAttendanceList();
        }
    }).catch(err => console.error('Attendance load error:', err));

    // Load messages from API
    apiGet('/messages?folder=inbox').then(data => {
        if (data.success && data.data.messages) {
            hodData.messages = data.data.messages.map(m => ({
                id: m._id,
                _mongoId: String(m._id),
                _senderId: m.sender ? String(m.sender._id || m.sender) : null,
                from: m.sender ? m.sender.name : 'Unknown',
                subject: m.subject || 'No Subject',
                preview: (m.content || '').substring(0, 80) + '...',
                time: new Date(m.createdAt).toLocaleDateString(),
                unread: !m.isRead,
                content: m.content || ''
            }));
            updateMessagesList();
        }
    }).catch(err => console.error('Messages load error:', err));

    // Load department events (HOD's own approved/pending event requests)
    loadDeptEventsTable();
}

//  Department Performance Table (overview section) 
function loadDeptPerformanceTable(courses) {
    const tbody = document.getElementById('deptPerformanceBody');
    if (!tbody) return;

    if (!courses || !courses.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No courses found.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    courses.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${c.name}</td>
            <td>${c.instructor}</td>
            <td>${c.students}</td>
            <td>${c.avgGrade}</td>
            <td>${c.passRate}</td>
        `;
        tbody.appendChild(row);
    });
}

//  Department Events Table (overview section) 
function loadDeptEventsTable() {
    const tbody = document.getElementById('deptEventsBody');
    if (!tbody) return;

    const eventTypes = ['fest', 'freshers_welcome', 'club', 'introductory_session', 'other'];
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    apiGet('/approvals?limit=100').then(data => {
        const all = data.success ? (data.data?.requests || []) : [];
        const events = all.filter(r =>
            eventTypes.includes(r.requestType) &&
            r.requestedBy && r.requestedBy._id === currentUser.id
        );

        tbody.innerHTML = '';

        if (!events.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No department events yet. Use the Events section to request one.</td></tr>';
            return;
        }

        events.forEach(req => {
            const ed = req.eventData || {};
            const rawDate = req.metadata?.approvedDate || ed.eventDate;
            const displayDate = rawDate
                ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'TBD';
            const statusBadge = req.status === 'approved'
                ? '<span class="status-badge success">Approved</span>'
                : req.status === 'rejected'
                    ? '<span class="status-badge danger">Rejected</span>'
                    : '<span class="status-badge warning">Pending</span>';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${req.title}</td>
                <td>${displayDate}</td>
                <td>${ed.venue || 'TBD'}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(row);
        });
    }).catch(() => {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading events.</td></tr>';
    });
}

//  HOD (Head of Department) data 
const hodData = {
    name: "HOD",
    id: "",
    department: "",
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
    // Check authentication first
    checkAuthentication();
    
    // Load dynamic data from backend
    loadDynamicData();
    
    // Initialize all event listeners
    initializeEventListeners();
    
    // Initialize dashboard
    initializeDashboard();
    
    // Load data from localStorage if available
    loadHodDataFromStorage();
    
    // Notification dropdown is now handled by notifications.js
    // initializeNotificationDropdown(); // Disabled to prevent duplicate panels
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

            // Refresh data when navigating to these sections
            if (sectionId === 'courses') refreshCourses();
            if (sectionId === 'faculty') refreshCourses(); // keeps course count fresh
            
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });
    });

    // Logout functionality
    document.querySelector('.logout-btn').addEventListener('click', function() {
        if(confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('hodData');
            window.location.href = 'login.html';
        }
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

    // Generate report button
    document.getElementById('generateReportBtn').addEventListener('click', function() {
        generateReport();
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

            // Load data for the selected tab
            if (tabId === 'sent') {
                loadSentMessages();
            }
        });
    });

    // Mark all notifications as read
    document.querySelector('.mark-all-read').addEventListener('click', function() {
        markAllNotificationsAsRead();
    });
}

// Initialize notification dropdown
// Notification dropdown is now handled by the unified notification system (notifications.js)
// The following function has been disabled to prevent duplicate notification panels
/*
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
*/

// Initialize dashboard
function initializeDashboard() {
    // Load faculty data from API
    loadFacultyDataFromAPI();
    
    // Update courses list
    updateCoursesList();
    
    // Update students list
    updateStudentsList();
    
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

// Load faculty data from API
function loadFacultyDataFromAPI() {
    // Faculty is now loaded inside loadDynamicData() with correct course counts.
    // This function is kept as a no-op fallback to avoid breaking existing call sites.
    // updateFacultyList() will be called after subjects + teachers are both resolved.
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
            </td>
        `;
        facultyList.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-faculty').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Faculty details are managed by Admin panel');
        });
    });
}

// Update courses list
function updateCoursesList() {
    const coursesList = document.querySelector('.courses-list');
    if (!coursesList) return;
    
    console.log(' Rendering courses list with data:', hodData.courses);
    coursesList.innerHTML = '';
    
    hodData.courses.forEach(course => {
        console.log(`  - Rendering course: ${course.code} - ${course.name}`);
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
    
    console.log(' Course list rendered successfully');
    
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
            <td>${student.email}</td>
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
        if (hodData.messages.length === 0) {
            inboxMessages.innerHTML = '<div class="empty-message">No inbox messages</div>';
        } else {
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
    }
    
    if (sentMessages) {
        // Show loading state, then fetch from API
        sentMessages.innerHTML = '<div class="empty-message">Loading sent messages...</div>';
        loadSentMessages();
    }
    
    if (draftMessages) {
        draftMessages.innerHTML = '<div class="empty-message">No draft messages</div>';
    }
    
    // Update notification badge
    updateNotificationBadge();
}

// Load sent messages from API
async function loadSentMessages() {
    const sentMessages = document.getElementById('sentMessages');
    if (!sentMessages) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages?folder=sent&limit=50', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.data.messages && data.data.messages.length > 0) {
            sentMessages.innerHTML = '';

            // For each sent message, check reply count
            for (const msg of data.data.messages) {
                const recipientNames = (msg.recipients || []).map(r => r.name || r.email || 'Unknown');
                const recipientDisplay = recipientNames.length > 3
                    ? `${recipientNames.slice(0, 3).join(', ')} +${recipientNames.length - 3} more`
                    : recipientNames.join(', ') || 'Unknown';

                const sentTime = new Date(msg.createdAt).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                // Fetch reply count for this message
                let replyBadge = '';
                try {
                    const rRes = await fetch(`/api/messages/${msg._id}/replies`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const rData = await rRes.json();
                    if (rData.success && rData.data && rData.data.length > 0) {
                        replyBadge = `<span style="display:inline-block; background:#6c5ce7; color:#fff; border-radius:20px; padding:0.2rem 0.6rem; font-size:0.75rem; font-weight:600; margin-left:0.5rem;">
                            <i class="fas fa-reply"></i> ${rData.data.length} repl${rData.data.length === 1 ? 'y' : 'ies'}
                        </span>`;
                    }
                } catch (_) {}

                const item = document.createElement('div');
                item.className = 'message-item';
                item.innerHTML = `
                    <div class="message-sender">
                        <div class="user-avatar" style="background: linear-gradient(135deg, #11998e, #38ef7d);">
                            <i class="fas fa-paper-plane"></i>
                        </div>
                        <div class="sender-info">
                            <div class="sender-name">To: <strong>${recipientDisplay}</strong>${replyBadge}</div>
                            <div class="message-time">${sentTime}</div>
                        </div>
                    </div>
                    <div class="message-content">
                        <div class="message-subject">${msg.subject || 'No Subject'}</div>
                        <div class="message-preview">${(msg.content || '').substring(0, 80)}...</div>
                    </div>
                    <div class="message-actions">
                        <button class="btn btn-sm btn-outline" onclick="viewSentMessage('${msg._id}')">View</button>
                    </div>
                `;
                sentMessages.appendChild(item);
            }
        } else {
            sentMessages.innerHTML = '<div class="empty-message">No sent messages</div>';
        }
    } catch (err) {
        console.error('Load sent messages error:', err);
        sentMessages.innerHTML = '<div class="empty-message">Failed to load sent messages</div>';
    }
}

//  Shared: open message detail modal with thread 
let _currentDetailMsgId = null;   // tracks which message is open for reply

function _resetDetailModal() {
    document.getElementById('replyThread').style.display = 'none';
    document.getElementById('replyThreadList').innerHTML = '';
    document.getElementById('replyBox').style.display = 'none';
    document.getElementById('replyContent').value = '';
    const replyBtn = document.getElementById('replyBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    if (replyBtn) replyBtn.style.display = '';
    if (deleteBtn) deleteBtn.style.display = '';
}

async function _loadReplies(msgId) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/messages/${msgId}/replies`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success || !data.data || data.data.length === 0) return;

        const threadEl = document.getElementById('replyThread');
        const listEl = document.getElementById('replyThreadList');
        threadEl.style.display = 'block';

        listEl.innerHTML = data.data.map(reply => {
            const senderName = reply.sender ? reply.sender.name : 'Unknown';
            const time = new Date(reply.createdAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            return `
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:0.85rem; border-left:4px solid #667eea;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
                        <strong style="color:#667eea; font-size:0.9rem;">${senderName}</strong>
                        <span style="color:#94a3b8; font-size:0.8rem;">${time}</span>
                    </div>
                    <p style="margin:0; white-space:pre-wrap; font-size:0.9rem; color:#374151;">${reply.content}</p>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Load replies error:', err);
    }
}

// View a sent message details
async function viewSentMessage(msgId) {
    const detailModal = document.getElementById('messageDetailModal');
    if (!detailModal) return;

    _currentDetailMsgId = msgId;
    _resetDetailModal();

    // For sent messages: hide Reply & Delete (HOD sent it, no action needed)
    // Actually allow reply in case sender wants to follow up  keep reply, hide delete for sent
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) deleteBtn.style.display = 'none';

    document.getElementById('detailMessageFromLabel').textContent = 'To:';
    document.getElementById('detailMessageFrom').textContent = 'Loading...';
    document.getElementById('detailMessageDate').textContent = '';
    document.getElementById('detailMessageSubject').textContent = 'Loading...';
    document.getElementById('detailMessageContent').textContent = '';
    detailModal.style.display = 'block';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/messages/${msgId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            document.getElementById('detailMessageSubject').textContent = 'Error';
            document.getElementById('detailMessageContent').textContent = data.message || 'Failed to load message.';
            return;
        }

        const msg = data.data;
        const recipientNames = (msg.recipients || []).map(r => r.name || r.email || 'Unknown').join(', ') || 'Unknown';
        const sentTime = new Date(msg.createdAt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        document.getElementById('detailMessageFromLabel').textContent = 'To:';
        document.getElementById('detailMessageFrom').textContent = recipientNames;
        document.getElementById('detailMessageDate').textContent = sentTime;
        document.getElementById('detailMessageSubject').textContent = msg.subject || 'No Subject';
        document.getElementById('detailMessageContent').textContent = msg.content || '';

        // Wire reply button
        const replyBtn = document.getElementById('replyBtn');
        if (replyBtn) replyBtn.onclick = () => {
            document.getElementById('replyBox').style.display = 'block';
            document.getElementById('replyContent').focus();
        };

        // Load thread replies
        await _loadReplies(msgId);
    } catch (err) {
        console.error('View sent message error:', err);
        document.getElementById('detailMessageContent').textContent = 'Could not load message. Please try again.';
    }
}

// Populate instructor dropdowns
function populateInstructorDropdowns() {
    const instructorSelects = document.querySelectorAll('#courseInstructor');
    
    // Get HOD's own info from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    instructorSelects.forEach(select => {
        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add HOD themselves as first option (self-assign)
        if (currentUser._id || currentUser.id) {
            const selfOption = document.createElement('option');
            selfOption.value = currentUser._id || currentUser.id;
            selfOption.textContent = `${currentUser.name || 'Me'} (HOD - Self)`;
            selfOption.style.fontWeight = '600';
            select.appendChild(selfOption);
        }
        
        // Add faculty members as options  value = MongoDB _id, text = name
        hodData.faculty.forEach(faculty => {
            const option = document.createElement('option');
            option.value = faculty.id;
            option.textContent = faculty.name;
            select.appendChild(option);
        });
    });
}

// Populate recipient dropdowns
function populateRecipientDropdowns() {
    const recipientSelects = document.querySelectorAll('#messageTo');
    
    recipientSelects.forEach(select => {
        // Clear existing options except the first two (Select Recipient, All Faculty, All Students)
        while (select.options.length > 3) {
            select.remove(3);
        }
        // Ensure the base group options exist
        if (select.options.length < 3) {
            select.innerHTML = `
                <option value="">Select Recipient</option>
                <option value="__all_faculty__"> All Faculty</option>
                <option value="__all_students__"> All Students</option>
            `;
        } else {
            select.options[0].value = '';
            select.options[0].textContent = 'Select Recipient';
            select.options[1].value = '__all_faculty__';
            select.options[1].textContent = ' All Faculty';
            select.options[2].value = '__all_students__';
            select.options[2].textContent = ' All Students';
        }

        // Add a separator + faculty members as options (value = MongoDB _id)
        if (hodData.faculty.length > 0) {
            const sep = document.createElement('option');
            sep.disabled = true;
            sep.textContent = ' Teachers ';
            select.appendChild(sep);
            hodData.faculty.forEach(faculty => {
                const option = document.createElement('option');
                option.value = faculty.id;   // faculty.id is already String(t._id)
                option.textContent = faculty.name;
                select.appendChild(option);
            });
        }

        // Add students as options (value = MongoDB _id)
        if (hodData.students.length > 0) {
            const sep = document.createElement('option');
            sep.disabled = true;
            sep.textContent = ' Students ';
            select.appendChild(sep);
            hodData.students.forEach(student => {
                const option = document.createElement('option');
                option.value = student._mongoId;   // use MongoDB _id for API
                option.textContent = student.name;
                select.appendChild(option);
            });
        }
    });
}

// Notification functions are now handled by the unified notification system (notifications.js)
// The following functions have been disabled to prevent duplicate notification panels
/*
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
*/

// View faculty
function viewFaculty(facultyId) {
    // This function is no longer needed as faculty data is loaded from API
    showNotification('Faculty details are managed by Admin panel');
}

//  Shared course refresh  re-fetches /hod/courses and rebuilds both the
//     Course Management table and the faculty course counts 
function refreshCourses() {
    console.log(' Refreshing courses from API...');
    apiGet('/hod/courses').then(courseData => {
        if (!courseData.success) {
            console.error(' Failed to refresh courses:', courseData);
            return;
        }
        const courses = courseData.data.courses || [];
        console.log(' Received courses from API:', courses);

        // Rebuild teacher  course count map
        const teacherCourseCount = {};
        courses.forEach(c => {
            if (c.teacher && c.teacher._id) {
                const tid = String(c.teacher._id);
                teacherCourseCount[tid] = (teacherCourseCount[tid] || 0) + 1;
            }
        });

        // Update hodData.courses (preserve source field from backend)
        hodData.courses = courses.map(c => ({
            id: String(c._id),
            name: c.name,
            code: c.code || '',
            instructor: c.teacher ? c.teacher.name : 'Unassigned',
            instructorId: c.teacher ? String(c.teacher._id) : null,
            credits: c.credits || 3,
            students: c.students || 0,
            status: c.status || 'Active',
            source: c.source || 'class',  //  preserve source (subject or class)
            avgGrade: 'N/A',
            passRate: 'N/A',
            attendance: 'N/A'
        }));
        console.log(' Updated hodData.courses:', hodData.courses);
        updateCoursesList();
        loadDeptPerformanceTable(hodData.courses);

        // Update overview courses count
        const coursesCountEl = document.getElementById('overviewCoursesCount');
        if (coursesCountEl) {
            coursesCountEl.textContent = courses.length;
            const lbl = document.getElementById('overviewCoursesLabel');
            if (lbl) lbl.textContent = `${courses.length} active courses`;
        }

        // Re-fetch faculty so course counts update too
        apiGet('/hod/teachers').then(tData => {
            if (tData.success && tData.data.teachers) {
                hodData.faculty = tData.data.teachers.map(t => ({
                    id: String(t._id),
                    name: t.name,
                    position: t.role === 'hod' ? 'Head of Department' : 'Faculty',
                    specialization: t.department || 'N/A',
                    courses: teacherCourseCount[String(t._id)] || 0,
                    email: t.email,
                    status: t.isActive ? 'Active' : 'Inactive'
                }));
                updateFacultyList();
                populateInstructorDropdowns();
            }
        }).catch(err => console.error('Faculty refresh error:', err));
    }).catch(err => console.error('refreshCourses error:', err));
}

// Open course modal
function openCourseModal() {
    document.getElementById('courseModalTitle').textContent = 'Add New Course';
    document.getElementById('courseForm').reset();
    document.getElementById('courseId').value = '';
    document.getElementById('courseModal').style.display = 'block';
}

// Save course  creates/updates Subject OR updates Class (depending on source)
function saveCourse() {
    const btn = document.getElementById('saveCourseBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const courseId = document.getElementById('courseId').value;  // set when editing
    const code     = document.getElementById('courseCode').value.trim();
    const name     = document.getElementById('courseName').value.trim();
    const credits  = parseInt(document.getElementById('courseCredits').value) || 3;
    const semester = document.getElementById('courseSemester') ? document.getElementById('courseSemester').value.trim() : '';
    const teacherId = document.getElementById('courseInstructor').value;
    const status = document.getElementById('courseStatus') ? document.getElementById('courseStatus').value : 'Active';

    console.log('Saving course with data:', { courseId, code, name, credits, semester, teacherId, status });

    if (!code || !name) {
        showNotification('Course Code and Name are required.', 'error');
        btn.disabled = false;
        btn.textContent = 'Save Course';
        return;
    }

    if (credits < 1 || credits > 10) {
        showNotification('Credits must be between 1 and 10.', 'error');
        btn.disabled = false;
        btn.textContent = 'Save Course';
        return;
    }

    const authToken = localStorage.getItem('authToken');

    if (courseId) {
        //  Edit: check source and update accordingly 
        const course = hodData.courses.find(c => c.id === courseId);
        console.log('Found course to edit:', course);
        
        if (course && course.source === 'class') {
            // Update Class directly (admin-created course)
            const updateData = { name, code, credits };
            if (teacherId) updateData.teacher = teacherId;
            // Map status to isActive boolean for Class model
            if (status) {
                updateData.isActive = (status === 'Active');
            }

            console.log('Updating class with data:', updateData);

            fetch(`/api/hod/classes/${courseId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            })
                .then(r => r.json())
                .then(data => {
                    console.log('Class update response:', data);
                    if (!data.success) {
                        showNotification(data.message || 'Failed to update course', 'error');
                        return;
                    }
                    showNotification(`Course "${name}" updated successfully!`, 'success');
                    document.getElementById('courseModal').style.display = 'none';
                    document.getElementById('courseForm').reset();
                    refreshCourses();
                })
                .catch(err => {
                    console.error('Class update error:', err);
                    showNotification('Network error. Please try again.', 'error');
                })
                .finally(() => { btn.disabled = false; btn.textContent = 'Save Course'; });
        } else {
            // Update Subject (HOD-created course)
            const updateData = { name, code, credits, semester };
            // Map status to isActive boolean for Subject model
            if (status) {
                updateData.isActive = (status === 'Active');
            }
            
            console.log('Updating subject with data:', updateData);
            
            fetch(`/api/hod/subjects/${courseId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            })
                .then(r => r.json())
                .then(async data => {
                    console.log('Subject update response:', data);
                    if (!data.success) {
                        showNotification(data.message || 'Failed to update course', 'error');
                        return;
                    }
                    // If a new teacher is selected, assign them
                    if (teacherId) {
                        await fetch(`/api/hod/subjects/${courseId}/assign`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ teacherId }),
                        });
                    }
                    showNotification(`Course "${name}" updated successfully!`, 'success');
                    document.getElementById('courseModal').style.display = 'none';
                    document.getElementById('courseForm').reset();
                    refreshCourses();
                })
                .catch(err => {
                    console.error('Subject update error:', err);
                    showNotification('Network error. Please try again.', 'error');
                })
                .finally(() => { btn.disabled = false; btn.textContent = 'Save Course'; });
        }
    } else {
        //  Create: POST to /hod/subjects 
        fetch('/api/hod/subjects', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, code, credits, semester }),
        })
            .then(r => r.json())
            .then(async data => {
                if (!data.success) {
                    showNotification(data.message || 'Failed to create course', 'error');
                    return;
                }
                const newSubjectId = data.data._id;
                // Optionally assign teacher right away
                if (teacherId && newSubjectId) {
                    await fetch(`/api/hod/subjects/${newSubjectId}/assign`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ teacherId }),
                    });
                }
                showNotification(`Course "${name}" created successfully!`, 'success');
                document.getElementById('courseModal').style.display = 'none';
                document.getElementById('courseForm').reset();
                refreshCourses();
            })
            .catch(() => showNotification('Network error. Please try again.', 'error'))
            .finally(() => { btn.disabled = false; btn.textContent = 'Save Course'; });
    }
}

// Edit course  pre-fills the modal from the existing course data
function editCourse(courseId) {
    const course = hodData.courses.find(c => c.id === courseId);
    if (!course) return;

    document.getElementById('courseModalTitle').textContent = 'Edit Course';
    document.getElementById('courseId').value = course.id;
    document.getElementById('courseCode').value = course.code;
    document.getElementById('courseName').value = course.name;
    document.getElementById('courseCredits').value = course.credits;
    if (document.getElementById('courseSemester')) document.getElementById('courseSemester').value = course.semester || '';
    if (document.getElementById('courseStatus')) document.getElementById('courseStatus').value = course.status || 'Active';

    // Pre-select the instructor in the dropdown
    const sel = document.getElementById('courseInstructor');
    if (sel && course.instructorId) {
        sel.value = course.instructorId;
    }
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

// View student
let _hodStudentChartInstance = null;

function viewStudent(studentId) {
    const student = hodData.students.find(s => s.id === studentId || s._mongoId === studentId);
    if (!student) return;

    document.getElementById('detailStudentName').textContent = student.name;
    document.getElementById('detailStudentId').textContent   = student.id;
    document.getElementById('detailStudentYear').textContent = student.year || '';
    document.getElementById('detailStudentGpa').textContent  = student.gpa;
    document.getElementById('detailStudentStatus').textContent = student.status;

    // Courses
    const coursesList = document.querySelector('#studentCoursesList .courses-list-detail');
    if (coursesList) {
        if (student.courses && student.courses.length > 0) {
            coursesList.innerHTML = student.courses.map(name => {
                const c = hodData.courses.find(x => x.name === name);
                return `<li style="padding:0.15rem 0;">${c ? c.code + ' - ' + c.name : name}</li>`;
            }).join('');
        } else {
            coursesList.innerHTML = '<li style="color:#94a3b8;">No courses enrolled</li>';
        }
    }

    // Wire buttons
    const contactBtn = document.querySelector('#studentDetailModal .contact-student');
    if (contactBtn) {
        contactBtn.onclick = () => { document.getElementById('studentDetailModal').style.display = 'none'; contactStudent(studentId); };
    }
    const closeDetailBtn = document.querySelector('#studentDetailModal .close-detail');
    if (closeDetailBtn) closeDetailBtn.onclick = () => { document.getElementById('studentDetailModal').style.display = 'none'; };
    const closeBtn = document.querySelector('#studentDetailModal .close');
    if (closeBtn) closeBtn.onclick = () => { document.getElementById('studentDetailModal').style.display = 'none'; };

    document.getElementById('studentDetailModal').style.display = 'block';

    // Build year-wise CGPA chart from real semesterCgpas
    drawHodStudentCgpaChart(student);
}

function drawHodStudentCgpaChart(student) {
    const canvas = document.getElementById('studentPerformanceChart');
    if (!canvas) return;
    if (_hodStudentChartInstance) { _hodStudentChartInstance.destroy(); _hodStudentChartInstance = null; }

    // Find full student data with semesterCgpas
    const rawStudent = (hodData._rawStudents || []).find(s => String(s._id) === String(student._mongoId)) || {};
    const semCgpas = (rawStudent.semesterCgpas || []).map(v => parseFloat(v) || 0);

    // Year-wise avg (2 sems per year)
    const labels = [], values = [];
    for (let y = 0; y < 4; y++) {
        const s1 = semCgpas[y * 2] || 0, s2 = semCgpas[y * 2 + 1] || 0;
        const cnt = (s1 > 0 ? 1 : 0) + (s2 > 0 ? 1 : 0);
        if (cnt > 0) { labels.push(`Year ${y + 1}`); values.push(parseFloat(((s1 + s2) / cnt).toFixed(2))); }
    }

    // Fallback to overall GPA
    if (values.length === 0) { labels.push('Overall'); values.push(parseFloat(student.gpa) || 0); }

    // Linear regression prediction
    let predLabel = null, predValue = null;
    if (values.length >= 2) {
        const n = values.length, xM = (n - 1) / 2, yM = values.reduce((a, b) => a + b, 0) / n;
        let num = 0, den = 0;
        values.forEach((v, i) => { num += (i - xM) * (v - yM); den += (i - xM) ** 2; });
        const slope = den !== 0 ? num / den : 0;
        const predicted = Math.min(10, Math.max(0, parseFloat((slope * n + (yM - slope * xM)).toFixed(2))));
        const lastYear = parseInt((labels[labels.length - 1] || 'Year 0').replace('Year ', '')) || n;
        if (lastYear < 4) { predLabel = `Year ${lastYear + 1} (pred.)`; predValue = predicted; }
    }

    const allLabels = [...labels, ...(predLabel ? [predLabel] : [])];
    // Actual line: ends at last known value, then null for prediction point
    const actualData = [...values, ...(predLabel ? [null] : [])];
    // Predicted line: nulls until last actual point, then continues with dashed line to prediction
    // Include last actual value so the dashed line connects from it
    const predictData = [
        ...new Array(Math.max(0, values.length - 1)).fill(null),
        ...(values.length > 0 ? [values[values.length - 1]] : []),
        ...(predLabel ? [predValue] : [])
    ];

    if (typeof Chart === 'undefined') return;

    _hodStudentChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                { label: 'Actual CGPA', data: actualData, borderColor: '#667eea', backgroundColor: 'rgba(102,126,234,0.12)', borderWidth: 2.5, pointBackgroundColor: '#667eea', pointRadius: 5, tension: 0.35, fill: true, spanGaps: false },
                { label: 'Predicted', data: predictData, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', borderWidth: 2, borderDash: [5, 4], pointBackgroundColor: '#a855f7', pointStyle: 'triangle', pointRadius: 7, tension: 0, fill: false, spanGaps: true }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: !!predLabel, position: 'bottom', labels: { boxWidth: 11, font: { size: 10 }, color: '#64748b' } },
                tooltip: { callbacks: { label: c => c.parsed.y != null ? ` ${c.dataset.label}: ${c.parsed.y.toFixed(2)}` : '' } }
            },
            scales: {
                y: { min: 0, max: 10, ticks: { stepSize: 2, font: { size: 10 }, color: '#94a3b8' }, grid: { color: '#f1f5f9' } },
                x: { ticks: { font: { size: 10 }, color: '#64748b' }, grid: { display: false } }
            }
        }
    });

    const noteEl = document.getElementById('hodStudentChartNote');
    if (noteEl) noteEl.textContent = predLabel ? `Predicted ${predLabel.replace(' (pred.)','')} CGPA: ${predValue}` : (values.length < 2 ? 'Enter semester CGPAs in student dashboard for prediction.' : '');
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

// View message (inbox)
function viewMessage(messageId) {
    const message = hodData.messages.find(m => m.id === messageId);
    if (!message) return;

    _currentDetailMsgId = messageId;
    _resetDetailModal();

    const fromLabel = document.getElementById('detailMessageFromLabel');
    if (fromLabel) fromLabel.textContent = 'From:';
    document.getElementById('detailMessageFrom').textContent = message.from;
    document.getElementById('detailMessageDate').textContent = message.time;
    document.getElementById('detailMessageSubject').textContent = message.subject;
    document.getElementById('detailMessageContent').textContent = message.content;

    // Wire Reply button  shows reply box
    const replyBtn = document.getElementById('replyBtn');
    if (replyBtn) replyBtn.onclick = () => {
        document.getElementById('replyBox').style.display = 'block';
        document.getElementById('replyContent').focus();
    };

    // Wire Delete button
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) deleteBtn.onclick = () => {
        if (confirm('Are you sure you want to delete this message?')) {
            deleteMessage(messageId);
            document.getElementById('messageDetailModal').style.display = 'none';
        }
    };

    // Mark as read
    if (message.unread) {
        message.unread = false;
        saveHodDataToStorage();
        updateMessagesList();
    }

    // Load reply thread from API using the real MongoDB message ID
    if (message._mongoId) {
        _currentDetailMsgId = message._mongoId;
        _loadReplies(message._mongoId);
    }

    document.getElementById('messageDetailModal').style.display = 'block';
}

// Submit a reply to current message
async function submitReply() {
    const content = document.getElementById('replyContent').value.trim();
    if (!content) {
        showNotification('Please write a reply first', 'error');
        return;
    }
    if (!_currentDetailMsgId) return;

    // Determine who to reply to:
    // If viewing an inbox message, reply to the original sender
    const openMsg = hodData.messages.find(m => m._mongoId === _currentDetailMsgId || m.id === _currentDetailMsgId);
    let recipients = [];

    if (openMsg && openMsg._senderId) {
        recipients = [openMsg._senderId];
    } else {
        // For sent messages, reply to self (thread continuation)  
        // or fetch from API to get actual recipients
        showNotification('Cannot determine reply recipient', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipients,
                subject: `Re: ${document.getElementById('detailMessageSubject').textContent}`,
                content,
                parentId: _currentDetailMsgId
            })
        });
        const data = await res.json();

        if (data.success || res.ok) {
            showNotification('Reply sent!', 'success');
            document.getElementById('replyBox').style.display = 'none';
            document.getElementById('replyContent').value = '';
            // Reload the thread
            await _loadReplies(_currentDetailMsgId);
        } else {
            showNotification(data.message || 'Failed to send reply', 'error');
        }
    } catch (err) {
        console.error('Submit reply error:', err);
        showNotification('Failed to send reply', 'error');
    }
}

// Open resource modal  also populate class select
function openResourceModal() {
    document.getElementById('resourceForm').reset();
    document.getElementById('resourceModal').style.display = 'block';
    populateResourceClassSelect();
}

// Upload resource  real API call
async function uploadResource() {
    const resourceName = document.getElementById('resourceName').value.trim();
    const resourceType = document.getElementById('resourceType').value;
    const classId = document.getElementById('resourceClassSelect').value;
    const resourceFile = document.getElementById('resourceFile').files[0];
    const btn = document.getElementById('uploadResourceSubmitBtn');

    if (!resourceName || !classId || !resourceFile) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Uploading...';

    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('title', resourceName);
    formData.append('classId', classId);
    formData.append('resourceType', resourceType || 'file');
    formData.append('file', resourceFile);

    try {
        const res = await fetch('/api/resources', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();

        if (data.success || res.ok) {
            showNotification(` Resource uploaded! Shared with ${data.data?.studentsNotified || 0} students.`, 'success');
            document.getElementById('resourceModal').style.display = 'none';
            document.getElementById('resourceForm').reset();
            loadHodResources(); // Refresh the list
        } else {
            showNotification(data.message || 'Failed to upload resource', 'error');
        }
    } catch (err) {
        console.error('uploadResource error:', err);
        showNotification('Failed to upload resource', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Upload & Share with Students';
    }
}

// Load resources from API and update the table + stat boxes
async function loadHodResources() {
    const tbody = document.getElementById('resourcesTableBody') || document.querySelector('.resources-list');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/resources?limit=100', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const resources = data.success ? (data.data?.resources || []) : [];

        //  Compute stats 
        const docTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];
        const mediaTypes = ['mp4', 'avi', 'mov', 'jpg', 'jpeg', 'png', 'gif', 'webm'];
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        let docs = 0, media = 0, recent = 0;
        resources.forEach(r => {
            const ext = (r.fileName || r.title || '').split('.').pop().toLowerCase();
            if (docTypes.includes(ext) || (r.resourceType || '').toLowerCase().includes('doc')
                || (r.resourceType || '').toLowerCase().includes('pdf')
                || (r.resourceType || '').toLowerCase().includes('ppt')) docs++;
            if (mediaTypes.includes(ext) || (r.resourceType || '').toLowerCase().includes('video')
                || (r.resourceType || '').toLowerCase().includes('image')) media++;
            if (new Date(r.createdAt).getTime() > sevenDaysAgo) recent++;
        });

        // Update stat boxes
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('resTotalCount', resources.length);
        setEl('resDocsCount', docs);
        setEl('resMediaCount', media);
        setEl('resRecentCount', recent);

        const sub = document.getElementById('resTotalSub');
        if (sub) sub.innerHTML = `<i class="fas fa-arrow-up"></i> ${recent} new this week`;

        //  Render table rows 
        if (resources.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#94a3b8;">No resources yet. Upload the first one!</td></tr>';
            return;
        }

        tbody.innerHTML = resources.map(r => {
            const name = r.title || r.fileName || 'Unnamed';
            const ext = (r.fileName || '').split('.').pop().toUpperCase() || r.resourceType || 'File';
            const sizeBytes = r.fileSize || 0;
            const size = sizeBytes > 0 ? (sizeBytes > 1048576 ? (sizeBytes/1048576).toFixed(1)+' MB' : (sizeBytes/1024).toFixed(0)+' KB') : '';
            const uploader = r.teacher ? r.teacher.name : 'HOD';
            const date = new Date(r.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
            const className = r.class ? r.class.name : '';
            const fileIcon = ext.toLowerCase().includes('pdf') ? 'fa-file-pdf' :
                ext.toLowerCase().includes('doc') ? 'fa-file-word' :
                ext.toLowerCase().includes('ppt') ? 'fa-file-powerpoint' :
                ext.toLowerCase().includes('mp4') || ext.toLowerCase().includes('video') ? 'fa-file-video' :
                ext.toLowerCase().includes('img') || ['jpg','png','gif','jpeg'].includes(ext.toLowerCase()) ? 'fa-file-image' :
                'fa-file';

            const downloadUrl = r.filePath ? `/api/resources/${r._id}/download` : '#';

            return `
                <tr>
                    <td><i class="fas ${fileIcon}" style="color:#667eea; margin-right:0.5rem;"></i><strong>${name}</strong><div style="font-size:0.78rem;color:#94a3b8;">${className}</div></td>
                    <td><span style="background:#f0f4ff;color:#667eea;padding:0.2rem 0.5rem;border-radius:6px;font-size:0.78rem;font-weight:600;">${ext}</span></td>
                    <td>${size}</td>
                    <td>${uploader}</td>
                    <td>${date}</td>
                    <td style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                        <a href="${downloadUrl}" class="btn btn-sm btn-outline" target="_blank" style="display:inline-flex;align-items:center;gap:4px;">
                            <i class="fas fa-download"></i> Download
                        </a>
                        <button 
                            onclick="deleteHodResource('${r._id}', '${name.replace(/'/g, "\\'")}', this)"
                            class="btn btn-sm"
                            style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;font-size:0.78rem;font-weight:600;">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('loadHodResources error:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:#f44336;">Failed to load resources</td></tr>';
    }
}

// Delete resource (HOD only)
async function deleteHodResource(resourceId, resourceName, btnEl) {
    if (!confirm(`Are you sure you want to delete "${resourceName}"?\n\nThis cannot be undone and will remove access for all students.`)) return;

    btnEl.disabled = true;
    btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/resources/${resourceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success || res.ok) {
            showNotification(` "${resourceName}" deleted successfully.`, 'success');
            // Remove the row from the table instantly
            const row = btnEl.closest('tr');
            if (row) {
                row.style.transition = 'opacity 0.3s';
                row.style.opacity = '0';
                setTimeout(() => {
                    row.remove();
                    // Refresh full list to update stat boxes
                    loadHodResources();
                }, 300);
            } else {
                loadHodResources();
            }
        } else {
            showNotification(data.message || 'Failed to delete resource', 'error');
            btnEl.disabled = false;
            btnEl.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
        }
    } catch (err) {
        console.error('deleteHodResource error:', err);
        showNotification('Network error. Please try again.', 'error');
        btnEl.disabled = false;
        btnEl.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
    }
}

// Populate class select in resource modal
async function populateResourceClassSelect() {
    const sel = document.getElementById('resourceClassSelect');
    if (!sel) return;
    try {
        const token = localStorage.getItem('authToken');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const hodId = currentUser._id || currentUser.id || '';
        
        // Fetch HOD's own classes (classes they're teaching)
        const [classesRes, subjectsRes] = await Promise.all([
            fetch('/api/classes?myOwn=true', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/hod/subjects', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]);
        
        const classes = classesRes.success ? (classesRes.data?.classes || []) : [];
        const allSubjects = subjectsRes.success ? (subjectsRes.data?.subjects || []) : [];
        
        // Filter subjects assigned to this HOD that have classes created
        const mySubjects = allSubjects.filter(s => 
            s.assignedTeacher && 
            (s.assignedTeacher._id || s.assignedTeacher).toString() === hodId.toString() &&
            s.classId
        );
        
        // Combine both: direct classes + classes from subjects
        const allMyClasses = [];
        
        // Add direct classes
        classes.forEach(c => {
            allMyClasses.push({
                _id: c._id,
                name: c.name,
                code: c.code || 'N/A'
            });
        });
        
        // Add classes from subjects (avoid duplicates)
        mySubjects.forEach(s => {
            if (s.classId) {
                const classId = typeof s.classId === 'object' ? s.classId._id : s.classId;
                // Check if not already added
                if (!allMyClasses.find(c => c._id.toString() === classId.toString())) {
                    allMyClasses.push({
                        _id: classId,
                        name: typeof s.classId === 'object' ? s.classId.name : s.name,
                        code: s.code || 'N/A'
                    });
                }
            }
        });
        
        sel.innerHTML = allMyClasses.length
            ? '<option value="">-- Select a class --</option>' + allMyClasses.map(c => `<option value="${c._id}">${c.name} (${c.code})</option>`).join('')
            : '<option value="">No classes found - You need to create a class first</option>';
    } catch (err) {
        console.error('populateResourceClassSelect error:', err);
        sel.innerHTML = '<option value="">Failed to load classes</option>';
    }
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

    // Use MongoDB _id of sender for the recipient dropdown
    const senderId = message._senderId || '';
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const hodName = currentUser.name || 'HOD';
    const hodDept = currentUser.department || 'Department';

    // Open message modal with pre-filled data
    document.getElementById('messageTo').value = senderId;
    document.getElementById('messageSubject').value = `Re: ${message.subject}`;
    document.getElementById('messageContent').value = `Dear ${message.from},



--- Original Message ---
From: ${message.from}
Subject: ${message.subject}

${message.content}

---
Best regards,
${hodName}
HOD, ${hodDept}`;
    document.getElementById('messageModal').style.display = 'block';
}

// Forward message
function forwardMessage(messageId) {
    const message = hodData.messages.find(m => m.id === messageId);
    if (!message) return;
    
    // Open message modal with pre-filled data
    document.getElementById('messageTo').value = '';
    document.getElementById('messageSubject').value = `Fwd: ${message.subject}`;
    document.getElementById('messageContent').value = `

--- Forwarded Message ---
From: ${message.from}
Subject: ${message.subject}

${message.content}`;
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
async function sendMessage() {
    const recipientValue = document.getElementById('messageTo').value;
    const subject = document.getElementById('messageSubject').value.trim();
    const content = document.getElementById('messageContent').value.trim();

    if (!recipientValue || !subject || !content) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Resolve recipients array (MongoDB _id strings)
    let recipients = [];
    let recipientLabel = '';

    if (recipientValue === '__all_faculty__') {
        recipients = hodData.faculty.map(f => f.id);
        recipientLabel = 'All Faculty';
    } else if (recipientValue === '__all_students__') {
        recipients = hodData.students.map(s => s._mongoId);
        recipientLabel = 'All Students';
    } else {
        recipients = [recipientValue];
        // Find name for label
        const faculty = hodData.faculty.find(f => f.id === recipientValue);
        const student = hodData.students.find(s => s._mongoId === recipientValue);
        recipientLabel = faculty ? faculty.name : (student ? student.name : 'Unknown');
    }

    if (recipients.length === 0) {
        showNotification('No valid recipients found', 'error');
        return;
    }

    showNotification('Sending message...');

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipients, subject, content })
        });
        const data = await res.json();

        if (data.success || res.ok) {
            showNotification('Message sent successfully', 'success');
            document.getElementById('messageModal').style.display = 'none';
            document.getElementById('messageForm').reset();
            // Reload sent messages
            loadSentMessages();
        } else {
            showNotification(data.message || 'Failed to send message', 'error');
        }
    } catch (err) {
        console.error('Send message error:', err);
        showNotification('Failed to send message', 'error');
    }
}

// Contact student
function contactStudent(studentId) {
    const student = hodData.students.find(s => s.id === studentId);
    if (!student) return;

    // Get logged-in HOD's real name and department
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const hodName = currentUser.name || 'HOD';
    const hodDept = currentUser.department || 'Department';

    // Open message modal with pre-filled data
    document.getElementById('messageTo').value = student._mongoId || student.id;
    document.getElementById('messageSubject').value = 'Regarding Your Academic Performance';
    document.getElementById('messageContent').value = `Dear ${student.name},

I would like to discuss your academic performance and progress in the department.

Best regards,
${hodName}
HOD, ${hodDept}`;
    document.getElementById('messageModal').style.display = 'block';
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

// Draw student performance chart  now delegates to Chart.js implementation
function drawStudentPerformanceChart(student) {
    drawHodStudentCgpaChart(student);
}

// Draw attendance chart (stub)
function drawAttendanceChart(attendance) {
    // Attendance chart not used in current UI
}

// View message (inbox)
function viewMessage(messageId) {
    const message = hodData.messages.find(m => m.id === messageId);
    if (!message) return;

    _currentDetailMsgId = messageId;
    _resetDetailModal();

    const fromLabel = document.getElementById('detailMessageFromLabel');
    if (fromLabel) fromLabel.textContent = 'From:';
    document.getElementById('detailMessageFrom').textContent = message.from;
    document.getElementById('detailMessageDate').textContent = message.time;
    document.getElementById('detailMessageSubject').textContent = message.subject;
    document.getElementById('detailMessageContent').textContent = message.content;

    // Wire Reply button  shows reply box
    const replyBtn = document.getElementById('replyBtn');
    if (replyBtn) replyBtn.onclick = () => {
        document.getElementById('replyBox').style.display = 'block';
        document.getElementById('replyContent').focus();
    };

    // Wire Delete button
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) deleteBtn.onclick = () => {
        if (confirm('Are you sure you want to delete this message?')) {
            deleteMessage(messageId);
            document.getElementById('messageDetailModal').style.display = 'none';
        }
    };

    // Mark as read
    if (message.unread) {
        message.unread = false;
        saveHodDataToStorage();
        updateMessagesList();
    }

    // Load reply thread from API using the real MongoDB message ID
    if (message._mongoId) {
        _currentDetailMsgId = message._mongoId;
        _loadReplies(message._mongoId);
    }

    document.getElementById('messageDetailModal').style.display = 'block';
}

// Submit a reply to current message
async function submitReply() {
    const content = document.getElementById('replyContent').value.trim();
    if (!content) {
        showNotification('Please write a reply first', 'error');
        return;
    }
    if (!_currentDetailMsgId) return;

    // Determine who to reply to:
    // If viewing an inbox message, reply to the original sender
    const openMsg = hodData.messages.find(m => m._mongoId === _currentDetailMsgId || m.id === _currentDetailMsgId);
    let recipients = [];

    if (openMsg && openMsg._senderId) {
        recipients = [openMsg._senderId];
    } else {
        // For sent messages, reply to self (thread continuation)  
        // or fetch from API to get actual recipients
        showNotification('Cannot determine reply recipient', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipients,
                subject: `Re: ${document.getElementById('detailMessageSubject').textContent}`,
                content,
                parentId: _currentDetailMsgId
            })
        });
        const data = await res.json();

        if (data.success || res.ok) {
            showNotification('Reply sent!', 'success');
            document.getElementById('replyBox').style.display = 'none';
            document.getElementById('replyContent').value = '';
            // Reload the thread
            await _loadReplies(_currentDetailMsgId);
        } else {
            showNotification(data.message || 'Failed to send reply', 'error');
        }
    } catch (err) {
        console.error('Submit reply error:', err);
        showNotification('Failed to send reply', 'error');
    }
}

// Open resource modal  also populate class select
function openResourceModal() {
    document.getElementById('resourceForm').reset();
    document.getElementById('resourceModal').style.display = 'block';
    populateResourceClassSelect();
}

// Upload resource  real API call
async function uploadResource() {
    const resourceName = document.getElementById('resourceName').value.trim();
    const resourceType = document.getElementById('resourceType').value;
    const classId = document.getElementById('resourceClassSelect').value;
    const resourceFile = document.getElementById('resourceFile').files[0];
    const btn = document.getElementById('uploadResourceSubmitBtn');

    if (!resourceName || !classId || !resourceFile) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Uploading...';

    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('title', resourceName);
    formData.append('classId', classId);
    formData.append('resourceType', resourceType || 'file');
    formData.append('file', resourceFile);

    try {
        const res = await fetch('/api/resources', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();

        if (data.success || res.ok) {
            showNotification(` Resource uploaded! Shared with ${data.data?.studentsNotified || 0} students.`, 'success');
            document.getElementById('resourceModal').style.display = 'none';
            document.getElementById('resourceForm').reset();
            loadHodResources(); // Refresh the list
        } else {
            showNotification(data.message || 'Failed to upload resource', 'error');
        }
    } catch (err) {
        console.error('uploadResource error:', err);
        showNotification('Failed to upload resource', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Upload & Share with Students';
    }
}

// Load resources from API and update the table + stat boxes
async function loadHodResources() {
    const tbody = document.getElementById('resourcesTableBody') || document.querySelector('.resources-list');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/resources?limit=100', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const resources = data.success ? (data.data?.resources || []) : [];

        //  Compute stats 
        const docTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];
        const mediaTypes = ['mp4', 'avi', 'mov', 'jpg', 'jpeg', 'png', 'gif', 'webm'];
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        let docs = 0, media = 0, recent = 0;
        resources.forEach(r => {
            const ext = (r.fileName || r.title || '').split('.').pop().toLowerCase();
            if (docTypes.includes(ext) || (r.resourceType || '').toLowerCase().includes('doc')
                || (r.resourceType || '').toLowerCase().includes('pdf')
                || (r.resourceType || '').toLowerCase().includes('ppt')) docs++;
            if (mediaTypes.includes(ext) || (r.resourceType || '').toLowerCase().includes('video')
                || (r.resourceType || '').toLowerCase().includes('image')) media++;
            if (new Date(r.createdAt).getTime() > sevenDaysAgo) recent++;
        });

        // Update stat boxes
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('resTotalCount', resources.length);
        setEl('resDocsCount', docs);
        setEl('resMediaCount', media);
        setEl('resRecentCount', recent);

        const sub = document.getElementById('resTotalSub');
        if (sub) sub.innerHTML = `<i class="fas fa-arrow-up"></i> ${recent} new this week`;

        //  Render table rows 
        if (resources.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#94a3b8;">No resources yet. Upload the first one!</td></tr>';
            return;
        }

        tbody.innerHTML = resources.map(r => {
            const name = r.title || r.fileName || 'Unnamed';
            const ext = (r.fileName || '').split('.').pop().toUpperCase() || r.resourceType || 'File';
            const sizeBytes = r.fileSize || 0;
            const size = sizeBytes > 0 ? (sizeBytes > 1048576 ? (sizeBytes/1048576).toFixed(1)+' MB' : (sizeBytes/1024).toFixed(0)+' KB') : '';
            const uploader = r.teacher ? r.teacher.name : 'HOD';
            const date = new Date(r.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
            const className = r.class ? r.class.name : '';
            const fileIcon = ext.toLowerCase().includes('pdf') ? 'fa-file-pdf' :
                ext.toLowerCase().includes('doc') ? 'fa-file-word' :
                ext.toLowerCase().includes('ppt') ? 'fa-file-powerpoint' :
                ext.toLowerCase().includes('mp4') || ext.toLowerCase().includes('video') ? 'fa-file-video' :
                ext.toLowerCase().includes('img') || ['jpg','png','gif','jpeg'].includes(ext.toLowerCase()) ? 'fa-file-image' :
                'fa-file';

            const downloadUrl = r.filePath ? `/api/resources/${r._id}/download` : '#';

            return `
                <tr>
                    <td><i class="fas ${fileIcon}" style="color:#667eea; margin-right:0.5rem;"></i><strong>${name}</strong><div style="font-size:0.78rem;color:#94a3b8;">${className}</div></td>
                    <td><span style="background:#f0f4ff;color:#667eea;padding:0.2rem 0.5rem;border-radius:6px;font-size:0.78rem;font-weight:600;">${ext}</span></td>
                    <td>${size}</td>
                    <td>${uploader}</td>
                    <td>${date}</td>
                    <td style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                        <a href="${downloadUrl}" class="btn btn-sm btn-outline" target="_blank" style="display:inline-flex;align-items:center;gap:4px;">
                            <i class="fas fa-download"></i> Download
                        </a>
                        <button 
                            onclick="deleteHodResource('${r._id}', '${name.replace(/'/g, "\\'")}', this)"
                            class="btn btn-sm"
                            style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;font-size:0.78rem;font-weight:600;">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('loadHodResources error:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:#f44336;">Failed to load resources</td></tr>';
    }
}

// Delete resource (HOD only)
async function deleteHodResource(resourceId, resourceName, btnEl) {
    if (!confirm(`Are you sure you want to delete "${resourceName}"?\n\nThis cannot be undone and will remove access for all students.`)) return;

    btnEl.disabled = true;
    btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/resources/${resourceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success || res.ok) {
            showNotification(` "${resourceName}" deleted successfully.`, 'success');
            // Remove the row from the table instantly
            const row = btnEl.closest('tr');
            if (row) {
                row.style.transition = 'opacity 0.3s';
                row.style.opacity = '0';
                setTimeout(() => {
                    row.remove();
                    // Refresh full list to update stat boxes
                    loadHodResources();
                }, 300);
            } else {
                loadHodResources();
            }
        } else {
            showNotification(data.message || 'Failed to delete resource', 'error');
            btnEl.disabled = false;
            btnEl.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
        }
    } catch (err) {
        console.error('deleteHodResource error:', err);
        showNotification('Network error. Please try again.', 'error');
        btnEl.disabled = false;
        btnEl.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
    }
}

// Populate class select in resource modal
async function populateResourceClassSelect() {
    const sel = document.getElementById('resourceClassSelect');
    if (!sel) return;
    try {
        const token = localStorage.getItem('authToken');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const hodId = currentUser._id || currentUser.id || '';
        
        // Fetch HOD's own classes (classes they're teaching)
        const [classesRes, subjectsRes] = await Promise.all([
            fetch('/api/classes?myOwn=true', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/hod/subjects', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]);
        
        const classes = classesRes.success ? (classesRes.data?.classes || []) : [];
        const allSubjects = subjectsRes.success ? (subjectsRes.data?.subjects || []) : [];
        
        // Filter subjects assigned to this HOD that have classes created
        const mySubjects = allSubjects.filter(s => 
            s.assignedTeacher && 
            (s.assignedTeacher._id || s.assignedTeacher).toString() === hodId.toString() &&
            s.classId
        );
        
        // Combine both: direct classes + classes from subjects
        const allMyClasses = [];
        
        // Add direct classes
        classes.forEach(c => {
            allMyClasses.push({
                _id: c._id,
                name: c.name,
                code: c.code || 'N/A'
            });
        });
        
        // Add classes from subjects (avoid duplicates)
        mySubjects.forEach(s => {
            if (s.classId) {
                const classId = typeof s.classId === 'object' ? s.classId._id : s.classId;
                // Check if not already added
                if (!allMyClasses.find(c => c._id.toString() === classId.toString())) {
                    allMyClasses.push({
                        _id: classId,
                        name: typeof s.classId === 'object' ? s.classId.name : s.name,
                        code: s.code || 'N/A'
                    });
                }
            }
        });
        
        sel.innerHTML = allMyClasses.length
            ? '<option value="">-- Select a class --</option>' + allMyClasses.map(c => `<option value="${c._id}">${c.name} (${c.code})</option>`).join('')
            : '<option value="">No classes found - You need to create a class first</option>';
    } catch (err) {
        console.error('populateResourceClassSelect error:', err);
        sel.innerHTML = '<option value="">Failed to load classes</option>';
    }
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

    // Use MongoDB _id of sender for the recipient dropdown
    const senderId = message._senderId || '';
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const hodName = currentUser.name || 'HOD';
    const hodDept = currentUser.department || 'Department';

    // Open message modal with pre-filled data
    document.getElementById('messageTo').value = senderId;
    document.getElementById('messageSubject').value = `Re: ${message.subject}`;
    document.getElementById('messageContent').value = `Dear ${message.from},



--- Original Message ---
From: ${message.from}
Subject: ${message.subject}

${message.content}

---
Best regards,
${hodName}
HOD, ${hodDept}`;
    document.getElementById('messageModal').style.display = 'block';
}

// Forward message
function forwardMessage(messageId) {
    const message = hodData.messages.find(m => m.id === messageId);
    if (!message) return;
    
    // Open message modal with pre-filled data
    document.getElementById('messageTo').value = '';
    document.getElementById('messageSubject').value = `Fwd: ${message.subject}`;
    document.getElementById('messageContent').value = `

--- Forwarded Message ---
From: ${message.from}
Subject: ${message.subject}

${message.content}`;
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
async function sendMessage() {
    const recipientValue = document.getElementById('messageTo').value;
    const subject = document.getElementById('messageSubject').value.trim();
    const content = document.getElementById('messageContent').value.trim();

    if (!recipientValue || !subject || !content) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Resolve recipients array (MongoDB _id strings)
    let recipients = [];
    let recipientLabel = '';

    if (recipientValue === '__all_faculty__') {
        recipients = hodData.faculty.map(f => f.id);
        recipientLabel = 'All Faculty';
    } else if (recipientValue === '__all_students__') {
        recipients = hodData.students.map(s => s._mongoId);
        recipientLabel = 'All Students';
    } else {
        recipients = [recipientValue];
        // Find name for label
        const faculty = hodData.faculty.find(f => f.id === recipientValue);
        const student = hodData.students.find(s => s._mongoId === recipientValue);
        recipientLabel = faculty ? faculty.name : (student ? student.name : 'Unknown');
    }

    if (recipients.length === 0) {
        showNotification('No valid recipients found', 'error');
        return;
    }

    showNotification('Sending message...');

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipients, subject, content })
        });
        const data = await res.json();

        if (data.success || res.ok) {
            showNotification('Message sent successfully', 'success');
            document.getElementById('messageModal').style.display = 'none';
            document.getElementById('messageForm').reset();
            // Reload sent messages
            loadSentMessages();
        } else {
            showNotification(data.message || 'Failed to send message', 'error');
        }
    } catch (err) {
        console.error('Send message error:', err);
        showNotification('Failed to send message', 'error');
    }
}

// Contact student
function contactStudent(studentId) {
    const student = hodData.students.find(s => s.id === studentId);
    if (!student) return;

    // Get logged-in HOD's real name and department
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const hodName = currentUser.name || 'HOD';
    const hodDept = currentUser.department || 'Department';

    // Open message modal with pre-filled data
    document.getElementById('messageTo').value = student._mongoId || student.id;
    document.getElementById('messageSubject').value = 'Regarding Your Academic Performance';
    document.getElementById('messageContent').value = `Dear ${student.name},

I would like to discuss your academic performance and progress in the department.

Best regards,
${hodName}
HOD, ${hodDept}`;
    document.getElementById('messageModal').style.display = 'block';
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


// ==================== SUBJECT MANAGEMENT ====================

// Load subjects when subjects section is activated
document.addEventListener('DOMContentLoaded', function () {
    // Hook into sidebar navigation to load subjects on click
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        if (link.getAttribute('data-section') === 'subjects') {
            link.addEventListener('click', function () {
                loadSubjects();
            });
        }
        // Hook into resources section to load dynamic data
        if (link.getAttribute('data-section') === 'resources') {
            link.addEventListener('click', function () {
                loadHodResources();
            });
        }
    });
    // Also load resources on page load if the section is active
    if (document.querySelector('#resources.active')) {
        loadHodResources();
    }

    // Create subject button
    const createSubjectBtn = document.getElementById('createSubjectBtn');
    if (createSubjectBtn) {
        createSubjectBtn.addEventListener('click', function () {
            document.getElementById('createSubjectModal').style.display = 'block';
        });
    }

    // Create subject form submit
    const createSubjectForm = document.getElementById('createSubjectForm');
    if (createSubjectForm) {
        createSubjectForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitCreateSubject();
        });
    }

    // Assign teacher form submit
    const assignTeacherForm = document.getElementById('assignTeacherForm');
    if (assignTeacherForm) {
        assignTeacherForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitAssignTeacher();
        });
    }
});

// Load all subjects for HOD's department
function loadSubjects() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    const tbody = document.getElementById('subjectsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Loading...</td></tr>';

    fetch('/api/hod/subjects', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(r => r.json())
        .then(data => {
            if (data.success && data.data.subjects) {
                renderSubjectsTable(data.data.subjects);
                // Also refresh Course Management table so it stays in sync
                refreshCourses();
            } else {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">No subjects found. Create your first subject!</td></tr>';
            }
        })
        .catch(() => {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Failed to load subjects.</td></tr>';
        });
}

// Render subjects table
function renderSubjectsTable(subjects) {
    const tbody = document.getElementById('subjectsTableBody');
    if (!tbody) return;

    if (!subjects.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No subjects yet. Click "Create Subject" to add one.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    subjects.forEach(subject => {
        const statusBadge = {
            'pending_assignment': '<span class="status-badge warning">Pending Assignment</span>',
            'assigned': '<span class="status-badge" style="background:#e3f2fd;color:#1565c0;">Assigned</span>',
            'class_created': '<span class="status-badge success">Class Created</span>',
        }[subject.status] || subject.status;

        const teacherName = subject.assignedTeacher
            ? subject.assignedTeacher.name
            : '<span style="color:#999;">Not assigned</span>';

        const classStatus = subject.classId
            ? `<span class="status-badge success"><i class="fas fa-check"></i> ${subject.classId.name}</span>`
            : '<span style="color:#999;">No class yet</span>';

        const assignBtn = subject.status === 'pending_assignment'
            ? `<button class="btn btn-sm btn-primary assign-teacher-btn" data-id="${subject._id}" data-name="${subject.name}" data-code="${subject.code}">Assign Teacher</button>`
            : `<button class="btn btn-sm btn-outline reassign-teacher-btn" data-id="${subject._id}" data-name="${subject.name}" data-code="${subject.code}">Reassign</button>`;

        const deleteBtn = subject.status !== 'class_created'
            ? `<button class="btn btn-sm btn-outline btn-danger delete-subject-btn" data-id="${subject._id}">Delete</button>`
            : '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${subject.code}</strong></td>
            <td>${subject.name}</td>
            <td>${subject.credits}</td>
            <td>${subject.semester || '-'}</td>
            <td>${teacherName}</td>
            <td>${classStatus}</td>
            <td>${statusBadge}</td>
            <td style="display:flex;gap:6px;flex-wrap:wrap;">
                ${assignBtn}
                ${deleteBtn}
            </td>
        `;
        tbody.appendChild(row);
    });

    // Attach event listeners
    document.querySelectorAll('.assign-teacher-btn, .reassign-teacher-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            openAssignTeacherModal(this.dataset.id, this.dataset.name, this.dataset.code);
        });
    });

    document.querySelectorAll('.delete-subject-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (confirm('Delete this subject? This cannot be undone.')) {
                deleteSubject(this.dataset.id);
            }
        });
    });
}

// Submit create subject
function submitCreateSubject() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    const btn = document.querySelector('#createSubjectForm button[type="submit"]');
    btn.textContent = 'Creating...';
    btn.disabled = true;

    const payload = {
        name: document.getElementById('subjectName').value.trim(),
        code: document.getElementById('subjectCode').value.trim(),
        description: document.getElementById('subjectDescription').value.trim(),
        credits: parseInt(document.getElementById('subjectCredits').value) || 3,
        semester: document.getElementById('subjectSemester').value.trim(),
    };

    fetch('/api/hod/subjects', {
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
                showNotification(`Subject "${payload.name}" created successfully!`, 'success');
                document.getElementById('createSubjectModal').style.display = 'none';
                document.getElementById('createSubjectForm').reset();
                loadSubjects();      // refreshes Subjects table
                refreshCourses();    // refreshes Course Management table + faculty counts
            } else {
                showNotification(data.message || 'Failed to create subject', 'error');
            }
        })
        .catch(() => showNotification('Network error. Please try again.', 'error'))
        .finally(() => {
            btn.textContent = 'Create Subject';
            btn.disabled = false;
        });
}

// Open assign teacher modal
function openAssignTeacherModal(subjectId, subjectName, subjectCode) {
    document.getElementById('assignSubjectId').value = subjectId;
    document.getElementById('assignSubjectInfo').innerHTML = `
        <strong>Subject:</strong> ${subjectName} (${subjectCode})
    `;

    // Load teachers into dropdown
    const authToken = localStorage.getItem('authToken');
    const select = document.getElementById('assignTeacherSelect');
    select.innerHTML = '<option value="">Loading teachers...</option>';

    fetch('/api/hod/teachers', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(r => r.json())
        .then(data => {
            select.innerHTML = '<option value="">-- Select a teacher --</option>';
            if (data.success && data.data.teachers) {
                data.data.teachers.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t._id;
                    opt.textContent = `${t.name} (${t.email})`;
                    select.appendChild(opt);
                });
            }
        })
        .catch(() => {
            select.innerHTML = '<option value="">Failed to load teachers</option>';
        });

    document.getElementById('assignTeacherModal').style.display = 'block';
}

// Submit assign teacher
function submitAssignTeacher() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    const subjectId = document.getElementById('assignSubjectId').value;
    const teacherId = document.getElementById('assignTeacherSelect').value;

    if (!teacherId) {
        showNotification('Please select a teacher', 'error');
        return;
    }

    const btn = document.querySelector('#assignTeacherForm button[type="submit"]');
    btn.textContent = 'Assigning...';
    btn.disabled = true;

    fetch(`/api/hod/subjects/${subjectId}/assign`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teacherId }),
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showNotification('Teacher assigned successfully! The teacher can now create a class for this subject.', 'success');
                document.getElementById('assignTeacherModal').style.display = 'none';
                loadSubjects();      // refreshes Subjects table
                refreshCourses();    // refreshes Course Management + faculty counts
            } else {
                showNotification(data.message || 'Failed to assign teacher', 'error');
            }
        })
        .catch(() => showNotification('Network error. Please try again.', 'error'))
        .finally(() => {
            btn.textContent = 'Assign Teacher';
            btn.disabled = false;
        });
}

// Delete subject
function deleteSubject(subjectId) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    fetch(`/api/hod/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showNotification('Subject deleted successfully', 'success');
                loadSubjects();
                refreshCourses();
            } else {
                showNotification(data.message || 'Failed to delete subject', 'error');
            }
        })
        .catch(() => showNotification('Network error', 'error'));
}

// ==================== EVENTS SECTION ====================

document.addEventListener('DOMContentLoaded', function () {
    // Load events when Events section is clicked
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        if (link.getAttribute('data-section') === 'events') {
            link.addEventListener('click', function () {
                loadHodEvents();
            });
        }
    });

    // Open / close Request Event modal
    const requestEventBtn = document.getElementById('requestEventBtn');
    const requestEventModal = document.getElementById('requestEventModal');
    const closeRequestEventModal = document.getElementById('closeRequestEventModal');
    const cancelEventRequest = document.getElementById('cancelEventRequest');

    if (requestEventBtn) {
        requestEventBtn.addEventListener('click', function () {
            requestEventModal.style.display = 'flex';
        });
    }

    function closeEventModal() {
        if (requestEventModal) {
            requestEventModal.style.display = 'none';
            document.getElementById('requestEventForm').reset();
        }
    }

    if (closeRequestEventModal) closeRequestEventModal.addEventListener('click', closeEventModal);
    if (cancelEventRequest) cancelEventRequest.addEventListener('click', closeEventModal);

    // Close modal when clicking the backdrop
    if (requestEventModal) {
        requestEventModal.addEventListener('click', function (e) {
            if (e.target === requestEventModal) closeEventModal();
        });
    }

    // Submit event request form
    const requestEventForm = document.getElementById('requestEventForm');
    if (requestEventForm) {
        requestEventForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitEventRequest();
        });
    }
});

// Load HOD's submitted event requests
function loadHodEvents() {
    const tbody = document.querySelector('#hodEventsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';

    apiGet('/approvals?limit=100').then(data => {
        if (!data.success) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Failed to load events.</td></tr>';
            return;
        }

        // Filter only event-type requests submitted by the current HOD
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const eventTypes = ['fest', 'freshers_welcome', 'club', 'introductory_session', 'other'];
        const events = (data.data.requests || []).filter(r =>
            eventTypes.includes(r.requestType) &&
            r.requestedBy && r.requestedBy._id === currentUser.id
        );

        tbody.innerHTML = '';

        if (!events.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No event requests yet. Click "Request New Event" to get started.</td></tr>';
            return;
        }

        events.forEach(req => {
            const ed = req.eventData || {};
            const proposedDate = ed.eventDate ? new Date(ed.eventDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A';
            const principalDate = req.metadata?.approvedDate
                ? new Date(req.metadata.approvedDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
                : (req.status === 'approved' ? proposedDate : '');

            const statusBadge = req.status === 'approved'
                ? '<span class="status-badge success">Approved</span>'
                : req.status === 'rejected'
                    ? '<span class="status-badge danger">Rejected</span>'
                    : '<span class="status-badge warning">Pending</span>';

            const typeLabel = {
                fest: 'Fest', freshers_welcome: 'Freshers Welcome',
                club: 'Club Event', introductory_session: 'Introductory Session', other: 'Other'
            }[req.requestType] || req.requestType;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${req.title}</td>
                <td>${typeLabel}</td>
                <td>${proposedDate}</td>
                <td>${ed.venue || 'N/A'}</td>
                <td>${statusBadge}</td>
                <td>${principalDate}</td>
            `;
            tbody.appendChild(row);
        });
    }).catch(() => {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading events.</td></tr>';
    });
}

// Submit a new event request to principal
function submitEventRequest() {
    const btn = document.getElementById('submitEventBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const eventType = document.getElementById('eventType').value;
    const title = document.getElementById('eventTitle').value.trim();
    const description = document.getElementById('eventDescription').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const venue = document.getElementById('eventVenue').value.trim();
    const participants = parseInt(document.getElementById('eventParticipants').value) || 0;

    const payload = {
        requestType: eventType,
        title: title,
        description: description,
        eventData: {
            eventDate: eventDate ? new Date(eventDate).toISOString() : null,
            venue: venue,
            expectedParticipants: participants,
            organizers: [currentUser.name || 'HOD'],
        },
        metadata: {
            department: currentUser.department || '',
            priority: 'Normal',
        },
    };

    apiPost('/approvals', payload).then(data => {
        if (data.success) {
            showNotification('Event request sent to principal successfully!');
            document.getElementById('requestEventModal').style.display = 'none';
            document.getElementById('requestEventForm').reset();
            loadHodEvents();
        } else {
            showNotification('Failed to submit event request: ' + (data.message || 'Unknown error'));
        }
    }).catch(() => {
        showNotification('Network error. Please try again.');
    }).finally(() => {
        btn.disabled = false;
        btn.textContent = 'Submit Request';
    });
}


// 
//  HOD MY CLASSES SECTION
// 

let _hodClassModeCurrentId = null;
let _hodClassModeSelected = 'physical';

//  Load HOD's own classes 
async function loadHodMyClasses() {
    // Update both the myclasses section AND the overview card
    const classLists = [
        document.getElementById('hodMyClassList'),
        document.getElementById('overviewMyClassList')
    ].filter(Boolean);
    const subjectGrid = document.getElementById('hodAssignedSubjectsList');

    try {
        const token = localStorage.getItem('authToken');

        // Fetch both assigned subjects AND created classes in parallel
        const [subjectsRes, classesRes] = await Promise.all([
            fetch('/api/hod/subjects', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/classes?myOwn=true', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]);

        const allSubjects = subjectsRes.success ? (subjectsRes.data?.subjects || []) : [];
        const classes = classesRes.success ? (classesRes.data?.classes || []) : [];

        // HOD's own subjects: where assignedTeacher = HOD's own id
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const hodId = currentUser._id || currentUser.id || '';
        const mySubjects = allSubjects.filter(s => s.assignedTeacher && (s.assignedTeacher._id || s.assignedTeacher).toString() === hodId.toString());

        //  Render "Subjects Assigned to Me" card (like teacher's assignedSubjectsList) 
        if (subjectGrid) {
            if (mySubjects.length === 0) {
                subjectGrid.innerHTML = '<p style="color:#94a3b8; grid-column:1/-1;">No subjects assigned to you yet. Use "Take a Subject" below.</p>';
            } else {
                subjectGrid.innerHTML = mySubjects.map(sub => {
                    const hasClass = !!sub.classId;
                    const statusBadge = hasClass
                        ? `<span style="background:#d1fae5;color:#065f46;padding:0.2rem 0.5rem;border-radius:6px;font-size:0.75rem;font-weight:600;"> Class Created</span>`
                        : `<span style="background:#fef3c7;color:#92400e;padding:0.2rem 0.5rem;border-radius:6px;font-size:0.75rem;font-weight:600;">Assigned</span>`;
                    const classInfo = hasClass
                        ? `<div style="color:#22c55e;font-size:0.82rem;margin-top:0.4rem;"><i class="fas fa-check-circle"></i> Class: ${typeof sub.classId === 'object' ? sub.classId.name : 'Active'}</div>`
                        : `<button onclick="submitHodSelfAssignForSubject('${sub._id}','${sub.name.replace(/'/g,"\\'")}')" style="margin-top:0.6rem;padding:0.4rem 0.8rem;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.82rem;font-weight:600;width:100%;">Create Class</button>`;
                    return `
                        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1.1rem;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;">
                                <span style="background:#ede9fe;color:#7c3aed;padding:0.2rem 0.5rem;border-radius:6px;font-size:0.75rem;font-weight:600;">${sub.code || 'N/A'}</span>
                                ${statusBadge}
                            </div>
                            <div style="font-weight:700;color:#1e293b;font-size:0.95rem;margin-bottom:0.2rem;">${sub.name}</div>
                            <div style="color:#64748b;font-size:0.82rem;">${sub.credits || 10} Credits</div>
                            ${classInfo}
                        </div>
                    `;
                }).join('');
            }
        }

        //  Render "My Classes" list 
        if (classLists.length === 0) return;

        if (classes.length === 0) {
            const empty = '<li class="class-item" style="color:#94a3b8; padding:1.5rem; text-align:center;"><i class="fas fa-info-circle"></i> No active classes yet. Use "Take a Subject" to create one.</li>';
            classLists.forEach(l => l.innerHTML = empty);
            return;
        }

        const html = classes.map(cls => {
            const studentCount = cls.students ? cls.students.length : 0;
            const scheduleText = cls.schedule && cls.schedule.days && cls.schedule.days.length
                ? `${cls.schedule.days.join(', ')} ${cls.schedule.startTime || ''}`.trim()
                : (cls.schedule?.startTime || '');
            const location = cls.schedule?.location || '';
            const mode = cls.mode || 'physical';
            const meetingLink = cls.meetingLink || '';

            const modeBadge = mode === 'virtual'
                ? `<span style="background:#ede9fe;color:#7c3aed;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">Virtual</span>`
                : `<span style="background:#d1fae5;color:#065f46;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">Physical</span>`;

            const locationDisplay = mode === 'virtual' && meetingLink
                ? `<span><i class="fas fa-video" style="color:#22c55e;"></i> <a href="${meetingLink}" target="_blank" style="color:#22c55e;font-weight:600;">Live &mdash; Join Meeting</a></span>`
                : mode === 'virtual'
                ? `<span><i class="fas fa-globe" style="color:#667eea;"></i> Online</span>`
                : location ? `<span><i class="fas fa-map-marker-alt"></i> ${location}</span>` : '';

            const safeName = cls.name.replace(/'/g, "\\'");
            const safeLoc = (location || '').replace(/'/g, "\\'");
            const safeLink = (meetingLink || '').replace(/'/g, "\\'");

            return `
                <li style="list-style:none; background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:1rem 1.2rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:nowrap; gap:1rem; width:100%; box-shadow:0 1px 4px rgba(0,0,0,0.05);">
                    <div style="flex:1; min-width:0;">
                        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.4rem; flex-wrap:wrap;">
                            <div style="font-weight:600; font-size:1rem; color:#1e293b;">${cls.name}</div>
                            ${modeBadge}
                            <span style="background:#d1fae5;color:#065f46;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">Active</span>
                        </div>
                        <div style="color:#64748b; font-size:0.85rem; display:flex; gap:1rem; flex-wrap:wrap;">
                            <span><i class="fas fa-code"></i> ${cls.code || 'N/A'}</span>
                            ${locationDisplay}
                            <span><i class="fas fa-users"></i> ${studentCount} student${studentCount !== 1 ? 's' : ''}</span>
                            ${scheduleText ? `<span><i class="fas fa-clock"></i> ${scheduleText}</span>` : ''}
                            <span><i class="fas fa-star"></i> ${cls.credits || 10} credits</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-shrink:0; align-items:center;">
                        <button class="btn btn-outline btn-sm" onclick="openHodClassModeModal('${cls._id}', '${safeName}', '${mode}', '${safeLoc}', '${safeLink}')">
                            <i class="fas fa-cog"></i> Update Mode
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="hodStartClass('${cls._id}', '${safeName}', '${mode}', '${safeLink}')">
                            <i class="fas fa-play"></i> Start Class
                        </button>
                    </div>
                </li>
            `;
        }).join('');

        classLists.forEach(l => {
            l.style.cssText = 'display:flex; flex-direction:column; gap:0.75rem; padding:0; list-style:none;';
            l.innerHTML = html;
        });
    } catch (err) {
        console.error('loadHodMyClasses error:', err);
        classLists.forEach(l => l.innerHTML = '<li class="class-item" style="color:#f44336; padding:1rem;">Failed to load classes.</li>');
    }
}

// Create a class for a specific subject directly (from assigned subjects card)
async function submitHodSelfAssignForSubject(subjectId, subjectName) {
    try {
        const token = localStorage.getItem('authToken');
        const classRes = await fetch('/api/classes', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ subjectId, name: subjectName, description: 'HOD self-taught class' })
        });
        const classData = await classRes.json();
        if (classData.success || classRes.ok) {
            showNotification(' Class created successfully!', 'success');
            loadHodMyClasses();
        } else {
            showNotification(classData.message || 'Failed to create class', 'error');
        }
    } catch (err) {
        showNotification('Failed to create class', 'error');
    }
}

//  Self-Assign Modal 
async function openHodSelfAssignModal() {
    const sel = document.getElementById('hodSelfAssignSubject');
    sel.innerHTML = '<option value="">Loading subjects...</option>';
    document.getElementById('hodSelfAssignSchedule').value = '';
    document.getElementById('hodSelfAssignLocation').value = '';
    document.getElementById('hodSelfAssignModal').style.display = 'block';

    // Load ALL active subjects from this department (HOD can take any)
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/hod/subjects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const subjects = data.success ? (data.data?.subjects || data.data || []) : [];

        if (subjects.length === 0) {
            sel.innerHTML = '<option value="">No subjects found in your department</option>';
        } else {
            sel.innerHTML = '<option value="">-- Select a subject --</option>' + subjects.map(s => {
                const hasClass = s.classId ? ' (class exists)' : '';
                return `<option value="${s._id}">${s.name} (${s.code || 'N/A'})${hasClass}</option>`;
            }).join('');
        }
    } catch (err) {
        sel.innerHTML = '<option value="">Failed to load subjects</option>';
    }
}

function closeHodSelfAssignModal() {
    document.getElementById('hodSelfAssignModal').style.display = 'none';
}

async function submitHodSelfAssign() {
    const subjectSel = document.getElementById('hodSelfAssignSubject');
    const subjectId = subjectSel.value;
    const subjectName = subjectSel.options[subjectSel.selectedIndex]?.text || 'Class';
    const schedule = document.getElementById('hodSelfAssignSchedule').value.trim();
    const location = document.getElementById('hodSelfAssignLocation').value.trim();

    if (!subjectId) {
        showNotification('Please select a subject', 'error');
        return;
    }

    const btn = document.getElementById('hodSelfAssignBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

    try {
        const token = localStorage.getItem('authToken');

        // Build schedule object if provided
        const scheduleObj = {};
        if (location) scheduleObj.location = location;
        if (schedule) {
            // Parse schedule text like "Mon, Wed 10:00 AM"
            scheduleObj.startTime = schedule;
        }

        // Directly create a class as HOD (backend now allows HOD to create classes)
        const classRes = await fetch('/api/classes', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subjectId,
                name: subjectName.replace(/ \(class exists\)$/, '').replace(/ \([^)]+\)$/, '').trim(),
                schedule: Object.keys(scheduleObj).length ? scheduleObj : undefined,
                description: 'HOD self-taught class'
            })
        });
        const classData = await classRes.json();

        if (classData.success || classRes.ok) {
            showNotification(' Class created! You are now teaching this subject.', 'success');
            closeHodSelfAssignModal();
            loadHodMyClasses();
        } else {
            showNotification(classData.message || 'Failed to create class', 'error');
        }
    } catch (err) {
        console.error('submitHodSelfAssign error:', err);
        showNotification('Failed to create class', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Assign to Myself';
    }
}

//  HOD Class Mode Modal 
function openHodClassModeModal(classId, className, currentMode, currentLocation, currentLink) {
    _hodClassModeCurrentId = classId;
    _hodClassModeSelected = currentMode || 'physical';
    document.getElementById('hodClassModeClassName').textContent = className;
    document.getElementById('hodClassModeRoom').value = currentLocation || '';

    // Pre-fill today's date/time for virtual scheduling
    const now = new Date();
    const dateEl = document.getElementById('hodVirtualClassDate');
    const timeEl = document.getElementById('hodVirtualClassTime');
    if (dateEl) dateEl.value = now.toISOString().slice(0, 10);
    if (timeEl) timeEl.value = now.toTimeString().slice(0, 5);

    hodSelectMode(_hodClassModeSelected);
    document.getElementById('hodClassModeModal').style.display = 'block';
}

function closeHodClassModeModal() {
    document.getElementById('hodClassModeModal').style.display = 'none';
    _hodClassModeCurrentId = null;
}

function hodSelectMode(mode) {
    _hodClassModeSelected = mode;
    const physBtn = document.getElementById('hodModePhysicalBtn');
    const virtBtn = document.getElementById('hodModeVirtualBtn');
    if (mode === 'physical') {
        physBtn.style.cssText = 'flex:1;padding:0.75rem;border:2px solid #667eea;border-radius:10px;background:#667eea;color:#fff;cursor:pointer;font-weight:600;';
        virtBtn.style.cssText = 'flex:1;padding:0.75rem;border:2px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;cursor:pointer;font-weight:600;';
        document.getElementById('hodPhysicalFields').style.display = 'block';
        document.getElementById('hodVirtualFields').style.display = 'none';
    } else {
        virtBtn.style.cssText = 'flex:1;padding:0.75rem;border:2px solid #667eea;border-radius:10px;background:#667eea;color:#fff;cursor:pointer;font-weight:600;';
        physBtn.style.cssText = 'flex:1;padding:0.75rem;border:2px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;cursor:pointer;font-weight:600;';
        document.getElementById('hodPhysicalFields').style.display = 'none';
        document.getElementById('hodVirtualFields').style.display = 'block';
    }
}

async function saveHodClassMode() {
    if (!_hodClassModeCurrentId) return;
    const mode = _hodClassModeSelected;
    const token = localStorage.getItem('authToken');
    if (!token) { showNotification('Authentication required', 'error'); return; }

    const btn = document.getElementById('hodSaveClassModeBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        if (mode === 'virtual') {
            const scheduledDate = document.getElementById('hodVirtualClassDate')?.value;
            const scheduledTime = document.getElementById('hodVirtualClassTime')?.value;
            if (!scheduledDate || !scheduledTime) {
                showNotification('Please enter the class date and time', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> Save & Notify Students';
                return;
            }
            // Save schedule only  meeting link created when Start Class is clicked
            const res = await fetch(`/api/classes/${_hodClassModeCurrentId}/mode`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'virtual', scheduledDate, scheduledTime })
            });
            const data = await res.json();
            if (data.success || res.ok) {
                showNotification(`Virtual class scheduled for ${scheduledDate} at ${scheduledTime}. Students notified.`, 'success');
                closeHodClassModeModal();
                loadHodMyClasses();
            } else {
                showNotification(data.message || 'Failed to update class mode', 'error');
            }
        } else {
            const room = document.getElementById('hodClassModeRoom').value.trim();
            if (!room) { showNotification('Please enter a room/location', 'error'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save & Notify Students'; return; }
            const res = await fetch(`/api/classes/${_hodClassModeCurrentId}/mode`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'physical', location: room })
            });
            const data = await res.json();
            if (data.success || res.ok) {
                showNotification('Class set to Physical. Students notified.', 'success');
                closeHodClassModeModal();
                loadHodMyClasses();
            } else {
                showNotification(data.message || 'Failed to update', 'error');
            }
        }
    } catch (err) {
        console.error('saveHodClassMode error:', err);
        showNotification('Failed to update class mode', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save & Notify Students';
    }
}

//  Wire "My Classes" section nav click 
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.sidebar-menu a[data-section="myclasses"]').forEach(link => {
        link.addEventListener('click', function () {
            loadHodMyClasses();
        });
    });
    // Also load on dashboard startup so the overview "My Assigned Subjects" card is populated
    setTimeout(loadHodMyClasses, 1000);
});


// 
//  HOD MEETING ROOM
// 

async function hodHostMeeting() {
    const title = (document.getElementById('hodMeetingTitle').value || '').trim() || 'Department Meeting';
    const btn = document.getElementById('hodHostBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating room...';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, audience: 'department-teachers' })
        });
        const data = await res.json();

        if (data.success && data.data?.meeting) {
            const { roomCode } = data.data.meeting;
            showNotification(`Meeting room created! ${data.data.notified} teacher(s) notified.`, 'success');
            document.getElementById('hodMeetingTitle').value = '';
            window.open(`/meeting-room.html?room=${roomCode}&title=${encodeURIComponent(title)}`, '_blank');
        } else {
            showNotification(data.message || 'Failed to create meeting', 'error');
        }
    } catch (err) {
        console.error('hodHostMeeting error:', err);
        showNotification('Failed to create meeting', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-video"></i> Start Meeting & Notify Teachers';
    }
}

// Parse inbox messages for meeting invitations  only from Principal (managing_authority)
async function loadHodMeetingInvites() {
    const container = document.getElementById('hodMeetingInvites');
    if (!container) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages?folder=inbox&limit=50', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const messages = data.success ? (data.data?.messages || []) : [];

        // HODs only see meeting invites from the Principal
        const invites = messages.filter(m =>
            (m.subject || '').includes('Live Meeting') &&
            m.sender &&
            m.sender.role === 'managing_authority'
        );

        if (invites.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:1.5rem;">No meeting invitations yet. The Principal will send meeting links here.</p>';
            return;
        }

        container.innerHTML = invites.map(m => {
            const linkMatch = (m.content || '').match(/https?:\/\/[^\s]+meeting-room\.html[^\s]*/);
            const link = linkMatch ? linkMatch[0] : null;
            const from = m.sender ? m.sender.name : 'Principal';
            const time = new Date(m.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
            const title = (m.subject || '').replace(' Live Meeting:', '').trim();

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:0.75rem;">
                    <div>
                        <div style="font-weight:600; color:#1e293b;">${title}</div>
                        <div style="color:#94a3b8; font-size:0.82rem;"><i class="fas fa-user"></i> from ${from} (Principal)  ${time}</div>
                    </div>
                    ${link
                        ? `<button onclick="window.open('${link}','_blank')" style="padding:0.5rem 1.1rem; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.85rem;"><i class="fas fa-video"></i> Join</button>`
                        : '<span style="color:#94a3b8; font-size:0.82rem;">Link unavailable</span>'}
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('loadHodMeetingInvites error:', err);
        container.innerHTML = '<p style="color:#f44336; text-align:center; padding:1.5rem;">Failed to load invitations.</p>';
    }
}

// Wire Meeting Room nav
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.sidebar-menu a[data-section="meetingroom"]').forEach(link => {
        link.addEventListener('click', loadHodMeetingInvites);
    });
});


// 
//  HOD START CLASS
// 
let _hodStartClassId = null;
let _hodStartClassName = null;

async function hodStartClass(classId, className, mode, meetingLink) {
    _hodStartClassId = classId;
    _hodStartClassName = className;
    // Always show the "Set Class Time & Start" modal  same as teacher flow
    openHodStartClassModal(classId, className);
}

function openHodStartClassModal(classId, className) {
    _hodStartClassId = classId;
    _hodStartClassName = className;
    const el = document.getElementById('hodStartClassModal');
    if (!el) { showNotification('Please use "Update Mode" to set up a virtual class first.', 'info'); return; }
    document.getElementById('hodStartClassName').textContent = className;
    el.style.display = 'block';
}

function closeHodStartClassModal() {
    const el = document.getElementById('hodStartClassModal');
    if (el) el.style.display = 'none';
}

async function hodStartVirtualFromModal() {
    if (!_hodStartClassId) return;

    const btn = document.querySelector('#hodStartClassModal button[onclick="hodStartVirtualFromModal()"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating room...'; }

    try {
        const token = localStorage.getItem('authToken');

        // Load class to get scheduled date/time set via Update Mode
        const classRes = await fetch(`/api/classes/${_hodStartClassId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const classData = await classRes.json();
        if (!classData.success) { showNotification('Failed to load class details', 'error'); return; }

        const cls = classData.data;
        const scheduledDate = cls.schedule?.scheduledDate;
        const scheduledTime = cls.schedule?.scheduledTime;

        if (!scheduledDate || !scheduledTime) {
            showNotification('Please set the class date and time using "Update Mode" first.', 'error');
            closeHodStartClassModal();
            return;
        }

        // No time restrictions — HOD can create meeting at any time.
        const title = `${_hodStartClassName}  ${scheduledDate} ${scheduledTime}`;

        // Create the meeting room and send link to students
        const meetRes = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, classId: _hodStartClassId, audience: 'class-students', scheduledDate, scheduledTime })
        });
        const meetData = await meetRes.json();

        if (meetData.success && meetData.data?.meeting) {
            const { roomCode, meetingLink } = meetData.data.meeting;

            // Save live meeting link on the class record (simple direct endpoint)
            await fetch(`/api/classes/${_hodStartClassId}/meeting-link`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingLink })
            });

            showNotification(`Virtual room created! ${meetData.data.notified} student(s) notified. Opening meeting...`, 'success');
            closeHodStartClassModal();
            window.open(`/meeting-room.html?room=${roomCode}&title=${encodeURIComponent(title)}`, '_blank');
            loadHodMyClasses();
        } else {
            showNotification(meetData.message || 'Failed to create virtual room', 'error');
        }
    } catch (err) {
        console.error('hodStartVirtualFromModal error:', err);
        showNotification('Failed to create virtual room', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-video"></i> Start Virtual Class'; }
    }
}

function hodStartClassPhysical() {
    const date = document.getElementById('hodStartDate')?.value;
    const time = document.getElementById('hodStartTime')?.value;
    if (!date || !time) { showNotification('Please set date and time', 'error'); return; }
    closeHodStartClassModal();

    // Notify enrolled students about the physical class schedule
    const token = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const hodName = currentUser.name || 'HOD';
    const hodDept = currentUser.department || 'Department';

    // Use the class ID to send a message to all enrolled students
    fetch(`/api/classes/${_hodStartClassId}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(async data => {
            if (data.success && data.data) {
                const cls = data.data;
                const studentIds = (cls.students || []).map(s => s._id || s);
                if (studentIds.length > 0) {
                    await fetch('/api/messages', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipients: studentIds,
                            subject: `Physical Class Scheduled: ${_hodStartClassName}`,
                            content: `Dear Student,\n\nYour class "${_hodStartClassName}" has been scheduled:\n\nMode: Physical (In-Person)\nDate: ${date}\nTime: ${time}\nLocation: ${cls.schedule?.location || 'Your regular classroom'}\n\nPlease be on time.\n\nBest regards,\n${hodName}\nHOD, ${hodDept}`
                        })
                    });
                    showNotification(`Physical class scheduled for ${date} at ${time}. ${studentIds.length} student(s) notified.`, 'success');
                } else {
                    showNotification(`Physical class set for ${date} at ${time}.`, 'success');
                }
            }
        })
        .catch(() => showNotification(`Physical class set for ${date} at ${time}.`, 'success'));
}


//  College Announcements (visible to HOD) 
async function loadHodAnnouncements() {
    const overviewContainer = document.getElementById('hodAnnouncementsList');
    const sectionContainer = document.getElementById('hodAnnouncementsSection');
    
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/announcements', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const announcements = data.success ? (data.data?.announcements || []) : [];
        
        if (announcements.length === 0) {
            const emptyMsg = '<p style="color:#94a3b8;text-align:center;padding:2rem;">No announcements at this time.</p>';
            if (overviewContainer) overviewContainer.innerHTML = emptyMsg;
            if (sectionContainer) sectionContainer.innerHTML = emptyMsg;
            return;
        }
        
        const colors = { high:'#dc2626', medium:'#d97706', low:'#16a34a' };
        
        function renderAnnouncement(a) {
            const c = colors[a.priority] || colors.medium;
            const date = new Date(a.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
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
        }
        
        // Overview card shows max 5
        if (overviewContainer) {
            overviewContainer.innerHTML = announcements.slice(0, 5).map(renderAnnouncement).join('');
        }
        // Standalone section shows all
        if (sectionContainer) {
            sectionContainer.innerHTML = announcements.map(renderAnnouncement).join('');
        }
    } catch (err) { /* ignore */ }
}
document.addEventListener('DOMContentLoaded', function() {
    // Load announcements into HOD overview if container exists
    setTimeout(loadHodAnnouncements, 1500);
    
    // Reload when navigating to announcements section
    document.querySelectorAll('.sidebar-menu a[data-section="announcements"]').forEach(link => {
        link.addEventListener('click', function () {
            loadHodAnnouncements();
        });
    });
});

