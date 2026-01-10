import os
import sys
import subprocess

def install_requirements():
    """Install required packages from requirements.txt"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("All requirements installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error installing requirements: {e}")
        return False

def initialize_database():
    """Initialize the database"""
    try:
        from database import init_db
        init_db()
        print("Database initialized successfully!")
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

def create_directories():
    """Create necessary directories"""
    directories = ['dataset']
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"Created directory: {directory}")
    
    print("All directories created successfully!")
    return True

def main():
    print("Setting up Face Recognition Attendance System...")
    
    # Create directories
    create_directories()
    
    # Install requirements
    print("Installing requirements...")
    if not install_requirements():
        print("Failed to install requirements. Please install manually using 'pip install -r requirements.txt'")
        return False
    
    # Initialize database
    print("Initializing database...")
    if not initialize_database():
        print("Failed to initialize database.")
        return False
    
    print("\nSetup completed successfully!")
    print("\nTo run the application, execute:")
    print("  python main.py")
    print("\nMake sure your camera is connected and not being used by another application.")
    
    return True

if __name__ == "__main__":
    main()