const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const contactRepository = require('../repositories/contactRepository');
const { jwt: jwtConfig, bcrypt: bcryptConfig } = require('../config/constants');
const { UnauthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');
const { generateResetToken, hashResetToken } = require('../utils/helpers');
const emailService = require('./emailService');

class AuthService {
    /**
     * Get all users (contacts with auth)
     */
    async getUsers() {
        const contacts = await contactRepository.findAll({}, { limit: 1000 });
        return contacts.filter(c => c.password_hash || c.role === 'ADMIN').map(contact => ({
            id: contact.id,
            email: contact.email,
            name: contact.name,
            role: contact.role || 'CUSTOMER',
            is_active: contact.is_active !== false,
            created_at: contact.created_at,
        }));
    }
    
    /**
     * Update a user
     */
    async updateUser(id, userData) {
        const contact = await contactRepository.findById(id);
        if (!contact) {
            throw new NotFoundError('User not found');
        }
        
        const updates = {};
        if (userData.name) updates.name = userData.name;
        if (userData.email) updates.email = userData.email.toLowerCase();
        if (userData.role) updates.role = userData.role;
        if (userData.is_active !== undefined) updates.is_active = userData.is_active;
        
        const updatedContact = await contactRepository.update(id, updates);
        return {
            id: updatedContact.id,
            email: updatedContact.email,
            name: updatedContact.name,
            role: updatedContact.role,
            is_active: updatedContact.is_active,
        };
    }
    
    /**
     * Delete a user
     */
    async deleteUser(id) {
        const contact = await contactRepository.findById(id);
        if (!contact) {
            throw new NotFoundError('User not found');
        }
        
        await contactRepository.delete(id);
        return { message: 'User deleted successfully' };
    }
    
    /**
     * Register a new user (stored in contacts table)
     */
    async register(userData) {
        const { email, password, name, role } = userData;
        console.log(userData, "--------------")
        
        // Check if contact already exists
        const existingContact = await contactRepository.findByEmail(email);
        if (existingContact) {
            throw new BadRequestError('User with this email already exists');
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, bcryptConfig.saltRounds);
        
        // Create contact with auth info
        const contact = await contactRepository.create({
            email,
            name,
            contact_type: 'CUSTOMER',
            role: role || 'CUSTOMER',
            password_hash: passwordHash,
            is_active: true,
        });
        
        return {
            id: contact.id,
            email: contact.email,
            name: contact.name,
            role: contact.role,
        };
    }
    
    /**
     * Login user with email and password
     */
    async login(email, password) {
        console.log("loginnn", email, password)
        const contact = await contactRepository.findByEmail(email);
        
        if (!contact) {
            throw new UnauthorizedError('Invalid email or password');
        }
        
        if (contact.is_active === false) {
            throw new UnauthorizedError('Account is deactivated');
        }
        
        if (!contact.password_hash) {
            throw new UnauthorizedError('Please set your password first. Check your email for the password reset link.');
        }
        
        const isPasswordValid = await bcrypt.compare(password, contact.password_hash);
        
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password');
        }
        
        const token = this.generateToken(contact);
        
        return {
            token,
            user: {
                id: contact.id,
                email: contact.email,
                name: contact.name,
                role: contact.role || 'CUSTOMER',
            },
        };
    }
    
    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        const contact = await contactRepository.findByEmail(email);
        
        if (!contact) {
            return { message: 'If the email exists, a reset link will be sent.' };
        }
        
        const resetToken = generateResetToken();
        const hashedToken = hashResetToken(resetToken);
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        await contactRepository.setResetToken(contact.id, hashedToken, expires);
        
        // Send password reset email
        await emailService.sendPasswordResetEmail(contact.email, contact.name, resetToken);
        
        return { message: 'If the email exists, a reset link will be sent.' };
    }
    
    /**
     * Set/Reset password with token
     */
    async setPassword(token, newPassword) {
        const hashedToken = hashResetToken(token);
        const contact = await contactRepository.findByResetToken(hashedToken);
        
        if (!contact) {
            throw new BadRequestError('Invalid or expired reset token');
        }
        
        const passwordHash = await bcrypt.hash(newPassword, bcryptConfig.saltRounds);
        await contactRepository.setPassword(contact.id, passwordHash);
        
        return { message: 'Password set successfully. You can now login.' };
    }
    
    /**
     * Generate JWT token
     */
    generateToken(contact) {
        return jwt.sign(
            {
                id: contact.id,
                email: contact.email,
                name: contact.name,
                role: contact.role || 'CUSTOMER',
            },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );
    }
    
    /**
     * Ensure customer contact exists (used when creating invoice)
     * Returns { user, isNew, resetToken }
     */
    async ensureCustomerUser(email, name, client) {
        let contact = await contactRepository.findByEmail(email);
        
        if (contact) {
            return { user: contact, isNew: false, resetToken: null };
        }
        
        // Create new contact with reset token
        const resetToken = generateResetToken();
        const hashedToken = hashResetToken(resetToken);
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        contact = await contactRepository.create({
            email,
            name,
            contact_type: 'CUSTOMER',
            role: 'CUSTOMER',
            password_hash: null,
            password_reset_token: hashedToken,
            password_reset_expires: expires,
            is_active: true,
        }, client);
        
        return { user: contact, isNew: true, resetToken };
    }
}

module.exports = new AuthService();
