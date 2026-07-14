# 🗄️ EduConnect — Database Collections Guide

> **Project:** EduConnect — Educational Management System
> **Database:** MongoDB Atlas (NoSQL — stores data as JSON-like documents)
> **Total Collections:** 17

---

## 📖 What is a Collection?

In MongoDB, a **Collection** is like a table in SQL. Instead of rows, it stores **documents** (JSON objects). Instead of foreign keys, it stores **ObjectIDs** that point to documents in other collections — these are called **references (refs)**.

---

## 🗺️ COMPLETE RELATIONSHIP DIAGRAM

```
                        ┌─────────────┐
                        │   programs  │
                        │  (B.Tech,   │
                        │   BCA etc.) │
                        └──────┬──────┘
                               │ ref
                    ┌──────────▼──────────┐
                    │      departments    │
                    │  (CSE, ECE, MBA...) │
                    └──────────┬──────────┘
                               │ ref
          ┌────────────────────▼────────────────────┐
          │                  users                  │
          │  (Student / Teacher / HOD /             │
          │   Principal / Admin)                    │
          └──┬──────┬────────┬────────┬─────────────┘
             │      │        │        │
     ┌───────▼┐  ┌──▼───┐ ┌──▼────┐ ┌▼──────────────┐
     │subjects│  │classes│ │grades │ │  activitylogs │
     └───┬────┘  └──┬────┘ └───────┘ └───────────────┘
         │          │
         │    ┌─────┼───────────────────────────────┐
         │    │     │                               │
         │  ┌─▼──┐ ┌▼──────────┐  ┌─────────────┐ ┌▼──────┐
         │  │    │ │assignments│  │  resources  │ │       │
         │  │enr.│ └─────┬─────┘  └─────────────┘ │attend.│
         │  │reqs│       │                         └───────┘
         │  └────┘  ┌────▼──────┐
         │          │submissions│
         │          └───────────┘
         │
    ┌────▼──────────────────────────────────────────────┐
    │                    messages                        │
    │           (inbox / sent / meeting links)          │
    └───────────────────────────────────────────────────┘

    ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐
    │   meetings   │   │announcements │   │ approvalrequests│
    │  (video      │   │ (Principal   │   │ (HOD → Principal│
    │   rooms)     │   │  broadcasts) │   │  event requests)│
    └──────────────┘   └──────────────┘   └─────────────────┘
```

---

---

## 1. 🎓 `programs` Collection

**What it stores:** Academic programs offered by the institution (e.g., B.Tech, BCA, MCA).

**Think of it as:** The master list of all degree programs. Admin creates these, and everything else (departments, students) is linked to a program.

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Program name (e.g., "B.Tech") |
| `code` | String | Short code (e.g., "BTECH") |
| `duration` | Number | Duration in years (e.g., 4) |
| `totalSemesters` | Number | Total semesters (e.g., 8) |
| `isActive` | Boolean | Is this program currently active? |
| `description` | String | Optional description |

**Connected to:**
- `users` → a student's `program` field points here
- `departments` → a department's `program` field points here

---

## 2. 🏢 `departments` Collection

**What it stores:** All departments in the college (e.g., CSE(DS), ECE, MBA).

**Think of it as:** Each department is a branch of the college that has its own HOD, teachers, and students.

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Department name (e.g., "CSE(DS)") |
| `program` | ObjectId → `programs` | Which program this dept belongs to |
| `hod` | ObjectId → `users` | The HOD user of this department |
| `establishedYear` | Number | Year the department was set up |
| `isActive` | Boolean | Is department currently active? |
| `description` | String | Optional description |

**Connected to:**
- `programs` → which program this department runs
- `users` → who is the HOD

---

## 3. 👤 `users` Collection

**What it stores:** Every person in the system — students, teachers, HODs, principals, and admins. All 5 roles share ONE collection.

**Think of it as:** The central identity store. Every other collection links back to `users` to know "who created this?" or "who submitted this?"

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Full name |
| `email` | String | Login email (unique) |
| `password` | String | Bcrypt-hashed password |
| `role` | String | student / teacher / hod / managing_authority / admin |
| `department` | String | Department name (text, not ObjectId) |
| `program` | ObjectId → `programs` | Student's program (B.Tech, BCA) |
| `studentId` | String | Roll number (for students) |
| `teacherId` | String | Teacher/HOD ID |
| `semesterCgpas` | [Number] | Array of 8 CGPA values (one per semester) |
| `grade` | Number | Computed overall GPA (average of semesterCgpas) |
| `currentSemester` | Number | Current semester number (1–8) |
| `isActive` | Boolean | Is account active? |
| `lastLogin` | Date | Last login timestamp |

**Connected to (via other collections):**
- `classes` → teacher field
- `assignments` → teacher field
- `submissions` → student field
- `messages` → sender and recipients
- `meetings` → host and participants
- `grades` → student and teacher fields
- `activitylogs` → userId field
- `departments` → hod field
- `enrollmentrequests` → student field
- `approvalrequests` → requestedBy field

---

## 4. 📚 `subjects` Collection

**What it stores:** The subject/course catalog — the list of all subjects that can be taught.

**Think of it as:** A library of all available subjects (like "Data Structures", "Operating Systems"). Teachers are assigned subjects from this list.

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Subject name (e.g., "Operating Systems") |
| `code` | String | Subject code (e.g., "CS401") |
| `department` | String | Which department this belongs to |
| `semester` | Number | Which semester (1–8) |
| `credits` | Number | Credit hours |
| `teacher` | ObjectId → `users` | Assigned teacher |
| `isActive` | Boolean | Active or not |

**Connected to:**
- `users` → assigned teacher
- `classes` → a class is created for a subject
- `enrollmentrequests` → students request enrollment in a subject

---

## 5. 🏫 `classes` Collection

**What it stores:** Actual class sections — a class is one specific group of students being taught a subject by a teacher.

**Think of it as:** The bridge between students and their teacher. A class has an enrolled student list, a schedule, and a meeting link when the class goes live.

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Class name (e.g., "OOP's Using Java DS 401A") |
| `code` | String | Class code |
| `subject` | ObjectId → `subjects` | Which subject this class teaches |
| `teacher` | ObjectId → `users` | Which teacher is teaching |
| `students` | [ObjectId → `users`] | Array of enrolled students |
| `credits` | Number | Credit value |
| `mode` | String | "virtual" or "physical" |
| `meetingLink` | String | Live meeting URL (set when teacher starts class) |
| `schedule.scheduledDate` | String | Date of next virtual class |
| `schedule.scheduledTime` | String | Time of next virtual class |
| `schedule.location` | String | Room number (for physical classes) |
| `schedule.lastMeetingEnded` | Date | When the last meeting was ended |

**Connected to:**
- `subjects` → which subject is being taught
- `users` → teacher (single) and students (array)
- `assignments` → assignments are created for a class
- `resources` → resources are shared with a class
- `meetings` → meeting rooms are linked to a class
- `attendance` → attendance is tracked per class
- `enrollmentrequests` → students request to join a class

---

## 6. 📝 `assignments` Collection

**What it stores:** Assignments created by teachers/HODs for their classes.

**Think of it as:** A homework or test task given to students. It has a deadline, max marks, optional attached PDF, and a status (draft/published).

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Assignment title (e.g., "OOP's MCQ") |
| `description` | String | Instructions for students |
| `class` | ObjectId → `classes` | Which class this is for |
| `teacher` | ObjectId → `users` | Who created the assignment |
| `dueDate` | Date | Submission deadline |
| `maxPoints` | Number | Maximum marks (e.g., 100) |
| `attachments` | Array | Attached files (PDF etc.) with `fileName`, `fileType`, `data (Buffer)` |
| `status` | String | "draft" / "published" / "closed" |

**Connected to:**
- `classes` → which class the assignment belongs to
- `users` → teacher who created it
- `submissions` → student answers/submissions link back here
- `grades` → grades are linked to assignments

---

## 7. 📤 `submissions` Collection

**What it stores:** A student's answer/submission for an assignment.

**Think of it as:** The answer sheet. When a student submits a PDF, it is stored here with the file bytes in MongoDB (so it never disappears even if the server restarts).

| Field | Type | Description |
|-------|------|-------------|
| `assignment` | ObjectId → `assignments` | Which assignment this answers |
| `student` | ObjectId → `users` | Which student submitted |
| `class` | ObjectId → `classes` | Which class context |
| `content` | String | Text content or note ("Assignment submission") |
| `attachments` | Array | Uploaded PDF (with `fileName`, `fileType`, `data Buffer`) |
| `submittedAt` | Date | When it was submitted |
| `graded` | Boolean | Has the teacher graded it? |
| `points` | Number | Marks given (e.g., 95) |
| `feedback` | String | Teacher's comment |
| `gradedAt` | Date | When graded |
| `gradedBy` | ObjectId → `users` | Which teacher graded it |

**Connected to:**
- `assignments` → which assignment this answers
- `users` (student) → who submitted
- `users` (gradedBy) → who graded it
- `classes` → class context

---

## 8. 📁 `resources` Collection

**What it stores:** Files uploaded by teachers for students to study (PDFs, Word docs, PPTs, Excel sheets, videos).

**Think of it as:** The class library. A teacher uploads a file and all enrolled students can view or download it.

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Resource title |
| `description` | String | Brief description |
| `class` | ObjectId → `classes` | Which class this belongs to |
| `teacher` | ObjectId → `users` | Who uploaded it |
| `fileName` | String | Original file name |
| `filePath` | String | Server path (legacy) |
| `fileType` | String | MIME type (e.g., application/pdf) |
| `fileSize` | Number | Size in bytes |
| `isActive` | Boolean | Is it visible to students? |

**Connected to:**
- `classes` → shared with this class
- `users` → teacher who uploaded

---

## 9. ✉️ `messages` Collection

**What it stores:** All messages sent between users — inbox/sent messages, meeting notifications, performance alerts.

**Think of it as:** An internal email system. The same collection stores all messages regardless of type. A meeting invite from the Principal is also stored here.

| Field | Type | Description |
|-------|------|-------------|
| `sender` | ObjectId → `users` | Who sent the message |
| `recipients` | [ObjectId → `users`] | Who receives the message (array) |
| `subject` | String | Message subject |
| `content` | String | Full message body (may include meeting links) |
| `isDraft` | Boolean | Is this a draft (not sent yet)? |
| `readBy` | [ObjectId → `users`] | Who has read this message |
| `parentMessage` | ObjectId → `messages` | For reply threads — links to original |

**Connected to:**
- `users` → sender and all recipients
- `messages` (self) → replies reference the parent message

---

## 10. 🎥 `meetings` Collection

**What it stores:** Virtual meeting rooms — created when a teacher/HOD/Principal starts a class or department meeting.

**Think of it as:** A live video conference session. It holds the room code, who is in it, the chat history, and whether it's still active.

| Field | Type | Description |
|-------|------|-------------|
| `roomCode` | String | Unique code like `abc-defg-hij` |
| `title` | String | Meeting title |
| `host` | ObjectId → `users` | Who created/started the meeting |
| `hostName` | String | Name of host (cached) |
| `hostRole` | String | Role of host (teacher/hod/etc.) |
| `classId` | ObjectId → `classes` | Linked class (if a class meeting) |
| `audience` | String | "class-students" / "all-hods" / "department-teachers" |
| `meetingLink` | String | Full URL to the meeting room page |
| `isActive` | Boolean | Is the meeting currently live? |
| `endedAt` | Date | When it was ended |
| `participants` | Array | All users in the room with status (pending/accepted), mic/cam state, lastSeen |
| `chat` | Array | All chat messages with senderName, message, createdAt |

**Connected to:**
- `users` → host, and each participant's userId
- `classes` → if it's a class meeting (classId)

---

## 11. 📢 `announcements` Collection

**What it stores:** College-wide announcements created by the Principal. These appear on ALL dashboards.

**Think of it as:** A noticeboard that every student, teacher, and HOD can see.

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Announcement title |
| `content` | String | Full announcement text |
| `priority` | String | "high" / "medium" / "low" |
| `createdBy` | ObjectId → `users` | The Principal who created it |
| `isActive` | Boolean | Is it currently visible? |
| `expiresAt` | Date | Optional expiry date |

**Connected to:**
- `users` → createdBy (Principal)

---

## 12. ✅ `approvalrequests` Collection

**What it stores:** Event requests sent by HODs to the Principal for approval.

**Think of it as:** A request form. HOD fills it and sends to Principal. Principal either approves or rejects.

| Field | Type | Description |
|-------|------|-------------|
| `requestedBy` | ObjectId → `users` | HOD who sent the request |
| `requestType` | String | Type of request (e.g., "event") |
| `title` | String | Event name or title |
| `description` | String | Details of the request |
| `eventDate` | Date | When the event is planned |
| `status` | String | "pending" / "approved" / "rejected" |
| `reviewedBy` | ObjectId → `users` | Principal who reviewed |
| `reviewNotes` | String | Principal's comments |
| `department` | String | Which department made the request |

**Connected to:**
- `users` → requestedBy (HOD) and reviewedBy (Principal)

---

## 13. 🎓 `enrollmentrequests` Collection

**What it stores:** Student requests to join a class.

**Think of it as:** A registration form. When a student wants to join a class, they send an enrollment request. The teacher/HOD accepts or rejects it.

| Field | Type | Description |
|-------|------|-------------|
| `student` | ObjectId → `users` | Who is requesting |
| `class` | ObjectId → `classes` | Which class to join |
| `subject` | ObjectId → `subjects` | Which subject |
| `status` | String | "pending" / "accepted" / "rejected" |
| `requestDate` | Date | When the request was made |
| `responseDate` | Date | When it was approved/rejected |

**Connected to:**
- `users` → student
- `classes` → which class
- `subjects` → which subject

---

## 14. 📊 `grades` Collection

**What it stores:** Grade records given by teachers to students for specific assignments.

**Think of it as:** The gradebook. Each entry is one mark given to one student for one assignment.

| Field | Type | Description |
|-------|------|-------------|
| `student` | ObjectId → `users` | Which student |
| `teacher` | ObjectId → `users` | Which teacher gave the grade |
| `class` | ObjectId → `classes` | Which class |
| `assignment` | ObjectId → `assignments` | Which assignment |
| `score` | Number | Marks obtained |
| `maxScore` | Number | Maximum possible marks |
| `feedback` | String | Teacher's remarks |
| `gradedAt` | Date | When it was graded |

**Connected to:**
- `users` → student and teacher
- `classes` → class context
- `assignments` → which assignment was graded

---

## 15. 📈 `departmentgrades` Collection

**What it stores:** Department-level CGPA summary for each student.

**Think of it as:** A summary card for the HOD showing each student's overall CGPA for their department.

| Field | Type | Description |
|-------|------|-------------|
| `student` | ObjectId → `users` | Which student |
| `department` | String | Department name |
| `cgpa` | Number | Overall CGPA |
| `semester` | Number | Current semester |
| `academicYear` | String | e.g., "2024-2025" |

**Connected to:**
- `users` → student

---

## 16. 📅 `attendances` Collection

**What it stores:** Attendance records — which students attended which classes.

**Think of it as:** The register. Each time a class is held, attendance is marked (often using face recognition).

| Field | Type | Description |
|-------|------|-------------|
| `class` | ObjectId → `classes` | Which class |
| `teacher` | ObjectId → `users` | Teacher who took attendance |
| `date` | Date | Date of the class |
| `presentStudents` | [ObjectId → `users`] | List of students who were present |
| `absentStudents` | [ObjectId → `users`] | List of students who were absent |
| `totalStudents` | Number | Total enrolled students |

**Connected to:**
- `classes` → which class session
- `users` → teacher, present students, absent students

---

## 17. 📋 `activitylogs` Collection

**What it stores:** A full audit trail — every important action in the system is logged here.

**Think of it as:** Security camera footage for the entire system. Every login, assignment creation, grade update, meeting start, and user creation gets logged with who did it, when, and from which IP address.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId → `users` | Who performed the action |
| `userName` | String | Name (cached for display) |
| `action` | String | Action code (e.g., "login", "assignment_created") |
| `actionLabel` | String | Human-readable label |
| `description` | String | Full description of what happened |
| `ipAddress` | String | IP address of the user |
| `status` | String | "success" / "failed" |
| `metadata` | Object | Extra data (role, department, IDs etc.) |

**Connected to:**
- `users` → userId (who did the action)

---

---

## 🔗 COMPLETE REFERENCE (FOREIGN KEY) MAP

This table shows every cross-collection link — equivalent to foreign keys in SQL.

| Collection | Field | Points To | Meaning |
|-----------|-------|-----------|---------|
| `users` | `program` | `programs` | Student's academic program |
| `departments` | `program` | `programs` | Department's program |
| `departments` | `hod` | `users` | HOD of the department |
| `subjects` | `teacher` | `users` | Assigned teacher |
| `classes` | `subject` | `subjects` | What subject is taught |
| `classes` | `teacher` | `users` | Who teaches the class |
| `classes` | `students[]` | `users` | Enrolled students |
| `assignments` | `class` | `classes` | Class this assignment is for |
| `assignments` | `teacher` | `users` | Teacher who created it |
| `submissions` | `assignment` | `assignments` | Which assignment answered |
| `submissions` | `student` | `users` | Who submitted |
| `submissions` | `class` | `classes` | Class context |
| `submissions` | `gradedBy` | `users` | Who graded it |
| `resources` | `class` | `classes` | Class this resource is for |
| `resources` | `teacher` | `users` | Teacher who uploaded |
| `messages` | `sender` | `users` | Who sent the message |
| `messages` | `recipients[]` | `users` | Who receives it |
| `messages` | `readBy[]` | `users` | Who has read it |
| `messages` | `parentMessage` | `messages` | Original message (for replies) |
| `meetings` | `host` | `users` | Who started the meeting |
| `meetings` | `classId` | `classes` | Linked class |
| `meetings` | `participants[].userId` | `users` | Each participant |
| `announcements` | `createdBy` | `users` | Principal who wrote it |
| `approvalrequests` | `requestedBy` | `users` | HOD who sent request |
| `approvalrequests` | `reviewedBy` | `users` | Principal who reviewed |
| `enrollmentrequests` | `student` | `users` | Student requesting |
| `enrollmentrequests` | `class` | `classes` | Class to join |
| `enrollmentrequests` | `subject` | `subjects` | Subject context |
| `grades` | `student` | `users` | Student being graded |
| `grades` | `teacher` | `users` | Teacher giving grade |
| `grades` | `class` | `classes` | Class context |
| `grades` | `assignment` | `assignments` | Assignment being graded |
| `departmentgrades` | `student` | `users` | Student this CGPA is for |
| `attendances` | `class` | `classes` | Class session |
| `attendances` | `teacher` | `users` | Teacher who took attendance |
| `attendances` | `presentStudents[]` | `users` | Present students |
| `attendances` | `absentStudents[]` | `users` | Absent students |
| `activitylogs` | `userId` | `users` | User who did the action |

---

## 🔄 HOW DATA FLOWS — COMPLETE WORKING SCENARIOS

### Scenario 1: Teacher Creates and Students Submit an Assignment
```
1. Teacher creates → ASSIGNMENTS collection stores:
   {title, description, class, teacher, dueDate, maxPoints, attachments[PDF]}

2. Student fetches assignments → API reads ASSIGNMENTS filtered by class
   → joins with USERS (teacher name) and CLASSES (class name)

3. Student submits PDF → SUBMISSIONS collection stores:
   {assignment, student, class, content, attachments[PDF bytes], submittedAt}

4. Teacher views submissions → API reads SUBMISSIONS filtered by assignment
   → joins with USERS (student name, roll number)

5. Teacher grades → SUBMISSIONS updated:
   {graded: true, points: 95, feedback: "Good work", gradedBy, gradedAt}

6. Student's dashboard shows assignment in "Completed" tab ✅
```

### Scenario 2: Teacher Starts a Virtual Class Meeting
```
1. Teacher clicks "Start Class" → MEETINGS collection stores:
   {roomCode, title, host, classId, meetingLink, isActive: true}

   → CLASSES updated: {meetingLink: "https://.../meeting-room.html?room=abc-def"}

2. MESSAGES collection stores a notification to all students in the class

3. Student dashboard polls /api/classes every 5s → sees meetingLink → shows Join button

4. Student opens meeting → sends join request
   → MEETINGS.participants[] → {userId, status: "pending"}

5. Teacher accepts → MEETINGS.participants[].status = "accepted"

6. Teacher clicks End → MEETINGS: {isActive: false, endedAt: now}
   → CLASSES: {meetingLink: ""} → Student sees "Class Completed" ✅
```

### Scenario 3: Principal Creates Announcement
```
1. Principal creates → ANNOUNCEMENTS collection stores:
   {title, content, priority: "high", createdBy: principalId, isActive: true}

2. Every dashboard (student, teacher, HOD) fetches /api/announcements
   → shows announcement with priority badge (High/Medium/Low)
```

### Scenario 4: HOD Requests an Event, Principal Approves
```
1. HOD submits → APPROVALREQUESTS stores:
   {requestedBy: hodId, title: "Annual Fest", status: "pending"}

2. Principal sees it in Approvals section → clicks Approve
   → APPROVALREQUESTS updated: {status: "approved", reviewedBy: principalId}

3. MESSAGES collection stores a notification to the HOD

4. HOD gets notification: "Your event request was approved" ✅
```

### Scenario 5: Admin Adds a Student
```
1. Admin fills form → USERS collection stores:
   {name, email, password (bcrypt hash), role: "student",
    studentId: "44", program, department, semesterCgpas: []}

2. ACTIVITYLOGS stores:
   {userId: adminId, action: "user_creation", description: "New student registered"}

3. Student can now log in and sees their empty dashboard
```

---

## 📊 COLLECTION SIZE COMPARISON (Typical)

| Collection | Grows with | Expected Size |
|-----------|-----------|---------------|
| `users` | Every new student/teacher | Hundreds |
| `messages` | Every notification + message | Thousands |
| `activitylogs` | Every user action | Tens of thousands |
| `classes` | Each class section | Dozens |
| `assignments` | Each assignment created | Hundreds |
| `submissions` | Each student submission | Thousands |
| `meetings` | Each meeting started | Hundreds |
| `announcements` | Each announcement | Small |
| `programs` | Each degree program | Very small (5–10) |
| `departments` | Each department | Small (10–20) |

---

## 🗝️ KEY DESIGN DECISIONS

1. **All 5 user roles share ONE `users` collection** — distinguished by the `role` field. This makes it easy to message any user and reference them uniformly.

2. **Files stored as `Buffer` in MongoDB** — assignment PDFs and submission files are stored directly in the database (not on disk), so they survive server restarts.

3. **Meeting links stored in `classes`** — when a teacher starts a class, the link is saved to the Class document so the student dashboard can auto-detect it by polling `/api/classes` every 5 seconds.

4. **Messages serve dual purpose** — the same `messages` collection stores both personal messages AND meeting invitation notifications (detected by the subject containing "Live Meeting").

5. **Activity logs for audit trail** — every login, grade change, and meeting start is logged with IP address so admins can review what happened and when.

---

*This document was created for the EduConnect Final Year Project.*
*Developer: Souvik Pachal*
