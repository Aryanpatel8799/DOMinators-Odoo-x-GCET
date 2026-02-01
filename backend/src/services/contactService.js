const crypto = require('crypto');
const db = require('../config/database');
const contactRepository = require('../repositories/contactRepository');
const emailService = require('./emailService');

class ContactService {
    /**
     * Create a contact
     * When contact_type is CUSTOMER, sets up auth and sends welcome email
     */
    async createContact(contactData) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            const { contact_type, email, name } = contactData;
            
            // Check if contact already exists
            const existingContact = await contactRepository.findByEmail(email);
            if (existingContact) {
                throw new Error('Contact with this email already exists');
            }
            
            let resetToken = null;
            let tokenHash = null;
            let tokenExpires = null;
            
            // For CUSTOMER contacts, set up password reset token for email setup
            if (contact_type === 'CUSTOMER') {
                resetToken = crypto.randomBytes(32).toString('hex');
                tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
                tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            }
            
            // Create the contact with auth fields
            const contact = await contactRepository.create({
                ...contactData,
                role: contact_type === 'CUSTOMER' ? 'CUSTOMER' : null,
                password_reset_token: tokenHash,
                password_reset_expires: tokenExpires,
                is_active: true,
            }, client);
            
            await client.query('COMMIT');
            
            // Send welcome email to customer (after commit so it doesn't block)
            if (contact_type === 'CUSTOMER' && resetToken) {
                console.log(`📧 Sending welcome email to ${email}...`);
                try {
                    await emailService.sendWelcomeEmail(email, name, resetToken);
                    console.log(`✅ Welcome email sent to ${email}`);
                } catch (emailError) {
                    console.error('❌ Failed to send welcome email:', emailError.message);
                    // Don't fail the contact creation if email fails
                }
            }
            
            return contact;
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new ContactService();
