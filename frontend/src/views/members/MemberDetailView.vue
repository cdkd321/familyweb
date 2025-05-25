<template>
  <div class="member-detail-view" v-if="memberStore.selectedMember">
    <h1>{{ memberStore.selectedMember.name }}</h1>

    <div v-if="authStore.isAuthenticated && canManageMembers" class="actions-bar">
      <router-link :to="`/members/edit/${memberStore.selectedMember.id}`" class="btn btn-warning">
        Edit Member
      </router-link>
    </div>
    
    <div v-if="memberStore.loading" class="loading">Loading details...</div>
    <div v-if="memberStore.error" class="error-message">
      Error: {{ memberStore.error }}
    </div>

    <div class="details-grid" v-if="!memberStore.loading && memberStore.selectedMember">
      <div class="detail-item">
        <strong>Full Name:</strong>
        <p>{{ memberStore.selectedMember.name }}</p>
      </div>
      <div class="detail-item">
        <strong>Birth Date:</strong>
        <p>{{ memberStore.selectedMember.birth_date || 'N/A' }}</p>
      </div>
      <div class="detail-item">
        <strong>Death Date:</strong>
        <p>{{ memberStore.selectedMember.death_date || 'N/A' }}</p>
      </div>
      <div class="detail-item full-width">
        <strong>Biography:</strong>
        <p class="bio">{{ memberStore.selectedMember.bio || 'No biography provided.' }}</p>
      </div>
      <div class="detail-item full-width" v-if="memberStore.selectedMember.photo_url">
        <strong>Photo:</strong>
        <img :src="memberStore.selectedMember.photo_url" alt="Photo of {{ memberStore.selectedMember.name }}" class="member-photo"/>
      </div>

      <div class="detail-item relationships">
        <strong>Parents:</strong>
        <ul>
          <li v-if="memberStore.selectedMember.parent1_id">
            Parent 1: {{ getMemberNameById(memberStore.selectedMember.parent1_id) || `ID: ${memberStore.selectedMember.parent1_id}` }}
             <router-link v-if="memberStore.selectedMember.parent1_id" :to="`/members/${memberStore.selectedMember.parent1_id}`">(View)</router-link>
          </li>
           <li v-if="!memberStore.selectedMember.parent1_id">N/A</li>
          <li v-if="memberStore.selectedMember.parent2_id">
            Parent 2: {{ getMemberNameById(memberStore.selectedMember.parent2_id) || `ID: ${memberStore.selectedMember.parent2_id}` }}
             <router-link v-if="memberStore.selectedMember.parent2_id" :to="`/members/${memberStore.selectedMember.parent2_id}`">(View)</router-link>
          </li>
           <li v-if="!memberStore.selectedMember.parent2_id && memberStore.selectedMember.parent1_id">N/A</li>
        </ul>
      </div>
      <div class="detail-item relationships">
        <strong>Spouse:</strong>
        <p v-if="memberStore.selectedMember.spouse_id">
          {{ getMemberNameById(memberStore.selectedMember.spouse_id) || `ID: ${memberStore.selectedMember.spouse_id}` }}
           <router-link :to="`/members/${memberStore.selectedMember.spouse_id}`">(View)</router-link>
        </p>
        <p v-else>N/A</p>
      </div>
      <div class="detail-item relationships full-width">
        <strong>Children:</strong>
        <ul v-if="memberStore.selectedMember.children && memberStore.selectedMember.children.length > 0">
          <li v-for="child in memberStore.selectedMember.children" :key="child.id">
            {{ child.name }} (ID: {{ child.id }})
            <router-link :to="`/members/${child.id}`">(View)</router-link>
          </li>
        </ul>
        <p v-else>No children listed for this member.</p>
      </div>
    </div>
    <div v-else-if="!memberStore.loading && !memberStore.error">
      <p>Member not found or no details available.</p>
    </div>
     <router-link to="/members" class="btn btn-secondary">Back to Member List</router-link>
  </div>
</template>

<script setup>
import { onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useMemberStore } from '@/stores/memberStore';
import { useAuthStore } from '@/stores/authStore';

const route = useRoute();
const memberStore = useMemberStore();
const authStore = useAuthStore();

const memberId = computed(() => route.params.id);

const canManageMembers = computed(() => {
  return authStore.userRole === 'admin' || authStore.userRole === 'editor';
});

// Function to get member name by ID for relationships
// This assumes all members are fetched into memberStore.members for lookup.
// For very large datasets, a dedicated API endpoint or more efficient lookup might be needed.
function getMemberNameById(id) {
  if (!id || !memberStore.members || memberStore.members.length === 0) return null;
  const member = memberStore.members.find(m => m.id === id);
  return member ? member.name : null;
}

onMounted(async () => {
  if (memberStore.members.length === 0) {
    await memberStore.fetchAllMembers(); // Ensure members list is available for lookups
  }
  await memberStore.fetchMemberById(memberId.value);
});

// Watch for route changes if navigating between member detail pages
watch(memberId, async (newId) => {
  if (newId) {
    await memberStore.fetchMemberById(newId);
  }
});
</script>

<style scoped>
.member-detail-view {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
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
.btn-warning { background-color: #ffc107; color: #212529; }
.btn-secondary { background-color: #6c757d; color: white; margin-top: 20px;}


.loading, .error-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
}
.loading { color: #007bff; }
.error-message { color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; }

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Two columns */
  gap: 20px;
  margin-top: 20px;
}

.detail-item {
  background-color: #fff;
  padding: 15px;
  border-radius: 5px;
  border: 1px solid #eee;
}

.detail-item.full-width {
  grid-column: 1 / -1; /* Span both columns */
}

.detail-item strong {
  display: block;
  color: #555;
  margin-bottom: 5px;
}

.detail-item p, .detail-item ul {
  margin: 0;
}
.detail-item ul {
  padding-left: 20px;
}
.detail-item ul li {
  margin-bottom: 5px;
}


.bio {
  white-space: pre-wrap; /* Preserve line breaks in bio */
  word-wrap: break-word;
}

.member-photo {
  max-width: 100%;
  height: auto;
  max-height: 300px;
  border-radius: 4px;
  margin-top: 10px;
}

.relationships ul {
  list-style-type: none;
  padding-left: 0;
}
</style>
