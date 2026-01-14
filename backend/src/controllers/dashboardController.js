const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getUserDashboard(req, res) {
    try {
      const { userId } = req.params;
      const dashboard = await dashboardService.getUserDashboard(userId);
      res.json(dashboard);
    } catch (error) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async getAdminDashboard(req, res) {
    try {
      const dashboard = await dashboardService.getAdminDashboard();
      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new DashboardController();
