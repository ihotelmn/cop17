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
    exit(1)
if "sslmode=" not in db_url and "supabase.co" in db_url:
    db_url += "?sslmode=require"

df = read_table_frame("pms", "reservations")

print(f"Total authentic bookings raw count: {len(df)}")
df = df.dropna(subset=['check_in', 'check_out'])

records = []
for idx, row in df.iterrows():
    # room_id matching
    room_clone_id = row['room_type_clone_id'] if pd.notna(row['room_type_clone_id']) else row.get('room_clone_id')
    if pd.isna(room_clone_id):
        continue
    
    old_room_id = str(int(float(room_clone_id)))
    ns = uuid.NAMESPACE_OID
    new_room_id = str(uuid.uuid5(ns, f"room_{old_room_id}"))
    
    # Generic user
    user_id = "00000000-0000-0000-0000-000000000000"
    
    check_in_date = pd.to_datetime(row['check_in']).strftime('%Y-%m-%d')
    check_out_date = pd.to_datetime(row['check_out']).strftime('%Y-%m-%d')
    
    amount_raw = row['amount']
    # Price converted from MNT to USD
    total_price_mnt = float(amount_raw) if pd.notna(amount_raw) else 0.0
    total_price = round(total_price_mnt / 3400.0, 2)
    
    status_raw = str(row['status']).lower() if pd.notna(row['status']) else 'confirmed'
    if 'cancel' in status_raw or status_raw == '2':
        status = 'cancelled'
    elif 'pend' in status_raw or status_raw == '0':
        status = 'pending'
    elif 'checkout' in status_raw or status_raw == '3':
        status = 'completed'
    else:
        status = 'confirmed'
        
    created_at = row['created_at'] if pd.notna(row['created_at']) else pd.Timestamp.now()
    
    guest_passport_encrypted = None
    guest_phone_encrypted = None
    special_requests_encrypted = str(row['notes']) if pd.notna(row.get('notes')) else None
    
    old_res_id = str(row['id'])
    new_res_id = str(uuid.uuid5(ns, f"res_{old_res_id}"))
    
    records.append((
        new_res_id, user_id, new_room_id, check_in_date, check_out_date,
        status, total_price, guest_passport_encrypted, guest_phone_encrypted,
        special_requests_encrypted, created_at
    ))

print(f"Total formatted bookings: {len(records)}")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    # Create legacy user stub if not exists
    cursor.execute("""
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, aud, role, created_at, updated_at) 
        VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'legacy@ihotel.mn', 'fake', 'authenticated', 'authenticated', NOW(), NOW())
        ON CONFLICT DO NOTHING;
    """)
    cursor.execute("""
        INSERT INTO public.profiles (id, email, full_name, role) 
        VALUES ('00000000-0000-0000-0000-000000000000', 'legacy@ihotel.mn', 'Legacy Imported Guest', 'guest')
        ON CONFLICT DO NOTHING;
    """)
    
    # Validation against valid rooms
    cursor.execute("SELECT id FROM public.rooms;")
    valid_room_ids = {r[0] for r in cursor.fetchall()}
    valid_records = [r for r in records if r[2] in valid_room_ids]
    skipped = len(records) - len(valid_records)
    
    insert_query = """
    INSERT INTO public.bookings (
        id, user_id, room_id, check_in_date, check_out_date,
        status, total_price, guest_passport_encrypted, guest_phone_encrypted,
        special_requests_encrypted, created_at
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
    ) ON CONFLICT (id) DO UPDATE SET
        check_in_date = EXCLUDED.check_in_date,
        check_out_date = EXCLUDED.check_out_date,
        status = EXCLUDED.status,
        total_price = EXCLUDED.total_price;
    """
    
    print(f"Executing batch insert/update of {len(valid_records)} bookings...")
    execute_batch(cursor, insert_query, valid_records, page_size=500)
    
    conn.commit()
    print(f"Successfully imported {len(valid_records)} authentic bookings! Skipped {skipped} missing rooms.")
    
except Exception as e:
    print(f"Database error: {e}")
finally:
    if 'cursor' in locals(): cursor.close()
    if 'conn' in locals(): conn.close()
