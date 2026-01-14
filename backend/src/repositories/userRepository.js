const prisma = require('../prisma/client');

class UserRepository {
  async findAll() {
    return await prisma.user.findMany({
      include: {
        subscription: true,
        bookings: {
          include: {
            class: true
          }
        }
      }
    });
  }

  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        bookings: {
          include: {
            class: true
          }
        }
      }
    });
  }

  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
        bookings: {
          include: {
            class: true
          }
        }
      }
    });
  }

  async create(userData) {
    return await prisma.user.create({
      data: userData,
      include: {
        subscription: true,
        bookings: true
      }
    });
  }

  async update(id, userData) {
    return await prisma.user.update({
      where: { id },
      data: userData,
      include: {
        subscription: true,
        bookings: true
      }
    });
  }

  async delete(id) {
    return await prisma.user.delete({
      where: { id }
    });
  }
}

module.exports = new UserRepository();
