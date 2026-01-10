# Installation Guide

## System Requirements

- Python 3.6 or higher
- A working webcam or camera
- At least 4GB RAM recommended
- 100MB free disk space

## Installation Steps

### 1. Clone or Download the Repository

If you have Git installed:
```bash
git clone <repository-url>
cd "face recognazation"
```

If you downloaded a zip file:
1. Extract the zip file
2. Navigate to the extracted folder

### 2. Install Python Dependencies

You can install dependencies in two ways:

#### Option A: Using the setup script (Recommended)
```bash
python3 setup.py
```

#### Option B: Manual installation
```bash
pip install -r requirements.txt
```

### 3. Verify Installation

Run the test suite to verify all components are working:
```bash
python3 test_system.py
```

You should see output similar to:
```
Face Recognition Attendance System - Test Suite
==================================================
Testing OpenCV installation...
OpenCV basic functionality: OK
Haar cascades: Available
Testing database functionality...
Database initialization: OK
Add student: OK
Get student: OK
Update student: OK
Delete student: OK
Testing face recognizer...
Face recognizer initialization: OK
Dataset directory: OK
Trainer file: Not found (will be created after training)
==================================================
Test Summary:
OpenCV: PASS
Database: PASS
Face Recognizer: PASS
All tests passed! The system is ready to use.
```

### 4. Run the Application

You can start the application in several ways:

#### On Windows:
- Double-click [run.bat](file:///Users/soumyajitjana/Developer/projects/face%20recognazation/run.bat)
- Or run in command prompt: `python run.py`

#### On macOS/Linux:
- Run [run.sh](file:///Users/soumyajitjana/Developer/projects/face%20recognazation/run.sh): `./run.sh`
- Or run in terminal: `python3 run.py`

#### Direct execution:
```bash
python3 main.py
```

## Troubleshooting

### Common Issues

1. **"Module not found" errors**:
   - Make sure you've installed all dependencies with `pip install -r requirements.txt`
   - Check that you're using Python 3.6 or higher

2. **Camera not working**:
   - Ensure no other application is using the camera
   - Check camera permissions for your terminal/application
   - Test your camera with another application

3. **OpenCV import errors**:
   - You may need to install opencv-contrib-python specifically:
     ```bash
     pip install opencv-contrib-python
     ```

4. **Permission denied (macOS)**:
   - If you get permission errors, try:
     ```bash
     chmod +x run.sh
     ./run.sh
     ```

5. **Database errors**:
   - The system will automatically create the database on first run
   - If you continue to have issues, delete [attendance.db](file:///Users/soumyajitjana/Developer/projects/face%20recognazation/attendance.db) and restart the application

### Verifying OpenCV Installation

To check if OpenCV is properly installed with contrib modules:
```python
import cv2
print("OpenCV version:", cv2.__version__)
print("Has face module:", hasattr(cv2, 'face'))
```

### Virtual Environment (Recommended)

For a clean installation, consider using a virtual environment:

1. Create a virtual environment:
   ```bash
   python3 -m venv face_attendance_env
   ```

2. Activate the virtual environment:
   - On Windows: `face_attendance_env\Scripts\activate`
   - On macOS/Linux: `source face_attendance_env/bin/activate`

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application:
   ```bash
   python3 main.py
   ```

5. Deactivate when done:
   ```bash
   deactivate
   ```

## First Time Usage

When you first run the application:

1. **Add Students**:
   - Go to the "Student Management" tab
   - Enter student details
   - Click "Add Student"

2. **Capture Training Photos**:
   - Select a student from the list
   - Click "Capture Photos"
   - Position your face in the camera frame
   - The system will capture 30 photos automatically
   - Press ESC when done

3. **Train the Model**:
   - Click "Train Model" button
   - Wait for training to complete (may take a few minutes)

4. **Take Attendance**:
   - Go to the "Attendance" tab
   - Click "Take Attendance"
   - Position in front of the camera
   - Recognized students will be marked present
   - Press ESC when done

## System Maintenance

- **Backup Data**: Regularly backup the [attendance.db](file:///Users/soumyajitjana/Developer/projects/face%20recognazation/attendance.db) file to prevent data loss
- **Retrain Model**: Retrain the model when adding new students for better accuracy
- **Clean Dataset**: Periodically check the dataset folder and remove poor quality samples

## Support

If you encounter any issues not covered in this guide, please check the [README.md](file:///Users/soumyajitjana/Developer/projects/face%20recognazation/README.md) file or open an issue in the repository.