import os
import math
import uuid
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

from cop17_data_paths import read_table_frame

load_dotenv('.env.local')

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL is missing from .env.local")
    exit(1)

# Ensure SSL mode require for external connection
if "sslmode=" not in db_url and "supabase.co" in db_url:
    db_url += "?sslmode=require"

df = read_table_frame("trans_api", "users")

df = df[['email', 'name', 'password', 'created_at', 'updated_at']]
df = df.dropna(subset=['email', 'password'])
df = df.drop_duplicates(subset=['email'])

records = []
for idx, row in df.iterrows():
    email = str(row['email']).strip().lower()
    password_hash = str(row['password'])
    name = str(row['name']) if not pd.isna(row['name']) else ""
    created_at = row['created_at'] if pd.notna(row['created_at']) else pd.Timestamp.now()
    updated_at = row['updated_at'] if pd.notna(row['updated_at']) else pd.Timestamp.now()
    user_id = str(uuid.uuid4())
    records.append((user_id, email, password_hash, name, created_at, updated_at))

print(f"Total users to migrate: {len(records)}")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    # Run the SQL migration first
    with open('supabase/migrations/20260222_import_legacy_users.sql', 'r') as f:
        migration_sql = f.read()
    
    print("Creating SQL RPC function...")
    cursor.execute(migration_sql)
    conn.commit()
    
    insert_query = """
    SELECT import_legacy_user(
        %s::UUID, %s::TEXT, %s::TEXT, %s::TEXT, %s::TIMESTAMPTZ, %s::TIMESTAMPTZ
    );
    """
    
    print("Executing batch insert/RPC...")
    execute_batch(cursor, insert_query, records, page_size=100)
    
    conn.commit()
    print("Successfully imported users!")
    
except Exception as e:
    print(f"Database error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
