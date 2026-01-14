<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <nav class="nav">
          <div>
            <h1>🏋️ Gestion Salle de Sport</h1>
          </div>
          
          <div v-if="currentUser">
            <ul class="nav-links">
              <li>
                <router-link to="/dashboard">Dashboard</router-link>
              </li>
              <li v-if="currentUser.role === 'ADMIN'">
                <router-link to="/admin">Administration</router-link>
              </li>
              <li>
                <a href="#" @click="logout">
                  Déconnexion ({{ currentUser.firstname }} {{ currentUser.lastname }})
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </header>

    <main class="container">
      <router-view />
    </main>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './store/auth'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const currentUser = computed(() => authStore.currentUser)
    
    const logout = () => {
      authStore.logout()
      router.push('/login')
    }
    
    return {
      currentUser,
      logout
    }
  }
}
</script>
