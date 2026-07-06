@echo off
title EduConnect - Face Recognition Attendance
cd /d "%~dp0"

echo ============================================
echo  EduConnect Face Recognition Attendance
echo ============================================
echo.

REM Try virtual environment first
if exist ".venv\Scripts\python.exe" (
    echo Using virtual environment Python...
    ".venv\Scripts\python.exe" gui_launcher.py %*
    goto :end
)

REM Try face_attendance_env
if exist "face_attendance_env\Scripts\python.exe" (
    echo Using face_attendance_env Python...
    "face_attendance_env\Scripts\python.exe" gui_launcher.py %*
    goto :end
)

REM Try venv
if exist "venv\Scripts\python.exe" (
    echo Using venv Python...
    "venv\Scripts\python.exe" gui_launcher.py %*
    goto :end
)

REM Try system Python
echo Using system Python...
python gui_launcher.py %*

:end
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to launch face recognition system.
    echo Please make sure Python and required packages are installed.
    echo Run: pip install opencv-python opencv-contrib-python numpy pillow pandas
    pause
)
