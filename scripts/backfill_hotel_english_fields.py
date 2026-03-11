import json
import os
import uuid

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

from cop17_data_paths import read_table_frame

load_dotenv('.env.local')

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL is missing")
    raise SystemExit(1)

if "sslmode=" not in db_url and "supabase.co" in db_url:
    db_url += "?sslmode=require"

df_hotels = read_table_frame("pms", "hotels").dropna(subset=["name"])


def clean_text(value):
    if pd.isna(value):
        return None

    text = str(value).strip()
    if not text or text.lower() in {"null", "none", "nan"}:
        return None

    return text


records = []
for _, row in df_hotels.iterrows():
    old_id = int(row["id"])
    hotel_id = str(uuid.uuid5(uuid.NAMESPACE_OID, f"hotel_{old_id}"))
    records.append(
        (
            hotel_id,
            clean_text(row.get("name_en")),
            clean_text(row.get("address_en")),
            clean_text(row.get("description_en")),
        )
    )

print(f"Prepared english-field updates for {len(records)} source hotels.")

conn = None
cursor = None
try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    update_query = """
        UPDATE public.hotels
        SET
            name_en = COALESCE(%s, name_en),
            address_en = COALESCE(%s, address_en),
            description_en = COALESCE(%s, description_en)
        WHERE id = %s
    """

    batch = [(name_en, address_en, description_en, hotel_id) for hotel_id, name_en, address_en, description_en in records]
    execute_batch(cursor, update_query, batch, page_size=500)
    conn.commit()

    cursor.execute(
        """
        SELECT
            COUNT(*) FILTER (WHERE name_en IS NOT NULL) AS name_en_count,
            COUNT(*) FILTER (WHERE address_en IS NOT NULL) AS address_en_count,
            COUNT(*) FILTER (WHERE description_en IS NOT NULL) AS description_en_count
        FROM public.hotels
        """
    )
    counts = cursor.fetchone()
    print(
        json.dumps(
            {
                "name_en_count": counts[0],
                "address_en_count": counts[1],
                "description_en_count": counts[2],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
except Exception as exc:
    print(f"Database error: {exc}")
    raise
finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
