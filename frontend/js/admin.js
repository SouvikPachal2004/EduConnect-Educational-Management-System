document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeDashboard();
    
    // Setup navigation
    setupNavigation();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Setup interactive elements
    setupInteractiveElements();
    
    // Setup forms
    setupForms();
    
    // Setup data tables
    setupDataTables();
    
    // Setup notification system
    setupNotifications();
    
    // Setup system monitoring
    setupSystemMonitoring();
    
    // Setup resource monitoring
    setupResourceMonitoring();
    
    // Setup activity logs
    setupActivityLogs();
    
    // Setup report generation
    setupReportGeneration();
    
    // Setup modals
    setupModals();
    
    // Setup charts
    setupCharts();
    
    // Setup notification dropdown
    setupNotificationDropdown();
});

// Initialize dashboard components
function initializeDashboard() {
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
    
    // Initialize notification dropdown
    populateNotificationDropdown();
    
    // Load all dynamic data
    loadDashboardStats();
    loadDashboardResourceUsage(); // Add this line to load dashboard resource usage
    loadDepartments();
    loadUsers();
    loadCourses();
    loadSystemStatus();
    loadResourceUsage();
    loadActivityLogs();
    loadReports();
    loadStorageData();
    
    // Setup charts after data is loaded
    setTimeout(setupCharts, 1500);
}

// Load dashboard statistics
function loadDashboardStats() {
    // Simulate API call to get dashboard statistics
    setTimeout(() => {
        // Department stats
        const deptStatCard = document.querySelector('#overview .stat-card:nth-child(1)');
        if (deptStatCard) {
            const valueElement = deptStatCard.querySelector('.stat-card-value');
            const changeElement = deptStatCard.querySelector('.stat-card-change');
            if (valueElement) {
                // Generate a random value between 6-12 for demo
                const value = Math.floor(Math.random() * 6) + 6;
                valueElement.textContent = value.toString();
            }
            if (changeElement) {
                // Generate a random value between 0-3 for demo
                const added = Math.floor(Math.random() * 3);
                changeElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${added} added this year`;
            }
        }
        
        // User stats
        const userStatCard = document.querySelector('#overview .stat-card:nth-child(2)');
        if (userStatCard) {
            const valueElement = userStatCard.querySelector('.stat-card-value');
            const changeElement = userStatCard.querySelector('.stat-card-change');
            if (valueElement) {
                // Generate a random value between 1000-1500 for demo
                const value = Math.floor(Math.random() * 500) + 1000;
                valueElement.textContent = value.toLocaleString();
            }
            if (changeElement) {
                // Generate a random value between 80-150 for demo
                const added = Math.floor(Math.random() * 70) + 80;
                changeElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${added} new this month`;
            }
        }
        
        // Course stats
        const courseStatCard = document.querySelector('#overview .stat-card:nth-child(3)');
        if (courseStatCard) {
            const valueElement = courseStatCard.querySelector('.stat-card-value');
            const changeElement = courseStatCard.querySelector('.stat-card-change');
            if (valueElement) {
                // Generate a random value between 120-180 for demo
                const value = Math.floor(Math.random() * 60) + 120;
                valueElement.textContent = value.toString();
            }
            if (changeElement) {
                // Generate a random value between 5-20 for demo
                const added = Math.floor(Math.random() * 15) + 5;
                changeElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${added} from last semester`;
            }
        }
        
        // System health stats
        const healthStatCard = document.querySelector('#overview .stat-card:nth-child(4)');
        if (healthStatCard) {
            const valueElement = healthStatCard.querySelector('.stat-card-value');
            const changeElement = healthStatCard.querySelector('.stat-card-change');
            if (valueElement) {
                // Generate a random value between 95-100 for demo
                const value = Math.floor(Math.random() * 5) + 95;
                valueElement.textContent = `${value}%`;
            }
            if (changeElement) {
                changeElement.innerHTML = '<i class="fas fa-check-circle"></i> All systems operational';
            }
        }
    }, 500);
}

// Load departments data
function loadDepartments() {
    const departmentsTable = document.querySelector('#departments tbody');
    if (!departmentsTable) return;
    
    // Show loading message
    departmentsTable.innerHTML = '<tr><td colspan="6" class="text-center">Loading departments...</td></tr>';
    
    // Simulate API call
    setTimeout(() => {
        // Sample department data
        const departments = [
            { name: 'Computer Engineering', hod: 'Dr. Priya Singh', faculty: 24, students: 342, established: 2010 },
            { name: 'Mechanical Engineering', hod: 'Dr. Anil Verma', faculty: 18, students: 285, established: 2005 },
            { name: 'Electrical Engineering', hod: 'Dr. Suresh Iyer', faculty: 20, students: 310, established: 2008 },
            { name: 'Civil Engineering', hod: 'Dr. Meena Reddy', faculty: 16, students: 275, established: 2012 },
            { name: 'Chemical Engineering', hod: 'Dr. Rajesh Gupta', faculty: 14, students: 195, established: 2015 }
        ];
        
        // Clear table
        departmentsTable.innerHTML = '';
        
        // Add departments to table
        departments.forEach(dept => {
            addDepartmentToTable(dept.name, dept.hod, dept.faculty, dept.students, dept.established);
        });
    }, 800);
}

// Load users from API
function loadUsers() {
    // Show loading message
    const usersTable = document.querySelector('#users tbody');
    if (!usersTable) return;
    
    // Clear existing content
    usersTable.innerHTML = '<tr><td colspan="7" class="text-center">Loading users...</td></tr>';
    
    // Simulate API call with setTimeout
    setTimeout(() => {
        // Sample user data (in a real app, this would come from an API)
        const users = [
            { name: 'Dr. Priya Singh', id: 'HOD-CS001', role: 'HOD', department: 'Computer Engineering', email: 'priya.singh@educonnect.edu', status: 'Active' },
            { name: 'Prof. Amit Patel', id: 'FAC-CS024', role: 'Faculty', department: 'Computer Engineering', email: 'amit.patel@educonnect.edu', status: 'Active' },
            { name: 'Rohan Kumar', id: 'STU-CS2021001', role: 'Student', department: 'Computer Engineering', email: 'rohan.kumar@educonnect.edu', status: 'Active' },
            { name: 'Dr. Anil Verma', id: 'HOD-ME001', role: 'HOD', department: 'Mechanical Engineering', email: 'anil.verma@educonnect.edu', status: 'Active' },
            { name: 'Neha Sharma', id: 'STU-CS2021042', role: 'Student', department: 'Computer Engineering', email: 'neha.sharma@educonnect.edu', status: 'Suspended' }
        ];
        
        // Clear table
        usersTable.innerHTML = '';
        
        // Add users to table
        users.forEach(user => {
            addUserToTable(user.name, user.id, user.role, user.department, user.email, user.status);
        });
        
        // Update user count
        updateUserCount();
    }, 1000);
}

// Load courses from API
function loadCourses() {
    // Show loading message
    const coursesTable = document.querySelector('#courses tbody');
    if (!coursesTable) return;
    
    // Clear existing content
    coursesTable.innerHTML = '<tr><td colspan="7" class="text-center">Loading courses...</td></tr>';
    
    // Simulate API call with setTimeout
    setTimeout(() => {
        // Sample course data (in a real app, this would come from an API)
        const courses = [
            { code: 'CS301', name: 'Data Structures', department: 'Computer Engineering', credits: 4, type: 'Core', status: 'Active' },
            { code: 'CS302', name: 'Algorithms', department: 'Computer Engineering', credits: 4, type: 'Core', status: 'Active' },
            { code: 'ME201', name: 'Thermodynamics', department: 'Mechanical Engineering', credits: 3, type: 'Core', status: 'Active' },
            { code: 'EE101', name: 'Circuit Analysis', department: 'Electrical Engineering', credits: 3, type: 'Core', status: 'Active' },
            { code: 'CS401', name: 'Machine Learning', department: 'Computer Engineering', credits: 3, type: 'Elective', status: 'Pending Approval' }
        ];
        
        // Clear table
        coursesTable.innerHTML = '';
        
        // Add courses to table
        courses.forEach(course => {
            addCourseToTable(course.code, course.name, course.department, course.credits, course.type, course.status);
        });
        
        // Update course count
        updateCourseCount();
    }, 1000);
}

// Load system status data
function loadSystemStatus() {
    const systemStatusTable = document.querySelector('#overview .data-table tbody');
    if (!systemStatusTable) return;
    
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
function loadActivityLogs() {
    const logsTable = document.querySelector('#logs tbody');
    if (!logsTable) return;
    
    // Show loading message
    logsTable.innerHTML = '<tr><td colspan="6" class="text-center">Loading activity logs...</td></tr>';
    
    // Simulate API call
    setTimeout(() => {
        // Sample activity logs data
        const logs = [
            { timestamp: '2023-10-15 09:24:33', user: 'Dr. Priya Singh', action: 'Course creation', ip: '192.168.1.105', details: 'Created course CS401: Machine Learning', status: 'Success' },
            { timestamp: '2023-10-15 08:45:12', user: 'Prof. Amit Patel', action: 'Grade submission', ip: '192.168.1.42', details: 'Submitted grades for CS301: Data Structures', status: 'Success' },
            { timestamp: '2023-10-15 03:00:00', user: 'System', action: 'Backup completed', ip: '127.0.0.1', details: 'Daily backup completed successfully', status: 'Success' },
            { timestamp: '2023-10-14 22:15:44', user: 'Student: Rohan Kumar', action: 'Login attempt', ip: '192.168.1.78', details: 'Failed login attempt - invalid password', status: 'Failed' },
            { timestamp: '2023-10-14 18:30:21', user: 'Dr. Anil Verma', action: 'Timetable update', ip: '192.168.1.93', details: 'Updated timetable for Mechanical Engineering', status: 'Success' }
        ];
        
        // Clear table
        logsTable.innerHTML = '';
        
        // Add logs to table
        logs.forEach(log => {
            addLogEntryToTable({
                timestamp: log.timestamp,
                user: log.user,
                action: log.action,
                ip: log.ip,
                details: log.details,
                status: log.status === 'Success' ? 'success' : 'danger'
            });
        });
    }, 900);
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
        'resources': 'System Resources',
        'settings': 'System Settings',
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
    
    // System settings actions
    setupSettingsActions();
    
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
    
    // User filter dropdown
    const userFilter = document.querySelector('#users select.form-control');
    if (userFilter) {
        userFilter.addEventListener('change', function() {
            const filterValue = this.value;
            filterUsers(filterValue);
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
    // Filter button
    const filterBtn = document.querySelector('#logs .btn-outline');
    if (filterBtn) {
        filterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const dateInput = document.querySelector('#logs input[type="date"]');
            const dateValue = dateInput ? dateInput.value : '';
            filterLogs(dateValue);
        });
    }
}

// Setup system status actions
function setupSystemStatusActions() {
    // Use event delegation for system status action buttons
    const systemStatusTable = document.querySelector('#overview .data-table tbody');
    if (systemStatusTable) {
        systemStatusTable.addEventListener('click', function(e) {
            const target = e.target;
            
            // Check if clicked on a button
            if (target.classList.contains('btn') && target.classList.contains('btn-outline')) {
                e.preventDefault();
                const action = target.textContent.trim();
                const serviceName = target.closest('tr').cells[0].textContent;
                
                if (action === 'Restart') {
                    restartService(serviceName);
                } else if (action === 'Check') {
                    checkService(serviceName);
                }
            }
        });
    }
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
    // Load initial system status data
    loadSystemStatus();
    
    // Simulate system status updates
    setInterval(loadSystemStatus, 30000); // Update every 30 seconds
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
    // Load initial activity logs data
    loadActivityLogs();
    
    // Simulate new log entries
    setInterval(addNewLogEntry, 60000); // Add new log every minute
}

// Setup system monitoring
function setupSystemMonitoring() {
    // Load initial system status data
    loadSystemStatus();
    
    // Simulate system status updates
    setInterval(loadSystemStatus, 30000); // Update every 30 seconds
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
    // Load initial activity logs data
    loadActivityLogs();
    
    // Simulate new log entries
    setInterval(addNewLogEntry, 60000); // Add new log every minute
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



// Add new log entry (simulated)
function addNewLogEntry() {
    const users = ['Dr. Priya Singh', 'Prof. Amit Patel', 'Dr. Anil Verma', 'Student: Rohan Kumar'];
    const actions = ['Login', 'Logout', 'Course creation', 'Grade submission', 'File upload', 'Report generation'];
    const ips = ['192.168.1.105', '192.168.1.42', '192.168.1.78', '192.168.1.93'];
    
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const randomIP = ips[Math.floor(Math.random() * ips.length)];
    
    const logEntry = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: randomUser,
        action: randomAction,
        ip: randomIP,
        details: `${randomAction} performed by ${randomUser}`,
        status: Math.random() > 0.1 ? 'success' : 'danger'
    };
    
    addLogEntryToTable(logEntry);
    
    // Update notification badge
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        const currentCount = parseInt(badge.textContent);
        updateNotificationBadge(currentCount + 1);
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
    const closeAddDeptBtn = addDepartmentModal.querySelector('.close');
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
            addDepartmentForm.reset();
        });
    }
    
    if (closeAddDeptBtn) {
        closeAddDeptBtn.addEventListener('click', function() {
            addDepartmentModal.style.display = 'none';
            addDepartmentForm.reset();
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
    const closeAddUserBtn = addUserModal.querySelector('.close');
    const addUserForm = document.getElementById('addUserForm');
    
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addUserModal.style.display = 'block';
        });
    }
    
    if (cancelAddUserBtn) {
        cancelAddUserBtn.addEventListener('click', function() {
            addUserModal.style.display = 'none';
            addUserForm.reset();
        });
    }
    
    if (closeAddUserBtn) {
        closeAddUserBtn.addEventListener('click', function() {
            addUserModal.style.display = 'none';
            addUserForm.reset();
        });
    }
    
    if (addUserForm) {
        addUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addUser();
        });
    }
    
    // Add Course Modal
    const addCourseModal = document.getElementById('addCourseModal');
    const addCourseBtn = document.querySelector('#courses .btn-primary');
    const cancelAddCourseBtn = document.getElementById('cancelAddCourse');
    const closeAddCourseBtn = addCourseModal.querySelector('.close');
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
            addCourseForm.reset();
        });
    }
    
    if (closeAddCourseBtn) {
        closeAddCourseBtn.addEventListener('click', function() {
            addCourseModal.style.display = 'none';
            addCourseForm.reset();
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
            addDepartmentForm.reset();
        }
        
        if (event.target === addUserModal) {
            addUserModal.style.display = 'none';
            addUserForm.reset();
        }
        
        if (event.target === addCourseModal) {
            addCourseModal.style.display = 'none';
            addCourseForm.reset();
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
    
    // Show adding message
    const notification = showNotification('Adding department...', 'info', 0);
    
    // Simulate add process
    setTimeout(() => {
        removeNotification(notification);
        showNotification(`Department "${deptName}" added successfully`, 'success');
        
        // Add to departments table
        addDepartmentToTable(deptName, deptHOD, deptFaculty, deptStudents, deptEstablished);
        
        // Close modal
        const modal = document.getElementById('addDepartmentModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('addDepartmentForm').reset();
        }
        
        // Update department count
        updateDepartmentCount();
    }, 1500);
}

// Add department to table
function addDepartmentToTable(name, hod, faculty, students, established) {
    const departmentsTable = document.querySelector('#departments tbody');
    if (!departmentsTable) return;
    
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${name}</td>
        <td>${hod}</td>
        <td>${faculty}</td>
        <td>${students}</td>
        <td>${established}</td>
        <td>
            <a href="#" class="btn btn-sm btn-outline btn-danger">Delete</a>
            <a href="#" class="btn btn-sm btn-outline">Edit</a>
        </td>
    `;
    
    // Add to table
    departmentsTable.appendChild(row);
    
    // Add event listeners to new buttons
    const deleteBtn = row.querySelector('a:first-child');
    const editBtn = row.querySelector('a:last-child');
    
    deleteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        deleteDepartment(name);
    });
    
    editBtn.addEventListener('click', function(e) {
        e.preventDefault();
        editDepartment(name);
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

// Edit department
function editDepartment(departmentName) {
    showNotification(`Editing ${departmentName}`, 'info');
}

// Delete department
function deleteDepartment(departmentName) {
    if (confirm(`Are you sure you want to delete the department ${departmentName}?`)) {
        // Find the department row in the table
        const departmentRows = document.querySelectorAll('#departments tbody tr');
        departmentRows.forEach(row => {
            const nameCell = row.cells[0];
            if (nameCell && nameCell.textContent === departmentName) {
                // Remove the row from the table
                row.remove();
                // Update department count
                updateDepartmentCount();
                showNotification(`Department ${departmentName} deleted successfully`, 'success');
            }
        });
    }
}

// Show add user modal
function showAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Add user
function addUser() {
    const userName = document.getElementById('userName').value;
    const userId = document.getElementById('userId').value;
    const userRole = document.getElementById('userRole').value;
    const userDept = document.getElementById('userDept').value;
    const userEmail = document.getElementById('userEmail').value;
    const userStatus = document.getElementById('userStatus').value;
    
    if (!userName || !userId || !userRole || !userDept || !userEmail || !userStatus) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Show adding message
    const notification = showNotification('Adding user...', 'info', 0);
    
    // Simulate add process
    setTimeout(() => {
        removeNotification(notification);
        showNotification(`User "${userName}" added successfully`, 'success');
        
        // Add to users table
        addUserToTable(userName, userId, userRole, userDept, userEmail, userStatus);
        
        // Close modal
        const modal = document.getElementById('addUserModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('addUserForm').reset();
        }
        
        // Update user count
        updateUserCount();
    }, 1500);
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
        <td><span class="status-badge ${statusClass}">${status}</span></td>
        <td>
            <a href="#" class="btn btn-sm btn-outline">Edit</a>
            <a href="#" class="btn btn-sm btn-outline btn-danger">Delete</a>
        </td>
    `;
    
    // Add to table
    usersTable.appendChild(row);
    
    // Add event listeners to new buttons
    const editBtn = row.querySelector('a:first-child');
    const deleteBtn = row.querySelector('a:last-child');
    
    editBtn.addEventListener('click', function(e) {
        e.preventDefault();
        editUser(name);
    });
    
    deleteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        deleteUser(name);
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
        // Find the user row in the table
        const userRows = document.querySelectorAll('#users tbody tr');
        userRows.forEach(row => {
            const nameCell = row.cells[0];
            if (nameCell && nameCell.textContent === userName) {
                // Remove the row from the table
                row.remove();
                // Update user count
                updateUserCount();
                showNotification(`User ${userName} deleted successfully`, 'success');
            }
        });
    }
}

// Filter users by role
function filterUsers(role) {
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

// Show add course modal
function showAddCourseModal() {
    const modal = document.getElementById('addCourseModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Add course
function addCourse() {
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
    
    // Simulate add process
    setTimeout(() => {
        removeNotification(notification);
        showNotification(`Course "${courseName}" added successfully`, 'success');
        
        // Add to courses table
        addCourseToTable(courseCode, courseName, courseDept, courseCredits, courseType, courseStatus);
        
        // Close modal
        const modal = document.getElementById('addCourseModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('addCourseForm').reset();
        }
        
        // Update course count
        updateCourseCount();
    }, 1500);
}

// Add course to table
function addCourseToTable(code, name, dept, credits, type, status) {
    const coursesTable = document.querySelector('#courses tbody');
    if (!coursesTable) return;
    
    const row = document.createElement('tr');
    
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
    showNotification(`Editing ${courseName}`, 'info');
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
    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    const rows = document.querySelectorAll('#logs tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const logDate = row.cells[0].textContent.split(' ')[0];
        
        if (logDate === date) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    showNotification(`Showing ${visibleCount} logs for ${date}`, 'info');
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