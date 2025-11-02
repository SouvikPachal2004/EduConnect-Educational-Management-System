# EduConnect Backend

This is the backend API for EduConnect - A Virtual Classroom Platform.

## Features

- User Authentication (Register, Login, JWT)
- Role-based Access Control (Student, Teacher, Admin, HOD, Managing Authority)
- Class Management
- Assignment Management
- Attendance Tracking
- Grade Management
- Resource Sharing
- Messaging System

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT)
- Bcrypt.js for password hashing
- Multer for file uploads

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Classes
- `POST /api/classes` - Create a new class (Teacher/Admin)
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `PUT /api/classes/:id` - Update class (Teacher/Admin)
- `DELETE /api/classes/:id` - Delete class (Teacher/Admin)
- `POST /api/classes/:id/students` - Add student to class (Teacher/Admin)
- `DELETE /api/classes/:id/students` - Remove student from class (Teacher/Admin)

### Assignments
- `POST /api/assignments` - Create assignment (Teacher/Admin)
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/:id` - Get assignment by ID
- `PUT /api/assignments/:id` - Update assignment (Teacher/Admin)
- `DELETE /api/assignments/:id` - Delete assignment (Teacher/Admin)
- `POST /api/assignments/:id/submit` - Submit assignment (Student)
- `GET /api/assignments/:id/submissions` - Get submissions (Teacher/Admin)
- `PUT /api/assignments/submissions/:id/grade` - Grade submission (Teacher/Admin)

### Attendance
- `POST /api/attendance` - Mark attendance (Teacher/Admin)
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/summary/student` - Get student attendance summary
- `GET /api/attendance/summary/class/:classId` - Get class attendance summary (Teacher/Admin)

### Grades
- `POST /api/grades` - Create grade (Teacher/Admin)
- `GET /api/grades/student` - Get student grades
- `GET /api/grades/class/:classId` - Get class grades (Teacher/Admin)
- `PUT /api/grades/:id` - Update grade (Teacher/Admin)
- `DELETE /api/grades/:id` - Delete grade (Teacher/Admin)
- `GET /api/grades/summary/student` - Get student grade summary

### Resources
- `POST /api/resources` - Create resource (Teacher/Admin)
- `GET /api/resources` - Get all resources
- `GET /api/resources/:id` - Get resource by ID
- `PUT /api/resources/:id` - Update resource (Teacher/Admin)
- `DELETE /api/resources/:id` - Delete resource (Teacher/Admin)

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages` - Get user messages
- `GET /api/messages/:id` - Get message by ID
- `POST /api/messages/drafts` - Save draft
- `PUT /api/messages/drafts/:id` - Update draft
- `POST /api/messages/drafts/:id/send` - Send draft
- `DELETE /api/messages/:id` - Delete message

## Installation

1. Clone the repository
2. Navigate to the backend directory: `cd backend`
3. Install dependencies: `npm install`
4. Create a `.env` file based on `.env.example`
5. Start MongoDB server
6. Run the server: `npm start` or `npm run dev` (for development)

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRE` - JWT expiration time

## Role-based Access

- **Student**: Can view classes, submit assignments, view grades, access resources, send messages
- **Teacher**: Can create/manage classes, create assignments, mark attendance, grade submissions, manage resources
- **Admin**: Full access to all features
- **HOD**: Department-specific administrative functions
- **Managing Authority**: Institution-level management functions

## License

MIT