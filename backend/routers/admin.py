from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db, Appointment, Prescription
from backend.services.socket_manager import socket_manager as manager
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class AdminAppointmentRequest(BaseModel):
    patient_name: str
    patient_phone: str
    doctor_id: int
    date_str: str 
    time_slot: str 
    type: str

class AdminLabRequest(BaseModel):
    patient_name: str
    patient_phone: str
    test_name: str

class AdminUserCreateRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str
    phone: Optional[str] = None
    department: Optional[str] = None

class AdminUserStatusRequest(BaseModel):
    is_active: bool

class RolePermissionUpdateRequest(BaseModel):
    role_name: str
    permissions: dict

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/appointments")
def get_all_appointments(db: Session = Depends(get_db)):
    from backend.database import User
    # Return all appointments (doctors + lab), but join with User to get patient name and phone
    appointments = db.query(Appointment).all()
    results = []
    for appt in appointments:
        patient = db.query(User).filter(User.id == appt.patient_id).first()
        results.append({
            "id": appt.id,
            "patient_id": appt.patient_id,
            "doctor_id": appt.doctor_id,
            "appointment_time": appt.appointment_time,
            "status": appt.status,
            "type": appt.type,
            "zoom_link": appt.zoom_link,
            "doctor_name": appt.doctor_name,
            "patient_name": patient.full_name if patient else "Unknown",
            "patient_phone": patient.phone if patient else None,
            "lab_result": appt.lab_result,
            "lab_report_url": appt.lab_report_url
        })
    return results

@router.get("/pharmacy_queue")
def get_pharmacy_queue(db: Session = Depends(get_db)):
    from backend.database import User
    prescriptions = db.query(Prescription).all()
    results = []
    for rx in prescriptions:
        patient = db.query(User).filter(User.id == rx.patient_id).first()
        results.append({
            "id": rx.id,
            "patient_id": rx.patient_id,
            "extracted_data": rx.extracted_data,
            "status": rx.status,
            "patient_name": patient.full_name if patient else "Unknown",
            "patient_phone": patient.phone if patient else None
        })
    return results

@router.post("/update_status")
async def update_status(
    item_type: str, 
    item_id: int, 
    new_status: str, 
    new_date: Optional[str] = None, 
    new_time: Optional[str] = None,
    new_result: Optional[str] = None,
    db: Session = Depends(get_db)
) :
    print(f" ADMIN UPDATE: {item_type} #{item_id} -> {new_status}")

    if item_type == "appointment":
        appt = db.query(Appointment).filter(Appointment.id == item_id).first()
        if not appt: 
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        appt.status = new_status
        
        # LOGIC TO UPDATE TIME IF RESCHEDULING
        if new_status == 'rescheduled' and new_date and new_time:
            try:
                new_dt_str = f"{new_date} {new_time}"
                new_dt = datetime.strptime(new_dt_str, "%Y-%m-%d %H:%M")
                appt.appointment_time = new_dt
                print(f"    Rescheduled to {new_dt}")
            except Exception as e:
                print(f"    Date Parse Error: {e}")

        if new_result:
            appt.lab_result = new_result
            print(f"    Added Result: {new_result}")

        db.commit()
        
        # Notify Clients via Socket
        await manager.broadcast(f"Appointment #{item_id} is now {new_status}")
        
    elif item_type == "prescription":
        rx = db.query(Prescription).filter(Prescription.id == item_id).first()
        if rx:
            rx.status = new_status
            db.commit()
            await manager.broadcast(f"Prescription #{item_id} is now {new_status}")

    return {"message": "Status updated"}

@router.get("/patients")
def get_all_patients(db: Session = Depends(get_db)):
    from backend.database import User
    patients = db.query(User).filter(User.role == "patient").all()
    # Map to id, name, phone for frontend selection
    return [{"id": p.id, "full_name": p.full_name, "phone": p.phone} for p in patients]

@router.post("/book_appointment")
async def admin_book_appointment(req: AdminAppointmentRequest, db: Session = Depends(get_db)):
    from backend.database import User, AppointmentStatus
    try:
        # Check if patient exists by phone
        patient = db.query(User).filter(User.phone == req.patient_phone, User.role == "patient").first()
        if not patient:
            # Create a new patient profile
            patient = User(
                full_name=req.patient_name,
                phone=req.patient_phone,
                role="patient",
                email=f"{req.patient_phone}@temp.com", # Mock email, just to satisfy unique constraint
                hashed_password="mock" 
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
        else:
            # Update name if it changed
            if patient.full_name != req.patient_name:
                patient.full_name = req.patient_name
                db.commit()

        # Parse the appointment time
        appt_dt = datetime.strptime(f"{req.date_str} {req.time_slot}", "%Y-%m-%d %H:%M")
        
        # Create appointment
        new_appt = Appointment(
            patient_id=patient.id,
            doctor_id=req.doctor_id,
            appointment_time=appt_dt,
            type=req.type,
            status=AppointmentStatus.PENDING
        )
        db.add(new_appt)
        db.commit()

        # Try to broadcast event
        try:
            await manager.broadcast(f"New Appointment #{new_appt.id} booked by Admin")
        except:
            pass
            
        return {"message": "Booking Successful"}
    except Exception as e:
        print(f"Error booking admin appt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/book_lab")
async def admin_book_lab(req: AdminLabRequest, db: Session = Depends(get_db)):
    from backend.database import User, AppointmentStatus
    try:
        # Check if patient exists by phone
        patient = db.query(User).filter(User.phone == req.patient_phone, User.role == "patient").first()
        if not patient:
            # Create a new patient profile
            patient = User(
                full_name=req.patient_name,
                phone=req.patient_phone,
                role="patient",
                email=f"{req.patient_phone}@temp.com", # Mock email
                hashed_password="mock" 
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
        else:
            # Update name if it changed
            if patient.full_name != req.patient_name:
                patient.full_name = req.patient_name
                db.commit()

        # Create Lab Appointment
        new_appt = Appointment(
            patient_id=patient.id,
            doctor_id=None,
            appointment_time=datetime.now(),
            type="lab_test",
            doctor_name=req.test_name, # Storing the requested test in doctor_name for now
            status=AppointmentStatus.PENDING
        )
        db.add(new_appt)
        db.commit()
        db.refresh(new_appt)

        return {"message": "Lab Request Booked", "id": new_appt.id}
    except Exception as e:
        print(f"Error booking admin lab test: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- USER MANAGEMENT ENDPOINTS ---

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    from backend.database import User
    # Return all staff users (not patients)
    users = db.query(User).filter(User.role != "patient").all()
    return [{
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "role": u.role,
        "phone": u.phone,
        "department": u.department,
        "is_active": u.is_active
    } for u in users]

@router.post("/users")
def create_admin_user(req: AdminUserCreateRequest, db: Session = Depends(get_db)):
    from backend.database import User
    # Verify email uniqueness
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        full_name=req.full_name,
        email=req.email,
        hashed_password=req.password, # In production this should be hashed properly
        role=req.role,
        phone=req.phone,
        department=req.department,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "id": new_user.id}

@router.put("/users/{user_id}/status")
def update_user_status(user_id: int, req: AdminUserStatusRequest, db: Session = Depends(get_db)):
    from backend.database import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = req.is_active
    db.commit()
    return {"message": "User status updated successfully", "is_active": user.is_active}

@router.post("/users/{user_id}/reset_password")
def reset_user_password(user_id: int, db: Session = Depends(get_db)):
    from backend.database import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = "defaultpassword" # Reset to known default
    db.commit()
    return {"message": "Password reset to defaultpassword successfully"}

# --- ROLES & PERMISSIONS ENDPOINTS ---

@router.get("/roles/permissions")
def get_all_role_permissions(db: Session = Depends(get_db)):
    from backend.database import RolePermission
    role_perms = db.query(RolePermission).all()
    return [{
        "role_name": rp.role_name,
        "permissions": rp.permissions
    } for rp in role_perms]

@router.put("/roles/permissions")
def update_role_permissions(req: RolePermissionUpdateRequest, db: Session = Depends(get_db)):
    from backend.database import RolePermission
    role_perm = db.query(RolePermission).filter(RolePermission.role_name == req.role_name).first()
    
    if not role_perm:
        # Create it if it doesn't exist
        role_perm = RolePermission(role_name=req.role_name, permissions=req.permissions)
        db.add(role_perm)
    else:
        # Avoid SQLAlchemy JSON mutation issues by assigning a new dictionary
        role_perm.permissions = dict(req.permissions)
        
    db.commit()
    return {"message": f"Permissions for {req.role_name} updated successfully"}
