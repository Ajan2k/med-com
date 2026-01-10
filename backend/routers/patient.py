from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

from backend.database import get_db, Appointment, Prescription, User, AppointmentStatus
from backend.services.ai_engine import ai_service
from backend.services.integrations import integration_service
from backend.services.socket_manager import socket_manager
from backend.security import encrypt_pii
from backend.services.ai_engine import get_ai_response

router = APIRouter(prefix="/patient", tags=["Patient Operations"])

# --- SCHEMAS ---
class ChatRequest(BaseModel):
    message: str
    history: List[dict] = [] 

class AppointmentRequest(BaseModel):
    patient_id: int
    doctor_id: int
    date_str: str 
    time_slot: str 
    type: str 

class LabRequest(BaseModel):
    patient_id: int
    test_name: str

# --- 1. HEALTH CHAT ---
@router.post("/chat")
def health_chat(request: ChatRequest):
    analysis = ai_service.analyze_symptoms(request.message)
    if analysis.get("danger_level") == "High":
        return {
            "response": f"⚠️ ALERT: Your symptoms indicate high urgency ({analysis['department']}). Please book an appointment immediately.",
            "recommend_action": "book_appointment",
            "department": analysis['department']
        }
    
    ai_reply = ai_service.chat_response(request.message, request.history)
    return {"response": ai_reply, "recommend_action": "none"}

# --- 2. APPOINTMENT BOOKING ---
@router.get("/doctors")
def get_doctors(department: str = None, db: Session = Depends(get_db)):
    doctors = db.query(User).filter(User.role == "doctor").all()
    
    result = []
    for doc in doctors:
        # LOGIC TO ASSIGN DEPARTMENT BASED ON NAME (Since we reset the DB)
        dept = "General"
        if "Bond" in doc.full_name: dept = "Cardiology"
        elif "House" in doc.full_name: dept = "Neurology"
        elif "Strange" in doc.full_name: dept = "Orthopedics"
        
        result.append({
            "id": doc.id,
            "full_name": doc.full_name,
            "department": dept 
        })
        
    return result
    return result

@router.get("/slots")
def get_available_slots(doctor_id: int, date_str: str, db: Session = Depends(get_db)):
    # 1. Define Business Hours (09:00 to 17:00)
    slots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    ]
    
    # 2. Get Taken Slots from DB
    existing = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status != "cancelled"
    ).all()
    
    booked_times = []
    for appt in existing:
        if appt.appointment_time.strftime("%Y-%m-%d") == date_str:
            booked_times.append(appt.appointment_time.strftime("%H:%M"))

    # 3. Filter Logic
    final_slots = []
    now = datetime.now()
    check_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    
    for slot in slots:
        # Check A: Is it already booked?
        if slot in booked_times:
            continue
            
        # Check B: Is it in the past? (Only if date is TODAY)
        if check_date == now.date():
            slot_dt = datetime.strptime(f"{date_str} {slot}", "%Y-%m-%d %H:%M")
            if slot_dt < now:
                continue # Skip past time
        
        final_slots.append(slot)
    
    return {"slots": final_slots}

@router.post("/book_appointment")
async def book_appointment(req: AppointmentRequest, db: Session = Depends(get_db)):
    # Verify Patient and Doctor exist
    patient = db.query(User).filter(User.id == req.patient_id).first()
    doctor = db.query(User).filter(User.id == req.doctor_id).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if not doctor:
        # If doctor ID 1 is sent from frontend mock but doesn't exist in DB
        raise HTTPException(status_code=404, detail="Doctor not found in DB")

    appt_dt = datetime.strptime(f"{req.date_str} {req.time_slot}", "%Y-%m-%d %H:%M")
    zoom_url = None
    if req.type == "online":
        zoom_url = integration_service.create_zoom_meeting("Doctor Consult", appt_dt)

    new_appt = Appointment(
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        appointment_time=appt_dt,
        type=req.type,
        zoom_link=zoom_url,
        status=AppointmentStatus.PENDING
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    
    await socket_manager.broadcast_new_appointment({
        "id": new_appt.id,
        "doctor_id": req.doctor_id,
        "time": req.time_slot,
        "patient_id": req.patient_id
    })

    return {"message": "Booking Successful", "zoom_link": zoom_url}

# --- 3. MEDICINE UPLOAD ---
@router.post("/upload_prescription")
async def upload_prescription(
    patient_id: int = Form(...),   # <--- Converts string to int automatically
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    contents = await file.read()
    extracted_text = integration_service.extract_text_from_image(contents)
    
    # Encrypt data
    encrypted_data = encrypt_pii(extracted_text) if extracted_text else encrypt_pii("No text detected")
    
    new_rx = Prescription(
        patient_id=patient_id,
        image_url=file.filename,
        extracted_data=encrypted_data, 
        status="preparing"
    )
    db.add(new_rx)
    db.commit()
    
    return {"message": "Prescription Received", "extracted_preview": extracted_text or "Image received, processing..."}

@router.post("/book_lab")
def book_lab_test(req: LabRequest, db: Session = Depends(get_db)):
    # specific handling for lab tests
    new_appt = Appointment(
        patient_id=req.patient_id,
        doctor_id=None, # No specific doctor for lab
        appointment_time=datetime.now() + timedelta(days=1), # Mock time: tomorrow
        type="lab_test", # Special type
        zoom_link=None,
        status="confirmed"
    )
    db.add(new_appt)
    db.commit()
    return {"message": "Lab Test Booked", "test_name": req.test_name}

# --- UPDATE: My Appointments to include Lab Tests ---
@router.get("/my_appointments/{patient_id}")
def get_my_appointments(patient_id: int, db: Session = Depends(get_db)):
    appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id).all()
    results = []
    for appt in appointments:
        doc_name = "Lab Technician"
        if appt.doctor_id:
             doc = db.query(User).filter(User.id == appt.doctor_id).first()
             if doc: doc_name = doc.full_name
        
        # Format for frontend
        results.append({
            "id": appt.id,
            "doctor_name": doc_name,
            "time": appt.appointment_time,
            "zoom_link": appt.zoom_link,
            "status": appt.status,
            "type": appt.type # Send type so frontend knows if it's Lab or Doctor
        })
    return results

# --- 5. GET MY PRESCRIPTIONS (For Status) ---
@router.get("/my_prescriptions/{patient_id}")
def get_my_prescriptions(patient_id: int, db: Session = Depends(get_db)):
    prescriptions = db.query(Prescription).filter(Prescription.patient_id == patient_id).all()
    return prescriptions

@router.post("/chat")
def chat_with_ai(request: ChatRequest):
    # This now calls the Groq version
    response_text = get_ai_response(request.message, request.history)
    
    # Simple keyword check for booking button trigger
    recommend_action = "none"
    if "book" in response_text.lower() or "appointment" in response_text.lower():
        recommend_action = "book_appointment"

    return {"response": response_text, "recommend_action": recommend_action}