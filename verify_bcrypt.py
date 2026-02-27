import sqlite3
import bcrypt

try:
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("SELECT hashed_password FROM users WHERE email='admin@hospital.com'")
    row = c.fetchone()
    if row:
        hash_str = row[0]
        match = bcrypt.checkpw(b"admin123", hash_str.encode('utf-8'))
        with open("test_result.txt", "w") as f:
            f.write(f"Match: {match}")
    else:
        with open("test_result.txt", "w") as f:
            f.write("User not found")
except Exception as e:
    with open("test_result.txt", "w") as f:
        f.write(f"Error: {e}")
