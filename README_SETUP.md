# Healthcare Enterprise Platform - Setup Guide

## 🚀 Quick Start
To run the entire project (Backend + Patient App + Admin Panel), simply double-click:
**`start_dev.bat`**

This will open 3 terminal windows and start all services automatically.

---

## 🔑 Key Configuration (IMPORTANT)
The project uses strict security and AI features. You **must** configure the API keys for full functionality.

1. Open `backend/.env`
2. Update the following keys:
   - **GROQ_API_KEY**: Required for the AI Chatbot. Get a free key from [Groq Console](https://console.groq.com/keys).
   - **ZOOM_...**: Optional. Required only if you want to generate real Zoom links for appointments.
   - **ENCRYPTION_KEY**: I have generated a valid security key for you. Do not change it unless necessary.

---

## 📂 Project Structure
- **backend/**: The FastAPI Python server (Port 8000).
  - `app.py`: Main entry point.
  - `routers/`: Contains logic for Patients, Admins, and Auth.
  - `services/ai_engine.py`: The brain (Llama-3 Integration).
- **frontend-user/**: The Patient Portal (React + Vite).
  - Runs on Port 5173 (usually).
- **frontend-admin/**: The Hospital Staff Dashboard (React + Vite).
  - Runs on Port 5174 (usually).

## 🛠️ Troubleshooting
- **AI Chat not replying?** Check if you added the `GROQ_API_KEY` in `backend/.env`.
- **Database errors?** Delete `database.db` in the root folder to reset the database.
- **Port already in use?** Close existing terminal windows running the server.
