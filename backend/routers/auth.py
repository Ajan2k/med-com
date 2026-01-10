from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db, User, UserRole
from backend.security import verify_password, get_password_hash, create_access_token
from pydantic import BaseModel
import uuid
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    phone: str = None

@router.post("/register")
def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    unique_suffix = str(uuid.uuid4())[:4].upper()
    current_year = datetime.now().year
    patient_id = f"PAT-{current_year}-{unique_suffix}"

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=UserRole.PATIENT,
        patient_uid=patient_id,
        phone=user_data.phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Registration successful", "patient_id": patient_id}

@router.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    
    # DEBUG PRINT
    print(f"✅ LOGIN SUCCESS: User {user.full_name} (ID: {user.id})")

    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "patient_id": user.patient_uid,
        "user_name": user.full_name,
        "id": user.id  # <--- WE MUST HAVE THIS
    }