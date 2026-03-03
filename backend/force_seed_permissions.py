from database import SessionLocal, RolePermission
import json

def seed_permissions():
    db = SessionLocal()
    roles = ["admin", "doctor", "lab", "pharmacist"]
    
    # Default Permissions Matrix
    defaults = {
        "admin": {
            "manage_users": True,
            "manage_roles": True, 
            "manage_appointments": True,
            "manage_lab": True,
            "manage_pharmacy": True,
            "manage_inventory": True
        },
        "doctor": {
            "manage_users": False,
            "manage_roles": False,
            "manage_appointments": True,
            "manage_lab": False,
            "manage_pharmacy": False,
            "manage_inventory": False
        },
        "lab": {
            "manage_users": False,
            "manage_roles": False,
            "manage_appointments": False,
            "manage_lab": True,
            "manage_pharmacy": False,
            "manage_inventory": False
        },
        "pharmacist": {
            "manage_users": False,
            "manage_roles": False,
            "manage_appointments": False,
            "manage_lab": False,
            "manage_pharmacy": True,
            "manage_inventory": True
        }
    }
    
    for r in roles:
        existing = db.query(RolePermission).filter(RolePermission.role_name == r).first()
        if not existing:
            new_role = RolePermission(role_name=r, permissions=defaults[r])
            db.add(new_role)
            print(f"Seeded permissions for role: {r}")
        else:
            # Force update if permissions were malformed
            existing.permissions = defaults[r]
            print(f"Updated permissions for role: {r}")
            
    db.commit()
    db.close()
    print("Permissions Seeding Complete!")

if __name__ == "__main__":
    seed_permissions()
