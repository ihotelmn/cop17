import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
    console.log("Checking Setup...");

    // 1. Check Amenities Table
    const { data: amenities, error: amenitiesError } = await supabase
        .from("amenities")
        .select("count", { count: "exact", head: true });

    if (amenitiesError) {
        console.error("❌ Amenities table error:", amenitiesError.message);
    } else {
        console.log("✅ Amenities table exists. Count:", amenities);
    }

    // 2. Check Storage Bucket
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
        console.error("❌ List buckets error:", bucketsError.message);
    } else {
        const bucket = buckets.find(b => b.name === 'hotel-images');
        if (bucket) {
            console.log("✅ Bucket 'hotel-images' exists.");
            console.log("   Public:", bucket.public);
        } else {
            console.error("❌ Bucket 'hotel-images' NOT found.");
            console.log("   Available buckets:", buckets.map(b => b.name));

            // Try to create it
            console.log("   Attempting to create bucket...");
            const { data, error } = await supabase.storage.createBucket('hotel-images', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            });

            if (error) console.error("   ❌ Failed to create bucket:", error.message);
            else console.log("   ✅ Created bucket 'hotel-images'");
        }
    }
}

check();
