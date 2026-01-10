import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import pandas as pd
from datetime import datetime
import os
import sys
import argparse
from database import *
from face_recognition import FaceRecognizer

class AttendanceApp:
    def __init__(self, root, class_id=None, auth_token=None):
        self.root = root
        self.class_id = class_id
        self.auth_token = auth_token
        self.root.title("Face Recognition Attendance System")
        self.root.geometry("1000x700")
        
        # Initialize database
        init_db()
        
        # Clear old attendance records (older than 24 hours)
        from database import clear_old_attendance
        deleted_count = clear_old_attendance()
        if deleted_count > 0:
            print(f"Cleared {deleted_count} old attendance records")
        
        # Initialize face recognizer
        self.face_recognizer = FaceRecognizer()
        
        # Create notebook for tabs
        self.notebook = ttk.Notebook(root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create tabs
        self.create_student_tab()
        self.create_face_recognition_tab()
        self.create_attendance_tab()
        self.create_export_tab()
        
        # Refresh student list
        self.refresh_student_list()
        
        # If class_id and auth_token are provided, show them
        if self.class_id and self.auth_token:
            print(f"Launched with Class ID: {self.class_id}")
            print(f"Auth Token: {self.auth_token[:10]}...")  # Show only first 10 chars for security
        
    def create_student_tab(self):
        """Create the student management tab"""
        self.student_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.student_frame, text="Student Management")
        
        # Student form
        form_frame = ttk.LabelFrame(self.student_frame, text="Student Information")
        form_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # Form fields
        ttk.Label(form_frame, text="Name:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        self.name_entry = ttk.Entry(form_frame, width=30)
        self.name_entry.grid(row=0, column=1, padx=5, pady=5)
        
        ttk.Label(form_frame, text="Roll Number:").grid(row=0, column=2, sticky=tk.W, padx=5, pady=5)
        self.roll_entry = ttk.Entry(form_frame, width=20)
        self.roll_entry.grid(row=0, column=3, padx=5, pady=5)
        
        ttk.Label(form_frame, text="Department:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        self.dept_entry = ttk.Entry(form_frame, width=30)
        self.dept_entry.grid(row=1, column=1, padx=5, pady=5)
        
        # Buttons
        btn_frame = ttk.Frame(form_frame)
        btn_frame.grid(row=2, column=0, columnspan=4, pady=10)
        
        self.add_btn = ttk.Button(btn_frame, text="Add Student", command=self.add_student)
        self.add_btn.pack(side=tk.LEFT, padx=5)
        
        self.update_btn = ttk.Button(btn_frame, text="Update Student", command=self.update_student)
        self.update_btn.pack(side=tk.LEFT, padx=5)
        
        self.delete_btn = ttk.Button(btn_frame, text="Delete Student", command=self.delete_student)
        self.delete_btn.pack(side=tk.LEFT, padx=5)
        
        self.clear_btn = ttk.Button(btn_frame, text="Clear Fields", command=self.clear_fields)
        self.clear_btn.pack(side=tk.LEFT, padx=5)
        
        self.capture_btn = ttk.Button(btn_frame, text="Capture Photos", command=self.capture_photos)
        self.capture_btn.pack(side=tk.LEFT, padx=5)
        
        self.train_btn = ttk.Button(btn_frame, text="Train Model", command=self.train_model)
        self.train_btn.pack(side=tk.LEFT, padx=5)
        
        # Student list
        list_frame = ttk.LabelFrame(self.student_frame, text="Students List")
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Treeview for student list
        columns = ("ID", "Name", "Roll Number", "Department")
        self.student_tree = ttk.Treeview(list_frame, columns=columns, show="headings", height=15)
        
        # Define headings
        for col in columns:
            self.student_tree.heading(col, text=col)
            self.student_tree.column(col, width=150)
            
        # Scrollbars
        v_scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.student_tree.yview)
        h_scrollbar = ttk.Scrollbar(list_frame, orient=tk.HORIZONTAL, command=self.student_tree.xview)
        self.student_tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Pack treeview and scrollbars
        self.student_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        v_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        h_scrollbar.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Bind selection event
        self.student_tree.bind("<<TreeviewSelect>>", self.on_student_select)
        
    def create_face_recognition_tab(self):
        """Create the face recognition tab"""
        self.recognition_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.recognition_frame, text="Face Recognition")
        
        # Recognition controls
        control_frame = ttk.Frame(self.recognition_frame)
        control_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.start_recognition_btn = ttk.Button(control_frame, text="Start Recognition", 
                                               command=self.start_recognition)
        self.start_recognition_btn.pack(side=tk.LEFT, padx=5)
        
        self.stop_recognition_btn = ttk.Button(control_frame, text="Stop Recognition", 
                                              state=tk.DISABLED, command=self.stop_recognition)
        self.stop_recognition_btn.pack(side=tk.LEFT, padx=5)
        
        # Recognition display
        self.display_frame = ttk.LabelFrame(self.recognition_frame, text="Recognition Display")
        self.display_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.recognition_label = ttk.Label(self.display_frame, text="Click 'Start Recognition' to begin")
        self.recognition_label.pack(expand=True)
        
    def create_attendance_tab(self):
        """Create the attendance tab"""
        self.attendance_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.attendance_frame, text="Attendance")
        
        # Attendance controls
        control_frame = ttk.Frame(self.attendance_frame)
        control_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.take_attendance_btn = ttk.Button(control_frame, text="Take Attendance", 
                                             command=self.take_attendance)
        self.take_attendance_btn.pack(side=tk.LEFT, padx=5)
        
        # Attendance list
        list_frame = ttk.LabelFrame(self.attendance_frame, text="Attendance Records")
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Treeview for attendance list
        columns = ("Name", "Roll Number", "Date", "Time", "Status")
        self.attendance_tree = ttk.Treeview(list_frame, columns=columns, show="headings", height=15)
        
        # Define headings
        for col in columns:
            self.attendance_tree.heading(col, text=col)
            self.attendance_tree.column(col, width=150)
            
        # Scrollbars
        v_scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.attendance_tree.yview)
        h_scrollbar = ttk.Scrollbar(list_frame, orient=tk.HORIZONTAL, command=self.attendance_tree.xview)
        self.attendance_tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Pack treeview and scrollbars
        self.attendance_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        v_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        h_scrollbar.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Load attendance data
        self.refresh_attendance_list()
        
    def create_export_tab(self):
        """Create the export tab"""
        self.export_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.export_frame, text="Export")
        
        # Export controls
        control_frame = ttk.Frame(self.export_frame)
        control_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(control_frame, text="Export Format:").pack(side=tk.LEFT, padx=5)
        
        self.export_format = tk.StringVar(value="csv")
        ttk.Radiobutton(control_frame, text="CSV", variable=self.export_format, value="csv").pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(control_frame, text="Excel", variable=self.export_format, value="excel").pack(side=tk.LEFT, padx=5)
        
        self.export_btn = ttk.Button(control_frame, text="Export Attendance", command=self.export_attendance)
        self.export_btn.pack(side=tk.LEFT, padx=20)
        
        # Export info
        info_frame = ttk.LabelFrame(self.export_frame, text="Information")
        info_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        ttk.Label(info_frame, text="Export your attendance data to CSV or Excel format.").pack(pady=20)
        
    def refresh_student_list(self):
        """Refresh the student list in the treeview"""
        # Clear existing items
        for item in self.student_tree.get_children():
            self.student_tree.delete(item)
            
        # Get all students
        students = get_all_students()
        
        # Add students to treeview
        for student in students:
            self.student_tree.insert("", tk.END, values=student)
            
    def refresh_attendance_list(self):
        """Refresh the attendance list in the treeview"""
        # Clear existing items
        for item in self.attendance_tree.get_children():
            self.attendance_tree.delete(item)
            
        # Get attendance report
        report = get_attendance_report()
        
        # Add attendance records to treeview
        for record in report:
            self.attendance_tree.insert("", tk.END, values=record)
            
    def on_student_select(self, event):
        """Handle student selection in the treeview"""
        selected_items = self.student_tree.selection()
        if selected_items:
            item = self.student_tree.item(selected_items[0])
            values = item['values']
            
            # Fill form fields
            self.name_entry.delete(0, tk.END)
            self.name_entry.insert(0, values[1])
            
            self.roll_entry.delete(0, tk.END)
            self.roll_entry.insert(0, values[2])
            
            self.dept_entry.delete(0, tk.END)
            self.dept_entry.insert(0, values[3] if values[3] else "")
            
    def clear_fields(self):
        """Clear all form fields"""
        self.name_entry.delete(0, tk.END)
        self.roll_entry.delete(0, tk.END)
        self.dept_entry.delete(0, tk.END)
        
        # Clear selection in treeview
        for item in self.student_tree.selection():
            self.student_tree.selection_remove(item)
            
    def add_student(self):
        """Add a new student to the database"""
        name = self.name_entry.get().strip()
        roll = self.roll_entry.get().strip()
        dept = self.dept_entry.get().strip()
        
        if not name or not roll:
            messagebox.showerror("Error", "Name and Roll Number are required!")
            return
            
        student_id = add_student(name, roll, dept)
        if student_id:
            messagebox.showinfo("Success", "Student added successfully!")
            self.clear_fields()
            self.refresh_student_list()
        else:
            messagebox.showerror("Error", "Failed to add student. Roll number may already exist!")
            
    def update_student(self):
        """Update selected student information"""
        selected_items = self.student_tree.selection()
        if not selected_items:
            messagebox.showerror("Error", "Please select a student to update!")
            return
            
        item = self.student_tree.item(selected_items[0])
        student_id = item['values'][0]
        
        name = self.name_entry.get().strip()
        roll = self.roll_entry.get().strip()
        dept = self.dept_entry.get().strip()
        
        if not name or not roll:
            messagebox.showerror("Error", "Name and Roll Number are required!")
            return
            
        update_student(student_id, name, roll, dept)
        messagebox.showinfo("Success", "Student updated successfully!")
        self.refresh_student_list()
        
    def delete_student(self):
        """Delete selected student"""
        selected_items = self.student_tree.selection()
        if not selected_items:
            messagebox.showerror("Error", "Please select a student to delete!")
            return
            
        result = messagebox.askyesno("Confirm", "Are you sure you want to delete this student?")
        if result:
            item = self.student_tree.item(selected_items[0])
            student_id = item['values'][0]
            
            delete_student(student_id)
            messagebox.showinfo("Success", "Student deleted successfully!")
            self.clear_fields()
            self.refresh_student_list()
            
    def capture_photos(self):
        """Capture photos for selected student"""
        selected_items = self.student_tree.selection()
        if not selected_items:
            messagebox.showerror("Error", "Please select a student to capture photos!")
            return
            
        item = self.student_tree.item(selected_items[0])
        student_id = item['values'][0]
        
        messagebox.showinfo("Info", "Starting photo capture. Press ESC to stop.")
        count = self.face_recognizer.capture_samples(student_id)
        messagebox.showinfo("Success", f"Captured {count} photos for student ID {student_id}")
        
    def train_model(self):
        """Train the face recognition model"""
        if not os.path.exists('dataset') or not os.listdir('dataset'):
            messagebox.showerror("Error", "No training data found! Capture photos first.")
            return
            
        messagebox.showinfo("Info", "Training model. This may take a few minutes...")
        success = self.face_recognizer.train_model()
        if success:
            messagebox.showinfo("Success", "Model trained successfully!")
        else:
            messagebox.showerror("Error", "Failed to train model!")
            
    def start_recognition(self):
        """Start real-time face recognition"""
        if not os.path.exists('trainer.yml'):
            messagebox.showerror("Error", "Model not trained yet! Train the model first.")
            return
            
        self.start_recognition_btn.config(state=tk.DISABLED)
        self.stop_recognition_btn.config(state=tk.NORMAL)
        
        messagebox.showinfo("Info", "Starting face recognition. Press ESC to stop.")
        self.face_recognizer.real_time_recognition()
        
        self.start_recognition_btn.config(state=tk.NORMAL)
        self.stop_recognition_btn.config(state=tk.DISABLED)
        
    def stop_recognition(self):
        """Stop real-time face recognition"""
        # This would be implemented if we had a way to stop the recognition loop
        pass
        
    def take_attendance(self):
        """Take attendance using face recognition"""
        if not os.path.exists('trainer.yml'):
            messagebox.showerror("Error", "Model not trained yet! Train the model first.")
            return
            
        def mark_attendance_callback(student_id, confidence):
            """Callback function to mark attendance when a student is recognized"""
            if confidence > 50:  # Only mark attendance if confidence is above threshold
                student = get_student_by_id(student_id)
                if student:
                    # Clear old attendance records first
                    clear_old_attendance()
                    
                    # Check if student already has attendance in last 24 hours
                    today_count = get_todays_attendance_count(student_id)
                    if today_count > 0:
                        print(f"Attendance already marked for {student[1]} (ID: {student_id}) in last 24 hours")
                        return
                    
                    now = datetime.now()
                    date_str = now.strftime("%Y-%m-%d")
                    time_str = now.strftime("%H:%M:%S")
                    success = mark_attendance(student_id, date_str, time_str)
                    if success:
                        print(f"Attendance marked for {student[1]} (ID: {student_id})")
                        self.refresh_attendance_list()
                    else:
                        print(f"Attendance already marked for {student[1]} (ID: {student_id})")
        
        messagebox.showinfo("Info", "Taking attendance. Press ESC to stop.")
        self.face_recognizer.real_time_recognition(mark_attendance_callback)
        self.refresh_attendance_list()
        
    def export_attendance(self):
        """Export attendance data to CSV or Excel"""
        report = get_attendance_report()
        if not report:
            messagebox.showinfo("Info", "No attendance data to export!")
            return
            
        # Ask user for file location
        file_type = self.export_format.get()
        if file_type == "csv":
            file_path = filedialog.asksaveasfilename(defaultextension=".csv",
                                                   filetypes=[("CSV files", "*.csv")])
        else:
            file_path = filedialog.asksaveasfilename(defaultextension=".xlsx",
                                                   filetypes=[("Excel files", "*.xlsx")])
                                                   
        if not file_path:
            return  # User cancelled
            
        # Convert to DataFrame
        df = pd.DataFrame(report, columns=["Name", "Roll Number", "Date", "Time", "Status"])
        
        try:
            if file_type == "csv":
                df.to_csv(file_path, index=False)
            else:
                df.to_excel(file_path, index=False)
                
            messagebox.showinfo("Success", f"Attendance exported successfully to {file_path}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export attendance: {str(e)}")

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Face Recognition Attendance System')
    parser.add_argument('--class-id', help='EduConnect class ID')
    parser.add_argument('--auth-token', help='Authentication token')
    
    args = parser.parse_args()
    
    root = tk.Tk()
    app = AttendanceApp(root, args.class_id, args.auth_token)
    root.mainloop()

if __name__ == "__main__":
    main()