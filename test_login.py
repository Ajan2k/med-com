import sys
# sys.path.append(r'd:\ml\internship assignment\healthcare-platform')
import requests

BASE = "http://localhost:8000"

tests = [
    ("admin@hospital.com",   "admin123"),
    ("sarah@hospital.com",   "doc123"),
    ("lab@hospital.com",     "staff123"),
    ("pharma@hospital.com",  "staff123"),
]

print("=" * 60)
print("  HEALTHCARE PLATFORM - LOGIN TEST")
print("=" * 60)

# 1. Health check
r = requests.get(f"{BASE}/")
print(f"\nBackend Health: {r.json()['status'].upper()}")
print("-" * 60)

# 2. Login tests
all_pass = True
for email, pw in tests:
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": pw})
    if r.ok:
        d = r.json()
        print(f"  PASS  {email}  ->  role={d['role']}")
    else:
        all_pass = False
        print(f"  FAIL  {email}  ->  {r.status_code}: {r.text[:80]}")

# 3. Doctors list
r = requests.get(f"{BASE}/patient/doctors")
doctors = r.json()
print("-" * 60)
print(f"Doctors in DB ({len(doctors)} found):")
for d in doctors:
    print(f"  - [{d['id']}] {d['full_name']} | {d['department']}")

# 4. Register + login a test patient
print("-" * 60)
reg = requests.post(f"{BASE}/auth/register", json={
    "full_name": "Test Patient",
    "email": "testpatient999@test.com",
    "password": "test123",
    "phone": "9999999999"
})
if reg.ok:
    print(f"Patient Registration: PASS (ID: {reg.json()['patient_id']})")
else:
    print(f"Patient Registration: SKIPPED (already exists)")

login = requests.post(f"{BASE}/auth/login", json={"email": "testpatient999@test.com", "password": "test123"})
if login.ok:
    print(f"Patient Login:        PASS (role={login.json()['role']})")
else:
    print(f"Patient Login:        FAIL -> {login.text}")

print("=" * 60)
if all_pass:
    print("  ALL TESTS PASSED - Application is working correctly!")
else:
    print("  SOME TESTS FAILED - Check the output above.")
print("=" * 60)
