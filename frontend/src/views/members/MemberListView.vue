<template>
  <div class="member-list-view">
    <h1>Family Members</h1>

    <div v-if="authStore.isAuthenticated && canManageMembers" class="actions-bar">
      <router-link to="/members/new" class="btn btn-primary">Add New Member</router-link>
    </div>

    <div v-if="memberStore.loading" class="loading">Loading members...</div>
    <div v-if="memberStore.error" class="error-message">
      Error fetching members: {{ memberStore.error }}
    </div>

    <table v-if="!memberStore.loading && memberStore.members.length > 0" class="members-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Birth Date</th>
          <th>Death Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in memberStore.members" :key="member.id">
          <td>{{ member.name }}</td>
          <td>{{ member.birth_date || 'N/A' }}</td>
          <td>{{ member.death_date || 'N/A' }}</td>
          <td>
            <router-link :to="`/members/${member.id}`" class="btn btn-sm btn-info">View</router-link>
            <router-link 
              v-if="authStore.isAuthenticated && canManageMembers"
              :to="`/members/edit/${member.id}`" 
              class="btn btn-sm btn-warning"
            >
              Edit
            </router-link>
            <button 
              v-if="authStore.isAuthenticated && canManageMembers"
              @click="confirmDelete(member.id)" 
              class="btn btn-sm btn-danger"
              :disabled="memberStore.loading"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!memberStore.loading && memberStore.members.length === 0 && !memberStore.error">
      No members found.
    </p>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useMemberStore } from '@/stores/memberStore';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';

const memberStore = useMemberStore();
const authStore = useAuthStore();
const router = useRouter();

const canManageMembers = computed(() => {
  return authStore.userRole === 'admin' || authStore.userRole === 'editor';
});

onMounted(() => {
  memberStore.fetchAllMembers();
});

async function confirmDelete(memberId) {
  if (window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
    const success = await memberStore.deleteMember(memberId);
    if (success) {
      // Optionally, show a success notification
      // The store already filters the list, so UI should update automatically
      alert('Member deleted successfully.');
    } else {
      // Error is handled and displayed by the store, or you can show a specific alert here
      alert(`Failed to delete member: ${memberStore.error || 'Unknown error'}`);
    }
  }
}
</script>

<style scoped>
.member-list-view {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
}

.actions-bar {
  margin-bottom: 20px;
  text-align: right;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
  margin-right: 5px;
  font-size: 0.9em;
}
.btn-primary { background-color: #007bff; color: white; }
.btn-info { background-color: #17a2b8; color: white; }
.btn-warning { background-color: #ffc107; color: #212529; }
.btn-danger { background-color: #dc3545; color: white; }
.btn-sm { padding: 5px 8px; font-size: 0.8em; }
.btn:disabled { background-color: #ccc; }


.loading, .error-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
}
.loading { color: #007bff; }
.error-message { color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; }

.members-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.members-table th, .members-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

.members-table th {
  background-color: #f8f9fa;
}

.members-table td button, .members-table td .btn {
  margin-right: 5px;
}
</style>
