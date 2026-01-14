const prisma = require('../prisma/client');

class SubscriptionRepository {
  async findAll() {
    return await prisma.subscription.findMany({
      include: {
        user: true
      }
    });
  }

  async findById(id) {
    return await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true
      }
    });
  }

  async findByUserId(userId) {
    return await prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: true
      }
    });
  }

  async create(subscriptionData) {
    return await prisma.subscription.create({
      data: subscriptionData,
      include: {
        user: true
      }
    });
  }

  async update(id, subscriptionData) {
    return await prisma.subscription.update({
      where: { id },
      data: subscriptionData,
      include: {
        user: true
      }
    });
  }

  async delete(id) {
    return await prisma.subscription.delete({
      where: { id }
    });
  }
}

module.exports = new SubscriptionRepository();
