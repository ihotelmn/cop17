export interface EmailPayload {
    to: string;
    subject: string;
    body: string;
}

import { Resend } from 'resend';

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.warn("⚠️ EMAIL_WARNING: RESEND_API_KEY is missing. Email will NOT be sent.");
        console.log("--------------- EMAIL SERVICE (MOCK) ---------------");
        console.log(`To: ${payload.to}`);
        console.log(`Subject: ${payload.subject}`);
        console.log("----------------------------------------------------");
        return { success: true };
    }

    try {
        const resend = new Resend(apiKey);
        // Using the professional subdomain email
        const fromEmail = "COP17 Mongolia <noreply@cop17.ihotel.mn>";

        const { error } = await resend.emails.send({
            from: fromEmail,
            to: [payload.to],
            subject: payload.subject,
            html: payload.body,
        });

        if (error) {
            console.error("❌ Resend API Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error("❌ Resend System Crash:", error);
        return { success: false, error: error.message };
    }
}

export async function sendBookingConfirmation(
    to: string,
    guestName: string,
    bookingId: string,
    hotelName: string,
    dates: string
) {
    const subject = `Booking Confirmation: ${hotelName} - ${bookingId}`;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cop17.mn';
    const bookingLink = `${baseUrl}/my-bookings`;

    // Premium HTML Template with Inline Styles for maximum compatibility
    const body = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Confirmation</title>
        </head>
        <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -0.05em; text-transform: uppercase;">COP17 MONGOLIA</div>
                    <div style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 4px;">Accommodation Platform</div>
                </div>

                <!-- Main Card -->
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04);">
                    <div style="display: inline-block; background-color: #f0fdf4; color: #166534; padding: 6px 16px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24px;">
                        Reservation Confirmed
                    </div>
                    
                    <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 16px; color: #0f172a; letter-spacing: -0.02em;">Your stay is secured.</h1>
                    <p style="margin: 0 0 32px; color: #475569; font-size: 15px;">Dear <strong>${guestName}</strong>, your reservation at <strong>${hotelName}</strong> has been successfully confirmed. We are excited to host you during the COP17 conference.</p>
                    
                    <!-- Details Section -->
                    <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding-bottom: 20px; width: 50%;">
                                    <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Reference ID</div>
                                    <div style="font-size: 14px; font-weight: 700; color: #1e293b;">#${bookingId.split('-')[0].toUpperCase()}</div>
                                </td>
                                <td style="padding-bottom: 20px; width: 50%;">
                                    <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Stay Dates</div>
                                    <div style="font-size: 14px; font-weight: 700; color: #1e293b;">${dates}</div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Property</div>
                                    <div style="font-size: 14px; font-weight: 700; color: #1e293b;">${hotelName}</div>
                                </td>
                                <td>
                                    <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Payment Status</div>
                                    <div style="font-size: 14px; font-weight: 700; color: #b91c1c;">Pre-paid</div>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Action Button -->
                    <div style="text-align: center;">
                        <a href="${bookingLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); transition: all 0.2s ease;">
                            <span style="color: #ffffff !important;">View My Bookings</span>
                        </a>
                    </div>
                </div>

                <!-- Support Footer -->
                <div style="margin-top: 32px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 32px;">
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">Need assistance with your booking?</p>
                    <p style="font-size: 13px; color: #0f172a; font-weight: 700; margin: 0;">Call +976 7010 1234 or reply to this email.</p>
                </div>

                <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; line-height: 1.8;">
                    &copy; 2026 COP17 Mongolia Organizing Committee.<br>
                    Official Accommodation & Logistics Partner.<br>
                    <a href="${baseUrl}" style="color: #64748b; text-decoration: underline;">Visit Platform</a>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to, subject, body });
}
