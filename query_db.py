import sqlite3
import sys

def check_db(db_path):
    print(f"Checking {db_path}...")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, role FROM users")
        users = cursor.fetchall()
        print(f"Found {len(users)} users")

        cursor.execute("SELECT id, patient_id, type, status FROM appointments")
        appts = cursor.fetchall()
        print(f"Found {len(appts)} appointments")

        cursor.execute("SELECT id, patient_id, status FROM prescriptions")
        rx = cursor.fetchall()
        print(f"Found {len(rx)} prescriptions")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

check_db("backend/database.db")
check_db("database.db")
