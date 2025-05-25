import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import MemberEditView from '../../../src/views/members/MemberEditView.vue'; // Adjust path
import MemberForm from '../../../src/components/members/MemberForm.vue'; // To check if it's rendered
import { useMemberStore } from '../../../src/stores/memberStore';
import { useAuthStore } from '../../../src/stores/authStore'; // If needed for role checks passed to form
import { useRouter, useRoute } from 'vue-router'; // Uses mock from setup.js

// Router and Route mocks are in setup.js or need to be set up here
// For this test, we'll explicitly mock useRoute for params
vi.mock('vue-router', async () => {
    const actual = await vi.importActual('vue-router');
    const mockUseRoute = vi.fn();
    const mockUseRouter = vi.fn(() => ({
        push: vi.fn(), // Default mock push
        replace: vi.fn(),
    }));
    return {
        ...actual,
        useRoute: mockUseRoute,
        useRouter: mockUseRouter,
    };
});


describe('MemberEditView.vue', () => {
  let wrapper;
  let memberStore;
  let authStore; // If MemberEditView itself checks auth for rendering form
  let mockRoute; // To control route params
  let mockRouter; // To control router.push

  const mockMember = {
    id: 1, name: 'Existing Member', birth_date: '1990-01-01', 
    // ... other fields
  };

  const mountComponent = (routeParams = {}, memberStoreOverrides = {}, authStoreState = {}) => {
    mockRoute = { params: routeParams, query: {} }; // Default mock for useRoute
    useRoute.mockReturnValue(mockRoute);
    
    mockRouter = { push: vi.fn(), replace: vi.fn() };
    useRouter.mockReturnValue(mockRouter);


    wrapper = mount(MemberEditView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              member: {
                selectedMember: null, // Default for member store
                members: [], // For MemberForm dropdowns
                loading: false,
                error: null,
                ...memberStoreOverrides.initialState, // Specific initial state for memberStore
              },
              auth: {
                isAuthenticated: true, // Assume authenticated for accessing edit view
                user: { role: 'editor' }, // Default to editor role
                userRole: 'editor',
                ...authStoreState,
              },
            },
            stubActions: false, // Allow spying but also action execution (mocked below)
          }),
        ],
        stubs: {
            // MemberForm: true, // Shallow stub if not testing its interaction deeply
            RouterLink: { template: '<a><slot/></a>' }
        }
      },
    });
    memberStore = useMemberStore();
    authStore = useAuthStore(); // If MemberEditView itself uses authStore
  };

  beforeEach(() => {
    // Reset mocks for useRoute and useRouter before each test
    useRoute.mockReset();
    useRouter.mockReset();
    // mountComponent will be called in each test or describe block
  });

  describe('Create Mode (no route.params.id)', () => {
    beforeEach(() => {
      mountComponent({}); // No route params means create mode
      // Mock store actions for create mode
      memberStore.createMember = vi.fn().mockResolvedValue(true);
    });

    it('renders "Create New Member" title and MemberForm in create mode', () => {
      expect(wrapper.find('h1').text()).toBe('Create New Member');
      expect(wrapper.findComponent(MemberForm).exists()).toBe(true);
      expect(wrapper.findComponent(MemberForm).props('isEditMode')).toBe(false);
    });

    it('calls memberStore.createMember on MemberForm submit', async () => {
      const formData = { name: 'New Member', birth_date: '2000-01-01' };
      await wrapper.findComponent(MemberForm).vm.$emit('submit', formData);
      
      expect(memberStore.createMember).toHaveBeenCalledTimes(1);
      expect(memberStore.createMember).toHaveBeenCalledWith(formData);
    });

    it('navigates to MemberList on successful creation', async () => {
        memberStore.createMember.mockResolvedValue(true); // Ensure success
        // Simulate a successful fetchAllMembers if that's part of the flow
        memberStore.fetchAllMembers = vi.fn().mockResolvedValue(true);


        const formData = { name: 'New Member' };
        await wrapper.findComponent(MemberForm).vm.$emit('submit', formData);
        
        // Wait for async operations in handleSubmit
        await wrapper.vm.$nextTick(); // First for formSubmitting.value = false
        await wrapper.vm.$nextTick(); // Potentially for router navigation
        
        expect(mockRouter.push).toHaveBeenCalledWith({ name: 'MemberList' });
    });
  });

  describe('Edit Mode (with route.params.id)', () => {
    beforeEach(() => {
      // Mount in edit mode
      mountComponent({ id: String(mockMember.id) }, { 
        initialState: { 
          selectedMember: null, // Initially null, fetch will populate
          members: [mockMember] // For MemberForm dropdowns if needed
        } 
      });
      // Mock store actions for edit mode
      memberStore.fetchMemberById = vi.fn().mockImplementation(async (id) => {
        if (id === String(mockMember.id)) {
          memberStore.selectedMember = { ...mockMember }; // Simulate fetching
          return Promise.resolve();
        }
        memberStore.error = 'Member not found';
        return Promise.reject(new Error('Member not found'));
      });
      memberStore.updateMember = vi.fn().mockResolvedValue(true);
    });

    it('renders "Edit Member" title and MemberForm in edit mode', () => {
      expect(wrapper.find('h1').text()).toBe('Edit Member');
      expect(wrapper.findComponent(MemberForm).exists()).toBe(true);
      expect(wrapper.findComponent(MemberForm).props('isEditMode')).toBe(true);
    });

    it('calls memberStore.fetchMemberById on mount with correct ID', () => {
      expect(memberStore.fetchMemberById).toHaveBeenCalledTimes(1);
      expect(memberStore.fetchMemberById).toHaveBeenCalledWith(String(mockMember.id));
    });
    
    it('passes the fetched member data to MemberForm', async () => {
        // Action already called on mount, wait for state update if needed
        await wrapper.vm.$nextTick(); // Ensure selectedMember is set from fetch
        // The component's `memberToEdit` ref should be populated
        expect(wrapper.vm.memberToEdit).toEqual(mockMember);
        expect(wrapper.findComponent(MemberForm).props('member')).toEqual(mockMember);
    });

    it('calls memberStore.updateMember on MemberForm submit', async () => {
      await wrapper.vm.$nextTick(); // Ensure memberToEdit is populated
      const updatedData = { ...mockMember, name: 'Updated Member Name' };
      // Simulate MemberForm emitting submit
      await wrapper.findComponent(MemberForm).vm.$emit('submit', updatedData);
      
      expect(memberStore.updateMember).toHaveBeenCalledTimes(1);
      expect(memberStore.updateMember).toHaveBeenCalledWith(String(mockMember.id), updatedData);
    });
    
    it('navigates to MemberDetail on successful update', async () => {
        memberStore.updateMember.mockResolvedValue(true); // Ensure success
        await wrapper.vm.$nextTick(); // Ensure memberToEdit is populated
        const updatedData = { ...mockMember, name: 'Updated Member Name' };
        await wrapper.findComponent(MemberForm).vm.$emit('submit', updatedData);

        await wrapper.vm.$nextTick(); // for formSubmitting.value = false
        await wrapper.vm.$nextTick(); // for router navigation

        expect(mockRouter.push).toHaveBeenCalledWith({ name: 'MemberDetail', params: { id: String(mockMember.id) } });
    });

    it('displays error if member fetching fails', async () => {
        memberStore.fetchMemberById.mockImplementationOnce(async (id) => {
            memberStore.error = "Fetch failed";
            return Promise.reject(new Error("Fetch failed"));
        });
        // Remount with a different ID or clear selectedMember to ensure fetch is re-attempted or state is clean
        mountComponent({ id: '2' }, { initialState: { selectedMember: null }});
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.error-message').exists()).toBe(true);
        expect(wrapper.find('.error-message').text()).toContain('Failed to load member: Fetch failed');
    });
  });
  
  it('displays loading state initially when in edit mode', () => {
    // Mount without awaiting the fetchMemberById in the test itself
    // The component's onMounted is async
    useRoute.mockReturnValue({ params: { id: '1' } });
    wrapper = mount(MemberEditView, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: { member: { loading: true, selectedMember: null } }, // Simulate store already loading
              stubActions: false,
            }),
          ],
          stubs: { RouterLink: { template: '<a><slot/></a>' } }
        },
      });
    expect(wrapper.find('.loading').exists()).toBe(true);
    expect(wrapper.find('.loading').text()).toBe('Loading member data...');
  });

  it('displays form error message if store action fails on submit', async () => {
    mountComponent({}); // Create mode
    const errorMsg = "Failed to create member due to API error.";
    memberStore.createMember = vi.fn().mockImplementation(async () => {
        memberStore.error = errorMsg; // Simulate error being set in store
        return Promise.resolve(false); // Indicate failure
    });

    await wrapper.findComponent(MemberForm).vm.$emit('submit', { name: 'Test' });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.formError).toBe(errorMsg);
    // Check if MemberForm prop is updated (requires MemberForm to be not fully stubbed)
    expect(wrapper.findComponent(MemberForm).props('formError')).toBe(errorMsg);
  });

});
```
