import sqlite3
import os

db_path = 'D:/Desktop/med-com/database.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT full_name, email FROM users WHERE role = 'doctor'")
    doctors = cursor.fetchall()
    for name, email in doctors:
        print(f"{name}: {email} / doctor123")
    conn.close()
else:
    print("Database not found at " + db_path)
