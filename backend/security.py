from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from backend.config import settings

# 1. Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. AES Encryption (For Patient Symptoms/Data)
cipher_suite = Fernet(settings.ENCRYPTION_KEY)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

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