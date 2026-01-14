<template>
  <div class="dashboard">
    <h1>🎯 Dashboard</h1>
    
    <div v-if="loading" class="alert alert-info">
      Chargement de votre dashboard...
    </div>
    
    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>
    
    <div v-if="dashboard && !loading">
      <!-- User Info -->
      <div class="user-welcome card">
        <h2>Bienvenue, {{ dashboard.user.firstname }} {{ dashboard.user.lastname }} !</h2>
        <p>Email: {{ dashboard.user.email }}</p>
        <p>Membre depuis: {{ formatDate(dashboard.user.dateJoined) }}</p>
      </div>
      
      <!-- Subscription Info -->
      <div v-if="dashboard.subscription" class="subscription-info card">
        <h3>💳 Mon Abonnement</h3>
        <div class="subscription-details">
          <p><strong>Plan:</strong> {{ dashboard.subscription.planType }}</p>
          <p><strong>Début:</strong> {{ formatDate(dashboard.subscription.startDate) }}</p>
          <p><strong>Fin:</strong> {{ formatDate(dashboard.subscription.endDate) }}</p>
          <p><strong>Statut:</strong> 
            <span :class="dashboard.subscription.active ? 'status-confirmed' : 'status-cancelled'">
              {{ dashboard.subscription.active ? 'Actif' : 'Inactif' }}
            </span>
          </p>
          <p><strong>Renouvellement auto:</strong> {{ dashboard.subscription.autoRenew ? 'Oui' : 'Non' }}</p>
        </div>
      </div>
      
      <div v-else class="alert alert-info">
        ⚠️ Vous n'avez pas d'abonnement actif.
      </div>
      
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ dashboard.stats.totalClasses }}</div>
          <div class="stat-label">Cours réservés</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ dashboard.stats.confirmedClasses }}</div>
          <div class="stat-label">Cours confirmés</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ dashboard.stats.totalMinutes }}</div>
          <div class="stat-label">Minutes d'exercice</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ dashboard.stats.noShowClasses }}</div>
          <div class="stat-label">No-shows ce mois</div>
        </div>
      </div>
      
      <!-- Billing -->
      <div class="billing-info card">
        <h3>💰 Facturation mensuelle</h3>
        <div class="billing-amount">
          {{ dashboard.billing.monthlyAmount }}€
        </div>
        <p>Montant calculé pour ce mois</p>
      </div>
      
      <!-- Available Classes -->
      <div class="classes-section card">
        <h3>📅 Cours disponibles</h3>
        <div v-if="classesLoading" class="alert alert-info">
          Chargement des cours...
        </div>
        <div v-if="classesError" class="alert alert-error">
          {{ classesError }}
        </div>
        <div v-if="availableClasses.length === 0 && !classesLoading" class="alert alert-info">
          Aucun cours disponible pour le moment.
        </div>
        <div v-else class="classes-grid">
          <div 
            v-for="classItem in availableClasses" 
            :key="classItem.id"
            class="class-card"
          >
            <h4>{{ classItem.title }}</h4>
            <p><strong>Coach:</strong> {{ classItem.coach }}</p>
            <p><strong>Date:</strong> {{ formatDateTime(classItem.datetime) }}</p>
            <p><strong>Durée:</strong> {{ classItem.duration }} min</p>
            <p><strong>Places:</strong> {{ classItem.bookings.length }}/{{ classItem.capacity }}</p>
            
            <div class="class-actions">
              <button 
                v-if="!isUserBooked(classItem) && !isClassFull(classItem) && !classItem.isCancelled"
                class="btn btn-success"
                @click="bookClass(classItem.id)"
                :disabled="bookingLoading"
              >
                {{ bookingLoading ? 'Réservation...' : 'Réserver' }}
              </button>
              
              <button 
                v-if="isUserBooked(classItem)"
                class="btn btn-danger"
                @click="cancelBooking(getUserBooking(classItem).id)"
                :disabled="bookingLoading"
              >
                {{ bookingLoading ? 'Annulation...' : 'Annuler' }}
              </button>
              
              <span v-if="classItem.isCancelled" class="status-cancelled">
                Cours annulé
              </span>
              
              <span v-if="isClassFull(classItem) && !isUserBooked(classItem)" class="status-no-show">
                Complet
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Bookings -->
      <div class="recent-bookings card">
        <h3>📋 Mes dernières réservations</h3>
        <div v-if="dashboard.recentBookings.length === 0" class="alert alert-info">
          Aucune réservation récente.
        </div>
        <table v-else class="table">
          <thead>
            <tr>
              <th>Cours</th>
              <th>Coach</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Réservé le</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="booking in dashboard.recentBookings" :key="booking.id">
              <td>{{ booking.class.title }}</td>
              <td>{{ booking.class.coach }}</td>
              <td>{{ formatDateTime(booking.class.datetime) }}</td>
              <td>
                <span :class="`status-${booking.status.toLowerCase().replace('_', '-')}`">
                  {{ formatStatus(booking.status) }}
                </span>
              </td>
              <td>{{ formatDate(booking.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import { dashboardService, classService, bookingService } from '../services/gymService'

export default {
  name: 'DashboardView',
  setup() {
    const authStore = useAuthStore()
    
    const dashboard = ref(null)
    const loading = ref(true)
    const error = ref('')
    
    const availableClasses = ref([])
    const classesLoading = ref(false)
    const classesError = ref('')
    
    const bookingLoading = ref(false)
    
    const currentUser = computed(() => authStore.currentUser)
    
    const loadDashboard = async () => {
      try {
        loading.value = true
        error.value = ''
        dashboard.value = await dashboardService.getUserDashboard(currentUser.value.id)
      } catch (err) {
        error.value = err.response?.data?.error || 'Erreur lors du chargement du dashboard'
      } finally {
        loading.value = false
      }
    }
    
    const loadClasses = async () => {
      try {
        classesLoading.value = true
        classesError.value = ''
        availableClasses.value = await classService.getAllClasses()
      } catch (err) {
        classesError.value = err.response?.data?.error || 'Erreur lors du chargement des cours'
      } finally {
        classesLoading.value = false
      }
    }
    
    const bookClass = async (classId) => {
      try {
        bookingLoading.value = true
        await bookingService.createBooking(currentUser.value.id, classId)
        
        // Reload data
        await Promise.all([loadDashboard(), loadClasses()])
      } catch (err) {
        alert(err.response?.data?.error || 'Erreur lors de la réservation')
      } finally {
        bookingLoading.value = false
      }
    }
    
    const cancelBooking = async (bookingId) => {
      if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return
      
      try {
        bookingLoading.value = true
        await bookingService.cancelBooking(bookingId, currentUser.value.id)
        
        // Reload data
        await Promise.all([loadDashboard(), loadClasses()])
      } catch (err) {
        alert(err.response?.data?.error || 'Erreur lors de l\'annulation')
      } finally {
        bookingLoading.value = false
      }
    }
    
    const isUserBooked = (classItem) => {
      return classItem.bookings.some(b => 
        b.user.id === currentUser.value.id && b.status === 'CONFIRMED'
      )
    }
    
    const getUserBooking = (classItem) => {
      return classItem.bookings.find(b => 
        b.user.id === currentUser.value.id && b.status === 'CONFIRMED'
      )
    }
    
    const isClassFull = (classItem) => {
      const confirmedBookings = classItem.bookings.filter(b => b.status === 'CONFIRMED')
      return confirmedBookings.length >= classItem.capacity
    }
    
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('fr-FR')
    }
    
    const formatDateTime = (dateString) => {
      return new Date(dateString).toLocaleString('fr-FR')
    }
    
    const formatStatus = (status) => {
      const statusMap = {
        'CONFIRMED': 'Confirmé',
        'CANCELLED': 'Annulé',
        'NO_SHOW': 'Absence'
      }
      return statusMap[status] || status
    }
    
    onMounted(() => {
      Promise.all([loadDashboard(), loadClasses()])
    })
    
    return {
      dashboard,
      loading,
      error,
      availableClasses,
      classesLoading,
      classesError,
      bookingLoading,
      bookClass,
      cancelBooking,
      isUserBooked,
      getUserBooking,
      isClassFull,
      formatDate,
      formatDateTime,
      formatStatus
    }
  }
}
</script>

<style scoped>
.dashboard h1 {
  margin-bottom: 30px;
  color: #007bff;
}

.user-welcome {
  margin-bottom: 20px;
}

.user-welcome h2 {
  color: #28a745;
  margin-bottom: 10px;
}

.subscription-info {
  margin-bottom: 20px;
}

.subscription-details p {
  margin: 5px 0;
}

.billing-info {
  text-align: center;
  margin-bottom: 20px;
}

.billing-amount {
  font-size: 2.5em;
  font-weight: bold;
  color: #007bff;
  margin: 10px 0;
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.class-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: #f8f9fa;
}

.class-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.class-card p {
  margin: 5px 0;
  font-size: 0.9em;
}

.class-actions {
  margin-top: 15px;
}

.recent-bookings {
  margin-top: 20px;
}

.table {
  margin-top: 15px;
}

@media (max-width: 768px) {
  .classes-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
