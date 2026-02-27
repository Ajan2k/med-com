import sqlite3
import os

db = 'database.db'
with open('db_users_diag.txt', 'w') as f:
    f.write(f"Diagonosing {db} at CWD: {os.getcwd()}\n")
    if not os.path.exists(db):
        f.write("FILE NOT FOUND!\n")
    else:
        try:
            conn = sqlite3.connect(db)
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, full_name, role FROM users")
            users = cursor.fetchall()
            f.write(f"Found {len(users)} users:\n")
            for u in users:
                f.write(f"  {u}\n")
            conn.close()
        except Exception as e:
            f.write(f"ERROR: {e}\n")
