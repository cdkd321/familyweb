import { defineStore } from 'pinia';
import axios from 'axios';
import router from '@/router'; // Import router for navigation

// Helper to set Authorization header for Axios
const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // Will store { id, username, email, role }
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    // You can add more getters, e.g., userRole, etc.
    userRole: (state) => state.user?.role || null,
  },
  actions: {
    async login(credentials) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post('/auth/login', credentials);
        const token = response.data.access_token;
        this.token = token;
        localStorage.setItem('token', token);
        setAuthHeader(token);
        // After setting token, fetch user details
        await this.fetchUser(); // This will set this.user
        router.push('/'); // Navigate to home or dashboard after login
        return true;
      } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        this.error = error.response?.data?.message || 'Failed to login. Please check your credentials.';
        localStorage.removeItem('token'); // Clear token on failed login
        setAuthHeader(null);
        this.token = null;
        this.user = null;
        return false;
      } finally {
        this.loading = false;
      }
    },
    async register(userInfo) {
      this.loading = true;
      this.error = null;
      try {
        await axios.post('/auth/register', userInfo);
        // Optionally, log in the user directly or redirect to login
        // For now, redirect to login page with a success message or auto-login
        router.push({ name: 'Login', query: { registered: 'true' } }); 
        return true;
      } catch (error) {
        console.error('Registration error:', error.response?.data || error.message);
        this.error = error.response?.data?.message || 'Failed to register. Please try again.';
        return false;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      setAuthHeader(null);
      router.push({ name: 'Login' }); // Navigate to login page
    },
    async fetchUser() {
      // This action assumes the token is already set in Axios headers by checkAuth or login
      if (!this.token) {
        this.user = null; // No token, no user
        return;
      }
      setAuthHeader(this.token); // Ensure header is set
      this.loading = true; // Can set loading for user fetch if needed
      try {
        const response = await axios.get('/auth/me');
        this.user = response.data; // Store user details { id, username, email, role }
      } catch (error) {
        console.error('Fetch user error:', error.response?.data || error.message);
        // If /auth/me fails (e.g. token invalid), treat as logged out
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        setAuthHeader(null);
        // Optionally, redirect to login if the current route requires auth
        // This logic might be better placed in router guards or on app load
        if (router.currentRoute.value.meta.requiresAuth) {
            router.push({ name: 'Login' });
        }
      } finally {
        this.loading = false;
      }
    },
    async checkAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
        setAuthHeader(token);
        await this.fetchUser(); // Fetch user details if token exists
      } else {
        this.token = null;
        this.user = null;
        setAuthHeader(null);
      }
    },
    async changePassword(payload) {
      // This action assumes the token is already set in Axios headers
      if (!this.token) {
        throw new Error("Not authenticated"); // Should be caught by component
      }
      // No need to set loading/error in the store for this specific form as per instructions
      // The component will manage its own loading/error states.
      try {
        const response = await axios.post('/auth/change-password', payload);
        // Backend returns a success message, e.g., {"message": "Password updated successfully"}
        return response.data.message; // Return the success message
      } catch (error) {
        console.error('Change password error:', error.response?.data || error.message);
        // Throw an error that the component can catch and display
        throw new Error(error.response?.data?.message || 'Failed to change password.');
      }
    }
  }
});
