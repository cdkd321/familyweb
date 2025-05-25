import { defineStore } from 'pinia';
import axios from 'axios'; // Axios is already configured with auth headers by authStore
import { useAuthStore } from './authStore'; // To access token and role

export const useMemberStore = defineStore('member', {
  state: () => ({
    members: [],
    selectedMember: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAllMembers() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get('/api/members');
        this.members = response.data;
      } catch (error) {
        console.error('Error fetching all members:', error);
        this.error = error.response?.data?.message || 'Failed to fetch members.';
      } finally {
        this.loading = false;
      }
    },
    async fetchMemberById(id) {
      this.loading = true;
      this.error = null;
      this.selectedMember = null; // Reset before fetching
      try {
        const response = await axios.get(`/api/members/${id}`);
        this.selectedMember = response.data;
      } catch (error) {
        console.error(`Error fetching member ${id}:`, error);
        this.error = error.response?.data?.message || `Failed to fetch member ${id}.`;
      } finally {
        this.loading = false;
      }
    },
    async createMember(memberData) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated || !['admin', 'editor'].includes(authStore.userRole)) {
        this.error = 'You are not authorized to create members.';
        return false;
      }
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post('/api/members', memberData);
        // Add to list or refetch
        this.members.push(response.data); // Simple optimistic update
        // await this.fetchAllMembers(); // More robust
        return true;
      } catch (error) {
        console.error('Error creating member:', error);
        this.error = error.response?.data?.message || 'Failed to create member.';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async updateMember(id, memberData) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated || !['admin', 'editor'].includes(authStore.userRole)) {
        this.error = 'You are not authorized to update members.';
        return false;
      }
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.put(`/api/members/${id}`, memberData);
        // Update in list and selectedMember
        const index = this.members.findIndex(m => m.id === id);
        if (index !== -1) {
          this.members[index] = response.data;
        }
        if (this.selectedMember && this.selectedMember.id === id) {
          this.selectedMember = response.data;
        }
        return true;
      } catch (error) {
        console.error(`Error updating member ${id}:`, error);
        this.error = error.response?.data?.message || `Failed to update member ${id}.`;
        return false;
      } finally {
        this.loading = false;
      }
    },
    async deleteMember(id) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated || !['admin', 'editor'].includes(authStore.userRole)) {
        this.error = 'You are not authorized to delete members.';
        return false;
      }
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`/api/members/${id}`);
        this.members = this.members.filter(m => m.id !== id);
        if (this.selectedMember && this.selectedMember.id === id) {
          this.selectedMember = null;
        }
        return true;
      } catch (error) {
        console.error(`Error deleting member ${id}:`, error);
        this.error = error.response?.data?.message || `Failed to delete member ${id}.`;
        return false;
      } finally {
        this.loading = false;
      }
    }
  }
});
