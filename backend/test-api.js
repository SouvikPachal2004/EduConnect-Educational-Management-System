const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDZmOWRlYjYwYjBjMDBlNzI5OGI5NSIsImVtYWlsIjoiYW51cmFnQHN0dWRlbnQuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NjIwNjUwMzksImV4cCI6MTc2NDY1NzAzOX0.LfpAEm0YpuqTChqggILXNkdoCuUy8n12cR3FEt0KBVQ';

async function testAPI() {
  try {
    // Test auth/me endpoint
    console.log('Testing /api/auth/me endpoint...');
    const authResponse = await fetch('http://localhost:5001/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const authData = await authResponse.json();
    console.log('Auth response:', JSON.stringify(authData, null, 2));
    
    // Test classes endpoint
    console.log('\nTesting /api/classes endpoint...');
    const classesResponse = await fetch('http://localhost:5001/api/classes', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const classesData = await classesResponse.json();
    console.log('Classes response:', JSON.stringify(classesData, null, 2));
    
    // Test assignments endpoint
    console.log('\nTesting /api/assignments endpoint...');
    const assignmentsResponse = await fetch('http://localhost:5001/api/assignments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const assignmentsData = await assignmentsResponse.json();
    console.log('Assignments response:', JSON.stringify(assignmentsData, null, 2));
    
    console.log('\nAPI testing completed!');
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();