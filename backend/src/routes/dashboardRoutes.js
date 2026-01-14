const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard/user/:userId - Get user dashboard stats
router.get('/user/:userId', dashboardController.getUserDashboard);

// GET /api/dashboard/admin - Get admin dashboard stats
router.get('/admin', dashboardController.getAdminDashboard);

module.exports = router;
