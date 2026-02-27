import os

files_to_delete = [
    'backend/database.db',
    'backend/.seeded'
]

for f in files_to_delete:
    try:
        if os.path.exists(f):
            os.remove(f)
            print(f"Deleted {f}")
        else:
            print(f"{f} not found.")
    except Exception as e:
        print(f"Error deleting {f}: {e}")
