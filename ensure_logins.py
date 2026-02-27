import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import SessionLocal, User, UserRole
from backend.security import get_password_hash

def ensure_users():
    db = SessionLocal()
    
    users_to_create = [
        {"name": "Dr. Sarah", "email": "sarah@hospital.com", "password": "doc123", "role": UserRole.DOCTOR, "dept": "General"},
        {"name": "Main Admin", "email": "admin@hospital.com", "password": "admin123", "role": UserRole.ADMIN, "dept": None},
        {"name": "Central Lab", "email": "lab@hospital.com", "password": "staff123", "role": UserRole.LAB, "dept": None},
        {"name": "Main Pharmacy", "email": "pharma@hospital.com", "password": "staff123", "role": UserRole.PHARMACIST, "dept": None},
        {"name": "Adhi Admin", "email": "adhi@hospital.com", "password": "admin123", "role": UserRole.ADMIN, "dept": None},
    ]

    print("Ensuring requested logins exist...")

    for u_data in users_to_create:
        # Check if user already exists
        user = db.query(User).filter(User.email == u_data["email"]).first()
        
        if user:
            print(f"Updating existing user: {u_data['email']}")
            user.hashed_password = get_password_hash(u_data["password"])
            user.full_name = u_data["name"]
            user.role = u_data["role"]
            if u_data["dept"]:
                user.department = u_data["dept"]
        else:
            print(f"Creating new user: {u_data['email']}")
            new_user = User(
                full_name=u_data["name"],
                email=u_data["email"],
                hashed_password=get_password_hash(u_data["password"]),
                role=u_data["role"],
                department=u_data["dept"]
            )
            db.add(new_user)
    
    try:
        db.commit()
        print("\n[SUCCESS] All logins are now active and ready!")
    except Exception as e:
        print(f"Error committing changes: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    ensure_users()
