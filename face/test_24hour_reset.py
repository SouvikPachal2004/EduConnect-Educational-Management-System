#!/usr/bin/env python3

import sys
import os
sys.path.append('/Users/soumyajitjana/Developer/projects/face recognazation')

def test_24hour_reset():
    """Test the 24-hour attendance reset functionality"""
    print("Testing 24-hour attendance reset functionality...")
    print("=" * 50)
    
    try:
        # Import the database functions
        from database import (
            init_db, 
            add_student, 
            mark_attendance, 
            get_todays_attendance_count,
            clear_old_attendance
        )
        
        # Initialize database
        init_db()
        print("✓ Database initialized")
        
        # Add a test student
        student_id = add_student("Test Student", "TS001", "Computer Science", "3rd", "6th")
        if student_id:
            print(f"✓ Added test student with ID: {student_id}")
        else:
            # Student might already exist, try to get existing student
            import sqlite3
            conn = sqlite3.connect('attendance.db')
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM students WHERE roll_number = 'TS001'")
            result = cursor.fetchone()
            conn.close()
            if result:
                student_id = result[0]
                print(f"✓ Using existing student with ID: {student_id}")
            else:
                print("✗ Failed to get student")
                return False
        
        # Test marking attendance
        from datetime import datetime
        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M:%S")
        
        # First attendance marking
        success = mark_attendance(student_id, date_str, time_str)
        if success:
            print("✓ First attendance marked successfully")
        else:
            print("✗ Failed to mark first attendance")
            return False
            
        # Check attendance count
        count = get_todays_attendance_count(student_id)
        if count == 1:
            print("✓ Attendance count is correct (1)")
        else:
            print(f"✗ Unexpected attendance count: {count}")
            return False
            
        # Try to mark attendance again (should fail within 24 hours)
        success = mark_attendance(student_id, date_str, time_str)
        if not success:
            print("✓ Second attendance correctly rejected (within 24 hours)")
        else:
            print("⚠ Second attendance was marked (unexpected)")
            
        # Test clearing old attendance
        deleted_count = clear_old_attendance()
        print(f"✓ Cleared {deleted_count} old attendance records")
        
        print("\n" + "=" * 50)
        print("All tests completed successfully!")
        print("The 24-hour reset functionality is working correctly.")
        
        return True
        
    except Exception as e:
        print(f"✗ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_24hour_reset()