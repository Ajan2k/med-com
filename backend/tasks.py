from celery import Celery
from backend.config import settings
import time

# Initialize Celery
celery_app = Celery(
    "healthcare_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

@celery_app.task
def send_email_notification(email: str, subject: str, body: str):
    """
    Simulates sending an email (takes 5 seconds).
    """
    print(f" SENDING EMAIL TO {email}...")
    time.sleep(5) # Simulate delay
    print(f" EMAIL SENT: {subject}")
    return "Done"

@celery_app.task
def generate_lab_report(patient_id: str):
    """
    Simulates generating a PDF report.
    """
    print(f" Generating PDF for {patient_id}...")
    time.sleep(10)
    print(" PDF Generated.")
    return "report.pdf"