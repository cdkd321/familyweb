// frontend/tests/App.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue'; // Adjust path as needed
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../src/stores/authStore'; // Path to your auth store

// Minimal router setup for testing App.vue which uses <router-view> and router-links
const testRoutes = [
  { path: '/', name: 'Home', component: { template: '<div>Home Page Content</div>' } },
  { path: '/about-family', name: 'FamilyTreeInfo', component: { template: '<div>About Family Page</div>' } },
  { path: '/members', name: 'MemberList', component: { template: '<div>Members Page</div>' } },
  { path: '/family-tree', name: 'FamilyTree', component: { template: '<div>Family Tree Page</div>' } },
  { path: '/login', name: 'Login', component: { template: '<div>Login Page</div>' } },
  { path: '/register', name: 'Register', component: { template: '<div>Register Page</div>' } },
  { path: '/account', name: 'AccountView', component: { template: '<div>Account Page</div>' } },
];

let router;
let pinia;

beforeEach(() => {
  // Create a new router instance for each test to avoid state leakage
  router = createRouter({
    history: createWebHistory(),
    routes: testRoutes,
  });

  // Create a new Pinia instance and make it active
  pinia = createPinia();
  setActivePinia(pinia); // This is crucial for Pinia stores to work in tests

  // Initialize the auth store as it's used directly in App.vue setup
  // You might want to mock its initial state or actions depending on test needs
  const authStore = useAuthStore();
  // Default to not authenticated for most tests, or set as needed
  authStore.user = null;
  authStore.token = null;
});

describe('App.vue', () => {
  it('renders basic navigation links', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router, pinia] // Provide router and pinia
      }
    });
    // Check for a specific element or text that App.vue should render
    expect(wrapper.find('nav').exists()).toBe(true);
    expect(wrapper.text()).toContain('Home (Placeholder)');
    expect(wrapper.text()).toContain('About Our Family');
  });

  it('shows Login and Register links when not authenticated', () => {
    // Auth store is already set to not authenticated in beforeEach
    const wrapper = mount(App, {
      global: {
        plugins: [router, pinia]
      }
    });
    expect(wrapper.text()).toContain('Login');
    expect(wrapper.text()).toContain('Register');
    expect(wrapper.text()).not.toContain('Logout');
    expect(wrapper.text()).not.toContain('Members');
    expect(wrapper.text()).not.toContain('Family Tree');
    expect(wrapper.text()).not.toContain('Account');
  });

  it('shows authenticated links when user is logged in', async () => {
    const authStore = useAuthStore();
    authStore.user = { username: 'testuser', role: 'viewer' }; // Simulate logged-in user
    authStore.token = 'fake-token'; // Simulate token presence

    const wrapper = mount(App, {
      global: {
        plugins: [router, pinia]
      }
    });
    
    // Wait for Vue to update the DOM if necessary (though with Pinia state change it should be reactive)
    // await wrapper.vm.$nextTick(); // Not always needed with Vue 3 and Pinia direct state manipulation

    expect(wrapper.text()).toContain('Logged in as: testuser');
    expect(wrapper.text()).toContain('Logout');
    expect(wrapper.text()).toContain('Members'); // Members link
    expect(wrapper.text()).toContain('Family Tree'); // Family Tree link
    expect(wrapper.text()).toContain('Account'); // Account link
    expect(wrapper.text()).not.toContain('Login');
    expect(wrapper.text()).not.toContain('Register');
  });
});
```
