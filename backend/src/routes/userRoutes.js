const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', userController.getAllUsers);

// POST /api/users - Create new user (admin only)
router.post('/', userController.createUser);

// GET /api/users/:id - Get user by ID (admin only)
router.get('/:id', userController.getUserById);

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', userController.deleteUser);

module.exports = router;
