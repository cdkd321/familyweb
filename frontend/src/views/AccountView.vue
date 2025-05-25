<template>
  <div class="account-view">
    <h1>Account Management</h1>

    <section class="change-password-section">
      <h2>Change Password</h2>
      <form @submit.prevent="handleChangePassword">
        <div class="form-group">
          <label for="current_password">Current Password:</label>
          <input type="password" id="current_password" v.model="currentPassword" required />
        </div>
        <div class="form-group">
          <label for="new_password">New Password:</label>
          <input type="password" id="new_password" v.model="newPassword" required />
        </div>
        <div class="form-group">
          <label for="confirm_new_password">Confirm New Password:</label>
          <input type="password" id="confirm_new_password" v.model="confirmNewPassword" required />
        </div>

        <div v-if="clientErrorMessage" class="error-message client-error">{{ clientErrorMessage }}</div>
        <div v-if="apiErrorMessage" class="error-message api-error">{{ apiErrorMessage }}</div>
        <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Changing Password...' : 'Change Password' }}
        </button>
      </form>
    </section>
    
    <!-- Other account management sections can be added here later -->
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();

const currentPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');

const loading = ref(false);
const clientErrorMessage = ref(''); // For client-side validation errors
const apiErrorMessage = ref('');    // For errors from the API call
const successMessage = ref('');

async function handleChangePassword() {
  // Clear previous messages
  clientErrorMessage.value = '';
  apiErrorMessage.value = '';
  successMessage.value = '';

  // Client-side validation
  if (!currentPassword.value || !newPassword.value || !confirmNewPassword.value) {
    clientErrorMessage.value = 'All password fields are required.';
    return;
  }
  if (newPassword.value !== confirmNewPassword.value) {
    clientErrorMessage.value = 'New password and confirmation password do not match.';
    return;
  }
  if (newPassword.value.length < 1) { // Basic length check, align with backend if stricter
    clientErrorMessage.value = 'New password is too short.';
    return;
  }
  // Add more client-side password policies if desired (e.g. complexity)

  loading.value = true;
  try {
    const responseMessage = await authStore.changePassword({
      current_password: currentPassword.value,
      new_password: newPassword.value,
    });
    successMessage.value = responseMessage || 'Password changed successfully!';
    // Clear form fields on success
    currentPassword.value = '';
    newPassword.value = '';
    confirmNewPassword.value = '';
  } catch (error) {
    apiErrorMessage.value = error.message || 'Failed to change password. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.account-view {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
}

.change-password-section {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type="password"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  background-color: #aaa;
}

.error-message, .success-message {
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  margin-bottom: 10px;
  text-align: center;
}

.client-error {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}
.api-error {
  color: #721c24; /* Same as client, or differentiate if needed */
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}

.success-message {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}
</style>
