import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path so we can import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, User, Appointment, engine, Base, UserRole, AppointmentStatus
from backend.security import get_password_hash

def seed_data():
    # 1. Recreate database with new columns
    print("Recreating database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 2. Create Patient
        print("Creating dummy patient...")
        patient = User(
            full_name="John Doe",
            email="patient@example.com",
            hashed_password=get_password_hash("password123"),
            role=UserRole.PATIENT,
            patient_uid="PAT-2026-001"
        )
        db.add(patient)
        
        # 3. Create Doctors for each department
        doctors_data = [
            {"name": "Dr. James Bond", "email": "bond@hospital.com", "dept": "Cardiology"},
            {"name": "Dr. Gregory House", "email": "house@hospital.com", "dept": "Neurology"},
            {"name": "Dr. Stephen Strange", "email": "strange@hospital.com", "dept": "Orthopedics"},
            {"name": "Dr. Meredith Grey", "email": "grey@hospital.com", "dept": "General"},
            {"name": "Dr. Shaun Murphy", "email": "murphy@hospital.com", "dept": "Neurology"},
            {"name": "Dr. Eric Foreman", "email": "foreman@hospital.com", "dept": "General"},
        ]
        
        doctors = []
        for d in doctors_data:
            print(f"Creating doctor: {d['name']} ({d['dept']})...")
            doc = User(
                full_name=d['name'],
                email=d['email'],
                hashed_password=get_password_hash("doctor123"),
                role=UserRole.DOCTOR,
                department=d['dept']
            )
            db.add(doc)
            doctors.append(doc)
        
        db.commit() # Commit to get IDs
        
        # 4. Create some "Taken" slots for today and tomorrow
        print("Seeding some appointments to mark slots as 'Taken'...")
        today = datetime.now()
        
        # Doctor 1 (Bond - Cardiology) has a 10:00 AM slot taken today
        appt1 = Appointment(
            patient_id=patient.id,
            doctor_id=doctors[0].id,
            appointment_time=datetime.strptime(f"{today.strftime('%Y-%m-%d')} 10:00", "%Y-%m-%d %H:%M"),
            status=AppointmentStatus.CONFIRMED,
            type="clinic"
        )
        db.add(appt1)
        
        # Doctor 1 (Bond) also has a 2:30 PM slot taken today
        appt2 = Appointment(
            patient_id=patient.id,
            doctor_id=doctors[0].id,
            appointment_time=datetime.strptime(f"{today.strftime('%Y-%m-%d')} 14:30", "%Y-%m-%d %H:%M"),
            status=AppointmentStatus.CONFIRMED,
            type="online",
            zoom_link="https://zoom.us/j/123456789"
        )
        db.add(appt2)
        
        # Doctor 2 (House - Neurology) has an 11:30 AM slot taken tomorrow
        tomorrow = today + timedelta(days=1)
        appt3 = Appointment(
            patient_id=patient.id,
            doctor_id=doctors[1].id,
            appointment_time=datetime.strptime(f"{tomorrow.strftime('%Y-%m-%d')} 11:30", "%Y-%m-%d %H:%M"),
            status=AppointmentStatus.PENDING,
            type="clinic"
        )
        db.add(appt3)
        
        db.commit()
        print("\n[SUCCESS] Dummy Database Seeded Successfully!")
        print(f"Patient Login: patient@example.com / password123")
        print(f"Available Departments: Cardiology, Neurology, Orthopedics, General")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
