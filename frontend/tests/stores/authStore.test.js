import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../src/stores/authStore'; // Adjust path as necessary
import axios from 'axios'; // Will be mocked
import { useRouter } from 'vue-router'; // Will use mocked implementation from setup.js

// Mock Axios
vi.mock('axios');

// Get the mocked router push function
const { push: mockRouterPush } = useRouter();

describe('Auth Store (authStore.js)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Reset localStorage and mockRouterPush before each test (already in setup.js, but good practice)
    localStorage.clear();
    mockRouterPush.mockClear();
    // Reset Axios mocks if they are not reset globally or per-describe
    axios.post.mockReset();
    axios.get.mockReset();
    // Ensure Axios default headers are clean for each test
    axios.defaults.headers.common['Authorization'] = undefined; 
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore any other mocks if needed
  });

  // 1. Initial State
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useAuthStore();
      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.userRole).toBeNull();
    });
  });

  // 2. Login Action
  describe('Login Action', () => {
    it('handles successful login', async () => {
      const store = useAuthStore();
      const mockToken = 'fake-jwt-token';
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', role: 'viewer' };
      
      axios.post.mockResolvedValueOnce({ data: { access_token: mockToken } });
      axios.get.mockResolvedValueOnce({ data: mockUser }); // For fetchUser call within login

      const result = await store.login({ username: 'testuser', password: 'password' });

      expect(result).toBe(true);
      expect(store.token).toBe(mockToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(axios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
      expect(store.user).toEqual(mockUser);
      expect(store.isAuthenticated).toBe(true);
      expect(store.userRole).toBe('viewer');
      expect(store.error).toBeNull();
      expect(axios.post).toHaveBeenCalledWith('/auth/login', { username: 'testuser', password: 'password' });
      expect(axios.get).toHaveBeenCalledWith('/auth/me');
      expect(mockRouterPush).toHaveBeenCalledWith('/');
    });

    it('handles failed login (API error)', async () => {
      const store = useAuthStore();
      axios.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });

      const result = await store.login({ username: 'testuser', password: 'wrongpassword' });

      expect(result).toBe(false);
      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
      expect(store.isAuthenticated).toBe(false);
      expect(store.error).toBe('Invalid credentials');
    });
  });

  // 3. Register Action
  describe('Register Action', () => {
    it('handles successful registration', async () => {
      const store = useAuthStore();
      axios.post.mockResolvedValueOnce({ status: 201, data: { message: 'User registered' } }); // Backend response might vary

      const result = await store.register({ username: 'newuser', email: 'new@example.com', password: 'newpassword' });

      expect(result).toBe(true);
      expect(store.error).toBeNull();
      expect(axios.post).toHaveBeenCalledWith('/auth/register', { username: 'newuser', email: 'new@example.com', password: 'newpassword' });
      expect(mockRouterPush).toHaveBeenCalledWith({ name: 'Login', query: { registered: 'true' } });
    });

    it('handles failed registration (API error)', async () => {
      const store = useAuthStore();
      axios.post.mockRejectedValueOnce({ response: { data: { message: 'Email already exists' } } });

      const result = await store.register({ username: 'newuser', email: 'new@example.com', password: 'newpassword' });

      expect(result).toBe(false);
      expect(store.error).toBe('Email already exists');
    });
  });

  // 4. Logout Action
  describe('Logout Action', () => {
    it('resets state and removes token on logout', () => {
      const store = useAuthStore();
      // Simulate logged-in state
      store.token = 'fake-token';
      store.user = { id: 1, username: 'testuser', role: 'viewer' };
      localStorage.setItem('token', 'fake-token'); // Ensure localStorage has the token to be removed
      axios.defaults.headers.common['Authorization'] = 'Bearer fake-token';


      store.logout();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
      expect(store.isAuthenticated).toBe(false);
      expect(mockRouterPush).toHaveBeenCalledWith({ name: 'Login' });
    });
  });

  // 5. checkAuth Action
  describe('checkAuth Action', () => {
    it('fetches user and sets state if token exists in localStorage and is valid', async () => {
      const store = useAuthStore();
      const mockToken = 'valid-token';
      const mockUser = { id: 1, username: 'authuser', email: 'auth@example.com', role: 'admin' };
      localStorage.setItem('token', mockToken);
      axios.get.mockResolvedValueOnce({ data: mockUser }); // For fetchUser call

      await store.checkAuth();

      expect(store.token).toBe(mockToken);
      expect(axios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
      expect(store.user).toEqual(mockUser);
      expect(store.isAuthenticated).toBe(true);
      expect(store.userRole).toBe('admin');
      expect(axios.get).toHaveBeenCalledWith('/auth/me');
    });

    it('resets state if token exists in localStorage but is invalid (/auth/me fails)', async () => {
      const store = useAuthStore();
      const mockToken = 'invalid-token';
      localStorage.setItem('token', mockToken);
      axios.get.mockRejectedValueOnce({ response: { status: 401 } }); // /auth/me fails

      await store.checkAuth();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
      expect(store.isAuthenticated).toBe(false);
    });
    
    it('resets state if token exists in localStorage but /auth/me fails, and redirects if on protected route', async () => {
        const store = useAuthStore();
        const mockToken = 'invalid-token-redirect';
        localStorage.setItem('token', mockToken);
        axios.get.mockRejectedValueOnce({ response: { status: 401 } });
    
        // Mock currentRoute to simulate being on a protected route
        // This requires a more complex router mock in setup or here
        // For simplicity, we'll assume the store's logic for redirection is sound
        // and focus on the state change. The router mock in setup.js needs currentRoute.
        // Let's update setup.js to include a basic mock for currentRoute.
        // For this test, we assume the redirect logic in store.fetchUser() is invoked.
        useRouter().currentRoute = { value: { meta: { requiresAuth: true } } }; // Simulate being on protected route
    
        await store.checkAuth();
    
        expect(store.token).toBeNull();
        expect(store.user).toBeNull();
        expect(localStorage.removeItem).toHaveBeenCalledWith('token');
        expect(store.isAuthenticated).toBe(false);
        expect(mockRouterPush).toHaveBeenCalledWith({ name: 'Login' }); // Check for redirect
         // Clean up mocked route for other tests
        useRouter().currentRoute = { value: { meta: {} } }; 
      });

    it('does nothing if no token in localStorage', async () => {
      const store = useAuthStore();
      // Ensure localStorage is empty (done in beforeEach)
      await store.checkAuth();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(axios.get).not.toHaveBeenCalled(); // fetchUser should not be called
    });
  });
  
  // 6. changePassword Action
  describe('changePassword Action', () => {
    it('calls change-password endpoint successfully', async () => {
      const store = useAuthStore();
      // Simulate logged-in state
      store.token = 'fake-token'; 
      axios.defaults.headers.common['Authorization'] = 'Bearer fake-token';

      const payload = { current_password: 'old', new_password: 'new' };
      axios.post.mockResolvedValueOnce({ data: { message: 'Password changed' } });

      const message = await store.changePassword(payload);

      expect(message).toBe('Password changed');
      expect(axios.post).toHaveBeenCalledWith('/auth/change-password', payload);
    });

    it('throws error on failed password change', async () => {
      const store = useAuthStore();
      store.token = 'fake-token';
      axios.defaults.headers.common['Authorization'] = 'Bearer fake-token';
      
      const payload = { current_password: 'old', new_password: 'new' };
      axios.post.mockRejectedValueOnce({ response: { data: { message: 'Update failed' } } });

      await expect(store.changePassword(payload))
        .rejects.toThrow('Update failed');
      expect(axios.post).toHaveBeenCalledWith('/auth/change-password', payload);
    });

     it('throws error if not authenticated when trying to change password', async () => {
      const store = useAuthStore();
      store.token = null; // Not authenticated

      const payload = { current_password: 'old', new_password: 'new' };
      
      await expect(store.changePassword(payload))
        .rejects.toThrow('Not authenticated');
      expect(axios.post).not.toHaveBeenCalled();
    });
  });
});
```
