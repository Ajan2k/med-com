import sqlite3
import os

def diag():
    db = 'database.db'
    out = 'diag_out.txt'
    
    with open(out, 'w') as f:
        f.write(f"Diagnostic for {db}\n")
        f.write(f"File exists: {os.path.exists(db)}\n\n")
        
        try:
            conn = sqlite3.connect(db)
            cursor = conn.cursor()
            
            # Users
            cursor.execute("SELECT id, full_name, role FROM users")
            users = cursor.fetchall()
            f.write(f"TOTAL USERS: {len(users)}\n")
            for u in users:
                f.write(f"  - {u}\n")
            
            # Appointments
            cursor.execute("SELECT id, type, status FROM appointments")
            appts = cursor.fetchall()
            f.write(f"\nTOTAL APPOINTMENTS: {len(appts)}\n")
            for a in appts:
                f.write(f"  - {a}\n")
                
            conn.close()
        except Exception as e:
            f.write(f"ERROR: {e}\n")

if __name__ == "__main__":
    diag()
