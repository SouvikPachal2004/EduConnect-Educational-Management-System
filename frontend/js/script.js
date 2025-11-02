document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.05)';
        }
    });
    
    // Add animation to elements when they come into view
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards and role cards
    document.querySelectorAll('.feature-card, .role-card').forEach(card => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
    
    // Dashboard Navigation
    const sidebarMenu = document.querySelectorAll('.sidebar-menu a');
    const contentSections = document.querySelectorAll('.content-section');
    
    sidebarMenu.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all menu items
            sidebarMenu.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get the section to show
            const sectionId = this.getAttribute('data-section');
            
            // Hide all sections
            contentSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the selected section
            document.getElementById(sectionId).classList.add('active');
        });
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Toggle password visibility
    const togglePassword = document.querySelectorAll('.toggle-password');
    
    togglePassword.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
        });
    });
    
    // Form validation
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (email && password) {
                // Simulate login success
                alert('Login successful! Redirecting to dashboard...');
                // In a real application, you would redirect to the appropriate dashboard
                // window.location.href = 'student-dashboard.html';
            } else {
                alert('Please fill in all fields');
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const userType = document.getElementById('userType').value;
            const terms = document.getElementById('terms').checked;
            
            if (!fullName || !email || !password || !confirmPassword || !userType) {
                alert('Please fill in all fields');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            if (!terms) {
                alert('Please agree to the terms and conditions');
                return;
            }
            
            // Simulate registration success
            alert('Registration successful! Redirecting to login...');
            // In a real application, you would redirect to the login page
            // window.location.href = 'login.html';
        });
    }
    
    // Logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                // In a real application, you would logout the user and redirect to the login page
                alert('Logging out...');
                // window.location.href = 'login.html';
            }
        });
    }
    
    // Notification badge animation
    const notificationIcon = document.querySelector('.notification-icon');
    
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            const badge = this.querySelector('.notification-badge');
            if (badge) {
                badge.style.display = 'none';
            }
        });
    }
    
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('.grade-table tbody tr');
            
            tableRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
        });
    });
    
    // Initialize charts (using Chart.js for demonstration)
    // In a real application, you would include Chart.js library
    function initializeCharts() {
        // Attendance Chart
        const attendanceChart = document.getElementById('attendanceChart');
        if (attendanceChart) {
            // This is a placeholder for Chart.js implementation
            // In a real application, you would initialize the chart here
        }
        
        // Teacher Attendance Chart
        const teacherAttendanceChart = document.getElementById('teacherAttendanceChart');
        if (teacherAttendanceChart) {
            // This is a placeholder for Chart.js implementation
            // In a real application, you would initialize the chart here
        }
        
        // User Growth Chart
        const userGrowthChart = document.getElementById('userGrowthChart');
        if (userGrowthChart) {
            // This is a placeholder for Chart.js implementation
            // In a real application, you would initialize the chart here
        }
        
        // Course Enrollment Chart
        const courseEnrollmentChart = document.getElementById('courseEnrollmentChart');
        if (courseEnrollmentChart) {
            // This is a placeholder for Chart.js implementation
            // In a real application, you would initialize the chart here
        }
        
        // Platform Usage Chart
        const platformUsageChart = document.getElementById('platformUsageChart');
        if (platformUsageChart) {
            // This is a placeholder for Chart.js implementation
            // In a real application, you would initialize the chart here
        }
        
        // Device Distribution Chart
        const deviceDistributionChart = document.getElementById('deviceDistributionChart');
        if (deviceDistributionChart) {
            // This is a placeholder for Chart.js implementation
            // In a real application, you would initialize the chart here
        }
    }
    
    // Initialize charts when the page loads
    initializeCharts();
    
    // Calendar functionality
    const calendarDays = document.querySelectorAll('.calendar-day:not(.empty)');
    
    calendarDays.forEach(day => {
        day.addEventListener('click', function() {
            // Remove active class from all days
            calendarDays.forEach(d => d.classList.remove('active'));
            
            // Add active class to clicked day
            this.classList.add('active');
            
            // In a real application, you would show events for the selected day
        });
    });
    
    // Form submission for settings
    const settingsForm = document.querySelector('.settings-form');
    
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // In a real application, you would save the settings
            alert('Settings saved successfully!');
        });
    }
    
    // Dismiss notifications
    const dismissBtns = document.querySelectorAll('.notification-actions .btn-outline');
    
    dismissBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const notificationItem = this.closest('.notification-item');
            if (notificationItem) {
                notificationItem.style.display = 'none';
            }
        });
    });
    
    // Pagination
    const prevBtn = document.querySelector('.pagination .btn-outline:first-of-type');
    const nextBtn = document.querySelector('.pagination .btn-outline:last-of-type');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            // In a real application, you would navigate to the previous page
            alert('Previous page');
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            // In a real application, you would navigate to the next page
            alert('Next page');
        });
    }
});