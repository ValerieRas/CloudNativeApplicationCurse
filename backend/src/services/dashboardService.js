const bookingService = require('./bookingService');
const subscriptionService = require('./subscriptionService');
const userService = require('./userService');

class DashboardService {
  async getUserDashboard(userId) {
    // Get user information
    const user = await userService.getUserById(userId);
    
    // Get booking statistics
    const bookingStats = await bookingService.getUserBookingStats(userId);
    
    // Get subscription information
    const subscription = await subscriptionService.getSubscriptionByUserId(userId);
    
    // Get monthly no-show count
    const monthlyNoShowCount = await bookingService.getMonthlyNoShowCount(userId);
    
    // Calculate monthly billing
    let monthlyBill = 0;
    if (subscription && subscription.active) {
      monthlyBill = subscriptionService.calculateMonthlyBilling(subscription, monthlyNoShowCount);
    }

    return {
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        dateJoined: user.dateJoined,
        role: user.role
      },
      subscription: subscription ? {
        planType: subscription.planType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        active: subscription.active,
        autoRenew: subscription.autoRenew
      } : null,
      stats: {
        totalClasses: bookingStats.totalBookings,
        confirmedClasses: bookingStats.confirmedBookings,
        cancelledClasses: bookingStats.cancelledBookings,
        noShowClasses: bookingStats.noShowBookings,
        totalMinutes: bookingStats.totalMinutes,
        monthlyNoShowCount
      },
      billing: {
        monthlyAmount: monthlyBill,
        currency: 'EUR'
      },
      recentBookings: user.bookings.slice(0, 5).map(booking => ({
        id: booking.id,
        status: booking.status,
        createdAt: booking.createdAt,
        class: {
          id: booking.class.id,
          title: booking.class.title,
          coach: booking.class.coach,
          datetime: booking.class.datetime,
          duration: booking.class.duration
        }
      }))
    };
  }

  async getAdminDashboard() {
    // Get all users count
    const allUsers = await userService.getAllUsers();
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(user => user.subscription?.active).length;

    // Get all bookings stats
    const allBookings = await bookingService.getAllBookings();
    const totalBookings = allBookings.length;
    const confirmedBookings = allBookings.filter(b => b.status === 'CONFIRMED').length;
    const noShowBookings = allBookings.filter(b => b.status === 'NO_SHOW').length;

    // Get subscription stats
    const subscriptionStats = {
      STANDARD: allUsers.filter(u => u.subscription?.planType === 'STANDARD').length,
      PREMIUM: allUsers.filter(u => u.subscription?.planType === 'PREMIUM').length,
      ETUDIANT: allUsers.filter(u => u.subscription?.planType === 'ETUDIANT').length
    };

    // Calculate monthly revenue
    let monthlyRevenue = 0;
    for (const user of allUsers) {
      if (user.subscription && user.subscription.active) {
        const noShowCount = await bookingService.getMonthlyNoShowCount(user.id);
        monthlyRevenue += subscriptionService.calculateMonthlyBilling(user.subscription, noShowCount);
      }
    }

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        noShow: noShowBookings,
        cancelled: totalBookings - confirmedBookings - noShowBookings
      },
      subscriptions: subscriptionStats,
      revenue: {
        monthly: Math.round(monthlyRevenue * 100) / 100,
        currency: 'EUR'
      }
    };
  }
}

module.exports = new DashboardService();
