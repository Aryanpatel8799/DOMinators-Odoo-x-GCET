const { ValidationError } = require('../utils/errors');

/**
 * Validate request body against Zod schema
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.body);
            
            if (!result.success) {
                const errors = result.error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                throw new ValidationError('Validation failed', errors);
            }
            
            req.body = result.data;
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Validate request query against Zod schema
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.query);
            
            if (!result.success) {
                const errors = result.error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                throw new ValidationError('Validation failed', errors);
            }
            
            req.query = result.data;
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Validate request params against Zod schema
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.params);
            
            if (!result.success) {
                const errors = result.error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                throw new ValidationError('Validation failed', errors);
            }
            
            req.params = result.data;
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    validateBody,
    validateQuery,
    validateParams,
};
