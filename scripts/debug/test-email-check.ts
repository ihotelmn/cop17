
import * as dotenv from 'dotenv';
import * as path from 'path';
import { sendEmail } from './src/lib/email';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testFinalEmail() {
    console.log("Testing SMTP connection with your current credentials...");
    console.log("User:", process.env.SMTP_USER);

    const result = await sendEmail({
        to: process.env.SMTP_USER || "cop17reservations@gmail.com",
        subject: "COP17 Platform - Email System Check 🔍",
        body: "Checking if email system is still working correctly after configuration changes."
    });

    if (result.success) {
        console.log("✅ SUCCESS! Test email sent successfully.");
    } else {
        console.error("❌ FAILED! Error sending email:", result.error);
    }
}

testFinalEmail();
