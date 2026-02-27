import sqlite3
import bcrypt

def update_passwords():
    # Target passwords from info.txt
    passwords = {
        "sarah@hospital.com": "doc123",
        "admin@hospital.com": "admin123",
        "lab@hospital.com": "staff123",
        "pharma@hospital.com": "staff123",
        "adhi@hospital.com": "admin123"
    }
    
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    
    for email, pwd in passwords.items():
        # Check if user exists
        c.execute("SELECT id FROM users WHERE email=?", (email,))
        row = c.fetchone()
        
        # generate salt and hash
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd.encode('utf-8'), salt).decode('utf-8')
        
        if row:
            print(f"Updating password for {email} to {pwd}")
            c.execute("UPDATE users SET hashed_password=? WHERE email=?", (hashed, email))
        else:
            if email == "adhi@hospital.com":
                print(f"User {email} not found. Creating a new admin user.")
                # We need to insert a new user for adhi
                c.execute("""
                    INSERT INTO users (full_name, email, hashed_password, role, phone, patient_uid)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, ("Adhi Admin", email, hashed, "admin", "000-000-0000", None))
            else:
                print(f"User {email} not found. Skipping.")
                
    conn.commit()
    conn.close()
    print("All passwords updated to raw bcrypt format successfully.")

if __name__ == "__main__":
    update_passwords()
