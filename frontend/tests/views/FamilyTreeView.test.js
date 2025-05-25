import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import FamilyTreeView from '../../../src/views/FamilyTreeView.vue'; // Adjust path
import { useMemberStore } from '../../../src/stores/memberStore';
import { useAuthStore } from '../../../src/stores/authStore'; // If view checks auth for any reason

// RouterLink stub for testing
const RouterLinkStub = {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="typeof to === \'string\' ? to : to.path"><slot /></a>',
};

describe('FamilyTreeView.vue', () => {
  let wrapper;
  let memberStore;
  // let authStore; // If FamilyTreeView uses it

  const mockMembersData = [
    { id: 1, name: 'Grand Parent 1', parent1_id: null, parent2_id: null },
    { id: 2, name: 'Parent 1', parent1_id: 1, parent2_id: null }, // Child of GP1
    { id: 3, name: 'Parent 2', parent1_id: null, parent2_id: null }, // Another root for simplicity
    { id: 4, name: 'Child 1', parent1_id: 2, parent2_id: 3 },    // Child of P1 and P2
    { id: 5, name: 'Child 2', parent1_id: 2, parent2_id: 3 },    // Child of P1 and P2
    { id: 6, name: 'Grand Child 1', parent1_id: 4, parent2_id: null}, // Child of Child 1
  ];

  const mountComponent = (
    memberStoreState = { members: [], loading: false, error: null },
    authStoreState = { isAuthenticated: true } // Assume authenticated to view page
  ) => {
    wrapper = mount(FamilyTreeView, {
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
            TreeNode: wrapper?.vm?.TreeNode || false, // Attempt to use actual or stub if simple
        }
      },
    });
    memberStore = useMemberStore();
    // authStore = useAuthStore();
  };

  beforeEach(() => {
    // mountComponent will be called in each test
  });

  it('mounts without errors', () => {
    mountComponent();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('h1').text()).toBe('Family Tree');
  });

  it('calls memberStore.fetchAllMembers on mount', () => {
    const fetchAllMembersSpy = vi.fn();
    mountComponent({ members: [], loading: false, error: null }, {}, {
        member: { fetchAllMembers: fetchAllMembersSpy }
    });
    const currentMemberStore = useMemberStore();
    expect(currentMemberStore.fetchAllMembers).toHaveBeenCalledTimes(1);
  });

  it('displays loading message when memberStore.loading is true', () => {
    mountComponent({ members: [], loading: true, error: null });
    expect(wrapper.find('.loading').exists()).toBe(true);
    expect(wrapper.find('.loading').text()).toBe('Loading family members...');
  });

  it('displays error message when memberStore.error is set', () => {
    const errorMsg = 'Failed to load tree data';
    mountComponent({ members: [], loading: false, error: errorMsg });
    expect(wrapper.find('.error-message').exists()).toBe(true);
    expect(wrapper.find('.error-message').text()).toContain(errorMsg);
  });

  it('displays "No members found" when list is empty and not loading/error', () => {
    mountComponent({ members: [], loading: false, error: null });
    expect(wrapper.find('.no-members').exists()).toBe(true);
    expect(wrapper.find('.no-members').text()).toBe('No members found to display in the tree. Add members to see the tree.');
  });

  it('renders tree structure based on member data', async () => {
    // Mock the fetchAllMembers action to set the members data
    mountComponent({ members: [], loading: false, error: null });
    memberStore.fetchAllMembers = vi.fn(async () => {
        memberStore.members = mockMembersData; // Simulate fetching data
        memberStore.loading = false;
        memberStore.error = null;
        // Manually trigger tree building like onMounted would
        wrapper.vm.treeRoots = wrapper.vm.buildTree(mockMembersData); 
    });
    
    await memberStore.fetchAllMembers(); // Call the mocked action
    await wrapper.vm.$nextTick(); // Wait for DOM updates after treeRoots changes

    // Check for root nodes (Grand Parent 1 and Parent 2 in this simplified mock)
    // The buildTree logic might be complex to perfectly replicate root finding here without deep inspection
    // So we'll check for presence of names.
    const treeContainer = wrapper.find('.tree-container');
    expect(treeContainer.exists()).toBe(true);
    
    // Verify some names are present
    expect(wrapper.text()).toContain('Grand Parent 1 (ID: 1)');
    expect(wrapper.text()).toContain('Parent 1 (ID: 2)');
    expect(wrapper.text()).toContain('Child 1 (ID: 4)');

    // Check for nested structure (very basic check based on text presence)
    // A more robust test would inspect the actual DOM hierarchy or TreeNode component props.
    const gp1NodeText = wrapper.text(); // Get all text
    const p1Index = gp1NodeText.indexOf('Parent 1 (ID: 2)');
    const c1Index = gp1NodeText.indexOf('Child 1 (ID: 4)');
    expect(p1Index).toBeLessThan(c1Index); // Parent should appear before child in rendered output of nested lists
  });

  it('TreeNode renders node name and view details link', async () => {
    // Test the inline TreeNode component's rendering
    const nodeData = { id: 10, name: 'Test Node', children: [] };
     mountComponent({ members: [nodeData], loading: false, error: null });
     memberStore.fetchAllMembers = vi.fn(async () => {
        memberStore.members = [nodeData];
        wrapper.vm.treeRoots = wrapper.vm.buildTree([nodeData]);
    });
    await memberStore.fetchAllMembers();
    await wrapper.vm.$nextTick();

    const treeNodeContent = wrapper.find('.node-content');
    expect(treeNodeContent.exists()).toBe(true);
    expect(treeNodeContent.text()).toContain('Test Node (ID: 10)');
    expect(treeNodeContent.find('.view-details-link').exists()).toBe(true);
    // Check router-link 'to' prop (requires stubbing router-link more deeply or using actual router)
    // For now, presence is enough for this basic test.
  });

  it('TreeNode recursively renders children', async () => {
    const parentNode = { id: 20, name: 'Parent Test Node', children: [ { id: 21, name: 'Child Test Node', children: [] } ]};
    // To test recursion directly, we might mount TreeNode if it were a separate component.
    // Since it's inline, we test by providing data that causes recursion in FamilyTreeView.
    mountComponent({ members: [], loading: false, error: null });
    memberStore.fetchAllMembers = vi.fn(async () => {
        // Simulate buildTree creating this structure
        wrapper.vm.treeRoots = [parentNode]; 
    });
    await memberStore.fetchAllMembers();
    await wrapper.vm.$nextTick();

    const listItems = wrapper.findAll('li'); // Each TreeNode is an <li>
    expect(listItems.length).toBe(2); // Parent and one child
    expect(wrapper.text()).toContain('Parent Test Node (ID: 20)');
    expect(wrapper.text()).toContain('Child Test Node (ID: 21)');
    // Check for nesting by looking for a ul inside the first li
    const parentLi = wrapper.find('.tree-root > li'); // First root node's li
    expect(parentLi.find('ul > li').exists()).toBe(true); // Child node should be in a nested ul
  });

});
```
