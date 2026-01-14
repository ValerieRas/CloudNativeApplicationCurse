const express = require('express');
const classController = require('../controllers/classController');

const router = express.Router();

// GET /api/classes - Get all classes
router.get('/', classController.getAllClasses);

// POST /api/classes - Create new class (admin only)
router.post('/', classController.createClass);

// GET /api/classes/:id - Get class by ID
router.get('/:id', classController.getClassById);

// PUT /api/classes/:id - Update class (admin only)
router.put('/:id', classController.updateClass);

// DELETE /api/classes/:id - Delete class (admin only)
router.delete('/:id', classController.deleteClass);

// DELETE /api/classes/purge/old - Purge old classes (admin only)
router.delete('/purge/old', classController.purgeOldClasses);

module.exports = router;
