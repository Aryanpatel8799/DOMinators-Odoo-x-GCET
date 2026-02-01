const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('⚠️ Email service not configured:', error.message);
    } else {
        console.log('📧 Email service ready');
    }
});

module.exports = transporter;
