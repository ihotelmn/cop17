import os
import uuid
import pandas as pd
import psycopg2
import glob
import json
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

load_dotenv('.env.local')

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL is missing")
    exit(1)
if "sslmode=" not in db_url and "supabase.co" in db_url:
    db_url += "?sslmode=require"

def safe_int(v, default=0):
    if pd.isna(v): return default
    try: return int(float(v))
    except: return default

base = '/Users/erkardo/Desktop/COP17_Data/forcop17/pms'

# 1. Load Amenities
amenity_map = {}
try:
    amen_files = glob.glob(os.path.join(base, 'pms.amenities/1/*.parquet'))
    if amen_files:
        df_amen = pd.read_parquet(amen_files[0])
        for _, row in df_amen.iterrows():
            name = row['name_en'] if pd.notna(row['name_en']) and str(row['name_en']).strip() != '' else row['name']
            amenity_map[row['id']] = str(name).strip()
except Exception as e:
    print(f"Warning loading amenities: {e}")

hotel_amenities = {}
try:
    rat_files = glob.glob(os.path.join(base, 'pms.amenity_room_type/1/*.parquet'))
    rt_files = glob.glob(os.path.join(base, 'pms.room_types/1/*.parquet'))
    if rat_files and rt_files:
        df_rat = pd.read_parquet(rat_files[0])
        df_rt = pd.read_parquet(rt_files[0])
        
        # Room Type ID -> Hotel ID
        rt_to_hotel = df_rt.set_index('id')['hotel_id'].to_dict()
        
        for _, row in df_rat.iterrows():
            rt_id = row['room_type_id']
            a_id = row['amenity_id']
            h_id = rt_to_hotel.get(rt_id)
            if h_id and a_id in amenity_map:
                if h_id not in hotel_amenities:
                    hotel_amenities[h_id] = set()
                hotel_amenities[h_id].add(amenity_map[a_id])
except Exception as e:
    print(f"Warning mapping amenities: {e}")

# 2. Load Hotels
hotels_files = glob.glob(os.path.join(base, 'pms.hotels/1/*.parquet'))
df_hotels = pd.read_parquet(hotels_files[0])

# Pre-calculate reviews
reviews_agg = {}
try:
    reviews_files = glob.glob(os.path.join(base, 'pms.reviews/1/*.parquet'))
    if reviews_files:
        df_rev = pd.read_parquet(reviews_files[0])
        df_rev = df_rev[df_rev['is_approved'] == 1]
        if not df_rev.empty:
            agg = df_rev.groupby('hotel_id').agg(
                avg_rating=('average', 'mean'),
                review_count=('id', 'count')
            ).reset_index()
            for _, r in agg.iterrows():
                reviews_agg[r['hotel_id']] = {
                    'rating': round(float(r['avg_rating']), 1),
                    'count': int(r['review_count'])
                }
except Exception as e:
    print(f"Warning loading reviews: {e}")

df_hotels = df_hotels.dropna(subset=['name'])
print(f"Total authentic hotels to migrate: {len(df_hotels)}")

records = []
for idx, row in df_hotels.iterrows():
    name = str(row['name']).strip()
    old_id = row['id']
    
    desc = str(row['introduction']) if pd.notna(row['introduction']) else str(row['description'])
    if pd.isna(desc) or desc == 'nan' or desc == 'None' or str(desc).strip() == '':
        desc = None
        
    address = str(row['address']) if pd.notna(row['address']) else None
    
    stars_raw = row['star_rating']
    stars = 0
    if pd.notna(stars_raw):
        try: stars = int(float(stars_raw))
        except: pass
    if stars < 0 or stars > 5: stars = 0
        
    created_at = row['created_at'] if pd.notna(row['created_at']) else pd.Timestamp.now()
    
    # 3. Coordinate Filtering (Mongolia bounds: 41-52N, 87-120E)
    lat, lng = None, None
    if pd.notna(row.get('lat')):
        try:
            v = float(row['lat'])
            if 41 <= v <= 52: lat = v
        except: pass
    if pd.notna(row.get('lng')):
        try:
            v = float(row['lng'])
            if 87 <= v <= 120: lng = v
        except: pass

    if (lat is None or lng is None) and pd.notna(row.get('location')):
        try:
            loc_data = json.loads(row['location'])
            v_lat = float(loc_data['lat'])
            v_lng = float(loc_data['lng'])
            if 41 <= v_lat <= 52: lat = v_lat
            if 87 <= v_lng <= 120: lng = v_lng
        except: pass
            
    # 4. Images
    images_list = []
    if pd.notna(row.get('image')):
        images_list.append(str(row['image']).replace('\\/', '/'))
    if pd.notna(row.get('images')):
        img_val = str(row['images']).strip()
        if img_val.startswith('['):
            try:
                parsed = json.loads(img_val)
                if isinstance(parsed, list):
                    images_list.extend([str(x).replace('\\/', '/') for x in parsed])
            except: pass
    
    images_list = list(dict.fromkeys(images_list))
    
    # 5. Amenities
    amenities = list(hotel_amenities.get(old_id, []))
    
    rev_data = reviews_agg.get(old_id, {'rating': None, 'count': None})
    cached_rating = rev_data['rating']
    cached_review_count = rev_data['count']

    ns = uuid.NAMESPACE_OID
    hotel_id = str(uuid.uuid5(ns, f"hotel_{old_id}"))

    # 6. Strict Filtering
    is_active = safe_int(row.get('is_active'), 0) == 1
    is_test = safe_int(row.get('is_test'), 0) == 1
    is_closed = safe_int(row.get('is_closed'), 0) == 1

    if not is_active or is_test or is_closed:
        continue
        
    if not images_list:
        # User requested to hide hotels without images
        continue

    records.append((
        hotel_id, name, desc, address, stars, amenities, images_list, created_at,
        lat, lng, cached_rating, cached_review_count
    ))

print(f"Total formatted hotels: {len(records)}")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    insert_query = """
    INSERT INTO public.hotels (
        id, name, description, address, stars, amenities, images, created_at,
        latitude, longitude, cached_rating, cached_review_count
    ) VALUES (
        %s, %s, %s, %s, %s, %s::text[], %s::text[], %s,
        %s, %s, %s, %s
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        address = EXCLUDED.address,
        stars = EXCLUDED.stars,
        amenities = EXCLUDED.amenities,
        images = EXCLUDED.images,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        cached_rating = EXCLUDED.cached_rating,
        cached_review_count = EXCLUDED.cached_review_count;
    """
    
    execute_batch(cursor, insert_query, records, page_size=200)
    conn.commit()
    print("Successfully re-imported hotels with amenities and filtered locations!")
    
except Exception as e:
    print(f"Database error: {e}")
finally:
    if 'cursor' in locals(): cursor.close()
    if 'conn' in locals(): conn.close()
