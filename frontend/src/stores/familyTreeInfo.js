import { defineStore } from 'pinia';
import axios from 'axios';

export const useFamilyTreeInfoStore = defineStore('familyTreeInfo', {
  state: () => ({
    info: {
      name: '',
      description: '',
      historical_documents_links: ''
    },
    loading: false,
    error: null
  }),
  actions: {
    async fetchFamilyTreeInfo() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get('/api/family-tree-info');
        if (response.data && response.status === 200) {
          this.info = response.data;
        } else if (response.status === 404) {
          // Handle case where info is not yet created, keep default or clear
          this.info = { name: 'My Family Tree', description: 'No details provided yet.', historical_documents_links: '' };
        }
      } catch (error) {
        console.error('Error fetching family tree info:', error);
        this.error = error.response?.data?.message || 'Failed to fetch family tree information.';
        // Keep existing or default info on error for display purposes
      } finally {
        this.loading = false;
      }
    },
    async updateFamilyTreeInfo(newInfo) {
      this.loading = true;
      this.error = null;
      try {
        // Note: The backend uses POST for create and PUT for update,
        // but for simplicity here, we'll try POST, assuming the backend handles it.
        // Ideally, check if info.id exists to decide between POST/PUT if backend is strict.
        const response = await axios.post('/api/family-tree-info', newInfo);
        this.info = response.data;
        return true; // Indicate success
      } catch (error) {
        console.error('Error updating family tree info:', error);
        this.error = error.response?.data?.message || 'Failed to update family tree information. Ensure you are logged in with appropriate permissions.';
        // If unauthorized, backend should return 401 or 403, error message will reflect that.
        return false; // Indicate failure
      } finally {
        this.loading = false;
      }
    }
  }
});
