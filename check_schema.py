import sqlite3
import os

db_path = "D:/Desktop/med-com/database.db"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get existing columns in prescriptions
    cursor.execute("PRAGMA table_info(prescriptions)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Prescriptions columns: {columns}")
    
    # Check users too
    cursor.execute("PRAGMA table_info(users)")
    users_columns = [row[1] for row in cursor.fetchall()]
    print(f"Users columns: {users_columns}")

    conn.close()
except Exception as e:
    print(f"Database error: {e}")
