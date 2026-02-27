from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
import bcrypt  # Replaced passlib with direct bcrypt import
from cryptography.fernet import Fernet
from backend.config import settings

# 2. AES Encryption (For Patient Symptoms/Data)
cipher_suite = Fernet(settings.ENCRYPTION_KEY)

# 1. Password Hashing (Passed directly to bcrypt to avoid passlib bug with bcrypt >= 4.1.0)
def verify_password(plain_password, hashed_password):
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password, hashed_password)

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# 3. Encryption Helpers
def encrypt_pii(data: str) -> str:
    """Encrypts text before saving to DB"""
    if not data: return None
    return cipher_suite.encrypt(data.encode()).decode()

def decrypt_pii(token: str) -> str:
    """Decrypts text for authorized viewing"""
    if not token: return None
    return cipher_suite.decrypt(token.encode()).decode()