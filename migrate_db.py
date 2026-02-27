import sqlite3
import os

db_path = "D:/Desktop/med-com/database.db"
print(f"Updating schema for: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get existing columns in appointments
    cursor.execute("PRAGMA table_info(appointments)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Existing columns: {columns}")
    
    # Define columns to check and add
    columns_to_add = {
        "lab_result": "TEXT",
        "lab_report_url": "TEXT",
        "doctor_name": "TEXT",
        "symptoms_summary": "TEXT",
        "zoom_link": "TEXT",
        "type": "VARCHAR(50) DEFAULT 'consultation'"
    }
    
    for col_name, col_type in columns_to_add.items():
        if col_name not in columns:
            try:
                print(f"Adding column: {col_name}...")
                cursor.execute(f"ALTER TABLE appointments ADD COLUMN {col_name} {col_type}")
                print(f"Added {col_name} successfully.")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
                
    conn.commit()
    conn.close()
    print("Database schema update complete.")
except Exception as e:
    print(f"Database error: {e}")
