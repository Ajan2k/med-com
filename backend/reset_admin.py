# reset_admin.py
from backend.database import SessionLocal, User, UserRole
from backend.security import get_password_hash

def reset_admin():
    db = SessionLocal()
    
    # Check if admin exists
    admin = db.query(User).filter(User.email == "admin@hospital.com").first()
    
    if admin:
        print(f"Found existing admin user: {admin.full_name} ({admin.email})")
        admin.hashed_password = get_password_hash("admin123")
        admin.role = UserRole.ADMIN
        db.commit()
        print("✅ Admin password successfully reset to 'admin123'")
    else:
        print("Admin user not found. Creating a new admin user...")
        new_admin = User(
            full_name="System Admin",
            email="admin@hospital.com",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            phone="000-000-0000",
            patient_uid=None
        )
        db.add(new_admin)
        db.commit()
        print("✅ New admin user created with password 'admin123'")

    db.close()

if __name__ == "__main__":
    reset_admin()
