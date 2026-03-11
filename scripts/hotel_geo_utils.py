import math
import re


UB_CENTER_LAT = 47.9185
UB_CENTER_LNG = 106.9177
UB_MAX_REASONABLE_DISTANCE_KM = 80


def haversine_km(lat1, lng1, lat2, lng2):
    radius_km = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    return 2 * radius_km * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def looks_like_ulaanbaatar(*values):
    haystack = " ".join(str(value) for value in values if value).lower()
    return bool(re.search(r"(улаанбаатар|ulaanbaatar|\bub\b)", haystack))


def sanitize_hotel_coordinates(lat, lng, *context_values):
    if lat is None or lng is None:
        return None, None

    if not (41 <= lat <= 52 and 87 <= lng <= 120):
        return None, None

    if looks_like_ulaanbaatar(*context_values):
        distance_from_ub = haversine_km(lat, lng, UB_CENTER_LAT, UB_CENTER_LNG)
        if distance_from_ub > UB_MAX_REASONABLE_DISTANCE_KM:
            return None, None

    return lat, lng
