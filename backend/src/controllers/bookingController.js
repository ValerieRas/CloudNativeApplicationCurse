const bookingService = require('../services/bookingService');

class BookingController {
  async getAllBookings(req, res) {
    try {
      const bookings = await bookingService.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const booking = await bookingService.getBookingById(id);
      res.json(booking);
    } catch (error) {
      if (error.message === 'Booking not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async getUserBookings(req, res) {
    try {
      const { userId } = req.params;
      const bookings = await bookingService.getBookingsByUserId(userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getClassBookings(req, res) {
    try {
      const { classId } = req.params;
      const bookings = await bookingService.getBookingsByClassId(classId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createBooking(req, res) {
    try {
      const bookingData = req.body;
      
      // Validate required fields
      if (!bookingData.userId || !bookingData.classId) {
        return res.status(400).json({ 
          error: 'Missing required fields: userId, classId' 
        });
      }

      const booking = await bookingService.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error.message === 'User not found' || 
          error.message === 'Class not found' ||
          error.message === 'Class is full' ||
          error.message === 'Class is cancelled' ||
          error.message === 'User already has a booking for this class' ||
          error.message === 'User already has a booking at this time slot') {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body; // Optional, for user authorization
      
      const booking = await bookingService.cancelBooking(id, userId);
      res.json(booking);
    } catch (error) {
      if (error.message === 'Booking not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Unauthorized to cancel this booking') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['CONFIRMED', 'CANCELLED', 'NO_SHOW'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
        });
      }

      const booking = await bookingService.updateBookingStatus(id, status);
      res.json(booking);
    } catch (error) {
      if (error.message === 'Booking not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async deleteBooking(req, res) {
    try {
      const { id } = req.params;
      await bookingService.deleteBooking(id);
      res.status(204).send();
    } catch (error) {
      if (error.message === 'Booking not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async updateNoShowBookings(req, res) {
    try {
      const result = await bookingService.updateNoShowBookings();
      res.json({
        message: 'Updated no-show bookings',
        updatedCount: result.count
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BookingController();
