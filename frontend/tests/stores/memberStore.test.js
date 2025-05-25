import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMemberStore } from '../../src/stores/memberStore';
import { useAuthStore } from '../../src/stores/authStore'; // To mock auth state
import axios from 'axios';

// Mock Axios
vi.mock('axios');

describe('Member Store (memberStore.js)', () => {
  let authStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    // Initialize authStore and set default states for it, as memberStore depends on it
    authStore = useAuthStore();
    authStore.token = null; // Default to not authenticated
    authStore.user = null;
    authStore.userRole = null;

    // Reset Axios mocks
    axios.get.mockReset();
    axios.post.mockReset();
    axios.put.mockReset();
    axios.delete.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Initial State
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const memberStore = useMemberStore();
      expect(memberStore.members).toEqual([]);
      expect(memberStore.selectedMember).toBeNull();
      expect(memberStore.loading).toBe(false);
      expect(memberStore.error).toBeNull();
    });
  });

  // 2. fetchAllMembers Action
  describe('fetchAllMembers Action', () => {
    it('fetches all members successfully', async () => {
      const memberStore = useMemberStore();
      const mockMembers = [{ id: 1, name: 'John Doe' }, { id: 2, name: 'Jane Doe' }];
      axios.get.mockResolvedValueOnce({ data: mockMembers });

      await memberStore.fetchAllMembers();

      expect(memberStore.members).toEqual(mockMembers);
      expect(memberStore.loading).toBe(false);
      expect(memberStore.error).toBeNull();
      expect(axios.get).toHaveBeenCalledWith('/api/members');
    });

    it('handles error when fetching all members', async () => {
      const memberStore = useMemberStore();
      axios.get.mockRejectedValueOnce({ response: { data: { message: 'API Error' } } });

      await memberStore.fetchAllMembers();

      expect(memberStore.members).toEqual([]);
      expect(memberStore.loading).toBe(false);
      expect(memberStore.error).toBe('API Error');
    });
  });

  // 3. fetchMemberById Action
  describe('fetchMemberById Action', () => {
    it('fetches a single member successfully', async () => {
      const memberStore = useMemberStore();
      const mockMember = { id: 1, name: 'John Doe Details' };
      axios.get.mockResolvedValueOnce({ data: mockMember });

      await memberStore.fetchMemberById(1);

      expect(memberStore.selectedMember).toEqual(mockMember);
      expect(memberStore.loading).toBe(false);
      expect(memberStore.error).toBeNull();
      expect(axios.get).toHaveBeenCalledWith('/api/members/1');
    });

    it('handles error when fetching a single member', async () => {
      const memberStore = useMemberStore();
      axios.get.mockRejectedValueOnce({ response: { data: { message: 'Member not found' } } });

      await memberStore.fetchMemberById(99);

      expect(memberStore.selectedMember).toBeNull();
      expect(memberStore.loading).toBe(false);
      expect(memberStore.error).toBe('Member not found');
    });
  });

  // 4. createMember Action
  describe('createMember Action', () => {
    it('creates a member successfully with admin role', async () => {
      authStore.token = 'fake-token';
      authStore.user = { role: 'admin' }; // Simulate admin user
      authStore.userRole = 'admin';


      const memberStore = useMemberStore();
      const newMemberData = { name: 'Newbie' };
      const createdMember = { id: 3, ...newMemberData };
      axios.post.mockResolvedValueOnce({ data: createdMember });

      const result = await memberStore.createMember(newMemberData);

      expect(result).toBe(true);
      expect(memberStore.members).toContainEqual(createdMember);
      expect(memberStore.error).toBeNull();
      expect(axios.post).toHaveBeenCalledWith('/api/members', newMemberData);
    });
    
    it('creates a member successfully with editor role', async () => {
      authStore.token = 'fake-token';
      authStore.user = { role: 'editor' }; 
      authStore.userRole = 'editor';

      const memberStore = useMemberStore();
      const newMemberData = { name: 'Newbie Editor' };
      const createdMember = { id: 4, ...newMemberData };
      axios.post.mockResolvedValueOnce({ data: createdMember });

      const result = await memberStore.createMember(newMemberData);
      expect(result).toBe(true);
    });

    it('fails to create member if not authenticated', async () => {
      // authStore is not authenticated by default in beforeEach
      const memberStore = useMemberStore();
      const result = await memberStore.createMember({ name: 'No Auth Create' });
      expect(result).toBe(false);
      expect(memberStore.error).toBe('You are not authorized to create members.');
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('fails to create member with viewer role', async () => {
      authStore.token = 'fake-token';
      authStore.user = { role: 'viewer' };
      authStore.userRole = 'viewer';

      const memberStore = useMemberStore();
      const result = await memberStore.createMember({ name: 'Viewer Create Attempt' });
      expect(result).toBe(false);
      expect(memberStore.error).toBe('You are not authorized to create members.');
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('handles API error during member creation', async () => {
      authStore.token = 'fake-token';
      authStore.user = { role: 'admin' };
      authStore.userRole = 'admin';

      const memberStore = useMemberStore();
      axios.post.mockRejectedValueOnce({ response: { data: { message: 'Creation API Error' } } });
      
      const result = await memberStore.createMember({ name: 'Error Case' });
      expect(result).toBe(false);
      expect(memberStore.error).toBe('Creation API Error');
    });
  });

  // 5. updateMember Action (similar structure to createMember)
  describe('updateMember Action', () => {
    it('updates a member successfully with admin role', async () => {
      authStore.token = 'fake-token';
      authStore.user = { role: 'admin' };
      authStore.userRole = 'admin';

      const memberStore = useMemberStore();
      const memberIdToUpdate = 1;
      const updatedData = { name: 'Updated John' };
      const responseData = { id: memberIdToUpdate, ...updatedData };
      // Pre-populate members list for update
      memberStore.members = [{id: 1, name: "Old John"}, {id: 2, name: "Jane"}];
      memberStore.selectedMember = {id: 1, name: "Old John"};


      axios.put.mockResolvedValueOnce({ data: responseData });

      const result = await memberStore.updateMember(memberIdToUpdate, updatedData);

      expect(result).toBe(true);
      expect(memberStore.members.find(m => m.id === memberIdToUpdate)).toEqual(responseData);
      expect(memberStore.selectedMember).toEqual(responseData);
      expect(memberStore.error).toBeNull();
      expect(axios.put).toHaveBeenCalledWith(`/api/members/${memberIdToUpdate}`, updatedData);
    });

    it('fails to update if not authorized (e.g. viewer role)', async () => {
      authStore.token = 'fake-token';
      authStore.user = { role: 'viewer' };
      authStore.userRole = 'viewer';

      const memberStore = useMemberStore();
      const result = await memberStore.updateMember(1, { name: 'Viewer Update' });
      expect(result).toBe(false);
      expect(memberStore.error).toBe('You are not authorized to update members.');
    });
  });

  // 6. deleteMember Action (similar structure to createMember)
  describe('deleteMember Action', () => {
    it('deletes a member successfully with admin role', async () => {
      authStore.token = 'fake-token';
      authStore.user = { role: 'admin' };
      authStore.userRole = 'admin';

      const memberStore = useMemberStore();
      const memberIdToDelete = 1;
      // Pre-populate members list
      memberStore.members = [{id: 1, name: "John ToDelete"}, {id: 2, name: "Jane"}];
      memberStore.selectedMember = {id: 1, name: "John ToDelete"};

      axios.delete.mockResolvedValueOnce({ status: 200 }); // Or 204

      const result = await memberStore.deleteMember(memberIdToDelete);

      expect(result).toBe(true);
      expect(memberStore.members.find(m => m.id === memberIdToDelete)).toBeUndefined();
      expect(memberStore.selectedMember).toBeNull(); // If selected member was deleted
      expect(memberStore.error).toBeNull();
      expect(axios.delete).toHaveBeenCalledWith(`/api/members/${memberIdToDelete}`);
    });

    it('fails to delete if not authorized (e.g. viewer role)', async () => {
      authStore.token = 'fake-token';
      authStore.user = { role: 'viewer' };
      authStore.userRole = 'viewer';

      const memberStore = useMemberStore();
      const result = await memberStore.deleteMember(1);
      expect(result).toBe(false);
      expect(memberStore.error).toBe('You are not authorized to delete members.');
    });
  });
});
```
