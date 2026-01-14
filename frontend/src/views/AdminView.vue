<template>
  <div class="admin-panel">
    <h1>👑 Panel d'Administration</h1>
    
    <!-- Admin Dashboard Stats -->
    <div v-if="adminDashboard" class="admin-stats">
      <h2>📊 Statistiques Globales</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ adminDashboard.users.total }}</div>
          <div class="stat-label">Utilisateurs totaux</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ adminDashboard.users.active }}</div>
          <div class="stat-label">Utilisateurs actifs</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ adminDashboard.bookings.total }}</div>
          <div class="stat-label">Réservations totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ adminDashboard.bookings.noShow }}</div>
          <div class="stat-label">No-shows</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ adminDashboard.revenue.monthly }}€</div>
          <div class="stat-label">Revenus mensuels</div>
        </div>
      </div>
    </div>
    
    <!-- Navigation Tabs -->
    <div class="admin-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <!-- Users Management -->
    <div v-if="activeTab === 'users'" class="tab-content">
      <div class="section-header">
        <h3>👥 Gestion des Utilisateurs</h3>
        <button class="btn" @click="showUserForm = !showUserForm">
          {{ showUserForm ? 'Annuler' : 'Nouvel Utilisateur' }}
        </button>
      </div>
      
      <!-- User Form -->
      <div v-if="showUserForm" class="card form-section">
        <h4>{{ editingUser ? 'Modifier' : 'Créer' }} un utilisateur</h4>
        <form @submit.prevent="submitUser">
          <div class="form-row">
            <div class="form-group">
              <label>Prénom</label>
              <input v-model="userForm.firstname" required>
            </div>
            <div class="form-group">
              <label>Nom</label>
              <input v-model="userForm.lastname" required>
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" v-model="userForm.email" required>
          </div>
          <div class="form-group">
            <label>Rôle</label>
            <select v-model="userForm.role">
              <option value="USER">Utilisateur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn" :disabled="formLoading">
              {{ formLoading ? 'Traitement...' : (editingUser ? 'Modifier' : 'Créer') }}
            </button>
            <button type="button" class="btn btn-secondary" @click="cancelUserForm">
              Annuler
            </button>
          </div>
        </form>
      </div>
      
      <!-- Users List -->
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Date d'inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.firstname }} {{ user.lastname }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span :class="user.role === 'ADMIN' ? 'status-no-show' : 'status-confirmed'">
                  {{ user.role === 'ADMIN' ? 'Admin' : 'Utilisateur' }}
                </span>
              </td>
              <td>{{ formatDate(user.dateJoined) }}</td>
              <td>
                <button class="btn btn-secondary" @click="editUser(user)">
                  Modifier
                </button>
                <button class="btn btn-danger" @click="deleteUser(user.id)">
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Classes Management -->
    <div v-if="activeTab === 'classes'" class="tab-content">
      <div class="section-header">
        <h3>🏋️ Gestion des Cours</h3>
        <div>
          <button class="btn btn-danger" @click="purgeOldClasses" :disabled="formLoading">
            {{ formLoading ? 'Purge...' : 'Purger anciens cours' }}
          </button>
          <button class="btn" @click="showClassForm = !showClassForm">
            {{ showClassForm ? 'Annuler' : 'Nouveau Cours' }}
          </button>
        </div>
      </div>
      
      <!-- Class Form -->
      <div v-if="showClassForm" class="card form-section">
        <h4>{{ editingClass ? 'Modifier' : 'Créer' }} un cours</h4>
        <form @submit.prevent="submitClass">
          <div class="form-row">
            <div class="form-group">
              <label>Titre</label>
              <input v-model="classForm.title" required>
            </div>
            <div class="form-group">
              <label>Coach</label>
              <input v-model="classForm.coach" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Date et heure</label>
              <input type="datetime-local" v-model="classForm.datetime" required>
            </div>
            <div class="form-group">
              <label>Durée (minutes)</label>
              <input type="number" v-model="classForm.duration" min="1" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Capacité</label>
              <input type="number" v-model="classForm.capacity" min="1" required>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="classForm.isCancelled">
                Cours annulé
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn" :disabled="formLoading">
              {{ formLoading ? 'Traitement...' : (editingClass ? 'Modifier' : 'Créer') }}
            </button>
            <button type="button" class="btn btn-secondary" @click="cancelClassForm">
              Annuler
            </button>
          </div>
        </form>
      </div>
      
      <!-- Classes List -->
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Coach</th>
              <th>Date</th>
              <th>Durée</th>
              <th>Réservations</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="classItem in classes" :key="classItem.id">
              <td>{{ classItem.title }}</td>
              <td>{{ classItem.coach }}</td>
              <td>{{ formatDateTime(classItem.datetime) }}</td>
              <td>{{ classItem.duration }} min</td>
              <td>{{ classItem.bookings.length }}/{{ classItem.capacity }}</td>
              <td>
                <span :class="classItem.isCancelled ? 'status-cancelled' : 'status-confirmed'">
                  {{ classItem.isCancelled ? 'Annulé' : 'Actif' }}
                </span>
              </td>
              <td>
                <button class="btn btn-secondary" @click="editClass(classItem)">
                  Modifier
                </button>
                <button class="btn btn-danger" @click="deleteClass(classItem.id)">
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Bookings Management -->
    <div v-if="activeTab === 'bookings'" class="tab-content">
      <div class="section-header">
        <h3>📅 Gestion des Réservations</h3>
        <button class="btn" @click="updateNoShows" :disabled="formLoading">
          {{ formLoading ? 'Mise à jour...' : 'Mettre à jour No-Shows' }}
        </button>
      </div>
      
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Cours</th>
              <th>Date du cours</th>
              <th>Statut</th>
              <th>Réservé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="booking in bookings" :key="booking.id">
              <td>{{ booking.user.firstname }} {{ booking.user.lastname }}</td>
              <td>{{ booking.class.title }}</td>
              <td>{{ formatDateTime(booking.class.datetime) }}</td>
              <td>
                <span :class="`status-${booking.status.toLowerCase().replace('_', '-')}`">
                  {{ formatStatus(booking.status) }}
                </span>
              </td>
              <td>{{ formatDateTime(booking.createdAt) }}</td>
              <td>
                <select 
                  :value="booking.status" 
                  @change="updateBookingStatus(booking.id, $event.target.value)"
                  :disabled="formLoading"
                >
                  <option value="CONFIRMED">Confirmé</option>
                  <option value="CANCELLED">Annulé</option>
                  <option value="NO_SHOW">No-Show</option>
                </select>
                <button class="btn btn-danger" @click="deleteBooking(booking.id)">
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Error/Success Messages -->
    <div v-if="message" :class="`alert alert-${message.type}`">
      {{ message.text }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { 
  dashboardService, 
  userService, 
  classService, 
  bookingService, 
  subscriptionService 
} from '../services/gymService'

export default {
  name: 'AdminView',
  setup() {
    const activeTab = ref('users')
    const adminDashboard = ref(null)
    const message = ref(null)
    const formLoading = ref(false)
    
    // Users
    const users = ref([])
    const showUserForm = ref(false)
    const editingUser = ref(null)
    const userForm = ref({
      firstname: '',
      lastname: '',
      email: '',
      role: 'USER'
    })
    
    // Classes
    const classes = ref([])
    const showClassForm = ref(false)
    const editingClass = ref(null)
    const classForm = ref({
      title: '',
      coach: '',
      datetime: '',
      duration: 60,
      capacity: 10,
      isCancelled: false
    })
    
    // Bookings
    const bookings = ref([])
    
    const tabs = [
      { id: 'users', label: 'Utilisateurs' },
      { id: 'classes', label: 'Cours' },
      { id: 'bookings', label: 'Réservations' }
    ]
    
    const showMessage = (text, type = 'success') => {
      message.value = { text, type }
      setTimeout(() => {
        message.value = null
      }, 5000)
    }
    
    // Load data functions
    const loadAdminDashboard = async () => {
      try {
        adminDashboard.value = await dashboardService.getAdminDashboard()
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors du chargement du dashboard', 'error')
      }
    }
    
    const loadUsers = async () => {
      try {
        users.value = await userService.getAllUsers()
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors du chargement des utilisateurs', 'error')
      }
    }
    
    const loadClasses = async () => {
      try {
        classes.value = await classService.getAllClasses(true) // Include old classes
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors du chargement des cours', 'error')
      }
    }
    
    const loadBookings = async () => {
      try {
        bookings.value = await bookingService.getAllBookings()
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors du chargement des réservations', 'error')
      }
    }
    
    // User management
    const editUser = (user) => {
      editingUser.value = user
      userForm.value = {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role
      }
      showUserForm.value = true
    }
    
    const submitUser = async () => {
      try {
        formLoading.value = true
        
        if (editingUser.value) {
          await userService.updateUser(editingUser.value.id, userForm.value)
          showMessage('Utilisateur modifié avec succès')
        } else {
          await userService.createUser(userForm.value)
          showMessage('Utilisateur créé avec succès')
        }
        
        cancelUserForm()
        await loadUsers()
        await loadAdminDashboard()
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors de la sauvegarde', 'error')
      } finally {
        formLoading.value = false
      }
    }
    
    const cancelUserForm = () => {
      showUserForm.value = false
      editingUser.value = null
      userForm.value = {
        firstname: '',
        lastname: '',
        email: '',
        role: 'USER'
      }
    }
    
    const deleteUser = async (userId) => {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return
      
      try {
        formLoading.value = true
        await userService.deleteUser(userId)
        showMessage('Utilisateur supprimé avec succès')
        await loadUsers()
        await loadAdminDashboard()
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors de la suppression', 'error')
      } finally {
        formLoading.value = false
      }
    }
    
    // Class management
    const editClass = (classItem) => {
      editingClass.value = classItem
      // Format datetime for input
      const date = new Date(classItem.datetime)
      const formattedDate = date.toISOString().slice(0, 16)
      
      classForm.value = {
        title: classItem.title,
        coach: classItem.coach,
        datetime: formattedDate,
        duration: classItem.duration,
        capacity: classItem.capacity,
        isCancelled: classItem.isCancelled
      }
      showClassForm.value = true
    }
    
    const submitClass = async () => {
      try {
        formLoading.value = true
        
        const formData = {
          ...classForm.value,
          datetime: new Date(classForm.value.datetime).toISOString(),
          duration: parseInt(classForm.value.duration),
          capacity: parseInt(classForm.value.capacity)
        }
        
        if (editingClass.value) {
          await classService.updateClass(editingClass.value.id, formData)
          showMessage('Cours modifié avec succès')
        } else {
          await classService.createClass(formData)
          showMessage('Cours créé avec succès')
        }
        
        cancelClassForm()
        await loadClasses()
        await loadAdminDashboard()
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors de la sauvegarde', 'error')
      } finally {
        formLoading.value = false
      }
    }
    
    const cancelClassForm = () => {
      showClassForm.value = false
      editingClass.value = null
      classForm.value = {
        title: '',
        coach: '',
        datetime: '',
        duration: 60,
        capacity: 10,
        isCancelled: false
      }
    }
    
    const deleteClass = async (classId) => {
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return
      
      try {
        formLoading.value = true
        await classService.deleteClass(classId)
        showMessage('Cours supprimé avec succès')
        await loadClasses()
        await loadAdminDashboard()
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors de la suppression', 'error')
      } finally {
        formLoading.value = false
      }
    }
    
    const purgeOldClasses = async () => {
      if (!confirm('Êtes-vous sûr de vouloir purger les anciens cours (> 30 jours) ?')) return
      
      try {
        formLoading.value = true
        const result = await classService.purgeOldClasses()
        showMessage(`${result.deletedCount} cours supprimés`)
        await loadClasses()
        await loadAdminDashboard()
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors de la purge', 'error')
      } finally {
        formLoading.value = false
      }
    }
    
    // Booking management
    const updateBookingStatus = async (bookingId, status) => {
      try {
        formLoading.value = true
        await bookingService.updateBookingStatus(bookingId, status)
        showMessage('Statut mis à jour')
        await loadBookings()
        await loadAdminDashboard()
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors de la mise à jour', 'error')
      } finally {
        formLoading.value = false
      }
    }
    
    const deleteBooking = async (bookingId) => {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) return
      
      try {
        formLoading.value = true
        await bookingService.deleteBooking(bookingId)
        showMessage('Réservation supprimée')
        await loadBookings()
        await loadAdminDashboard()
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors de la suppression', 'error')
      } finally {
        formLoading.value = false
      }
    }
    
    const updateNoShows = async () => {
      try {
        formLoading.value = true
        const result = await bookingService.updateNoShowBookings()
        showMessage(`${result.updatedCount || 0} réservations mises à jour`)
        await loadBookings()
        await loadAdminDashboard()
      } catch (err) {
        showMessage(err.response?.data?.error || 'Erreur lors de la mise à jour', 'error')
      } finally {
        formLoading.value = false
      }
    }
    
    // Utility functions
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
    
    onMounted(async () => {
      await Promise.all([
        loadAdminDashboard(),
        loadUsers(),
        loadClasses(),
        loadBookings()
      ])
    })
    
    return {
      activeTab,
      tabs,
      adminDashboard,
      message,
      formLoading,
      
      // Users
      users,
      showUserForm,
      editingUser,
      userForm,
      editUser,
      submitUser,
      cancelUserForm,
      deleteUser,
      
      // Classes
      classes,
      showClassForm,
      editingClass,
      classForm,
      editClass,
      submitClass,
      cancelClassForm,
      deleteClass,
      purgeOldClasses,
      
      // Bookings
      bookings,
      updateBookingStatus,
      deleteBooking,
      updateNoShows,
      
      // Utils
      formatDate,
      formatDateTime,
      formatStatus
    }
  }
}
</script>

<style scoped>
.admin-panel h1 {
  margin-bottom: 30px;
  color: #dc3545;
}

.admin-stats {
  margin-bottom: 30px;
}

.admin-stats h2 {
  margin-bottom: 15px;
  color: #333;
}

.admin-tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 30px;
  border-bottom: 2px solid #e9ecef;
}

.tab-button {
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tab-button.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab-button:hover {
  color: #007bff;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #333;
}

.section-header div {
  display: flex;
  gap: 10px;
}

.form-section {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.table td select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
}

@media (max-width: 768px) {
  .admin-tabs {
    flex-wrap: wrap;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .table {
    font-size: 0.85em;
  }
}
</style>
