export interface EmailPayload {
    to: string;
    subject: string;
    body: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
    console.log("--------------- EMAIL SERVICE (MOCK) ---------------");
    console.log(`To: ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Body: ${payload.body}`);
    console.log("----------------------------------------------------");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { success: true };
}

export async function sendBookingConfirmation(
    to: string,
    guestName: string,
    bookingId: string,
    hotelName: string,
    dates: string
) {
    const subject = `Booking Confirmation: ${hotelName} - ${bookingId}`;

    // Premium HTML Template
    const body = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #18181b; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .header { text-align: center; margin-bottom: 40px; }
                .logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.025em; }
                .card { background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                .status-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }
                h1 { font-size: 24px; font-weight: 800; margin: 0 0 16px; letter-spacing: -0.025em; }
                p { margin: 0 0 24px; color: #71717a; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; border-top: 1px solid #f4f4f5; padding-top: 24px; }
                .detail-item { margin-bottom: 16px; }
                .label { font-size: 10px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
                .value { font-size: 14px; font-weight: 600; color: #18181b; }
                .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #a1a1aa; }
                .button { display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; margin-top: 24px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">COP17 MONGOLIA</div>
                </div>
                <div class="card">
                    <div class="status-badge">Confirmed</div>
                    <h1>Your stay is secured.</h1>
                    <p>Dear ${guestName}, your reservation at ${hotelName} has been successfully confirmed. We look forward to welcoming you.</p>
                    
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="label">Reference ID</div>
                            <div class="value">${bookingId}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Dates</div>
                            <div class="value">${dates}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Accommodation</div>
                            <div class="value">${hotelName}</div>
                        </div>
                         <div class="detail-item">
                            <div class="label">Status</div>
                            <div class="value">Paid & Confirmed</div>
                        </div>
                    </div>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-bookings" class="button">View Booking Details</a>
                </div>
                <div class="footer">
                    &copy; 2026 COP17 Mongolia Organizing Committee.<br>
                    Official Accommodation Platform.
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to, subject, body });
}
