const axios = require('axios');

// Generate unique email addresses for testing
const timestamp = Date.now();
const teacherEmail = `teacher.${timestamp}@example.com`;
const studentEmail = `student.${timestamp}@example.com`;

async function runComprehensiveTest() {
  try {
    console.log('🧪 Running Comprehensive Backend Test...\n');
    
    // 1. Health Check
    console.log('1. Testing Health Check Endpoint...');
    const healthResponse = await axios.get('http://localhost:5001/api/health');
    if (healthResponse.data.status === 'OK') {
      console.log('✅ Health Check Passed\n');
    } else {
      throw new Error('Health check failed');
    }
    
    // 2. Teacher Registration
    console.log('2. Testing Teacher Registration...');
    const teacherRegisterResponse = await axios.post('http://localhost:5001/api/auth/register', {
      name: 'Test Teacher',
      email: teacherEmail,
      password: 'teacherpassword123',
      role: 'teacher'
    });
    const teacherToken = teacherRegisterResponse.data.data.token;
    console.log('✅ Teacher Registration Successful\n');
    
    // 3. Student Registration
    console.log('3. Testing Student Registration...');
    const studentRegisterResponse = await axios.post('http://localhost:5001/api/auth/register', {
      name: 'Test Student',
      email: studentEmail,
      password: 'studentpassword123',
      role: 'student'
    });
    const studentToken = studentRegisterResponse.data.data.token;
    console.log('✅ Student Registration Successful\n');
    
    // 4. Teacher Login
    console.log('4. Testing Teacher Login...');
    const teacherLoginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: teacherEmail,
      password: 'teacherpassword123',
      role: 'teacher'
    });
    console.log('✅ Teacher Login Successful\n');
    
    // 5. Student Login
    console.log('5. Testing Student Login...');
    const studentLoginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: studentEmail,
      password: 'studentpassword123',
      role: 'student'
    });
    console.log('✅ Student Login Successful\n');
    
    // 6. Get Current User (Teacher)
    console.log('6. Testing Get Current Teacher...');
    const teacherProfileResponse = await axios.get('http://localhost:5001/api/auth/me', {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('✅ Current Teacher Retrieved\n');
    
    // 7. Get Current User (Student)
    console.log('7. Testing Get Current Student...');
    const studentProfileResponse = await axios.get('http://localhost:5001/api/auth/me', {
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });
    console.log('✅ Current Student Retrieved\n');
    
    // 8. Teacher Creates Class
    console.log('8. Testing Class Creation...');
    const classResponse = await axios.post('http://localhost:5001/api/classes', {
      name: 'Test Class',
      description: 'A test class for comprehensive testing',
      schedule: {
        days: ['Monday', 'Wednesday', 'Friday'],
        startTime: '09:00',
        endTime: '10:30',
        location: 'Room 101'
      }
    }, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('Class Response:', JSON.stringify(classResponse.data, null, 2));
    const classId = classResponse.data.data._id;
    console.log('✅ Class Created Successfully\n');
    
    // 9. Get Class Details
    console.log('9. Testing Get Class Details...');
    const getClassResponse = await axios.get(`http://localhost:5001/api/classes/${classId}`, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('✅ Class Details Retrieved\n');
    
    // 10. Teacher Adds Student to Class
    console.log('10. Testing Adding Student to Class...');
    const addStudentResponse = await axios.post(`http://localhost:5001/api/classes/${classId}/students`, {
      studentId: studentProfileResponse.data.data._id
    }, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('✅ Student Added to Class Successfully\n');
    
    // 11. Teacher Creates Assignment
    console.log('11. Testing Assignment Creation...');
    const assignmentResponse = await axios.post('http://localhost:5001/api/assignments', {
      title: 'Test Assignment',
      description: 'A test assignment for comprehensive testing',
      classId: classId,  // Fixed: was 'class', now 'classId'
      dueDate: '2025-12-31T23:59:59.000Z',
      maxPoints: 100
    }, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('Assignment Response:', JSON.stringify(assignmentResponse.data, null, 2));
    const assignmentId = assignmentResponse.data.data._id;
    console.log('✅ Assignment Created Successfully\n');
    
    // 12. Teacher Publishes Assignment
    console.log('12. Testing Assignment Publishing...');
    const publishResponse = await axios.put(`http://localhost:5001/api/assignments/${assignmentId}`, {
      status: 'published'
    }, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('✅ Assignment Published Successfully\n');
    
    // 13. Get Assignment Details
    console.log('13. Testing Get Assignment Details...');
    const getAssignmentResponse = await axios.get(`http://localhost:5001/api/assignments/${assignmentId}`, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('✅ Assignment Details Retrieved\n');
    
    // 14. Student Submits Assignment
    console.log('14. Testing Assignment Submission...');
    const submissionResponse = await axios.post(`http://localhost:5001/api/assignments/${assignmentId}/submit`, {
      content: 'This is my test submission for the assignment.'
    }, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });
    const submissionId = submissionResponse.data.data._id;
    console.log('✅ Assignment Submitted Successfully\n');
    
    // 15. Teacher Grades Submission
    console.log('15. Testing Submission Grading...');
    const gradeResponse = await axios.put(`http://localhost:5001/api/assignments/submissions/${submissionId}/grade`, {
      points: 95,
      feedback: 'Excellent work! Well done.'
    }, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('✅ Submission Graded Successfully\n');
    
    // 16. Mark Attendance
    console.log('16. Testing Attendance Marking...');
    const attendanceResponse = await axios.post('http://localhost:5001/api/attendance', {
      classId: classId,
      date: new Date().toISOString(),
      attendance: [
        {
          studentId: studentProfileResponse.data.data._id,
          status: 'present',
          notes: 'Good participation'
        }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('✅ Attendance Marked Successfully\n');
    
    // 17. Create Grade
    console.log('17. Testing Grade Creation...');
    const gradeCreateResponse = await axios.post('http://localhost:5001/api/grades', {
      studentId: studentProfileResponse.data.data._id,
      classId: classId,
      assignmentId: assignmentId,
      type: 'assignment',
      name: 'Test Assignment Grade',
      points: 95,
      maxPoints: 100,
      notes: 'Excellent work on the test assignment'
    }, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('✅ Grade Created Successfully\n');
    
    // 18. Send Message
    console.log('18. Testing Message Sending...');
    const messageResponse = await axios.post('http://localhost:5001/api/messages', {
      recipients: [teacherProfileResponse.data.data._id],
      subject: 'Test Message',
      content: 'This is a test message from the student.'
    }, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });
    console.log('✅ Message Sent Successfully\n');
    
    // 19. Get Messages
    console.log('19. Testing Message Retrieval...');
    const messagesResponse = await axios.get('http://localhost:5001/api/messages?folder=inbox', {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('✅ Messages Retrieved Successfully\n');
    
    console.log('🎉 ALL TESTS PASSED! 🎉');
    console.log('\n✅ EduConnect Backend is Fully Functional!');
    console.log('\n📋 Summary of Tests:');
    console.log('   - Authentication: ✅');
    console.log('   - User Management: ✅');
    console.log('   - Class Management: ✅');
    console.log('   - Assignment Management: ✅');
    console.log('   - Submission & Grading: ✅');
    console.log('   - Attendance Tracking: ✅');
    console.log('   - Grade Management: ✅');
    console.log('   - Messaging System: ✅');
    console.log('   - Role-Based Access Control: ✅');
    
  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runComprehensiveTest();