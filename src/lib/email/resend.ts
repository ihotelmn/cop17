import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
    console.error('RESEND_API_KEY is not defined in environment variables. Email sending will fail.');
}

const resend = new Resend(resendApiKey || 'dummy_key');

// Get the default from email address from env or use a fallback
const getFromEmail = () => {
    return process.env.EMAIL_FROM || 'COP17 Mongolia <noreply@hotel.unccdcop17.org>';
};

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    replyTo?: string;
}

/**
 * Sends an email using the Resend API
 */
export async function sendEmail({ to, subject, text, html, replyTo }: SendEmailOptions) {
    try {
        if (!resendApiKey) {
            console.warn('Skipping email send because RESEND_API_KEY is not configured', { to, subject });
            return { success: false, error: 'Email service not configured' };
        }

        const from = getFromEmail();
        
        const data = await resend.emails.send({
            from,
            to: Array.isArray(to) ? to : [to],
            subject,
            text: text || '',
            html: html || text || '', // Fallback to text if html is not provided
            replyTo: replyTo || process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
        });

        console.log(`Email sent successfully to ${to}. ID: ${data.data?.id}`);
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error sending email' };
    }
}
