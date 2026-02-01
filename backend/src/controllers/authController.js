const authService = require('../services/authService');
const { asyncHandler, successResponse } = require('../utils/responseHandler');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    successResponse(res, result, 'User created successfully', 201);
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    successResponse(res, result, 'Login successful');
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Request password reset
 * @access  Public
 */
const requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    successResponse(res, null, result.message);
});

/**
 * @route   POST /api/auth/set-password
 * @desc    Set/Reset password with token
 * @access  Public
 */
const setPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const result = await authService.setPassword(token, password);
    successResponse(res, null, result.message);
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
    successResponse(res, {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
    }, 'Profile fetched successfully');
});

/**
 * @route   GET /api/auth/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
const getUsers = asyncHandler(async (req, res) => {
    const users = await authService.getUsers();
    successResponse(res, users, 'Users fetched successfully');
});

/**
 * @route   PUT /api/auth/users/:id
 * @desc    Update a user
 * @access  Private (Admin only)
 */
const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await authService.updateUser(id, req.body);
    successResponse(res, result, 'User updated successfully');
});

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Delete a user
 * @access  Private (Admin only)
 */
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await authService.deleteUser(id);
    successResponse(res, null, result.message);
});

module.exports = {
    register,
    login,
    requestPasswordReset,
    setPassword,
    getProfile,
    getUsers,
    updateUser,
    deleteUser,
};
