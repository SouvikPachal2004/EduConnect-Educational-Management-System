const fetch = require('node-fetch');

// Test the activity logs API endpoint
async function testActivityLogsAPI() {
  try {
    console.log('Testing activity logs API endpoint...');
    
    const response = await fetch('http://localhost:5002/api/activity-logs?limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data && data.data.logs) {
      console.log(`Found ${data.data.logs.length} activity logs via API:`);
      data.data.logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.timestamp} - ${log.userName} - ${log.actionLabel} - ${log.description}`);
      });
    } else {
      console.log('No logs found or error in response');
    }
  } catch (error) {
    console.error('Error testing activity logs API:', error);
  }
}

testActivityLogsAPI();