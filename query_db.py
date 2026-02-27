import sqlite3
import sys

def check_db(db_path):
    print(f"Checking {db_path}...")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, role, hashed_password FROM users")
        users = cursor.fetchall()
        print(f"Found {len(users)} users:")
        for u in users:
            print(f"  - {u}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

check_db("backend/database.db")
check_db("database.db")
