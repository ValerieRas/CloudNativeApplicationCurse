const bookingRepository = require('../repositories/bookingRepository');
const classService = require('./classService');
const userService = require('./userService');

class BookingService {
  async getAllBookings() {
    return await bookingRepository.findAll();
  }

  async getBookingById(id) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
  }

  async getBookingsByUserId(userId) {
    return await bookingRepository.findByUserId(userId);
  }

  async getBookingsByClassId(classId) {
    return await bookingRepository.findByClassId(classId);
  }

  async createBooking(bookingData) {
    const { userId, classId } = bookingData;

    // Check if user exists
    await userService.getUserById(userId);

    // Get class information
    const classItem = await classService.getClassById(classId);

    // Check if class can be booked
    if (!classService.canBookClass(classItem)) {
      if (classService.isClassFull(classItem)) {
        throw new Error('Class is full');
      }
      if (classService.isClassCancelled(classItem)) {
        throw new Error('Class is cancelled');
      }
    }

    // Check for double booking (same time slot)
    const existingBooking = await bookingRepository.findByUserAndClass(userId, classId);
    if (existingBooking) {
      throw new Error('User already has a booking for this class');
    }

    // Check for conflicting bookings at the same time
    const conflictingBookings = await bookingRepository.findUserBookingsInTimeSlot(
      userId, 
      classItem.datetime
    );
    if (conflictingBookings.length > 0) {
      throw new Error('User already has a booking at this time slot');
    }

    return await bookingRepository.create({
      userId,
      classId,
      status: 'CONFIRMED'
    });
  }

  async cancelBooking(id, userId = null) {
    const booking = await this.getBookingById(id);

    // If userId is provided, check if user owns the booking
    if (userId && booking.userId !== userId) {
      throw new Error('Unauthorized to cancel this booking');
    }

    // Check if cancellation is allowed (2 hours before class)
    const classDatetime = new Date(booking.class.datetime);
    const now = new Date();
    const hoursUntilClass = (classDatetime - now) / (1000 * 60 * 60);

    if (hoursUntilClass < 2) {
      // Too late to cancel, mark as no-show
      return await bookingRepository.updateStatus(id, 'NO_SHOW');
    } else {
      // Can cancel
      return await bookingRepository.updateStatus(id, 'CANCELLED');
    }
  }

  async updateBookingStatus(id, status) {
    await this.getBookingById(id);
    return await bookingRepository.updateStatus(id, status);
  }

  async deleteBooking(id) {
    await this.getBookingById(id);
    return await bookingRepository.delete(id);
  }

  async updateNoShowBookings() {
    return await bookingRepository.updateNoShowBookings();
  }

  async getUserBookingStats(userId) {
    const bookings = await bookingRepository.findByUserId(userId);
    
    const stats = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
      cancelledBookings: bookings.filter(b => b.status === 'CANCELLED').length,
      noShowBookings: bookings.filter(b => b.status === 'NO_SHOW').length,
      totalMinutes: 0
    };

    // Calculate total minutes from completed classes
    stats.totalMinutes = bookings
      .filter(b => b.status === 'CONFIRMED' && new Date(b.class.datetime) < new Date())
      .reduce((total, booking) => total + booking.class.duration, 0);

    return stats;
  }

  async getMonthlyNoShowCount(userId, month = new Date().getMonth(), year = new Date().getFullYear()) {
    const bookings = await bookingRepository.findByUserId(userId);
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.class.datetime);
      return booking.status === 'NO_SHOW' && 
             bookingDate.getMonth() === month && 
             bookingDate.getFullYear() === year;
    }).length;
  }
}

module.exports = new BookingService();
