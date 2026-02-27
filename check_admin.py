import sqlite3

def check_admin():
    db = 'database.db'
    try:
        conn = sqlite3.connect(db)
        cursor = conn.cursor()
        cursor.execute("SELECT id, full_name, role FROM users WHERE full_name LIKE '%Adhi%'")
        users = cursor.fetchall()
        print(f"Adhi Users found in {db}: {users}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_admin()
