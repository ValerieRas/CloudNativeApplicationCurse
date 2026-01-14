const prisma = require('../prisma/client');

class ClassRepository {
  async findAll(includeOld = false) {
    const whereClause = includeOld ? {} : {
      datetime: {
        gte: new Date()
      }
    };

    return await prisma.class.findMany({
      where: whereClause,
      include: {
        bookings: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        datetime: 'asc'
      }
    });
  }

  async findById(id) {
    return await prisma.class.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async create(classData) {
    return await prisma.class.create({
      data: classData,
      include: {
        bookings: true
      }
    });
  }

  async update(id, classData) {
    return await prisma.class.update({
      where: { id },
      data: classData,
      include: {
        bookings: true
      }
    });
  }

  async delete(id) {
    return await prisma.class.delete({
      where: { id }
    });
  }

  async findOldClasses(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await prisma.class.findMany({
      where: {
        datetime: {
          lt: cutoffDate
        }
      }
    });
  }

  async deleteOldClasses(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await prisma.class.deleteMany({
      where: {
        datetime: {
          lt: cutoffDate
        }
      }
    });
  }
}

module.exports = new ClassRepository();
