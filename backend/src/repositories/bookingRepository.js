const prisma = require('../prisma/client');

class BookingRepository {
  async findAll() {
    return await prisma.booking.findMany({
      include: {
        user: true,
        class: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findById(id) {
    return await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        class: true
      }
    });
  }

  async findByUserId(userId) {
    return await prisma.booking.findMany({
      where: { userId },
      include: {
        user: true,
        class: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findByClassId(classId) {
    return await prisma.booking.findMany({
      where: { classId },
      include: {
        user: true,
        class: true
      }
    });
  }

  async findByUserAndClass(userId, classId) {
    return await prisma.booking.findUnique({
      where: {
        userId_classId: {
          userId,
          classId
        }
      },
      include: {
        user: true,
        class: true
      }
    });
  }

  async create(bookingData) {
    return await prisma.booking.create({
      data: bookingData,
      include: {
        user: true,
        class: true
      }
    });
  }

  async update(id, bookingData) {
    return await prisma.booking.update({
      where: { id },
      data: bookingData,
      include: {
        user: true,
        class: true
      }
    });
  }

  async updateStatus(id, status) {
    return await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        class: true
      }
    });
  }

  async delete(id) {
    return await prisma.booking.delete({
      where: { id }
    });
  }

  async findUserBookingsInTimeSlot(userId, datetime) {
    return await prisma.booking.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
        class: {
          datetime
        }
      }
    });
  }

  async updateNoShowBookings() {
    const now = new Date();
    
    return await prisma.booking.updateMany({
      where: {
        status: 'CONFIRMED',
        class: {
          datetime: {
            lt: now
          }
        }
      },
      data: {
        status: 'NO_SHOW'
      }
    });
  }
}

module.exports = new BookingRepository();
