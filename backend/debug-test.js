const axios = require('axios');

// Generate unique email addresses for testing
const timestamp = Date.now();
const teacherEmail = `teacher.${timestamp}@example.com`;

async function debugTest() {
  try {
    console.log('Debugging class issue...\n');
    
    // Register a teacher user
    console.log('1. Registering teacher...');
    const teacherRegisterResponse = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Debug Teacher',
      email: teacherEmail,
      password: 'teacherpassword123',
      role: 'teacher'
    });
    const teacherToken = teacherRegisterResponse.data.data.token;
    console.log('✅ Teacher registered\n');
    
    // Create a class
    console.log('2. Creating class...');
    const classResponse = await axios.post('http://localhost:5000/api/classes', {
      name: 'Debug Class',
      description: 'A debug class',
      schedule: {
        days: ['Monday'],
        startTime: '09:00',
        endTime: '10:30',
        location: 'Room 101'
      }
    }, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    const classId = classResponse.data.data._id;
    console.log('Class ID:', classId);
    console.log('✅ Class created\n');
    
    // Try to get the class
    console.log('3. Getting class...');
    const getClassResponse = await axios.get(`http://localhost:5000/api/classes/${classId}`, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    console.log('Get class response:', JSON.stringify(getClassResponse.data, null, 2));
    console.log('✅ Class retrieved\n');
    
    // Try to create an assignment with the class ID
    console.log('4. Creating assignment...');
    try {
      const assignmentResponse = await axios.post('http://localhost:5000/api/assignments', {
        title: 'Debug Assignment',
        description: 'A debug assignment',
        classId: classId,  // Fixed: was 'class', now 'classId'
        dueDate: '2025-12-31T23:59:59.000Z',
        maxPoints: 100
      }, {
        headers: {
          Authorization: `Bearer ${teacherToken}`
        }
      });
      console.log('Assignment response:', JSON.stringify(assignmentResponse.data, null, 2));
      console.log('✅ Assignment created\n');
    } catch (error) {
      console.log('Assignment creation failed:', error.response?.data || error.message);
      
      // Let's try to get all classes to see if our class is there
      console.log('\n5. Getting all classes...');
      const allClassesResponse = await axios.get('http://localhost:5000/api/classes', {
        headers: {
          Authorization: `Bearer ${teacherToken}`
        }
      });
      console.log('All classes:', JSON.stringify(allClassesResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('Debug test failed:', error.response?.data || error.message);
  }
}

debugTest();