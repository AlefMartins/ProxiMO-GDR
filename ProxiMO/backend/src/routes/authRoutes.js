const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Rotas públicas
router.post('/login', authController.login);

// Rotas protegidas
router.use(authMiddleware.authenticate);
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);

module.exports = router;
