@echo off
echo ===================================================
echo   HEALTHCARE PLATFORM - DEVELOPMENT SERVER START
echo ===================================================

:: 1. Backend Service
echo [1/3] Starting Backend API (Port 8000)...
start "Backend API" cmd /k "pip install -r backend/requirements.txt && uvicorn backend.app:app --reload --port 8000"

:: 2. Frontend User
echo [2/3] Starting Patient Portal (Frontend User)...
start "Patient Portal" cmd /k "cd frontend-user && npm install && npm run dev"

:: 3. Frontend Admin
echo [3/3] Starting Admin Dashboard (Frontend Admin)...
start "Admin Dashboard" cmd /k "cd frontend-admin && npm install && npm run dev"

echo ===================================================
echo   ALL SERVICES STARTED!
echo   - Backend: http://localhost:8000/docs
echo   - Patient Portal: (Check terminal for port, usually 5173)
echo   - Admin Panel: (Check terminal for port, usually 5174)
echo.
echo   IMPORTANT: Make sure to update backend/.env with your API Keys!
echo ===================================================
pause
