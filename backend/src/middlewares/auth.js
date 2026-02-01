const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { jwt: jwtConfig, roles } = require('../config/constants');
const db = require('../config/database');

/**
 * Authenticate JWT token
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Access token is required');
        }
        
        const token = authHeader.split(' ')[1];
        
        const decoded = jwt.verify(token, jwtConfig.secret);
        req.user = decoded;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new UnauthorizedError('Invalid token'));
        } else if (error.name === 'TokenExpiredError') {
            next(new UnauthorizedError('Token has expired'));
        } else {
            next(error);
        }
    }
};

/**
 * Authorize specific roles
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required'));
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError('You do not have permission to perform this action'));
        }
        
        next();
    };
};

/**
 * Admin only middleware
 */
const adminOnly = authorize(roles.ADMIN);

/**
 * Customer only middleware (users with CUSTOMER role)
 */
const customerOnly = authorize(roles.CUSTOMER);

/**
 * Vendor only middleware
 * Checks if user has CUSTOMER role AND is a VENDOR contact
 */
const vendorOnly = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required'));
        }
        
        // Allow CUSTOMER role users who are vendors
        if (req.user.role !== roles.CUSTOMER) {
            return next(new ForbiddenError('You do not have permission to perform this action'));
        }
        
        // Check if contact is a vendor (user.id is the contact id)
        const result = await db.query(
            `SELECT id, contact_type FROM contacts WHERE id = $1`,
            [req.user.id]
        );
        
        if (result.rows.length === 0 || result.rows[0].contact_type !== 'VENDOR') {
            return next(new ForbiddenError('You must be a vendor to access this resource'));
        }
        
        // Attach contact info to request
        req.vendorContact = result.rows[0];
        
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Admin or Customer middleware
 */
const adminOrCustomer = authorize(roles.ADMIN, roles.CUSTOMER);

module.exports = {
    authenticate,
    authorize,
    adminOnly,
    customerOnly,
    vendorOnly,
    adminOrCustomer,
};
