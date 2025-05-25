import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import LoginView from '../../../src/views/LoginView.vue'; // Adjust path
import { useAuthStore } from '../../../src/stores/authStore';
import { useRouter } from 'vue-router'; // Uses mock from setup.js

// Router mock is already in setup.js, so useRouter().push will be mockRouterPush

describe('LoginView.vue', () => {
  let wrapper;
  let authStore;

  const mountComponent = (initialPiniaState = {}, routeQuery = {}) => {
    wrapper = mount(LoginView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: initialPiniaState, // For authStore state
            },
            stubActions: false, // Allow spying on actions but they will run their mocked implementation if any
          }),
        ],
        mocks: { // Mock vue-router's useRoute if needed for query params
          $route: {
            query: routeQuery
          }
        },
        stubs: { // Stub <router-link> if it's directly in LoginView (it is)
            RouterLink: { template: '<a><slot /></a>' },
            'router-link': { template: '<a><slot /></a>' },
        }
      },
    });
    authStore = useAuthStore(); // Get the instance of the (mocked) store
  };

  beforeEach(() => {
    // Reset mocks used by the component or its store interactions
    const { push: mockRouterPush } = useRouter(); // from setup.js
    mockRouterPush.mockClear();
    // mountComponent will be called in each test or describe block
  });

  it('mounts without errors', () => {
    mountComponent();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('h2').text()).toBe('Login');
  });

  it('calls authStore.login on form submission with correct credentials', async () => {
    mountComponent();
    // Mock the login action to resolve successfully for this test
    authStore.login = vi.fn().mockResolvedValue(true);

    const usernameInput = wrapper.find('input#username');
    const passwordInput = wrapper.find('input#password');
    const loginButton = wrapper.find('button[type="submit"]');

    await usernameInput.setValue('testuser');
    await passwordInput.setValue('password123');
    await loginButton.trigger('submit.prevent');

    expect(authStore.login).toHaveBeenCalledTimes(1);
    expect(authStore.login).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
  });

  it('displays loading state when authStore.loading is true', async () => {
    mountComponent({ loading: true }); // Initial store state with loading true
    
    const loginButton = wrapper.find('button[type="submit"]');
    expect(loginButton.text()).toContain('Logging in...');
    expect(loginButton.attributes('disabled')).toBeDefined();

    // Test changing loading state dynamically (if component reacts to it after mount)
    authStore.loading = false;
    await wrapper.vm.$nextTick(); // Wait for DOM update
    expect(loginButton.text()).toContain('Login');
    expect(loginButton.attributes('disabled')).toBeUndefined();
  });

  it('displays error message when authStore.error is set', async () => {
    const errorMessage = 'Invalid credentials test';
    mountComponent({ error: errorMessage }); // Initial store state with an error

    const errorP = wrapper.find('p.error-message');
    expect(errorP.exists()).toBe(true);
    expect(errorP.text()).toBe(errorMessage);
    
    // Test clearing error (e.g., on new input or successful action)
    authStore.error = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('p.error-message').exists()).toBe(false);
  });
  
  it('displays registration success message if query.registered is true', () => {
    mountComponent({}, { registered: 'true' }); // Pass query param via mock $route
    const successP = wrapper.find('p.success-message');
    expect(successP.exists()).toBe(true);
    expect(successP.text()).toBe('Registration successful! Please log in.');
  });

  it('clears registration success message on new login attempt', async () => {
    mountComponent({}, { registered: 'true' });
    expect(wrapper.find('p.success-message').exists()).toBe(true);

    authStore.login = vi.fn().mockResolvedValue(false); // Simulate login attempt (fail or success)
    await wrapper.find('input#username').setValue('testuser');
    await wrapper.find('input#password').setValue('password123');
    await wrapper.find('button[type="submit"]').trigger('submit.prevent');
    
    expect(wrapper.find('p.success-message').exists()).toBe(false);
  });
  
  it('clears authStore.error on mount', () => {
    // Set an error in the store before mounting
    const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
    setActivePinia(pinia); // Make sure this pinia is active for useAuthStore()
    const initialAuthStore = useAuthStore();
    initialAuthStore.error = "Previous error";

    // Mount the component with this Pinia instance
    wrapper = mount(LoginView, {
      global: {
        plugins: [pinia],
        mocks: { $route: { query: {} } },
        stubs: { RouterLink: { template: '<a><slot /></a>' } }
      },
    });
    
    // The onMounted hook in LoginView should clear the store's error
    const currentAuthStore = useAuthStore(); // Get store instance tied to wrapper's pinia
    expect(currentAuthStore.error).toBeNull();
  });
});
```
