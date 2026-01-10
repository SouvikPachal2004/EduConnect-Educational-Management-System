#!/usr/bin/env python3
"""
EduConnect Client for Face Recognition System
This module handles synchronization between the local SQLite database 
and the EduConnect MongoDB database.
"""

import requests
import json
import os
from datetime import datetime
from database import init_db, get_all_students, get_attendance_report, clear_old_attendance

class EduConnectClient:
    def __init__(self, base_url="http://localhost:5001", auth_token=None):
        """
        Initialize EduConnect client
        
        Args:
            base_url (str): Base URL for EduConnect API
            auth_token (str): Authentication token for API access
        """
        self.base_url = base_url.rstrip('/')
        self.auth_token = auth_token
        self.headers = {
            'Content-Type': 'application/json'
        }
        if auth_token:
            self.headers['Authorization'] = f'Bearer {auth_token}'
    
    def set_auth_token(self, token):
        """Set authentication token"""
        self.auth_token = token
        self.headers['Authorization'] = f'Bearer {token}'
    
    def get_current_user(self):
        """Get current authenticated user"""
        try:
            response = requests.get(
                f"{self.base_url}/api/auth/me",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Error getting current user: {e}")
            return None
    
    def get_classes(self):
        """Get all classes for the current teacher"""
        try:
            response = requests.get(
                f"{self.base_url}/api/classes",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json().get('data', [])
            return []
        except Exception as e:
            print(f"Error getting classes: {e}")
            return []
    
    def sync_students(self, class_id):
        """
        Sync students from EduConnect to local database
        This would map EduConnect students to face recognition students
        """
        try:
            # Get students from EduConnect class
            response = requests.get(
                f"{self.base_url}/api/classes/{class_id}/students",
                headers=self.headers
            )
            
            if response.status_code == 200:
                educonnect_students = response.json().get('data', [])
                
                # TODO: Implement student mapping logic
                # This would involve mapping EduConnect student IDs to face recognition system
                print(f"Retrieved {len(educonnect_students)} students from EduConnect")
                return educonnect_students
            
            return []
        except Exception as e:
            print(f"Error syncing students: {e}")
            return []
    
    def sync_attendance_to_educonnect(self, class_id):
        """
        Sync local attendance records to EduConnect
        
        Args:
            class_id (str): EduConnect class ID to sync attendance for
        """
        try:
            print(f"Syncing attendance to EduConnect for class {class_id}")
            
            # Get attendance report from local database
            attendance_report = get_attendance_report()
            print(f"Found {len(attendance_report) if attendance_report else 0} attendance records")
            
            if not attendance_report:
                print("No attendance records to sync")
                return True
            
            # Prepare attendance data for EduConnect API
            attendance_data = []
            for record in attendance_report:
                # Unpack the record properly
                if len(record) >= 5:
                    name, roll_number, date, time, status = record
                    
                    # Map local student ID to EduConnect student ID
                    student_id = self._map_student_id(roll_number)
                    
                    if student_id:
                        attendance_data.append({
                            'studentId': student_id,
                            'status': status.lower() if status else 'present',
                            'notes': f'Marked by face recognition system at {time}' if time else 'Marked by face recognition system'
                        })
            
            if not attendance_data:
                print("No valid attendance records to sync")
                return True
            
            # Send attendance data to EduConnect
            payload = {
                'classId': class_id,
                'date': datetime.now().strftime('%Y-%m-%d'),
                'attendance': attendance_data
            }
            
            print(f"Sending attendance data to EduConnect: {payload}")
            
            response = requests.post(
                f"{self.base_url}/api/attendance/bulk",
                headers=self.headers,
                data=json.dumps(payload)
            )
            
            print(f"EduConnect response: {response.status_code} - {response.text}")
            
            if response.status_code in [200, 201]:
                print("Attendance synced successfully to EduConnect")
                return True
            else:
                print(f"Failed to sync attendance: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"Error syncing attendance to EduConnect: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _map_student_id(self, roll_number):
        """
        Map local roll number to EduConnect student ID
        This is a placeholder - actual implementation would depend on how
        students are mapped between systems
        
        Args:
            roll_number (str): Local student roll number
            
        Returns:
            str: EduConnect student ID or None
        """
        # TODO: Implement actual student ID mapping
        # This could involve:
        # 1. Looking up a mapping table
        # 2. Using roll number as studentId in EduConnect
        # 3. Some other mapping mechanism
        
        # For now, we'll assume roll number matches EduConnect studentId
        return str(roll_number) if roll_number else None

def clear_local_data():
    """Clear local face recognition data"""
    try:
        # Clear attendance database
        init_db()  # This reinitializes the database, clearing all data
        
        # Clear dataset folder
        dataset_path = 'dataset'
        if os.path.exists(dataset_path):
            import shutil
            shutil.rmtree(dataset_path)
            os.makedirs(dataset_path)
            print("Dataset folder cleared")
        
        # Remove trainer file
        trainer_file = 'trainer.yml'
        if os.path.exists(trainer_file):
            os.remove(trainer_file)
            print("Trainer file removed")
        
        print("Local face recognition data cleared successfully")
        return True
    except Exception as e:
        print(f"Error clearing local data: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Test the client
    client = EduConnectClient()
    print("EduConnect Client initialized")