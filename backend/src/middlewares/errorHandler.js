const { AppError, InternalServerError } = require('../utils/errors');

/**
 * Not found handler
 */
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found',
        error: {
            code: 'NOT_FOUND',
            path: req.originalUrl,
        },
    });
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }
    
    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            error: {
                code: 'VALIDATION_ERROR',
                errors: err.errors,
            },
        });
    }
    
    // Handle our custom AppError
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: {
                code: err.code,
                ...(err.errors && { errors: err.errors }),
            },
        });
    }
    
    // Handle PostgreSQL errors
    if (err.code) {
        // Unique constraint violation
        if (err.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Resource already exists',
                error: {
                    code: 'CONFLICT',
                    detail: err.detail,
                },
            });
        }
        
        // Foreign key violation
        if (err.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'Referenced resource does not exist',
                error: {
                    code: 'FOREIGN_KEY_VIOLATION',
                    detail: err.detail,
                },
            });
        }
        
        // Check constraint violation
        if (err.code === '23514') {
            return res.status(400).json({
                success: false,
                message: 'Data validation failed',
                error: {
                    code: 'CHECK_VIOLATION',
                    detail: err.detail,
                },
            });
        }
    }
    
    // Handle unknown errors
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;
    
    res.status(statusCode).json({
        success: false,
        message,
        error: {
            code: 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};

module.exports = {
    notFoundHandler,
    errorHandler,
};
