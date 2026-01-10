from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from backend.config import settings
from backend.routers import auth, patient, admin
from backend.services.socket_manager import socket_manager

# 1. Initialize FastAPI
app = FastAPI(title=settings.PROJECT_NAME)

# 2. CORS Middleware (Allow React to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount Routes
app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(admin.router)

# 4. Mount Socket.IO (Real-time Layer)
# We wrap the FastAPI app with the Socket.IO ASGI app
app = socketio.ASGIApp(socket_manager.server, other_asgi_app=app)

@app.other_asgi_app.get("/")
def health_check():
    return {"status": "online", "message": "Healthcare Enterprise Platform is Running"}