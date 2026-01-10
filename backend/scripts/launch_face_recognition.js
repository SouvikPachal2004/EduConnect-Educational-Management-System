const { spawn } = require('child_process');
const path = require('path');

/**
 * Launch face recognition system
 * @param {string} classId - Class ID for attendance
 * @param {string} date - Date for attendance
 * @param {string} authToken - Authentication token
 * @returns {Promise} Promise that resolves when the process completes
 */
function launchFaceRecognition(classId, date, authToken) {
  return new Promise((resolve, reject) => {
    // Path to the face recognition script
    const faceRecognitionScript = path.join(__dirname, '../../face/take_attendance.py');
    
    // Arguments to pass to the script
    const args = [
      faceRecognitionScript,
      '--class-id', classId,
      '--date', date,
      '--auth-token', authToken
    ];
    
    console.log('Launching face recognition system with args:', args);
    
    // Spawn the Python process
    const pythonProcess = spawn('python', args, {
      cwd: path.join(__dirname, '../../face')
    });
    
    // Handle stdout
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Face recognition stdout: ${data}`);
    });
    
    // Handle stderr
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Face recognition stderr: ${data}`);
    });
    
    // Handle process close
    pythonProcess.on('close', (code) => {
      console.log(`Face recognition process exited with code ${code}`);
      if (code === 0) {
        resolve({ success: true, message: 'Face recognition completed successfully' });
      } else {
        reject(new Error(`Face recognition failed with exit code ${code}`));
      }
    });
    
    // Handle process error
    pythonProcess.on('error', (error) => {
      console.error('Failed to start face recognition process:', error);
      reject(error);
    });
  });
}

module.exports = { launchFaceRecognition };