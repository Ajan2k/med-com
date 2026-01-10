import requests

API_URL = "http://localhost:8000/auth/register"

doctors = [
    {"full_name": "Sarah Smith", "email": "sarah@hospital.com", "password": "doc123", "phone": "111", "dept": "General"},
    {"full_name": "James Bond", "email": "james@hospital.com", "password": "doc123", "phone": "222", "dept": "Cardiology"},
    {"full_name": "Gregory House", "email": "house@hospital.com", "password": "doc123", "phone": "333", "dept": "Neurology"},
    {"full_name": "Strange", "email": "strange@hospital.com", "password": "doc123", "phone": "444", "dept": "Orthopedics"}
]

# 1. Register Users
for doc in doctors:
    payload = {
        "full_name": doc["full_name"], # Note: NOT adding "Dr." here to fix the double prefix
        "email": doc["email"],
        "password": doc["password"],
        "phone": doc["phone"]
    }
    try:
        r = requests.post(API_URL, json=payload)
        if r.status_code == 200:
            print(f"✅ Registered {doc['full_name']}")
        else:
            print(f"⚠️ {doc['full_name']} already exists.")
    except:
        print("Server not running?")

# 2. Promote to Doctors (Direct DB Access)
from backend.database import SessionLocal, User, UserRole
db = SessionLocal()

for doc in doctors:
    user = db.query(User).filter(User.email == doc["email"]).first()
    if user:
        user.role = UserRole.DOCTOR
        db.commit()
        print(f"👨‍⚕️ Promoted {user.full_name} to DOCTOR")

db.close()