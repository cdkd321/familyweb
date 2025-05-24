<template>
  <div class="family-tree-info-view">
    <h1>Family Tree Information</h1>

    <div v-if="store.loading" class="loading">Loading...</div>
    <div v-if="store.error" class="error-message">
      Error: {{ store.error }}
    </div>

    <div v-if="!store.loading && !store.error" class="info-display">
      <h2>{{ store.info.name || 'Family Tree Name Not Set' }}</h2>
      <p><strong>Description:</strong> {{ store.info.description || 'No description provided.' }}</p>
      <p><strong>Historical Documents/Links:</strong></p>
      <pre>{{ store.info.historical_documents_links || 'No links provided.' }}</pre>
    </div>

    <hr />

    <h2>Update Information</h2>
    <form @submit.prevent="handleSubmit" class="info-form">
      <div>
        <label for="name">Name:</label>
        <input type="text" id="name" v.model="formState.name" />
      </div>
      <div>
        <label for="description">Description:</label>
        <textarea id="description" v-model="formState.description"></textarea>
      </div>
      <div>
        <label for="historical_documents_links">Historical Documents/Links (one per line):</label>
        <textarea id="historical_documents_links" v.model="formState.historical_documents_links"></textarea>
      </div>
      <button type="submit" :disabled="store.loading">
        {{ store.loading ? 'Updating...' : 'Update Information' }}
      </button>
      <p v-if="updateError" class="error-message">{{ updateError }}</p>
      <p v-if="updateSuccess" class="success-message">Information updated successfully!</p>
    </form>
    <p class="auth-note">
      <em>Note: Updating information may require you to be logged in with appropriate permissions. If you encounter issues, please ensure you are authenticated.</em>
    </p>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { useFamilyTreeInfoStore } from '@/stores/familyTreeInfo';

const store = useFamilyTreeInfoStore();

// Form state, initialized empty or from store if needed for editing existing
const formState = reactive({
  name: '',
  description: '',
  historical_documents_links: ''
});

const updateError = ref(null);
const updateSuccess = ref(false);

// When the component is mounted, fetch the initial data
onMounted(() => {
  store.fetchFamilyTreeInfo().then(() => {
    // Initialize form with fetched data
    formState.name = store.info.name || '';
    formState.description = store.info.description || '';
    formState.historical_documents_links = store.info.historical_documents_links || '';
  });
});

// Watch for changes in store.info (e.g., after fetch) and update form
watch(() => store.info, (newInfo) => {
  formState.name = newInfo.name || '';
  formState.description = newInfo.description || '';
  formState.historical_documents_links = newInfo.historical_documents_links || '';
}, { deep: true });


async function handleSubmit() {
  updateError.value = null;
  updateSuccess.value = false;
  const success = await store.updateFamilyTreeInfo({
    name: formState.name,
    description: formState.description,
    historical_documents_links: formState.historical_documents_links
  });
  if (success) {
    updateSuccess.value = true;
    // Optionally re-fetch or rely on store's optimistic update
    // await store.fetchFamilyTreeInfo(); 
  } else {
    // Error is already set in the store, but we can have a local one too
    updateError.value = store.error || 'Failed to update. Please check console for details.';
  }
}
</script>

<style scoped>
.family-tree-info-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  color: #007bff;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
}

.success-message {
  color: #28a745;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
}

.info-display {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 5px;
}

.info-display h2 {
  margin-top: 0;
}

.info-display pre {
  white-space: pre-wrap; /* Allows wrapping of long lines */
  word-wrap: break-word;
  background-color: #eee;
  padding: 10px;
  border-radius: 4px;
}

.info-form div {
  margin-bottom: 15px;
}

.info-form label {
  display: block;
  margin-bottom: 5px;
}

.info-form input[type="text"],
.info-form textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.info-form textarea {
  min-height: 100px;
}

.info-form button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.info-form button:disabled {
  background-color: #ccc;
}

.auth-note {
    margin-top: 20px;
    font-size: 0.9em;
    color: #666;
}
</style>
