// Real login functionality - handles form submission and role-based redirects
document.addEventListener('DOMContentLoaded', function() {
    const userTypeOptions = document.querySelectorAll('.user-type-option');
    const loginForm = document.getElementById('login-form');
    const alertContainer = document.getElementById('alert-container');
    let selectedUserType = 'student';

    // Handle user type selection
    userTypeOptions.forEach(option => {
        option.addEventListener('click', function() {
            userTypeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            selectedUserType = this.getAttribute('data-type');
        });
    });

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showAlert('Please fill in all fields.', 'danger');
                return;
            }

            authenticateUser(email, password, selectedUserType);
        });
    }

    // Authenticate user with backend API
    function authenticateUser(email, password, userType) {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
        }

        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: userType })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('currentUser', JSON.stringify(data.data.user));
                localStorage.setItem('authToken', data.data.token);

                showAlert('Login successful! Redirecting...', 'success');

                setTimeout(function() {
                    // If the user was sent here from a protected page (e.g. a
                    // meeting link opened while logged out), return them there.
                    const redirect = localStorage.getItem('postLoginRedirect');
                    if (redirect) {
                        localStorage.removeItem('postLoginRedirect');
                        window.location.href = redirect;
                    } else {
                        redirectByRole(userType);
                    }
                }, 1200);
            } else {
                showAlert(data.message || 'Invalid credentials for the selected role.', 'danger');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign In';
                }
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            showAlert('Connection error. Please check if the server is running.', 'danger');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });
    }

    // Redirect based on role
    function redirectByRole(role) {
        const dashboards = {
            'student': 'student-dashboard.html',
            'teacher': 'teacher-dashboard.html',
            'admin': 'admin-dashboard.html',
            'hod': 'HOD-dashboard.html',
            'managing_authority': 'managing-authority.html'
        };
        window.location.href = dashboards[role] || 'login.html';
    }

    // Show alert messages
    function showAlert(message, type) {
        if (!alertContainer) return;
        alertContainer.innerHTML = '';

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        const icon = type === 'danger' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alert.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        alertContainer.appendChild(alert);

        if (type !== 'success') {
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 500);
            }, 5000);
        }
    }

    // If already logged in, redirect to appropriate dashboard (or back to a
    // pending protected page such as a meeting link).
    const existingToken = localStorage.getItem('authToken');
    const existingUser = localStorage.getItem('currentUser');
    if (existingToken && existingUser) {
        try {
            const user = JSON.parse(existingUser);
            const redirect = localStorage.getItem('postLoginRedirect');
            if (redirect) {
                localStorage.removeItem('postLoginRedirect');
                window.location.href = redirect;
                return;
            }
            const dashboards = {
                'student': 'student-dashboard.html',
                'teacher': 'teacher-dashboard.html',
                'admin': 'admin-dashboard.html',
                'hod': 'HOD-dashboard.html',
                'managing_authority': 'managing-authority.html'
            };
            if (dashboards[user.role]) {
                window.location.href = dashboards[user.role];
            }
        } catch (e) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
        }
    }
});
