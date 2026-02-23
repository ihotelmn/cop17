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
    cur.execute('''
        SELECT h.name, COUNT(r.id) as room_count 
        FROM public.hotels h 
        LEFT JOIN public.rooms r ON h.id = r.hotel_id 
        GROUP BY h.id, h.name 
        HAVING COUNT(r.id) = 0 
        LIMIT 50;
    ''')
    rows = cur.fetchall()
    print(f"Hotels with 0 rooms: {len(rows)}")
    for row in rows:
        print(f"- {row[0]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
