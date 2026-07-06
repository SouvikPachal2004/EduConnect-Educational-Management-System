# 🎓 EduConnect — Educational Management System

> A comprehensive, full-stack college management platform built for modern institutions. EduConnect connects **students**, **teachers**, **HODs**, **principals**, and **admins** in one unified digital ecosystem.

![EduConnect](https://img.shields.io/badge/EduConnect-v2.0-667eea?style=for-the-badge&logo=graduation-cap)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express)

---

## 📋 Table of Contents

- [Features Overview](#-features-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Dashboard Workflows](#-dashboard-workflows)
  - [🎓 Student Dashboard](#-student-dashboard)
  - [👨‍🏫 Teacher Dashboard](#-teacher-dashboard)
  - [🏛️ HOD Dashboard](#-hod-dashboard)
  - [👨‍💼 Principal Dashboard](#-principal-dashboard)
  - [🔧 Admin Dashboard](#-admin-dashboard)
- [Meeting Room System](#-meeting-room-system)
- [Database Collections](#-database-collections)
- [API Endpoints](#-api-endpoints)
- [Deployment Guide](#-deployment-guide)

---

## ✨ Features Overview

| Feature | Description |
|---|---|
| 🔐 **Role-Based Auth** | JWT authentication for 5 roles: Student, Teacher, HOD, Principal, Admin |
| 🎥 **Virtual Meetings** | EduConnect Meet — real-time meeting rooms with join approval |
| 📚 **Resource Sharing** | Upload & view PDF, Word, Excel, PPT files inline in the browser |
| 📊 **CGPA Tracking** | Semester-wise CGPA entry with animated prediction graph |
| 📝 **Assignments** | Create, submit, grade assignments with file attachments |
| 📢 **Announcements** | Principal broadcasts announcements to all dashboards |
| 🔔 **Live Notifications** | Real-time notification system with Mark All Read / Clear All |
| 📅 **Class Scheduling** | Virtual & physical class scheduling with student notifications |
| 👥 **Attendance** | Face-recognition ready attendance system |
| 📈 **Performance Analytics** | Student performance overview with year-wise CGPA and prediction |

---

## 🛠️ Tech Stack

### Backend
- ⚡ **Node.js** + **Express.js** — REST API server
- 🍃 **MongoDB** + **Mongoose** — Database & ODM
- 🔑 **JWT** — Authentication & authorization
- 🔒 **bcryptjs** — Password hashing
- 📁 **Multer** — File uploads (PDF, Word, PPT, Excel)

### Frontend
- 🌐 **Vanilla HTML/CSS/JavaScript** — No framework, pure web
- 📊 **Chart.js** — Animated CGPA trend charts
- 📄 **PDF.js** — In-browser PDF rendering
- 📝 **Mammoth.js** — Word document rendering
- 📊 **SheetJS (xlsx)** — Excel file rendering
- 🎨 **Font Awesome** — Icons throughout the UI

---

## 📁 Project Structure

```
EduConnect/
├── backend/
│   ├── controllers/          # Business logic
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API route definitions
│   ├── middleware/           # Auth, error handling
│   ├── utils/                # Helpers (auth, response, dept catalog)
│   ├── uploads/              # Uploaded files (PDF, Word, etc.)
│   └── server.js             # Entry point
├── frontend/
│   ├── js/                   # Dashboard JavaScript files
│   ├── css/                  # Stylesheets
│   ├── images/               # Static assets
│   ├── student-dashboard.html
│   ├── teacher-dashboard.html
│   ├── HOD-dashboard.html
│   ├── managing-authority.html
│   ├── admin-dashboard.html
│   ├── meeting-room.html
│   └── login.html
└── face/                     # Face recognition attendance module (Python)
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Python 3.x (for face recognition, optional)

### 1. Clone the repository
```bash
git clone https://github.com/SouvikPachal2004/EduConnect-Educational-Management-System.git
cd EduConnect-Educational-Management-System
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 4. Start the server
```bash
node server.js
```

### 5. Open the app
```
http://localhost:5002
```

---

## 🔧 Environment Variables

Create a `.env` file in the `/backend` folder:

```env
MONGO_URI=mongodb://localhost:27017/educonnect
JWT_SECRET=your_secret_key_here
PORT=5002
NODE_ENV=development
```

For **MongoDB Atlas** (production):
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/educonnect
```

---

## 🖥️ Dashboard Workflows

---

### 🎓 Student Dashboard

**Login:** `student-dashboard.html`

The Student Dashboard is the central hub for every enrolled student.

#### 📊 Overview Section
- **4 stat cards** — Enrolled Courses, Attendance Rate, Pending Assignments, Average Grade
- **📅 Upcoming Classes** — Shows today's and future scheduled classes with live status:
  - 🔒 **Waiting for teacher** — Class scheduled but teacher hasn't started yet
  - 🟢 **Join** button — Appears automatically within 15 seconds when teacher starts the meeting
  - ✅ **Class Completed** — Shows after teacher ends the meeting
- **📢 College Announcements** — Latest announcements from the Principal
- **🏆 Recent Activity** — Recent actions and updates

#### 🎓 My Classes
- View all enrolled classes with mode (Virtual/Physical), schedule, and teacher info
- Click **View Details** to see class schedule, meeting link, and credits
- Classes show scheduled date/time set by teacher via Update Mode

#### 📖 My Courses
- View all enrolled courses with teacher name, credits, and enrollment date
- Status badges show Active/Completed enrollment status

#### 📝 Assignments
- **Pending tab** — Assignments due with deadline counter
- **Completed tab** — Submitted assignments with grades and feedback
- Click **Submit** to upload assignment files

#### 📊 Grades
- **CGPA entry boxes** — Enter semester CGPA (0-10) for each semester
- **Overall GPA card** — Auto-computed from semester entries
- **📈 Performance Prediction Graph** — Animated Chart.js line graph showing:
  - Actual semester CGPA trend (blue line)
  - Predicted next semester CGPA (purple dashed line)
  - Linear regression-based prediction with confidence level
- Grade records table from teacher evaluations

#### 📚 Resources
- View all uploaded resources (PDF, Word, PPT, Excel, Video)
- **View button** opens files inline in browser:
  - 📄 **PDF** — Rendered with PDF.js (page navigation, zoom)
  - 📝 **Word (.docx)** — Rendered with Mammoth.js as HTML
  - 📊 **Excel (.xlsx)** — Rendered as interactive table with SheetJS
  - 📽️ **PPT (.pptx)** — Rendered with PPTXjs
  - 🖼️ **Images** — Inline image viewer
  - 🎥 **Videos** — HTML5 video player
- **Download button** for local viewing

#### 📅 Attendance
- Overall attendance percentage
- Per-class attendance breakdown with status (Excellent/Good/Needs Improvement)

#### 📢 Announcements
- All college announcements from Principal with priority badges (High/Medium/Low)

#### 📆 Calendar
- Monthly view with class events, assignments, and exam markers

#### ✉️ Messages
- **Inbox/Sent tabs** — Full messaging system
- Reply threads for conversations
- Mark as read functionality

---

### 👨‍🏫 Teacher Dashboard

**Login:** `teacher-dashboard.html`

The Teacher Dashboard gives faculty full control over their classes, students, and resources.

#### 🏠 Overview
- **4 stat cards** — Classes Teaching, Total Students, Pending Assignments, Class Attendance
- **📋 My Assigned Subjects** — Live list of all HOD-assigned subjects with:
  - Mode badges (Virtual/Physical)
  - Schedule date and time
  - Student count and credits
  - **⚙️ Update Mode button** — Set class as Virtual with date/time OR Physical with room
  - **▶️ Start Class button** — Creates meeting room and sends join link to all students

#### 📚 Class Scheduling Workflow
```
1. HOD assigns subject to teacher
2. Teacher clicks "Update Mode" → selects Virtual → sets Date & Time
3. Students are notified of schedule → see "Waiting for teacher"
4. On class day (15 min before), teacher clicks "Start Class"
5. Meeting room created → join link sent to all enrolled students
6. Join button activates on student dashboard within 15 seconds
7. Teacher clicks "End" → meeting ends → students see "Class Completed"
```

#### 👨‍🎓 Students Section
- **4 dynamic stat boxes** — Total Students, Avg CGPA, At-Risk (CGPA < 7.5), Safe (CGPA > 8.0)
- Student table with Roll No., Name, Department, Year-wise CGPA, Status
- **View button** — Opens student detail card with:
  - Purple gradient card with student profile
  - GPA and Status boxes
  - Year-wise CGPA chart with prediction (Chart.js)
  - Enrolled courses list
- **Message button** — Opens compose modal pre-filled with student as recipient

#### 📚 Resources
- Upload PDF, Word, PPT, Excel, images, videos (up to 50MB)
- Files shared with all enrolled students automatically

#### 📝 Assignments
- Create assignments with title, description, deadline, max marks
- Attach files for students to download
- Grade student submissions

#### 📊 Grades
- View and manage student grades
- Add grade records per student per assignment

#### 📅 Attendance
- Launch face-recognition attendance system
- View department-wise attendance summary

#### 🔮 Predictions
- View at-risk student predictions based on CGPA and attendance

---

### 🏛️ HOD Dashboard

**Login:** `HOD-dashboard.html`

The HOD Dashboard gives department heads full control over faculty, students, courses, and meetings.

#### 🏠 Overview
- **4 stat cards** — Faculty Members, Active Courses, Department Students, Avg Department CGPA
- **📋 My Assigned Subjects** — Same as teacher but for HOD-taught classes
- **Update Mode & Start Class** — Same class scheduling workflow as teachers
- **📈 Recent Activity** — Department activity feed

#### 👩‍🏫 Faculty Management
- View all department teachers with status
- Assign subjects to teachers
- View teacher performance

#### 📖 Course Management
- View and manage all department courses
- Track enrollment numbers per course

#### 📚 Subjects
- Create and assign subjects to teachers
- Set credits, semester, and course linkage

#### 📝 Assignments (HOD Section)
- Create department-wide assignments
- View all student submissions
- Grade and provide feedback

#### 👨‍🎓 Student Performance
- **4 stat cards** — Total Students, Avg CGPA, At-Risk, Safe Students
- Student table with year-wise CGPA per student
- **View button** — Opens same beautiful student detail modal as teacher:
  - Purple/violet gradient card
  - Year-wise CGPA (Year 1 = avg Sem1+Sem2, etc.)
  - Prediction line (linear regression)
  - Enrolled courses

#### 🎥 Meeting Room
- Host department meetings for all teachers
- View meeting invitations from Principal

#### 📚 Resources
- Upload department resources shared with all department students
- Download and delete resource management

#### 📢 Announcements Section
- View all college announcements from Principal
- Filter by priority

#### 📊 Reports
- Department performance overview
- Generate and export reports

#### 🗓️ Events
- Request events from Principal
- View upcoming department events

#### ✉️ Messages
- Full inbox/sent messaging
- Reply threads
- Message teachers and students

---

### 👨‍💼 Principal Dashboard

**Login:** `managing-authority.html`

The Principal Dashboard gives the Managing Authority (Principal) complete oversight of the entire institution.

#### 🏠 Dashboard Overview
- **4 dynamic stat cards** — Total Students, Teachers, Departments, Avg CGPA
- **College Performance Overview** — Department-wise performance table
- **Recent Activity** — Latest system-wide actions

#### 🏢 Department Management
- View all departments with HOD, faculty count, student count, status
- **Add Department** — Create new department with:
  - Department name
  - Course/Program selection (fetches live from admin's programs)
  - HOD account creation (name, email, password)
  - HOD auto-created as a system user with login credentials
  - Established year
- **Edit Department** — Update department details
- Department auto-appears in all relevant dropdowns across the system

#### 👩‍🏫 Faculty Section
- **4 dynamic stat boxes** — Total Faculty, HODs, Teachers, Departments Covered
- Faculty table with Name, Department, Position, Email, Status
- **View button** — Opens beautiful faculty detail card with:
  - Purple gradient header
  - Department, status, email, student count info
  - **Send Message** button
- **Message button** — Direct message to any faculty member
- **Add Faculty** — Add teachers with department, course, position (HOD/Teacher), email, password

#### 👨‍🎓 Students Section
- **4 stat boxes** — Total Students, Avg CGPA, At-Risk (< 6.0), Departments
- Students grouped by **department with colored collapsible boxes**
- Click department header to expand/collapse student list
- Each student row shows: Roll No., Name, 1st-4th Year CGPA, Avg CGPA, Status
- Year CGPA pulled from student's own semester entries
- **Export Report** button — Downloads CSV of all student data

#### 🎓 Academics
- View academic structure and programs

#### ✅ Approvals
- View and manage HOD event approval requests
- **Approve/Decline** buttons on each request
- Approved events appear in HOD notifications automatically

#### 📊 Reports
- System-wide reports generation

#### 📢 Announcements
- **Create announcements** visible to ALL dashboards (students, teachers, HODs)
- Set priority (High/Medium/Low)
- Edit and delete announcements

#### 🎥 Meeting Room
- Host meetings with all HODs simultaneously
- Send meeting invitations to all HODs

#### ✉️ Messages
- Message any user in the system

---

### 🔧 Admin Dashboard

**Login:** `admin-dashboard.html`

The Admin Dashboard is the system administrator's control panel for managing the entire EduConnect platform.

#### 🏠 Dashboard
- System-wide statistics overview
- Recent activity logs
- Quick access to all management sections

#### 🎓 Programs
- View all academic programs (B.Tech, BCA, etc.)
- **Add Program** — Create with name, code, duration, total semesters
- **Edit/Deactivate** programs
- Programs appear automatically in:
  - Principal's Add Department dropdown
  - Admin's Add User program dropdown
  - Student's course selection

#### 🏢 Departments
- View all departments with program linkage, HOD, faculty and student counts
- **Add Department** — Link department to a program, assign HOD
- **Edit Department** — Update details including program reassignment

#### 👥 User Management
- Complete user table with Name, User ID, Role, Department, Email, Status
- **Filter by role and department**
- **Add User** with:
  - Full Name
  - **Auto Roll No.** — Automatically fetches next available roll number per program
    - B.Tech: sequential from last B.Tech student (e.g., 78)
    - BCA: starts from 1 for first BCA student
  - Role (Student/Faculty/HOD/Administrator)
  - Program (live dropdown from Programs section)
  - Department (live dropdown — updates when new depts added)
  - Email & Password
- **Delete User** with confirmation

#### 📚 Subjects
- Create and manage subject catalog
- Link subjects to departments, programs, and semesters

#### 📋 Activity Logs
- Full system audit trail
- Filter by date range
- Tracks all user actions with IP address

#### 📊 Reports
- System performance reports
- Export functionality

---

## 🎥 Meeting Room System

The EduConnect Meet is a built-in virtual classroom system.

### 📋 Complete Meeting Flow

```
Teacher/HOD                    Students
─────────────────────────────────────────────────────
1. Click "Update Mode"         Receive notification:
   → Select Virtual            "Your class is scheduled
   → Set Date & Time            for [date] at [time]"
   → Save & Notify

2. On class day (at -15 min)   Student dashboard shows:
   click "Start Class"         🔒 "Waiting for teacher"

3. Meeting room created         ↓ (within 15 seconds)
   → Link sent to students     🟢 "Join" button appears!

4. Students click Join         → Sent to lobby for
                                 microphone/camera preview

5. Students click "Join Now"   → "Waiting for Teacher
                                  Approval" screen

6. Teacher sees pending        → Accept/Decline buttons
   request in Participants       appear in meeting room

7. Teacher clicks Accept       → Student automatically
                                  joins the meeting

8. Teacher clicks "End"        → All students get
                                  "Class Completed" screen
                               → Join button disappears
                               → Dashboard shows ✅ Completed
```

### 🔑 Meeting Room Features
- 🎤 Mic toggle (on/off)
- 📷 Camera toggle (on/off)
- 🖥️ Screen sharing
- ✋ Raise hand
- 💬 In-meeting chat (persistent, fetched from backend)
- 👥 Participants panel with pending approval badges
- 🔗 Copy meeting link
- ⏰ Live clock
- 🔴 End button (host only — teachers and HODs)

---

## 🗄️ Database Collections

| Collection | Description |
|---|---|
| `users` | All users (students, teachers, HODs, principal, admin) |
| `classes` | Class records with schedule, meeting links, mode |
| `subjects` | Subject catalog linked to departments |
| `assignments` | Teacher/HOD created assignments |
| `submissions` | Student assignment submissions |
| `resources` | Uploaded files (PDF, Word, PPT, etc.) |
| `messages` | Inbox/sent messages between users |
| `meetings` | Meeting rooms, participants, chat, approval |
| `attendances` | Student attendance records |
| `grades` | Teacher-graded assessment records |
| `announcements` | Principal announcements |
| `approvalrequests` | HOD → Principal event approvals |
| `departments` | Department info with program linkage |
| `enrollmentrequests` | Student course enrollment requests |
| `programs` | Academic programs (B.Tech, BCA, etc.) |
| `activitylogs` | System-wide audit trail |

---

## 📡 API Endpoints

### 🔐 Authentication
```
POST   /api/auth/register      Register new user
POST   /api/auth/login         Login
GET    /api/auth/me            Get current user
PUT    /api/auth/me/cgpas      Update semester CGPAs
```

### 👥 Users
```
GET    /api/users              Get all users (admin)
GET    /api/users/next-roll/:programId  Get next roll number
DELETE /api/users/:id          Delete user
```

### 📚 Classes
```
GET    /api/classes            Get enrolled classes
POST   /api/classes            Create class
PUT    /api/classes/:id/mode   Update class mode (virtual/physical)
PUT    /api/classes/:id/meeting-link  Save meeting link
```

### 🎥 Meetings
```
POST   /api/meetings           Create meeting room + notify students
GET    /api/meetings/:roomCode  Get meeting details
POST   /api/meetings/:roomCode/join     Join meeting (approval request)
POST   /api/meetings/:roomCode/approve  Approve join request
POST   /api/meetings/:roomCode/reject   Decline join request
POST   /api/meetings/:roomCode/end      End meeting for everyone
PUT    /api/meetings/:roomCode/presence Update participant status
GET    /api/meetings/:roomCode/participants  Get participants list
```

### 📁 Resources
```
GET    /api/resources          Get all resources
POST   /api/resources          Upload resource file
GET    /api/resources/:id/view  View file inline
GET    /api/resources/:id/download  Download file
```

### 📝 Assignments
```
GET    /api/assignments        Get assignments
POST   /api/assignments        Create assignment
POST   /api/assignments/:id/submit  Submit assignment
PUT    /api/assignments/:id/grade   Grade submission
```

---

## 🌐 Deployment Guide

### Deploy to Render.com (Free)

1. **MongoDB Atlas** — Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
   - Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/educonnect`

2. **Render.com** — Create Web Service
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment Variables:
     ```
     MONGO_URI = your Atlas connection string
     JWT_SECRET = your_secret_key
     PORT = 10000
     NODE_ENV = production
     ```

3. **Access your app** at `https://your-app.onrender.com`

> ⚠️ Free tier sleeps after 15 minutes of inactivity (30 sec wake time). For production use, upgrade to Starter plan.

---

## 👥 User Roles & Default Credentials

| Role | Dashboard | Default Email | Notes |
|---|---|---|---|
| 🔧 Admin | `/admin-dashboard.html` | `admin@educonnect.com` | Full system access |
| 👨‍💼 Principal | `/managing-authority.html` | Set during registration | Institution oversight |
| 🏛️ HOD | `/HOD-dashboard.html` | Set during faculty add | Department head |
| 👨‍🏫 Teacher | `/teacher-dashboard.html` | Set during faculty add | Class management |
| 🎓 Student | `/student-dashboard.html` | Set during enrollment | Learning portal |

---

## 🔒 Security Features

- 🔑 **JWT Authentication** — Secure token-based auth with expiry
- 🔒 **bcrypt Password Hashing** — Salted hash for all passwords
- 🛡️ **Role-Based Authorization** — Each endpoint validates user role
- 📝 **Activity Logging** — All actions logged with IP address
- 🌐 **CORS Configuration** — Properly configured for cross-origin requests

---

## 📱 Responsive Design

All dashboards are responsive and work on:
- 🖥️ Desktop (1920px+)
- 💻 Laptop (1024px+)
- 📱 Tablet (768px+)
- 📲 Mobile (375px+) — Sidebar collapses to hamburger menu

---

## 🏗️ Built With Love By

**Souvik Pachal** — Final Year Project (FYP)

> *EduConnect is designed to digitize and streamline the entire academic management workflow of an institution — from student enrollment to final grade submission.*

---

## 📄 License

This project is built as a Final Year Project (FYP) for academic purposes.

---

⭐ **Star this repo** if you found it useful!
