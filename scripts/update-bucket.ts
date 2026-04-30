import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

/**
 * Tighten hotel-images bucket:
 *  - public read (so delegates can view hotel photos without auth)
 *  - 3MB per file (client compresses to 2MB)
 *  - web-safe formats only (no TIFF/BMP/SVG — SVG can carry scripts)
 */
async function forcePublicBucket() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Updating 'hotel-images' bucket policy...");

    const { error: updateError } = await supabase.storage.updateBucket("hotel-images", {
        public: true,
        fileSizeLimit: 3 * 1024 * 1024, // 3 MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });

    if (updateError) {
        console.error("Error updating bucket:", updateError);
        process.exit(1);
    }

    console.log("✔ Bucket updated: public, 3MB limit, jpeg/png/webp only.");
}

forcePublicBucket();
