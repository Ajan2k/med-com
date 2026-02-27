import requests
import json

try:
    url = "http://localhost:8000/auth/login"
    payload = {"email": "admin@hospital.com", "password": "admin123"}
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers)
    print("Status Code:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except:
        print("Response Text:", response.text)
except Exception as e:
    print("Exception:", e)
