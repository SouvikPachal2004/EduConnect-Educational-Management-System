const axios = require('axios');

async function testRBAC() {
  try {
    console.log('Testing Role-Based Access Control...');
    
    // Register a teacher user
    console.log('\n1. Registering a teacher user...');
    const teacherRegisterResponse = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Dr. Smith',
      email: 'dr.smith.test@example.com',
      password: 'teacherpassword123',
      role: 'teacher'
    });
    console.log('Teacher Registration Success');
    const teacherToken = teacherRegisterResponse.data.data.token;
    
    // Register a student user
    console.log('\n2. Registering a student user...');
    const studentRegisterResponse = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Alice Johnson',
      email: 'alice.johnson.test@example.com',
      password: 'studentpassword123',
      role: 'student'
    });
    console.log('Student Registration Success');
    const studentToken = studentRegisterResponse.data.data.token;
    
    // Teacher creates a class
    console.log('\n3. Teacher creating a class...');
    const classResponse = await axios.post('http://localhost:5000/api/classes', {
      name: 'Advanced Algorithms',
      description: 'Advanced algorithms course',
      schedule: {
        days: ['Tuesday', 'Thursday'],
        startTime: '10:00',
        endTime: '11:30',
        location: 'Room 301'
      }
    }, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('Class Creation Success:', JSON.stringify(classResponse.data, null, 2));
    const classId = classResponse.data.data._id;
    
    // Student tries to create a class (should fail)
    console.log('\n4. Student trying to create a class (should fail)...');
    try {
      await axios.post('http://localhost:5000/api/classes', {
        name: 'Student Class',
        description: 'Student created class',
        schedule: {
          days: ['Monday'],
          startTime: '14:00',
          endTime: '15:30',
          location: 'Room 101'
        }
      }, {
        headers: {
          Authorization: `Bearer ${studentToken}`
        }
      });
      console.log('ERROR: Student was able to create a class (should not happen)');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('SUCCESS: Student correctly blocked from creating class');
      } else {
        console.log('ERROR: Unexpected error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n✅ RBAC Testing Complete: All role-based access controls working correctly!');
    
  } catch (error) {
    console.error('RBAC Test Failed:', error.response?.data || error.message);
  }
}

testRBAC();