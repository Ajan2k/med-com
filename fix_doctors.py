from backend.database import SessionLocal, User, Appointment, Prescription, UserRole
from backend.security import get_password_hash

db = SessionLocal()

print("⚠️ STARTING FULL RESET...")

# 1. DELETE DEPENDENT DATA (Appointments & Prescriptions)
print("   - Deleting old appointments...")
db.query(Appointment).delete()
print("   - Deleting old prescriptions...")
db.query(Prescription).delete()
db.commit()

# 2. DELETE DOCTORS (Now safe to delete)
print("   - Deleting old doctors...")
# Delete anyone with role='doctor' or name='Sarah Smith' to catch duplicates
db.query(User).filter((User.role == "doctor") | (User.full_name.like("%Sarah Smith%"))).delete()
db.commit()

# 3. CREATE FRESH SPECIALIST TEAM
print("   - Creating new specialist team...")
new_doctors = [
    {"name": "Dr. Sarah Smith", "email": "sarah@hospital.com", "dept": "General"},
    {"name": "Dr. James Bond", "email": "james@hospital.com", "dept": "Cardiology"},
    {"name": "Dr. Gregory House", "email": "house@hospital.com", "dept": "Neurology"},
    {"name": "Dr. Stephen Strange", "email": "strange@hospital.com", "dept": "Orthopedics"}
]

for d in new_doctors:
    user = User(
        full_name=d["name"],
        email=d["email"],
        hashed_password=get_password_hash("doc123"),
        role=UserRole.DOCTOR,
        phone="555-0199",
        patient_uid=None
    )
    db.add(user)

db.commit()
print("✅ DONE! Database is clean. 4 Unique Doctors created.")
db.close()