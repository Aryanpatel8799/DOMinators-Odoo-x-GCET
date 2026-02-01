module.exports = {
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || '1h',
    },
    bcrypt: {
        saltRounds: 10,
    },
    pagination: {
        defaultLimit: 20,
        maxLimit: 100,
    },
    roles: {
        ADMIN: 'ADMIN',
        CUSTOMER: 'CUSTOMER',
    },
    documentStatus: {
        DRAFT: 'DRAFT',
        POSTED: 'POSTED',
        CANCELLED: 'CANCELLED',
    },
    paymentStatus: {
        NOT_PAID: 'NOT_PAID',
        PARTIALLY_PAID: 'PARTIALLY_PAID',
        PAID: 'PAID',
    },
    contactTypes: {
        CUSTOMER: 'CUSTOMER',
        VENDOR: 'VENDOR',
    },
};
