# Face Recognition Attendance System

A complete face recognition attendance system using Haar Cascade for face detection and LBPH (Local Binary Patterns Histograms) for face recognition.

## Features

- Real-time face detection using Haar Cascade
- Face recognition using LBPH algorithm
- Student management (Add/Update/Delete/Clear)
- Photo capture for face samples
- Train photo samples for recognition
- Take attendance with face recognition (real-time)
- Export attendance report as CSV / Excel

## Requirements

- Python 3.6 or higher
- OpenCV (opencv-python and opencv-contrib-python)
- NumPy
- Pillow
- Tkinter (usually comes with Python)
- Pandas
- OpenPyXL (for Excel export)

## Installation

1. Clone or download this repository
2. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Run the main application:
   ```bash
   python main.py
   ```

2. Add students using the "Student Management" tab
3. Capture photos for each student
4. Train the model using the "Train Model" button
5. Take attendance using the "Attendance" tab
6. Export attendance reports using the "Export" tab

## System Architecture

### Components

1. **Face Detection**: Uses Haar Cascade classifier to detect faces in real-time
2. **Face Recognition**: Uses LBPH algorithm to recognize faces
3. **Database**: SQLite database to store student information and attendance records
4. **GUI**: Tkinter-based graphical user interface
5. **Export**: CSV/Excel export functionality for attendance reports

### Workflow

1. **Student Registration**:
   - Add student details (name, roll number, etc.)
   - Capture multiple face samples for each student
   - Store samples in the dataset folder

2. **Model Training**:
   - Train the LBPH recognizer with captured samples
   - Save the trained model to a file

3. **Attendance Taking**:
   - Real-time face recognition using the trained model
   - Mark attendance when a recognized face is detected
   - Store attendance records in the database

4. **Report Generation**:
   - Export attendance data to CSV or Excel format

## File Structure

```
face_recognition_attendance/
├── main.py              # Main application
├── database.py          # Database operations
├── face_recognition.py  # Face detection and recognition
├── requirements.txt     # Python dependencies
├── attendance.db        # SQLite database (created on first run)
├── dataset/            # Face samples (created when capturing photos)
└── trainer.yml         # Trained model (created after training)
```

## How It Works

### Face Detection

The system uses Haar Cascade classifiers, which are machine learning-based approaches where a cascade function is trained from a lot of positive and negative images. It is then used to detect objects in other images.

### Face Recognition

The LBPH (Local Binary Patterns Histograms) algorithm is used for face recognition. It is a simple yet very efficient texture operator which labels the pixels of an image by thresholding the neighborhood of each pixel with the center value and considers the result as a binary number.

### Database

SQLite is used as the database to store:
- Student information (name, roll number, department, etc.)
- Attendance records (date, time, status)

## Troubleshooting

1. **Camera not working**: Make sure your camera is not being used by another application
2. **Recognition not working**: Ensure you have captured enough samples (30+ per student) and trained the model
3. **Import errors**: Make sure all dependencies are installed correctly
4. **Model training fails**: Check that you have captured photos for at least one student

## License

This project is for educational purposes only.