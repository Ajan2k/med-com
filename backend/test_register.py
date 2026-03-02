import requests
import string
import random

def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

def test_register():
    url = "http://127.0.0.1:8000/auth/register"
    uid = id_generator()
    payload = {
        "full_name": f"Test User {uid}",
        "email": f"test_{uid}@example.com",
        "password": "password123",
        "phone": "555-1234"
    }
    print(f"Testing Registration for: {payload['email']}")
    
    try:
        response = requests.post(url, json=payload)
        print("Status Code:", response.status_code)
        print("Response:", response.json())
        
        if response.status_code == 200:
            print("\nRegistration Successful. Now testing Login...")
            login_url = "http://127.0.0.1:8000/auth/login"
            login_payload = {
                "email": payload["email"],
                "password": payload["password"]
            }
            login_res = requests.post(login_url, json=login_payload)
            print("Login Status:", login_res.status_code)
            print("Login Response:", login_res.json())
            
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    test_register()
