/**
 * Wrap async controller functions to handle errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Standard success response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Paginated response
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
    res.status(200).json({
        success: true,
        message,
        data,
        pagination,
    });
};

/**
 * Created response (201)
 */
const createdResponse = (res, data, message = 'Created successfully') => {
    successResponse(res, data, message, 201);
};

/**
 * No content response (204)
 */
const noContentResponse = (res) => {
    res.status(204).send();
};

module.exports = {
    asyncHandler,
    successResponse,
    paginatedResponse,
    createdResponse,
    noContentResponse,
};
