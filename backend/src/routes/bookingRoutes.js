const express = require('express');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// GET /api/bookings - Get all bookings (admin only)
router.get('/', bookingController.getAllBookings);

// POST /api/bookings - Create new booking (book a class)
router.post('/', bookingController.createBooking);

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', bookingController.getBookingById);

// PUT /api/bookings/:id/status - Update booking status (admin only)
router.put('/:id/status', bookingController.updateBookingStatus);

// DELETE /api/bookings/:id - Delete booking (admin only)
router.delete('/:id', bookingController.deleteBooking);

// PUT /api/bookings/:id/cancel - Cancel booking
router.put('/:id/cancel', bookingController.cancelBooking);

// GET /api/bookings/user/:userId - Get user's bookings
router.get('/user/:userId', bookingController.getUserBookings);

// GET /api/bookings/class/:classId - Get class bookings
router.get('/class/:classId', bookingController.getClassBookings);

// PUT /api/bookings/update-no-show - Update no-show bookings (admin utility)
router.put('/update-no-show', bookingController.updateNoShowBookings);

module.exports = router;
