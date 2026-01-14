const subscriptionService = require('../services/subscriptionService');

class SubscriptionController {
  async getAllSubscriptions(req, res) {
    try {
      const subscriptions = await subscriptionService.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSubscriptionById(req, res) {
    try {
      const { id } = req.params;
      const subscription = await subscriptionService.getSubscriptionById(id);
      res.json(subscription);
    } catch (error) {
      if (error.message === 'Subscription not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async getUserSubscription(req, res) {
    try {
      const { userId } = req.params;
      const subscription = await subscriptionService.getSubscriptionByUserId(userId);
      
      if (!subscription) {
        return res.status(404).json({ error: 'No subscription found for this user' });
      }
      
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createSubscription(req, res) {
    try {
      const subscriptionData = req.body;
      
      // Validate required fields
      if (!subscriptionData.userId || !subscriptionData.planType || 
          !subscriptionData.startDate || !subscriptionData.endDate) {
        return res.status(400).json({ 
          error: 'Missing required fields: userId, planType, startDate, endDate' 
        });
      }

      // Validate planType
      const validPlanTypes = ['STANDARD', 'PREMIUM', 'ETUDIANT'];
      if (!validPlanTypes.includes(subscriptionData.planType)) {
        return res.status(400).json({ 
          error: 'Invalid planType. Must be one of: ' + validPlanTypes.join(', ') 
        });
      }

      const subscription = await subscriptionService.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error.message === 'User not found' || error.message === 'User already has a subscription') {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async updateSubscription(req, res) {
    try {
      const { id } = req.params;
      const subscriptionData = req.body;
      
      const subscription = await subscriptionService.updateSubscription(id, subscriptionData);
      res.json(subscription);
    } catch (error) {
      if (error.message === 'Subscription not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async deleteSubscription(req, res) {
    try {
      const { id } = req.params;
      await subscriptionService.deleteSubscription(id);
      res.status(204).send();
    } catch (error) {
      if (error.message === 'Subscription not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}

module.exports = new SubscriptionController();
