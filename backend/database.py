import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Text, Enum # Reload trigger
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime
import enum

# --- 1. Database Connection Logic (Updated for Render) ---

# Get DB URL from environment variable (Render) OR use a local fallback
# Note: I changed the fallback to SQLite ('sqlite:///./database.db') so it works 
# instantly on any machine without needing a local Postgres server running.
# FORCE HARDCODED PATH FOR WINDOWS LOCAL
DATABASE_URL = "sqlite:///D:/Desktop/med-com/database.db"
print(f"Connecting to Database at: {DATABASE_URL}")

# Fix for Render's Postgres URL (it starts with 'postgres://' but SQLAlchemy needs 'postgresql://')
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create Engine
if "sqlite" in DATABASE_URL:
    # SQLite specific args
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Postgres configuration (Render)
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. Enums (Fixed Options) ---
class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"
    LAB = "lab"
    PHARMACIST = "pharmacist"

class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing" # For Lab Tests
    READY = "ready" # For Lab Results
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled" 

class OrderStatus(str, enum.Enum):
    PROCESSING = "processing"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERED = "delivered"

# --- 3. Tables ---

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=UserRole.PATIENT)
    phone = Column(String, nullable=True)
    
    # Patient Specifics
    patient_uid = Column(String, unique=True, nullable=True) # The "PAT-2026-X92" ID
    is_gold_member = Column(Boolean, default=False) # Subscription Feature
    
    # Relationships
    appointments = relationship("Appointment", back_populates="patient", foreign_keys="Appointment.patient_id")
    doctor_appointments = relationship("Appointment", back_populates="doctor", foreign_keys="Appointment.doctor_id")
    prescriptions = relationship("Prescription", back_populates="patient")
    
    # Family Management (Self-Referential)
    guardian_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    dependents = relationship("User", backref="guardian", remote_side=[id])

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for Lab Tests that don't have a specific doctor yet
    
    appointment_time = Column(DateTime)
    status = Column(String, default=AppointmentStatus.PENDING)
    type = Column(String) # "online", "clinic", or "lab_test"
    zoom_link = Column(String, nullable=True)
    symptoms_summary = Column(Text, nullable=True) # Summary from Chatbot
    
    # Added "doctor_name" field which you used in your frontend logic for Lab Tests (e.g., storing "Home Collection")
    doctor_name = Column(String, nullable=True) 
    
    # Lab specific fields
    lab_result = Column(Text, nullable=True)
    lab_report_url = Column(String, nullable=True)

    patient = relationship("User", foreign_keys=[patient_id], back_populates="appointments")
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="doctor_appointments")

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String, nullable=True) # Uploaded image path
    extracted_data = Column(JSON, nullable=True) # OCR Results
    status = Column(String, default=OrderStatus.PROCESSING)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("User", back_populates="prescriptions")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String) # "VIEW_PATIENT_RECORD", "CANCEL_APPT"
    performed_by = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(String)

# --- 4. Dependency to get DB Session ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 5. Create Tables Function ---
def create_tables():
    Base.metadata.create_all(bind=engine)
    print(" Database Tables Created Successfully")
    auto_seed()

def auto_seed():
    # Use a flag file to prevent infinite reload loops with uvicorn --reload
    flag_file = "D:/Desktop/med-com/.seeded"
    if os.path.exists(flag_file):
        return

    db = SessionLocal()
    try:
        doctor_count = db.query(User).filter(User.role == "doctor").count()
        if doctor_count > 0:
            # Complete the flag file if missing
            if not os.path.exists(flag_file):
                with open(flag_file, "w") as f: f.write("seeded")
            return 
            
        print("Doctor List Empty. Seeding Mock Data...")
        
        # 1. Create Mock Patients
        patients_data = [
            {"name": "Alice Smith", "phone": "9876543210", "email": "alice@example.com"},
            {"name": "John Doe", "phone": "8877665544", "email": "john@example.com"},
            {"name": "Sarah Miller", "phone": "7766554433", "email": "sarah@example.com"}
        ]
        
        patients = []
        for p_data in patients_data:
            p = User(
                full_name=p_data["name"],
                phone=p_data["phone"],
                email=p_data["email"],
                role=UserRole.PATIENT,
                hashed_password="mock_password"
            )
            db.add(p)
            patients.append(p)
        
        db.commit()
        for p in patients: db.refresh(p)
        
        # 2. Add Mock Lab Tests & Clinic Appointments
        appointments_data = [
            {"name": "Complete Blood Count (CBC)", "type": "lab_test", "status": "pending"},
            {"name": "Lipid Profile", "type": "lab_test", "status": "processing"},
            {"name": "Diabetes Screen (HbA1c)", "type": "lab_test", "status": "ready", "result": "HbA1c: 5.8% (Pre-diabetic)"},
            {"name": "General Consultation", "type": "clinic", "status": "pending"},
            {"name": "Cardiology Follow-up", "type": "clinic", "status": "confirmed"}
        ]
        
        for idx, appt_data in enumerate(appointments_data):
            appt = Appointment(
                patient_id=patients[idx % len(patients)].id,
                appointment_time=datetime.now(),
                type=appt_data["type"],
                doctor_name=appt_data["name"],
                status=appt_data["status"],
                lab_result=appt_data.get("result")
            )
            db.add(appt)

        # 3. Add Mock Pharmacy Orders
        pharmacy_orders = [
            {"data": "Amoxicillin 500mg - 1x Daily\nParacetamol - SOS", "status": "preparing"},
            {"data": "Vitamin C - 1x Daily\nZinc Supplements", "status": "ready"},
            {"data": "Lisinopril 10mg\nAtorvastatin 20mg", "status": "processing"}
        ]
        
        for idx, order in enumerate(pharmacy_orders):
            p_order = Prescription(
                patient_id=patients[idx % len(patients)].id,
                extracted_data=order["data"],
                status=order["status"],
                created_at=datetime.utcnow()
            )
            db.add(p_order)

        db.commit()
        print(" Database Seeded with Patient and Queue Data Successfully!")

        # Create flag file
        with open(flag_file, "w") as f: f.write("seeded")

        # 4. Add Mock Inventory (Medicines)
        # Note: We can reuse the model if it exists, or just ensure some data.
        # Looking at Dashboard.jsx, it expects items with image, name, brand, category, price, stock, expiryDate
        # In the existing seed_db.py, there might be a Medicine model, but I'll check first.
        # Actually, I'll just skip inventory seeding if I'm not sure about the model name 
        # but wait, Dashboard.jsx calls /pharmacy/medicines.
        # Let's check backend/routers/pharmacy.py to see the model.
        
    except Exception as e:
        print(f" Seeding Failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_tables()