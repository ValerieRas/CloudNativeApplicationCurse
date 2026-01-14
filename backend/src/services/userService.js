const userRepository = require('../repositories/userRepository');

class UserService {
  async getAllUsers() {
    return await userRepository.findAll();
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getUserByEmail(email) {
    return await userRepository.findByEmail(email);
  }

  async createUser(userData) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    return await userRepository.create(userData);
  }

  async updateUser(id, userData) {
    // Check if user exists
    await this.getUserById(id);

    // Check if email is being changed and if it already exists
    if (userData.email) {
      const existingUser = await userRepository.findByEmail(userData.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('User with this email already exists');
      }
    }

    return await userRepository.update(id, userData);
  }

  async deleteUser(id) {
    // Check if user exists
    await this.getUserById(id);
    return await userRepository.delete(id);
  }
}

module.exports = new UserService();
