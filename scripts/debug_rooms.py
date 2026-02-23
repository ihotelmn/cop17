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
    
    print("--- Rooms Table Columns ---")
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'rooms';")
    for row in cur.fetchall():
        print(f"{row[0]}: {row[1]}")
    
    print("\n--- Sample Room Data (images and size) ---")
    cur.execute("SELECT name, images, size FROM public.rooms LIMIT 5;")
    for row in cur.fetchall():
        print(f"Name: {row[0]}, Images: {row[1]}, Size: {row[2]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
