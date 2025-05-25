import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFamilyTreeInfoStore } from '../../src/stores/familyTreeInfo';
import { useAuthStore } from '../../src/stores/authStore'; // To mock auth state for update action
import axios from 'axios';

// Mock Axios
vi.mock('axios');

describe('Family Tree Info Store (familyTreeInfoStore.js)', () => {
  let authStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    // Initialize authStore for testing the update action's auth check
    authStore = useAuthStore();
    authStore.token = null; // Default to not authenticated
    authStore.user = null;

    // Reset Axios mocks
    axios.get.mockReset();
    axios.post.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Initial State
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const ftInfoStore = useFamilyTreeInfoStore();
      expect(ftInfoStore.info).toEqual({
        name: '',
        description: '',
        historical_documents_links: ''
      });
      expect(ftInfoStore.loading).toBe(false);
      expect(ftInfoStore.error).toBeNull();
    });
  });

  // 2. fetchFamilyTreeInfo Action
  describe('fetchFamilyTreeInfo Action', () => {
    it('fetches family tree info successfully when data exists', async () => {
      const ftInfoStore = useFamilyTreeInfoStore();
      const mockInfo = { 
        id: 1, 
        name: 'The Great Tree', 
        description: 'A long history.', 
        historical_documents_links: 'doc1.pdf\ndoc2.txt' 
      };
      axios.get.mockResolvedValueOnce({ data: mockInfo, status: 200 });

      await ftInfoStore.fetchFamilyTreeInfo();

      expect(ftInfoStore.info).toEqual(mockInfo);
      expect(ftInfoStore.loading).toBe(false);
      expect(ftInfoStore.error).toBeNull();
      expect(axios.get).toHaveBeenCalledWith('/api/family-tree-info');
    });

    it('handles 404 by setting default info when no data exists', async () => {
      const ftInfoStore = useFamilyTreeInfoStore();
      axios.get.mockResolvedValueOnce({ status: 404, data: { message: 'Not found'} }); // Simulate 404

      await ftInfoStore.fetchFamilyTreeInfo();
      
      // Check if it sets the default info as per store logic
      expect(ftInfoStore.info).toEqual({ 
        name: 'My Family Tree', 
        description: 'No details provided yet.', 
        historical_documents_links: '' 
      });
      expect(ftInfoStore.loading).toBe(false);
      expect(ftInfoStore.error).toBeNull(); // Error should be null if 404 is handled gracefully
    });

    it('handles API error during fetch', async () => {
      const ftInfoStore = useFamilyTreeInfoStore();
      axios.get.mockRejectedValueOnce({ response: { data: { message: 'API Fetch Error' } } });

      await ftInfoStore.fetchFamilyTreeInfo();

      expect(ftInfoStore.info).toEqual({ name: '', description: '', historical_documents_links: '' }); // Stays initial or default
      expect(ftInfoStore.loading).toBe(false);
      expect(ftInfoStore.error).toBe('API Fetch Error');
    });
  });

  // 3. updateFamilyTreeInfo Action
  describe('updateFamilyTreeInfo Action', () => {
    it('updates family tree info successfully', async () => {
      // Simulate authenticated user (though the store action doesn't directly check role, the API does)
      authStore.token = 'fake-token'; 
      authStore.user = { role: 'editor' }; // The API endpoint /api/family-tree-info currently only checks @jwt_required

      const ftInfoStore = useFamilyTreeInfoStore();
      const newInfoData = { 
        name: 'Updated Tree Name', 
        description: 'Updated description.',
        historical_documents_links: 'new_link.doc'
      };
      const responseData = { id: 1, ...newInfoData };
      axios.post.mockResolvedValueOnce({ data: responseData });

      const result = await ftInfoStore.updateFamilyTreeInfo(newInfoData);

      expect(result).toBe(true);
      expect(ftInfoStore.info).toEqual(responseData);
      expect(ftInfoStore.loading).toBe(false);
      expect(ftInfoStore.error).toBeNull();
      expect(axios.post).toHaveBeenCalledWith('/api/family-tree-info', newInfoData);
    });

    it('handles API error during update', async () => {
      authStore.token = 'fake-token';
      authStore.user = { role: 'editor' };

      const ftInfoStore = useFamilyTreeInfoStore();
      const newInfoData = { name: 'Error Update' };
      axios.post.mockRejectedValueOnce({ response: { data: { message: 'Update API Error' } } });

      const result = await ftInfoStore.updateFamilyTreeInfo(newInfoData);

      expect(result).toBe(false);
      // Info might remain old or be partially updated depending on optimistic updates (not in this store)
      expect(ftInfoStore.loading).toBe(false);
      expect(ftInfoStore.error).toBe('Update API Error');
    });
    
    // Note: The familyTreeInfoStore.updateFamilyTreeInfo itself does not perform an auth check.
    // It relies on Axios interceptors (from authStore) to send the token and the backend to enforce auth.
    // So, testing "unauthorized" for updateFamilyTreeInfo from the store's perspective means
    // the Axios call would fail if the interceptor wasn't set up or token was invalid,
    // which is covered by backend tests and authStore's responsibility.
    // Here, we assume if a request is made, the token setup by authStore is used.
  });
});
```
