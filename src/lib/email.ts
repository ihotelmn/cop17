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
    const subject = `Booking Confirmation - ${bookingId}`;
    const body = `
        Dear ${guestName},

        Thank you for booking with COP17 Mongolia.
        
        Your reservation at ${hotelName} is confirmed.
        Reference ID: ${bookingId}
        Dates: ${dates}

        Please verify your details in the attached document (simulated).

        Regards,
        COP17 Accommodation Team
    `;

    return sendEmail({ to, subject, body });
}
