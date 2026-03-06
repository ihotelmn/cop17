
import * as dotenv from 'dotenv';
import * as path from 'path';
import { sendEmail } from './src/lib/email';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testResendEmail() {
    console.log("Testing Resend API connection...");
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
        console.log("API Key found: " + apiKey.substring(0, 5) + "...");
    } else {
        console.error("❌ ERROR: RESEND_API_KEY is not found in process.env!");
        return;
    }

    // In Sandbox mode (domain not verified yet), Resend only allows sending to the owner's email
    const result = await sendEmail({
        to: "uurtsaikh@ihotel.mn",
        subject: "COP17 Platform - Resend Verification ✉️",
        body: "Checking if Resend API integration is working correctly."
    });

    if (result.success) {
        console.log("✅ SUCCESS! Request sent to Resend API.");
        console.log("Check your inbox (uurtsaikh@ihotel.mn) or Resend Logs.");
    } else {
        console.error("❌ FAILED! Resend Error:", result.error);
    }
}

testResendEmail();
