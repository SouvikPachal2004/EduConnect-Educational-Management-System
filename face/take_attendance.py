#!/usr/bin/env python3
"""
Take attendance using face recognition and sync with EduConnect
"""

import sys
import os
import argparse
from datetime import datetime
import requests
import json

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from educonnect_client import EduConnectClient
    from database import init_db, get_student_by_id, mark_attendance, get_todays_attendance_count
    from face_recognition import FaceRecognizer
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

def take_attendance(educonnect_class_id=None, auth_token=None, date=None):
    """Take attendance using face recognition and sync with EduConnect"""
    try:
        print("Starting face recognition attendance system...")
        
        # Initialize database
        init_db()
        
        # Initialize face recognizer
        face_recognizer = FaceRecognizer()
        
        # Check if model is trained
        if not os.path.exists('trainer.yml'):
            print("Error: Model not trained yet! Train the model first.")
            return False
        
        # Check if recognizer is properly initialized
        if face_recognizer.recognizer is None:
            print("Error: Face recognizer not properly initialized!")
            return False
            
        # Initialize EduConnect client
        client = EduConnectClient(base_url="http://localhost:5002")
        if auth_token:
            client.set_auth_token(auth_token)
        
        # Set to store recognized student IDs
        recognized_students = set()
        
        # Callback function to handle recognized faces
        def mark_attendance_callback(student_id, confidence):
            # Only mark attendance if confidence is above threshold
            if confidence > 50:
                recognized_students.add(student_id)
                # Mark attendance in local database
                from database import mark_attendance as db_mark_attendance
                now = datetime.now()
                date_str = now.strftime("%Y-%m-%d")
                time_str = now.strftime("%H:%M:%S")
                success = db_mark_attendance(student_id, date_str, time_str)
                if success:
                    print(f"Marked attendance for student ID {student_id} (confidence: {confidence:.2f}%)")
                else:
                    print(f"Attendance already marked for student ID {student_id} today")
        
        print("Taking attendance. Press ESC to stop.")
        
        # Take attendance using face recognition with callback
        face_recognizer.real_time_recognition(callback=mark_attendance_callback)
        
        if not recognized_students:
            print("No faces recognized")
        else:
            print(f"Recognized {len(recognized_students)} students")
            
        # Sync with EduConnect if class ID is provided
        if educonnect_class_id and auth_token:
            print(f"Syncing attendance with EduConnect for class {educonnect_class_id}")
            success = client.sync_attendance_to_educonnect(educonnect_class_id)
            if success:
                print("Attendance synced successfully with EduConnect")
            else:
                print("Failed to sync attendance with EduConnect")
        
        return True
        
    except Exception as e:
        print(f"Error taking attendance: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function to parse arguments and take attendance"""
    parser = argparse.ArgumentParser(description='Take attendance using face recognition')
    parser.add_argument('--class-id', help='EduConnect class ID')
    parser.add_argument('--auth-token', help='Authentication token for EduConnect')
    parser.add_argument('--date', help='Date for attendance (YYYY-MM-DD)')
    
    args = parser.parse_args()
    
    # Use provided date or current date
    attendance_date = args.date if args.date else datetime.now().strftime('%Y-%m-%d')
    
    print(f"Taking attendance for date: {attendance_date}")
    
    # Take attendance
    success = take_attendance(args.class_id, args.auth_token, attendance_date)
    
    if success:
        print("Attendance process completed successfully")
        sys.exit(0)
    else:
        print("Attendance process failed")
        sys.exit(1)

if __name__ == "__main__":
    main()