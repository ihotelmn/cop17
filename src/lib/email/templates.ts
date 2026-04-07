import { getCanonicalAppHost, getPublicAppUrl } from "@/lib/site-config";
import { sendEmail } from "./resend";

export async function sendBookingConfirmation(
    to: string,
    guestName: string,
    bookingId: string,
    hotelName: string,
    dates: string,
    manageBookingPath?: string
) {
    const subject = `Booking Confirmation: ${hotelName} - ${bookingId}`;

    const baseUrl = getPublicAppUrl();
    const siteHost = getCanonicalAppHost();
    const bookingLink = manageBookingPath
        ? new URL(manageBookingPath, baseUrl).toString()
        : `${baseUrl}/my-bookings`;

    // Premium HTML Template with Inline Styles for maximum compatibility
    const html = `
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
                            <span style="color: #ffffff !important;">Manage This Booking</span>
                        </a>
                    </div>
                </div>

                <div style="margin-top: 32px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 32px;">
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">Need assistance with your booking?</p>
                    <p style="font-size: 13px; color: #0f172a; font-weight: 700; margin: 0;">Reply to this email or contact <a href="mailto:hotel@unccdcop17.org" style="color: #2563eb;">hotel@unccdcop17.org</a></p>
                </div>

                <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; line-height: 1.8;">
                    &copy; 2026 COP17 Mongolia Organizing Committee.<br>
                    Official Accommodation & Logistics Partner.<br>
                    <a href="${baseUrl}" style="color: #64748b; text-decoration: underline;">Visit ${siteHost}</a>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to, subject, html });
}

export async function sendPreBookingRequestReceived(
    to: string,
    guestName: string,
    bookingId: string,
    hotelName: string,
    dates: string,
    manageBookingPath?: string
) {
    const subject = `Pre-booking Request Received: ${hotelName} - ${bookingId}`;

    const baseUrl = getPublicAppUrl();
    const bookingLink = manageBookingPath
        ? new URL(manageBookingPath, baseUrl).toString()
        : `${baseUrl}/my-bookings`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pre-booking Request Received</title>
        </head>
        <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -0.05em; text-transform: uppercase;">COP17 MONGOLIA</div>
                    <div style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 4px;">Accommodation Platform</div>
                </div>

                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04);">
                    <div style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; padding: 6px 16px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24px;">
                        Request Received
                    </div>

                    <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 16px; color: #0f172a; letter-spacing: -0.02em;">Your pre-booking request is in review.</h1>
                    <p style="margin: 0 0 32px; color: #475569; font-size: 15px;">Dear <strong>${guestName}</strong>, we received your request for <strong>${hotelName}</strong>. Our accommodation team will review it and contact you with the next payment steps.</p>

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
                                    <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Status</div>
                                    <div style="font-size: 14px; font-weight: 700; color: #1d4ed8;">Awaiting review</div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="text-align: center;">
                        <a href="${bookingLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                            <span style="color: #ffffff !important;">Manage This Booking</span>
                        </a>
                    </div>
                </div>

                <div style="margin-top: 32px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 32px;">
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">Our team will contact you using the details you submitted.</p>
                    <p style="font-size: 13px; color: #0f172a; font-weight: 700; margin: 0;">If you need support, contact <a href="mailto:hotel@unccdcop17.org" style="color: #2563eb;">hotel@unccdcop17.org</a></p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to, subject, html });
}

export async function sendVerificationEmail(
    to: string,
    guestName: string,
    verificationLink: string
) {
    const subject = `Welcome to COP17 Mongolia - Verify Your Account`;
    const baseUrl = getPublicAppUrl();
    const siteHost = getCanonicalAppHost();

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Account</title>
        </head>
        <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -0.05em; text-transform: uppercase;">COP17 MONGOLIA</div>
                    <div style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 4px;">Accommodation Platform</div>
                </div>

                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04);">
                    <div style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; padding: 6px 16px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24px;">
                        Action Required
                    </div>

                    <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 16px; color: #0f172a; letter-spacing: -0.02em;">Welcome, ${guestName}!</h1>
                    <p style="margin: 0 0 32px; color: #475569; font-size: 15px;">Thank you for registering on the official COP17 Mongolia accommodation platform. Please verify your email address to activate your account and start booking.</p>

                    <div style="text-align: center; margin-bottom: 32px;">
                        <a href="${verificationLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                            <span style="color: #ffffff !important;">Verify Email Address</span>
                        </a>
                    </div>
                    
                    <p style="margin: 0; color: #64748b; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="margin: 8px 0 0; color: #64748b; font-size: 11px; word-break: break-all;">${verificationLink}</p>
                </div>

                <div style="margin-top: 32px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 32px;">
                    <p style="font-size: 13px; color: #0f172a; font-weight: 700; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
                </div>

                <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; line-height: 1.8;">
                    &copy; 2026 COP17 Mongolia Organizing Committee.<br>
                    Official Accommodation & Logistics Partner.<br>
                    <a href="${baseUrl}" style="color: #64748b; text-decoration: underline;">Visit ${siteHost}</a>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to, subject, html });
}

export async function sendPasswordResetEmail(
    to: string,
    guestName: string,
    resetLink: string
) {
    const subject = `Reset Your Password - COP17 Mongolia`;
    const baseUrl = getPublicAppUrl();
    const siteHost = getCanonicalAppHost();

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
        </head>
        <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -0.05em; text-transform: uppercase;">COP17 MONGOLIA</div>
                    <div style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 4px;">Accommodation Platform</div>
                </div>

                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04);">
                    <div style="display: inline-block; background-color: #fff7ed; color: #9a3412; padding: 6px 16px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24px;">
                        Security Notice
                    </div>

                    <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 16px; color: #0f172a; letter-spacing: -0.02em;">Reset your password.</h1>
                    <p style="margin: 0 0 32px; color: #475569; font-size: 15px;">Hello ${guestName}, we received a request to reset the password for your COP17 account. Click the button below to choose a new password.</p>

                    <div style="text-align: center; margin-bottom: 32px;">
                        <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                            <span style="color: #ffffff !important;">Reset Password Now</span>
                        </a>
                    </div>
                    
                    <p style="margin: 0; color: #64748b; font-size: 13px;">If you didn't request this, you can safely ignore this email. This link will expire in 24 hours.</p>
                </div>

                <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; line-height: 1.8;">
                    &copy; 2026 COP17 Mongolia Organizing Committee.<br>
                    <a href="${baseUrl}" style="color: #64748b; text-decoration: underline;">Visit ${siteHost}</a>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to, subject, html });
}

export async function sendBookingCancelledEmail(
    to: string,
    guestName: string,
    bookingId: string,
    hotelName: string,
    dates: string,
    refundInfo?: string
) {
    const subject = `Booking Cancelled: ${hotelName} - #${bookingId.split('-')[0].toUpperCase()}`;
    const baseUrl = getPublicAppUrl();

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Cancelled</title>
        </head>
        <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #fcfcfc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -0.05em; text-transform: uppercase;">COP17 MONGOLIA</div>
                </div>

                <div style="background-color: #ffffff; border: 1px solid #fee2e2; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04);">
                    <div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 16px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24px;">
                        Cancelled
                    </div>

                    <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 16px; color: #0f172a; letter-spacing: -0.02em;">Booking Cancellation.</h1>
                    <p style="margin: 0 0 32px; color: #475569; font-size: 15px;">Dear ${guestName}, your reservation at <strong>${hotelName}</strong> for <strong>${dates}</strong> has been cancelled.</p>

                    <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                        <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Reference ID</div>
                        <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 16px;">#${bookingId.split('-')[0].toUpperCase()}</div>
                        
                        ${refundInfo ? `
                        <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Refund Policy Details</div>
                        <div style="font-size: 13px; color: #475569;">${refundInfo}</div>
                        ` : ''}
                    </div>

                    <p style="margin: 0; color: #64748b; font-size: 13px;">If you have any questions regarding refunds or need to make a new reservation, please contact us at <a href="mailto:hotel@unccdcop17.org" style="color: #2563eb;">hotel@unccdcop17.org</a></p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to, subject, html });
}

export async function sendModificationReviewEmail(
    to: string,
    guestName: string,
    bookingId: string,
    hotelName: string,
    status: 'approved' | 'rejected',
    adminNotes?: string
) {
    const isApproved = status === 'approved';
    const subject = `Update on your Booking Modification: #${bookingId.split('-')[0].toUpperCase()}`;
    const baseUrl = getPublicAppUrl();

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Modification Update</title>
        </head>
        <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -0.05em;">COP17 MONGOLIA</div>
                </div>

                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04);">
                    <div style="display: inline-block; background-color: ${isApproved ? '#f0fdf4' : '#fef2f2'}; color: ${isApproved ? '#166534' : '#991b1b'}; padding: 6px 16px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24px;">
                        ${isApproved ? 'Approved' : 'Correction Required'}
                    </div>

                    <h1 style="font-size: 24px; font-weight: 800; margin: 0 0 16px; color: #0f172a;">Update on your stay at ${hotelName}.</h1>
                    <p style="margin: 0 0 32px; color: #475569; font-size: 15px;">Dear ${guestName}, our team has reviewed your request to modify your booking.</p>

                    <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                        <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Status</div>
                        <div style="font-size: 16px; font-weight: 700; color: ${isApproved ? '#166534' : '#b91c1c'}; margin-bottom: 16px;">
                            ${isApproved ? 'Your request has been approved and applied.' : 'Your request could not be processed at this time.'}
                        </div>
                        
                        ${adminNotes ? `
                        <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Important Notes</div>
                        <div style="font-size: 13px; color: #475569;">${adminNotes}</div>
                        ` : ''}
                    </div>

                    <div style="text-align: center;">
                        <a href="${baseUrl}/my-bookings" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px;">
                            View My Bookings
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to, subject, html });
}
