const classRepository = require('../repositories/classRepository');

class ClassService {
  async getAllClasses(includeOld = false) {
    return await classRepository.findAll(includeOld);
  }

  async getClassById(id) {
    const classItem = await classRepository.findById(id);
    if (!classItem) {
      throw new Error('Class not found');
    }
    return classItem;
  }

  async createClass(classData) {
    // Validate datetime is in the future
    if (new Date(classData.datetime) <= new Date()) {
      throw new Error('Class datetime must be in the future');
    }

    return await classRepository.create(classData);
  }

  async updateClass(id, classData) {
    // Check if class exists
    await this.getClassById(id);

    return await classRepository.update(id, classData);
  }

  async deleteClass(id) {
    // Check if class exists
    await this.getClassById(id);
    return await classRepository.delete(id);
  }

  async purgeOldClasses(daysOld = 30) {
    const oldClasses = await classRepository.findOldClasses(daysOld);
    const result = await classRepository.deleteOldClasses(daysOld);
    
    return {
      deletedCount: result.count,
      deletedClasses: oldClasses
    };
  }

  isClassFull(classItem) {
    const confirmedBookings = classItem.bookings.filter(
      booking => booking.status === 'CONFIRMED'
    );
    return confirmedBookings.length >= classItem.capacity;
  }

  isClassCancelled(classItem) {
    return classItem.isCancelled;
  }

  canBookClass(classItem) {
    return !this.isClassFull(classItem) && !this.isClassCancelled(classItem);
  }
}

module.exports = new ClassService();
