import base64
import requests
import pytesseract
from PIL import Image
import io
from datetime import datetime, timedelta
from backend.config import settings

class IntegrationService:
    
    # --- ZOOM INTEGRATION (Simplified for Demo) ---
    def create_zoom_meeting(self, topic: str, start_time: datetime):
        """
        Creates a meeting link. 
        NOTE: Real production requires Server-to-Server OAuth. 
        This is a placeholder that returns a valid-looking link structure.
        """
        # In a real app, you would POST to [https://api.zoom.us/v2/users/me/meetings](https://api.zoom.us/v2/users/me/meetings)
        # using a generated OAuth token.
        
        # Mocking a success response for now:
        meeting_id = "123456789"
        join_url = f"[https://zoom.us/j/](https://zoom.us/j/){meeting_id}?pwd=secure_hash"
        
        print(f" ZOOM: Created meeting '{topic}' at {start_time}")
        return join_url

    # --- OCR SERVICE (Prescription Reading) ---
    def extract_text_from_image(self, image_bytes: bytes):
        """
        Simulates OCR if Tesseract is missing.
        """
        try:
            # Try real OCR first
            import pytesseract
            # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe' 
            image = Image.open(io.BytesIO(image_bytes)).convert('L')
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            print(f"OCR Note: Tesseract not found. Using simulation. ({e})")
            # Fallback for demo
            return "Simulated: Amoxicillin 500mg, Paracetamol (OCR Missing)"

    # --- NOTIFICATIONS (SMS/Email) ---
    def send_notification(self, contact: str, message: str, method="email"):
        # Placeholder for Twilio / SendGrid
        print(f" NOTIFICATION sent to {contact}: {message}")
        return True

integration_service = IntegrationService()