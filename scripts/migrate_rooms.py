import os
import uuid
import pandas as pd
import psycopg2
from dotenv import load_dotenv

from cop17_data_paths import read_table_frame
from room_source_utils import (
    derive_room_inventory,
    infer_room_capacity,
    pick_room_description,
    pick_room_name,
)

load_dotenv('.env.local')

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL is missing")
    exit(1)
if "sslmode=" not in db_url and "supabase.co" in db_url:
    db_url += "?sslmode=require"

df = read_table_frame("pms", "room_types")
df_physical_rooms = read_table_frame("pms", "rooms")
inventory_counts = df_physical_rooms.groupby("room_type_id").size().to_dict()

print(f"Total authentic rooms raw count: {len(df)}")
df = df.dropna(subset=['name', 'hotel_id'])

records = []
for idx, row in df.iterrows():
    name = pick_room_name(row)
    description = pick_room_description(row)
    
    # Prices: 1 USD = ~3400 MNT
    price_raw = row['default_price']
    price_mnt = float(price_raw) if pd.notna(price_raw) else 0.0
    price_usd = price_mnt / 3400.0
    price_usd = round(price_usd, 2)
    
    capacity = infer_room_capacity(row)
    
    # Hardcode room type if missing actual category logic
    room_type = "Standard"
    hotel_id_raw = str(int(float(row['hotel_id']))) if pd.notna(row['hotel_id']) else "0"
    
    # Size logic
    size_val = row.get('floor_size')
    if pd.isna(size_val): 
        size_val = row.get('size')
    size = float(size_val) if pd.notna(size_val) else 0.0
    
    images_list = []
    # Both 'images' and 'photos' fields might exist in pms
    for col in ['images', 'photos']:
        if col in df.columns and pd.notna(row[col]):
            img_val = str(row[col]).strip()
            if img_val == "" or img_val == "[]":
                continue
                
            if img_val.startswith('['):
                try:
                    import json
                    parsed = json.loads(img_val)
                    if isinstance(parsed, list):
                        images_list.extend([str(x).replace('\\/', '/') for x in parsed])
                except:
                    pass
            else:
                # Direct string path
                images_list.append(img_val.replace('\\/', '/'))

    # Unique images
    images_list = list(dict.fromkeys(images_list))
            
    amenities = []
    created_at = row['created_at'] if pd.notna(row['created_at']) else pd.Timestamp.now()
    
    ns_hotel = uuid.NAMESPACE_OID
    new_hotel_id = str(uuid.uuid5(ns_hotel, f"hotel_{hotel_id_raw}"))
    old_room_id = str(row['id'])
    total_inventory = derive_room_inventory(row, inventory_counts.get(row['id'], 0))
    if price_mnt <= 0 or total_inventory <= 0:
        continue

    new_room_id = str(uuid.uuid5(ns_hotel, f"room_{old_room_id}"))

    records.append((
        new_room_id, new_hotel_id, name, description, room_type,
        price_usd, capacity, amenities, images_list, size, created_at, total_inventory
    ))

print(f"Total formatted rooms: {len(records)}")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM public.hotels;")
    valid_hotel_ids = {row[0] for row in cursor.fetchall()}
    
    # DO UPDATE ON CONFLICT to overwrite the old broken `pms_old` data
    insert_query = """
    INSERT INTO public.rooms (
        id, hotel_id, name, description, type, price_per_night, capacity, amenities, images, size, created_at, total_inventory
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s::text[], %s::text[], %s, %s, %s
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        price_per_night = EXCLUDED.price_per_night,
        capacity = EXCLUDED.capacity,
        images = EXCLUDED.images,
        size = EXCLUDED.size,
        total_inventory = EXCLUDED.total_inventory;
    """
    
    valid_records = [r for r in records if r[1] in valid_hotel_ids]
    skipped = len(records) - len(valid_records)
    
    print(f"Executing batch insert/update of {len(valid_records)} rooms...")
    from psycopg2.extras import execute_batch
    execute_batch(cursor, insert_query, valid_records, page_size=500)
    
    conn.commit()
    print(f"Successfully imported {len(valid_records)} true PMS rooms! Skipped {skipped} due to missing parent hotel.")
    
except Exception as e:
    print(f"Database error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
