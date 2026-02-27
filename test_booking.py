import requests
import json

BASE_URL = "http://localhost:8000"

def test_booking_flow():
    print("--- 1. Fetching Patient ID ---")
    # Using the dummy patient created earlier
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "patient@example.com",
        "password": "password123"
    })
    if login_res.status_code != 200:
        print(f"Login Failed: {login_res.text}")
        return
    
    auth_data = login_res.json()
    token = auth_data["access_token"]
    patient_id = auth_data["id"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"--- 2. Fetching Doctors (Cardiology) ---")
    doc_res = requests.get(f"{BASE_URL}/patient/doctors", params={"department": "Cardiology"}, headers=headers)
    doctors = doc_res.json()
    if not doctors:
        print("No doctors found!")
        return
    
    doctor = doctors[0]
    print(f"Doctor Found: {doctor['full_name']} (ID: {doctor['id']})")
    
    print(f"--- 3. Fetching Slots for Today ---")
    today_str = "2026-02-27" # Hardcoding for test
    slot_res = requests.get(f"{BASE_URL}/patient/slots", params={
        "doctor_id": doctor['id'],
        "date_str": today_str
    }, headers=headers)
    
    slots_data = slot_res.json()
    print(f"Slots Received: {slots_data.get('slots')}")
    
    if not slots_data.get('slots'):
        print("No slots available at all!")
        return
    
    chosen_slot = slots_data['slots'][0]
    print(f"--- 4. Attempting Booking for {chosen_slot} ---")
    
    book_res = requests.post(f"{BASE_URL}/patient/book_appointment", json={
        "patient_id": patient_id,
        "doctor_id": doctor['id'],
        "date_str": today_str,
        "time_slot": chosen_slot,
        "type": "online"
    }, headers=headers)
    
    if book_res.status_code == 200:
        print(f"Booking SUCCESS: {book_res.json()}")
    else:
        print(f"Booking FAILED: {book_res.status_code} - {book_res.text}")

if __name__ == "__main__":
    test_booking_flow()
