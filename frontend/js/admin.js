document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard: DOMContentLoaded fired');
    
    // admin-programs.js handles the new dashboard UI fully.
    // Only run legacy admin.js initialization if the legacy elements exist.
    // The new dashboard (admin-programs.js) manages auth, nav, and data loading.
    
    // Check if we're on the new dashboard (has admin-programs.js elements)
    if (document.getElementById('programsTableBody')) {
        console.log('New admin dashboard detected  admin-programs.js handles initialization.');
        // Only set up notifications and charts from legacy code
        setupNotifications();
        try { setupCharts(); } catch(e) {}
        return;
    }
    
    // Legacy initialization for old dashboard structure
    checkAuthentication();
    initializeDashboard();
    setupNavigation();
    setupMobileMenu();
    setupInteractiveElements();
    setupForms();
    setupDataTables();
    setupNotifications();
    setupResourceMonitoring();
    setupActivityLogs();
    setupReportGeneration();
    setupModals();
    setupCharts();
    
    console.log('Admin Dashboard: All initialization functions called');
});

// Check if user is authenticated
function checkAuthentication() {
    console.log('Admin Dashboard: Checking authentication...');
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    
    console.log('Auth token exists:', !!authToken);
    console.log('Current user exists:', !!currentUser);
    
    if (!authToken || !currentUser) {
        console.log('No auth token or user, redirecting to login');
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const user = JSON.parse(currentUser);
        console.log('Parsed user:', user);
        if (user.role !== 'admin') {
            console.log('User is not admin, redirecting to appropriate dashboard');
            // Redirect to appropriate dashboard based on role
            redirectToDashboard(user.role);
            return;
        }
        console.log('Authentication successful - user is admin');
    } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = 'login.html';
    }
}

// Redirect to appropriate dashboard based on role
function redirectToDashboard(role) {
    const dashboards = {
        'student': 'student-dashboard.html',
        'teacher': 'teacher-dashboard.html',
        'hod': 'HOD-dashboard.html',
        'managing_authority': 'managing-authority.html'
    };
    
    window.location.href = dashboards[role] || 'login.html';
}

// Load admin user information
function loadAdminUserInfo() {
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) return;
    
    try {
        const user = JSON.parse(currentUser);
        
        // Update admin name in sidebar
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement && user.name) {
            adminNameElement.textContent = user.name;
        }
        
        // Update welcome message
        const welcomeMessageElement = document.getElementById('welcomeMessage');
        if (welcomeMessageElement && user.name) {
            const firstName = user.name.split(' ')[0];
            welcomeMessageElement.textContent = `Welcome back, ${firstName}! Here's what's happening with the system.`;
        }
    } catch (error) {
        console.error('Error loading admin user info:', error);
    }
}

// Load department options for dropdowns
// Load department options for dropdowns
// Uses hardcoded canonical list so it is always correct and instant (no API call needed).
function loadDepartmentOptions() {
    const DEPARTMENTS = ['CSE', 'IT', 'CSE(DS)', 'CSE(AI)', 'ECE'];

    const buildOptions = () => {
        let html = '<option value="">Select Department</option>';
        DEPARTMENTS.forEach(d => { html += `<option value="${d}">${d}</option>`; });
        return html;
    };

    const userDeptSelect  = document.getElementById('userDept');
    const courseDeptSelect = document.getElementById('courseDept');

    if (userDeptSelect)   userDeptSelect.innerHTML  = buildOptions();
    if (courseDeptSelect) courseDeptSelect.innerHTML = buildOptions();

    console.log('Department dropdowns populated:', DEPARTMENTS);
}

// Initialize dashboard components
function initializeDashboard() {
    // Set default date for activity logs filter
    const currentDate = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('activityLogDate');
    if (dateInput) {
        dateInput.value = currentDate;
    }
    // Load admin user info
    loadAdminUserInfo();
    
    // Set current date for activity logs
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = formattedDate;
        }
    });
    
    // Initialize notification badge
    updateNotificationBadge(8);
    
    // Notification dropdown is now handled by notifications.js
    // populateNotificationDropdown(); // Disabled to prevent duplicate panels
    
    // Load all dynamic data with error handling
    try {
        loadDashboardStats();
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
    
    try {
        loadDepartments();
    } catch (error) {
        console.error('Error loading departments:', error);
    }
    
    try {
        loadUsers();
    } catch (error) {
        console.error('Error loading users:', error);
    }
    
    try {
        loadCourses();
    } catch (error) {
        console.error('Error loading courses:', error);
    }
    
    try {
        loadActivityLogs();
    } catch (error) {
        console.error('Error loading activity logs:', error);
    }
    
    try {
        loadReports();
    } catch (error) {
        console.error('Error loading reports:', error);
    }

    // Force immediate recent activity load to override any conflicts
    setTimeout(() => {
        try {
            console.log('Force loading recent activity...');
            loadRecentActivity();
        } catch (error) {
            console.error('Error force loading recent activity:', error);
        }
    }, 100);

    // Auto-refresh recent activity every 30 seconds
    setInterval(() => {
        try {
            loadRecentActivity();
        } catch (error) {
            console.error('Error in recent activity auto-refresh:', error);
        }
    }, 30000);
    
    // Setup charts after data is loaded
    setTimeout(setupCharts, 1500);
}

// Load dashboard statistics
function loadDashboardStats() {
    console.log('loadDashboardStats: Starting...');
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.log('loadDashboardStats: No auth token found');
        return;
    }

    console.log('loadDashboardStats: Auth token found, making API calls...');

    // 1. Total Users (real)
    fetch('/api/users?limit=1', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.data?.pagination) {
            const total = data.data.pagination.total;
            const card = document.querySelector('#overview .stat-card:nth-child(2)');
            if (card) {
                card.querySelector('.stat-card-value').textContent = total.toLocaleString();
                const newU = Math.max(1, Math.floor(total * 0.1));
                card.querySelector('.stat-card-change').innerHTML =
                    `<i class="fas fa-arrow-up"></i> ${newU} new this month`;
            }
        }
    }).catch(console.error);

    // 2. Active Courses / Classes (real)
    fetch('/api/classes', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.data?.classes) {
            const count = data.data.classes.length;
            const card = document.querySelector('#overview .stat-card:nth-child(3)');
            if (card) {
                card.querySelector('.stat-card-value').textContent = count;
                card.querySelector('.stat-card-change').innerHTML =
                    `<i class="fas fa-arrow-up"></i> ${Math.max(1, Math.floor(count * 0.08))} from last semester`;
            }
        }
    }).catch(console.error);

    // 3. Total Departments (real)
    fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.data) {
            const card = document.querySelector('#overview .stat-card:nth-child(1)');
            if (card) card.querySelector('.stat-card-value').textContent = data.data.count;
        }
    }).catch(console.error);

    // 4. Pending Approvals (real)
    fetch('/api/approvals?status=pending&limit=100', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(r => r.json())
    .then(data => {
        const count = data.success ? (data.data?.requests?.length || data.data?.count || 0) : 0;
        const valEl    = document.getElementById('pendingApprovalsValue');
        const changeEl = document.getElementById('pendingApprovalsChange');
        if (valEl) valEl.textContent = count;
        if (changeEl) {
            if (count === 0) {
                changeEl.innerHTML = '<i class="fas fa-check-circle" style="color:#22c55e;"></i> No pending approvals';
                changeEl.className = 'stat-card-change positive';
            } else {
                changeEl.innerHTML = `<i class="fas fa-exclamation-circle" style="color:#f59e0b;"></i> ${count} awaiting review`;
                changeEl.className = 'stat-card-change';
            }
        }
    }).catch(() => {
        const valEl = document.getElementById('pendingApprovalsValue');
        if (valEl) valEl.textContent = '0';
    });

    // 5. Recent Activity (real  from activity logs API)
    loadRecentActivity(authToken);
}

// Load recent activity into dashboard table (top 5 from activity logs)
function loadRecentActivity(authToken) {
    console.log('loadRecentActivity called, authToken:', !!authToken);
    if (!authToken) authToken = localStorage.getItem('authToken');
    const tbody = document.getElementById('recentActivityBody');
    if (!tbody) {
        console.log('recentActivityBody element not found');
        return;
    }

    console.log('Loading recent activity...');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    fetch('/api/activity-logs?limit=5', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(r => {
        console.log('Recent Activity API Response status:', r.status);
        console.log('Recent Activity API Response headers:', r.headers);
        if (!r.ok) {
            throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
    })
    .then(data => {
        console.log('Recent Activity API Response data:', data);
        const logs = data.success ? (data.data?.logs || []) : [];
        console.log('Processed logs count:', logs.length);

        if (!logs.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:#94a3b8;">No recent activity found</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => {
            const statusClass = log.status === 'success' ? 'success'
                              : log.status === 'failed'  ? 'danger'
                              : 'warning';
            const statusLabel = log.status
                ? (log.status.charAt(0).toUpperCase() + log.status.slice(1))
                : 'Info';

            // timestamp field (not createdAt)
            const time  = log.timestamp ? timeAgo(new Date(log.timestamp)) : 'Recently';
            // userName stored directly on log
            const user    = log.userName || log.user?.name || 'System';
            const action  = log.actionLabel || log.action || 'Action';
            const details = log.description || '';

            return `<tr>
                <td><strong>${escHtml(user)}</strong></td>
                <td>${escHtml(action)}</td>
                <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escHtml(details)}">${escHtml(details)}</td>
                <td style="white-space:nowrap;">${time}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            </tr>`;
        }).join('');
    })
    .catch(err => {
        console.log('Recent Activity API Error:', err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:#94a3b8;">Unable to load activity</td></tr>';
    });
}

// Helper: escape HTML
function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Helper: time ago string
function timeAgo(date) {
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
}

// Load departments data
function loadDepartments() {
    const departmentsTable = document.querySelector('#departments tbody');
    if (!departmentsTable) return;
    
    // Show loading message
    departmentsTable.innerHTML = '<tr><td colspan="6" class="text-center">Loading departments...</td></tr>';
    
    // Get auth token
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        departmentsTable.innerHTML = '<tr><td colspan="6" class="text-center">Please login to view departments</td></tr>';
        return;
    }
    
    // Fetch departments from backend API
    fetch('/api/departments', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        // Clear table
        departmentsTable.innerHTML = '';
        
        if (data.success && data.data && data.data.departments && data.data.departments.length > 0) {
            // Add departments to table
            data.data.departments.forEach(dept => {
                addDepartmentToTable(
                    dept.name,
                    dept.hod,
                    dept.faculty,
                    dept.students,
                    dept.isActive,
                    dept._id
                );
            });
        } else {
            departmentsTable.innerHTML = '<tr><td colspan="6" class="text-center">No departments found</td></tr>';
        }
        
        // Load department options for dropdowns
        loadDepartmentOptions();
    })
    .catch(error => {
        console.error('Error fetching departments:', error);
        departmentsTable.innerHTML = '<tr><td colspan="6" class="text-center">Error loading departments. Please try again.</td></tr>';
    });
}

// Load users from API
function loadUsers() {
    console.log('loadUsers() called');
    // Show loading message
    const usersTable = document.querySelector('#users tbody');
    if (!usersTable) return;
    
    // Clear existing content
    usersTable.innerHTML = '<tr><td colspan="7" class="text-center">Loading users...</td></tr>';
    
    // Get auth token
    const authToken = localStorage.getItem('authToken');
    console.log('Auth token:', authToken ? 'exists' : 'missing');
    
    if (!authToken) {
        usersTable.innerHTML = '<tr><td colspan="7" class="text-center">Please login to view users</td></tr>';
        return;
    }
    
    // Fetch users from backend API
    console.log('Fetching users from API...');
    fetch('/api/users?limit=100', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        console.log('Users API response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Users API data:', data);
        // Clear table
        usersTable.innerHTML = '';
        
        if (data.success && data.data && data.data.users && data.data.users.length > 0) {
            // Add users to table
            data.data.users.forEach(user => {
                const userRole = capitalizeRole(user.role);
                // Display appropriate ID based on role
                let userId = 'N/A';
                if (user.role === 'student' && user.studentId) {
                    userId = user.studentId;
                } else if ((user.role === 'teacher' || user.role === 'hod') && user.teacherId) {
                    userId = user.teacherId;
                } else if (user.role === 'admin' || user.role === 'managing_authority') {
                    // For admin and managing authority, we can show a shortened version of the _id
                    userId = user._id ? user._id.substring(0, 8) : 'N/A';
                } else {
                    // Fallback to _id if no specific ID is available
                    userId = user._id ? user._id.substring(0, 8) : 'N/A';
                }
                const userStatus = user.isActive ? 'Active' : 'Suspended';
                
                addUserToTable(
                    user.name,
                    userId,
                    userRole,
                    user.department || 'N/A',
                    user.email,
                    userStatus
                );
            });
            
            // Update user count
            updateUserCount();
        } else {
            usersTable.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error fetching users:', error);
        usersTable.innerHTML = '<tr><td colspan="7" class="text-center">Error loading users. Please try again.</td></tr>';
    });
}

// Helper function to capitalize role
function capitalizeRole(role) {
    const roleMap = {
        'student': 'Student',
        'teacher': 'Faculty',
        'hod': 'HOD',
        'admin': 'Administrator',
        'managing_authority': 'Managing Authority'
    };
    return roleMap[role] || role;
}

// Load courses from API
function loadCourses() {
    // Show loading message
    const coursesTable = document.querySelector('#courses tbody');
    if (!coursesTable) return;
    
    // Clear existing content
    coursesTable.innerHTML = '<tr><td colspan="7" class="text-center">Loading courses...</td></tr>';
    
    // Get auth token
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        coursesTable.innerHTML = '<tr><td colspan="7" class="text-center">Please login to view courses</td></tr>';
        return;
    }
    
    // Fetch classes from backend API
    fetch('/api/classes', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        // Clear table
        coursesTable.innerHTML = '';
        
        if (data.success && data.data && data.data.classes && data.data.classes.length > 0) {
            // Add courses to table
            data.data.classes.forEach(course => {
                const courseCode = course.code || course._id.substring(0, 8).toUpperCase();
                const teacherName = course.teacher ? course.teacher.name : 'Not Assigned';
                
                // Use credits from course object, fallback to 10 if not specified
                let credits = course.credits || 10;
                let type = 'Core'; // Default value
                let department = 'General'; // Default value
                
                // Try to extract information from description if available
                if (course.description) {
                    // Extract type (assuming format like "Type: Elective")
                    const typeMatch = course.description.match(/Type:\s*([^,]+)/i);
                    if (typeMatch) {
                        type = typeMatch[1].trim();
                    }
                    
                    // Extract department (assuming format like "Department: Computer Science")
                    const deptMatch = course.description.match(/Department:\s*(.+)/i);
                    if (deptMatch) {
                        department = deptMatch[1].trim();
                    }
                }
                
                const status = course.isActive ? 'Active' : 'Inactive';
                
                addCourseToTable(
                    course._id,
                    courseCode,
                    course.name,
                    department,
                    credits,
                    type,
                    status
                );
            });
            
            // Update course count
            updateCourseCount();
        } else {
            coursesTable.innerHTML = '<tr><td colspan="7" class="text-center">No courses found</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error fetching courses:', error);
        coursesTable.innerHTML = '<tr><td colspan="7" class="text-center">Error loading courses. Please try again.</td></tr>';
    });
}

// Load system status data
function loadSystemStatus() {
    // DISABLED: This function was incorrectly targeting the recent activity table
    // const systemStatusTable = document.querySelector('#overview .data-table tbody');
    // if (!systemStatusTable) return;
    
    // System status functionality has been removed from the overview section
    // as it was conflicting with the recent activity table
    console.log('System status loading disabled - was conflicting with recent activity');
    return;
    
    /* 
    // Show loading message
    systemStatusTable.innerHTML = '<tr><td colspan="5" class="text-center">Loading system status...</td></tr>';
    
    // Simulate API call
    setTimeout(() => {
        // Sample system status data
        const services = [
            { name: 'Database Server', status: 'Operational', uptime: '99.9%', lastCheck: '5 min ago' },
            { name: 'Authentication Service', status: 'Operational', uptime: '100%', lastCheck: '2 min ago' },
            { name: 'File Storage', status: 'Degraded', uptime: '97.5%', lastCheck: '1 min ago' },
            { name: 'Notification Service', status: 'Operational', uptime: '99.8%', lastCheck: '3 min ago' }
        ];
        
        // Clear table
        systemStatusTable.innerHTML = '';
        
        // Add services to table
        services.forEach(service => {
            const row = document.createElement('tr');
            const statusClass = service.status === 'Operational' ? 'success' : 'warning';
            
            row.innerHTML = `
                <td>${service.name}</td>
                <td><span class="status-badge ${statusClass}">${service.status}</span></td>
                <td>${service.uptime}</td>
                <td>${service.lastCheck}</td>
                <td>
                    <a href="#" class="btn btn-sm btn-outline">${service.status === 'Degraded' ? 'Check' : 'Restart'}</a>
                </td>
            `;
            
            systemStatusTable.appendChild(row);
        });
    }, 600);
    */
}

// Load resource usage data for dashboard
function loadDashboardResourceUsage() {
    // Simulate API call to get resource usage data
    setTimeout(() => {
        // Get all resource items
        const resourceItems = document.querySelectorAll('.resource-item');
        
        if (resourceItems.length >= 4) {
            // CPU Usage
            const cpuItem = resourceItems[0];
            const cpuValue = cpuItem.querySelector('.resource-value');
            const cpuFill = cpuItem.querySelector('.progress-fill');
            if (cpuValue && cpuFill) {
                // Generate a random value between 30-70 for demo
                const value = Math.floor(Math.random() * 40) + 30;
                cpuValue.textContent = `${value}%`;
                cpuFill.style.width = `${value}%`;
            }
            
            // Memory Usage
            const memoryItem = resourceItems[1];
            const memoryValue = memoryItem.querySelector('.resource-value');
            const memoryFill = memoryItem.querySelector('.progress-fill');
            if (memoryValue && memoryFill) {
                // Generate a random value between 50-80 for demo
                const value = Math.floor(Math.random() * 30) + 50;
                memoryValue.textContent = `${value}%`;
                memoryFill.style.width = `${value}%`;
            }
            
            // Disk Space
            const diskItem = resourceItems[2];
            const diskValue = diskItem.querySelector('.resource-value');
            const diskFill = diskItem.querySelector('.progress-fill');
            if (diskValue && diskFill) {
                // Generate a random value between 70-90 for demo
                const value = Math.floor(Math.random() * 20) + 70;
                diskValue.textContent = `${value}%`;
                diskFill.style.width = `${value}%`;
            }
            
            // Network Traffic
            const networkItem = resourceItems[3];
            const networkValue = networkItem.querySelector('.resource-value');
            const networkFill = networkItem.querySelector('.progress-fill');
            if (networkValue && networkFill) {
                // Generate a random value between 80-150 for demo
                const value = Math.floor(Math.random() * 70) + 80;
                networkValue.textContent = `${value} Mbps`;
                // For network traffic, we'll use a fixed percentage for the progress bar
                // since it's not a percentage value
                networkFill.style.width = '45%';
            }
        }
    }, 600);
}

// Update the loadResourceUsage function to also update dashboard resource usage
function loadResourceUsage() {
    // Simulate API call to get resource usage data
    setTimeout(() => {
        // Update resource cards with dynamic data
        const resourceCards = document.querySelectorAll('#resources .stat-card');
        
        if (resourceCards.length >= 4) {
            // CPU Usage
            const cpuValue = resourceCards[0].querySelector('.stat-card-value');
            const cpuChange = resourceCards[0].querySelector('.stat-card-change');
            if (cpuValue) {
                // Generate a random value between 30-70 for demo
                const value = Math.floor(Math.random() * 40) + 30;
                cpuValue.textContent = `${value}%`;
            }
            if (cpuChange) {
                cpuChange.innerHTML = '<i class="fas fa-info-circle"></i> Normal';
            }
            
            // Memory Usage
            const memoryValue = resourceCards[1].querySelector('.stat-card-value');
            const memoryChange = resourceCards[1].querySelector('.stat-card-change');
            if (memoryValue) {
                // Generate a random value between 50-80 for demo
                const value = Math.floor(Math.random() * 30) + 50;
                memoryValue.textContent = `${value}%`;
            }
            if (memoryChange) {
                // Calculate GB values for demo
                const percent = parseInt(memoryValue.textContent);
                const totalGB = 12;
                const usedGB = Math.round((percent / 100) * totalGB * 10) / 10;
                memoryChange.innerHTML = `<i class="fas fa-info-circle"></i> ${usedGB} GB of ${totalGB} GB`;
            }
            
            // Disk Space
            const diskValue = resourceCards[2].querySelector('.stat-card-value');
            const diskChange = resourceCards[2].querySelector('.stat-card-change');
            if (diskValue) {
                // Generate a random value between 70-90 for demo
                const value = Math.floor(Math.random() * 20) + 70;
                diskValue.textContent = `${value}%`;
            }
            if (diskChange) {
                // Calculate GB values for demo
                const percent = parseInt(diskValue.textContent);
                const totalGB = 400;
                const usedGB = Math.round((percent / 100) * totalGB);
                diskChange.innerHTML = `<i class="fas fa-info-circle"></i> ${usedGB} GB of ${totalGB} GB`;
            }
            
            // Network Traffic
            const networkValue = resourceCards[3].querySelector('.stat-card-value');
            const networkChange = resourceCards[3].querySelector('.stat-card-change');
            if (networkValue) {
                // Generate a random value between 80-150 for demo
                const value = Math.floor(Math.random() * 70) + 80;
                networkValue.textContent = `${value} Mbps`;
            }
            if (networkChange) {
                // Calculate in/out values for demo
                const total = parseInt(networkValue.textContent);
                const inValue = Math.floor(total * 0.6);
                const outValue = total - inValue;
                networkChange.innerHTML = `<i class="fas fa-info-circle"></i> In: ${inValue} Mbps, Out: ${outValue} Mbps`;
            }
        }
        
        // Update resource charts
        updateResourceCharts();
        
        // Also update dashboard resource usage
        loadDashboardResourceUsage();
    }, 700);
}

// Load activity logs data
function loadActivityLogs(startDate = null, endDate = null) {
    console.log('loadActivityLogs called with startDate:', startDate, 'endDate:', endDate);
    const logsTable = document.querySelector('#logs tbody');
    if (!logsTable) return;
    
    // Show loading message
    logsTable.innerHTML = '<tr><td colspan="6" class="text-center">Loading activity logs...</td></tr>';
    
    // Get auth token
    const authToken = localStorage.getItem('authToken');
    console.log('Auth token for activity logs:', authToken ? 'Present' : 'Missing');
    
    if (!authToken) {
        logsTable.innerHTML = '<tr><td colspan="6" class="text-center">Please login to view activity logs</td></tr>';
        return;
    }
    
    // Build API URL with filters
    let apiUrl = '/api/activity-logs?limit=50';
    
    // Add date filters if provided
    if (startDate) {
        // Convert date format from YYYY-MM-DD to ensure compatibility with backend
        apiUrl += `&startDate=${encodeURIComponent(startDate)}`;
    }
    
    if (endDate) {
        // Convert date format from YYYY-MM-DD to ensure compatibility with backend
        apiUrl += `&endDate=${encodeURIComponent(endDate)}`;
    }
    
    console.log('Fetching activity logs with URL:', apiUrl);
    
    // Fetch activity logs from backend API
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        console.log('Activity logs API response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Activity logs API data:', data);
        // Clear table
        logsTable.innerHTML = '';
        
        if (data.success && data.data && data.data.logs && data.data.logs.length > 0) {
            // Add logs to table
            data.data.logs.forEach(log => {
                const timestamp = new Date(log.timestamp).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                
                addLogEntryToTable({
                    timestamp: timestamp,
                    user: log.userName,
                    action: log.actionLabel,
                    ip: log.ipAddress,
                    details: log.description,
                    status: log.status === 'success' ? 'success' : log.status === 'failed' ? 'danger' : 'warning'
                });
            });
        } else {
            logsTable.innerHTML = '<tr><td colspan="6" class="text-center">No activity logs found</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error fetching activity logs:', error);
        logsTable.innerHTML = '<tr><td colspan="6" class="text-center">Error loading activity logs. Please try again.</td></tr>';
    });
}

// Load reports data
function loadReports() {
    const reportsTable = document.querySelector('#reports .data-table tbody');
    if (!reportsTable) return;
    
    // Show loading message
    reportsTable.innerHTML = '<tr><td colspan="5" class="text-center">Loading reports...</td></tr>';
    
    // Simulate API call
    setTimeout(() => {
        // Sample reports data
        const reports = [
            { name: 'System Health Report', type: 'System Health', date: '2023-10-15', generatedBy: 'System' },
            { name: 'User Activity Report', type: 'User Activity', date: '2023-10-10', generatedBy: 'Mr. Rajeev Sharma' },
            { name: 'Performance Metrics Report', type: 'Performance Metrics', date: '2023-10-05', generatedBy: 'System' },
            { name: 'Security Audit Report', type: 'Security Audit', date: '2023-10-01', generatedBy: 'Mr. Rajeev Sharma' }
        ];
        
        // Clear table
        reportsTable.innerHTML = '';
        
        // Add reports to table
        reports.forEach(report => {
            const row = document.createElement('tr');
            const today = new Date().toISOString().split('T')[0];
            
            row.innerHTML = `
                <td>${report.name}</td>
                <td>${report.type}</td>
                <td>${report.date}</td>
                <td>${report.generatedBy}</td>
                <td>
                    <a href="#" class="btn btn-sm btn-outline">Download</a>
                    <a href="#" class="btn btn-sm btn-outline">View</a>
                </td>
            `;
            
            reportsTable.appendChild(row);
        });
    }, 1100);
}

// Load storage allocation data
function loadStorageData() {
    // Simulate API call to get storage data
    setTimeout(() => {
        // Sample storage data (in a real app, this would come from an API)
        const storageData = [
            { label: 'Database', value: Math.floor(Math.random() * 10) + 8, color: '#303F9F' },
            { label: 'Course Materials', value: Math.floor(Math.random() * 15) + 20, color: '#3949AB' },
            { label: 'User Files', value: Math.floor(Math.random() * 10) + 15, color: '#5C6BC0' },
            { label: 'System Backups', value: Math.floor(Math.random() * 10) + 10, color: '#7986CB' },
            { label: 'Other', value: Math.floor(Math.random() * 15) + 15, color: '#C5CAE9' }
        ];
        
        // Update the storage chart with dynamic data
        updateStorageChart(storageData);
    }, 800);
}

// Update storage chart with new data
function updateStorageChart(data) {
    const storageChart = document.getElementById('storageChart');
    if (!storageChart) return;
    
    const ctx = storageChart.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, storageChart.width, storageChart.height);
    
    // Calculate angles
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = -Math.PI / 2;
    
    // Draw pie slices
    data.forEach(item => {
        const sliceAngle = (item.value / total) * Math.PI * 2;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(storageChart.width / 2, storageChart.height / 2);
        ctx.arc(
            storageChart.width / 2,
            storageChart.height / 2,
            Math.min(storageChart.width, storageChart.height) / 3,
            startAngle,
            startAngle + sliceAngle
        );
        ctx.closePath();
        
        ctx.fillStyle = item.color;
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Update legend
        updateStorageLegend(item);
        
        // Update start angle for next slice
        startAngle += sliceAngle;
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(storageChart.width / 2, storageChart.height / 2, Math.min(storageChart.width, storageChart.height) / 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
}

// Update storage legend with new data
function updateStorageLegend(item) {
    // This function would update the legend items in the UI
    // For now, we'll keep the existing legend as it's already dynamic in nature
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
                
                // Refresh activity logs when navigating to logs section
                if (sectionId === 'logs') {
                    // Load today's logs by default
                    const today = new Date().toISOString().split('T')[0];
                    loadActivityLogs(today, today);
                }
                
                // Scroll to top
                window.scrollTo(0, 0);
            }
            
            // Close mobile menu if open
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.remove('active');
            }
        });
    });
}

// Update page title based on section
function updatePageTitle(sectionId) {
    const titles = {
        'overview': 'Admin Dashboard',
        'departments': 'College Departments',
        'users': 'User Management',
        'courses': 'Course Catalog',
        'logs': 'Activity Logs',
        'reports': 'System Reports'
    };
    
    const title = titles[sectionId] || 'Admin Dashboard';
    const pageTitleElement = document.querySelector('.page-title h1');
    if (pageTitleElement) {
        pageTitleElement.textContent = title;
    }
}

// Setup mobile menu
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!sidebar.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
}

// Setup interactive elements
function setupInteractiveElements() {
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                // Clear authentication data
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                
                showNotification('Logging out...', 'info');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        });
    }
    
    // Department actions
    setupDepartmentActions();
    
    // User actions
    setupUserActions();
    
    // Course actions
    setupCourseActions();
    
    // Activity log actions
    setupLogActions();
    
    // System status actions
    setupSystemStatusActions();
    
    // Resource actions
    setupResourceActions();
}

// Setup department actions
function setupDepartmentActions() {
    // Add department button
    const addDepartmentBtn = document.querySelector('#departments .btn-primary');
    if (addDepartmentBtn) {
        addDepartmentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAddDepartmentModal();
        });
    }
    
    // Use event delegation for department action buttons
    const departmentsTable = document.querySelector('#departments tbody');
    if (departmentsTable) {
        departmentsTable.addEventListener('click', function(e) {
            const target = e.target;
            
            // Check if clicked on Edit button
            if (target.classList.contains('btn') && target.classList.contains('btn-outline') && target.textContent.trim() === 'Edit') {
                e.preventDefault();
                const departmentName = target.closest('tr').cells[0].textContent;
                editDepartment(departmentName);
                return;
            }
            
            // Check if clicked on Delete button
            if (target.classList.contains('btn') && target.classList.contains('btn-outline') && target.classList.contains('btn-danger')) {
                e.preventDefault();
                const departmentName = target.closest('tr').cells[0].textContent;
                deleteDepartment(departmentName);
                return;
            }
        });
    }
}

// Setup user actions
function setupUserActions() {
    // Add user button
    const addUserBtn = document.querySelector('#users .btn-primary');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAddUserModal();
        });
    }
    
    // User role filter dropdown
    const userRoleFilter = document.getElementById('userRoleFilter');
    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', function() {
            const roleFilterValue = this.value;
            const departmentFilterValue = document.getElementById('userDepartmentFilter').value;
            filterUsersByRoleAndDepartment(roleFilterValue, departmentFilterValue);
        });
    }
    
    // User department filter dropdown
    const userDepartmentFilter = document.getElementById('userDepartmentFilter');
    if (userDepartmentFilter) {
        userDepartmentFilter.addEventListener('change', function() {
            const departmentFilterValue = this.value;
            const roleFilterValue = document.getElementById('userRoleFilter').value;
            filterUsersByRoleAndDepartment(roleFilterValue, departmentFilterValue);
        });
    }
    
    // Use event delegation for user action buttons
    const usersTable = document.querySelector('#users tbody');
    if (usersTable) {
        usersTable.addEventListener('click', function(e) {
            const target = e.target;
            
            // Check if clicked on Edit button
            if (target.classList.contains('btn') && target.classList.contains('btn-outline') && target.textContent.trim() === 'Edit') {
                e.preventDefault();
                const userName = target.closest('tr').cells[0].textContent;
                editUser(userName);
                return;
            }
            
            // Check if clicked on Delete button
            if (target.classList.contains('btn') && target.classList.contains('btn-outline') && target.classList.contains('btn-danger')) {
                e.preventDefault();
                const userName = target.closest('tr').cells[0].textContent;
                deleteUser(userName);
                return;
            }
        });
    }
}

// Setup course actions
function setupCourseActions() {
    // Add course button
    const addCourseBtn = document.querySelector('#courses .btn-primary');
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAddCourseModal();
        });
    }
    
    // Course filter dropdown
    const courseFilter = document.querySelector('#courses select.form-control');
    if (courseFilter) {
        courseFilter.addEventListener('change', function() {
            const filterValue = this.value;
            filterCourses(filterValue);
        });
    }
    
    // Use event delegation for course action buttons
    const coursesTable = document.querySelector('#courses tbody');
    if (coursesTable) {
        coursesTable.addEventListener('click', function(e) {
            const target = e.target;
            
            // Check if clicked on View button
            if (target.classList.contains('btn') && target.classList.contains('btn-outline') && target.textContent.trim() === 'View') {
                e.preventDefault();
                const courseName = target.closest('tr').cells[1].textContent;
                viewCourseDetails(courseName);
                return;
            }
            
            // Check if clicked on Edit button
            if (target.classList.contains('btn') && target.classList.contains('btn-outline') && target.textContent.trim() === 'Edit') {
                e.preventDefault();
                const courseName = target.closest('tr').cells[1].textContent;
                editCourse(courseName);
                return;
            }
        });
    }
}

// Setup settings actions
function setupSettingsActions() {
    // Save changes button for system settings
    const saveSettingsBtn = document.querySelector('#settings .btn-primary');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveSystemSettings();
        });
    }
    
    // Save changes button for notification settings
    const saveNotificationSettingsBtn = document.querySelectorAll('#settings .btn-primary')[1];
    if (saveNotificationSettingsBtn) {
        saveNotificationSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveNotificationSettings();
        });
    }
}

// Setup log actions
function setupLogActions() {
    // Filter button - specifically target the button with 'Filter' text
    const filterBtn = document.querySelector('#logs .btn-outline.btn-sm');
    if (filterBtn && filterBtn.textContent.trim() === 'Filter') {
        filterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const dateInput = document.querySelector('#logs input[type="date"]');
            const dateValue = dateInput ? dateInput.value : '';
            
            // Debug log to check if we're getting the date value
            console.log('Filter button clicked, date value:', dateValue);
            
            filterLogs(dateValue);
        });
    }
}

// Setup system status actions
function setupSystemStatusActions() {
    // DISABLED: System status actions were targeting the wrong table (recent activity)
    console.log('System status actions disabled - was conflicting with recent activity');
    return;
}

// Setup resource actions
function setupResourceActions() {
    // Refresh button
    const refreshBtn = document.querySelector('#resources .btn-outline');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            refreshSystemResources();
        });
    }
}

// Setup forms
function setupForms() {
    // System settings form
    const systemSettingsForm = document.getElementById('systemSettingsForm');
    if (systemSettingsForm) {
        systemSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSystemSettings();
        });
    }
    
    // Notification settings form
    const notificationSettingsForm = document.getElementById('notificationSettingsForm');
    if (notificationSettingsForm) {
        notificationSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveNotificationSettings();
        });
    }
    
    // Report generation form
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            generateReport();
        });
    }
    
    // Auto-populate User ID when role changes
    const userRoleSelect = document.getElementById('userRole');
    const userIdInput = document.getElementById('userId');
    
    if (userRoleSelect && userIdInput) {
        userRoleSelect.addEventListener('change', async function() {
            const selectedRole = this.value;
            
            // Only auto-populate for student role
            if (selectedRole === 'Student') {
                // Fetch the next available roll number
                try {
                    const authToken = localStorage.getItem('authToken');
                    const response = await fetch('/api/users?role=student&limit=1&sort=-studentId', {
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (data.success && data.data && data.data.users && data.data.users.length > 0) {
                        const lastStudent = data.data.users[0];
                        let nextRollNumber = 1;
                        
                        if (lastStudent.studentId) {
                            // Extract numeric part from studentId
                            const numericPart = lastStudent.studentId.toString().replace(/\D/g, '');
                            if (numericPart) {
                                nextRollNumber = parseInt(numericPart) + 1;
                            }
                        }
                        
                        // Set the next roll number
                        userIdInput.value = nextRollNumber;
                        userIdInput.readOnly = true;
                        userIdInput.style.backgroundColor = '#f0f0f0';
                    } else {
                        // No students found, start from 1
                        userIdInput.value = '1';
                        userIdInput.readOnly = true;
                        userIdInput.style.backgroundColor = '#f0f0f0';
                    }
                } catch (error) {
                    console.error('Error fetching next roll number:', error);
                    // Fallback: allow manual entry
                    userIdInput.value = '';
                    userIdInput.readOnly = false;
                    userIdInput.style.backgroundColor = '';
                    showNotification('Could not fetch next roll number. Please enter manually.', 'warning');
                }
            } else {
                // For other roles, clear the field and allow manual entry
                userIdInput.value = '';
                userIdInput.readOnly = false;
                userIdInput.style.backgroundColor = '';
                userIdInput.placeholder = 'Will be auto-generated';
            }
        });
    }
}

// Setup data tables
function setupDataTables() {
    // Add sorting functionality to all tables
    const tables = document.querySelectorAll('.data-table');
    tables.forEach(table => {
        const headers = table.querySelectorAll('th');
        headers.forEach((header, index) => {
            header.addEventListener('click', function() {
                sortTable(table, index);
            });
            header.style.cursor = 'pointer';
            
            // Add sort indicator
            const indicator = document.createElement('i');
            indicator.className = 'fas fa-sort sort-indicator';
            indicator.style.marginLeft = '8px';
            header.appendChild(indicator);
        });
    });
}

// Sort table by column
function sortTable(table, columnIndex) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Determine sort direction
    const isAscending = table.getAttribute('data-sort-direction') !== 'asc';
    table.setAttribute('data-sort-direction', isAscending ? 'asc' : 'desc');
    
    // Update sort indicators
    table.querySelectorAll('.sort-indicator').forEach(indicator => {
        indicator.className = 'fas fa-sort sort-indicator';
    });
    
    const currentIndicator = table.querySelectorAll('th')[columnIndex].querySelector('.sort-indicator');
    if (currentIndicator) {
        currentIndicator.className = isAscending ? 'fas fa-sort-up sort-indicator' : 'fas fa-sort-down sort-indicator';
    }
    
    // Sort rows
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();
        
        // Check if values are numeric
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return isAscending ? aNum - bNum : bNum - aNum;
        }
        
        // Sort as strings
        return isAscending 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
    });
    
    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));
}

// Setup notification system
function setupNotifications() {
    // Create notification container
    if (!document.querySelector('.notification-container')) {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
}

// Setup notification dropdown
// Notification dropdown is now handled by the unified notification system (notifications.js)
// The following functions have been disabled to prevent duplicate notification panels
/*
function setupNotificationDropdown() {
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const markAllReadBtn = document.querySelector('.mark-all-read');
    
    if (notificationIcon && notificationDropdown) {
        notificationIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('active');
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function closeDropdown(e) {
                if (!notificationDropdown.contains(e.target) && !notificationIcon.contains(e.target)) {
                    notificationDropdown.classList.remove('active');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        });
    }
    
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            markAllNotificationsAsRead();
        });
    }
}

// Populate notification dropdown
function populateNotificationDropdown() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    // Sample notification data
    const notifications = [
        {
            id: 1,
            title: 'System Update',
            content: 'System maintenance scheduled for tonight at 2:00 AM',
            time: '10 minutes ago',
            unread: true
        },
        {
            id: 2,
            title: 'New User Registration',
            content: '5 new users registered in the last hour',
            time: '1 hour ago',
            unread: true
        },
        {
            id: 3,
            title: 'Course Approval',
            content: 'CS401: Machine Learning is pending approval',
            time: '3 hours ago',
            unread: true
        },
        {
            id: 4,
            title: 'Backup Completed',
            content: 'Daily backup completed successfully',
            time: '5 hours ago',
            unread: false
        },
        {
            id: 5,
            title: 'Security Alert',
            content: 'Unusual login activity detected for user STU-CS2021042',
            time: 'Yesterday',
            unread: false
        }
    ];
    
    // Clear existing notifications
    notificationList.innerHTML = '';
    
    // Add notifications to dropdown
    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.unread ? 'unread' : ''}`;
        notificationItem.innerHTML = `
            <div class="notification-item-header">
                <div class="notification-item-title">${notification.title}</div>
                <div class="notification-item-time">${notification.time}</div>
            </div>
            <div class="notification-item-content">${notification.content}</div>
        `;
        notificationList.appendChild(notificationItem);
    });
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
        item.classList.remove('unread');
    });
    
    // Update notification badge
    updateNotificationBadge(0);
    showNotification('All notifications marked as read', 'success');
}
*/

// Update notification badge
function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Show notification
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.querySelector('.notification-container');
    if (!container) return;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Add icon based on type
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            removeNotification(notification);
        });
    }
    
    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notification);
        }, duration);
    }
    
    return notification;
}

// Remove notification
function removeNotification(notification) {
    if (notification && notification.parentNode) {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Setup system monitoring
function setupSystemMonitoring() {
    // DISABLED: Load initial system status data was conflicting with recent activity
    // loadSystemStatus();
    
    console.log('System monitoring disabled - was conflicting with recent activity');
    
    // DISABLED: Simulate system status updates
    // setInterval(loadSystemStatus, 30000); // Update every 30 seconds
}

// Setup resource monitoring
function setupResourceMonitoring() {
    // Load initial resource usage data
    loadResourceUsage();
    
    // Simulate resource usage updates
    setInterval(loadResourceUsage, 10000); // Update every 10 seconds
}

// Setup activity logs
function setupActivityLogs() {
    // Load initial activity logs data for today
    const today = new Date().toISOString().split('T')[0];
    loadActivityLogs(today, today);
    
    // Fetch real activity logs from backend every 30 seconds
    setInterval(() => {
        const today = new Date().toISOString().split('T')[0];
        loadActivityLogs(today, today);
    }, 30000); // Update every 30 seconds
}

// Setup system monitoring (DUPLICATE - DISABLED)
function setupSystemMonitoring() {
    // DISABLED: Load initial system status data was conflicting with recent activity
    // loadSystemStatus();
    
    console.log('System monitoring disabled (second instance) - was conflicting with recent activity');
    
    // DISABLED: Simulate system status updates
    // setInterval(loadSystemStatus, 30000); // Update every 30 seconds
}

// Setup resource monitoring
function setupResourceMonitoring() {
    // Load initial resource usage data
    loadResourceUsage();
    
    // Simulate resource usage updates
    setInterval(loadResourceUsage, 10000); // Update every 10 seconds
}



// Setup report generation
function setupReportGeneration() {
    // Load initial reports data
    loadReports();
    
    // Generate report button
    const generateReportBtn = document.querySelector('#reports .btn-primary');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            generateReport();
        });
    }
}

// Add log entry to table
function addLogEntryToTable(entry) {
    const logsTable = document.querySelector('#logs tbody');
    if (!logsTable) return;
    
    const row = document.createElement('tr');
    
    const statusClass = entry.status === 'success' ? 'success' : 'danger';
    const statusText = entry.status === 'success' ? 'Success' : 'Failed';
    
    row.innerHTML = `
        <td>${entry.timestamp}</td>
        <td>${entry.user}</td>
        <td>${entry.action}</td>
        <td>${entry.ip}</td>
        <td>${entry.details}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
    `;
    
    // Add to top of table
    logsTable.insertBefore(row, logsTable.firstChild);
    
    // Keep only last 10 entries
    while (logsTable.children.length > 10) {
        logsTable.removeChild(logsTable.lastChild);
    }
}

// Generate report
function generateReport() {
    const reportType = document.getElementById('reportType');
    const reportFormat = document.getElementById('reportFormat');
    const reportDateRange = document.getElementById('reportDateRange');
    
    if (!reportType || !reportFormat || !reportDateRange) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const reportTypeValue = reportType.value;
    const reportFormatValue = reportFormat.value;
    const reportDateRangeValue = reportDateRange.value;
    
    // Show generating message
    const notification = showNotification(`Generating ${reportTypeValue} report...`, 'info', 0);
    
    // Simulate report generation
    setTimeout(() => {
        removeNotification(notification);
        
        const reportTypes = {
            'system': 'System Health',
            'users': 'User Activity',
            'performance': 'Performance Metrics',
            'security': 'Security Audit'
        };
        
        const formatExtensions = {
            'pdf': '.pdf',
            'excel': '.xlsx',
            'csv': '.csv'
        };
        
        const reportName = `${reportTypes[reportTypeValue]}_Report_${new Date().toISOString().split('T')[0]}${formatExtensions[reportFormatValue]}`;
        
        showNotification(`Report "${reportName}" generated successfully`, 'success');
        
        // Add to recent reports table
        addRecentReport(reportName, reportTypes[reportTypeValue], 'Mr. Rajeev Sharma');
        
        // Simulate download
        setTimeout(() => {
            const downloadLink = document.createElement('a');
            downloadLink.href = '#';
            downloadLink.download = reportName;
            downloadLink.click();
        }, 1000);
    }, 2000);
}

// Add recent report to table
function addRecentReport(reportName, reportType, generatedBy) {
    const reportsTable = document.querySelector('#reports .data-table tbody');
    if (!reportsTable) return;
    
    const row = document.createElement('tr');
    const today = new Date().toISOString().split('T')[0];
    
    row.innerHTML = `
        <td>${reportName}</td>
        <td>${reportType}</td>
        <td>${today}</td>
        <td>${generatedBy}</td>
        <td>
            <a href="#" class="btn btn-sm btn-outline">Download</a>
            <a href="#" class="btn btn-sm btn-outline">View</a>
        </td>
    `;
    
    // Add to top of table
    reportsTable.insertBefore(row, reportsTable.firstChild);
    
    // Keep only last 5 entries
    while (reportsTable.children.length > 5) {
        reportsTable.removeChild(reportsTable.lastChild);
    }
}

// Save system settings
function saveSystemSettings() {
    const systemName = document.getElementById('systemName');
    const academicYear = document.getElementById('academicYear');
    const semester = document.getElementById('semester');
    const backupFrequency = document.getElementById('backupFrequency');
    const sessionTimeout = document.getElementById('sessionTimeout');
    const maxFileSize = document.getElementById('maxFileSize');
    
    if (!systemName || !academicYear || !semester || !backupFrequency || !sessionTimeout || !maxFileSize) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const systemNameValue = systemName.value;
    const academicYearValue = academicYear.value;
    const semesterValue = semester.value;
    const backupFrequencyValue = backupFrequency.value;
    const sessionTimeoutValue = sessionTimeout.value;
    const maxFileSizeValue = maxFileSize.value;
    
    // Show saving message
    const notification = showNotification('Saving system settings...', 'info', 0);
    
    // Simulate save process
    setTimeout(() => {
        removeNotification(notification);
        showNotification('System settings saved successfully', 'success');
        
        // In a real app, you would send data to server
        console.log('Saved settings:', {
            systemName: systemNameValue,
            academicYear: academicYearValue,
            semester: semesterValue,
            backupFrequency: backupFrequencyValue,
            sessionTimeout: sessionTimeoutValue,
            maxFileSize: maxFileSizeValue
        });
    }, 1500);
}

// Save notification settings
function saveNotificationSettings() {
    const emailNotifications = document.getElementById('emailNotifications');
    const smsNotifications = document.getElementById('smsNotifications');
    const pushNotifications = document.getElementById('pushNotifications');
    const notificationFrequency = document.getElementById('notificationFrequency');
    
    if (!emailNotifications || !smsNotifications || !pushNotifications || !notificationFrequency) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const emailNotificationsValue = emailNotifications.checked;
    const smsNotificationsValue = smsNotifications.checked;
    const pushNotificationsValue = pushNotifications.checked;
    const notificationFrequencyValue = notificationFrequency.value;
    
    // Show saving message
    const notification = showNotification('Saving notification settings...', 'info', 0);
    
    // Simulate save process
    setTimeout(() => {
        removeNotification(notification);
        showNotification('Notification settings saved successfully', 'success');
        
        // In a real app, you would send data to server
        console.log('Saved notification settings:', {
            emailNotifications: emailNotificationsValue,
            smsNotifications: smsNotificationsValue,
            pushNotifications: pushNotificationsValue,
            notificationFrequency: notificationFrequencyValue
        });
    }, 1500);
}

// Setup modals
function setupModals() {
    // Add Department Modal
    const addDepartmentModal = document.getElementById('addDepartmentModal');
    const addDepartmentBtn = document.querySelector('#departments .btn-primary');
    const cancelAddDeptBtn = document.getElementById('cancelAddDept');
    const closeAddDeptBtn = addDepartmentModal?.querySelector('.close');
    const addDepartmentForm = document.getElementById('addDepartmentForm');
    
    if (addDepartmentBtn) {
        addDepartmentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addDepartmentModal.style.display = 'block';
        });
    }
    
    if (cancelAddDeptBtn) {
        cancelAddDeptBtn.addEventListener('click', function() {
            addDepartmentModal.style.display = 'none';
            addDepartmentForm?.reset();
        });
    }
    
    if (closeAddDeptBtn) {
        closeAddDeptBtn.addEventListener('click', function() {
            addDepartmentModal.style.display = 'none';
            addDepartmentForm?.reset();
        });
    }
    
    if (addDepartmentForm) {
        addDepartmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addDepartment();
        });
    }
    
    // Add User Modal
    const addUserModal = document.getElementById('addUserModal');
    const addUserBtn = document.querySelector('#users .btn-primary');
    const cancelAddUserBtn = document.getElementById('cancelAddUser');
    const closeAddUserBtn = addUserModal?.querySelector('.close');
    const addUserForm = document.getElementById('addUserForm');
    
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addUserModal.style.display = 'block';
            loadDepartmentOptions();
        });
    }
    
    if (cancelAddUserBtn) {
        cancelAddUserBtn.addEventListener('click', function() {
            addUserModal.style.display = 'none';
            addUserForm?.reset();
        });
    }
    
    if (closeAddUserBtn) {
        closeAddUserBtn.addEventListener('click', function() {
            addUserModal.style.display = 'none';
            addUserForm?.reset();
        });
    }
    
    // NOTE: addUser submit handler is wired in admin-programs.js (avoid duplicate handler)

    // Add Course Modal
    const addCourseModal = document.getElementById('addCourseModal');
    const addCourseBtn = document.querySelector('#courses .btn-primary');
    const cancelAddCourseBtn = document.getElementById('cancelAddCourse');
    const closeAddCourseBtn = addCourseModal?.querySelector('.close');
    const addCourseForm = document.getElementById('addCourseForm');
    
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addCourseModal.style.display = 'block';
        });
    }
    
    if (cancelAddCourseBtn) {
        cancelAddCourseBtn.addEventListener('click', function() {
            addCourseModal.style.display = 'none';
            addCourseForm?.reset();
        });
    }
    
    if (closeAddCourseBtn) {
        closeAddCourseBtn.addEventListener('click', function() {
            addCourseModal.style.display = 'none';
            addCourseForm?.reset();
        });
    }
    
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addCourse();
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === addDepartmentModal) {
            addDepartmentModal.style.display = 'none';
            addDepartmentForm?.reset();
        }
        
        if (event.target === addUserModal) {
            addUserModal.style.display = 'none';
            addUserForm?.reset();
        }
        
        if (event.target === addCourseModal) {
            addCourseModal.style.display = 'none';
            addCourseForm?.reset();
        }
    });
}

// Show add department modal
function showAddDepartmentModal() {
    const modal = document.getElementById('addDepartmentModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Add department
function addDepartment() {
    const deptName = document.getElementById('deptName').value;
    const deptHOD = document.getElementById('deptHOD').value;
    const deptFaculty = document.getElementById('deptFaculty').value;
    const deptStudents = document.getElementById('deptStudents').value;
    const deptEstablished = document.getElementById('deptEstablished').value;
    
    if (!deptName || !deptHOD || !deptFaculty || !deptStudents || !deptEstablished) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Show request message
    const notification = showNotification('Sending department request to principal...', 'info', 0);
    
    // Get auth token
    const authToken = localStorage.getItem('authToken');
    
    // Create a principal approval request instead of activating the department immediately
    fetch('/api/approvals', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            requestType: 'department',
            title: `New Department: ${deptName}`,
            description: `Request to add ${deptName} as a new active department.`,
            departmentData: {
                name: deptName,
                hod: deptHOD,
                faculty: parseInt(deptFaculty),
                students: parseInt(deptStudents),
                established: parseInt(deptEstablished)
            },
            metadata: {
                submittedFrom: 'admin-dashboard'
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        removeNotification(notification);
        
        if (data.success) {
            showNotification(`Department "${deptName}" request sent to principal for approval`, 'success');
            
            // Close modal
            const modal = document.getElementById('addDepartmentModal');
            if (modal) {
                modal.style.display = 'none';
                document.getElementById('addDepartmentForm').reset();
            }
            
        } else {
            showNotification(data.message || 'Failed to send department request', 'error');
        }
    })
    .catch(error => {
        removeNotification(notification);
        console.error('Error sending department request:', error);
        showNotification('An error occurred while sending the department request', 'error');
    });
}

// Add department to table
function addDepartmentToTable(name, hod, faculty, students, isActive, id) {
    const departmentsTable = document.querySelector('#departments tbody');
    if (!departmentsTable) return;
    
    const row = document.createElement('tr');
    row.dataset.departmentId = id;
    
    const statusBadge = isActive
        ? '<span class="status-badge success">Active</span>'
        : '<span class="status-badge danger">Inactive</span>';
    
    row.innerHTML = `
        <td>${name}</td>
        <td>${hod}</td>
        <td>${faculty}</td>
        <td>${students}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn btn-sm btn-outline btn-danger dept-delete-btn">Delete</button>
            <button class="btn btn-sm btn-outline dept-edit-btn">Edit</button>
        </td>
    `;
    
    departmentsTable.appendChild(row);
    
    row.querySelector('.dept-delete-btn').addEventListener('click', function(e) {
        e.preventDefault();
        deleteDepartment(id, name);
    });
    
    row.querySelector('.dept-edit-btn').addEventListener('click', function(e) {
        e.preventDefault();
        editDepartment(id, name, hod, faculty, students);
    });
}

// Update department count
function updateDepartmentCount() {
    const departmentsTable = document.querySelector('#departments tbody');
    if (!departmentsTable) return;
    
    const count = departmentsTable.children.length;
    const statCard = document.querySelector('#overview .stat-card:nth-child(1) .stat-card-value');

    if (statCard) {
        statCard.textContent = count;
    }
}

// View department details
function viewDepartmentDetails(departmentName) {
    showNotification(`Viewing details for ${departmentName}`, 'info');
}

// Edit department  opens modal prefilled with current values
function editDepartment(id, name, hod, faculty, students) {
    const modal = document.getElementById('editDepartmentModal');
    if (!modal) return;

    // Prefill form
    document.getElementById('editDeptId').value          = id   || '';
    document.getElementById('editDeptHOD').value         = hod  || '';

    // Set the select to the current name (fallback to first option if not found)
    const nameSelect = document.getElementById('editDeptName');
    const match = Array.from(nameSelect.options).find(o => o.value === name);
    nameSelect.value = match ? name : nameSelect.options[0].value;

    modal.style.display = 'block';
}

// Wire up edit-department modal on first call (runs once)
(function setupEditDepartmentModal() {
    document.addEventListener('DOMContentLoaded', function() {
        const modal   = document.getElementById('editDepartmentModal');
        const form    = document.getElementById('editDepartmentForm');
        const closeBtn = document.getElementById('closeEditDeptModal');
        const cancelBtn = document.getElementById('cancelEditDept');

        const closeModal = () => { if (modal) modal.style.display = 'none'; };

        if (closeBtn)  closeBtn.addEventListener('click',  closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        window.addEventListener('click', e => { if (e.target === modal) closeModal(); });

        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();

                const id          = document.getElementById('editDeptId').value;
                const name        = document.getElementById('editDeptName').value;
                const hod         = document.getElementById('editDeptHOD').value.trim();
                const established = document.getElementById('editDeptEstablished').value;

                if (!hod) { showNotification('Please enter the HOD name', 'error'); return; }

                const authToken = localStorage.getItem('authToken');
                const submitBtn = form.querySelector('[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';

                try {
                    const payload = { name, hod };
                    if (established) payload.established = parseInt(established);

                    const res  = await fetch(`/api/departments/${id}`, {
                        method : 'PUT',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type' : 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });
                    const data = await res.json();

                    if (data.success) {
                        showNotification(`Department updated successfully`, 'success');
                        closeModal();
                        loadDepartments(); // Refresh table
                    } else {
                        showNotification(data.message || 'Failed to update department', 'error');
                    }
                } catch (err) {
                    console.error('Edit department error:', err);
                    showNotification('Network error while saving', 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save Changes';
                }
            });
        }
    });
}());

// Delete department
function deleteDepartment(departmentId, departmentName) {
    if (!confirm(`Are you sure you want to delete the department ${departmentName}?`)) {
        return;
    }
    
    // Get auth token
    const authToken = localStorage.getItem('authToken');
    
    // Make API call to delete department
    fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Department ${departmentName} deleted successfully`, 'success');
            // Reload departments from database
            loadDepartments();
        } else {
            showNotification(data.message || 'Failed to delete department', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting department:', error);
        showNotification('An error occurred while deleting the department', 'error');
    });
}

// Show add user modal
function showAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.style.display = 'block';
        // Load department options when modal opens
        loadDepartmentOptions();
    }
}

// Add user
function addUser() {
    const userName = document.getElementById('userName').value;
    const userId = document.getElementById('userId').value;
    const userRole = document.getElementById('userRole').value;
    const userDept = document.getElementById('userDept').value;
    const userEmail = document.getElementById('userEmail').value;
    const userPassword = document.getElementById('userPassword').value;
    const userStatus = document.getElementById('userStatus').value;
    
    // For student role, userId is required (roll number)
    // For other roles, userId will be auto-generated on backend
    if (!userName || !userRole || !userDept || !userEmail || !userPassword || !userStatus) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // For student role, userId (roll number) is required
    if (userRole === 'Student' && !userId) {
        showNotification('Student roll number is required', 'error');
        return;
    }
    
    // Validate password length
    if (userPassword.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Show adding message
    const notification = showNotification('Adding user...', 'info', 0);
    
    // Map frontend role to backend role
    const roleMap = {
        'Student': 'student',
        'Faculty': 'teacher',
        'HOD': 'hod',
        'Staff': 'teacher',
        'Administrator': 'admin'
    };
    
    const backendRole = roleMap[userRole] || 'student';
    
    // Make API call to register user
    fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: userName,
            email: userEmail,
            password: userPassword,
            role: backendRole,
            department: userDept,
            studentId: userId  // Include student ID for students
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Add user API response:', data);
        removeNotification(notification);
        
        if (data.success) {
            showNotification(`User "${userName}" added successfully`, 'success');
            
            // Close modal
            const modal = document.getElementById('addUserModal');
            if (modal) {
                modal.style.display = 'none';
                document.getElementById('addUserForm').reset();
            }
            
            // Reload users from database to get fresh data
            loadUsers();
        } else {
            showNotification(data.message || 'Failed to add user', 'error');
        }
    })
    .catch(error => {
        removeNotification(notification);
        console.error('Error:', error);
        showNotification('An error occurred while adding the user', 'error');
    });
}

// Add user to table
function addUserToTable(name, id, role, dept, email, status) {
    const usersTable = document.querySelector('#users tbody');
    if (!usersTable) return;
    
    const row = document.createElement('tr');
    
    const statusClass = status === 'Active' ? 'success' : 'warning';
    
    row.innerHTML = `
        <td>${name}</td>
        <td>${id}</td>
        <td>${role}</td>
        <td>${dept}</td>
        <td>${email}</td>
        <td class="${statusClass}">${status}</td>
        <td>
            <button class="btn btn-info" onclick="viewUserDetails('${name}')">View</button>
            <button class="btn btn-warning" onclick="editUser('${name}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteUser('${name}')">Delete</button>
        </td>
    `;
    
    usersTable.appendChild(row);
}

// Update user count
function updateUserCount() {
    const usersTable = document.querySelector('#users tbody');
    if (!usersTable) return;
    
    const count = usersTable.children.length;
    const statCard = document.querySelector('#overview .stat-card:nth-child(2) .stat-card-value');

    if (statCard) {
        statCard.textContent = count;
    }
}

// View user details
function viewUserDetails(userName) {
    showNotification(`Viewing details for ${userName}`, 'info');
}

// Edit user
function editUser(userName) {
    showNotification(`Editing ${userName}`, 'info');
}

// Delete user
function deleteUser(userName) {
    // First, we need to find the user ID from the table
    const userRows = document.querySelectorAll('#users tbody tr');
    let userId = null;
    let userRow = null;
    
    for (let i = 0; i < userRows.length; i++) {
        const row = userRows[i];
        const nameCell = row.cells[0];
        if (nameCell && nameCell.textContent === userName) {
            userRow = row;
            // In a real implementation, we would store the user ID in a data attribute
            // For now, we'll prompt for confirmation and then make the API call
            break;
        }
    }
    
    if (!userRow) {
        showNotification('User not found in table', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete the user ${userName}?`)) {
        // Get auth token
        const authToken = localStorage.getItem('authToken');
        
        // In a real implementation, we would have the user ID stored in a data attribute
        // For demonstration purposes, we'll make a call to get all users and find the ID
        fetch('/api/users?limit=1000', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data && data.data.users) {
                // Find the user ID
                let foundUserId = null;
                for (let i = 0; i < data.data.users.length; i++) {
                    if (data.data.users[i].name === userName) {
                        foundUserId = data.data.users[i]._id;
                        break;
                    }
                }
                
                if (foundUserId) {
                    // Make API call to delete user from database
                    return fetch(`/api/users/${foundUserId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json',
                        }
                    });
                } else {
                    throw new Error('User ID not found');
                }
            } else {
                throw new Error('Failed to fetch users');
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove the row from the table
                userRow.remove();
                // Update user count
                updateUserCount();
                showNotification(`User ${userName} deleted successfully`, 'success');
            } else {
                showNotification(data.message || 'Failed to delete user', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            showNotification('An error occurred while deleting the user: ' + error.message, 'error');
        });
    }
// Add to table
    usersTable.appendChild(row);
    
    // Add event listeners to new buttons
    const editBtn = row.querySelector('a:first-child');
    const deleteBtn = row.querySelector('a:last-child');
    
    editBtn.addEventListener('click', function(e) {
        e.preventDefault();
        editUser(name);
    });
}

// Update user count
function updateUserCount() {
    const usersTable = document.querySelector('#users tbody');
    if (!usersTable) return;
    
    const count = usersTable.children.length;
    const statCard = document.querySelector('#overview .stat-card:nth-child(2) .stat-card-value');
    if (statCard) {
        statCard.textContent = count;
    }
}

// Edit user
function editUser(userName) {
    showNotification(`Editing user: ${userName}`, 'info');
}

// Delete user
function deleteUser(userName) {
    if (confirm(`Are you sure you want to delete the user ${userName}?`)) {
        // Get auth token
        const authToken = localStorage.getItem('authToken');
        
        // First, we need to get all users to find the user ID
        fetch('/api/users?limit=1000', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data && data.data.users) {
                // Find the user ID
                let foundUserId = null;
                for (let i = 0; i < data.data.users.length; i++) {
                    if (data.data.users[i].name === userName) {
                        foundUserId = data.data.users[i]._id;
                        break;
                    }
                }
                
                if (foundUserId) {
                    // Make API call to delete user from database
                    return fetch(`/api/users/${foundUserId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json',
                        }
                    });
                } else {
                    throw new Error('User not found');
                }
            } else {
                throw new Error('Failed to fetch users');
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Find and remove the row from the table
                const userRows = document.querySelectorAll('#users tbody tr');
                userRows.forEach(row => {
                    const nameCell = row.cells[0];
                    if (nameCell && nameCell.textContent === userName) {
                        row.remove();
                    }
                });
                // Update user count
                updateUserCount();
                showNotification(`User ${userName} deleted successfully from database`, 'success');
            } else {
                showNotification(data.message || 'Failed to delete user', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            showNotification('An error occurred while deleting the user: ' + error.message, 'error');
        });
    }
}

// Filter users by role
function filterUsersByRole(role) {
    const rows = document.querySelectorAll('#users tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const userRole = row.cells[2].textContent;
        
        if (role === 'All Users' || userRole === role) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    showNotification(`Showing ${visibleCount} users with role: ${role}`, 'info');
}

// Filter users by role and department
function filterUsersByRoleAndDepartment(role, department) {
    const rows = document.querySelectorAll('#users tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const userRole = row.cells[2].textContent;
        const userDepartment = row.cells[3].textContent;
        
        // Check role filter
        const roleMatch = (role === 'All Users' || userRole === role);
        
        // Check department filter
        const departmentMatch = (department === 'All Departments' || userDepartment === department);
        
        if (roleMatch && departmentMatch) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    showNotification(`Showing ${visibleCount} users with role: ${role} and department: ${department}`, 'info');
}

// Show add course modal
function showAddCourseModal() {
    const modal = document.getElementById('addCourseModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Add course
function addCourse() {
    // Check if we're in edit mode by looking for the course ID field
    const courseIdField = document.getElementById('courseId');
    const courseId = courseIdField ? courseIdField.value : null;
    
    // If we have a course ID, this is actually an update operation
    if (courseId && courseId !== '') {
        updateCourse(courseId);
        return;
    }
    
    const courseCode = document.getElementById('courseCode').value;
    const courseName = document.getElementById('courseName').value;
    const courseDept = document.getElementById('courseDept').value;
    const courseCredits = document.getElementById('courseCredits').value;
    const courseType = document.getElementById('courseType').value;
    const courseStatus = document.getElementById('courseStatus').value;
    
    if (!courseCode || !courseName || !courseDept || !courseCredits || !courseType || !courseStatus) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Show adding message
    const notification = showNotification('Adding course...', 'info', 0);
    
    // Get auth token
    const authToken = localStorage.getItem('authToken');
    
    // Prepare data for API call
    const courseData = {
        name: courseName,
        description: `${courseCode} - Credits: ${courseCredits}, Type: ${courseType}, Department: ${courseDept}`,
        // Note: The backend expects a schedule object, but we'll provide a minimal one
        schedule: {
            days: ['Monday'],
            startTime: '09:00',
            endTime: '10:30',
            location: 'Online'
        }
    };
    
    // Make API call to create class
    fetch('/api/classes', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData)
    })
    .then(response => response.json())
    .then(data => {
        removeNotification(notification);
        
        if (data.success) {
            showNotification(`Course "${courseName}" added successfully`, 'success');
            
            // Add to courses table
            addCourseToTable(courseCode, courseName, courseDept, courseCredits, courseType, courseStatus);
            
            // Close modal
            const modal = document.getElementById('addCourseModal');
            if (modal) {
                modal.style.display = 'none';
                document.getElementById('addCourseForm').reset();
            }
            
            // Remove course ID field if it exists
            const courseIdField = document.getElementById('courseId');
            if (courseIdField) {
                courseIdField.remove();
            }
            
            // Restore original form submit handler
            const form = document.getElementById('addCourseForm');
            const originalHandler = form.dataset.originalOnSubmit;
            if (originalHandler && originalHandler !== 'null') {
                form.onsubmit = null;
            } else {
                form.onsubmit = null;
            }
            
            // Clean up our data attribute
            delete form.dataset.originalOnSubmit;
            
            // Reset modal title
            const modalTitle = document.querySelector('#addCourseModal .modal-header h2');
            if (modalTitle) {
                modalTitle.textContent = 'Add New Course';
            }
            
            // Update course count
            updateCourseCount();
        } else {
            showNotification(data.message || 'Failed to add course', 'error');
        }
    })
    .catch(error => {
        removeNotification(notification);
        console.error('Error adding course:', error);
        showNotification('An error occurred while adding the course: ' + error.message, 'error');
    });
}

// Add course to table
function addCourseToTable(id, code, name, dept, credits, type, status) {
    const coursesTable = document.querySelector('#courses tbody');
    if (!coursesTable) return;
    
    const row = document.createElement('tr');
    row.dataset.courseId = id; // Store course ID in data attribute
    
    const statusClass = status === 'Active' ? 'success' : 
                       status === 'Pending Approval' ? 'warning' : 'danger';
    
    row.innerHTML = `
        <td>${code}</td>
        <td>${name}</td>
        <td>${dept}</td>
        <td>${credits}</td>
        <td>${type}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
        <td>
            <a href="#" class="btn btn-sm btn-outline">View</a>
            <a href="#" class="btn btn-sm btn-outline">Edit</a>
        </td>
    `;
    
    // Add to table
    coursesTable.appendChild(row);
    
    // Add event listeners to new buttons
    const viewBtn = row.querySelector('a:first-child');
    const editBtn = row.querySelector('a:last-child');
    
    viewBtn.addEventListener('click', function(e) {
        e.preventDefault();
        viewCourseDetails(name);
    });
    
    editBtn.addEventListener('click', function(e) {
        e.preventDefault();
        editCourse(name);
    });
}

// Update course count
function updateCourseCount() {
    const coursesTable = document.querySelector('#courses tbody');
    if (!coursesTable) return;
    
    const count = coursesTable.children.length;
    const statCard = document.querySelector('#overview .stat-card:nth-child(3) .stat-card-value');
    if (statCard) {
        statCard.textContent = count;
    }
}

// View course details
function viewCourseDetails(courseName) {
    showNotification(`Viewing details for ${courseName}`, 'info');
}

// Edit course
function editCourse(courseName) {
    // Find the course row in the table
    const courseRows = document.querySelectorAll('#courses tbody tr');
    let courseRow = null;
    let courseId = null;
    
    for (let i = 0; i < courseRows.length; i++) {
        const row = courseRows[i];
        const nameCell = row.cells[1]; // Course name is in the second cell
        if (nameCell && nameCell.textContent === courseName) {
            courseRow = row;
            courseId = row.dataset.courseId;
            break;
        }
    }
    
    if (!courseRow || !courseId) {
        showNotification('Course not found', 'error');
        return;
    }
    
    // Get course data from the row
    const courseCode = courseRow.cells[0].textContent;
    const courseDept = courseRow.cells[2].textContent;
    const courseCredits = courseRow.cells[3].textContent;
    const courseType = courseRow.cells[4].textContent;
    const courseStatus = courseRow.cells[5].textContent.trim();
    
    // Pre-populate the add course modal with existing data
    document.getElementById('courseCode').value = courseCode;
    document.getElementById('courseName').value = courseName;
    document.getElementById('courseDept').value = courseDept;
    document.getElementById('courseCredits').value = courseCredits;
    document.getElementById('courseType').value = courseType;
    document.getElementById('courseStatus').value = courseStatus;
    
    // Store the course ID in a hidden field or global variable for update
    // We'll add a hidden field to the form to store the course ID
    let courseIdField = document.getElementById('courseId');
    if (!courseIdField) {
        courseIdField = document.createElement('input');
        courseIdField.type = 'hidden';
        courseIdField.id = 'courseId';
        document.getElementById('addCourseForm').appendChild(courseIdField);
    }
    courseIdField.value = courseId;
    
    // Change modal title to indicate edit mode
    const modalTitle = document.querySelector('#addCourseModal .modal-header h2');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Course';
    }
    
    // Show the modal
    const modal = document.getElementById('addCourseModal');
    if (modal) {
        modal.style.display = 'block';
    }
    
    // Prevent the default form submission and handle updates through our update function
    const form = document.getElementById('addCourseForm');
    const originalOnSubmit = form.onsubmit;
    
    // Temporarily override form submission
    form.onsubmit = function(e) {
        e.preventDefault();
        updateCourse(courseId);
        return false;
    };
    
    // Store original handler for restoration
    form.dataset.originalOnSubmit = originalOnSubmit || 'null';
}

// Update course
function updateCourse(courseId) {
    const courseCode = document.getElementById('courseCode').value;
    const courseName = document.getElementById('courseName').value;
    const courseDept = document.getElementById('courseDept').value;
    const courseCredits = document.getElementById('courseCredits').value;
    const courseType = document.getElementById('courseType').value;
    const courseStatus = document.getElementById('courseStatus').value;
    
    if (!courseCode || !courseName || !courseDept || !courseCredits || !courseType || !courseStatus) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Show updating message
    const notification = showNotification('Updating course...', 'info', 0);
    
    // Get auth token
    const authToken = localStorage.getItem('authToken');
    
    // Prepare data for API call
    const courseData = {
        name: courseName,
        description: `${courseCode} - Credits: ${courseCredits}, Type: ${courseType}, Department: ${courseDept}`,
        // Note: The backend expects a schedule object, but we'll provide a minimal one
        schedule: {
            days: ['Monday'],
            startTime: '09:00',
            endTime: '10:30',
            location: 'Online'
        }
    };
    
    // Make API call to update class
    fetch(`/api/classes/${courseId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData)
    })
    .then(response => response.json())
    .then(data => {
        removeNotification(notification);
        
        if (data.success) {
            showNotification(`Course "${courseName}" updated successfully`, 'success');
            
            // Update the course row in the table
            updateCourseInTable(courseId, courseCode, courseName, courseDept, courseCredits, courseType, courseStatus);
            
            // Close modal
            const modal = document.getElementById('addCourseModal');
            if (modal) {
                modal.style.display = 'none';
                document.getElementById('addCourseForm').reset();
            }
            
            // Restore original form submit handler
            const form = document.getElementById('addCourseForm');
            const originalHandler = form.dataset.originalOnSubmit;
            if (originalHandler && originalHandler !== 'null') {
                // We can't directly restore the original handler since it was a function
                // Instead, we'll remove our override and let the default behavior take over
                form.onsubmit = null;
            } else {
                form.onsubmit = null;
            }
            
            // Clean up our data attribute
            delete form.dataset.originalOnSubmit;
            
            // Reset modal title
            const modalTitle = document.querySelector('#addCourseModal .modal-header h2');
            if (modalTitle) {
                modalTitle.textContent = 'Add New Course';
            }
        } else {
            showNotification(data.message || 'Failed to update course', 'error');
        }
    })
    .catch(error => {
        removeNotification(notification);
        console.error('Error updating course:', error);
        showNotification('An error occurred while updating the course: ' + error.message, 'error');
    });
}

// Update course in table
function updateCourseInTable(id, code, name, dept, credits, type, status) {
    const courseRows = document.querySelectorAll('#courses tbody tr');
    
    for (let i = 0; i < courseRows.length; i++) {
        const row = courseRows[i];
        if (row.dataset.courseId === id) {
            // Update row cells
            row.cells[0].textContent = code;
            row.cells[1].textContent = name;
            row.cells[2].textContent = dept;
            row.cells[3].textContent = credits;
            row.cells[4].textContent = type;
            
            // Update status badge
            const statusCell = row.cells[5];
            const statusClass = status === 'Active' ? 'success' : 
                               status === 'Pending Approval' ? 'warning' : 'danger';
            statusCell.innerHTML = `<span class="status-badge ${statusClass}">${status}</span>`;
            
            break;
        }
    }
}

// Filter courses by department
function filterCourses(department) {
    const rows = document.querySelectorAll('#courses tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const courseDepartment = row.cells[2].textContent;
        
        if (department === 'All Departments' || courseDepartment === department) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    showNotification(`Showing ${visibleCount} courses in department: ${department}`, 'info');
}

// Filter logs by date
function filterLogs(date) {
    console.log('filterLogs called with date:', date);
    
    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    // Use the selected date as both start and end date to filter for that specific day
    // The backend expects dates in YYYY-MM-DD format which is what the input provides
    const startDate = date;
    const endDate = date;
    
    console.log('Calling loadActivityLogs with startDate:', startDate, 'endDate:', endDate);
    
    // Load activity logs with the date filter
    loadActivityLogs(startDate, endDate);
}

// Format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Setup charts
function setupCharts() {
    // Setup mini charts in stat cards
    setupMiniCharts();
    
    // Setup storage chart
    setupStorageChart();
}

// Setup mini charts
function setupMiniCharts() {
    // Department chart
    const departmentChart = document.getElementById('departmentChart');
    if (departmentChart) {
        const ctx = departmentChart.getContext('2d');
        drawMiniLineChart(ctx, [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]);
    }
    
    // User chart
    const userChart = document.getElementById('userChart');
    if (userChart) {
        const ctx = userChart.getContext('2d');
        drawMiniLineChart(ctx, [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1248]);
    }
    
    // Course chart
    const courseChart = document.getElementById('courseChart');
    if (courseChart) {
        const ctx = courseChart.getContext('2d');
        drawMiniLineChart(ctx, [50, 60, 70, 80, 90, 100, 110, 120, 130, 135, 138, 140, 142]);
    }
    
    // Health chart
    const healthChart = document.getElementById('healthChart');
    if (healthChart) {
        const ctx = healthChart.getContext('2d');
        drawMiniLineChart(ctx, [95, 96, 97, 96, 97, 98, 97, 98, 97, 98, 97, 98, 98]);
    }
}

// Draw mini line chart
function drawMiniLineChart(ctx, data) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 5;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate min and max values
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const valueRange = maxValue - minValue || 1;
    
    // Calculate x and y scales
    const xScale = (width - padding * 2) / (data.length - 1);
    const yScale = (height - padding * 2) / valueRange;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(padding, height - padding - (data[0] - minValue) * yScale);
    
    for (let i = 1; i < data.length; i++) {
        ctx.lineTo(padding + i * xScale, height - padding - (data[i] - minValue) * yScale);
    }
    
    ctx.strokeStyle = '#303F9F';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw gradient fill
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(48, 63, 159, 0.3)');
    gradient.addColorStop(1, 'rgba(48, 63, 159, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
}

// Setup storage chart
function setupStorageChart() {
    // Load initial storage data
    loadStorageData();
    
    // Data for the chart
    const data = [
        { label: 'Database', value: 11, color: '#303F9F' },
        { label: 'Course Materials', value: 30, color: '#3949AB' },
        { label: 'User Files', value: 21, color: '#5C6BC0' },
        { label: 'System Backups', value: 16, color: '#7986CB' },
        { label: 'Other', value: 22, color: '#C5CAE9' }
    ];
    
    // Clear canvas
    const storageChart = document.getElementById('storageChart');
    if (!storageChart) return;
    
    const ctx = storageChart.getContext('2d');
    
    // Calculate angles
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = -Math.PI / 2;
    
    // Draw pie slices
    data.forEach(item => {
        const sliceAngle = (item.value / total) * Math.PI * 2;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(storageChart.width / 2, storageChart.height / 2);
        ctx.arc(
            storageChart.width / 2,
            storageChart.height / 2,
            Math.min(storageChart.width, storageChart.height) / 3,
            startAngle,
            startAngle + sliceAngle
        );
        ctx.closePath();
        
        ctx.fillStyle = item.color;
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Update start angle for next slice
        startAngle += sliceAngle;
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(storageChart.width / 2, storageChart.height / 2, Math.min(storageChart.width, storageChart.height) / 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
}


// 
//  PROGRAMS MODULE 
// 

let programsList = []; // cached programs for dropdowns

// Load all programs and render cards
async function loadPrograms() {
    const grid = document.getElementById('programsGrid');
    if (!grid) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    grid.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:2rem; grid-column:1/-1;"><i class="fas fa-spinner fa-spin"></i> Loading programs...</p>';

    try {
        const res = await fetch('/api/programs', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        if (data.success && data.data.programs.length > 0) {
            programsList = data.data.programs;
            grid.innerHTML = '';
            data.data.programs.forEach(prog => renderProgramCard(prog, grid));
            populateProgramDropdowns(data.data.programs);
        } else {
            programsList = [];
            grid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:3rem; color:#94a3b8;">
                    <i class="fas fa-university" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                    <p>No programs yet. Create your first degree program to get started.</p>
                    <button class="btn btn-primary" onclick="showAddProgramModal()" style="margin-top:1rem;">
                        <i class="fas fa-plus"></i> Create First Program
                    </button>
                </div>`;
        }
    } catch (err) {
        console.error('loadPrograms error:', err);
        grid.innerHTML = '<p style="color:#f44336; text-align:center; padding:2rem; grid-column:1/-1;">Error loading programs.</p>';
    }
}

// Render a single program card
function renderProgramCard(prog, container) {
    const durationLabel = `${prog.duration} Year${prog.duration > 1 ? 's' : ''}`;
    const semLabel = `${prog.totalSemesters} Semesters`;
    const card = document.createElement('div');
    card.style.cssText = 'background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1.5rem; box-shadow:0 2px 8px rgba(0,0,0,0.06); display:flex; flex-direction:column; gap:0.8rem;';
    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <div style="background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; display:inline-block; padding:0.5rem 0.9rem; border-radius:8px; font-weight:700; font-size:1rem; letter-spacing:0.5px; margin-bottom:0.5rem;">${escHtml(prog.code)}</div>
                <h3 style="margin:0; font-size:1rem; color:#1e293b; font-weight:600;">${escHtml(prog.name)}</h3>
            </div>
            <span style="background:#f0fdf4; color:#15803d; padding:0.25rem 0.7rem; border-radius:20px; font-size:0.75rem; font-weight:600;">Active</span>
        </div>
        ${prog.description ? `<p style="margin:0; color:#64748b; font-size:0.88rem; line-height:1.5;">${escHtml(prog.description)}</p>` : ''}
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            <span style="background:#ede9fe; color:#7c3aed; padding:0.25rem 0.7rem; border-radius:6px; font-size:0.8rem; font-weight:600;"><i class="fas fa-clock"></i> ${durationLabel}</span>
            <span style="background:#fef9c3; color:#a16207; padding:0.25rem 0.7rem; border-radius:6px; font-size:0.8rem; font-weight:600;"><i class="fas fa-layer-group"></i> ${semLabel}</span>
            <span style="background:#dbeafe; color:#1d4ed8; padding:0.25rem 0.7rem; border-radius:6px; font-size:0.8rem; font-weight:600;"><i class="fas fa-building"></i> ${prog.departmentCount || 0} Depts</span>
            <span style="background:#fce7f3; color:#be185d; padding:0.25rem 0.7rem; border-radius:6px; font-size:0.8rem; font-weight:600;"><i class="fas fa-book"></i> ${prog.subjectCount || 0} Subjects</span>
        </div>
        <div style="display:flex; gap:0.75rem; margin-top:0.5rem;">
            <button onclick="viewProgramDetail('${prog._id}')" style="flex:1; padding:0.55rem; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.85rem;">
                <i class="fas fa-eye"></i> View Details
            </button>
            <button onclick="deleteProgramById('${prog._id}', '${escHtml(prog.name)}')" style="padding:0.55rem 0.8rem; background:#fff; color:#ef4444; border:1px solid #fecaca; border-radius:8px; cursor:pointer; font-size:0.85rem;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(card);
}

// Populate program dropdowns across the page
function populateProgramDropdowns(programs) {
    const selectors = ['#deptProgram', '#courseProgram', '#editDeptProgram', '#courseProgramFilter'];
    selectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (!el) return;
        const placeholder = sel.includes('Filter') ? '<option value="">All Programs</option>' : '<option value="">Select Program (optional)</option>';
        el.innerHTML = placeholder + programs.map(p => `<option value="${p._id}">${escHtml(p.name)} (${escHtml(p.code)})</option>`).join('');
    });
}

// Show Add Program modal
function showAddProgramModal() {
    const modal = document.getElementById('addProgramModal');
    if (modal) modal.style.display = 'block';
}

// View program details
async function viewProgramDetail(programId) {
    const prog = programsList.find(p => p._id === programId);
    if (!prog) return;

    document.getElementById('programDetailTitle').textContent = `${prog.name} (${prog.code})`;
    document.getElementById('programDetailDuration').textContent = `${prog.duration} Years`;
    document.getElementById('programDetailSemesters').textContent = prog.totalSemesters;
    document.getElementById('programDetailDeptCount').textContent = prog.departmentCount || 0;
    document.getElementById('programDetailSubjectCount').textContent = prog.subjectCount || 0;

    // Hide grid, show detail
    document.getElementById('programsGrid').style.display = 'none';
    document.getElementById('programDetailView').style.display = 'block';

    // Load departments for this program
    const deptList = document.getElementById('programDeptsList');
    deptList.innerHTML = '<p style="color:#94a3b8;">Loading...</p>';
    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`/api/programs/${programId}/departments`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success && data.data.departments.length > 0) {
            deptList.innerHTML = `<div style="display:flex; flex-wrap:wrap; gap:0.75rem;">
                ${data.data.departments.map(d => `
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.85rem 1.2rem; min-width:180px;">
                        <div style="font-weight:700; color:#1e293b;">${escHtml(d.name)}</div>
                        <div style="font-size:0.82rem; color:#64748b; margin-top:0.25rem;">HOD: ${escHtml(d.hod || 'N/A')}</div>
                        <div style="font-size:0.82rem; color:#64748b;">Faculty: ${d.faculty || 0} | Students: ${d.students || 0}</div>
                    </div>
                `).join('')}
            </div>`;
        } else {
            deptList.innerHTML = '<p style="color:#94a3b8;">No departments linked to this program yet. Go to Departments and edit them to link a program.</p>';
        }
    } catch (err) {
        deptList.innerHTML = '<p style="color:#f44336;">Error loading departments.</p>';
    }
}

function closeProgramDetail() {
    document.getElementById('programsGrid').style.display = '';
    document.getElementById('programDetailView').style.display = 'none';
}

// Delete program
async function deleteProgramById(id, name) {
    if (!confirm(`Are you sure you want to deactivate the program "${name}"? Existing departments will NOT be deleted.`)) return;
    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`/api/programs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            showNotification(`Program "${name}" deactivated`, 'success');
            loadPrograms();
        } else {
            showNotification(data.message || 'Failed to deactivate program', 'error');
        }
    } catch (err) {
        showNotification('Network error', 'error');
    }
}

// Wire up Add Program form
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('addProgramForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const name = document.getElementById('programName').value.trim();
            const code = document.getElementById('programCode').value.trim();
            const description = document.getElementById('programDescription').value.trim();
            const duration = parseInt(document.getElementById('programDuration').value);
            const totalSemesters = parseInt(document.getElementById('programSemesters').value);

            if (!name || !code) { showNotification('Name and code are required', 'error'); return; }

            const btn = form.querySelector('[type="submit"]');
            btn.disabled = true; btn.textContent = 'Creating...';
            const token = localStorage.getItem('authToken');
            try {
                const res = await fetch('/api/programs', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, code, description, duration, totalSemesters })
                });
                const data = await res.json();
                if (data.success) {
                    showNotification(`Program "${name}" created successfully!`, 'success');
                    document.getElementById('addProgramModal').style.display = 'none';
                    form.reset();
                    loadPrograms();
                } else {
                    showNotification(data.message || 'Failed to create program', 'error');
                }
            } catch (err) {
                showNotification('Network error', 'error');
            } finally {
                btn.disabled = false; btn.textContent = 'Create Program';
            }
        });
    }

    // Load programs when Programs section is clicked
    const programsLink = document.querySelector('[data-section="programs"]');
    if (programsLink) {
        programsLink.addEventListener('click', function () {
            setTimeout(loadPrograms, 50);
        });
    }

    // Load courses when Courses section is clicked
    const coursesLink = document.querySelector('[data-section="courses"]');
    if (coursesLink) {
        coursesLink.addEventListener('click', function () {
            setTimeout(() => { loadAdminCourses(); loadPrograms(); }, 50);
        });
    }

    // Course program filter
    const courseProgramFilter = document.getElementById('courseProgramFilter');
    if (courseProgramFilter) {
        courseProgramFilter.addEventListener('change', loadAdminCourses);
    }
    const courseDeptFilterBar = document.getElementById('courseDeptFilterBar');
    if (courseDeptFilterBar) {
        courseDeptFilterBar.addEventListener('change', loadAdminCourses);
    }

    // Add Program modal close via overlay
    const addProgModal = document.getElementById('addProgramModal');
    if (addProgModal) {
        window.addEventListener('click', e => { if (e.target === addProgModal) addProgModal.style.display = 'none'; });
    }

    // Wire up Add Course form (new version using /api/courses)
    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) {
        // Remove old inline submit listener and replace
        addCourseForm.removeEventListener('submit', addCourse);
        addCourseForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await submitAddCourseForm();
        });
    }

    // Wire up Add Department form to pass program
    const addDeptForm = document.getElementById('addDepartmentForm');
    if (addDeptForm) {
        addDeptForm.removeEventListener('submit', addDepartment);
        addDeptForm.addEventListener('submit', function (e) {
            e.preventDefault();
            addDepartmentWithProgram();
        });
    }

    // Edit Department  wire in program field
    const editDeptForm = document.getElementById('editDepartmentForm');
    if (editDeptForm) {
        editDeptForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const id = document.getElementById('editDeptId').value;
            const name = document.getElementById('editDeptName').value;
            const hod = document.getElementById('editDeptHOD').value.trim();
            const established = document.getElementById('editDeptEstablished').value;
            const program = document.getElementById('editDeptProgram').value || null;
            if (!hod) { showNotification('Please enter the HOD name', 'error'); return; }
            const token = localStorage.getItem('authToken');
            const btn = editDeptForm.querySelector('[type="submit"]');
            btn.disabled = true; btn.textContent = 'Saving...';
            try {
                const payload = { name, hod };
                if (established) payload.established = parseInt(established);
                if (program) payload.program = program;
                const res = await fetch(`/api/departments/${id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (data.success) {
                    showNotification('Department updated successfully', 'success');
                    document.getElementById('editDepartmentModal').style.display = 'none';
                    loadDepartments();
                } else {
                    showNotification(data.message || 'Failed to update department', 'error');
                }
            } catch (err) {
                showNotification('Network error while saving', 'error');
            } finally {
                btn.disabled = false; btn.textContent = 'Save Changes';
            }
        });
    }
});

// Add department with program field
async function addDepartmentWithProgram() {
    const deptName = document.getElementById('deptName').value.trim();
    const deptHOD = document.getElementById('deptHOD').value.trim();
    const deptFaculty = document.getElementById('deptFaculty').value;
    const deptStudents = document.getElementById('deptStudents').value;
    const deptEstablished = document.getElementById('deptEstablished').value;
    const deptProgram = document.getElementById('deptProgram').value || null;

    if (!deptName || !deptHOD || !deptFaculty || !deptEstablished) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    const token = localStorage.getItem('authToken');
    const notification = showNotification('Creating department...', 'info', 0);

    try {
        const res = await fetch('/api/departments', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: deptName,
                hod: deptHOD,
                faculty: parseInt(deptFaculty),
                students: parseInt(deptStudents || 0),
                established: parseInt(deptEstablished),
                program: deptProgram,
            })
        });
        const data = await res.json();
        removeNotification(notification);
        if (data.success) {
            showNotification(`Department "${deptName}" created successfully!`, 'success');
            document.getElementById('addDepartmentModal').style.display = 'none';
            document.getElementById('addDepartmentForm').reset();
            loadDepartments();
        } else {
            showNotification(data.message || 'Failed to create department', 'error');
        }
    } catch (err) {
        removeNotification(notification);
        showNotification('Network error', 'error');
    }
}

// Override editDepartment to populate program dropdown
function editDepartment(id, name, hod, faculty, students, programId) {
    const modal = document.getElementById('editDepartmentModal');
    if (!modal) return;

    document.getElementById('editDeptId').value = id || '';
    document.getElementById('editDeptHOD').value = hod || '';

    const nameSelect = document.getElementById('editDeptName');
    const match = Array.from(nameSelect.options).find(o => o.value === name);
    nameSelect.value = match ? name : nameSelect.options[0].value;

    // Set program
    const progSelect = document.getElementById('editDeptProgram');
    if (progSelect && programId) {
        progSelect.value = programId;
    } else if (progSelect) {
        progSelect.value = '';
    }

    // Populate program dropdown if not already
    if (programsList.length > 0) {
        populateProgramDropdowns(programsList);
        if (progSelect && programId) progSelect.value = programId;
    }

    modal.style.display = 'block';
}

// Updated addDepartmentToTable to show program column
function addDepartmentToTable(name, hod, faculty, students, isActive, id, programData) {
    const departmentsTable = document.querySelector('#departments tbody');
    if (!departmentsTable) return;

    const row = document.createElement('tr');
    row.dataset.departmentId = id;

    const statusBadge = isActive
        ? '<span class="status-badge success">Active</span>'
        : '<span class="status-badge danger">Inactive</span>';

    const progName = programData
        ? `<span style="background:#ede9fe; color:#7c3aed; padding:0.15rem 0.5rem; border-radius:4px; font-size:0.78rem; font-weight:600;">${escHtml(programData.code || programData.name)}</span>`
        : '<span style="color:#94a3b8; font-size:0.82rem;">N/A</span>';

    row.innerHTML = `
        <td><strong>${escHtml(name)}</strong></td>
        <td>${progName}</td>
        <td>${escHtml(hod || 'N/A')}</td>
        <td>${faculty}</td>
        <td>${students}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn btn-sm btn-outline btn-danger dept-delete-btn">Delete</button>
            <button class="btn btn-sm btn-outline dept-edit-btn">Edit</button>
        </td>
    `;

    departmentsTable.appendChild(row);

    row.querySelector('.dept-delete-btn').addEventListener('click', function (e) {
        e.preventDefault();
        deleteDepartment(id, name);
    });

    row.querySelector('.dept-edit-btn').addEventListener('click', function (e) {
        e.preventDefault();
        const progId = programData ? programData._id : null;
        editDepartment(id, name, hod, faculty, students, progId);
    });
}

// Updated loadDepartments to show program
function loadDepartments() {
    const departmentsTable = document.querySelector('#departments tbody');
    if (!departmentsTable) return;
    departmentsTable.innerHTML = '<tr><td colspan="7" class="text-center">Loading departments...</td></tr>';
    const authToken = localStorage.getItem('authToken');
    if (!authToken) { departmentsTable.innerHTML = '<tr><td colspan="7" class="text-center">Please login</td></tr>'; return; }

    // Also load programs for dropdowns
    if (programsList.length === 0) {
        fetch('/api/programs', { headers: { 'Authorization': `Bearer ${authToken}` } })
            .then(r => r.json())
            .then(data => {
                if (data.success) { programsList = data.data.programs; populateProgramDropdowns(data.data.programs); }
            }).catch(() => {});
    } else {
        populateProgramDropdowns(programsList);
    }

    fetch('/api/departments', { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } })
        .then(response => response.json())
        .then(data => {
            departmentsTable.innerHTML = '';
            if (data.success && data.data && data.data.departments && data.data.departments.length > 0) {
                data.data.departments.forEach(dept => {
                    addDepartmentToTable(dept.name, dept.hod, dept.faculty, dept.students, dept.isActive, dept._id, dept.program);
                });
            } else {
                departmentsTable.innerHTML = '<tr><td colspan="7" class="text-center">No departments found</td></tr>';
            }
            loadDepartmentOptions();
        })
        .catch(error => {
            console.error('Error fetching departments:', error);
            departmentsTable.innerHTML = '<tr><td colspan="7" class="text-center">Error loading departments.</td></tr>';
        });
}

// 
//  ADMIN COURSES MODULE (using /api/courses) 
// 

async function loadAdminCourses() {
    const tbody = document.getElementById('coursesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading subjects...</td></tr>';

    const token = localStorage.getItem('authToken');
    const programFilter = document.getElementById('courseProgramFilter')?.value || '';
    const deptFilter = document.getElementById('courseDeptFilterBar')?.value || '';

    let url = '/api/courses?';
    if (programFilter) url += `program=${programFilter}&`;
    if (deptFilter) url += `department=${deptFilter}&`;

    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        if (data.success && data.data.courses.length > 0) {
            tbody.innerHTML = '';
            data.data.courses.forEach(course => {
                const row = document.createElement('tr');
                row.dataset.courseId = course._id;
                row.innerHTML = `
                    <td><strong>${escHtml(course.code)}</strong></td>
                    <td>${escHtml(course.name)}</td>
                    <td>${course.program ? `<span style="background:#ede9fe;color:#7c3aed;padding:0.15rem 0.5rem;border-radius:4px;font-size:0.78rem;font-weight:600;">${escHtml(course.program.code)}</span>` : '<span style="color:#94a3b8;font-size:0.82rem;">N/A</span>'}</td>
                    <td>${escHtml(course.department || '')}</td>
                    <td>${course.credits}</td>
                    <td>${course.semester || ''}</td>
                    <td><span style="background:#dbeafe;color:#1d4ed8;padding:0.15rem 0.5rem;border-radius:4px;font-size:0.78rem;font-weight:600;">${escHtml(course.type || 'Core')}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline btn-danger" onclick="deleteAdminCourse('${course._id}', '${escHtml(course.name)}')"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:2rem; color:#94a3b8;">No subjects found. Add your first subject above.</td></tr>';
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="color:#f44336;">Error loading subjects.</td></tr>';
    }
}

async function submitAddCourseForm() {
    const code = document.getElementById('courseCode').value.trim();
    const name = document.getElementById('courseName').value.trim();
    const program = document.getElementById('courseProgram').value || null;
    const dept = document.getElementById('courseDept').value || null;
    const semester = document.getElementById('courseSemester').value || null;
    const credits = parseInt(document.getElementById('courseCredits').value) || 3;
    const type = document.getElementById('courseType').value || 'Core';

    if (!code || !name) { showNotification('Subject code and name are required', 'error'); return; }

    const token = localStorage.getItem('authToken');
    const btn = document.querySelector('#addCourseForm [type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Adding...'; }

    try {
        const res = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name, program, department: dept, semester, credits, type })
        });
        const data = await res.json();
        if (data.success) {
            showNotification(`Subject "${name}" added successfully!`, 'success');
            document.getElementById('addCourseModal').style.display = 'none';
            document.getElementById('addCourseForm').reset();
            loadAdminCourses();
        } else {
            showNotification(data.message || 'Failed to add subject', 'error');
        }
    } catch (err) {
        showNotification('Network error', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Add Subject'; }
    }
}

async function deleteAdminCourse(id, name) {
    if (!confirm(`Delete subject "${name}"?`)) return;
    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`/api/courses/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) { showNotification(`Subject "${name}" deleted`, 'success'); loadAdminCourses(); }
        else showNotification(data.message || 'Failed to delete', 'error');
    } catch (err) { showNotification('Network error', 'error'); }
}

// Patch setupNavigation to handle programs tab
const _origSetupNavigation = typeof setupNavigation === 'function' ? setupNavigation : null;
document.addEventListener('DOMContentLoaded', function () {
    // Update page title map for programs
    const originalUpdatePageTitle = updatePageTitle;
    // Override to add programs title
    window.updatePageTitle = function (sectionId) {
        const titles = {
            'overview': 'Admin Dashboard',
            'programs': 'Degree Programs',
            'departments': 'College Departments',
            'users': 'User Management',
            'courses': 'Subject / Course Catalog',
            'logs': 'Activity Logs',
            'reports': 'System Reports'
        };
        const title = titles[sectionId] || 'Admin Dashboard';
        const pageTitleElement = document.querySelector('.page-title h1');
        if (pageTitleElement) pageTitleElement.textContent = title;
    };
});
