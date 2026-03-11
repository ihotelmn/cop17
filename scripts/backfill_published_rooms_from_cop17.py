import json
import os
import uuid

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

from cop17_data_paths import read_table_frame
from room_source_utils import (
    derive_room_inventory,
    infer_room_capacity,
    pick_room_description,
    pick_room_name,
)

load_dotenv(".env.local")

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL is missing")
    raise SystemExit(1)

if "sslmode=" not in db_url and "supabase.co" in db_url:
    db_url += "?sslmode=require"


def dedupe_images(row):
    images_list = []
    for col in ["images", "photos"]:
        if col not in row or pd.isna(row[col]):
            continue

        img_val = str(row[col]).strip()
        if not img_val or img_val == "[]":
            continue

        if img_val.startswith("["):
            try:
                parsed = json.loads(img_val)
            except Exception:
                parsed = None
            if isinstance(parsed, list):
                images_list.extend([str(item).replace("\\/", "/") for item in parsed])
            continue

        images_list.append(img_val.replace("\\/", "/"))

    return list(dict.fromkeys(images_list))


def build_price_fallbacks(df_rate_plans, df_daily_rates):
    if df_rate_plans.empty or df_daily_rates.empty:
        return {}

    merged = df_daily_rates.merge(
        df_rate_plans[["id", "room_type_id"]],
        left_on="rate_plan_id",
        right_on="id",
        how="left",
    )
    merged = merged[merged["room_type_id"].notna() & merged["value"].notna()]
    merged = merged[merged["value"] > 0]
    if merged.empty:
        return {}

    return merged.groupby("room_type_id")["value"].min().to_dict()


df_hotels = read_table_frame("pms", "hotels")
df_room_types = read_table_frame("pms", "room_types")
df_rooms = read_table_frame("pms", "rooms")
df_rate_plans = read_table_frame("pms", "rate_plans")
df_daily_rates = read_table_frame("pms", "daily_rates")

inventory_counts = df_rooms.groupby("room_type_id").size().to_dict()
price_fallbacks = build_price_fallbacks(df_rate_plans, df_daily_rates)
hotel_room_number = {
    int(row["id"]): int(float(row["room_number"]))
    for _, row in df_hotels[df_hotels["room_number"].notna()].iterrows()
}

conn = None
cursor = None

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id
        FROM public.hotels
        WHERE is_published = TRUE
        """
    )
    published_hotel_ids = {row[0] for row in cursor.fetchall()}

    cursor.execute(
        """
        SELECT r.id, r.hotel_id, r.total_inventory
        FROM public.rooms r
        JOIN public.hotels h ON h.id = r.hotel_id
        WHERE h.is_published = TRUE
        """
    )
    current_rooms = {
        row[0]: {"hotel_id": row[1], "total_inventory": row[2]}
        for row in cursor.fetchall()
    }

    records = []
    inventory_fallback_hotels = {}
    for _, row in df_room_types.iterrows():
        source_hotel_id = int(float(row["hotel_id"]))
        hotel_id = str(uuid.uuid5(uuid.NAMESPACE_OID, f"hotel_{source_hotel_id}"))
        if hotel_id not in published_hotel_ids:
            continue

        source_room_type_id = int(float(row["id"]))
        room_id = str(uuid.uuid5(uuid.NAMESPACE_OID, f"room_{source_room_type_id}"))
        current_room = current_rooms.get(room_id)

        name = pick_room_name(row)
        if not name:
            continue

        description = pick_room_description(row)
        price_raw = row.get("default_price")
        price_mnt = float(price_raw) if pd.notna(price_raw) else 0.0
        if price_mnt <= 0:
            price_mnt = float(price_fallbacks.get(source_room_type_id, 0.0))
        if price_mnt <= 0:
            continue

        current_inventory = current_room["total_inventory"] if current_room else 0
        derived_inventory = derive_room_inventory(row, inventory_counts.get(source_room_type_id, 0))
        total_inventory = current_inventory if current_inventory and current_inventory > 0 else derived_inventory
        if total_inventory <= 0:
            continue

        size_val = row.get("floor_size")
        if pd.isna(size_val):
            size_val = row.get("size")
        size = float(size_val) if pd.notna(size_val) else 0.0
        images_list = dedupe_images(row)
        hotel_room_total = hotel_room_number.get(source_hotel_id)
        if current_inventory <= 0 and derived_inventory > 0 and hotel_room_total:
            inventory_fallback_hotels[source_hotel_id] = hotel_room_total

        records.append(
            (
                room_id,
                hotel_id,
                name,
                description,
                "Standard",
                round(price_mnt / 3400.0, 2),
                infer_room_capacity(row),
                images_list,
                size,
                total_inventory,
            )
        )

    upsert_query = """
        INSERT INTO public.rooms (
            id, hotel_id, name, description, type, price_per_night, capacity, images, size, total_inventory
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s::text[], %s, %s
        ) ON CONFLICT (id) DO UPDATE SET
            hotel_id = EXCLUDED.hotel_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            type = EXCLUDED.type,
            price_per_night = EXCLUDED.price_per_night,
            capacity = EXCLUDED.capacity,
            images = CASE
                WHEN array_length(EXCLUDED.images, 1) > 0 THEN EXCLUDED.images
                ELSE public.rooms.images
            END,
            size = EXCLUDED.size,
            total_inventory = CASE
                WHEN public.rooms.total_inventory > 0 THEN public.rooms.total_inventory
                ELSE EXCLUDED.total_inventory
            END
    """

    execute_batch(cursor, upsert_query, records, page_size=200)
    conn.commit()

    print(
        json.dumps(
            {
                "updated_room_records": len(records),
                "published_hotels": len(published_hotel_ids),
                "inventory_fallback_hotels": inventory_fallback_hotels,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
except Exception as error:
    if conn:
        conn.rollback()
    raise error
finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
