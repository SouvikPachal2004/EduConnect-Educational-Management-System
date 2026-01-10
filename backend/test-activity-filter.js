const fetch = require('node-fetch');

// Test the activity logs API endpoint with date filtering
async function testActivityLogsFilter() {
  try {
    console.log('Testing activity logs API with date filter...');
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('Today\'s date:', today);
    
    const url = `http://localhost:5002/api/activity-logs?limit=50&startDate=${today}&endDate=${today}`;
    console.log('API URL:', url);
    
    // Note: This test won't work without authentication, but we can at least see the URL format
    
  } catch (error) {
    console.error('Error testing activity logs filter:', error);
  }
}

testActivityLogsFilter();