const userService = require('../services/userService');

class UserController {
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.json(user);
    } catch (error) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async createUser(req, res) {
    try {
      const userData = req.body;
      
      // Validate required fields
      if (!userData.firstname || !userData.lastname || !userData.email) {
        return res.status(400).json({ 
          error: 'Missing required fields: firstname, lastname, email' 
        });
      }

      const user = await userService.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      const user = await userService.updateUser(id, userData);
      res.json(user);
    } catch (error) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'User with this email already exists') {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}

module.exports = new UserController();
