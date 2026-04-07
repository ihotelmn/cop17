import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

async function setupBucket() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Checking for 'hotel-images' bucket...");
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error("Error listing buckets:", listError);
        return;
    }
    
    const bucketExists = buckets.find(b => b.name === 'hotel-images');
    
    if (!bucketExists) {
        console.log("Creating 'hotel-images' bucket...");
        const { error: createError } = await supabase.storage.createBucket('hotel-images', {
            public: true,
            fileSizeLimit: 5242880,
            allowedMimeTypes: ['image/*']
        });
        if (createError) console.error("Error creating bucket:", createError);
        else console.log("Bucket created successfully.");
    } else {
        console.log("Bucket 'hotel-images' already exists.");
    }
}

setupBucket();
