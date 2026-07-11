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

// Update dashboard stats with fetched data
function updateDashboardStats() {
    // Update enrolled courses count
    const enrolledCoursesElement = document.getElementById('enrolledCoursesCount');
    if (enrolledCoursesElement && studentData.classes) {
        enrolledCoursesElement.textContent = studentData.classes.length;
    }
    
    // Update pending assignments count
    const pendingAssignmentsElement = document.getElementById('pendingAssignmentsCount');
    if (pendingAssignmentsElement && studentData.assignments && studentData.assignments.pending) {
        pendingAssignmentsElement.textContent = studentData.assignments.pending.length;
    }
    
    // Update attendance rate
    const attendanceRateElement = document.getElementById('attendanceRate');
    if (attendanceRateElement && studentData.attendance && studentData.attendance.length > 0) {
        attendanceRateElement.textContent = studentData.attendance[0].rate;
    }
    
    // Update average grade (Overall GPA)  always read fresh from localStorage
    const averageGradeElement = document.getElementById('averageGrade');
    const overallGPAElement   = document.getElementById('overallGPA');

    // Re-read from localStorage every time (grades may have been updated)
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const grade = currentUser.grade ? parseFloat(currentUser.grade).toFixed(2) : null;

    if (grade && parseFloat(grade) > 0) {
        if (averageGradeElement) averageGradeElement.textContent = grade;
        if (overallGPAElement)   overallGPAElement.textContent   = grade;
    } else {
        if (averageGradeElement) averageGradeElement.textContent = '-';
        if (overallGPAElement)   overallGPAElement.textContent   = '0.00';
    }
    
    // Update grades table
    updateGradesTable();
}

// Update grades table with student data
function updateGradesTable() {
    const gradesTableBody = document.getElementById('gradesTableBody');
    if (!gradesTableBody) return;
    
    // Clear existing content
    gradesTableBody.innerHTML = '';
    
    // Check if we have grades data
    if (!studentData.grades || studentData.grades.length === 0) {
        gradesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No grades available</td></tr>';
        return;
    }
    
    // Add each grade to the table
    studentData.grades.forEach(grade => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${grade.course}</td>
            <td>${grade.instructor}</td>
            <td>${grade.assignments}</td>
            <td>${grade.midterm}</td>
            <td>${grade.final}</td>
            <td>${grade.overall}</td>
        `;
        gradesTableBody.appendChild(row);
    });
}

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
    
    // Load college announcements
    loadCollegeAnnouncements();
    
    // Initialize announcements
    updateAnnouncements();
    
    // Initialize resources
    updateResources();
    
    // Initialize messages
    updateMessages();
    
    // Initialize assignments
    updateAssignments();
    
    // Notifications are handled by notifications.js (unified system)
    // updateNotifications(); -- removed to prevent conflict
    
    // Simulate real-time updates with memory-efficient interval
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
    notificationInterval = setInterval(simulateRealTimeUpdates, 60000); // Check for updates every minute
    
    // Also refresh user data periodically to get updated grades
    setInterval(fetchAllStudentData, 30000); // Refresh every 30 seconds

    // ── LIVE MEETING POLL ──
    // Polls every 5 seconds so the Join button appears the moment the teacher
    // starts a meeting — no manual page refresh needed.
    startLiveMeetingPoll();
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

            // Update program name in sidebar (shown above department)
            const programEl = document.getElementById('userProgram');
            if (programEl) {
                // Derive program from department name (B.Tech departments)
                const dept = (data.data.department || '').toUpperCase();
                let programName = 'B.Tech'; // default for all existing departments
                if (dept.includes('BCA')) programName = 'BCA';
                else if (dept.includes('MCA')) programName = 'MCA';
                programEl.textContent = programName;
            }
        } else {
            console.error('Failed to fetch user data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
    });
    
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
            // Transform classes data  preserve all fields needed for the new card UI
            studentData.classes = data.data.classes.map(cls => {
                // Build schedule display: prefer scheduledDate+scheduledTime, fall back to days/startTime
                let scheduleDisplay = 'Not specified';
                let scheduledDate = cls.schedule?.scheduledDate || '';
                let scheduledTime = cls.schedule?.scheduledTime || '';

                if (scheduledDate && scheduledTime) {
                    // Format: "03 Jul 2026 at 12:00 PM"
                    const d = new Date(scheduledDate + 'T' + scheduledTime);
                    const dateStr = d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
                    const [h, m] = scheduledTime.split(':').map(Number);
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
                    scheduleDisplay = `${dateStr} at ${displayH}:${String(m).padStart(2,'0')} ${ampm}`;
                } else if (cls.schedule?.days?.length && cls.schedule?.startTime) {
                    scheduleDisplay = `${cls.schedule.days.join(', ')} ${cls.schedule.startTime}`;
                } else if (cls.schedule?.startTime) {
                    scheduleDisplay = cls.schedule.startTime;
                }

                return {
                    id: cls._id,
                    name: cls.name,
                    code: cls.code || '',
                    credits: cls.credits || 10,
                    instructor: cls.teacher ? cls.teacher.name : 'Unknown',
                    department: cls.teacher ? cls.teacher.department : '',
                    schedule: scheduleDisplay,
                    scheduledDate,
                    scheduledTime,
                    room: cls.schedule ? (cls.schedule.location || '') : '',
                    mode: cls.mode || 'physical',
                    meetingLink: cls.meetingLink || '',
                };
            });
            
            // Update enrolled courses count
            const enrolledEl = document.getElementById('enrolledCoursesCount');
            if (enrolledEl) enrolledEl.textContent = studentData.classes.length;

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
            // Separate assignments into pending and completed based on submission status
            const allAssignments = data.data.assignments;
            
            // Separate by submitted flag from API
            studentData.assignments.pending = allAssignments
                .filter(a => !a.submitted && a.status !== 'closed')
                .map(assignment => ({
                    id: assignment._id,
                    title: assignment.title,
                    course: assignment.class ? assignment.class.name : 'Unknown Class',
                    instructor: assignment.teacher ? assignment.teacher.name : 'Unknown',
                    deadline: new Date(assignment.dueDate).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                    }),
                    time: new Date(assignment.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    description: assignment.description,
                    attachments: assignment.attachments || [],
                    submitted: false,
                    maxPoints: assignment.maxPoints
                }));

            studentData.assignments.completed = allAssignments
                .filter(a => a.submitted)
                .map(assignment => ({
                    id: assignment._id,
                    title: assignment.title,
                    course: assignment.class ? assignment.class.name : 'Unknown Class',
                    instructor: assignment.teacher ? assignment.teacher.name : 'Unknown',
                    date: assignment.submission?.submittedAt 
                        ? new Date(assignment.submission.submittedAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
                        : '',
                    grade: assignment.submission?.graded 
                        ? `${assignment.submission.points}/${assignment.maxPoints}`
                        : 'Pending Review',
                    submissionId: assignment.submission?._id,
                    submissionAttachments: assignment.submission?.attachments || [],
                    feedback: assignment.submission?.feedback || ''
                }));
            
            // Update assignments UI (handled by student-grades.js now)
            if (typeof fetchAssignmentsData === 'function') {
                // student-grades.js will handle rendering
            } else {
                updateAssignments();
            }
        } else {
            console.error('Failed to fetch assignments data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching assignments data:', error);
    });
    
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
            // Transform resources data to match frontend format
            studentData.resources = data.data.resources.map(resource => ({
                id: resource._id,
                title: resource.title,
                instructor: resource.teacher ? resource.teacher.name : 'Unknown',
                type: resource.resourceType || resource.fileType || 'PDF',
                size: resource.fileSize ? `${(resource.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
                fileName: resource.fileName,
                filePath: resource.filePath,
                url: resource.url,
                mimeType: resource.mimeType,
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
    fetch('/api/attendance/summary/student', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const d = data.data;
            const rate = d.attendanceRate || 0;
            const present = d.present || 0;
            const absent = d.absent || 0;
            const late = d.late || 0;
            const total = d.totalClasses || 0;

            // Update summary cards in attendance section
            const overallEl = document.getElementById('overallAttendance');
            const attendedEl = document.getElementById('classesAttended');
            const absencesEl = document.getElementById('absences');
            const lateEl = document.getElementById('lateArrivals');
            if (overallEl) overallEl.textContent = `${rate}%`;
            if (attendedEl) attendedEl.textContent = present;
            if (absencesEl) absencesEl.textContent = absent;
            if (lateEl) lateEl.textContent = late;

            // Update attendance rate in overview stats
            const attendanceRateEl = document.getElementById('attendanceRate');
            if (attendanceRateEl) attendanceRateEl.textContent = `${rate}%`;

            // Transform attendance data to match frontend format
            studentData.attendance = [{
                course: 'Overall Attendance',
                instructor: 'All Classes',
                held: total,
                attended: present,
                rate: `${rate}%`,
                status: rate >= 90 ? 'Excellent' : rate >= 80 ? 'Good' : rate >= 70 ? 'Satisfactory' : 'Needs Improvement'
            }];

            // Populate attendance table
            updateAttendanceTable(studentData.attendance);

            // Also fetch per-class attendance
            fetchPerClassAttendance(authToken);
        } else {
            console.error('Failed to fetch attendance data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching attendance data:', error);
    });
    
    // Fetch grades data from backend
    fetch('/api/grades/student', {
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
            
            // Update grades table
            updateGradesTable();
        } else {
            console.error('Failed to fetch grades data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching grades data:', error);
    });
    
    // Fetch messages data from backend
    fetch('/api/messages?folder=inbox', {
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
                _mongoId: String(message._id),
                _senderId: message.sender ? String(message.sender._id || message.sender) : null,
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
    })
    .finally(() => {
        // Update dashboard stats after all data is fetched
        updateDashboardStats();
    });
}

// Update student classes list  renders card-based layout with mode/schedule/join
function updateStudentClassesList(classes) {
    //  My Classes section: card grid 
    const cardGrid = document.getElementById('studentClassCards');
    if (cardGrid) {
        if (!classes || classes.length === 0) {
            cardGrid.innerHTML = `<p style="color:#94a3b8; grid-column:1/-1; text-align:center; padding:2rem;">
                <i class="fas fa-info-circle"></i> No classes yet. Your teacher will enroll you soon.</p>`;
        } else {
            cardGrid.innerHTML = '';
            classes.forEach(cls => {
                const isVirtual = cls.mode === 'virtual';
                const hasLink = isVirtual && cls.meetingLink;
                const modeBadge = isVirtual
                    ? `<span style="background:#ede9fe;color:#7c3aed;padding:0.2rem 0.65rem;border-radius:20px;font-size:0.75rem;font-weight:600;white-space:nowrap;">Virtual</span>`
                    : `<span style="background:#d1fae5;color:#065f46;padding:0.2rem 0.65rem;border-radius:20px;font-size:0.75rem;font-weight:600;white-space:nowrap;">Physical</span>`;
                const locationLine = isVirtual
                    ? (hasLink
                        ? `<i class="fas fa-link" style="color:#667eea;"></i> <span style="color:#667eea;">Meeting link available</span>`
                        : `<i class="fas fa-clock"></i> <span style="color:#94a3b8;">Scheduled  link opens 15 min before class</span>`)
                    : (cls.room ? `<i class="fas fa-map-marker-alt"></i> ${cls.room}` : `<i class="fas fa-clock"></i> Location TBD`);

                const card = document.createElement('div');
                card.style.cssText = 'background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1.3rem; display:flex; flex-direction:column; gap:0.8rem; box-shadow:0 2px 8px rgba(0,0,0,0.05);';
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:700; font-size:1rem; color:#1e293b; margin-bottom:0.2rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cls.name}</div>
                            <div style="font-size:0.82rem; color:#64748b;"><i class="fas fa-code"></i> ${cls.code || 'N/A'}</div>
                        </div>
                        <div style="flex-shrink:0; margin-top:0.1rem;">${modeBadge}</div>
                    </div>
                    <div style="font-size:0.85rem; color:#374151; display:flex; flex-direction:column; gap:0.4rem;">
                        <div><i class="fas fa-chalkboard-teacher" style="width:16px;color:#667eea;"></i> ${cls.instructor}</div>
                        <div><i class="fas fa-calendar-alt" style="width:16px;color:#667eea;"></i> ${cls.schedule}</div>
                        <div style="margin-top:0.2rem;">${locationLine}</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.3rem;">
                        <span style="background:#f0fdf4; color:#15803d; padding:0.2rem 0.65rem; border-radius:20px; font-size:0.75rem; font-weight:600;"> Enrolled  ${cls.credits} credits</span>
                        <button onclick="openStudentClassDetail('${cls.id}')" style="padding:0.45rem 1rem; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:0.82rem; font-weight:600;">
                            View Details
                        </button>
                    </div>
                `;
                cardGrid.appendChild(card);
            });
        }
    }

    //  Overview section: keep existing simple list (unchanged) 
    const overviewSection = document.getElementById('overview');
    if (overviewSection) {
        const classList = overviewSection.querySelector('.class-list');
        if (classList) {
            classList.innerHTML = '';
            const upcomingClasses = (classes || []).slice(0, 3);
            upcomingClasses.forEach(cls => {
                const timeParts = cls.schedule.split(' - ');
                const time = timeParts.length > 1 ? timeParts[1] : '';
                const classItem = document.createElement('li');
                classItem.className = 'class-item';
                classItem.innerHTML = `
                    <div class="class-time">
                        <div class="time">${time.split(':')[0] || '--'}</div>
                        <div class="ampm">${time.includes('PM') ? 'PM' : time.includes('AM') ? 'AM' : ''}</div>
                    </div>
                    <div class="class-details">
                        <div class="class-name">${cls.name}</div>
                        <div class="class-info">
                            <i class="fas fa-${cls.mode === 'virtual' ? 'video' : 'map-marker-alt'}"></i> ${cls.mode === 'virtual' ? 'Virtual' : (cls.room || 'TBD')}
                            <i class="fas fa-user ml-3"></i> ${cls.instructor}
                        </div>
                    </div>
                    <div class="class-action">
                        <button onclick="openStudentClassDetail('${cls.id}')" class="btn btn-primary btn-sm">View Details</button>
                    </div>
                `;
                classList.appendChild(classItem);
            });
            if (upcomingClasses.length === 0) {
                classList.innerHTML = '<li class="class-item"><div class="class-details"><p>No classes yet</p></div></li>';
            }
        }
    }
}

// Open student class detail modal
function openStudentClassDetail(classId) {
    const cls = studentData.classes.find(c => c.id === classId);
    if (!cls) return;

    document.getElementById('scdClassName').textContent = cls.name;
    document.getElementById('scdTeacher').textContent = ` ${cls.instructor}`;
    document.getElementById('scdMode').innerHTML = cls.mode === 'virtual'
        ? 'Virtual (Online)' : 'Physical (In-Person)';
    document.getElementById('scdSchedule').textContent = cls.schedule || 'TBD';
    document.getElementById('scdCredits').textContent = `${cls.credits || 10} Credits`;

    const locEl = document.getElementById('scdLocation');
    if (cls.mode === 'virtual') {
        if (cls.meetingLink) {
            locEl.innerHTML = `<a href="${cls.meetingLink}" target="_blank" style="color:#667eea; text-decoration:none; word-break:break-all;">Click to Join Meeting</a>`;
        } else {
            locEl.textContent = 'Meeting link will appear when teacher starts';
        }
    } else {
        locEl.textContent = cls.room || 'Location TBD';
    }

    document.getElementById('scdStatus').textContent = 'Enrolled Active';

    // Join button: only show if virtual with a link
    const joinBtn = document.getElementById('scdJoinBtn');
    if (cls.mode === 'virtual' && cls.meetingLink) {
        joinBtn.style.display = 'inline-flex';
        joinBtn.innerHTML = '<i class="fas fa-play"></i> Join Class';
        joinBtn.onclick = () => window.open(cls.meetingLink, '_blank');
    } else {
        // Physical or virtual with no link yet  no join button needed
        joinBtn.style.display = 'none';
    }

    document.getElementById('studentClassDetailModal').style.display = 'block';
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
    
    // Notification icon is now handled by notifications.js
    // The unified notification system will automatically attach event listeners
    // Removed duplicate handler to prevent conflicts
    
    // Notification filters are also handled by notifications.js
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
    
    // Mark all / Clear all are handled by notifications.js
    // No duplicate listeners needed here
    
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
                // Reset reply state
                document.getElementById('studentReplyBox').style.display = 'none';
                document.getElementById('studentReplyContent').value = '';
                document.getElementById('studentReplyThread').style.display = 'none';
                document.getElementById('studentReplyList').innerHTML = '';

                // Populate modal with message details
                document.getElementById('messageFrom').textContent = messageData.from;
                document.getElementById('messageDate').textContent = messageData.date;
                document.getElementById('messageSubject').textContent = messageData.subject;
                document.getElementById('messageContent').textContent = messageData.content;
                
                // Store current message ID and sender ID for reply
                document.getElementById('messageModal').setAttribute('data-message-id', messageId);
                document.getElementById('messageModal').setAttribute('data-sender-id', messageData._senderId || '');
                document.getElementById('messageModal').setAttribute('data-mongo-id', messageData._mongoId || messageId);
                
                // Show modal
                document.getElementById('messageModal').style.display = 'block';
                
                // Mark message as read
                messageData.read = true;
                saveStudentDataToStorage();
                updateMessages();
                updateNotificationBadge();

                // Load reply thread
                if (messageData._mongoId) {
                    loadStudentReplyThread(messageData._mongoId);
                }
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
            const assignmentId = this.getAttribute('data-assignment-id');
            const notes = document.getElementById('submissionNotes').value;
            
            // Validate file if provided
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                
                // Validate file type
                const allowedTypes = ['application/pdf'];
                if (!allowedTypes.includes(file.type)) {
                    showNotification('Only PDF files are allowed', 'error');
                    return;
                }
                
                // Validate file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    showNotification('File size must be less than 10MB', 'error');
                    return;
                }
            }
            
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

    // Reply to message  show inline reply box
    const replyMessage = document.getElementById('replyMessage');
    if (replyMessage) {
        const handler = function() {
            const replyBox = document.getElementById('studentReplyBox');
            if (replyBox) {
                replyBox.style.display = 'block';
                document.getElementById('studentReplyContent').focus();
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

// Notification sidebar is now handled by the unified notification system (notifications.js)
// This function has been disabled to prevent duplicate notification panels
/*
// Toggle notification sidebar
function toggleNotificationSidebar() {
    const sidebar = document.getElementById('notificationSidebar');
    sidebar.classList.toggle('active');
    
    // Mark all notifications as read when opening
    if (sidebar.classList.contains('active')) {
        markAllNotificationsAsRead();
    }
}
*/

// ---- NOTIFICATION FUNCTIONS ----
// These are now handled by the unified notifications.js system.
// Kept as no-ops so existing calls don't throw errors.

function updateNotifications() {
    // Handled by window.notificationManager (notifications.js)
}

function filterNotifications(filter) {
    // Handled by window.notificationManager (notifications.js)
}

function markAllNotificationsAsRead() {
    if (window.notificationManager) {
        window.notificationManager.markAllAsRead();
    }
}

function clearAllNotifications() {
    if (window.notificationManager) {
        window.notificationManager.clearAll();
    }
}

// Update notification badge  triggers a full reload of live notifications
function updateNotificationBadge() {
    if (window.notificationManager) {
        window.notificationManager.loadNotifications();
    }
}

// Update upcoming classes
async function updateUpcomingClasses() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Find the upcoming classes section in the overview
    const upcomingClassesCard = document.querySelector('#overview .card');
    if (!upcomingClassesCard) return;
    
    const classList = upcomingClassesCard.querySelector('.class-list');
    if (!classList) return;
    
    classList.innerHTML = '<li class="class-item"><div class="class-details"><p>Loading classes...</p></div></li>';
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        classList.innerHTML = '<li class="class-item"><div class="class-details"><p>Please login to view classes</p></div></li>';
        return;
    }
    
    try {
        // Fetch all classes the student is enrolled in
        const classesRes = await fetch('/api/classes', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const classesData = await classesRes.json();

        if (!classesData.success || !classesData.data.classes || classesData.data.classes.length === 0) {
            classList.innerHTML = '<li class="class-item"><div class="class-details"><p>No classes enrolled</p></div></li>';
            return;
        }

        const allClasses = classesData.data.classes;
        const upcoming = [];
        const todayStr = today; // YYYY-MM-DD

        for (const cls of allClasses) {
            const scheduledDate = cls.schedule?.scheduledDate; // YYYY-MM-DD
            const scheduledTime = cls.schedule?.scheduledTime; // HH:MM

            // --- Virtual class scheduled via Update Mode (today OR future) ---
            if (cls.mode === 'virtual' && scheduledDate && scheduledTime) {
                if (scheduledDate >= todayStr) {
                    // meetingEnded: class is today, no current link, but check if a meeting was ended
                    // We detect this by checking if class previously had a meeting that ended
                    // The backend clears meetingLink when host ends  so no link after start time = ended
                    const classSchTime = new Date(scheduledDate + 'T' + scheduledTime);
                    const meetingEnded = !cls.meetingLink && scheduledDate === todayStr && now > classSchTime;

                    upcoming.push({
                        id: cls._id,
                        name: cls.name,
                        date: scheduledDate,
                        time: scheduledTime,
                        room: 'Online',
                        instructor: cls.teacher?.name || 'Unknown',
                        meetingLink: cls.meetingLink || '',
                        mode: 'virtual',
                        hasLiveLink: !!(cls.meetingLink),
                        meetingEnded
                    });
                }
                continue;
            }

            // --- Physical class with a weekly schedule (show for today) ---
            if (cls.schedule?.days?.length && cls.schedule?.startTime) {
                const dayMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 0 };
                const isTodayScheduled = cls.schedule.days.some(day => dayMap[day] === now.getDay());
                if (isTodayScheduled) {
                    upcoming.push({
                        id: cls._id,
                        name: cls.name,
                        date: todayStr,
                        time: cls.schedule.startTime,
                        room: cls.schedule.location || 'Room TBD',
                        instructor: cls.teacher?.name || 'Unknown',
                        meetingLink: '',
                        mode: cls.mode || 'physical',
                        hasLiveLink: false
                    });
                }
            }
        }

        // Sort by date then time (soonest first)
        upcoming.sort((a, b) => {
            if (a.date !== b.date) return a.date < b.date ? -1 : 1;
            const [ah, am] = a.time.split(':').map(v => parseInt(v) || 0);
            const [bh, bm] = b.time.split(':').map(v => parseInt(v) || 0);
            return (ah * 60 + am) - (bh * 60 + bm);
        });

        const upcomingClasses = upcoming.slice(0, 5);

        if (upcomingClasses.length === 0) {
            classList.innerHTML = '<li class="class-item"><div class="class-details"><p>No upcoming classes scheduled</p></div></li>';
            return;
        }

        classList.innerHTML = '';

        upcomingClasses.forEach(cls => {
            const [hour, minute] = cls.time.split(':').map(v => parseInt(v) || 0);

            // Full scheduled datetime
            const classDateTime = new Date(cls.date);
            classDateTime.setHours(hour, minute, 0, 0);

            // 15-minute early-access window
            const joinOpensAt = new Date(classDateTime.getTime() - 15 * 60 * 1000);
            const classEndsAt  = new Date(classDateTime.getTime() + 90 * 60 * 1000); // 90-min window

            const isToday   = cls.date === todayStr;
            const withinWindow = now >= joinOpensAt && now <= classEndsAt;

            //  Action button logic (exact workflow) 
            // 1. Active link exists  JOIN (teacher started the meeting)
            // 2. No link + past class + ended flag  CLASS COMPLETED
            // 3. No link + before/during scheduled time  WAITING FOR TEACHER (not clickable)
            const canJoin = !!(cls.meetingLink); // link set = teacher started

            const classItem = document.createElement('li');
            classItem.className = 'class-item';
            if (canJoin && withinWindow) classItem.classList.add('ongoing');

            // Display time (12-hour)
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const ampm = hour >= 12 ? 'PM' : 'AM';

            // Date label  "Today" or formatted date
            const dateLabel = isToday
                ? 'Today'
                : classDateTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

            // Action button / status logic
            // Action button
            let actionHtml;
            if (canJoin) {
                // Teacher created meeting link  show JOIN
                const safeLink = cls.meetingLink.replace(/"/g, '&quot;');
                actionHtml = `<button class="btn btn-primary btn-sm join-class-btn" data-link="${safeLink}">
                                <i class="fas fa-video"></i> Join
                              </button>`;
            } else if (cls.mode === 'virtual') {
                // No link yet  determine message
                let waitMsg, bgColor = '#e2e8f0', txtColor = '#94a3b8';

                if (now > classEndsAt) {
                    // Past the 90-min window with no link = class completed without meeting
                    waitMsg = 'Class Completed';
                    bgColor = '#f0fdf4'; txtColor = '#16a34a';
                } else if (cls.meetingEnded) {
                    // Meeting was active and ended by host
                    waitMsg = 'Class Completed';
                    bgColor = '#f0fdf4'; txtColor = '#16a34a';
                } else {
                    // Scheduled but teacher hasn't started yet
                    waitMsg = 'Waiting for teacher';
                }

                actionHtml = `<button class="btn btn-sm" disabled
                    style="background:${bgColor};color:${txtColor};cursor:not-allowed;border:1px solid ${bgColor};padding:0.35rem 0.8rem;border-radius:8px;font-size:0.8rem;font-weight:600;">
                    <i class="fas fa-${waitMsg === 'Waiting for teacher' ? 'clock' : 'check-circle'}" style="font-size:0.75rem;"></i> ${waitMsg}
                </button>`;
            } else {
                // Physical class
                actionHtml = `<span class="class-status" style="color:#64748b;font-size:0.82rem;">In-Person</span>`;
            }

            classItem.innerHTML = `
                <div class="class-time">
                    <div class="time">${displayHour}:${String(minute).padStart(2, '0')}</div>
                    <div class="ampm">${ampm}</div>
                    <div style="font-size:0.68rem;color:#94a3b8;font-weight:700;margin-top:2px;">${dateLabel}</div>
                </div>
                <div class="class-details">
                    <div class="class-name">${cls.name} ${cls.mode === 'virtual' ? '' : ''}</div>
                    <div class="class-info">
                        <i class="fas fa-${cls.mode === 'virtual' ? 'globe' : 'map-marker-alt'}"></i> ${cls.room}
                        <i class="fas fa-user ml-3"></i> ${cls.instructor}
                    </div>
                </div>
                <div class="class-action">
                    ${actionHtml}
                </div>
            `;

            classList.appendChild(classItem);
        });

        // Wire Join buttons via delegation (avoids quote-escaping issues)
        classList.querySelectorAll('.join-class-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const link = this.getAttribute('data-link');
                if (link) window.open(link, '_blank');
            });
        });

    } catch (error) {
        console.error('Error updating upcoming classes:', error);
        classList.innerHTML = '<li class="class-item"><div class="class-details"><p>Error loading classes. Please refresh the page.</p></div></li>';
    }
}

// ─── LIVE MEETING LINK POLLING ───────────────────────────────────────────────
// Polls /api/classes every 5 seconds. When a teacher starts a meeting the link
// appears on the class record; this makes the Join button appear automatically
// on the student dashboard without any page reload.

let _livePollTimer   = null;   // interval handle
let _lastLinkSnapshot = {};    // classId → meetingLink (tracks changes)

function startLiveMeetingPoll() {
    if (_livePollTimer) return; // already running
    _pollMeetingLinks();        // immediate first run
    _livePollTimer = setInterval(_pollMeetingLinks, 5000);
}

function stopLiveMeetingPoll() {
    clearInterval(_livePollTimer);
    _livePollTimer = null;
}

async function _pollMeetingLinks() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
        const res = await fetch('/api/classes', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (!data.success || !data.data.classes) return;

        const isFirstRun = Object.keys(_lastLinkSnapshot).length === 0;
        let changed = false;

        data.data.classes.forEach(cls => {
            const prev = _lastLinkSnapshot[cls._id];
            const curr = cls.meetingLink || '';
            if (!isFirstRun && prev !== undefined && prev !== curr) {
                changed = true;
                // A new link appeared — show toast
                if (curr && !prev) {
                    _showMeetingToast(cls.name, curr);
                }
            }
            _lastLinkSnapshot[cls._id] = curr;
        });

        // Always refresh UI on first run OR when something changed
        if (isFirstRun || changed) {
            updateUpcomingClasses();
            updateStudentClassCards(data.data.classes);
        }

    } catch (_) { /* network hiccup — retry next tick */ }
}

function _showMeetingToast(className, link) {
    // Show a prominent "Join Now" toast notification
    const existing = document.getElementById('meetingLiveToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'meetingLiveToast';
    toast.style.cssText = `
        position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
        background:linear-gradient(135deg,#667eea,#764ba2);
        color:#fff; padding:1rem 1.5rem; border-radius:14px;
        box-shadow:0 8px 32px rgba(102,126,234,0.45);
        z-index:9999; display:flex; align-items:center; gap:1rem;
        font-size:0.95rem; font-weight:500; max-width:420px; width:90%;
        animation: slideUpToast 0.4s ease;
    `;
    toast.innerHTML = `
        <i class="fas fa-video" style="font-size:1.4rem;"></i>
        <div>
            <div style="font-weight:700;">${className} — Live Now!</div>
            <div style="font-size:0.82rem;opacity:0.85;">Teacher started the class</div>
        </div>
        <button onclick="window.open('${link}','_blank')"
            style="background:#fff;color:#667eea;border:none;border-radius:8px;
                   padding:0.4rem 0.9rem;font-weight:700;cursor:pointer;white-space:nowrap;">
            Join
        </button>
        <button onclick="document.getElementById('meetingLiveToast').remove()"
            style="background:transparent;border:none;color:#fff;cursor:pointer;font-size:1.1rem;padding:0 4px;">
            &times;
        </button>
    `;
    document.body.appendChild(toast);

    // Auto-dismiss after 30 seconds
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 30000);
}

// Update the My Classes card grid when we get fresh data
function updateStudentClassCards(classes) {
    const container = document.getElementById('studentClassCards');
    if (!container) return;

    if (!classes || classes.length === 0) {
        container.innerHTML = `<p style="color:#94a3b8;grid-column:1/-1;text-align:center;padding:2rem;">
            No classes enrolled yet.</p>`;
        return;
    }

    container.innerHTML = '';
    classes.forEach(cls => {
        const mode    = cls.mode || 'physical';
        const link    = cls.meetingLink || '';
        const teacher = cls.teacher?.name || 'Unknown';
        const subject = cls.subject?.name || cls.name || 'Class';
        const schedDate = cls.schedule?.scheduledDate || '';
        const schedTime = cls.schedule?.scheduledTime || '';
        const schedDisplay = schedDate && schedTime
            ? `${schedDate} at ${schedTime}` : (schedDate || 'TBD');

        // Virtual class: show Join or Waiting
        let actionBtn = '';
        if (mode === 'virtual' && link) {
            actionBtn = `<button class="btn btn-primary btn-sm" onclick="window.open('${link}','_blank')" style="width:100%;margin-top:0.8rem;">
                <i class="fas fa-video"></i> Join Meeting
            </button>`;
        } else if (mode === 'virtual') {
            actionBtn = `<button class="btn btn-sm" disabled style="width:100%;margin-top:0.8rem;
                background:#e2e8f0;color:#94a3b8;cursor:not-allowed;border-radius:8px;padding:0.5rem;font-size:0.82rem;">
                <i class="fas fa-clock"></i> Waiting for Teacher
            </button>`;
        } else {
            actionBtn = `<div style="margin-top:0.8rem;color:#64748b;font-size:0.82rem;text-align:center;">
                <i class="fas fa-map-marker-alt"></i> In-Person
            </div>`;
        }

        const modeBadge = mode === 'virtual'
            ? `<span style="background:#ede9fe;color:#6d28d9;padding:0.15rem 0.55rem;border-radius:20px;font-size:0.72rem;font-weight:600;">Virtual</span>`
            : `<span style="background:#d1fae5;color:#065f46;padding:0.15rem 0.55rem;border-radius:20px;font-size:0.72rem;font-weight:600;">Physical</span>`;

        const liveDot = (mode === 'virtual' && link)
            ? `<span style="display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:50%;margin-left:6px;box-shadow:0 0 6px #22c55e;animation:livePulse 1.2s infinite;"></span>`
            : '';

        const card = document.createElement('div');
        card.style.cssText = `background:#fff;border-radius:14px;padding:1.2rem;
            box-shadow:0 2px 12px rgba(0,0,0,0.07);border:1px solid #e2e8f0;
            display:flex;flex-direction:column;`;
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.6rem;">
                <div style="font-weight:700;font-size:1rem;color:#1e293b;flex:1;">${subject}${liveDot}</div>
                ${modeBadge}
            </div>
            <div style="color:#64748b;font-size:0.82rem;margin-bottom:0.3rem;">
                <i class="fas fa-user" style="width:14px;"></i> ${teacher}
            </div>
            ${schedDisplay ? `<div style="color:#64748b;font-size:0.82rem;margin-bottom:0.3rem;">
                <i class="fas fa-calendar" style="width:14px;"></i> ${schedDisplay}
            </div>` : ''}
            ${actionBtn}
        `;
        container.appendChild(card);
    });
}

// Auto-refresh upcoming classes every 5 seconds (live polling replaces old 15s interval)

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
    // Helper: build one resource card HTML
    function buildCard(resource) {
        return `
            <div class="resource-card">
                <div class="resource-icon">
                    <i class="fas ${getResourceIcon(resource.type)}"></i>
                </div>
                <div class="resource-body">
                    <h3 class="resource-title">${resource.title}</h3>
                    <p class="resource-meta">${resource.instructor} &bull; ${resource.type} &bull; ${resource.size}</p>
                    <div class="resource-actions">
                        <a href="#" class="btn btn-primary btn-sm download-resource" onclick="downloadResource('${resource.id}'); return false;">${resource.downloaded ? 'Downloaded' : 'Download'}</a>
                        <a href="#" class="btn btn-outline btn-sm view-resource" onclick="viewResource('${resource.id}'); return false;">View</a>
                    </div>
                </div>
            </div>
        `;
    }

    // Helper: determine category from mimeType + fileName + type field
    function getCategory(resource) {
        const mime = (resource.mimeType || '').toLowerCase();
        const name = (resource.fileName || resource.title || '').toLowerCase();
        const rtype = (resource.type || '').toLowerCase();

        // Videos
        if (mime.includes('video') || /\.(mp4|webm|ogg|avi|mov|mkv)$/.test(name) || rtype === 'video') {
            return 'videos';
        }
        // Links / URLs
        if (rtype === 'url' || rtype === 'youtube' || rtype === 'drive' || rtype === 'website') {
            return 'links';
        }
        // Documents: PDF, Word, PPT, text, spreadsheets, images treated as docs too
        if (
            mime.includes('pdf') || mime.includes('word') || mime.includes('document') ||
            mime.includes('presentation') || mime.includes('spreadsheet') || mime.includes('text') ||
            mime.includes('image') ||
            /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|png|jpg|jpeg|gif|webp|csv)$/.test(name) ||
            rtype === 'pdf' || rtype === 'doc' || rtype === 'docx' ||
            rtype === 'ppt' || rtype === 'pptx' || rtype === 'file'
        ) {
            return 'documents';
        }
        // Default to documents for anything else uploaded as a file
        return 'documents';
    }

    // Populate all four grids
    const allGrid  = document.querySelector('#all .resource-grid');
    const docsGrid = document.querySelector('#documents .resource-grid');
    const vidsGrid = document.querySelector('#videos .resource-grid');
    const lnksGrid = document.querySelector('#links .resource-grid');

    if (allGrid)  allGrid.innerHTML  = '';
    if (docsGrid) docsGrid.innerHTML = '';
    if (vidsGrid) vidsGrid.innerHTML = '';
    if (lnksGrid) lnksGrid.innerHTML = '';

    if (!studentData.resources || studentData.resources.length === 0) {
        const empty = '<p style="color:#94a3b8; padding:1rem; text-align:center;">No resources available.</p>';
        if (allGrid)  allGrid.innerHTML  = empty;
        if (docsGrid) docsGrid.innerHTML = empty;
        if (vidsGrid) vidsGrid.innerHTML = empty;
        if (lnksGrid) lnksGrid.innerHTML = empty;
        return;
    }

    studentData.resources.forEach(resource => {
        const cardHtml = buildCard(resource);
        const category = getCategory(resource);

        // Always add to "All Resources"
        if (allGrid) allGrid.insertAdjacentHTML('beforeend', cardHtml);

        // Add to matching category tab
        if (category === 'documents' && docsGrid) docsGrid.insertAdjacentHTML('beforeend', cardHtml);
        if (category === 'videos'    && vidsGrid) vidsGrid.insertAdjacentHTML('beforeend', cardHtml);
        if (category === 'links'     && lnksGrid) lnksGrid.insertAdjacentHTML('beforeend', cardHtml);
    });

    // Show empty state for tabs that got nothing
    if (docsGrid && docsGrid.innerHTML === '') docsGrid.innerHTML = '<p style="color:#94a3b8; padding:1rem; text-align:center;">No documents available.</p>';
    if (vidsGrid && vidsGrid.innerHTML === '') vidsGrid.innerHTML = '<p style="color:#94a3b8; padding:1rem; text-align:center;">No videos available.</p>';
    if (lnksGrid && lnksGrid.innerHTML === '') lnksGrid.innerHTML = '<p style="color:#94a3b8; padding:1rem; text-align:center;">No links available.</p>';
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
        
        // Build attachments HTML if attachments exist
        let attachmentsHtml = '';
        if (assignment.attachments && assignment.attachments.length > 0) {
            attachmentsHtml = `
                <div class="assignment-attachments">
                    <strong>Attachments:</strong>
                    ${assignment.attachments.map(att => `
                        <div class="attachment-item">
                            <i class="fas fa-paperclip"></i>
                            <a href="#" onclick="downloadAssignmentFile('${assignment.id}', '${att.fileName}')">${att.fileName}</a>
                            <small>(${(att.fileSize / 1024).toFixed(1)} KB)</small>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
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
                ${attachmentsHtml}
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
        
        // Build submission attachments HTML if attachments exist
        let submissionAttachmentsHtml = '';
        if (assignment.submissionAttachments && assignment.submissionAttachments.length > 0) {
            submissionAttachmentsHtml = `
                <div class="assignment-attachments">
                    <strong>Submitted Files:</strong>
                    ${assignment.submissionAttachments.map(att => `
                        <div class="attachment-item">
                            <i class="fas fa-paperclip"></i>
                            <a href="#" onclick="downloadSubmissionFile('${assignment.submissionId}', '${att.fileName}')">${att.fileName}</a>
                            <small>(${(att.fileSize / 1024).toFixed(1)} KB)</small>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
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
                ${submissionAttachmentsHtml}
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

// Real download function
function simulateDownload(resource) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Please login to download resources', 'error');
        return;
    }
    
    // Create download URL
    const downloadUrl = `/api/resources/${resource.id}/download`;
    
    showNotification(`Downloading ${resource.title}...`, 'info');
    
    // Create temporary link and trigger download
    fetch(downloadUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Download failed');
        }
        return response.blob();
    })
    .then(blob => {
        // Create blob URL
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = resource.fileName || resource.title;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification(`${resource.title} downloaded successfully`, 'success');
    })
    .catch(error => {
        console.error('Download error:', error);
        showNotification('Failed to download resource. Please try again.', 'error');
    });
}

// Open resource viewer
function openResourceViewer(resource) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'display:block; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000; overflow:auto;';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = 'width:90%; max-width:900px; margin:30px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.4);';

    const authToken = localStorage.getItem('authToken');
    const fileUrl = `/api/resources/${resource.id}/download`;
    const fileName = (resource.fileName || resource.title || '').toLowerCase();
    const fileType = resource.mimeType || '';

    const isPDF = fileType.includes('pdf') || fileName.endsWith('.pdf');
    // Check PPT and Excel FIRST (their mimeTypes contain "officedocument" which would falsely match Word)
    const isPPT  = fileType.includes('presentation') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx');
    const isExcel = fileType.includes('spreadsheet') || fileType.includes('excel') ||
                    fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv');
    // Word only if NOT ppt/excel  avoids matching "officedocument" in pptx/xlsx mimeTypes
    const isWord = !isPPT && !isExcel && (
                   fileType.includes('word') || fileType.includes('wordprocessing') ||
                   fileName.endsWith('.doc') || fileName.endsWith('.docx'));
    const isImage = fileType.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    const isVideo = fileType.includes('video') || /\.(mp4|webm|ogg)$/i.test(fileName);

    //  Header 
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.style.cssText = 'padding:16px 20px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; display:flex; justify-content:space-between; align-items:center;';
    modalHeader.innerHTML = `
        <div>
            <h2 style="margin:0; font-size:1.1rem; font-weight:700;">${resource.title}</h2>
            <small style="opacity:0.85;">${resource.instructor} &bull; ${resource.size}</small>
        </div>
        <span class="close" style="cursor:pointer; font-size:1.5rem; line-height:1;">&times;</span>
    `;

    //  Body 
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.style.cssText = 'padding:0;';

    if (isPDF) {
        //  PDF Viewer using PDF.js 
        modalBody.innerHTML = `
            <div style="display:flex; flex-direction:column; height:680px;">
                <!-- Controls bar -->
                <div style="display:flex; align-items:center; gap:10px; padding:10px 16px; background:#f8f9fc; border-bottom:1px solid #e2e8f0; flex-shrink:0;">
                    <button id="prevPage" style="padding:6px 14px; border:1px solid #d1d5db; border-radius:6px; background:#fff; cursor:pointer; font-size:13px;" disabled>
                        &#8592; Previous
                    </button>
                    <span id="pageInfo" style="font-size:13px; color:#374151; font-weight:600; min-width:100px; text-align:center;">Loading...</span>
                    <button id="nextPage" style="padding:6px 14px; border:1px solid #d1d5db; border-radius:6px; background:#fff; cursor:pointer; font-size:13px;" disabled>
                        Next &#8594;
                    </button>
                    <div style="flex:1;"></div>
                    <button id="zoomOut" style="padding:6px 10px; border:1px solid #d1d5db; border-radius:6px; background:#fff; cursor:pointer;">&#8722;</button>
                    <span id="zoomLevel" style="font-size:13px; min-width:50px; text-align:center;">100%</span>
                    <button id="zoomIn" style="padding:6px 10px; border:1px solid #d1d5db; border-radius:6px; background:#fff; cursor:pointer;">&#43;</button>
                    <button id="downloadPdf" style="padding:6px 16px; border:none; border-radius:6px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; cursor:pointer; font-weight:600;">
                        &#8595; Download
                    </button>
                </div>
                <!-- Canvas area -->
                <div id="pdfContainer" style="flex:1; overflow:auto; background:#525252; display:flex; align-items:flex-start; justify-content:center; padding:20px;">
                    <div id="loadingMsg" style="color:#fff; margin-top:60px; text-align:center;">
                        <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i>
                        <p style="margin-top:10px;">Loading document...</p>
                    </div>
                    <canvas id="pdfCanvas" style="display:none; box-shadow:0 4px 20px rgba(0,0,0,0.5);"></canvas>
                </div>
            </div>
        `;

        // Wire download button
        modalBody.querySelector('#downloadPdf').addEventListener('click', () => {
            resource.downloaded = true;
            saveStudentDataToStorage();
            updateResources();
            simulateDownload(resource);
        });

        // Load PDF after modal is in DOM
        setTimeout(() => {
            const canvas     = modalBody.querySelector('#pdfCanvas');
            const ctx        = canvas.getContext('2d');
            const pageInfo   = modalBody.querySelector('#pageInfo');
            const prevBtn    = modalBody.querySelector('#prevPage');
            const nextBtn    = modalBody.querySelector('#nextPage');
            const zoomInBtn  = modalBody.querySelector('#zoomIn');
            const zoomOutBtn = modalBody.querySelector('#zoomOut');
            const zoomLbl    = modalBody.querySelector('#zoomLevel');
            const loadingMsg = modalBody.querySelector('#loadingMsg');

            let pdfDoc = null;
            let currentPage = 1;
            let scale = 1.5;

            // Set PDF.js worker
            if (window.pdfjsLib) {
                pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

                // Fetch PDF as ArrayBuffer with auth token
                fetch(fileUrl, { headers: { 'Authorization': `Bearer ${authToken}` } })
                    .then(r => {
                        if (!r.ok) throw new Error('Failed to fetch PDF');
                        return r.arrayBuffer();
                    })
                    .then(buffer => pdfjsLib.getDocument({ data: buffer }).promise)
                    .then(pdf => {
                        pdfDoc = pdf;
                        loadingMsg.style.display = 'none';
                        canvas.style.display = 'block';
                        pageInfo.textContent = `Page 1 of ${pdf.numPages}`;
                        prevBtn.disabled = true;
                        nextBtn.disabled = pdf.numPages <= 1;
                        renderPage(currentPage);
                    })
                    .catch(err => {
                        loadingMsg.innerHTML = `<p style="color:#f87171;">Failed to load PDF.<br><small>${err.message}</small></p>`;
                    });

                function renderPage(num) {
                    pdfDoc.getPage(num).then(page => {
                        const viewport = page.getViewport({ scale });
                        canvas.width  = viewport.width;
                        canvas.height = viewport.height;
                        page.render({ canvasContext: ctx, viewport }).promise.then(() => {
                            pageInfo.textContent = `Page ${num} of ${pdfDoc.numPages}`;
                            prevBtn.disabled = num <= 1;
                            nextBtn.disabled = num >= pdfDoc.numPages;
                            zoomLbl.textContent = Math.round(scale * 100 / 1.5 * 100) + '%';
                        });
                    });
                }

                prevBtn.addEventListener('click', () => {
                    if (currentPage > 1) { currentPage--; renderPage(currentPage); }
                });
                nextBtn.addEventListener('click', () => {
                    if (pdfDoc && currentPage < pdfDoc.numPages) { currentPage++; renderPage(currentPage); }
                });
                zoomInBtn.addEventListener('click', () => {
                    scale = Math.min(scale + 0.25, 4);
                    if (pdfDoc) renderPage(currentPage);
                });
                zoomOutBtn.addEventListener('click', () => {
                    scale = Math.max(scale - 0.25, 0.5);
                    if (pdfDoc) renderPage(currentPage);
                });
            } else {
                loadingMsg.innerHTML = `<p style="color:#f87171;">PDF.js not loaded. Please refresh the page.</p>`;
            }
        }, 100);

    } else if (isWord || isPPT || isExcel) {
        //  Word / Excel: fetch with auth token, render in browser 
        const fileLabel = isPPT ? 'PowerPoint' : isExcel ? 'Excel Spreadsheet' : 'Word Document';
        const iconClass = isPPT ? 'fa-file-powerpoint' : isExcel ? 'fa-file-excel' : 'fa-file-word';
        const iconColor = isPPT ? '#d04423' : isExcel ? '#217346' : '#2b579a';

        modalBody.innerHTML = `
            <div style="display:flex; flex-direction:column; height:680px;">
                <div style="display:flex; align-items:center; gap:10px; padding:10px 16px; background:#f8f9fc; border-bottom:1px solid #e2e8f0; flex-shrink:0;">
                    <i class="fas ${iconClass}" style="color:${iconColor}; font-size:1.2rem;"></i>
                    <span style="font-size:13px; color:#374151; font-weight:600;">${fileLabel}</span>
                    <div style="flex:1;"></div>
                    <button id="downloadOffice" style="padding:6px 16px; border:none; border-radius:6px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; cursor:pointer; font-weight:600;">
                        &#8595; Download
                    </button>
                </div>
                <div id="docRenderArea" style="flex:1; overflow:auto; background:#f0f2f5; padding:20px; display:flex; align-items:flex-start; justify-content:center;">
                    <div style="color:#667eea; text-align:center; margin-top:60px;">
                        <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i>
                        <p style="margin-top:10px; color:#374151;">Loading document...</p>
                    </div>
                </div>
            </div>
        `;

        modalBody.querySelector('#downloadOffice').addEventListener('click', () => {
            resource.downloaded = true;
            saveStudentDataToStorage();
            updateResources();
            simulateDownload(resource);
        });

        // Fetch file with auth token and render
        fetch(fileUrl, { headers: { 'Authorization': `Bearer ${authToken}` } })
            .then(r => {
                if (r.status === 404) throw new Error('FILE_MISSING');
                if (!r.ok) throw new Error('Failed to fetch file (status ' + r.status + ')');
                return r.arrayBuffer();
            })
            .then(buffer => {
                const renderArea = modalBody.querySelector('#docRenderArea');

                if (isWord && window.mammoth) {
                    // Use mammoth.js to convert Word  HTML
                    mammoth.convertToHtml({ arrayBuffer: buffer })
                        .then(result => {
                            renderArea.innerHTML = `
                                <div style="background:#fff; max-width:800px; width:100%; padding:40px 48px; box-shadow:0 2px 16px rgba(0,0,0,0.12); border-radius:4px; min-height:500px; font-family:'Calibri',sans-serif; font-size:11pt; line-height:1.6; color:#1e293b;">
                                    ${result.value || '<p style="color:#94a3b8; text-align:center;">Empty document</p>'}
                                </div>
                            `;
                        })
                        .catch(() => {
                            renderArea.innerHTML = `<div style="text-align:center; padding:40px;">
                                <i class="fas fa-exclamation-circle" style="font-size:3rem; color:#f59e0b;"></i>
                                <p style="color:#374151; margin-top:12px;">Could not render this document in the browser.</p>
                                <p style="color:#94a3b8; font-size:0.85rem;">Please download it to view locally.</p>
                            </div>`;
                        });

                } else if (isExcel && window.XLSX) {
                    // Use SheetJS to convert Excel  HTML table
                    const wb = XLSX.read(buffer, { type: 'array' });
                    const sheetName = wb.SheetNames[0];
                    const html = XLSX.utils.sheet_to_html(wb.Sheets[sheetName], { editable: false });
                    renderArea.innerHTML = `
                        <div style="background:#fff; width:100%; padding:16px; box-shadow:0 2px 16px rgba(0,0,0,0.12); border-radius:4px; overflow-x:auto;">
                            <style>
                                #excelTable table { border-collapse:collapse; font-size:12px; font-family:Calibri,sans-serif; }
                                #excelTable td, #excelTable th { border:1px solid #d1d5db; padding:4px 8px; white-space:nowrap; }
                                #excelTable tr:first-child td { background:#f0f4ff; font-weight:700; }
                                #excelTable tr:nth-child(even) td { background:#f8fafc; }
                            </style>
                            <div id="excelTable">${html}</div>
                        </div>
                    `;

                } else if (isPPT) {
                    // PPT: render using PPTXjs from a blob URL (no auth needed for blob)
                    if (window.jQuery && typeof window.jQuery.fn.pptxToHtml === 'function') {
                        // Create a blob URL from the fetched buffer
                        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
                        const blobUrl = URL.createObjectURL(blob);

                        renderArea.innerHTML = `<div id="pptxRenderTarget" style="width:100%;"></div>`;
                        try {
                            window.jQuery('#pptxRenderTarget').pptxToHtml({
                                pptxFileUrl: blobUrl,
                                slidesScale: '',
                                slideMode: false,
                                keyBoardShortCut: false,
                                mediaProcess: true
                            });
                            // Cleanup blob URL after render
                            setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
                        } catch (pptErr) {
                            renderArea.innerHTML = `<div style="text-align:center; padding:60px 20px;">
                                <i class="fas fa-file-powerpoint" style="font-size:4rem; color:#d04423; margin-bottom:16px;"></i>
                                <p style="color:#374151; font-weight:600;">Could not render this presentation.</p>
                                <p style="color:#94a3b8; font-size:0.85rem;">Please download to view.</p>
                            </div>`;
                        }
                    } else {
                        renderArea.innerHTML = `<div style="text-align:center; padding:60px 20px;">
                            <i class="fas fa-file-powerpoint" style="font-size:4rem; color:#d04423; margin-bottom:16px;"></i>
                            <p style="color:#374151; font-size:1rem; font-weight:600; margin-bottom:8px;">PowerPoint Presentation</p>
                            <p style="color:#94a3b8; font-size:0.85rem; margin-bottom:24px;">Presentation viewer is loading. If it doesn't appear, please refresh the page.</p>
                            <button onclick="simulateDownload(${JSON.stringify(resource).replace(/"/g,'&quot;')})" style="padding:10px 24px; border:none; border-radius:8px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; cursor:pointer; font-weight:600;">
                                &#8595; Download Presentation
                            </button>
                        </div>`;
                    }
                } else {
                    renderArea.innerHTML = `<div style="text-align:center; padding:40px;">
                        <p style="color:#94a3b8;">Preview not available. Please download the file.</p>
                    </div>`;
                }
            })
            .catch(err => {
                const renderArea = modalBody.querySelector('#docRenderArea');
                if (err.message === 'FILE_MISSING') {
                    renderArea.innerHTML = `<div style="text-align:center; padding:40px;">
                        <i class="fas fa-file-circle-exclamation" style="font-size:3rem; color:#f59e0b; margin-bottom:12px;"></i>
                        <p style="color:#374151; font-weight:600;">This file is no longer available on the server.</p>
                        <p style="color:#94a3b8; font-size:0.85rem;">Please ask your teacher to re-upload this resource.</p>
                    </div>`;
                } else {
                    renderArea.innerHTML = `<div style="text-align:center; padding:40px;">
                        <i class="fas fa-exclamation-circle" style="font-size:3rem; color:#ef4444; margin-bottom:12px;"></i>
                        <p style="color:#374151;">Could not load file: ${err.message}</p>
                        <p style="color:#94a3b8; font-size:0.85rem;">Please try downloading it instead.</p>
                    </div>`;
                }
            });

    } else if (isImage) {
        //  Image Viewer 
        modalBody.innerHTML = `
            <div style="display:flex; flex-direction:column;">
                <div style="display:flex; align-items:center; gap:10px; padding:10px 16px; background:#f8f9fc; border-bottom:1px solid #e2e8f0;">
                    <i class="fas fa-image" style="color:#667eea;"></i>
                    <span style="font-size:13px; color:#374151; font-weight:600;">Image</span>
                    <div style="flex:1;"></div>
                    <button id="downloadImg" style="padding:6px 16px; border:none; border-radius:6px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; cursor:pointer; font-weight:600;">
                        &#8595; Download
                    </button>
                </div>
                <div style="background:#333; text-align:center; padding:20px; max-height:620px; overflow:auto;">
                    <img id="imgDisplay" style="max-width:100%; height:auto; box-shadow:0 4px 20px rgba(0,0,0,0.5); border-radius:4px;" alt="${resource.title}">
                </div>
            </div>
        `;
        // Load image with auth token
        fetch(fileUrl, { headers: { 'Authorization': `Bearer ${authToken}` } })
            .then(r => r.blob())
            .then(blob => {
                modalBody.querySelector('#imgDisplay').src = URL.createObjectURL(blob);
            });
        modalBody.querySelector('#downloadImg').addEventListener('click', () => {
            resource.downloaded = true;
            saveStudentDataToStorage();
            updateResources();
            simulateDownload(resource);
        });

    } else if (isVideo) {
        //  Video Viewer 
        modalBody.innerHTML = `
            <div style="display:flex; flex-direction:column;">
                <div style="display:flex; align-items:center; gap:10px; padding:10px 16px; background:#f8f9fc; border-bottom:1px solid #e2e8f0;">
                    <i class="fas fa-film" style="color:#667eea;"></i>
                    <span style="font-size:13px; color:#374151; font-weight:600;">Video</span>
                    <div style="flex:1;"></div>
                    <button id="downloadVid" style="padding:6px 16px; border:none; border-radius:6px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; cursor:pointer; font-weight:600;">
                        &#8595; Download
                    </button>
                </div>
                <div style="background:#000; text-align:center;">
                    <video id="vidPlayer" controls style="width:100%; max-height:580px;"></video>
                </div>
            </div>
        `;
        // Load video with auth token
        fetch(fileUrl, { headers: { 'Authorization': `Bearer ${authToken}` } })
            .then(r => r.blob())
            .then(blob => {
                modalBody.querySelector('#vidPlayer').src = URL.createObjectURL(blob);
            });
        modalBody.querySelector('#downloadVid').addEventListener('click', () => {
            resource.downloaded = true;
            saveStudentDataToStorage();
            updateResources();
            simulateDownload(resource);
        });

    } else {
        //  Generic file (can't preview) 
        modalBody.innerHTML = `
            <div style="padding:40px; text-align:center;">
                <i class="fas fa-file-alt" style="font-size:4rem; color:#94a3b8; margin-bottom:16px;"></i>
                <p style="color:#374151; font-size:1rem; font-weight:600; margin-bottom:8px;">${resource.title}</p>
                <p style="color:#94a3b8; font-size:0.85rem; margin-bottom:24px;">
                    This file type (${resource.type || 'unknown'}) cannot be previewed in the browser.
                </p>
                <button id="downloadFile" style="padding:10px 24px; border:none; border-radius:8px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; cursor:pointer; font-weight:600; font-size:1rem;">
                    &#8595; Download File
                </button>
            </div>
        `;
        modalBody.querySelector('#downloadFile').addEventListener('click', () => {
            resource.downloaded = true;
            saveStudentDataToStorage();
            updateResources();
            simulateDownload(resource);
        });
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
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Authentication required', 'error');
        return;
    }
    
    // Validate assignment ID
    if (!assignmentId) {
        showNotification('Assignment ID is required', 'error');
        return;
    }
    
    // Create FormData object
    const formData = new FormData();
    formData.append('content', notes || 'Assignment submission');
    
    // Append file if provided
    if (file) {
        formData.append('file', file);
    }
    
    // Show loading state
    showNotification('Submitting assignment...', 'info');
    
    // Send request to submit assignment
    fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Assignment submitted successfully!', 'success');
            
            // Refresh assignments list
            fetchAssignmentsData();
        } else {
            showNotification(data.message || 'Failed to submit assignment', 'error');
        }
    })
    .catch(error => {
        console.error('Error submitting assignment:', error);
        showNotification('Failed to submit assignment', 'error');
    });
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

// Load reply thread for a message
async function loadStudentReplyThread(mongoId) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/messages/${mongoId}/replies`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success || !data.data || data.data.length === 0) return;

        const threadEl = document.getElementById('studentReplyThread');
        const listEl = document.getElementById('studentReplyList');
        if (!threadEl || !listEl) return;

        threadEl.style.display = 'block';
        listEl.innerHTML = data.data.map(reply => {
            const senderName = reply.sender ? reply.sender.name : 'Unknown';
            const time = new Date(reply.createdAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            return `
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:0.85rem; border-left:4px solid #6c5ce7;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
                        <strong style="color:#6c5ce7; font-size:0.9rem;">${senderName}</strong>
                        <span style="color:#94a3b8; font-size:0.8rem;">${time}</span>
                    </div>
                    <p style="margin:0; white-space:pre-wrap; font-size:0.9rem; color:#374151;">${reply.content}</p>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Load student reply thread error:', err);
    }
}

// Submit student reply
async function submitStudentReply() {
    const content = document.getElementById('studentReplyContent').value.trim();
    if (!content) {
        showNotification('Please write a reply first', 'error');
        return;
    }

    const modal = document.getElementById('messageModal');
    const senderId = modal.getAttribute('data-sender-id');
    const mongoId = modal.getAttribute('data-mongo-id');
    const subject = document.getElementById('messageSubject').textContent;

    if (!senderId) {
        showNotification('Cannot determine recipient', 'error');
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
                recipients: [senderId],
                subject: `Re: ${subject}`,
                content,
                parentId: mongoId
            })
        });
        const data = await res.json();

        if (data.success || res.ok) {
            showNotification('Reply sent successfully!', 'success');
            document.getElementById('studentReplyBox').style.display = 'none';
            document.getElementById('studentReplyContent').value = '';
            // Reload the thread to show the new reply
            if (mongoId) await loadStudentReplyThread(mongoId);
        } else {
            showNotification(data.message || 'Failed to send reply', 'error');
        }
    } catch (err) {
        console.error('Submit student reply error:', err);
        showNotification('Failed to send reply', 'error');
    }
}

// Open compose message modal
function openComposeMessageModal() {
    // In a real implementation, this would open a compose modal
    showNotification('Compose message functionality would open here', 'info');
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

//  Attendance Table Update 
function updateAttendanceTable(attendanceData) {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!attendanceData || attendanceData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No attendance records found</td></tr>';
        return;
    }

    attendanceData.forEach(record => {
        const statusClass = record.status === 'Excellent' || record.status === 'Good' ? 'success' :
                           record.status === 'Satisfactory' ? 'warning' : 'danger';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.course}</td>
            <td>${record.instructor}</td>
            <td>${record.held}</td>
            <td>${record.attended}</td>
            <td>${record.rate}</td>
            <td><span class="badge badge-${statusClass}">${record.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

//  Per-Class Attendance Fetch 
function fetchPerClassAttendance(authToken) {
    // Fetch all attendance records for the student
    fetch('/api/attendance?studentId=me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.data) {
            const records = Array.isArray(data.data) ? data.data : (data.data.attendance || []);

            // Group by class
            const byClass = {};
            records.forEach(rec => {
                const className = rec.class ? (rec.class.name || rec.class) : 'Unknown';
                const instructor = rec.class && rec.class.teacher ? rec.class.teacher.name : 'N/A';
                if (!byClass[className]) {
                    byClass[className] = { course: className, instructor, held: 0, attended: 0, late: 0 };
                }
                byClass[className].held++;
                if (rec.status === 'present') byClass[className].attended++;
                else if (rec.status === 'late') { byClass[className].attended++; byClass[className].late++; }
            });

            const perClassData = Object.values(byClass).map(c => ({
                ...c,
                rate: c.held > 0 ? `${Math.round((c.attended / c.held) * 100)}%` : '0%',
                status: c.held > 0 && (c.attended / c.held) >= 0.9 ? 'Excellent' :
                        c.held > 0 && (c.attended / c.held) >= 0.8 ? 'Good' :
                        c.held > 0 && (c.attended / c.held) >= 0.7 ? 'Satisfactory' : 'Needs Improvement'
            }));

            if (perClassData.length > 0) {
                studentData.attendance = perClassData;
                updateAttendanceTable(perClassData);
            }
        }
    })
    .catch(err => console.error('Per-class attendance error:', err));
}

// Resource viewing functions
function viewResource(resourceId) {
    const resource = studentData.resources.find(r => r.id === resourceId);
    if (!resource) {
        showNotification('Resource not found', 'error');
        return;
    }
    openResourceViewer(resource);
}

function closeResourceViewer() {
    const modal = document.getElementById('resourceViewerModal');
    const frame = document.getElementById('resourceViewerFrame');
    modal.style.display = 'none';
    frame.src = '';
}

// Download resource function  
function downloadResource(resourceId) {
    const resource = studentData.resources.find(r => r.id === resourceId);
    if (!resource) {
        showNotification('Resource not found', 'error');
        return;
    }
    simulateDownload(resource);
}

//  Student Authentication Check 
function checkStudentAuthentication() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    if (!authToken || !currentUser) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const user = JSON.parse(currentUser);
        if (user.role !== 'student') {
            const dashboards = {
                'teacher': 'teacher-dashboard.html',
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


// ==================== ENROLLMENT / COURSES SECTION ====================

// Load pending enrollment requests  disabled (auto-enrollment means no pending state)
function loadPendingEnrollments() {
    // Auto-enrollment: all students are enrolled immediately by the teacher.
    // Pending section removed from UI. This function is kept as a no-op.
}

// Load enrolled courses
// Load enrolled courses  fetches both EnrollmentRequests AND direct Class enrollments (for HOD-taught classes)
async function loadEnrolledCourses() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const tbody = document.getElementById('enrolledCoursesTable');
    const countBadge = document.getElementById('enrolledCount');
    if (!tbody) return;

    try {
        const ts = new Date().getTime();
        // Fetch both sources in parallel
        const [enrollRes, classRes] = await Promise.all([
            fetch(`/api/enrollments/my-requests?_t=${ts}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
            }).then(r => r.json()),
            fetch(`/api/classes?_t=${ts}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json())
        ]);

        // --- Source 1: EnrollmentRequest records (teacher-enrolled courses) ---
        const enrollRows = (enrollRes.success && enrollRes.data.requests)
            ? enrollRes.data.requests.filter(r => r.status === 'accepted')
            : [];

        // Track class IDs already covered by enrollment requests
        const coveredClassIds = new Set(enrollRows.map(r => r.class?._id?.toString()).filter(Boolean));

        // --- Source 2: Direct class enrollments (HOD-taught or admin-created) ---
        const directClasses = (classRes.success && classRes.data.classes)
            ? classRes.data.classes.filter(cls => !coveredClassIds.has(cls._id?.toString()))
            : [];

        const totalCount = enrollRows.length + directClasses.length;

        if (totalCount === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#999;">No enrolled courses yet</td></tr>';
            if (countBadge) countBadge.style.display = 'none';
            return;
        }

        tbody.innerHTML = '';

        // Render enrollment-request based rows
        enrollRows.forEach(req => {
            const enrolledDate = req.respondedAt
                ? new Date(req.respondedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '-';
            const credits = req.subject?.credits || req.class?.credits || 10;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${req.class?.name || 'N/A'}</strong></td>
                <td>${req.class?.code || '-'}</td>
                <td>${req.teacher?.name || 'N/A'}</td>
                <td><strong>${credits}</strong></td>
                <td>${enrolledDate}</td>
                <td><span class="status-badge success"><i class="fas fa-check-circle"></i> Active</span></td>
            `;
            tbody.appendChild(row);
        });

        // Render direct class rows (HOD-taught, no EnrollmentRequest)
        directClasses.forEach(cls => {
            const teacherName = cls.teacher?.name || 'N/A';
            const enrolledDate = new Date(cls.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${cls.name}</strong></td>
                <td>${cls.code || '-'}</td>
                <td>${teacherName}</td>
                <td><strong>${cls.credits || 10}</strong></td>
                <td>${enrolledDate}</td>
                <td><span class="status-badge success"><i class="fas fa-check-circle"></i> Active</span></td>
            `;
            tbody.appendChild(row);
        });

        if (countBadge) {
            countBadge.textContent = `${totalCount} enrolled`;
            countBadge.style.display = 'inline-block';
        }
    } catch (err) {
        console.error('Error loading enrolled courses:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#f44336;">Error loading enrolled courses</td></tr>';
    }
}

// Accept enrollment
function acceptEnrollment(enrollmentId, courseName) {
    if (!confirm(`Do you want to enroll in "${courseName}"?`)) return;
    
    const token = localStorage.getItem('authToken');
    const btn = event.target.closest('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enrolling...';
    
    fetch(`/api/enrollments/${enrollmentId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showNotification(` Successfully enrolled in ${courseName}!`, 'success');
            loadPendingEnrollments();
            loadEnrolledCourses();
        } else {
            showNotification(' Failed to enroll: ' + data.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Accept';
        }
    })
    .catch(err => {
        console.error('Error accepting enrollment:', err);
        showNotification(' Network error. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Accept';
    });
}

// Reject enrollment
function rejectEnrollment(enrollmentId, courseName) {
    if (!confirm(`Are you sure you want to reject enrollment in "${courseName}"?`)) return;
    
    const token = localStorage.getItem('authToken');
    const btn = event.target.closest('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rejecting...';
    
    fetch(`/api/enrollments/${enrollmentId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showNotification(`Enrollment request for ${courseName} rejected`, 'info');
            loadPendingEnrollments();
        } else {
            showNotification('Failed to reject: ' + data.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-times"></i> Reject';
        }
    })
    .catch(err => {
        console.error('Error rejecting enrollment:', err);
        showNotification('Network error. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-times"></i> Reject';
    });
}

// Update notification badge  delegate to unified system (triggers live reload)
function updateNotificationBadge(count) {
    if (window.notificationManager) {
        window.notificationManager.loadNotifications();
    }
}

// Initialize courses section
document.addEventListener('DOMContentLoaded', function() {
    // Load courses data initially
    loadPendingEnrollments();
    loadEnrolledCourses();
    
    // Refresh pending enrollments every 30 seconds
    setInterval(loadPendingEnrollments, 30000);
    
    // Also load when navigating to courses section
    const coursesLink = document.querySelector('[data-section="courses"]');
    if (coursesLink) {
        coursesLink.addEventListener('click', function() {
            loadPendingEnrollments();
            loadEnrolledCourses();
        });
    }

});


//  College Announcements (from Principal) 
async function loadCollegeAnnouncements() {
    const container = document.getElementById('studentAnnouncementsOverview');
    if (!container) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/announcements', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const announcements = data.success ? (data.data?.announcements || []) : [];

        if (announcements.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:1rem;">No announcements at this time.</p>';
            return;
        }

        const priorityColors = {
            high: { bg:'#fef2f2', color:'#dc2626', label:'High' },
            medium: { bg:'#fffbeb', color:'#d97706', label:'Medium' },
            low: { bg:'#f0fdf4', color:'#16a34a', label:'Low' },
        };

        container.innerHTML = announcements.slice(0, 5).map(a => {
            const p = priorityColors[a.priority] || priorityColors.medium;
            const date = new Date(a.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
            return `
                <div style="border:1px solid #e2e8f0; border-left:4px solid ${p.color}; border-radius:8px; padding:0.9rem 1rem; margin-bottom:0.75rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem; flex-wrap:wrap; gap:0.4rem;">
                        <div style="font-weight:600; color:#1e293b; font-size:0.95rem;">${a.title}</div>
                        <div style="display:flex; gap:0.4rem; align-items:center;">
                            <span style="background:${p.bg};color:${p.color};padding:0.15rem 0.5rem;border-radius:20px;font-size:0.72rem;font-weight:600;">${p.label}</span>
                            <span style="color:#94a3b8;font-size:0.78rem;">${date}</span>
                        </div>
                    </div>
                    <p style="margin:0; color:#374151; font-size:0.88rem; line-height:1.5;">${a.content}</p>
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:1rem;">Could not load announcements.</p>';
    }
}


// 
//  STUDENT ANNOUNCEMENTS 
// 

async function loadStudentAnnouncements() {
    const container = document.getElementById('studentAnnouncementsList');
    if (!container) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:2rem;">Please login to view announcements.</p>';
        return;
    }
    
    try {
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
        console.error('loadStudentAnnouncements error:', err);
        if (container) container.innerHTML = '<p style="color:#f44336;text-align:center;padding:1rem;">Failed to load announcements.</p>';
    }
}

// Use MutationObserver to detect when announcements section becomes visible
(function() {
    let announcementsLoaded = false;
    
    // Try loading after a delay (page load)
    setTimeout(function() {
        if (!announcementsLoaded && localStorage.getItem('authToken')) {
            announcementsLoaded = true;
            loadStudentAnnouncements();
        }
    }, 2000);
    
    // Also load when clicking the announcements sidebar link
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[data-section="announcements"]');
        if (link) {
            // Small delay to let the section become visible
            setTimeout(function() {
                loadStudentAnnouncements();
            }, 100);
        }
    });
})();
