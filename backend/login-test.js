const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
      role: 'student'
    });
    console.log('Login Success:', response.data);
    
    // Test getting current user with the token
    const token = response.data.data.token;
    console.log('\nTesting get current user...');
    const userResponse = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Get Current User Success:', userResponse.data);
  } catch (error) {
    console.error('Test Failed:', error.response?.data || error.message);
  }
}

testLogin();