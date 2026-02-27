import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import SessionLocal, User
from backend.security import verify_password

def test_logins():
    db = SessionLocal()
    
    test_cases = [
        ("sarah@hospital.com", "doc123"),
        ("admin@hospital.com", "admin123"),
        ("lab@hospital.com", "staff123"),
        ("pharma@hospital.com", "staff123"),
        ("adhi@hospital.com", "admin123"),
    ]

    print("--- INTERNAL LOGIN VERIFICATION ---")

    for email, password in test_cases:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"FAILED: {email} not found in database!")
            continue
            
        is_correct = verify_password(password, user.hashed_password)
        if is_correct:
            print(f"SUCCESS: {email} / {password} matches hash in DB. Role: {user.role}")
        else:
            print(f"FAILED: {email} / {password} does NOT match hash in DB!")

    db.close()

if __name__ == "__main__":
    test_logins()
