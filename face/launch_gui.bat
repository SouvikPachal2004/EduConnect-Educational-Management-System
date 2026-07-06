@echo off
REM Launch Face Recognition GUI
echo Launching Face Recognition Attendance System...
python gui_launcher.py %*
if errorlevel 1 (
    echo.
    echo Error: Failed to launch the application.
    echo Please make sure Python is installed and in your PATH.
    pause
)
