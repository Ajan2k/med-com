from fastapi import FastAPI, Depends # Triggering reload to verify database path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import socketio
import sys
import os

# Add the parent directory (project root) to sys.path so we can import 'backend'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import settings
from backend.routers import auth, patient, admin, pharmacy
from backend.services.socket_manager import socket_manager
from backend.database import create_tables, get_db  # <--- IMPORT THIS

# 1. Initialize FastAPI (Use a different variable name temporarily)
fastapi_app = FastAPI(title=settings.PROJECT_NAME)

# 2. CORS Middleware
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount Routes
fastapi_app.include_router(auth.router)
fastapi_app.include_router(patient.router)
fastapi_app.include_router(admin.router)
fastapi_app.include_router(pharmacy.router)

# 4. STARTUP EVENT: Create Tables in Cloud DB
@fastapi_app.on_event("startup")
def on_startup():
    print("Server Starting... Creating Database Tables...")
    try:
        create_tables()
        print("Database Tables Created Successfully!")
    except Exception as e:
        print(f"Database Creation Failed: {e}")

# 5. Health Check (Enhanced Diagnostic)
@fastapi_app.get("/")
def health_check(db: Session = Depends(get_db)):
    from backend.database import DATABASE_URL, User, Appointment, Prescription
    try:
        user_count = db.query(User).count()
        appt_count = db.query(Appointment).count()
        rx_count = db.query(Prescription).count()
        return {
            "status": "online",
            "database": DATABASE_URL,
            "counts": {
                "users": user_count,
                "appointments": appt_count,
                "prescriptions": rx_count
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "database": DATABASE_URL}

# 6. Mount Socket.IO (Wrap the FastAPI app)
app = socketio.ASGIApp(socket_manager.server, other_asgi_app=fastapi_app)