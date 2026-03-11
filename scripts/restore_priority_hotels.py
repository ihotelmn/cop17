import json
import os
import uuid

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

from cop17_data_paths import read_table_frame
from hotel_geo_utils import sanitize_hotel_coordinates
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
    raise SystemExit(1)

if "sslmode=" not in db_url and "supabase.co" in db_url:
    db_url += "?sslmode=require"

df_hotels = read_table_frame("pms", "hotels")
df_room_types = read_table_frame("pms", "room_types")
df_rooms = read_table_frame("pms", "rooms")
df_rate_plans = read_table_frame("pms", "rate_plans")
df_daily_rates = read_table_frame("pms", "daily_rates")

df_mock_hotels = read_table_frame("mock_pms", "hotels")
df_mock_room_types = read_table_frame("mock_pms", "room_types")
df_mock_rooms = read_table_frame("mock_pms", "rooms")
df_mock_rate_plans = read_table_frame("mock_pms", "rate_plans")
df_mock_daily_rates = read_table_frame("mock_pms", "daily_rates")

SOURCE_OVERRIDES = {
    362: {
        "name_en": "UB Grand Hotel",
        "address_en": "8th Khoroo, Sukhbaatar District, Ulaanbaatar, Mongolia",
        "description_en": "UB Grand Hotel is a centrally located hotel in Ulaanbaatar with minimalist interiors and direct access to government offices, museums, restaurants, and major city landmarks near Sukhbaatar Square.",
        "website": "https://en.ub-grand.com/",
    },
    709: {
        "website": "https://www.grandhillhotel.mn/",
    },
    710: {
        "description_en": "Platinum Hotel Ulaanbaatar is a centrally located city hotel near Sukhbaatar Square, offering spacious modern rooms, free Wi-Fi, business support services, and convenient access to museums, embassies, and cultural landmarks.",
    },
    712: {
        "website": "https://www.premiumhotel.mn/",
    },
    713: {
        "website": "https://www.shangri-la.com/ulaanbaatar/shangrila/",
        "contact_phone": "+976 7010 1919",
        "publish": False,
    },
    717: {
        "website": "https://www.thecorporatehotel.com/",
        "contact_phone": "+976 11 312255",
    },
    719: {
        "name_en": "Zolo Hotel",
        "description_en": "Zolo Hotel is a four-star Ulaanbaatar hotel on Narnii Zam offering modern guest rooms, an on-site restaurant and bar, airport transfer support, and convenient access to the city center and transport links.",
        "website": "https://zolostar.goodstayy.es/",
        "contact_phone": "+976 11 331222",
    },
    723: {
        "website": "https://bishreltgroup.mn/bishrelt-xxk",
    },
    747: {
        "name_en": "Novotel Ulaanbaatar Hotel",
    },
    963: {
        "name_en": "Toyoko Inn Ulaanbaatar",
        "address_en": "9D Peace Avenue, 2nd Khoroo, Bayangol District, Ulaanbaatar 16050, Mongolia",
        "description_en": "Toyoko Inn Ulaanbaatar is a centrally located Japanese-style business hotel offering clean and efficient rooms, complimentary breakfast, and practical access to the railway station, government offices, and city attractions.",
        "website": "https://ulaanbaatar.toyoko-inn.com/en/",
        "contact_phone": "+976 7507 1045",
    },
    1485: {
        "name_en": "J Hotel",
        "address_en": "34 Paris Street, 1st Khoroo, Sukhbaatar District, Ulaanbaatar, Mongolia",
        "description_en": "J Hotel is a centrally located Ulaanbaatar hotel near Sukhbaatar Square, offering modern rooms, practical business-travel convenience, and easy access to museums, embassies, and dining districts.",
        "website": "https://en.jhotel.mn/",
        "contact_phone": "+976 7711 6996",
        "stars": 4,
        "images": [
            "https://cdn.greensoft.mn/uploads/site/377/photos/block/s_20180618142645_d8267d0e829bce660baf8fd94a3f8c8e.jpg",
            "https://cdn.greensoft.mn/uploads/site/377/photos/block/s_20180618142654_f6443253f3d8eadd26be1e73a02cd972.jpg",
            "https://cdn.greensoft.mn/uploads/site/377/photos/block/s_20180618142655_db47efed595d34f262484e5f03837c43.jpg",
        ],
    },
}

SOURCE_HOTEL_IDS = sorted(SOURCE_OVERRIDES.keys())

FALLBACK_SOURCE_HOTELS = [
    {
        "schema": "mock_pms",
        "hotel_id": 66,
        "slug": "springs-hotel-ulaanbaatar",
        "name": "Springs Hotel Ulaanbaatar",
        "name_en": "Springs Hotel Ulaanbaatar",
        "address": "Olympic Street 2A, Sukhbaatar District, Ulaanbaatar 14210, Mongolia",
        "address_en": "Olympic Street 2A, Sukhbaatar District, Ulaanbaatar 14210, Mongolia",
        "description": "Springs Hotel Ulaanbaatar is a cozy city-center hotel near Sukhbaatar Square, offering comfortable rooms, fitness and spa facilities, and easy access to key attractions and business districts.",
        "description_en": "Springs Hotel Ulaanbaatar is a cozy city-center hotel near Sukhbaatar Square, offering comfortable rooms, fitness and spa facilities, and easy access to key attractions and business districts.",
        "website": "https://springshotel.mn/",
        "contact_phone": "+976 11 320738",
        "stars": 3,
        "images": [
            "https://springshotel.mn/img/d436e0ea223a3b43.webp",
            "https://springshotel.mn/img/3765be6bff868f96.webp",
            "https://springshotel.mn/img/4f997dd1c6ab126b.webp",
        ],
    }
]

MANUAL_HOTELS = [
    {
        "slug": "best-western-premier-tuushin-hotel",
        "name": "Best Western Premier Tuushin Hotel",
        "address": "Prime Minister Amar Street 15, Ulaanbaatar 14200, Mongolia",
        "description": "Best Western Premier Tuushin Hotel is a five-star city-center hotel just steps from Sukhbaatar Square, offering luxury accommodation, contemporary event spaces, premium dining, a spa, and fitness facilities for business and leisure travelers.",
        "website": "https://tuushinhotel.com/",
        "contact_phone": "+976 11 32 3162",
        "stars": 5,
        "publish": False,
        "images": [
            "https://tuushinhotel.com/wp-content/uploads/2025/10/DJI_0714_2-scaled.jpg",
            "https://tuushinhotel.com/wp-content/uploads/2025/10/fN6CPZWUFi4ITzWKirypHClub-Suite-1-scaled.jpg",
            "https://tuushinhotel.com/wp-content/uploads/2025/10/P-suite.jpg",
        ],
    },
    {
        "slug": "hotel-nine-ulaanbaatar",
        "name": "Hotel Nine Ulaanbaatar",
        "address": "Prime Minister Amar Street 2, Sukhbaatar District, Ulaanbaatar 14200, Mongolia",
        "description": "Hotel Nine Ulaanbaatar is a centrally located hotel near Sukhbaatar Square, offering modern rooms, a buffet breakfast, restaurant and lounge spaces, and a practical base for both business and leisure stays in the capital.",
        "website": "https://hotelnine.mn/",
        "contact_phone": "+976 7711 4334",
        "stars": 3,
        "images": [
            "https://hotelnine.mn/img/6d49b948d6fda18e.webp",
            "https://hotelnine.mn/img/46e976845af485ef.webp",
            "https://hotelnine.mn/img/26d07f4e6cdf7e4c.webp",
        ],
    },
    {
        "slug": "khubilai-hotel-ulaanbaatar",
        "name": "Khubilai Hotel",
        "address": "Naadamchid Street, Ulaanbaatar, Mongolia",
        "description": "Khubilai Hotel is a five-star property near the airport in western Ulaanbaatar, combining contemporary comfort with Mongolian-inspired design, spacious rooms, wellness amenities, dining, and family-friendly recreation facilities.",
        "website": "https://khubilaihotel.com/",
        "contact_phone": "+976 7777 2626",
        "stars": 5,
        "images": [
            "https://khubilaihotel.com/upload/resize_cache/iblock/dd0/660_360_2619711fa078991f0a23d032687646b21/qzc3k2v044ykc0pgsukj7ld54bu1i8q9.jpeg",
            "https://khubilaihotel.com/upload/resize_cache/iblock/218/660_360_2619711fa078991f0a23d032687646b21/u0vmth0t50x61klya671fq53z1qg7af0.jpeg",
            "https://khubilaihotel.com/upload/resize_cache/iblock/358/660_360_2619711fa078991f0a23d032687646b21/awodamhhxu3mtnw61andgl0h6h970syd.jpeg",
        ],
    },
    {
        "slug": "park-hotel-ulaanbaatar",
        "name": "Park Hotel",
        "address": "Lhagvasuren Street 32, 4th Khoroo, Bayanzurkh District, Ulaanbaatar 112151, Mongolia",
        "description": "Park Hotel is a four-star Ulaanbaatar hotel offering modern rooms, a spa and wellness center, banquet facilities, and an on-site restaurant with convenient access to the city center and railway station.",
        "website": "https://www.hotelsclick.com/hotels/mongolia/ulaanbaatar/468180/hotel-park.html",
        "contact_phone": None,
        "stars": 4,
        "images": [
            "https://zen.wego.com/cdn-cgi/image/format=auto,quality=75,width=1200/image/upload/v1488573251/Partner/hotels/s/87478149/1847700768.jpeg",
            "https://zen.wego.com/cdn-cgi/image/format=auto,width=108,height=92,quality=90,fit=cover,dpr=2/image/upload/v1488573251/Partner/hotels/s/87478149/891195686.jpeg",
            "https://zen.wego.com/cdn-cgi/image/format=auto,width=108,height=92,quality=90,fit=cover,dpr=2/image/upload/v1488573251/Partner/hotels/s/106762165/1356877441.jpeg",
        ],
    },
    {
        "slug": "may-seven-service-apartment-hotel",
        "name": "May Seven Service Apartment & Hotel",
        "address": "In front of Bayanmongol Residential Complex, 26th Khoroo, Bayanzurkh District, Ulaanbaatar, Mongolia",
        "description": "May Seven Service Apartment & Hotel is a modern extended-stay property in central Ulaanbaatar offering serviced suites, fully equipped kitchens, fitness and pool access, and a home-like atmosphere for short and long stays.",
        "website": "https://mayseven.mn/",
        "contact_phone": "+976 7200 8787",
        "stars": 4,
        "images": [
            "https://mayseven.mn/wp-content/uploads/2024/12/DSC00931-scaled.jpg",
            "https://mayseven.mn/wp-content/uploads/2024/06/DSC00868-min-1.jpg",
            "https://mayseven.mn/wp-content/uploads/2025/06/101-FamilySuite-scaled.jpg",
        ],
    },
    {
        "slug": "ayan-zalaat",
        "name": "Ayan Zalaat",
        "address": "Dunjingarav Street, Ulaanbaatar 13241, Mongolia",
        "description": "Ayan Zalaat is a luxury urban oasis on a 13.8-hectare private estate at the edge of Bogd Khan Mountain National Park, offering refined rooms and suites, destination dining, spa and wellness spaces, and high-end event venues.",
        "website": "https://ayanhotelsmongolia.com/",
        "contact_phone": "+976 7500 5555",
        "stars": 5,
        "publish": False,
        "images": [
            "https://www.ayanhotelsmongolia.com/wp-content/uploads/2025/09/80_Lobby-scaled.jpg",
            "https://www.ayanhotelsmongolia.com/wp-content/uploads/2025/08/12_Executive_Suite1-1-1536x1024.jpg",
            "https://www.ayanhotelsmongolia.com/wp-content/uploads/2025/08/42_Ayan_Spa_SwimmingPool-1-scaled.jpg",
        ],
    },
]


def clean_text(value):
    if pd.isna(value):
        return None
    text = str(value).strip()
    if not text or text.lower() in {"null", "none", "nan"}:
        return None
    return text


def normalize_url(value):
    text = clean_text(value)
    if not text:
        return None

    if text.startswith(("http://", "https://")):
        return text

    return f"https://{text.lstrip('/')}"


def dedupe_images(row):
    images_list = []
    if pd.notna(row.get("image")):
        images_list.append(str(row["image"]).replace("\\/", "/"))
    if pd.notna(row.get("images")):
        img_val = str(row["images"]).strip()
        if img_val.startswith("["):
            try:
                parsed = json.loads(img_val)
                if isinstance(parsed, list):
                    images_list.extend([str(x).replace("\\/", "/") for x in parsed])
            except Exception:
                pass
    return list(dict.fromkeys(images_list))


def build_price_fallbacks(df_rate_plans_source, df_daily_rates_source):
    if df_rate_plans_source.empty or df_daily_rates_source.empty:
        return {}

    rate_plan_cols = ["id", "room_type_id"]
    merged = df_daily_rates_source.merge(
        df_rate_plans_source[rate_plan_cols],
        left_on="rate_plan_id",
        right_on="id",
        how="left",
    )
    merged = merged[merged["room_type_id"].notna() & merged["value"].notna()]
    merged = merged[merged["value"] > 0]
    if merged.empty:
        return {}

    return (
        merged.groupby("room_type_id")["value"]
        .min()
        .to_dict()
    )


def source_hotel_record(row, override=None, hotel_id=None):
    old_id = int(row["id"])
    override = override or SOURCE_OVERRIDES.get(old_id, {})
    hotel_id = hotel_id or str(uuid.uuid5(uuid.NAMESPACE_OID, f"hotel_{old_id}"))
    name = clean_text(override.get("name")) or clean_text(row.get("name"))
    name_en = clean_text(override.get("name_en")) or clean_text(row.get("name_en"))
    description = clean_text(override.get("description")) or clean_text(row.get("introduction")) or clean_text(row.get("description"))
    description_en = clean_text(override.get("description_en")) or clean_text(row.get("description_en"))
    address = clean_text(override.get("address")) or clean_text(row.get("address"))
    address_en = clean_text(override.get("address_en")) or clean_text(row.get("address_en"))
    website = normalize_url(override.get("website")) or normalize_url(row.get("website"))
    contact_phone = clean_text(override.get("contact_phone")) or clean_text(row.get("phone"))
    contact_email = clean_text(override.get("contact_email")) or clean_text(row.get("email"))
    stars = 0
    if override.get("stars") is not None:
        stars = int(override["stars"])
    elif pd.notna(row.get("star_rating")):
        try:
            stars = int(float(row["star_rating"]))
        except Exception:
            stars = 0
    override_images = [str(image).strip() for image in override.get("images", []) if clean_text(image)]
    images = list(dict.fromkeys(override_images or dedupe_images(row)))
    publish = bool(override.get("publish", True))
    latitude = None
    longitude = None
    try:
        if pd.notna(row.get("lat")):
            latitude = float(row["lat"])
        if pd.notna(row.get("lng")):
            longitude = float(row["lng"])
    except Exception:
        latitude = None
        longitude = None

    latitude, longitude = sanitize_hotel_coordinates(
        latitude,
        longitude,
        name,
        name_en,
        address,
        address_en,
    )

    return (
        hotel_id,
        name,
        name_en,
        description,
        description_en,
        address,
        address_en,
        stars,
        images,
        latitude,
        longitude,
        website,
        contact_phone,
        contact_email,
        publish,
    )


def room_record(
    row,
    inventory_counts,
    fallback_prices=None,
    hotel_id=None,
    room_id_prefix="room",
):
    hotel_id_raw = str(int(float(row["hotel_id"])))
    room_type_id_raw = str(int(float(row["id"])))
    hotel_id = hotel_id or str(uuid.uuid5(uuid.NAMESPACE_OID, f"hotel_{hotel_id_raw}"))
    room_id = str(uuid.uuid5(uuid.NAMESPACE_OID, f"{room_id_prefix}_{room_type_id_raw}"))
    name = pick_room_name(row)
    description = pick_room_description(row)
    price_raw = row.get("default_price")
    price_mnt = float(price_raw) if pd.notna(price_raw) else 0.0
    room_type_key = int(float(row["id"]))
    if price_mnt <= 0 and fallback_prices:
        price_mnt = float(fallback_prices.get(room_type_key, 0.0))
    price_usd = round(price_mnt / 3400.0, 2) if price_mnt > 0 else 0.0
    capacity = infer_room_capacity(row)
    size_val = row.get("floor_size")
    if pd.isna(size_val):
        size_val = row.get("size")
    size = float(size_val) if pd.notna(size_val) else 0.0

    images_list = []
    for col in ["images", "photos"]:
        if col in row and pd.notna(row[col]):
            img_val = str(row[col]).strip()
            if img_val == "" or img_val == "[]":
                continue
            if img_val.startswith("["):
                try:
                    parsed = json.loads(img_val)
                    if isinstance(parsed, list):
                        images_list.extend([str(x).replace("\\/", "/") for x in parsed])
                except Exception:
                    pass
            else:
                images_list.append(img_val.replace("\\/", "/"))

    images_list = list(dict.fromkeys(images_list))
    total_inventory = derive_room_inventory(row, inventory_counts.get(room_type_key, 0))
    if not name or price_usd <= 0 or total_inventory <= 0:
        return None

    return (
        room_id,
        hotel_id,
        name,
        description,
        "Standard",
        price_usd,
        capacity,
        images_list,
        size,
        total_inventory,
    )


conn = None
cursor = None
try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    cursor.execute(
        """
        ALTER TABLE public.hotels
        ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
        """
    )
    cursor.execute(
        """
        ALTER TABLE public.hotels
        ADD COLUMN IF NOT EXISTS name_en TEXT,
        ADD COLUMN IF NOT EXISTS address_en TEXT,
        ADD COLUMN IF NOT EXISTS description_en TEXT;
        """
    )
    cursor.execute("UPDATE public.hotels SET is_published = TRUE WHERE is_published IS NULL;")

    source_room_inventory = df_rooms.groupby("room_type_id").size().to_dict()
    source_price_fallbacks = build_price_fallbacks(df_rate_plans, df_daily_rates)
    mock_room_inventory = df_mock_rooms.groupby("room_type_id").size().to_dict()
    mock_price_fallbacks = build_price_fallbacks(df_mock_rate_plans, df_mock_daily_rates)

    source_rows = df_hotels[df_hotels["id"].isin(SOURCE_HOTEL_IDS)]
    source_hotel_records = [source_hotel_record(row) for _, row in source_rows.iterrows()]

    fallback_hotel_records = []
    fallback_room_records = []
    for source in FALLBACK_SOURCE_HOTELS:
        if source["schema"] != "mock_pms":
            continue

        hotel_rows = df_mock_hotels[df_mock_hotels["id"] == source["hotel_id"]]
        if hotel_rows.empty:
            continue

        target_hotel_id = str(uuid.uuid5(uuid.NAMESPACE_OID, f"manual_hotel_{source['slug']}"))
        fallback_hotel_records.extend(
            [source_hotel_record(row, override=source, hotel_id=target_hotel_id) for _, row in hotel_rows.iterrows()]
        )

        room_rows = df_mock_room_types[df_mock_room_types["hotel_id"] == source["hotel_id"]]
        fallback_room_records.extend(
            [
                room_record(
                    row,
                    inventory_counts=mock_room_inventory,
                    fallback_prices=mock_price_fallbacks,
                    hotel_id=target_hotel_id,
                    room_id_prefix=f"{source['slug']}_room_type",
                )
                for _, row in room_rows.iterrows()
            ]
        )
    fallback_room_records = [record for record in fallback_room_records if record is not None]

    hotel_upsert_query = """
        INSERT INTO public.hotels (
            id, name, name_en, description, description_en, address, address_en, stars, images,
            latitude, longitude, website, contact_phone, contact_email, is_published
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s::text[],
            %s, %s, %s, %s, %s, %s
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            name_en = EXCLUDED.name_en,
            description = EXCLUDED.description,
            description_en = EXCLUDED.description_en,
            address = EXCLUDED.address,
            address_en = EXCLUDED.address_en,
            stars = EXCLUDED.stars,
            images = EXCLUDED.images,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            website = EXCLUDED.website,
            contact_phone = EXCLUDED.contact_phone,
            contact_email = EXCLUDED.contact_email,
            is_published = EXCLUDED.is_published
    """
    execute_batch(cursor, hotel_upsert_query, source_hotel_records, page_size=100)
    if fallback_hotel_records:
        execute_batch(cursor, hotel_upsert_query, fallback_hotel_records, page_size=50)

    source_rooms = df_room_types[df_room_types["hotel_id"].isin(SOURCE_HOTEL_IDS)]
    source_room_records = [
        room_record(
            row,
            inventory_counts=source_room_inventory,
            fallback_prices=source_price_fallbacks,
        )
        for _, row in source_rooms.iterrows()
    ]
    source_room_records = [record for record in source_room_records if record is not None]

    room_upsert_query = """
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
            images = EXCLUDED.images,
            size = EXCLUDED.size,
            total_inventory = EXCLUDED.total_inventory
    """
    execute_batch(cursor, room_upsert_query, source_room_records, page_size=200)
    if fallback_room_records:
        execute_batch(cursor, room_upsert_query, fallback_room_records, page_size=100)

    manual_hotel_records = []
    for hotel in MANUAL_HOTELS:
        hotel_id = str(uuid.uuid5(uuid.NAMESPACE_OID, f"manual_hotel_{hotel['slug']}"))
        manual_hotel_records.append(
            (
                hotel_id,
                hotel["name"],
                hotel["name"],
                hotel["description"],
                hotel["description"],
                hotel["address"],
                hotel["address"],
                hotel["stars"],
                hotel.get("images", []),
                None,
                None,
                normalize_url(hotel["website"]),
                hotel["contact_phone"],
                None,
                hotel.get("publish", True),
            )
        )

    execute_batch(cursor, hotel_upsert_query, manual_hotel_records, page_size=100)

    conn.commit()

    cursor.execute(
        """
        SELECT name
        FROM public.hotels
        WHERE is_published = TRUE
        ORDER BY name
        """
    )
    active_names = [row[0] for row in cursor.fetchall()]

    print(
        json.dumps(
            {
                "restored_source_hotels": [record[1] for record in source_hotel_records],
                "restored_source_room_count": len(source_room_records),
                "restored_fallback_hotels": [record[1] for record in fallback_hotel_records],
                "restored_fallback_room_count": len(fallback_room_records),
                "manual_hotels_upserted": [hotel["name"] for hotel in MANUAL_HOTELS],
                "active_count": len(active_names),
                "active_names": active_names,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
except Exception as exc:
    if conn:
        conn.rollback()
    print(f"Database error: {exc}")
    raise
finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
