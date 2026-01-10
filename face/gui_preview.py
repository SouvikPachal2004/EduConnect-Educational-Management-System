#!/usr/bin/env python3

def show_gui_preview():
    """Show what the GUI application looks like"""
    print("Face Recognition Attendance System - GUI Preview")
    print("=" * 50)
    
    print("""
APPLICATION INTERFACE OVERVIEW:
==============================

┌─────────────────────────────────────────────────────────────┐
│  FACE RECOGNITION ATTENDANCE SYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │  [Student Management] [Face Recognition] [Attendance]   ││
│  │  [Export]                                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  STUDENT MANAGEMENT                                     ││
│  │                                                         ││
│  │  Name: ________________ Roll #: __________              ││
│  │  Dept: ________________ Year: ____________              ││
│  │  Sem:  ________________                                 ││
│  │                                                         ││
│  │  [Add Student] [Update Student] [Delete Student]        ││
│  │  [Clear Fields] [Capture Photos] [Train Model]          ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │ ID │ Name         │ Roll # │ Dept     │ Year │ Sem  │││
│  │  ├─────────────────────────────────────────────────────┤││
│  │  │ 1  │ John Smith   │ CS001  │ Comp Sci │ 3rd  │ 6th  │││
│  │  │ 2  │ Jane Doe     │ CS002  │ Comp Sci │ 3rd  │ 6th  │││
│  │  │ 3  │ Bob Johnson  │ CS003  │ Comp Sci │ 3rd  │ 6th  │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘

MAIN FEATURES:
=============

1. STUDENT MANAGEMENT TAB:
   - Add new students with details (name, roll number, etc.)
   - Update existing student information
   - Delete students from the system
   - Capture face photos for recognition training
   - Train the face recognition model

2. FACE RECOGNITION TAB:
   - Real-time face detection using camera
   - Visual feedback with bounding boxes
   - Recognition confidence percentages

3. ATTENDANCE TAB:
   - Take attendance using face recognition
   - Real-time attendance marking
   - View attendance records

4. EXPORT TAB:
   - Export attendance data to CSV format
   - Export attendance data to Excel format

TECHNOLOGY STACK:
================

Frontend: Tkinter (Python GUI framework)
Backend:  Python with OpenCV for computer vision
Database: SQLite (lightweight, file-based database)
Recognition: Haar Cascade + LBPH algorithms

HOW IT WORKS:
============

1. FACE DETECTION:
   - Uses Haar Cascade classifiers to detect faces in real-time
   - Draws bounding boxes around detected faces

2. FACE RECOGNITION:
   - Uses LBPH (Local Binary Patterns Histograms) algorithm
   - Trains on captured face samples
   - Recognizes known faces with confidence scores

3. DATABASE:
   - Stores student information
   - Tracks attendance records
   - Exports data in standard formats

To run the actual application:
1. Activate virtual environment:
   source face_attendance_env/bin/activate
2. Run the application:
   python main.py
""")
    
if __name__ == "__main__":
    show_gui_preview()