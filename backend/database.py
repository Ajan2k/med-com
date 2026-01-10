from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Text, Enum
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime
import enum

# 1. Database Connection
DATABASE_URL = "postgresql://admin:admin@localhost:5433/healthcare_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Enums (Fixed Options)
class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"
    LAB = "lab"             # NEW
    PHARMACIST = "pharmacist"

class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class OrderStatus(str, enum.Enum):
    PROCESSING = "processing"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERED = "delivered"

# 3. Tables

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
    doctor_id = Column(Integer, ForeignKey("users.id"))
    
    appointment_time = Column(DateTime)
    status = Column(String, default=AppointmentStatus.PENDING)
    type = Column(String) # "online" or "clinic"
    zoom_link = Column(String, nullable=True)
    symptoms_summary = Column(Text, nullable=True) # Summary from Chatbot
    
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

# 4. Dependency to get DB Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 5. Create Tables Function
def create_tables():
    Base.metadata.create_all(bind=engine)
    print("✅ Database Tables Created Successfully")

if __name__ == "__main__":
    create_tables()