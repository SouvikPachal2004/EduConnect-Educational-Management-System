#!/usr/bin/env python3
"""
Database migration script to remove year and semester columns from students table
"""

import sqlite3
import os

def migrate_database():
    """Migrate the database to remove year and semester columns"""
    # Connect to the database
    conn = sqlite3.connect('attendance.db')
    cursor = conn.cursor()
    
    try:
        # Check if the old table exists
        cursor.execute("PRAGMA table_info(students)")
        columns = cursor.fetchall()
        
        # Check if year and semester columns exist
        column_names = [column[1] for column in columns]
        has_year = 'year' in column_names
        has_semester = 'semester' in column_names
        
        if has_year or has_semester:
            print("Migrating database: removing year and semester columns...")
            
            # Create new table without year and semester
            cursor.execute('''
                CREATE TABLE students_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    roll_number TEXT UNIQUE NOT NULL,
                    department TEXT
                )
            ''')
            
            # Copy data from old table to new table
            if has_year and has_semester:
                cursor.execute('''
                    INSERT INTO students_new (id, name, roll_number, department)
                    SELECT id, name, roll_number, department FROM students
                ''')
            elif has_year:
                cursor.execute('''
                    INSERT INTO students_new (id, name, roll_number, department)
                    SELECT id, name, roll_number, department FROM students
                ''')
            elif has_semester:
                cursor.execute('''
                    INSERT INTO students_new (id, name, roll_number, department)
                    SELECT id, name, roll_number, department FROM students
                ''')
            
            # Drop old table
            cursor.execute('DROP TABLE students')
            
            # Rename new table to original name
            cursor.execute('ALTER TABLE students_new RENAME TO students')
            
            conn.commit()
            print("Database migration completed successfully!")
        else:
            print("Database is already up to date. No migration needed.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()