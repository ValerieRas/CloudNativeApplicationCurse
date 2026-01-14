import apiClient from './api'

export const dashboardService = {
  async getUserDashboard(userId) {
    const response = await apiClient.get(`/dashboard/user/${userId}`)
    return response.data
  },

  async getAdminDashboard() {
    const response = await apiClient.get('/dashboard/admin')
    return response.data
  }
}

export const classService = {
  async getAllClasses(includeOld = false) {
    const response = await apiClient.get(`/classes?includeOld=${includeOld}`)
    return response.data
  },

  async getClassById(id) {
    const response = await apiClient.get(`/classes/${id}`)
    return response.data
  },

  async createClass(classData) {
    const response = await apiClient.post('/classes', classData)
    return response.data
  },

  async updateClass(id, classData) {
    const response = await apiClient.put(`/classes/${id}`, classData)
    return response.data
  },

  async deleteClass(id) {
    const response = await apiClient.delete(`/classes/${id}`)
    return response.data
  },

  async purgeOldClasses(days = 30) {
    const response = await apiClient.delete(`/classes/purge/old?days=${days}`)
    return response.data
  }
}

export const bookingService = {
  async getAllBookings() {
    const response = await apiClient.get('/bookings')
    return response.data
  },

  async getUserBookings(userId) {
    const response = await apiClient.get(`/bookings/user/${userId}`)
    return response.data
  },

  async getClassBookings(classId) {
    const response = await apiClient.get(`/bookings/class/${classId}`)
    return response.data
  },

  async createBooking(userId, classId) {
    const response = await apiClient.post('/bookings', { userId, classId })
    return response.data
  },

  async cancelBooking(bookingId, userId) {
    const response = await apiClient.put(`/bookings/${bookingId}/cancel`, { userId })
    return response.data
  },

  async updateBookingStatus(bookingId, status) {
    const response = await apiClient.put(`/bookings/${bookingId}/status`, { status })
    return response.data
  },

  async deleteBooking(bookingId) {
    const response = await apiClient.delete(`/bookings/${bookingId}`)
    return response.data
  },

  async updateNoShowBookings() {
    const response = await apiClient.put('/bookings/update-no-show')
    return response.data
  }
}

export const userService = {
  async getAllUsers() {
    const response = await apiClient.get('/users')
    return response.data
  },

  async getUserById(id) {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },

  async createUser(userData) {
    const response = await apiClient.post('/users', userData)
    return response.data
  },

  async updateUser(id, userData) {
    const response = await apiClient.put(`/users/${id}`, userData)
    return response.data
  },

  async deleteUser(id) {
    const response = await apiClient.delete(`/users/${id}`)
    return response.data
  }
}

export const subscriptionService = {
  async getAllSubscriptions() {
    const response = await apiClient.get('/subscriptions')
    return response.data
  },

  async getUserSubscription(userId) {
    const response = await apiClient.get(`/subscriptions/user/${userId}`)
    return response.data
  },

  async createSubscription(subscriptionData) {
    const response = await apiClient.post('/subscriptions', subscriptionData)
    return response.data
  },

  async updateSubscription(id, subscriptionData) {
    const response = await apiClient.put(`/subscriptions/${id}`, subscriptionData)
    return response.data
  },

  async deleteSubscription(id) {
    const response = await apiClient.delete(`/subscriptions/${id}`)
    return response.data
  }
}
