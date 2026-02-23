import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env.local')
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    print("DATABASE_URL not found")
    exit(1)

if 'sslmode=' not in db_url:
    db_url += '?sslmode=require'

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM public.hotels LIMIT 5;")
    rows = cur.fetchall()
    for row in rows:
        print(f"{row[0]}: {row[1]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
