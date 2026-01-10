from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db, Appointment, Prescription
from backend.sockets import manager
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/appointments")
def get_all_appointments(db: Session = Depends(get_db)):
    # Return all appointments (doctors + lab)
    return db.query(Appointment).all()

@router.get("/pharmacy_queue")
def get_pharmacy_queue(db: Session = Depends(get_db)):
    return db.query(Prescription).all()

@router.post("/update_status")
async def update_status(
    item_type: str, 
    item_id: int, 
    new_status: str, 
    new_date: Optional[str] = None, 
    new_time: Optional[str] = None,
    db: Session = Depends(get_db)
):
    print(f"🔄 ADMIN UPDATE: {item_type} #{item_id} -> {new_status}")

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
                print(f"   ✅ Rescheduled to {new_dt}")
            except Exception as e:
                print(f"   ❌ Date Parse Error: {e}")

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