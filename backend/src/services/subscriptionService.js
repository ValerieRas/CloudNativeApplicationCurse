const subscriptionRepository = require('../repositories/subscriptionRepository');
const userService = require('./userService');

class SubscriptionService {
  async getAllSubscriptions() {
    return await subscriptionRepository.findAll();
  }

  async getSubscriptionById(id) {
    const subscription = await subscriptionRepository.findById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    return subscription;
  }

  async getSubscriptionByUserId(userId) {
    return await subscriptionRepository.findByUserId(userId);
  }

  async createSubscription(subscriptionData) {
    // Check if user exists
    await userService.getUserById(subscriptionData.userId);

    // Check if user already has a subscription
    const existingSubscription = await subscriptionRepository.findByUserId(subscriptionData.userId);
    if (existingSubscription) {
      throw new Error('User already has a subscription');
    }

    return await subscriptionRepository.create(subscriptionData);
  }

  async updateSubscription(id, subscriptionData) {
    // Check if subscription exists
    await this.getSubscriptionById(id);

    return await subscriptionRepository.update(id, subscriptionData);
  }

  async deleteSubscription(id) {
    // Check if subscription exists
    await this.getSubscriptionById(id);
    return await subscriptionRepository.delete(id);
  }

  getSubscriptionPrice(planType) {
    const prices = {
      STANDARD: 39.99,
      PREMIUM: 59.99,
      ETUDIANT: 29.99
    };
    return prices[planType] || 0;
  }

  calculateMonthlyBilling(subscription, noShowCount = 0) {
    let basePrice = this.getSubscriptionPrice(subscription.planType);
    
    // Réduction si abonnement > 6 mois
    const subscriptionDuration = Math.floor(
      (new Date() - new Date(subscription.startDate)) / (1000 * 60 * 60 * 24 * 30)
    );
    
    if (subscriptionDuration > 6) {
      basePrice *= 0.9; // 10% de réduction
    }

    // Majoration si plus de 5 no-show par mois
    if (noShowCount > 5) {
      basePrice *= 1.15; // 15% de majoration
    }

    return Math.round(basePrice * 100) / 100;
  }
}

module.exports = new SubscriptionService();
