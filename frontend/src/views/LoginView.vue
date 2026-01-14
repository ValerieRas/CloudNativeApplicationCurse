<template>
  <div class="login-container">
    <div class="login-card card">
      <h2>🏋️ Connexion</h2>
      <p>Sélectionnez un utilisateur pour vous connecter (simulation)</p>
      
      <div v-if="loading" class="alert alert-info">
        Chargement des utilisateurs...
      </div>
      
      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>
      
      <div v-if="!loading && users.length > 0" class="users-grid">
        <div 
          v-for="user in users" 
          :key="user.id" 
          class="user-card"
          @click="selectUser(user)"
        >
          <div class="user-info">
            <h3>{{ user.firstname }} {{ user.lastname }}</h3>
            <p>{{ user.email }}</p>
            <span class="user-role" :class="user.role.toLowerCase()">
              {{ user.role === 'ADMIN' ? '👑 Admin' : '👤 Utilisateur' }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="manual-login">
        <h3>Ou connectez-vous avec un email</h3>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">Email :</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              required 
              placeholder="Entrez votre email"
            >
          </div>
          <button type="submit" class="btn" :disabled="loginLoading">
            {{ loginLoading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const users = ref([])
    const loading = ref(true)
    const error = ref('')
    const email = ref('')
    const loginLoading = ref(false)
    
    const loadUsers = async () => {
      try {
        loading.value = true
        error.value = ''
        users.value = await authStore.getAvailableUsers()
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    
    const selectUser = async (user) => {
      try {
        loginLoading.value = true
        await authStore.login(user.email)
        router.push('/dashboard')
      } catch (err) {
        error.value = err.message
      } finally {
        loginLoading.value = false
      }
    }
    
    const handleLogin = async () => {
      if (!email.value) return
      
      try {
        loginLoading.value = true
        error.value = ''
        await authStore.login(email.value)
        router.push('/dashboard')
      } catch (err) {
        error.value = err.message
      } finally {
        loginLoading.value = false
      }
    }
    
    onMounted(() => {
      loadUsers()
    })
    
    return {
      users,
      loading,
      error,
      email,
      loginLoading,
      selectUser,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 20px;
}

.login-card {
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.login-card h2 {
  margin-bottom: 10px;
  color: #007bff;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.user-card {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8f9fa;
}

.user-card:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.user-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.user-info p {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 0.9em;
}

.user-role {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.user-role.admin {
  background-color: #dc3545;
  color: white;
}

.user-role.user {
  background-color: #28a745;
  color: white;
}

.manual-login {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.manual-login h3 {
  margin-bottom: 15px;
  color: #666;
  font-size: 1.1em;
}
</style>
