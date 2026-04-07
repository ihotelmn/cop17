import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

async function forcePublicBucket() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Updating 'hotel-images' to be explicitly public...");
    
    const { error: updateError } = await supabase.storage.updateBucket('hotel-images', {
        public: true,
        fileSizeLimit: 10485760, // Increase to 10MB
        allowedMimeTypes: ['image/*']
    });

    if (updateError) {
        console.error("Error updating bucket:", updateError);
    } else {
        console.log("Bucket updated to PUBLIC and 10MB limit successfully.");
    }
}

forcePublicBucket();
