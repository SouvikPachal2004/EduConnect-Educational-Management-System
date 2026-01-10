#!/usr/bin/env python3

import sys
import os

def test_system():
    """Test if all required components are available"""
    print("Testing Face Recognition Attendance System components...")
    print("=" * 50)
    
    # Test 1: Python version
    print(f"Python version: {sys.version}")
    
    # Test 2: OpenCV
    try:
        import cv2
        print(f"OpenCV version: {cv2.__version__}")
        print("✓ OpenCV: Available")
        
        # Test if face module is available
        if hasattr(cv2, 'face'):
            print("✓ OpenCV Face Module: Available")
        else:
            print("⚠ OpenCV Face Module: Not available (some features may not work)")
    except ImportError as e:
        print(f"✗ OpenCV: Not available - {e}")
        return False
    
    # Test 3: NumPy
    try:
        import numpy as np
        print("✓ NumPy: Available")
    except ImportError as e:
        print(f"✗ NumPy: Not available - {e}")
        return False
    
    # Test 4: Pillow
    try:
        from PIL import Image
        print("✓ Pillow: Available")
    except ImportError as e:
        print(f"✗ Pillow: Not available - {e}")
        return False
    
    # Test 5: Tkinter
    try:
        import tkinter as tk
        print("✓ Tkinter: Available")
    except ImportError as e:
        print(f"✗ Tkinter: Not available - {e}")
        return False
    
    # Test 6: Pandas
    try:
        import pandas as pd
        print("✓ Pandas: Available")
    except ImportError as e:
        print(f"⚠ Pandas: Not available - {e}")
        print("  Export to Excel feature will not work")
    
    # Test 7: Database module
    try:
        from database import init_db, add_student
        print("✓ Database module: Available")
        
        # Test database initialization
        init_db()
        print("✓ Database initialization: Successful")
    except Exception as e:
        print(f"✗ Database module: Error - {e}")
        return False
    
    # Test 8: Face recognition module
    try:
        from face_recognition import FaceRecognizer
        recognizer = FaceRecognizer()
        print("✓ Face recognition module: Available")
    except Exception as e:
        print(f"✗ Face recognition module: Error - {e}")
        return False
    
    print("\n" + "=" * 50)
    print("All critical components are available!")
    print("The system should work correctly.")
    print("\nTo run the full application, execute:")
    print("  python main.py")
    return True

if __name__ == "__main__":
    test_system()