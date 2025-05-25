import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import MemberListView from '../../../src/views/members/MemberListView.vue'; // Adjust path
import { useMemberStore } from '../../../src/stores/memberStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useRouter } from 'vue-router'; // Uses mock from setup.js

// Router mock is in setup.js

const RouterLinkStub = {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="typeof to === \'string\' ? to : to.path"><slot /></a>',
};

describe('MemberListView.vue', () => {
  let wrapper;
  let memberStore;
  let authStore;

  const mockMembers = [
    { id: 1, name: 'John Doe', birth_date: '1980-01-01', death_date: null },
    { id: 2, name: 'Jane Smith', birth_date: '1990-02-02', death_date: '2020-03-03' },
  ];

  const mountComponent = (
    memberStoreState = { members: [], loading: false, error: null },
    authStoreState = { isAuthenticated: false, userRole: null, user: null }
  ) => {
    wrapper = mount(MemberListView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              member: memberStoreState,
              auth: authStoreState,
            },
            stubActions: false, 
          }),
        ],
        stubs: {
            RouterLink: RouterLinkStub,
            'router-link': RouterLinkStub,
        }
      },
    });
    memberStore = useMemberStore();
    authStore = useAuthStore();
  };

  beforeEach(() => {
    // Reset mocks
    const { push: mockRouterPush } = useRouter();
    mockRouterPush.mockClear();
    // mountComponent is called in each test
  });

  it('mounts without errors', () => {
    mountComponent();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('h1').text()).toBe('Family Members');
  });

  it('calls memberStore.fetchAllMembers on mount', () => {
    // Spy on fetchAllMembers before mounting
    const fetchAllMembersSpy = vi.fn();
    mountComponent({ members: [], loading: false, error: null }, {}, {
        member: {
            fetchAllMembers: fetchAllMembersSpy
        }
    });
    // Need to access the store instance created by createTestingPinia
    const currentMemberStore = useMemberStore();
    // If actions are stubbed by default (depends on createTestingPinia config),
    // then fetchAllMembers itself will be a spy.
    // If not, we spy on it manually as above or ensure it's mockable.
    // With createSpy: vi.fn, actions should be spies.
    expect(currentMemberStore.fetchAllMembers).toHaveBeenCalledTimes(1);
  });
  
  it('displays loading message when memberStore.loading is true', () => {
    mountComponent({ members: [], loading: true, error: null });
    expect(wrapper.find('.loading').exists()).toBe(true);
    expect(wrapper.find('.loading').text()).toBe('Loading members...');
  });

  it('displays error message when memberStore.error is set', () => {
    const errorMsg = 'Failed to fetch';
    mountComponent({ members: [], loading: false, error: errorMsg });
    expect(wrapper.find('.error-message').exists()).toBe(true);
    expect(wrapper.find('.error-message').text()).toContain(errorMsg);
  });

  it('displays "No members found" when list is empty and not loading/error', () => {
    mountComponent({ members: [], loading: false, error: null });
    expect(wrapper.find('p').text()).toBe('No members found.');
  });

  it('renders members in a table when members exist', () => {
    mountComponent({ members: mockMembers, loading: false, error: null });
    const rows = wrapper.findAll('.members-table tbody tr');
    expect(rows.length).toBe(mockMembers.length);
    expect(rows[0].text()).toContain(mockMembers[0].name);
    expect(rows[1].text()).toContain(mockMembers[1].name);
  });

  describe('Action Buttons Visibility (Add, Edit, Delete)', () => {
    it('"Add New Member" button is visible to admin', () => {
      mountComponent({}, { isAuthenticated: true, userRole: 'admin', user: {role: 'admin'} });
      expect(wrapper.find('.actions-bar router-link[to="/members/new"]').exists()).toBe(true);
    });
    it('"Add New Member" button is visible to editor', () => {
      mountComponent({}, { isAuthenticated: true, userRole: 'editor', user: {role: 'editor'} });
      expect(wrapper.find('.actions-bar router-link[to="/members/new"]').exists()).toBe(true);
    });
    it('"Add New Member" button is hidden from viewer', () => {
      mountComponent({}, { isAuthenticated: true, userRole: 'viewer', user: {role: 'viewer'} });
      expect(wrapper.find('.actions-bar router-link[to="/members/new"]').exists()).toBe(false);
    });
    it('"Add New Member" button is hidden when not authenticated', () => {
      mountComponent({}, { isAuthenticated: false, userRole: null, user: null });
      expect(wrapper.find('.actions-bar router-link[to="/members/new"]').exists()).toBe(false);
    });

    it('Edit/Delete buttons are visible to admin for each member', () => {
      mountComponent({ members: [mockMembers[0]], loading: false, error: null }, 
                     { isAuthenticated: true, userRole: 'admin', user: {role: 'admin'} });
      const firstRowActions = wrapper.find('.members-table tbody tr td:last-child');
      expect(firstRowActions.find('router-link[to="/members/edit/1"]').exists()).toBe(true);
      expect(firstRowActions.find('button.btn-danger').exists()).toBe(true); // Delete button
    });
    it('Edit/Delete buttons are hidden from viewer', () => {
      mountComponent({ members: [mockMembers[0]], loading: false, error: null }, 
                     { isAuthenticated: true, userRole: 'viewer', user: {role: 'viewer'} });
      const firstRowActions = wrapper.find('.members-table tbody tr td:last-child');
      expect(firstRowActions.find('router-link[to="/members/edit/1"]').exists()).toBe(false);
      expect(firstRowActions.find('button.btn-danger').exists()).toBe(false);
    });
  });

  describe('Delete Member Action', () => {
    it('calls memberStore.deleteMember when delete is confirmed', async () => {
      // Mount with admin role and a member
      mountComponent({ members: [mockMembers[0]], loading: false, error: null }, 
                     { isAuthenticated: true, userRole: 'admin', user: {role: 'admin'} });
      
      memberStore.deleteMember = vi.fn().mockResolvedValue(true); // Mock action
      const windowConfirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true); // Mock window.confirm

      const deleteButton = wrapper.find('.members-table tbody tr button.btn-danger');
      await deleteButton.trigger('click');

      expect(windowConfirmSpy).toHaveBeenCalledTimes(1);
      expect(memberStore.deleteMember).toHaveBeenCalledTimes(1);
      expect(memberStore.deleteMember).toHaveBeenCalledWith(mockMembers[0].id);
      
      windowConfirmSpy.mockRestore();
    });

    it('does not call memberStore.deleteMember when delete is cancelled', async () => {
      mountComponent({ members: [mockMembers[0]], loading: false, error: null }, 
                     { isAuthenticated: true, userRole: 'admin', user: {role: 'admin'} });
      memberStore.deleteMember = vi.fn();
      const windowConfirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const deleteButton = wrapper.find('.members-table tbody tr button.btn-danger');
      await deleteButton.trigger('click');

      expect(windowConfirmSpy).toHaveBeenCalledTimes(1);
      expect(memberStore.deleteMember).not.toHaveBeenCalled();
      
      windowConfirmSpy.mockRestore();
    });
  });
});
```
