import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import RegisterView from '../../../src/views/RegisterView.vue'; // Adjust path
import { useAuthStore } from '../../../src/stores/authStore';
import { useRouter } from 'vue-router'; // Uses mock from setup.js

// Router mock is already in setup.js

describe('RegisterView.vue', () => {
  let wrapper;
  let authStore;

  const mountComponent = (initialPiniaState = {}) => {
    wrapper = mount(RegisterView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: initialPiniaState,
            },
            stubActions: false, 
          }),
        ],
        stubs: {
            RouterLink: { template: '<a><slot /></a>' },
            'router-link': { template: '<a><slot /></a>' },
        }
      },
    });
    authStore = useAuthStore();
  };

  beforeEach(() => {
    const { push: mockRouterPush } = useRouter();
    mockRouterPush.mockClear();
    // mountComponent will be called in each test
  });

  it('mounts without errors', () => {
    mountComponent();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('h2').text()).toBe('Register');
  });

  it('calls authStore.register on form submission with correct user info', async () => {
    mountComponent();
    authStore.register = vi.fn().mockResolvedValue(true); // Mock the action

    const usernameInput = wrapper.find('input#username');
    const emailInput = wrapper.find('input#email');
    const passwordInput = wrapper.find('input#password');
    const registerButton = wrapper.find('button[type="submit"]');

    await usernameInput.setValue('newuser');
    await emailInput.setValue('new@example.com');
    await passwordInput.setValue('newpassword123');
    await registerButton.trigger('submit.prevent');

    expect(authStore.register).toHaveBeenCalledTimes(1);
    expect(authStore.register).toHaveBeenCalledWith({ 
      username: 'newuser', 
      email: 'new@example.com', 
      password: 'newpassword123' 
    });
  });

  it('displays loading state when authStore.loading is true', async () => {
    mountComponent({ loading: true });
    
    const registerButton = wrapper.find('button[type="submit"]');
    expect(registerButton.text()).toContain('Registering...');
    expect(registerButton.attributes('disabled')).toBeDefined();

    authStore.loading = false;
    await wrapper.vm.$nextTick();
    expect(registerButton.text()).toContain('Register');
    expect(registerButton.attributes('disabled')).toBeUndefined();
  });

  it('displays error message when authStore.error is set', async () => {
    const errorMessage = 'Registration failed test';
    mountComponent({ error: errorMessage });

    const errorP = wrapper.find('p.error-message');
    expect(errorP.exists()).toBe(true);
    expect(errorP.text()).toBe(errorMessage);
    
    authStore.error = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('p.error-message').exists()).toBe(false);
  });
  
  it('clears authStore.error on mount', () => {
    const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
    setActivePinia(pinia);
    const initialAuthStore = useAuthStore();
    initialAuthStore.error = "Previous registration error";

    wrapper = mount(RegisterView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } }
      },
    });
    
    const currentAuthStore = useAuthStore();
    expect(currentAuthStore.error).toBeNull();
  });
});
```
