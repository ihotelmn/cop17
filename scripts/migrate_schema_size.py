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
    
    # 1. Add size column to rooms
    print("Adding size column to rooms table...")
    cur.execute("ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS size numeric DEFAULT 0;")
    
    conn.commit()
    print("Successfully updated database schema.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
