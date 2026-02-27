import sqlite3
import bcrypt

def check_login():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("SELECT email, hashed_password FROM users")
    users = cursor.fetchall()
    
    print("Testing passwords:")
    for email, hashed in users:
        try:
            # Assuming 'admin123' or something
            # Let's try 'admin123' for admin, 'staff123' for lab, 'doc123' for doctor
            pwd = "admin123" if "admin" in email else ("doc123" if "hospital.com" in email and "lab" not in email and "pharma" not in email else "staff123")
            if email == "testpatient999@test.com":
                pwd = "test123"
            
            pwd_bytes = pwd.encode('utf-8')
            hash_bytes = hashed.encode('utf-8')
            
            print(f"Testing {email} with pwd '{pwd}'")
            res = bcrypt.checkpw(pwd_bytes, hash_bytes)
            print(f"  Result: {res}")
        except Exception as e:
            print(f"  Error for {email}: {e}")

check_login()
