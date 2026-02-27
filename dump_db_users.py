import sqlite3
import sys
conn = sqlite3.connect("database.db")
c = conn.cursor()
c.execute("SELECT email, role FROM users")
print(c.fetchall())
sys.exit(0)
