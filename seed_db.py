import sys
import os
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import SessionLocal, User, Appointment, Prescription, AppointmentStatus, OrderStatus

def seed_db():
    db = SessionLocal()
    
    try:
        # Create a Mock Patient if not exists
        patient = db.query(User).filter(User.phone == "555-0100").first()
        if not patient:
            patient = User(
                full_name="Alice Smith",
                phone="555-0100",
                role="patient",
                email="alice.smith@mock.com",
                hashed_password="mock"
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
            print(f"Created Patient: {patient.full_name} (ID: {patient.id})")
        
        # Add Mock Lab Tests
        lab_tests = [
            {"name": "Complete Blood Count (CBC)", "status": AppointmentStatus.PENDING},
            {"name": "Lipid Panel", "status": "processing"},
            {"name": "Vitamin D Screening", "status": AppointmentStatus.COMPLETED},
        ]
        
        for idx, test in enumerate(lab_tests):
            appt = Appointment(
                patient_id=patient.id,
                doctor_id=None,
                appointment_time=datetime.now() - timedelta(hours=idx*2),
                type="lab_test",
                doctor_name=test["name"],
                status=test["status"]
            )
            db.add(appt)
            print(f"Added Lab Test: {test['name']}")

        # Add Mock Pharmacy Prescriptions
        prescriptions = [
            {"data": "Amoxicillin 500mg - 1x per day for 7 days\nParacetamol 500mg - As needed for fever", "status": OrderStatus.PREPARING},
            {"data": "Lisinopril 10mg - Daily for blood pressure\nAtorvastatin 20mg - Nightly", "status": OrderStatus.READY},
        ]

        for rx in prescriptions:
            p = Prescription(
                patient_id=patient.id,
                extracted_data=rx["data"],
                status=rx["status"],
                created_at=datetime.utcnow()
            )
            db.add(p)
            print("Added Pharmacy Order")

        db.commit()
        print("Successfully seeded mock data!")
        
    except Exception as e:
        print(f"Error seeding DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
