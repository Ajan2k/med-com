from database import SessionLocal, User, UserRole
import passlib.hash

def seed_doctors():
    db = SessionLocal()
    
    new_doctors = [
        {"name": "Dr. Sarah Jenkins", "dept": "Gastroenterology", "email": "s.jenkins@medicare.com", "phone": "555-0101"},
        {"name": "Dr. Mark Ruffin", "dept": "Pediatrics", "email": "m.ruffin@medicare.com", "phone": "555-0102"},
        {"name": "Dr. Emily Chen", "dept": "Dermatology", "email": "e.chen@medicare.com", "phone": "555-0103"},
        {"name": "Dr. Robert Lang", "dept": "General Practice", "email": "r.lang@medicare.com", "phone": "555-0104"}
    ]
    
    for doc in new_doctors:
        # Check if exists
        existing = db.query(User).filter(User.email == doc["email"]).first()
        if not existing:
            new_doc = User(
                full_name=doc["name"],
                email=doc["email"],
                phone=doc["phone"],
                role=UserRole.DOCTOR,
                department=doc["dept"],
                hashed_password=passlib.hash.bcrypt.hash("password")
            )
            db.add(new_doc)
            print(f"Added {doc['name']} to {doc['dept']}")
        else:
            print(f"{doc['name']} already exists")
            
    db.commit()
    db.close()
    print("Done seeding new doctors.")

if __name__ == "__main__":
    seed_doctors()
