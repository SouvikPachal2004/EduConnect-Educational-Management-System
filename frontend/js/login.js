// Login functionality for testing
document.addEventListener('DOMContentLoaded', function() {
    // For testing purposes, we'll simulate a login
    // In a real application, this would be handled by the login form
    
    // Simulate successful login by storing the auth token
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDZmOWRlYjYwYjBjMDBlNzI5OGI5NSIsImVtYWlsIjoiYW51cmFnQHN0dWRlbnQuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NjIwNjUwMzksImV4cCI6MTc2NDY1NzAzOX0.LfpAEm0YpuqTChqggILXNkdoCuUy8n12cR3FEt0KBVQ';
    const currentUser = {
        "_id": "6906f9deb60b0c00e7298b95",
        "name": "Anurag Ray",
        "email": "anurag@student.com",
        "role": "student",
        "department": "Computer Science & Engineering",
        "studentId": "STU12345",
        "isActive": true
    };
    
    // Store in localStorage
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    console.log('Login simulation completed. Auth token and user data stored in localStorage.');
    
    // Redirect to student dashboard
    window.location.href = 'student-dashboard.html';
});