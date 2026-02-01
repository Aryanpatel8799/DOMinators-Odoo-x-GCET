/**
 * Stripe Payment Service
 * Handles Stripe payment processing for customer invoices
 */

const Stripe = require('stripe');

// Initialize Stripe with secret key from environment
const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

class StripeService {
    constructor() {
        if (!stripe) {
            console.warn('⚠️ Stripe not configured. Set STRIPE_SECRET_KEY in environment.');
        }
    }

    /**
     * Check if Stripe is configured
     */
    isConfigured() {
        return !!stripe;
    }

    /**
     * Create a payment intent for an invoice
     * @param {Object} invoice - Invoice details
     * @param {number} amount - Amount to pay (in smallest currency unit, e.g., paise for INR)
     * @param {string} customerEmail - Customer's email
     * @returns {Promise<Object>} Payment intent with client secret
     */
    async createPaymentIntent(invoice, amount, customerEmail) {
        if (!stripe) {
            throw new Error('Stripe is not configured');
        }

        // Amount should be in smallest currency unit (paise for INR)
        const amountInPaise = Math.round(amount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInPaise,
            currency: 'inr',
            metadata: {
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
                customer_email: customerEmail,
            },
            receipt_email: customerEmail,
            description: `Payment for Invoice ${invoice.invoice_number}`,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amount,
            currency: 'INR',
        };
    }

    /**
     * Create a checkout session for an invoice
     * @param {Object} invoice - Invoice details  
     * @param {number} amount - Amount to pay
     * @param {string} customerEmail - Customer's email
     * @param {string} successUrl - URL to redirect on success
     * @param {string} cancelUrl - URL to redirect on cancel
     * @returns {Promise<Object>} Checkout session
     */
    async createCheckoutSession(invoice, amount, customerEmail, successUrl, cancelUrl) {
        if (!stripe) {
            throw new Error('Stripe is not configured');
        }

        const amountInPaise = Math.round(amount * 100);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: customerEmail,
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: `Invoice ${invoice.invoice_number}`,
                            description: `Payment for invoice dated ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`,
                        },
                        unit_amount: amountInPaise,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
            },
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoice.id}`,
            cancel_url: cancelUrl,
        });

        return {
            sessionId: session.id,
            url: session.url,
        };
    }

    /**
     * Verify a checkout session after payment
     * @param {string} sessionId - Checkout session ID
     * @returns {Promise<Object>} Session details with payment status
     */
    async verifyCheckoutSession(sessionId) {
        if (!stripe) {
            throw new Error('Stripe is not configured');
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        return {
            paymentStatus: session.payment_status,
            invoiceId: session.metadata.invoice_id,
            invoiceNumber: session.metadata.invoice_number,
            amountTotal: session.amount_total / 100, // Convert back from paise
            customerEmail: session.customer_email,
            paymentIntentId: session.payment_intent,
        };
    }

    /**
     * Retrieve payment intent details
     * @param {string} paymentIntentId - Payment intent ID
     * @returns {Promise<Object>} Payment intent details
     */
    async getPaymentIntent(paymentIntentId) {
        if (!stripe) {
            throw new Error('Stripe is not configured');
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        return {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            invoiceId: paymentIntent.metadata.invoice_id,
            invoiceNumber: paymentIntent.metadata.invoice_number,
            receiptEmail: paymentIntent.receipt_email,
            created: new Date(paymentIntent.created * 1000),
        };
    }

    /**
     * Handle webhook events from Stripe
     * @param {string} payload - Raw request body
     * @param {string} signature - Stripe signature header
     * @returns {Object} Parsed event
     */
    constructWebhookEvent(payload, signature) {
        if (!stripe) {
            throw new Error('Stripe is not configured');
        }

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error('Stripe webhook secret not configured');
        }

        return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
}

module.exports = new StripeService();
