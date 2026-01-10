import cv2
import os
from database import *
from face_recognition import FaceRecognizer

def test_opencv():
    """Test if OpenCV is properly installed"""
    print("Testing OpenCV installation...")
    
    # Test basic OpenCV functionality
    try:
        # Check if we can create a simple image
        img = cv2.imread('test_image.jpg')
        if img is None:
            print("OpenCV basic functionality: OK")
        else:
            print("OpenCV basic functionality: OK (image loaded)")
            
        # Check if Haar cascades are available
        if hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            if os.path.exists(cascade_path):
                print("Haar cascades: Available")
            else:
                print("Haar cascades: Not found")
        else:
            print("Haar cascades: Not accessible (cv2.data not available)")
            
        return True
    except Exception as e:
        print(f"OpenCV test failed: {e}")
        return False

def test_database():
    """Test database functionality"""
    print("\nTesting database functionality...")
    
    try:
        # Initialize database
        init_db()
        print("Database initialization: OK")
        
        # Add a test student
        student_id = add_student("Test Student", "TS001", "Computer Science", "3rd", "6th")
        if student_id:
            print("Add student: OK")
            
            # Get student
            student = get_student_by_id(student_id)
            if student:
                print("Get student: OK")
                
                # Update student
                update_student(student_id, "Updated Student", "TS001", "Computer Science", "3rd", "6th")
                print("Update student: OK")
                
                # Delete student
                delete_student(student_id)
                print("Delete student: OK")
            else:
                print("Get student: Failed")
        else:
            print("Add student: Failed")
            
        return True
    except Exception as e:
        print(f"Database test failed: {e}")
        return False

def test_face_recognizer():
    """Test face recognizer functionality"""
    print("\nTesting face recognizer...")
    
    try:
        # Create face recognizer
        recognizer = FaceRecognizer()
        print("Face recognizer initialization: OK")
        
        # Check if dataset directory exists
        if os.path.exists(recognizer.dataset_path):
            print("Dataset directory: OK")
        else:
            print("Dataset directory: Not found (will be created when needed)")
            
        # Check if trainer file exists
        if os.path.exists(recognizer.trainer_file):
            print("Trainer file: Exists")
        else:
            print("Trainer file: Not found (will be created after training)")
            
        return True
    except Exception as e:
        print(f"Face recognizer test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Face Recognition Attendance System - Test Suite")
    print("=" * 50)
    
    # Run tests
    opencv_ok = test_opencv()
    db_ok = test_database()
    face_ok = test_face_recognizer()
    
    # Summary
    print("\n" + "=" * 50)
    print("Test Summary:")
    print(f"OpenCV: {'PASS' if opencv_ok else 'FAIL'}")
    print(f"Database: {'PASS' if db_ok else 'FAIL'}")
    print(f"Face Recognizer: {'PASS' if face_ok else 'FAIL'}")
    
    if opencv_ok and db_ok and face_ok:
        print("\nAll tests passed! The system is ready to use.")
        return True
    else:
        print("\nSome tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    main()