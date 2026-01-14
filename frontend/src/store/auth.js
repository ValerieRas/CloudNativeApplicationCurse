import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const isAuthenticated = computed(() => !!currentUser.value)
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')

  const login = async (email) => {
    try {
      const response = await apiClient.post('/auth/login', { email })
      currentUser.value = response.data.user
      
      // Store in localStorage
      localStorage.setItem('currentUser', JSON.stringify(response.data.user))
      
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  const logout = () => {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }

  const initAuth = () => {
    const stored = localStorage.getItem('currentUser')
    if (stored) {
      try {
        currentUser.value = JSON.parse(stored)
      } catch (e) {
        localStorage.removeItem('currentUser')
      }
    }
  }

  const getAvailableUsers = async () => {
    try {
      const response = await apiClient.get('/auth/users')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch users')
    }
  }

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    initAuth,
    getAvailableUsers
  }
})
