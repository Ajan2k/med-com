import requests

try:
    response = requests.get("http://127.0.0.1:8000/patient/doctors")
    print(f"Status: {response.status_code}")
    print(f"Data: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
