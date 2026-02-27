import sqlite3
import os

# Paths
root_db = 'database.db'
backend_db = 'backend/database.db'

def merge_db():
    if not os.path.exists(backend_db):
        print(f"Backend DB {backend_db} NOT found. Nothing to merge.")
        return

    print(f"Merging {backend_db} into {root_db}...")
    
    # Connect to both
    conn_root = sqlite3.connect(root_db)
    conn_backend = sqlite3.connect(backend_db)
    
    # Get tables from backend
    cursor_backend = conn_backend.cursor()
    cursor_backend.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor_backend.fetchall()
    
    for table_tuple in tables:
        table = table_tuple[0]
        if table.startswith('sqlite_'): continue
        
        print(f"  Processing table: {table}")
        # Get count
        cursor_backend.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor_backend.fetchone()[0]
        print(f"    Found {count} records in {backend_db}")
        
        # Simple copy if table exists in root
        try:
            # We use 'INSERT OR IGNORE' to avoid duplicates if they exist in both
            # This is a guestimated merge approach
            # First ensure table exists in root by copying schema if needed
            cursor_backend.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table}';")
            schema = cursor_backend.fetchone()[0]
            
            try:
                conn_root.execute(schema)
            except sqlite3.OperationalError:
                pass # Table already exists
            
            # Copy data
            data = cursor_backend.execute(f"SELECT * FROM {table}").fetchall()
            if data:
                placeholders = ', '.join(['?'] * len(data[0]))
                conn_root.executemany(f"INSERT OR IGNORE INTO {table} VALUES ({placeholders})", data)
                print(f"    Merged {len(data)} records into {root_db}")
        except Exception as e:
            print(f"    Error merging {table}: {e}")

    conn_root.commit()
    conn_root.close()
    conn_backend.close()
    
    print("Merge complete.")

if __name__ == "__main__":
    merge_db()
