import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env.local')

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL is missing")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    print("Adding delegate columns to hotels table...")
    
    alter_queries = [
        "ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS is_official_partner BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS has_shuttle_service BOOLEAN DEFAULT FALSE;"
    ]
    
    for query in alter_queries:
        cursor.execute(query)
    
    # Let's also set some defaults based on amenities for existing data
    print("Setting initial shuttle flags based on amenities...")
    cursor.execute("""
        UPDATE public.hotels 
        SET has_shuttle_service = TRUE 
        WHERE 'Shuttle' = ANY(amenities) OR 'Airport shuttle' = ANY(amenities);
    """)
    
    # Set a few official partners for demonstration (e.g. 5 star hotels)
    print("Setting default official partners for 5-star hotels...")
    cursor.execute("UPDATE public.hotels SET is_official_partner = TRUE WHERE stars >= 5;")
    
    conn.commit()
    print("Successfully updated schema and populated initial flags!")
    
except Exception as e:
    print(f"Database error: {e}")
finally:
    if 'cursor' in locals(): cursor.close()
    if 'conn' in locals(): conn.close()
