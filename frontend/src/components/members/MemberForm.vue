<template>
  <form @submit.prevent="handleSubmit" class="member-form">
    <div class="form-group">
      <label for="name">Name:</label>
      <input type="text" id="name" v.model="formData.name" required />
    </div>

    <div class="form-group">
      <label for="birth_date">Birth Date:</label>
      <input type="date" id="birth_date" v-model="formData.birth_date" />
    </div>

    <div class="form-group">
      <label for="death_date">Death Date:</label>
      <input type="date" id="death_date" v-model="formData.death_date" />
    </div>

    <div class="form-group">
      <label for="bio">Biography:</label>
      <textarea id="bio" v-model="formData.bio"></textarea>
    </div>

    <div class="form-group">
      <label for="photo_url">Photo URL:</label>
      <input type="url" id="photo_url" v.model="formData.photo_url" placeholder="https://example.com/photo.jpg" />
    </div>

    <div class="form-group">
      <label for="parent1_id">Parent 1:</label>
      <select id="parent1_id" v-model="formData.parent1_id">
        <option :value="null">-- Select Parent 1 --</option>
        <option v-for="p in availableParents" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="parent2_id">Parent 2:</label>
      <select id="parent2_id" v-model="formData.parent2_id">
        <option :value="null">-- Select Parent 2 --</option>
        <option v-for="p in availableParents" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>
      <p v-if="formData.parent1_id && formData.parent1_id === formData.parent2_id" class="error-text">
        Parent 1 and Parent 2 cannot be the same person.
      </p>
    </div>
    
    <div class="form-group">
      <label for="spouse_id">Spouse:</label>
      <select id="spouse_id" v-model="formData.spouse_id">
        <option :value="null">-- Select Spouse --</option>
        <option v-for="s in availableSpouses" :key="s.id" :value="s.id">
          {{ s.name }}
        </option>
      </select>
    </div>

    <div class="form-actions">
      <button type="submit" :disabled="isSubmitting || (formData.parent1_id && formData.parent1_id === formData.parent2_id)">
        {{ isEditMode ? 'Update Member' : 'Create Member' }}
      </button>
      <router-link :to="isEditMode ? `/members/${props.member?.id}` : '/members'" class="btn btn-secondary">
        Cancel
      </router-link>
    </div>
     <p v-if="formError" class="error-message">{{ formError }}</p>
  </form>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useMemberStore } from '@/stores/memberStore';

const props = defineProps({
  member: {
    type: Object,
    default: null
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  formError: {
    type: String,
    default: null,
  }
});

const emit = defineEmits(['submit']);

const memberStore = useMemberStore();

const formData = reactive({
  name: '',
  birth_date: '',
  death_date: '',
  bio: '',
  photo_url: '',
  parent1_id: null,
  parent2_id: null,
  spouse_id: null
});

// Populate form if in edit mode and member data is provided
watch(() => props.member, (newMember) => {
  if (newMember && props.isEditMode) {
    formData.name = newMember.name || '';
    formData.birth_date = newMember.birth_date || '';
    formData.death_date = newMember.death_date || '';
    formData.bio = newMember.bio || '';
    formData.photo_url = newMember.photo_url || '';
    formData.parent1_id = newMember.parent1_id || null;
    formData.parent2_id = newMember.parent2_id || null;
    formData.spouse_id = newMember.spouse_id || null;
  }
}, { immediate: true, deep: true });


onMounted(async () => {
  if (memberStore.members.length === 0) {
    await memberStore.fetchAllMembers(); // Ensure member list is available for dropdowns
  }
});

const availableParents = computed(() => {
  if (props.isEditMode && props.member) {
    // Exclude current member from their own parent list
    return memberStore.members.filter(m => m.id !== props.member.id);
  }
  return memberStore.members;
});

const availableSpouses = computed(() => {
   if (props.isEditMode && props.member) {
    // Exclude current member from their own spouse list
    return memberStore.members.filter(m => m.id !== props.member.id);
  }
  return memberStore.members;
});

function handleSubmit() {
  if (formData.parent1_id && formData.parent1_id === formData.parent2_id) {
    alert("Parent 1 and Parent 2 cannot be the same person.");
    return;
  }
  // Create a clean data object, converting empty strings for dates/IDs to null
  const dataToSubmit = {
    name: formData.name,
    birth_date: formData.birth_date || null,
    death_date: formData.death_date || null,
    bio: formData.bio || null,
    photo_url: formData.photo_url || null,
    parent1_id: formData.parent1_id ? parseInt(formData.parent1_id) : null,
    parent2_id: formData.parent2_id ? parseInt(formData.parent2_id) : null,
    spouse_id: formData.spouse_id ? parseInt(formData.spouse_id) : null,
  };
  emit('submit', dataToSubmit);
}

</script>

<style scoped>
.member-form {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="url"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 0.95em;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  margin-top: 25px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-actions button, .form-actions .btn {
  padding: 10px 18px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

.form-actions button[type="submit"] {
  background-color: #007bff;
  color: white;
}
.form-actions button[type="submit"]:disabled {
  background-color: #a0cfff;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 5px;
  margin-top: 15px;
  text-align: center;
}
.error-text {
  font-size: 0.85em;
  color: #dc3545;
  margin-top: 4px;
}
</style>
