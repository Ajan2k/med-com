import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    print(f"Testing Backend at {BASE_URL}...")
    
    # 1. Health Check
    try:
        res = requests.get(f"{BASE_URL}/")
        print(f"Health Check: {res.status_code}")
        print(f"Response: {json.dumps(res.json(), indent=2)}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

    # 2. Appointments
    try:
        res = requests.get(f"{BASE_URL}/admin/appointments")
        print(f"Appointments: {res.status_code}")
        data = res.json()
        print(f"Count: {len(data)}")
        if data:
            print(f"First Item: {data[0]}")
    except Exception as e:
        print(f"Appointments Failed: {e}")

    # 3. Medicines
    try:
        res = requests.get(f"{BASE_URL}/pharmacy/medicines")
        print(f"Medicines: {res.status_code}")
        data = res.json()
        print(f"Count: {len(data)}")
    except Exception as e:
        print(f"Medicines Failed: {e}")

if __name__ == "__main__":
    test_endpoints()
