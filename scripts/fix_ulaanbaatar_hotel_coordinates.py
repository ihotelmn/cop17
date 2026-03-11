import json
import os
from urllib.parse import urlencode
from urllib.request import urlopen

import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

from hotel_geo_utils import (
    UB_CENTER_LAT,
    UB_CENTER_LNG,
    UB_MAX_REASONABLE_DISTANCE_KM,
    haversine_km,
    looks_like_ulaanbaatar,
)

load_dotenv(".env.local")

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    raise SystemExit("DATABASE_URL is missing")

api_key = os.environ.get("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
if not api_key:
    raise SystemExit("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing")

if "sslmode=" not in db_url and "supabase.co" in db_url:
    db_url += "?sslmode=require"


def fetch_geocode(query):
    params = urlencode(
        {
            "address": query,
            "components": "country:MN",
            "key": api_key,
        }
    )
    url = f"https://maps.googleapis.com/maps/api/geocode/json?{params}"
    with urlopen(url) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if payload.get("status") != "OK" or not payload.get("results"):
        return None

    for result in payload["results"]:
        geometry = result.get("geometry", {}).get("location", {})
        lat = geometry.get("lat")
        lng = geometry.get("lng")
        if lat is None or lng is None:
            continue

        distance = haversine_km(lat, lng, UB_CENTER_LAT, UB_CENTER_LNG)
        if distance <= UB_MAX_REASONABLE_DISTANCE_KM:
            return {
                "latitude": lat,
                "longitude": lng,
                "place_id": result.get("place_id"),
                "formatted_address": result.get("formatted_address"),
                "distance_from_ub_km": distance,
            }

    return None


conn = psycopg2.connect(db_url)
cursor = conn.cursor()

try:
    cursor.execute(
        """
        SELECT id, COALESCE(name_en, name) AS display_name, name, name_en, address, address_en, latitude, longitude
        FROM public.hotels
        WHERE is_published = TRUE
        ORDER BY COALESCE(name_en, name)
        """
    )

    updates = []
    preview = []

    for hotel_id, display_name, name, name_en, address, address_en, latitude, longitude in cursor.fetchall():
        if latitude is None or longitude is None:
            continue

        if not looks_like_ulaanbaatar(name, name_en, address, address_en):
            continue

        if haversine_km(float(latitude), float(longitude), UB_CENTER_LAT, UB_CENTER_LNG) <= UB_MAX_REASONABLE_DISTANCE_KM:
            continue

        queries = [
            value for value in [
                address_en,
                address,
                f"{display_name}, Ulaanbaatar, Mongolia",
            ] if value
        ]

        geocode = None
        for query in queries:
            geocode = fetch_geocode(query)
            if geocode:
                break

        if not geocode:
            preview.append(
                {
                    "hotel": display_name,
                    "status": "no_geocode_match",
                }
            )
            continue

        updates.append(
            (
                geocode["latitude"],
                geocode["longitude"],
                geocode["place_id"],
                hotel_id,
            )
        )
        preview.append(
            {
                "hotel": display_name,
                "latitude": geocode["latitude"],
                "longitude": geocode["longitude"],
                "formatted_address": geocode["formatted_address"],
                "distance_from_ub_km": round(geocode["distance_from_ub_km"], 2),
            }
        )

    if updates:
        execute_batch(
            cursor,
            """
            UPDATE public.hotels
            SET
                latitude = %s,
                longitude = %s,
                google_place_id = COALESCE(%s, google_place_id)
            WHERE id = %s
            """,
            updates,
            page_size=50,
        )
        conn.commit()

    print(
        json.dumps(
            {
                "updated_count": len(updates),
                "preview": preview,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
finally:
    cursor.close()
    conn.close()
