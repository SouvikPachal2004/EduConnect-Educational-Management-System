# Quick Start Guide

Get your Face Recognition Attendance System up and running in minutes!

## Prerequisites

- Python 3.6 or higher
- A working webcam or camera
- Internet connection (for initial setup)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python main.py
```

Or use the platform-specific launchers:
- **Windows**: Double-click [run.bat](file:///Users/soumyajitjana/Developer/projects/face%20recognazation/run.bat)
- **macOS/Linux**: Run [run.sh](file:///Users/soumyajitjana/Developer/projects/face%20recognazation/run.sh)

## First-Time Configuration

### 1. Add Your First Student

1. Open the application
2. Go to "Student Management" tab
3. Fill in student details:
   - Name
   - Roll Number (must be unique)
   - Department
   - Year
   - Semester
4. Click "Add Student"

### 2. Capture Face Samples

1. Select the student from the list
2. Click "Capture Photos"
3. Position your face in the camera frame
4. The system will automatically capture 30 samples
5. Press ESC when done

### 3. Train the Recognition Model

1. Click "Train Model" button
2. Wait for training to complete (1-2 minutes)

### 4. Take Attendance

1. Go to "Attendance" tab
2. Click "Take Attendance"
3. Position in front of the camera
4. Recognized students will be marked present
5. Press ESC when done

## Exporting Attendance Data

1. Go to "Export" tab
2. Choose format (CSV or Excel)
3. Click "Export Attendance"
4. Select location to save the file

## Troubleshooting Quick Fixes

- **Camera not working**: Close other camera applications
- **Recognition not working**: Capture more samples (50+ recommended) and retrain
- **Import errors**: Run `pip install opencv-contrib-python`

## Need Help?

Check these resources:
- [INSTALL.md](file:///Users/soumyajitjana/Developer/projects/face%20recognazation/INSTALL.md) - Detailed installation guide
- [README.md](file:///Users/soumyajitjana/Developer/projects/face%20recognazation/README.md) - Complete documentation
- [PROJECT_OVERVIEW.md](file:///Users/soumyajitjana/Developer/projects/face%20recognazation/PROJECT_OVERVIEW.md) - Technical overview

## System Requirements Check

Run the test suite to verify everything is working:
```bash
python test_system.py
```