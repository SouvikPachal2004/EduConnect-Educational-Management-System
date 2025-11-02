const axios = require('axios');

async function testRegistration() {
  try {
    console.log('Testing registration...');
    const timestamp = Date.now();
    const response = await axios.post('http://localhost:5001/api/auth/register', {
      name: 'Test User',
      email: `test.${timestamp}@example.com`,
      password: 'password123',
      role: 'student'
    });
    console.log('Registration Success:', response.data);
  } catch (error) {
    console.error('Registration Failed:', error.response?.data || error.message);
  }
}

testRegistration();