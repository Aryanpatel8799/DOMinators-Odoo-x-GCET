const transporter = require('../config/email');

class EmailService {
    /**
     * Send welcome email to new customer with password setup link
     * This is an alias for sendPasswordSetEmail for clarity
     */
    async sendWelcomeEmail(email, name, resetToken) {
        return this.sendPasswordSetEmail(email, name, resetToken);
    }

    /**
     * Send password set/reset email to new customer
     */
    async sendPasswordSetEmail(email, name, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/set-password?token=${resetToken}`;
        
        const mailOptions = {
            from: `"Shiv Furniture" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Welcome to Shiv Furniture - Set Your Password',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .button { 
                            display: inline-block; 
                            padding: 12px 24px; 
                            background: #3498db; 
                            color: white; 
                            text-decoration: none; 
                            border-radius: 5px;
                            margin: 20px 0;
                        }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to Shiv Furniture</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${name},</p>
                            <p>An account has been created for you at Shiv Furniture. You can now view your invoices and make payments online.</p>
                            <p>Please click the button below to set your password:</p>
                            <p style="text-align: center;">
                                <a href="${resetUrl}" class="button">Set Your Password</a>
                            </p>
                            <p>This link will expire in 24 hours.</p>
                            <p>If you did not expect this email, please ignore it.</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} Shiv Furniture. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        
        try {
            await transporter.sendMail(mailOptions);
            console.log(`Password set email sent to ${email}`);
        } catch (error) {
            console.error(`Failed to send email to ${email}:`, error.message);
            // Don't throw - email failure shouldn't break the invoice creation
        }
    }
    
    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, name, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: `"Shiv Furniture" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Reset Your Password - Shiv Furniture',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .button { 
                            display: inline-block; 
                            padding: 12px 24px; 
                            background: #e74c3c; 
                            color: white; 
                            text-decoration: none; 
                            border-radius: 5px;
                            margin: 20px 0;
                        }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Shiv Furniture</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${name},</p>
                            <p>You have requested to reset your password. Click the button below to proceed:</p>
                            <p style="text-align: center;">
                                <a href="${resetUrl}" class="button">Reset Password</a>
                            </p>
                            <p>This link will expire in 1 hour.</p>
                            <p>If you did not request this, please ignore this email.</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} Shiv Furniture. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        
        try {
            await transporter.sendMail(mailOptions);
            console.log(`📧 Password reset email sent to ${email}`);
        } catch (error) {
            console.error(`Failed to send email to ${email}:`, error.message);
        }
    }
    
    /**
     * Send invoice notification email
     */
    async sendInvoiceNotification(email, name, invoiceNumber, totalAmount, dueDate) {
        const mailOptions = {
            from: `"Shiv Furniture" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: `New Invoice ${invoiceNumber} - Shiv Furniture`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .invoice-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                        .button { 
                            display: inline-block; 
                            padding: 12px 24px; 
                            background: #27ae60; 
                            color: white; 
                            text-decoration: none; 
                            border-radius: 5px;
                            margin: 20px 0;
                        }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Shiv Furniture</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${name},</p>
                            <p>A new invoice has been generated for your account.</p>
                            <div class="invoice-details">
                                <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                                <p><strong>Amount:</strong> ₹${totalAmount.toLocaleString('en-IN')}</p>
                                <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-IN')}</p>
                            </div>
                            <p>Please login to your account to view details and make payment.</p>
                            <p style="text-align: center;">
                                <a href="${process.env.FRONTEND_URL}/login" class="button">View Invoice</a>
                            </p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} Shiv Furniture. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        
        try {
            await transporter.sendMail(mailOptions);
            console.log(`📧 Invoice notification sent to ${email}`);
        } catch (error) {
            console.error(`Failed to send invoice notification to ${email}:`, error.message);
        }
    }
}

module.exports = new EmailService();
