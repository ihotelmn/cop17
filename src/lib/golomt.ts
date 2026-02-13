import crypto from 'crypto';

interface CreateInvoiceRequest {
    transactionId: string;
    amount: number;
    returnUrl: string;
}

interface CreateInvoiceResponse {
    success: boolean;
    invoiceId?: string;
    redirectUrl?: string; // For mock flow
    error?: string;
    // Real Golomt API usually returns a token or requires a POST to their gateway
    checksum?: string;
    transactionId?: string;
}

interface CheckStatusResponse {
    success: boolean;
    status: 'PAID' | 'PENDING' | 'FAILED' | 'Not Found';
    amount?: number;
    error?: string;
}

const GOLOMT_ENDPOINT = process.env.GOLOMT_ENDPOINT || 'https://ecommerce.golomtbank.com/api'; // Example
const MERCHANT_ID = process.env.GOLOMT_MERCHANT_ID || 'TEST_MERCHANT';
const SECRET_KEY = process.env.GOLOMT_SECRET_KEY || 'TEST_SECRET';

export const GolomtService = {
    /**
     * Generates the checksum required by Golomt API
     * Usually: SHA256(transactionId + amount + secret) - *Confirm exact algo with documentation*
     */
    generateChecksum: (transactionId: string, amount: string) => {
        const data = `${transactionId}${amount}${SECRET_KEY}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    },

    /**
     * Creates an invoice (transaction) request
     */
    createInvoice: async (req: CreateInvoiceRequest): Promise<CreateInvoiceResponse> => {
        console.log('[GolomtMock] Creating Invoice:', req);

        // MOCK IMPLEMENTATION
        // In a real scenario, we would POST to Golomt API here.
        // For now, we simulate a "success" response that tells the frontend to redirect
        // to a mock payment page.

        const mockInvoiceId = `INV-${Math.floor(Math.random() * 1000000)}`;

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Determine functionality based on Mock vs Real
        // Since we don't have real credentials, we ALWAYS return a mock redirect
        // In a real app, this would return the URL to Golomt's payment gateway

        return {
            success: true,
            invoiceId: mockInvoiceId,
            transactionId: req.transactionId,
            // For the mock, we redirect to an internal "fake bank" page
            redirectUrl: `/mock-payment?invoiceId=${mockInvoiceId}&amount=${req.amount}&txnId=${req.transactionId}&returnUrl=${encodeURIComponent(req.returnUrl)}`
        };
    },

    /**
     * Verifies the payment status
     */
    checkPaymentStatus: async (transactionId: string, invoiceId: string): Promise<CheckStatusResponse> => {
        console.log('[GolomtMock] Checking Status:', { transactionId, invoiceId });

        // MOCK IMPLEMENTATION
        // Simulating a paid status for testing
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            status: 'PAID',
            amount: 0 // Mock doesn't track real amount state without DB
        };
    }
};
