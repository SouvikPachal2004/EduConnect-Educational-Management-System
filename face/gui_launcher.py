#!/usr/bin/env python3
"""
GUI Launcher for Face Recognition Attendance System
This script launches the main GUI application with command-line arguments
"""

import sys
import os
import argparse
import tkinter as tk
from main import AttendanceApp

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Launch Face Recognition Attendance System GUI')
    parser.add_argument('--class-id', help='EduConnect class ID')
    parser.add_argument('--auth-token', help='Authentication token for EduConnect API')
    
    args = parser.parse_args()
    
    # Launch the GUI application
    root = tk.Tk()
    app = AttendanceApp(root, class_id=args.class_id, auth_token=args.auth_token)
    root.mainloop()

if __name__ == "__main__":
    main()