const { launchFaceRecognition } = require('./scripts/launch_face_recognition');

// Test the face recognition launch function
async function testFaceRecognitionLaunch() {
  try {
    console.log('Testing face recognition launch...');
    
    // Test with sample data
    const result = await launchFaceRecognition('test-class-id', '2025-12-14', 'test-auth-token');
    console.log('Face recognition launch result:', result);
  } catch (error) {
    console.error('Error testing face recognition launch:', error);
  }
}

// Run the test
testFaceRecognitionLaunch();