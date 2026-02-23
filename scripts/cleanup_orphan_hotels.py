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
    
    # Delete hotels that have no rooms
    cur.execute('''
        DELETE FROM public.hotels h 
        WHERE NOT EXISTS (
            SELECT 1 FROM public.rooms r 
            WHERE r.hotel_id = h.id
        );
    ''')
    deleted_count = cur.rowcount
    conn.commit()
    
    print(f"Successfully deleted {deleted_count} hotels with no rooms.")
    
    # Final count of valid hotels
    cur.execute("SELECT COUNT(*) FROM public.hotels;")
    final_count = cur.fetchone()[0]
    print(f"Final Count of active hotels with rooms: {final_count}")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
