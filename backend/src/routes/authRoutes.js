const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const { loginSchema, resetPasswordRequestSchema, setPasswordSchema, registerSchema } = require('../validations/schemas');

// Public routes
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/reset-password', validateBody(resetPasswordRequestSchema), authController.requestPasswordReset);
router.post('/set-password', validateBody(setPasswordSchema), authController.setPassword);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.get('/users', authenticate, authController.getUsers);
router.put('/users/:id', authenticate, authController.updateUser);
router.delete('/users/:id', authenticate, authController.deleteUser);

module.exports = router;
