const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

module.exports = (pool) => {
    const authController = new AuthController(pool);

    router.post('/register', authController.register);
    router.post('/login', authController.login);
    router.get('/me', authenticateToken, authController.getCurrentUser);

    return router;
};
