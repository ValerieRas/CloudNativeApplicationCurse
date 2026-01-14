const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/login - Simulated login
router.post('/login', authController.login);

// GET /api/auth/users - Get users list for login selection
router.get('/users', authController.getUsers);

module.exports = router;
