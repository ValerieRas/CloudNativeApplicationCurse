const userService = require('../services/userService');

class AuthController {
  async login(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await userService.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Simulated login - return user info
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
          dateJoined: user.dateJoined
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUsers(req, res) {
    try {
      // Return simplified user list for login selection
      const users = await userService.getAllUsers();
      const userList = users.map(user => ({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role
      }));
      
      res.json(userList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();
