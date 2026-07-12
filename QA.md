# 🎓 EduConnect — Complete Q&A Guide for Final Year Project Submission

> **Project:** EduConnect — Educational Management System
> **Developer:** Souvik Pachal
> **Purpose:** Final Year Project (FYP) — Complete viva/presentation Q&A reference

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Working Flow — All Dashboards](#2-working-flow--all-dashboards)
   - [Student Dashboard Flow](#-student-dashboard-flow)
   - [Teacher Dashboard Flow](#-teacher-dashboard-flow)
   - [HOD Dashboard Flow](#-hod-dashboard-flow)
   - [Principal Dashboard Flow](#-principal-dashboard-flow)
   - [Admin Dashboard Flow](#-admin-dashboard-flow)
   - [Meeting Room Flow](#-meeting-room-flow)
3. [Q&A — Frontend](#3-qa--frontend)
4. [Q&A — Backend](#4-qa--backend)
5. [Q&A — Student Dashboard](#5-qa--student-dashboard)
6. [Q&A — Teacher Dashboard](#6-qa--teacher-dashboard)
7. [Q&A — HOD Dashboard](#7-qa--hod-dashboard)
8. [Q&A — Meeting Room & Jitsi](#8-qa--meeting-room--jitsi)
9. [Q&A — Grade Prediction & ML](#9-qa--grade-prediction--ml)
10. [Q&A — Security & Authentication](#10-qa--security--authentication)

---

---

## 1. PROJECT OVERVIEW

**EduConnect** is a full-stack web application built to digitize and manage the entire academic workflow of a college. It connects five types of users — Students, Teachers, HODs (Head of Departments), Principal (Managing Authority), and Admin — in one unified platform.

### What problems does it solve?
- No more paper-based assignments and attendance
- Students can join virtual classes without any third-party app
- Teachers can schedule, manage, and track everything from one screen
- HODs can monitor all department students and faculty
- Principal can see the entire college at a glance
- Admin controls the entire system structure

### Tech Stack Summary
| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (cloud) |
| Authentication | JWT (JSON Web Tokens) |
| Video Meetings | Jitsi Meet (WebRTC) |
| Charts | Chart.js |
| File Viewer | PDF.js, Mammoth.js, SheetJS |
| Deployment | Netlify (frontend) + Render (backend) |

---

---

## 2. WORKING FLOW — ALL DASHBOARDS

---

### 🎓 Student Dashboard Flow

The student dashboard is the learning hub for every enrolled student. Here is the complete step-by-step flow:

**Step 1 — Login**
- Student goes to the login page, enters email, password, and selects role "Student"
- Backend checks the email and password, matches the role from MongoDB
- If valid, a JWT token is generated and stored in localStorage
- Student is redirected to `student-dashboard.html`

**Step 2 — Dashboard Overview (Stats)**
- On page load, frontend sends API calls to backend with the JWT token
- 4 stat boxes are loaded: Enrolled Courses, Attendance Rate, Pending Assignments, Average Grade
- Pending assignments count is calculated by checking if a submission exists for each assignment

**Step 3 — Upcoming Classes**
- Frontend polls the backend every 5 seconds for class data
- If teacher has started a meeting (meetingLink exists in database), a "Join" button appears automatically — no page refresh needed
- If class is scheduled but teacher hasn't started, it shows "Waiting for teacher" (gray, disabled)
- If meeting has ended, it shows "Class Completed" (green, disabled)

**Step 4 — Assignments**
- "Pending" tab: Shows assignments that have no submission in database
- "Completed" tab: Shows assignments where a submission record exists
- Student clicks "Submit" → file upload modal opens → file sent to backend → submission saved
- Pending count updates automatically after submission

**Step 5 — Grades**
- Student enters semester CGPA values (0–10 scale) in input boxes
- Backend calculates overall GPA as average of all filled semesters
- Chart.js draws an animated line graph showing CGPA trend
- A predicted next semester CGPA is shown (dashed purple line) using linear regression

**Step 6 — Resources**
- Teacher-uploaded files appear here
- PDFs open with PDF.js (full page viewer), Word files with Mammoth.js, Excel with SheetJS
- Student can also download any file

**Step 7 — Messages**
- Student sees inbox messages from teachers, HODs, and the system
- Can reply to messages
- Meeting notifications also arrive here when teacher starts a class

**Step 8 — Attendance**
- Shows overall attendance percentage
- Per-class breakdown with status (Excellent / Good / Needs Improvement)

---

---

### 👨‍🏫 Teacher Dashboard Flow

The teacher dashboard gives faculty full control over classes, students, assignments, and resources.

**Step 1 — Login**
- Teacher logs in with role "Teacher"
- JWT token is stored with the teacher's ID and role

**Step 2 — Overview**
- 4 stat cards: Classes Teaching, Total Students, Pending Assignments, Class Attendance
- "My Assigned Subjects" list shows all subjects HOD has assigned to this teacher

**Step 3 — Schedule a Class**
- Teacher clicks "Update Mode" on a subject card
- A modal opens to select Virtual (with Date & Time) or Physical (with Room number)
- On saving, the class record in MongoDB is updated with mode, date, and time
- Students enrolled in that class receive a notification: "Your class is scheduled for [date] at [time]"
- Student dashboard immediately shows "Waiting for teacher" status

**Step 4 — Start a Meeting**
- Teacher clicks "Start Class" button
- Backend creates a Meeting record in MongoDB with a unique room code (e.g., abc-defg-hij)
- A meeting link is saved to the Class record so student dashboard can detect it
- All students get a message notification with the meeting link
- Within 5 seconds, the "Join" button appears on every enrolled student's dashboard

**Step 5 — Inside the Meeting**
- Teacher's Jitsi iframe loads automatically (no extra click needed)
- Students who click "Join" go to a lobby, then submit a join request
- Teacher sees a red badge on the Participants panel showing how many students are waiting
- Teacher clicks "Accept" → student automatically joins (no rejoin needed)

**Step 6 — End Meeting**
- Teacher clicks "End" button → confirms in modal
- Backend sets meeting status to "ended"
- Meeting link is cleared from database (3 layers of clearing)
- All students' dashboards show "Class Completed" within 5–10 seconds

**Step 7 — Assignments & Grading**
- Teacher creates assignments with title, description, deadline, max marks, and optional file
- Students submit files, teacher sees all submissions
- Teacher gives marks → grade saved to Submission record → student's "Completed" tab updates

**Step 8 — Student Analytics**
- Teacher views student performance cards with year-wise CGPA
- At-risk students (CGPA < 7.5) are highlighted in red
- Safe students (CGPA > 8.0) are highlighted in green
- Prediction model shows expected performance

---

---

### 🏛️ HOD Dashboard Flow

The HOD (Head of Department) has all the teacher's powers plus department-level management.

**Step 1 — Login**
- HOD logs in with role "HOD"
- HOD has both teacher-level access and department-level access

**Step 2 — Department Overview**
- 4 stat cards: Faculty Members, Active Courses, Department Students, Avg Department CGPA
- "My Assigned Subjects" — HOD can also teach classes directly (same flow as teacher)
- Department activity feed shows recent actions

**Step 3 — Faculty Management**
- HOD views all teachers in the department
- Can assign subjects to specific teachers
- Can view teacher performance and workload

**Step 4 — Student Performance Monitoring**
- HOD sees all department students with year-wise CGPA
- Color-coded: red = at-risk (CGPA < 7.5), green = safe (CGPA > 8.0)
- Clicking "View" opens a beautiful purple gradient student detail card with:
  - Year 1 CGPA (average of Sem 1 + Sem 2)
  - Year 2 CGPA (average of Sem 3 + Sem 4)
  - Year 3 CGPA (average of Sem 5 + Sem 6)
  - Year 4 CGPA (average of Sem 7 + Sem 8)
  - Animated prediction line (next year's expected CGPA)

**Step 5 — Hosting Department Meetings**
- HOD can start meetings and invite all department teachers
- HOD can also approve student join requests (same as teacher)
- HOD can end meetings for the entire department

**Step 6 — Assignments**
- HOD creates department-wide assignments visible to all enrolled students
- Can view and grade all student submissions

**Step 7 — Announcements from Principal**
- HOD receives and can view all Principal announcements
- Filter by priority (High / Medium / Low)

**Step 8 — Event Requests**
- HOD submits event requests to Principal
- Principal approves/declines
- HOD gets a notification about the decision

---

---

### 👨‍💼 Principal Dashboard Flow

The Principal (Managing Authority) has full oversight of the entire institution.

**Step 1 — Login**
- Principal logs in with role "managing_authority"
- Has the highest access level (except system config which is admin-only)

**Step 2 — Institutional Overview**
- 4 stat cards: Total Students, Total Teachers, Total Departments, Average CGPA
- College Performance Overview: table showing each department's average CGPA
- Recent Activity feed: latest actions happening across the college

**Step 3 — Department Management**
- View all departments with HOD name, faculty count, student count, status
- Add new department: enters name, selects program (B.Tech / BCA etc.), creates HOD account
- HOD account is auto-created with login credentials instantly
- Edit department: can change HOD, update details

**Step 4 — Faculty Management**
- View all faculty (teachers + HODs) college-wide with department info
- Add new teacher: name, department, email, password — account created instantly
- Direct message any teacher from this panel

**Step 5 — Student Monitoring**
- Students grouped by department in colored collapsible boxes
- Each student row: Roll No., Name, Year 1–4 CGPA, Average CGPA, Status
- Export Report button downloads a CSV file of all student data

**Step 6 — Announcements**
- Principal creates announcements that appear on ALL dashboards (students, teachers, HODs)
- Sets priority: High (red) / Medium (orange) / Low (green)
- Can edit and delete announcements anytime

**Step 7 — Meeting Room**
- Principal hosts meetings with all HODs simultaneously
- Meeting notification sent to every HOD in the system

**Step 8 — Event Approvals**
- HODs submit event requests
- Principal sees all pending requests with Approve/Decline buttons
- On approval, HOD gets a notification automatically

---

---

### 🔧 Admin Dashboard Flow

The Admin is the technical system manager — they set up the structure that everyone else uses.

**Step 1 — Login**
- Admin logs in with role "admin"
- Has complete system access including all collections

**Step 2 — Programs Management**
- Admin creates academic programs (e.g., B.Tech, BCA, MCA)
- Sets program name, code, duration (years), total semesters
- Programs appear in all dropdowns across the system (e.g., Add Department, Add Student)

**Step 3 — Department Management**
- Admin can create and manage all departments
- Links each department to a program
- Assigns HOD to each department

**Step 4 — User Management**
- Complete user table with filters by role and department
- Add User form: enters name, selects role, program, department, email, password
- Auto Roll Number: system automatically picks the next available roll number per program
  - Example: If last B.Tech student is Roll 43, next one gets Roll 44
- Delete user with confirmation dialog

**Step 5 — Subjects Catalog**
- Admin creates the master subject list
- Links subjects to departments, programs, and semesters
- These subjects are then assigned to teachers by HODs

**Step 6 — Activity Logs**
- Full system audit trail: every login, assignment creation, grade update, meeting start — all logged
- Filter by date range to track specific days
- Each log shows: User Name, Action, Description, IP Address, Status (success/failed)

**Step 7 — Reports**
- System-wide performance reports
- Export functionality for data analysis

---

---

### 🎥 Meeting Room Flow

The meeting room is EduConnect's built-in virtual classroom — designed to work exactly like Google Meet.

**Why Jitsi was chosen — explained simply:**
Jitsi Meet is a free, open-source video conferencing platform. Instead of building video/audio from scratch (which requires complex WebRTC servers, STUN/TURN infrastructure, and months of development), we embed Jitsi's public server inside our own meeting room page. This gives us:
- Free HD video/audio with zero cost
- Global infrastructure that works from any country
- WebRTC peer-to-peer connections (no server bottleneck)
- Built-in screen share, raise hand, mic/camera controls
- We only had to build the custom approval system and UI around it

**Step 1 — Teacher Creates Meeting**
- Teacher clicks "Start Class" on the subject card
- Backend generates a unique room code like `abc-defg-hij`
- A full meeting link is built: `https://educonnect-2025.netlify.app/meeting-room.html?room=abc-defg-hij`
- This link is saved to the Class record in MongoDB
- All enrolled students get a message notification

**Step 2 — Student Dashboard Detects Meeting**
- Student dashboard polls the backend every 5 seconds
- When meetingLink is found in the class record, "Join" button appears automatically
- No page refresh needed — it's completely automatic

**Step 3 — Student Goes to Lobby**
- Student clicks "Join" → redirected to `meeting-room.html?room=abc-defg-hij`
- A lobby screen shows: camera preview, mic/camera toggle, "Join Now" button
- Student sees themselves before entering

**Step 4 — Student Sends Join Request**
- Student clicks "Join Now" → backend API call adds student to `pendingApprovals[]`
- Student sees "Waiting for Teacher Approval" screen
- Frontend polls every 3 seconds to check if approval status changed

**Step 5 — Teacher Approves**
- Teacher's meeting room shows a red badge on Participants icon (count of pending students)
- Teacher opens Participants panel → sees student name with "Accept" / "Decline" buttons
- Teacher clicks "Accept" → backend sets student status to "accepted"

**Step 6 — Auto-Connect (The Key Fix)**
- After approving, teacher's Jitsi iframe automatically reloads after 1.5 seconds
- This is the key fix for the "need to rejoin" problem — Jitsi uses WebRTC peer-to-peer connections. If host and student join at different times, they don't discover each other. By reloading the host's iframe at the same time as the student enters, both join the Jitsi room at the same moment, Jitsi detects both peers, and the video connection is established automatically.
- Student enters the meeting room 2 seconds after approval
- Total time from approval to video: ~4 seconds

**Step 7 — Inside the Meeting**
- Jitsi handles video/audio/screen share — all built in
- Chat is stored in MongoDB, polled every 3 seconds
- Participants list is polled every 5 seconds
- Any teacher/HOD in the meeting can approve new join requests

**Step 8 — End Meeting**
- Teacher clicks "End" → confirmation dialog
- Backend marks meeting as ended, sets `isActive = false`
- 3-Layer clearing system removes meeting link from all class records:
  - Layer 1: Clear by classId
  - Layer 2: Clear by matching meetingLink URL
  - Layer 3: Clear by room code pattern (regex)
- All students' dashboards show "Class Completed" within 5–10 seconds
- Old meeting link becomes invalid — cannot be used again

---

---

## 3. Q&A — FRONTEND

**Q1. What frontend technology did you use and why not React or Angular?**
We used pure Vanilla HTML, CSS, and JavaScript. We chose this because the project focuses on backend architecture, database design, and system integration. No framework means no build process, faster load times, and easier deployment on Netlify. It also shows understanding of core web fundamentals.

**Q2. How does the frontend communicate with the backend?**
Through HTTP REST API calls using the JavaScript `fetch()` function. Every request includes an `Authorization: Bearer <token>` header with the JWT token stored in `localStorage`.

**Q3. What is localStorage and how is it used in EduConnect?**
`localStorage` is a browser storage that keeps data even after the page is closed. We store the JWT auth token and current user info (name, role, department) in localStorage. This allows every page to know who is logged in without asking the server again.

**Q4. How do charts work in the student grade section?**
We use Chart.js library. When student enters semester CGPA values, JavaScript reads those numbers, creates a line chart showing CGPA over each semester (actual = blue line), and also draws a predicted line (purple dashed) using a simple linear regression formula applied in the frontend.

**Q5. How are PDF files viewed inside the browser without downloading?**
We use PDF.js, which is Mozilla's open-source PDF rendering library. When a student clicks "View" on a PDF resource, the file is fetched from the backend and rendered page-by-page inside a canvas element in the browser.

**Q6. How are Word documents (.docx) displayed in the browser?**
Using the Mammoth.js library. It converts `.docx` files to clean HTML which is then displayed inside a div on the page. Formatting like headings, bold text, and lists are preserved.

**Q7. How does the "Join" button appear automatically without refreshing the page?**
The student dashboard runs a polling function every 5 seconds using `setInterval()`. It calls `GET /api/classes` and checks if any class has a `meetingLink`. When a link is found, the button HTML is updated to show "Join" with the correct link.

**Q8. What is polling and why did you use it instead of WebSockets?**
Polling means the frontend repeatedly asks the backend "is there anything new?" at regular time intervals. We used polling because it's simpler to implement and sufficient for our use case (5-second delay is acceptable for a classroom). WebSockets would require additional setup and a dedicated socket server.

**Q9. How does the notification badge update in real time?**
A `notifications.js` file runs a polling interval every 30 seconds fetching unread notification count from the backend. The badge number on the bell icon is updated in the DOM every time new notifications are found.

**Q10. How do you prevent a student from accessing the teacher dashboard?**
On every dashboard page load, the frontend reads the role from localStorage. If the role doesn't match (e.g., a student tries to open teacher-dashboard.html), they are immediately redirected to the login page. The backend also validates the JWT role on every API call.

**Q11. What is Font Awesome and how is it used?**
Font Awesome is a CDN-based icon library. We use it throughout the UI for icons like 📚 for courses, 🔔 for notifications, 🎥 for meetings, etc. It's loaded via a `<link>` tag in every HTML page — no installation needed.

**Q12. How does the file upload work for assignment submission?**
A hidden `<input type="file">` is triggered when the student clicks "Submit". The file is read using JavaScript's `FormData` object and sent to the backend via a `fetch()` POST request with `Content-Type: multipart/form-data`. Multer on the backend handles saving the file to the `/uploads` folder.

**Q13. How is the CGPA prediction graph drawn?**
We use simple linear regression in JavaScript. The actual semester CGPAs are the data points. We calculate the slope and intercept of the best-fit line, then predict the next semester value. Chart.js draws the actual line in blue (solid) and the predicted point in purple (dashed), giving a visual forecast.

**Q14. How does the sidebar navigation work?**
Each sidebar link has a `data-section` attribute. When clicked, a JavaScript function hides all content sections using `display: none` and then shows only the target section using `display: block`. The active link gets a highlighted CSS class.

**Q15. What happens when the internet disconnects during a meeting?**
The Jitsi iframe will show a "reconnecting" message (handled by Jitsi internally). Our backend presence polling will eventually mark the user as inactive (after 30 seconds of no ping). When internet comes back, the user needs to reload and rejoin.

---

**Q16. How does the mobile responsive design work?**
We use CSS media queries. When screen width is below 768px, the sidebar collapses and a hamburger menu button appears. Clicking it toggles a CSS class that slides the sidebar in/out. All stat cards stack vertically on small screens.

**Q17. How does the assignment tab switching (Pending / Completed) work?**
Two tabs with `data-tab` attributes are present. When clicked, JavaScript adds an "active" CSS class to the selected tab, removes it from others, and shows/hides the corresponding `<div>` panels with `display: block / none`.

**Q18. How does the "Refresh" button on assignments work?**
It calls `fetchAllStudentData()` again, which re-fetches assignments from the backend and re-renders both pending and completed lists with fresh data from the database.

**Q19. How do you show the grade for completed assignments?**
When an assignment is fetched, if the submission has `graded: true` and `points: number`, we display it as `"95/100"`. If not yet graded, we show `"Pending Review"` in the completed tab.

**Q20. Why did you keep the frontend and backend on different domains (Netlify + Render)?**
Netlify is optimized for static files (HTML/CSS/JS) — it has a global CDN and is extremely fast. Render is optimized for running Node.js servers. Keeping them separate follows the industry-standard JAMstack architecture. They communicate over HTTPS REST APIs.

**Q21. How does the live clock in the meeting room work?**
A `setInterval` runs every 1000 milliseconds (1 second) and updates a `<div>` with the current time using JavaScript's `new Date().toLocaleTimeString()`.

**Q22. How is the "Class Completed" state detected on the student dashboard?**
When the class polling returns a class record where `meetingLink` is empty AND `schedule.lastMeetingEnded` is set (within the last 24 hours), the frontend shows "Class Completed" instead of the Join button.

**Q23. What is config.js in the frontend?**
`config.js` holds the `API_BASE_URL` constant which points to the backend server URL. Every JavaScript file imports this constant instead of hardcoding the URL. When the backend URL changes (e.g., after redeployment), only one file needs to be updated.

**Q24. How are messages displayed with read/unread status?**
Each message object has a `read: true/false` flag. Unread messages get an extra CSS class `unread` which applies a bold font and a blue left border. When the user opens a message, a PATCH API call marks it as read and removes the class.

**Q25. How does the Excel file rendering work?**
Using SheetJS (xlsx library). The `.xlsx` file binary is fetched, SheetJS parses it into a JavaScript object, and we loop through rows and columns to generate an HTML `<table>` element. This renders the spreadsheet data in the browser without needing Microsoft Excel.

---

---

## 4. Q&A — BACKEND

**Q1. What is Node.js and why did you use it?**
Node.js is a JavaScript runtime that allows you to run JavaScript on the server side. We chose it because: (1) Same language as frontend — JavaScript everywhere, (2) Very fast for handling many API requests simultaneously, (3) Huge ecosystem of packages (npm), (4) Perfect for REST API development.

**Q2. What is Express.js and what role does it play?**
Express.js is a framework that runs on top of Node.js. It simplifies creating API routes. Instead of writing complex HTTP server code, we write simple route handlers like `app.get('/api/users', ...)`. Express handles routing, middleware, request parsing, and response formatting.

**Q3. What is MongoDB and why did you choose it over MySQL?**
MongoDB is a NoSQL database that stores data as JSON-like documents (called BSON). We chose it because: (1) Our data models are flexible — a student document can have different numbers of semester CGPAs, (2) No need to define rigid table schemas upfront, (3) MongoDB Atlas provides free cloud hosting, (4) Mongoose makes it easy to work with in Node.js.

**Q4. What is Mongoose and what does it do?**
Mongoose is an ODM (Object Data Modeling) library for MongoDB. It lets us define Schemas (the structure of our documents), create Models (like a class that represents a MongoDB collection), and write simple JavaScript to query the database (e.g., `User.findOne({ email })`).

**Q5. What is JWT and how does authentication work in EduConnect?**
JWT stands for JSON Web Token. When a user logs in: (1) Backend verifies email + password, (2) A token is created with user ID, role, and expiry time, (3) Token is signed with a secret key (`JWT_SECRET`), (4) Token is sent to frontend and stored in localStorage, (5) Every future API request sends this token in the header, (6) Backend middleware verifies the token on every request.

**Q6. What is bcryptjs and why is it important?**
bcryptjs is used to hash passwords before storing them in MongoDB. Plain text passwords are never stored. When a user logs in, we use `bcrypt.compare(enteredPassword, storedHash)` to verify. Even if the database is hacked, the real passwords cannot be retrieved.

**Q7. What is Multer and how does file upload work?**
Multer is a Node.js middleware for handling `multipart/form-data`, which is the format used for file uploads. When a teacher uploads a resource or a student submits an assignment file, Multer intercepts the request, saves the file to the `/backend/uploads/` folder, and provides the file path to our controller.

**Q8. What are controllers in your project?**
Controllers are JavaScript files that contain the actual business logic for each feature. For example, `assignment.controller.js` has functions like `createAssignment()`, `getAllAssignments()`, `submitAssignment()`. Each function receives the HTTP request, does the database work, and sends back a response.

**Q9. What are routes and how do they connect to controllers?**
Routes define the URL paths and HTTP methods (GET, POST, PUT, DELETE). For example, `router.post('/assignments', authMiddleware, createAssignment)`. When a request comes in to `POST /api/assignments`, Express matches it to this route and calls the `createAssignment` function from the controller.

**Q10. What is middleware and give an example from your project?**
Middleware is a function that runs between receiving a request and sending a response. Our `authMiddleware` runs before every protected route. It reads the JWT token from the `Authorization` header, verifies it, and attaches the user info (`req.user`) to the request so controllers know who is making the call.

**Q11. How does role-based access control work on the backend?**
After JWT verification sets `req.user.role`, controllers check this role before performing actions. For example, only a user with role `'admin'` can delete other users. Only `'teacher'` or `'hod'` can create assignments. If the role doesn't match, the controller returns a 403 Forbidden response.

**Q12. How are activity logs recorded?**
Every important action (login, assignment creation, meeting start, grade update) calls `logActivity()`, a utility function that creates a record in the `ActivityLog` MongoDB collection with: user ID, action name, description, IP address, and success/failure status.

**Q13. What happens if the database is down?**
MongoDB Atlas has built-in redundancy (replica sets). If the primary node fails, a secondary automatically becomes primary. Our backend uses `mongoose.connect()` with automatic reconnection logic. API calls during a brief outage return 500 errors with error messages.

**Q14. How does the backend handle CORS?**
We use the `cors` npm package configured to allow requests only from the frontend URL (`FRONTEND_URL` environment variable). This prevents random websites from making API calls to our backend. In development, it's set to `localhost:5002`.

**Q15. How do environment variables work in the backend?**
Sensitive values (MongoDB URI, JWT secret, frontend URL) are stored in a `.env` file on the server — never in the code. The `dotenv` package loads these variables as `process.env.VARIABLE_NAME`. On Render.com, we set them in the Environment tab of the dashboard.

**Q16. What is the difference between GET, POST, PUT, and DELETE in REST?**
- **GET**: Fetch data (e.g., get all assignments) — no data sent in body
- **POST**: Create new data (e.g., create assignment, submit file)
- **PUT**: Update existing data (e.g., update class schedule)
- **DELETE**: Remove data (e.g., delete user)

**Q17. How does pagination work in the assignment list API?**
The `getAllAssignments` API accepts `?page=1&limit=50` query parameters. The backend uses MongoDB's `.skip()` and `.limit()` methods. If page=2 and limit=10, it skips the first 10 records and returns the next 10.

**Q18. How does the backend validate data?**
We check for required fields in controllers (e.g., `if (!title) return errorResponse(res, 'Title is required', 400)`). Mongoose schemas also have `required: true` and `type` validation. Invalid requests receive 400 Bad Request responses with descriptive messages.

**Q19. How are files served from the backend?**
For resource viewing, we use `res.sendFile(filePath)` with the correct MIME type header (`Content-Type`). For downloads, we add `Content-Disposition: attachment; filename="file.pdf"` header, which tells the browser to download instead of display.

**Q20. How does the auto roll number assignment work?**
When adding a new student, the backend queries all existing students in the same program, extracts their roll numbers (stripping non-digit characters), finds the maximum value, and assigns `max + 1` as the new roll number. This ensures unique, sequential roll numbers per program.

---

**Q21. Why is server.js the entry point and what does it do?**
`server.js` is the main file that starts the entire backend. It: (1) Loads environment variables, (2) Connects to MongoDB Atlas, (3) Sets up Express middleware (CORS, JSON parsing), (4) Registers all route files (auth routes, meeting routes, assignment routes, etc.), (5) Starts the HTTP server on the specified PORT.

**Q22. How does the meeting notification work when a teacher starts a class?**
When a teacher calls `POST /api/meetings`, the backend: (1) Gets all enrolled students for that class, (2) Creates a `Message` document with all student IDs as recipients, (3) The message body contains the meeting link and room code, (4) Students see it in their Messages inbox and also as a notification badge.

**Q23. How are department aliases handled in the backend?**
We have a `departmentCatalog.js` utility that normalizes department names. For example, "CSE-AIML", "CS-AI", and "CSE(AI)" all map to the same canonical name "CSE(AI)". This prevents duplicate departments and ensures students and teachers in the same department can see each other's assignments and classes.

**Q24. What does the `toObject()` method do in the assignment enrichment?**
Mongoose documents have extra prototype methods. `toObject()` converts the Mongoose document to a plain JavaScript object so we can freely add new properties to it. In the assignment API, we call `.toObject()` on each assignment and then add `submitted` and `submission` fields from the submission lookup.

**Q25. How does the backend know which user is making a request?**
The JWT middleware decodes the token and sets `req.user = { id, role, name }`. Every controller function receives this `req` object, so `req.user.id` gives the logged-in user's MongoDB `_id`. This is used for all ownership checks (e.g., "only grade your own students").

**Q26. What is `populate()` in Mongoose?**
MongoDB stores foreign keys as ObjectIDs. `populate()` replaces those IDs with the actual document data. For example, an assignment stores `teacher: ObjectId('abc123')`. Calling `.populate({ path: 'teacher', select: 'name email' })` replaces it with `teacher: { name: 'Dr. Das', email: '...' }`.

**Q27. How is the backend deployed on Render.com?**
We connect the GitHub repository to Render. Settings: Root Directory = `backend`, Build Command = `npm install`, Start Command = `node server.js`. Environment variables are set in Render's dashboard. Every push to the `main` branch triggers an automatic redeploy.

**Q28. How does the 3-layer meeting link clearing work?**
When a meeting ends, we clear the link from all Class records using three sequential database operations: (1) `findByIdAndUpdate(classId, { meetingLink: '' })` — direct clear by class ID, (2) `updateMany({ meetingLink: meetingLinkURL }, { meetingLink: '' })` — catches edge cases, (3) `updateMany({ meetingLink: { $regex: roomCode } }, { meetingLink: '' })` — regex pattern catches partial matches. This guarantees the link is removed even if the classId was stored incorrectly.

**Q29. What is the purpose of the `isActive` flag on meetings?**
`isActive: false` means the meeting has ended. When students poll for meeting details and `isActive` is false, the join request is rejected with "Meeting has ended" error. The dashboard detects this and shows "Class Completed". It's a database-level switch that instantly cuts off all access.

**Q30. How do you handle errors consistently in the backend?**
We have a `response.utils.js` utility with `successResponse(res, data, message)` and `errorResponse(res, message, statusCode, details)`. Every controller uses these functions, so all responses follow the same format: `{ success: true/false, message: "...", data: {...} }`. This makes frontend parsing simple and consistent.

---

---

## 5. Q&A — STUDENT DASHBOARD

**Q1. What are the main sections of the student dashboard?**
The student dashboard has 8 sections: (1) Overview — stats and upcoming classes, (2) My Classes — enrolled class list, (3) My Courses — enrolled courses, (4) Assignments — pending and completed tabs, (5) Grades — CGPA entry and prediction graph, (6) Resources — view and download files, (7) Attendance — class-wise attendance percentage, (8) Messages — inbox and sent messages.

**Q2. How does the "Pending Assignments" count in the stat box update?**
The count is calculated in JavaScript by filtering the assignment list. An assignment is "pending" if the API returns `submitted: false` AND the submission object is `null`. The count = length of filtered pending array, displayed in the stat box.

**Q3. Why was the assignment showing as overdue even after submission?**
The old filtering logic was checking for `submission.status === 'submitted'` — but the Submission model doesn't have a `status` field. The correct check is `submission !== null` (any existing submission means it was submitted). This was a bug that was fixed by checking the actual Submission schema fields: `submitted: true`, `submission object exists`, `graded: true`, or `points assigned`.

**Q4. How does the semester CGPA input work?**
The grades section shows 8 input boxes (one per semester). When the student types a value and clicks Save, a `PUT /api/auth/me/cgpas` request is sent with the array of values. The backend validates each is between 0–10 and saves to the user's record. The chart redraws automatically.

**Q5. How is the "Average Grade" stat box calculated?**
The backend computes it as the average of all non-zero semester CGPA values. For example, if Sem 1 = 8.5, Sem 2 = 7.9, Sem 3 = 8.2 (and rest are 0), the average = (8.5 + 7.9 + 8.2) / 3 = 8.2.

**Q6. How does the Upcoming Classes section work?**
It fetches all classes the student is enrolled in that have a future or today's schedule. It checks:
- `meetingLink` present → show "Join" button (blue, clickable)
- `schedule.virtualTime` set but no `meetingLink` → show "Waiting for teacher" (gray)
- `schedule.lastMeetingEnded` set recently → show "Class Completed" (green)

**Q7. How does the student get notifications about a new class?**
When a teacher creates a meeting, the backend automatically creates a Message record with all enrolled student IDs as recipients. The student sees it in Messages inbox and the notification bell badge increments. The join button also appears automatically on the dashboard within 5 seconds.

**Q8. How does the resource viewer know which library to use for each file type?**
The file extension is checked in JavaScript: `.pdf` → use PDF.js, `.docx` → use Mammoth.js, `.xlsx` → use SheetJS, `.pptx` → use PPTXjs, image extensions → `<img>` tag, video extensions → `<video>` tag. Each viewer is initialized only when that specific file type is opened.

**Q9. Why does the student dashboard poll every 5 seconds for meeting updates?**
We use polling instead of WebSockets for simplicity. 5 seconds is short enough that the student sees the Join button within a reasonable time after the teacher starts the class. This avoids the need for a separate real-time socket connection.

**Q10. What is the student's Join flow for a meeting?**
(1) Student clicks "Join" → goes to meeting-room.html, (2) Lobby screen appears with camera preview, (3) Student clicks "Join Now" → sends join request to backend, (4) "Waiting for Approval" screen shows, (5) Frontend polls every 3 seconds, (6) When teacher approves, student automatically enters meeting after 2 seconds.

**Q11. How does attendance display work?**
Attendance data is stored per student per class. The backend returns an array with class name, total classes held, classes attended, and attendance percentage. The frontend displays these with color-coded badges: 75%+ = "Good" (green), 60–74% = "Average" (yellow), below 60% = "Needs Improvement" (red).

**Q12. Can a student see other students' grades?**
No. The grades API uses `req.user.id` to filter records. A student can only see their own grades, submissions, and CGPA data. The backend enforces this even if someone tries to access another student's ID.

**Q13. What is shown in the "My Classes" section?**
For each enrolled class: class name, subject code, teacher name, mode (Virtual/Physical), schedule date and time, student count, and credits. If virtual, the class schedule is shown. Clicking "View Details" opens a modal with full class information.

**Q14. How does the messaging system work for students?**
Students can view messages in Inbox and Sent tabs. The inbox shows messages received from teachers, HODs, and the system. Clicking on a message marks it as read. Students can compose new messages to any teacher or reply to existing threads.

**Q15. What is the "Achievements" section in the student dashboard?**
The Achievements section displays any badges or performance awards given by teachers or the system. It's a motivational feature that shows recognition for academic performance, attendance, and participation. Currently it displays any manually entered achievement records.

---

---

## 6. Q&A — TEACHER DASHBOARD

**Q1. What is the main purpose of the teacher dashboard?**
The teacher dashboard is the control center for faculty. A teacher can: schedule and start virtual classes, create and grade assignments, upload resources, view student performance analytics, message students, and track attendance — all from one screen.

**Q2. How does a teacher assign a class as Virtual vs Physical?**
The teacher clicks "Update Mode" on their subject card. A modal appears with two options: "Virtual" (requires selecting date and time) and "Physical" (requires entering room number). On saving, the Class document in MongoDB is updated with `mode`, `scheduledDate`, and `scheduledTime`. Students immediately receive a notification.

**Q3. Can a teacher create a meeting at any time?**
Yes. Initially the system had a 15-minute restriction (could only start class 15 minutes before scheduled time). We removed this restriction so teachers can create meetings whenever they need — for extra classes, doubt sessions, or department meetings.

**Q4. How does the "Start Class" button generate a meeting link?**
When clicked, it calls `POST /api/meetings` with the classId. The backend generates a random room code (`abc-defg-hij` format), builds the full meeting URL pointing to the frontend domain, saves it to the Meeting collection, updates the Class record with the link, and notifies all students.

**Q5. How are students shown as "At-Risk" or "Safe" in the teacher's student section?**
The frontend calculates from the student's CGPA data. If overall CGPA < 7.5, the student is flagged as "At-Risk" (shown in red). If CGPA > 8.0, they are "Safe" (shown in green). The 4 stat boxes at the top of the Students section show: Total, Avg CGPA, At-Risk count, Safe count.

**Q6. What does the student detail card show when a teacher clicks "View"?**
A modal opens with a purple gradient card showing: student's name, department, roll number, overall CGPA, current status (At-Risk/Safe), enrolled courses list, year-wise CGPA (Year 1 = Sem 1+2 avg, Year 2 = Sem 3+4 avg, etc.), and a Chart.js line graph with actual CGPAs and a predicted next-year trend.

**Q7. How does the teacher create an assignment?**
Teacher fills: title, description, due date and time, max marks, and optionally attaches a file. Clicking "Create" calls `POST /api/assignments` with the class ID. The assignment is saved in MongoDB with status "published". All enrolled students can see it immediately in their pending assignments.

**Q8. How does grading work?**
Teacher opens the Assignments section → sees all student submissions for each assignment. Clicks "Grade" next to a submission → enters points and optional feedback → clicks "Save". Backend updates the Submission record with `points`, `feedback`, `graded: true`, `gradedBy`, and `gradedAt`. Student's completed tab then shows the grade.

**Q9. Can a teacher approve student join requests?**
Yes. The teacher is in the meeting room → sees the red Participants badge → opens panel → sees pending students with "Accept" / "Decline" buttons. Clicking Accept calls `POST /api/meetings/:roomCode/approve` with the student's userId.

**Q10. What happens if a teacher accidentally clicks "End" meeting?**
A confirmation dialog appears asking "Are you sure you want to end this meeting for everyone?". The teacher must click "Confirm" to proceed. This prevents accidental meeting terminations.

**Q11. How does the resource upload work for teachers?**
Teacher selects a file (up to 50MB), enters a title and description, selects which class it belongs to, and clicks "Upload". The file is sent to `POST /api/resources` as multipart/form-data. Multer saves it to `/uploads/` folder. All enrolled students immediately see the resource in their Resources section.

**Q12. How does the teacher see assignment submission count?**
The assignment list shows a badge like "5/12 submitted" (5 students submitted out of 12 enrolled). Backend counts submissions for that assignment and compares with enrolled student count.

**Q13. Can teachers from different departments see each other's assignments?**
No. The backend filters assignments by `teacher: req.user.id` for the teacher. A teacher can only see assignments they created. Students only see assignments from teachers in their own department.

**Q14. What is the Predictions section for teachers?**
It shows at-risk students identified by the ML prediction model. Students with medium or high risk (based on attendance rate and CGPA) are listed with their predicted performance score, risk level, and contributing factors. This helps teachers identify students needing extra attention early.

**Q15. How does the face recognition attendance system connect to the teacher dashboard?**
The teacher clicks "Launch Attendance" which connects to the Python-based face recognition module (in the `/face` folder). The Python script uses OpenCV and a trained recognition model to mark attendance. Results are saved to the `attendances` collection and displayed on the teacher dashboard.

---

---

## 7. Q&A — HOD DASHBOARD

**Q1. What extra powers does a HOD have compared to a teacher?**
A HOD has all teacher powers PLUS: department-level oversight (view all teachers' performance), faculty management (assign subjects to teachers), department-wide student performance monitoring, ability to create department meetings inviting all teachers, event request submission to Principal, and subject creation.

**Q2. How does the HOD assign a subject to a teacher?**
HOD goes to Faculty section → selects a teacher → clicks "Assign Subject" → selects from the subject catalog (created by admin) → saves. The teacher's dashboard immediately shows the new subject card. HOD can also unassign subjects.

**Q3. How are year-wise CGPAs calculated for students in the HOD's view?**
Year 1 = average of Semester 1 and Semester 2 CGPAs. Year 2 = average of Semester 3 and 4. Year 3 = average of Semester 5 and 6. Year 4 = average of Semester 7 and 8. If a semester has no CGPA entered (value = 0), it's excluded from the average.

**Q4. How does the HOD host a meeting for all department teachers?**
HOD clicks "Start Meeting" in the Meeting Room section and selects audience as "Department Teachers". The backend finds all teachers in the HOD's department, sends them all a meeting notification, and the meeting link is created. All teachers in that department see the invite in their Messages.

**Q5. Why can the HOD also approve student join requests in meetings?**
In education settings, an HOD may be co-hosting or observing a class meeting. Since the HOD has a privileged role (`hod`), the backend's `approveJoinRequest` controller checks for `isPrivileged = ['teacher', 'hod', ...].includes(callerRole)` and allows approval. This mirrors real-world academic authority.

**Q6. How does the HOD's student performance table get the data?**
Backend API returns all students in the HOD's department (`role: 'student', department: hodDepartment`). For each student, it reads their `semesterCgpas` array from the User model and computes year-wise averages in the frontend.

**Q7. How does the HOD submit an event request to the Principal?**
HOD fills an event request form (event name, date, description, expected attendees) and submits it. Backend creates an `ApprovalRequest` document with `status: 'pending'`. Principal sees it in the Approvals section. On approval, the HOD gets a notification and the event appears confirmed.

**Q8. What is the HOD's role in the department grade reporting?**
HOD can view the overall department performance: average CGPA, number of at-risk students, number of safe students, and per-semester averages. This data is pulled from all students' `semesterCgpas` arrays in the User collection.

**Q9. Can a HOD delete a teacher from the system?**
No — only the Admin can delete users from the system. The HOD can only view teachers, assign/unassign subjects, and message them. User management (create/delete accounts) is restricted to Admin to maintain system integrity.

**Q10. How does the HOD receive announcements from the Principal?**
All announcements created by the Principal are stored in the `announcements` collection with no recipient filter — they are global. Every dashboard (including HOD's) fetches all announcements and displays them. Priority badges (High/Medium/Low) are color-coded for quick attention.

---

---

## 8. Q&A — MEETING ROOM & JITSI

**Q1. What is Jitsi Meet and why was it chosen for EduConnect?**
Jitsi Meet is a 100% free, open-source video conferencing platform that uses WebRTC technology. We chose Jitsi because:
- **Cost: Free** — meet.jit.si is a public server that anyone can use for free, no API key needed
- **No setup required** — no need to build or host our own video server (which would cost thousands)
- **Global infrastructure** — Jitsi has servers worldwide, so it works from India, US, Europe, anywhere
- **WebRTC quality** — peer-to-peer video means low latency, high quality
- **Built-in features** — screen share, raise hand, mic/camera toggle all come for free
- **Simple integration** — embed as an `<iframe>` in just one line of HTML
- **No app needed** — works entirely in the browser, students don't need to install anything

**Q2. How exactly is Jitsi embedded in EduConnect?**
We use an HTML `<iframe>` pointing to `https://meet.jit.si/RoomName`. The room name is our unique room code like `EduConnectabc-defg-hij`. We pass configuration options via URL hash parameters (the `#config.key=value` format):
```
https://meet.jit.si/EduConnectabc-defg-hij
  #config.prejoinPageEnabled=false
  &config.startWithAudioMuted=false
  &config.startWithVideoMuted=false
  &_t=1720000000000
```
The `_t` parameter is a timestamp cache buster to force fresh connections.

**Q3. Why did you not build your own video conferencing system?**
Building a custom WebRTC video system from scratch requires: (1) STUN/TURN servers for NAT traversal, (2) Signaling server for peer discovery, (3) Media server (like Janus or Mediasoup) for multi-party calls, (4) Complex WebRTC JavaScript API handling. This would take months and significant infrastructure cost. Jitsi gives all of this for free and lets us focus on the educational management features.

**Q4. What is WebRTC and how does Jitsi use it?**
WebRTC (Web Real-Time Communication) is a browser technology that enables direct peer-to-peer audio/video streaming between browsers without a central server routing the media. Jitsi uses WebRTC under the hood — once the connection is established, video/audio flows directly between participants' browsers, making it fast and low latency.

**Q5. What was the "users need to rejoin" problem and how was it fixed?**
**Problem:** When the host was already in the Jitsi room and a student joined after approval, Jitsi didn't establish a WebRTC peer connection between them. The host had already "settled" in the room alone. The new peer wasn't detected.

**Fix:** When the host approves a student, after 1.5 seconds, the host's Jitsi iframe reloads with a new timestamp. The student waits 2 seconds before entering. Now both join the Jitsi room at roughly the same time (within 1–2 seconds of each other). Jitsi detects both as new joiners simultaneously and establishes the WebRTC connection immediately. Total time: ~4 seconds from approval to video.

**Q6. What is a cache buster and why is it used in the Jitsi URL?**
A cache buster is a unique value (usually a timestamp) added to a URL to prevent the browser from using a cached version. We add `&_t=Date.now()` to the Jitsi URL so each reload is treated as a completely fresh request. Without this, the browser might reuse the old Jitsi connection state.

**Q7. How is the room code generated?**
The backend `generateRoomCode()` function creates a code like `abc-defg-hij`. It picks random lowercase letters for 3 groups (3, 4, 3 characters) separated by hyphens. The full Jitsi room name is `EduConnect` + `abc-defg-hij` = `EduConnectabc-defg-hij`. The `EduConnect` prefix ensures our rooms don't accidentally clash with other Jitsi users.

**Q8. How does the approval system work — step by step?**
1. Student clicks "Join Now" → backend adds them to `meeting.participants[]` with `status: 'pending'`
2. Student's browser polls `GET /api/meetings/:roomCode/participants` every 3 seconds
3. Host's browser polls the same endpoint every 5 seconds, sees pending participants in the response
4. Host clicks "Accept" → POST to `/api/meetings/:roomCode/approve` with student's userId
5. Backend sets `participant.status = 'accepted'`
6. Student's next poll detects `status: 'accepted'`
7. Student's browser shows countdown toast: "Approved! Joining in 2 seconds..."
8. After 2 seconds, student's Jitsi iframe loads
9. Host's iframe reloads after 1.5 seconds to sync peers
10. Both connect in the same Jitsi room → video established ✅

**Q9. Who can approve or reject join requests?**
Any of these can approve/reject:
- The original meeting host (whoever created the meeting)
- Any participant with role `teacher`, `hod`, `managing_authority`, or `admin`
- Any participant already in the meeting with `status: 'accepted'` (for collaborative meetings)

Students cannot approve other students (unless the above conditions apply). This mirrors real classroom authority.

**Q10. How does the "End Meeting" button work?**
Teacher clicks End → confirmation dialog → on confirm: (1) Backend sets `meeting.isActive = false`, (2) Sets `meeting.endedAt = new Date()`, (3) Marks all participants as `active: false`, (4) 3-layer clearing removes meetingLink from all Class records, (5) Sets `schedule.lastMeetingEnded = new Date()` timestamp. All students polling for meeting details get an "inactive" response and are redirected to "Class Completed" screen.

**Q11. Can students see each other in the meeting?**
Yes. Jitsi handles this automatically. When multiple approved participants join the same Jitsi room (same room code), Jitsi creates a multi-party WebRTC mesh. Every participant's video/audio is shared with all others. The Jitsi video grid automatically resizes as more people join (like Google Meet's tile view).

**Q12. What does the lobby screen show before entering the meeting?**
The lobby shows: camera preview (using `navigator.mediaDevices.getUserMedia()`), mic toggle button, camera toggle button, and a "Join Now" button. This allows the student to check their mic/camera before entering and choose to mute before joining.

**Q13. How does the in-meeting chat work?**
Chat messages are stored in the Meeting document's `chat[]` array in MongoDB (capped at 200 messages). Sending a message calls `POST /api/meetings/:roomCode/chat`. Reading messages uses `GET /api/meetings/:roomCode/chat` polled every 3 seconds. The chat panel slides in from the right side of the meeting room.

**Q14. Is the meeting link permanent or temporary?**
Temporary. The meeting link is only valid while the meeting is active (`isActive: true`). When the teacher ends the meeting, the link is cleared from the database and all join attempts are rejected with "Meeting has ended" error. Old links cannot be reused.

**Q15. What is the difference between the meeting "room code" and the "meeting link"?**
- **Room code:** Short identifier like `abc-defg-hij` — stored in the Meeting document and Class document
- **Meeting link:** Full URL like `https://educonnect-2025.netlify.app/meeting-room.html?room=abc-defg-hij&title=...` — this is what students click to open the meeting page

**Q16. How is Jitsi room access controlled? Can random people join?**
Anyone who knows the Jitsi room name could technically navigate to `meet.jit.si/EduConnectabc-defg-hij` directly. However, our approval system on the EduConnect side controls who actually participates in the class context. For production, Jitsi can be configured with lobby passwords or private instances. Since meet.jit.si is used, the room name being random (and prefixed with "EduConnect") makes accidental collisions extremely unlikely.

**Q17. What is a "pending" participant vs an "accepted" participant?**
- **Pending:** Student sent a join request but host hasn't approved yet. They see "Waiting for Approval" screen. Their Jitsi iframe is not loaded yet.
- **Accepted:** Host approved them. Their Jitsi iframe loads and they enter the actual video room. They appear in the participants list with green dot.

**Q18. How does the Participants Panel show real-time counts?**
The participants endpoint `GET /api/meetings/:roomCode/participants` returns two arrays: `participants` (accepted) and `pendingRequests` (pending). The frontend counts the length of `pendingRequests` and shows it as a red badge number on the Participants icon. This is refreshed every 5 seconds.

**Q19. What is a "presence update" and why is it needed?**
Every participant sends a `PUT /api/meetings/:roomCode/presence` request every 5 seconds. This updates their `lastSeen` timestamp. The backend considers a participant "active" only if they were seen within the last 30 seconds. This way, if someone closes their browser without clicking "Leave", they're automatically removed from the participants list after 30 seconds.

**Q20. What was the main technical challenge in building the meeting room?**
The main challenge was the **WebRTC peer connection timing problem** — when the host is already in the Jitsi room and a student joins after approval, Jitsi doesn't auto-discover the new peer. The solution (auto-reloading the host's iframe when approving) was non-obvious and required understanding how Jitsi's peer discovery works internally. Other challenges were: building the approval flow, the 3-layer meeting link clearing, and ensuring the student dashboard auto-updates without page refresh.

---

**Q21. How does screen sharing work in EduConnect meetings?**
Screen sharing is provided natively by Jitsi Meet. There is a screen share button in the Jitsi iframe's toolbar. When clicked, the browser's built-in screen share dialog opens (shows available screens, windows, and tabs). The selected screen is then shared as a video stream to all participants. No extra coding was required — Jitsi handles this entirely.

**Q22. Can a meeting have multiple teachers/HODs?**
Yes. The meeting system allows any number of privileged users (teachers, HODs) to join the same meeting. The first one to click "Start Class" is the host, but others can also join using the same link. All privileged users can approve/reject join requests and interact equally in the meeting.

**Q23. What happens to a student who is rejected?**
Their status is set to `rejected` in the participants array. The student's polling detects `status: 'rejected'` and shows a message: "Your join request was declined." They are redirected back to the student dashboard. They can try joining again, which will send a new pending request.

**Q24. Why does the meeting work without logging into Jitsi?**
Jitsi's public server (meet.jit.si) doesn't require any login. Anyone can create and join rooms using just a URL. We control access through our own backend's approval system — the student must be authenticated in EduConnect, go through our approval flow, and only then does their Jitsi iframe load.

**Q25. How is the meeting room mobile-friendly?**
The `meeting-room.html` uses CSS flexbox and percentage-based widths. The Jitsi iframe fills the full viewport (`width: 100%; height: 100vh`). The control buttons use `flex-wrap: wrap` so they stack on narrow screens. Jitsi's own interface is also mobile-responsive by default.

**Q26. What is the maximum number of participants in a meeting?**
There is no hard limit imposed by EduConnect. Jitsi's public server (meet.jit.si) recommends up to 35–50 participants for good video quality. For larger lectures, the teacher can mute video for most participants and just keep audio. For production scale, a self-hosted Jitsi instance can support more.

**Q27. How does the "Copy Meeting Link" button work?**
The meeting link is stored in the `meetingLink` variable in JavaScript. When the copy button is clicked, `navigator.clipboard.writeText(meetingLink)` copies it to the clipboard. A toast message shows "Link copied!" A fallback `document.execCommand('copy')` is used for older browsers.

**Q28. Is there any cost associated with using Jitsi for EduConnect?**
No cost. We use meet.jit.si which is Jitsi's free public server. The only costs are our backend hosting (Render.com free tier) and frontend hosting (Netlify free tier). For a production institution with hundreds of concurrent users, upgrading to a self-hosted Jitsi server on a VPS (~$10/month) would be recommended.

**Q29. What is the "Raise Hand" feature?**
Jitsi provides a built-in "Raise Hand" button. When clicked, a 🖐 icon appears next to the participant's name in the participant list. It signals to the teacher that the student wants to speak without interrupting the ongoing discussion. It's fully handled by Jitsi — no backend code needed.

**Q30. How would you improve the meeting system in the future?**
Future improvements include: (1) Recording meetings and saving to cloud storage, (2) Automated attendance marking based on meeting join/leave times, (3) Breakout rooms for group activities, (4) Waiting room with a custom EduConnect-branded page instead of Jitsi's default, (5) Self-hosted Jitsi server for better privacy and scalability, (6) WebSocket-based real-time updates instead of polling.

---

---

## 9. Q&A — GRADE PREDICTION & ML

**Q1. What is the grade prediction feature in EduConnect?**
The grade prediction feature uses a machine learning model to estimate how a student will perform in the future based on their current attendance rate and CGPA. It gives a predicted score (0–100), a predicted letter grade (A, B+, etc.), a risk level (Low/Medium/High), and a confidence percentage. Teachers and HODs use this to identify struggling students early.

**Q2. What machine learning algorithm is used?**
The system uses a trained Python ML model saved as `student_performance_model.pkl` (a pickle file). If the model file is available, it runs predictions via a Python script using the `PythonShell` npm package. If Python is unavailable, it falls back to a heuristic (rule-based) prediction formula.

**Q3. What input features does the prediction model use?**
The model uses only two key features:
- **Attendance Rate:** Percentage of classes attended (0–100%)
- **Overall CGPA / Grade:** Student's academic performance score

These two factors are the most practically available and impactful predictors of student performance.

**Q4. What is the heuristic prediction formula when Python is unavailable?**
The fallback formula is:
```
Attendance Weight = 0.4 (40%)
Grade Weight      = 0.6 (60%)

normalizedAttendance = attendanceRate / 100
normalizedGrade = grade / 4.0 (if GPA scale) OR grade / 100 (if percentage scale)

performanceScore = (normalizedAttendance × 0.4 + normalizedGrade × 0.6) × 100
```
Grade is weighted more heavily (60%) because academic performance is a stronger predictor than attendance alone.

**Q5. What do the risk levels mean?**
- **Low Risk (score ≥ 80):** Student is performing well. No immediate intervention needed.
- **Medium Risk (score 60–79):** Student needs some attention and guidance.
- **High Risk (score < 60):** Student is at serious risk of failing. Immediate intervention recommended.

**Q6. How is the prediction shown on the student dashboard?**
In the Grades section, the Chart.js graph shows: actual semester CGPAs as a solid blue line and a predicted next semester CGPA as a dashed purple line. This is computed using simple linear regression on the frontend — the slope and intercept of the existing trend line are used to project the next value.

**Q7. How is the linear regression prediction calculated in the frontend?**
Using the least-squares formula:
- X values = semester numbers (1, 2, 3...)
- Y values = corresponding CGPAs
- Calculate slope (m) and intercept (b): `m = (nΣxy - ΣxΣy) / (nΣx² - (Σx)²)`
- Predict next semester: `y = m × (nextSemester) + b`
- If predicted value > 10, cap at 10. If < 0, floor at 0.

**Q8. What is a .pkl file?**
A `.pkl` file is a Python "pickle" file — it stores a serialized (saved) Python object, in this case a trained scikit-learn ML model. The model was trained on student performance dataset (`Student_DataSet.xlsx`), saved as `student_performance_model.pkl`, and is loaded at runtime to make predictions without retraining.

**Q9. How does the backend call the Python prediction script?**
Using the `python-shell` npm package. The Node.js backend starts a Python child process, sends input data as JSON via `pyshell.send(JSON.stringify(inputData))`, and waits for the Python script to output the prediction result as JSON. This bridges Node.js and Python seamlessly.

**Q10. What does the confidence percentage mean in predictions?**
Confidence represents how certain the model is about its prediction. A high confidence (90%+) means the model has enough data and the student's performance pattern is clear. A lower confidence means there's limited data (e.g., student has only entered 1–2 semester CGPAs) or the pattern is inconsistent.

**Q11. How does the "At-Risk Students" section on teacher/HOD dashboards work?**
The backend calls `getAtRiskStudents()` which: (1) Gets all students in the department, (2) For each student, fetches their attendance and CGPA data, (3) Runs the prediction model, (4) Returns only students with `riskLevel === 'medium'` or `riskLevel === 'high'`. Teachers see these students highlighted so they can provide extra support.

**Q12. What dataset was used to train the ML model?**
The model was trained on `Student_DataSet.xlsx` located in the project's dataset folder. This dataset contains student records with attendance, grades, and performance outcomes. The model learned the relationship between these inputs and the final performance score.

**Q13. Why is CGPA weighted more than attendance in the prediction?**
Research shows that academic scores (CGPA, exam marks) are stronger predictors of future performance than attendance alone. A student can attend all classes but not understand the material. However, a student with both high attendance AND high CGPA is the strongest predictor of continued success. The 60/40 split reflects this.

**Q14. What contributing factors does the prediction system identify?**
The system flags specific problem areas:
- Attendance < 75% → "Improve attendance to at least 80%"
- Assignment score < 70% → "Focus on completing assignments"
- Exam score < 70% → "Seek additional help for exam preparation"
- Course load > 5 courses → "Consider reducing course load"
These actionable recommendations help students understand exactly what to improve.

**Q15. What is the predicted letter grade scale?**
| Score | Grade |
|-------|-------|
| 97–100 | A+ |
| 93–96 | A |
| 90–92 | A- |
| 87–89 | B+ |
| 83–86 | B |
| 80–82 | B- |
| 77–79 | C+ |
| 73–76 | C |
| 70–72 | C- |
| 67–69 | D+ |
| 65–66 | D |
| Below 65 | F |

**Q16. How is the prediction different from the actual grade?**
Actual grade is what the student has already achieved — calculated from their existing semester CGPAs. Predicted grade is what the model estimates the student WILL achieve in the upcoming semester or term, based on trends in their current data.

**Q17. Can students see their own prediction?**
The chart on the student's Grades section shows the predicted next semester CGPA as a dashed line. This is the visual prediction. The full ML prediction (risk level, letter grade prediction, contributing factors) is currently visible to teachers and HODs who use it for intervention decisions.

**Q18. How accurate is the prediction model?**
The accuracy depends on the training data quality. The heuristic formula is a simplified model — not production ML accuracy. However, for a final year project, it demonstrates the concept effectively. A real-world system would use a larger dataset, cross-validation, and a more sophisticated algorithm (Random Forest, XGBoost) for higher accuracy.

**Q19. What improvements could be made to the prediction system?**
(1) Include more features: assignment submission rate, quiz scores, class participation, (2) Use more advanced algorithms: Random Forest or Neural Networks, (3) Train on larger, more diverse datasets, (4) Add semester-specific predictions, (5) Provide personalized study recommendations, (6) Integrate with actual exam results as they become available.

**Q20. What is the purpose of showing this prediction in the FYP context?**
It demonstrates the integration of machine learning with a web application — a cutting-edge feature for an educational management system. It shows that the system is not just a database viewer but an intelligent platform that proactively identifies at-risk students, which is a real-world problem colleges face every semester.

---

---

## 10. Q&A — SECURITY & AUTHENTICATION

**Q1. How does login work in EduConnect?**
User enters email + password + selects their role. Frontend sends `POST /api/auth/login` with these values. Backend finds the user by email AND role in MongoDB. It compares the entered password with the stored bcrypt hash using `bcrypt.compare()`. If matched, it generates a JWT token and sends it back. Frontend stores the token in `localStorage`.

**Q2. What is a JWT token and what information does it contain?**
JWT (JSON Web Token) is a signed string with 3 parts separated by dots: `header.payload.signature`. The payload contains: `userId`, `role`, `name`, and `exp` (expiry time). The signature is created using a secret key (`JWT_SECRET`) so the token cannot be tampered with.

**Q3. How does the backend verify identity on every request?**
Every protected API route passes through `authMiddleware`. This middleware: (1) Reads the `Authorization: Bearer <token>` header, (2) Calls `jwt.verify(token, JWT_SECRET)`, (3) If valid, sets `req.user = { id, role, name }`, (4) If invalid or expired, returns 401 Unauthorized.

**Q4. What happens if someone steals a JWT token?**
They could make API calls on behalf of that user until the token expires. To mitigate this: (1) Tokens have an expiry time (e.g., 7 days), (2) HTTPS encrypts all traffic (preventing network interception), (3) Tokens are only in localStorage (not cookies, avoiding CSRF attacks), (4) Backend validates role + ownership on every action.

**Q5. How are passwords protected in the database?**
We never store plain text passwords. `bcryptjs.hash(password, 10)` creates a salted hash. The number `10` is the salt rounds — the higher it is, the harder it is to brute-force. Even if someone dumps the MongoDB database, they cannot reverse the hash to get real passwords.

**Q6. What is CORS and how is it configured?**
CORS (Cross-Origin Resource Sharing) prevents browsers from making requests to a different domain than the page was loaded from. We configure the Express `cors` middleware to only allow requests from `FRONTEND_URL` (our Netlify domain). Any request from an unknown origin gets blocked by the browser.

**Q7. What is role-based access control (RBAC) in EduConnect?**
RBAC means each user role has specific permissions. In EduConnect:
- **Student:** Can only read their own data, submit assignments
- **Teacher:** Can create assignments, start meetings, grade students
- **HOD:** All teacher permissions + department management
- **Principal:** All HOD permissions + institution management, announcements
- **Admin:** Full system access — create/delete users, manage programs

Backend enforces this by checking `req.user.role` before every sensitive operation.

**Q8. How does EduConnect prevent a student from grading their own assignment?**
The grading endpoint checks `req.user.role`. Only `'teacher'` or `'hod'` roles can call the grade endpoint. Even if a student somehow gets the API URL and sends a grading request, the backend returns `403 Forbidden` because their role is `'student'`.

**Q9. What is SQL Injection and is EduConnect vulnerable to it?**
SQL Injection is an attack where malicious SQL code is inserted into inputs. EduConnect uses MongoDB (NoSQL), not SQL, so traditional SQL injection doesn't apply. Mongoose parameterizes all queries automatically — user input never becomes raw database query code.

**Q10. How is file upload security handled?**
Multer is configured with: (1) File size limit (50MB), (2) File type filter (only allowed extensions: pdf, doc, docx, ppt, pptx, xls, xlsx, images, videos), (3) Files saved to server with generated names (not user-provided filenames). This prevents uploading executable files (.exe, .sh) that could run on the server.

**Q11. How does the activity log help with security?**
Every login attempt (success and failure), every assignment creation, every grade change, and every meeting start is logged with the user's IP address. If suspicious activity is detected (e.g., multiple failed logins from the same IP), an admin can review the activity logs to identify and block the source.

**Q12. How are API responses standardized for security?**
We never expose internal error details to the client. Error messages are generic ("Failed to fetch assignment") while the actual error detail (`error.message`) is only logged on the server. This prevents attackers from learning about our database structure or server configuration from error messages.

---

---

## 11. QUICK-FIRE REVISION — Most Likely Viva Questions

**What does EduConnect do?**
It's a full-stack college management system that connects students, teachers, HODs, principal, and admin in one digital platform — managing classes, assignments, meetings, grades, attendance, and announcements.

**How many roles are there?**
5 roles: Student, Teacher, HOD, Managing Authority (Principal), Admin.

**What database is used?**
MongoDB Atlas (cloud NoSQL database).

**How many MongoDB collections are there?**
16 collections: users, classes, subjects, assignments, submissions, resources, messages, meetings, attendances, grades, announcements, approvalrequests, departments, enrollmentrequests, programs, activitylogs.

**What is the purpose of JWT?**
To authenticate users across requests without storing session data on the server. Token is generated on login and verified on every API call.

**What is bcrypt used for?**
To hash passwords before storing in the database so plain-text passwords are never stored.

**What is Multer?**
Node.js middleware for handling file uploads (assignments, resources).

**Why was Jitsi chosen?**
Free, open-source, WebRTC-based video conferencing that works in the browser with no setup or cost.

**What was the biggest bug fixed?**
Users needing to rejoin meeting for video to work. Fixed by auto-reloading the host's Jitsi iframe when approving a student, so both enter the Jitsi room at the same time and WebRTC peer connection is established automatically.

**What is the prediction model based on?**
Two inputs: Attendance Rate (40% weight) + CGPA/Grade (60% weight). Risk levels: High (<60), Medium (60–80), Low (>80).

**Where is the frontend deployed?**
Netlify — `https://educonnect-2025.netlify.app`

**Where is the backend deployed?**
Render.com — free Node.js hosting with MongoDB Atlas.

**What polling interval is used for meeting updates?**
- Student dashboard meeting poll: every 5 seconds
- Meeting room approval poll: every 3 seconds
- Participant presence poll: every 5 seconds

**How many Q&A sections does this document cover?**
10 sections — Frontend, Backend, Student Dashboard, Teacher Dashboard, HOD Dashboard, Meeting Room & Jitsi, Grade Prediction & ML, Security & Authentication, Working Flows, and Quick Revision.

**What is the 3-layer meeting link clearing system?**
When a meeting ends: (1) Clear by classId directly, (2) Clear all classes with matching meetingLink URL, (3) Clear all classes where meetingLink contains the room code (regex). This guarantees the link is removed even in edge cases.

---

## 12. SYSTEM ARCHITECTURE SUMMARY

```
┌──────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                        │
│                                                          │
│  HTML Pages + Vanilla JS  (Netlify CDN — Global)         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│  │ Student │ │ Teacher │ │   HOD   │ │  Principal  │   │
│  │  .html  │ │  .html  │ │  .html  │ │    .html    │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬──────┘   │
│       └───────────┴───────────┴──────────────┘           │
│                    HTTP REST API Calls                    │
│                  (fetch + JWT in header)                  │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────┐
│                  BACKEND SERVER (Render.com)               │
│                                                          │
│    Node.js + Express.js                                  │
│    ┌──────────┐  ┌──────────┐  ┌───────────────────┐   │
│    │  Routes  │→ │Controller│→ │  MongoDB (Atlas)   │   │
│    └──────────┘  └──────────┘  └───────────────────┘   │
│         ↑              ↑                                  │
│    JWT Middleware  Multer (files)                         │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                  JITSI MEET (meet.jit.si)                  │
│         Free Public Server — WebRTC Video/Audio           │
│         Embedded as <iframe> in meeting-room.html         │
└──────────────────────────────────────────────────────────┘
```

---

*This document was prepared for Final Year Project submission.*
*Project: EduConnect — Educational Management System*
*Developer: Souvik Pachal*
*Year: 2024–2025*
