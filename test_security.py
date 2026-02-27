from backend.security import get_password_hash, verify_password, create_access_token

try:
    hash_val = get_password_hash("admin123")
    print("Hash:", hash_val)
    print("Verify:", verify_password("admin123", hash_val))
    token = create_access_token({"sub": "admin@hospital.com"})
    print("Token:", token)
except Exception as e:
    import traceback
    traceback.print_exc()
