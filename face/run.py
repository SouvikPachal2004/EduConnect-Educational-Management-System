#!/usr/bin/env python3

import sys
import os

def main():
    """Main entry point for the Face Recognition Attendance System"""
    print("Face Recognition Attendance System")
    print("=" * 35)
    
    # Check if required files exist
    required_files = ['main.py', 'database.py', 'face_recognition.py']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print(f"Error: Missing required files: {missing_files}")
        print("Please make sure you're running this from the correct directory.")
        return 1
    
    # Check if dependencies are installed
    try:
        import cv2
        import numpy as np
        import tkinter as tk
        from PIL import Image
    except ImportError as e:
        print(f"Error: Missing required dependency: {e}")
        print("Please run 'pip install -r requirements.txt' to install dependencies.")
        return 1
    
    # Run the main application
    try:
        print("Starting Face Recognition Attendance System...")
        print("Press Ctrl+C to exit.")
        
        # Import and run main application
        from main import main as app_main
        app_main()
        
    except KeyboardInterrupt:
        print("\nApplication terminated by user.")
        return 0
    except Exception as e:
        print(f"Error running application: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())