const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');

const router = express.Router();

// GET /api/subscriptions - Get all subscriptions (admin only)
router.get('/', subscriptionController.getAllSubscriptions);

// POST /api/subscriptions - Create new subscription (admin only)
router.post('/', subscriptionController.createSubscription);

// GET /api/subscriptions/:id - Get subscription by ID (admin only)
router.get('/:id', subscriptionController.getSubscriptionById);

// PUT /api/subscriptions/:id - Update subscription (admin only)
router.put('/:id', subscriptionController.updateSubscription);

// DELETE /api/subscriptions/:id - Delete subscription (admin only)
router.delete('/:id', subscriptionController.deleteSubscription);

// GET /api/subscriptions/user/:userId - Get user's subscription
router.get('/user/:userId', subscriptionController.getUserSubscription);

module.exports = router;
