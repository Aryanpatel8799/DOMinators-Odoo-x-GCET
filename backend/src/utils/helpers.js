const crypto = require('crypto');

/**
 * Generate a random token for password reset
 */
const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a reset token for storage
 */
const hashResetToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Calculate pagination offset
 */
const calculatePagination = (page = 1, limit = 20) => {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;
    
    return { page: pageNum, limit: limitNum, offset };
};

/**
 * Build pagination metadata
 */
const buildPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};

/**
 * Format date for PostgreSQL
 */
const formatDate = (date) => {
    if (!date) return null;
    if (date instanceof Date) {
        return date.toISOString().split('T')[0];
    }
    return date;
};

/**
 * Sanitize object by removing undefined values
 */
const sanitizeObject = (obj) => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
    );
};

module.exports = {
    generateResetToken,
    hashResetToken,
    calculatePagination,
    buildPaginationMeta,
    formatDate,
    sanitizeObject,
};
