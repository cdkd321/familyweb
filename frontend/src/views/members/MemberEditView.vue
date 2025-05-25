<template>
  <div class="member-edit-view">
    <h1>{{ isEditMode ? 'Edit Member' : 'Create New Member' }}</h1>
    
    <div v-if="pageLoading" class="loading">Loading member data...</div>
    <div v-if="pageError" class="error-message">{{ pageError }}</div>

    <MemberForm 
      v-if="!pageLoading && !pageError"
      :member="memberToEdit" 
      :is-edit-mode="isEditMode"
      :is-submitting="formSubmitting"
      :form-error="formError"
      @submit="handleSubmit" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMemberStore } from '@/stores/memberStore';
import MemberForm from '@/components/members/MemberForm.vue'; // Corrected path

const route = useRoute();
const router = useRouter();
const memberStore = useMemberStore();

const memberId = computed(() => route.params.id);
const isEditMode = computed(() => !!memberId.value);

const memberToEdit = ref(null);
const pageLoading = ref(false);
const pageError = ref(null);
const formSubmitting = ref(false);
const formError = ref(null);


onMounted(async () => {
  pageError.value = null;
  if (isEditMode.value) {
    pageLoading.value = true;
    await memberStore.fetchMemberById(memberId.value);
    if (memberStore.error) {
      pageError.value = `Failed to load member: ${memberStore.error}`;
      memberToEdit.value = null;
    } else {
      memberToEdit.value = memberStore.selectedMember;
       if (!memberToEdit.value) {
         pageError.value = `Member with ID ${memberId.value} not found.`;
       }
    }
    pageLoading.value = false;
  } else {
    memberToEdit.value = null; // Ensure form is empty for create mode
  }
});

async function handleSubmit(formData) {
  formSubmitting.value = true;
  formError.value = null;
  let success = false;

  if (isEditMode.value) {
    success = await memberStore.updateMember(memberId.value, formData);
  } else {
    success = await memberStore.createMember(formData);
  }

  if (success) {
    // Navigate to the member detail page (if editing/creating successfully) or member list
    // If creating, the new member's ID might be in store.selectedMember or returned by createMember action.
    // For simplicity, navigate to list for create, detail for edit.
    if (isEditMode.value) {
      router.push({ name: 'MemberDetail', params: { id: memberId.value } });
    } else {
        // After creation, the backend returns the new member.
        // If the store updates `selectedMember` or you can get the new ID, redirect to its detail.
        // Otherwise, redirect to the list. For now, assume list.
        // A more robust way would be for createMember to return the new member's ID.
        await memberStore.fetchAllMembers(); // Refresh list
        router.push({ name: 'MemberList' });
    }
  } else {
    formError.value = memberStore.error || 'An unknown error occurred.';
  }
  formSubmitting.value = false;
}
</script>

<style scoped>
.member-edit-view {
  max-width: 700px;
  margin: 20px auto;
  padding: 20px;
}

.loading, .error-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}
.loading { color: #007bff; }
.error-message { color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; }
</style>
