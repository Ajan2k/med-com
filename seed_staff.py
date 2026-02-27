import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import SessionLocal, User, UserRole
from backend.security import get_password_hash

db = SessionLocal()

staff_accounts = [
    {"name": "Central Lab", "email": "lab@hospital.com", "role": UserRole.LAB},
    {"name": "Main Pharmacy", "email": "pharma@hospital.com", "role": UserRole.PHARMACIST}
]

print("Creating Staff Accounts...")

for account in staff_accounts:
    # Check if exists
    exists = db.query(User).filter(User.email == account["email"]).first()
    if not exists:
        user = User(
            full_name=account["name"],
            email=account["email"],
            hashed_password=get_password_hash("staff123"), # Default Password
            role=account["role"],
            phone="999-999-9999",
            patient_uid=None
        )
        db.add(user)
        print(f"Created {account['name']} ({account['email']})")
    else:
        print(f"{account['name']} already exists.")

db.commit()
db.close()