import json
import os

import psycopg2
from dotenv import load_dotenv

load_dotenv(".env.local")

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    raise SystemExit("DATABASE_URL is missing")

if "sslmode=" not in db_url and "supabase.co" in db_url:
    db_url += "?sslmode=require"

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

try:
    cursor.execute(
        """
        UPDATE public.hotels
        SET
            cached_distance_km = NULL,
            cached_drive_time_text = NULL,
            cached_drive_time_value = NULL,
            cached_walk_time_text = NULL,
            cached_walk_time_value = NULL
        WHERE
            cached_distance_km IS NOT NULL
            OR cached_drive_time_text IS NOT NULL
            OR cached_drive_time_value IS NOT NULL
            OR cached_walk_time_text IS NOT NULL
            OR cached_walk_time_value IS NOT NULL
        """
    )
    updated_count = cursor.rowcount
    conn.commit()
    print(json.dumps({"cleared_hotels": updated_count}, ensure_ascii=False))
finally:
    cursor.close()
    conn.close()
