# EduConnect Backend API Demo

This document demonstrates how to use the EduConnect backend API with example requests.

## 1. User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "securepassword123",
    "role": "student"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "68e8a6dc5c58b7086c18c231",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "student",
      "studentId": "STU1760077532352"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 2. User Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepassword123",
    "role": "student"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "68e8a6dc5c58b7086c18c231",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "student",
      "studentId": "STU1760077532352"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 3. Get Current User (Protected Route)

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Response:
```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": {
    "_id": "68e8a6dc5c58b7086c18c231",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "student",
    "isActive": true,
    "studentId": "STU1760077532352",
    "createdAt": "2025-10-10T06:25:32.359Z",
    "updatedAt": "2025-10-10T06:26:07.372Z",
    "lastLogin": "2025-10-10T06:26:07.369Z"
  }
}
```

## 4. Create a Class (Teacher Role Required)

```bash
curl -X POST http://localhost:5000/api/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Data Structures",
    "description": "Introduction to data structures and algorithms",
    "schedule": {
      "days": ["Monday", "Wednesday", "Friday"],
      "startTime": "09:00",
      "endTime": "10:30",
      "location": "Room 205"
    }
  }'
```

Response:
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "_id": "68e8a6dc5c58b7086c18c232",
    "name": "Data Structures",
    "code": "A1B2C3D4",
    "description": "Introduction to data structures and algorithms",
    "teacher": {
      "_id": "68e8a6dc5c58b7086c18c231",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "students": [],
    "schedule": {
      "days": ["Monday", "Wednesday", "Friday"],
      "startTime": "09:00",
      "endTime": "10:30",
      "location": "Room 205"
    },
    "isActive": true,
    "createdAt": "2025-10-10T06:30:00.000Z",
    "updatedAt": "2025-10-10T06:30:00.000Z"
  }
}
```

## 5. Create an Assignment (Teacher Role Required)

```bash
curl -X POST http://localhost:5000/api/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "title": "Binary Trees Implementation",
    "description": "Implement binary tree data structure with insertion, deletion, and traversal methods",
    "class": "68e8a6dc5c58b7086c18c232",
    "dueDate": "2025-10-20T23:59:59.000Z",
    "maxPoints": 100
  }'
```

Response:
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "_id": "68e8a6dc5c58b7086c18c233",
    "title": "Binary Trees Implementation",
    "description": "Implement binary tree data structure with insertion, deletion, and traversal methods",
    "class": {
      "_id": "68e8a6dc5c58b7086c18c232",
      "name": "Data Structures",
      "code": "A1B2C3D4"
    },
    "teacher": {
      "_id": "68e8a6dc5c58b7086c18c231",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "dueDate": "2025-10-20T23:59:59.000Z",
    "maxPoints": 100,
    "status": "draft",
    "createdAt": "2025-10-10T06:35:00.000Z",
    "updatedAt": "2025-10-10T06:35:00.000Z"
  }
}
```

## 6. Submit Assignment (Student Role Required)

```bash
curl -X POST http://localhost:5000/api/assignments/68e8a6dc5c58b7086c18c233/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "content": "I have completed the binary trees implementation. Please find the attached code files."
  }'
```

Response:
```json
{
  "success": true,
  "message": "Assignment submitted successfully",
  "data": {
    "_id": "68e8a6dc5c58b7086c18c234",
    "assignment": {
      "_id": "68e8a6dc5c58b7086c18c233",
      "title": "Binary Trees Implementation"
    },
    "student": {
      "_id": "68e8a6dc5c58b7086c18c231",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "class": {
      "_id": "68e8a6dc5c58b7086c18c232",
      "name": "Data Structures"
    },
    "content": "I have completed the binary trees implementation. Please find the attached code files.",
    "submittedAt": "2025-10-10T06:40:00.000Z",
    "graded": false,
    "createdAt": "2025-10-10T06:40:00.000Z",
    "updatedAt": "2025-10-10T06:40:00.000Z"
  }
}
```

## 7. Mark Attendance (Teacher Role Required)

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "classId": "68e8a6dc5c58b7086c18c232",
    "date": "2025-10-10T00:00:00.000Z",
    "attendance": [
      {
        "studentId": "68e8a6dc5c58b7086c18c231",
        "status": "present",
        "notes": "Good participation"
      }
    ]
  }'
```

Response:
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": [
    {
      "_id": "68e8a6dc5c58b7086c18c235",
      "class": "68e8a6dc5c58b7086c18c232",
      "student": "68e8a6dc5c58b7086c18c231",
      "date": "2025-10-10T00:00:00.000Z",
      "status": "present",
      "notes": "Good participation",
      "markedBy": "68e8a6dc5c58b7086c18c231",
      "createdAt": "2025-10-10T06:45:00.000Z",
      "updatedAt": "2025-10-10T06:45:00.000Z"
    }
  ]
}
```

## 8. Create Grade (Teacher Role Required)

```bash
curl -X POST http://localhost:5000/api/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "studentId": "68e8a6dc5c58b7086c18c231",
    "classId": "68e8a6dc5c58b7086c18c232",
    "assignmentId": "68e8a6dc5c58b7086c18c233",
    "type": "assignment",
    "name": "Binary Trees Implementation",
    "points": 95,
    "maxPoints": 100,
    "notes": "Excellent work with clean code and thorough documentation"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Grade created successfully",
  "data": {
    "_id": "68e8a6dc5c58b7086c18c236",
    "student": {
      "_id": "68e8a6dc5c58b7086c18c231",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "studentId": "STU1760077532352"
    },
    "class": {
      "_id": "68e8a6dc5c58b7086c18c232",
      "name": "Data Structures"
    },
    "assignment": "68e8a6dc5c58b7086c18c233",
    "type": "assignment",
    "name": "Binary Trees Implementation",
    "points": 95,
    "maxPoints": 100,
    "percentage": 95,
    "letterGrade": "A",
    "gradedBy": {
      "_id": "68e8a6dc5c58b7086c18c231",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "notes": "Excellent work with clean code and thorough documentation",
    "createdAt": "2025-10-10T06:50:00.000Z",
    "updatedAt": "2025-10-10T06:50:00.000Z"
  }
}
```

## 9. Send Message

```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "recipients": ["68e8a6dc5c58b7086c18c231"],
    "subject": "Assignment Feedback",
    "content": "Great work on your binary trees implementation. I have some suggestions for improvement..."
  }'
```

Response:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "68e8a6dc5c58b7086c18c237",
    "sender": {
      "_id": "68e8a6dc5c58b7086c18c231",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "recipients": [
      {
        "_id": "68e8a6dc5c58b7086c18c231",
        "name": "John Doe",
        "email": "john.doe@example.com"
      }
    ],
    "subject": "Assignment Feedback",
    "content": "Great work on your binary trees implementation. I have some suggestions for improvement...",
    "isRead": false,
    "readBy": [],
    "isDraft": false,
    "isDeleted": false,
    "createdAt": "2025-10-10T06:55:00.000Z",
    "updatedAt": "2025-10-10T06:55:00.000Z"
  }
}
```

## 10. Get Messages

```bash
curl -X GET "http://localhost:5000/api/messages?folder=inbox" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Response:
```json
{
  "success": true,
  "message": "Messages fetched successfully",
  "data": {
    "messages": [
      {
        "_id": "68e8a6dc5c58b7086c18c237",
        "sender": {
          "_id": "68e8a6dc5c58b7086c18c231",
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "recipients": [
          {
            "_id": "68e8a6dc5c58b7086c18c231",
            "name": "John Doe",
            "email": "john.doe@example.com"
          }
        ],
        "subject": "Assignment Feedback",
        "content": "Great work on your binary trees implementation. I have some suggestions for improvement...",
        "isRead": false,
        "readBy": [],
        "isDraft": false,
        "isDeleted": false,
        "createdAt": "2025-10-10T06:55:00.000Z",
        "updatedAt": "2025-10-10T06:55:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

## Conclusion

This demo shows the core functionality of the EduConnect backend API. The API supports all the essential features needed for a virtual classroom platform, including user management, class management, assignments, attendance, grades, and messaging. All endpoints are protected with JWT authentication and role-based access control to ensure data security and appropriate permissions.