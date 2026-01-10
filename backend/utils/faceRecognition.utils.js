/**
 * Utility functions for face recognition system integration
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Launch the main face recognition GUI application
 * @param {string} classId - EduConnect class ID
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} Result of the operation
 */
const launchFaceRecognitionGUI = async (classId, authToken) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Launching face recognition GUI for class ${classId}`);
      
      // Path to the face recognition folder
      const faceRecognitionPath = path.join(__dirname, '../../face');
      
      // Check if the face recognition folder exists
      if (!fs.existsSync(faceRecognitionPath)) {
        return reject(new Error('Face recognition system not found'));
      }
      
      // Change to the face recognition directory
      const pythonScriptPath = path.join(faceRecognitionPath, 'gui_launcher.py');
      
      // Check if the Python script exists
      if (!fs.existsSync(pythonScriptPath)) {
        return reject(new Error('Face recognition GUI script not found'));
      }
      
      // Command to run the Python script
      const command = 'python';
      const args = [
        pythonScriptPath,
        '--class-id', classId,
        '--auth-token', authToken
      ];
      
      console.log('Launching face recognition GUI command:', command, args.join(' '));
      
      // Spawn the Python process (detached so it runs independently)
      const pythonProcess = spawn(command, args, {
        cwd: faceRecognitionPath,
        detached: true, // Run in background
        stdio: 'ignore' // Ignore stdio to prevent blocking
      });
      
      // Unreference the process so the parent doesn't wait for it
      pythonProcess.unref();
      
      // Resolve immediately since we're launching a GUI app
      resolve({
        success: true,
        message: 'Face recognition GUI launched successfully',
        pid: pythonProcess.pid
      });
      
    } catch (error) {
      reject(new Error(`Failed to launch face recognition GUI: ${error.message}`));
    }
  });
};

/**
 * Run face recognition system to take attendance
 * @param {string} classId - EduConnect class ID
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} Result of the operation
 */
const runFaceRecognitionAttendance = async (classId, authToken) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Running face recognition for class ${classId}`);
      
      // Path to the face recognition folder
      const faceRecognitionPath = path.join(__dirname, '../../face');
      
      // Check if the face recognition folder exists
      if (!fs.existsSync(faceRecognitionPath)) {
        return reject(new Error('Face recognition system not found'));
      }
      
      // Change to the face recognition directory
      const pythonScriptPath = path.join(faceRecognitionPath, 'take_attendance.py');
      
      // Check if the Python script exists
      if (!fs.existsSync(pythonScriptPath)) {
        return reject(new Error('Face recognition script not found'));
      }
      
      // Command to run the Python script
      const command = 'python';
      const args = [
        pythonScriptPath,
        '--class-id', classId,
        '--auth-token', authToken
      ];
      
      console.log('Running face recognition command:', command, args.join(' '));
      
      // Spawn the Python process
      const pythonProcess = spawn(command, args, {
        cwd: faceRecognitionPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      // Capture stdout
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`Python stdout: ${data}`);
      });
      
      // Capture stderr
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`Python stderr: ${data}`);
      });
      
      // Handle process close
      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        
        if (code === 0) {
          resolve({
            success: true,
            message: 'Face recognition attendance completed successfully',
            output: stdout
          });
        } else {
          reject(new Error(`Python process failed with code ${code}: ${stderr || stdout}`));
        }
      });
      
      // Handle process error
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(new Error(`Failed to start face recognition system: ${error.message}`));
      });
      
    } catch (error) {
      reject(new Error(`Failed to run face recognition system: ${error.message}`));
    }
  });
};

/**
 * Clear existing face recognition data
 * @returns {Promise<Object>} Result of the operation
 */
const clearFaceRecognitionData = async () => {
  return new Promise((resolve, reject) => {
    try {
      // Path to the face recognition folder
      const faceRecognitionPath = path.join(__dirname, '../../face');
      
      // Check if the face recognition folder exists
      if (!fs.existsSync(faceRecognitionPath)) {
        return reject(new Error('Face recognition system not found'));
      }
      
      // Change to the face recognition directory
      const pythonScriptPath = path.join(faceRecognitionPath, 'take_attendance.py');
      
      // Check if the Python script exists
      if (!fs.existsSync(pythonScriptPath)) {
        return reject(new Error('Face recognition script not found'));
      }
      
      // Command to run the Python script with clear data flag
      const command = 'python';
      const args = [
        pythonScriptPath,
        '--clear-data'
      ];
      
      console.log('Clearing face recognition data:', command, args.join(' '));
      
      // Execute the command
      exec(`${command} ${args.join(' ')}`, { cwd: faceRecognitionPath }, (error, stdout, stderr) => {
        if (error) {
          console.error('Error clearing face recognition data:', error);
          return reject(new Error(`Failed to clear face recognition data: ${error.message}`));
        }
        
        console.log('Clear data stdout:', stdout);
        console.error('Clear data stderr:', stderr);
        
        resolve({
          success: true,
          message: 'Face recognition data cleared successfully',
          output: stdout
        });
      });
      
    } catch (error) {
      reject(new Error(`Failed to clear face recognition data: ${error.message}`));
    }
  });
};

module.exports = {
  runFaceRecognitionAttendance,
  clearFaceRecognitionData,
  launchFaceRecognitionGUI
};