# EduConnect Startup Guide

## Application Status
✅ EduConnect backend server is now running on port 5001

## How to Access EduConnect

1. **Backend API**: Available at `http://localhost:5001`
2. **Frontend Interface**: Open your browser and go to `http://localhost:5001`
3. **API Health Check**: `http://localhost:5001/api/health`

## Test Accounts

You can log in using any of these test accounts:

### Student Account
- Email: student@educonnect.com
- Password: student123

### Teacher Account
- Email: teacher@educonnect.com
- Password: teacher123

### Head of Department (HOD) Account
- Email: hod@educonnect.com
- Password: hod123

### Administrator Account
- Email: admin@educonnect.com
- Password: admin123

### Managing Authority Account
- Email: managing@educonnect.com
- Password: managing123

## Features Available

- Role-based dashboards for each user type
- Class management
- Assignment creation and submission
- Attendance tracking
- Grade management
- Resource sharing
- Messaging system
- Academic performance prediction

## Stopping the Application

To stop the server, press `Ctrl + C` in the terminal where the server is running.

## Troubleshooting

If you encounter any issues:
1. Ensure MongoDB is running (it should be listening on port 27017)
2. Check that port 5001 is not being used by another application
3. Verify all dependencies are installed by running `npm install` in the backend directory