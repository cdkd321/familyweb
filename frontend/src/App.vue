<template>
  <div id="app">
    <header>
      <nav>
        <router-link to="/">Home (Placeholder)</router-link> |
        <router-link to="/about-family">About Our Family</router-link>
        <router-link v-if="authStore.isAuthenticated" to="/members"> | Members</router-link>
        <router-link v-if="authStore.isAuthenticated" to="/family-tree"> | Family Tree</router-link>

        <span v-if="authStore.isAuthenticated" class="auth-links">
          | Logged in as: <strong>{{ authStore.user?.username }}</strong>
          (<router-link to="/account">Account</router-link> | <a @click="handleLogout" href="#">Logout</a>)
        </span>
        <span v-else class="auth-links">
          | <router-link to="/login">Login</router-link> |
          <router-link to="/register">Register</router-link>
        </span>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
    <footer>
      <p>&copy; {{ new Date().getFullYear() }} Family Tree App</p>
    </footer>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore';
import router from './router'; // Import router for navigation on logout

const authStore = useAuthStore();

function handleLogout() {
  authStore.logout();
  // Navigation to login is handled by the store's logout action now
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

header {
  background-color: #f8f9fa;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

nav {
  padding: 10px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  margin: 0 5px; /* Adjusted margin for tighter spacing */
  text-decoration: none;
}

nav a.router-link-exact-active {
  color: #42b983;
}

.auth-links a {
  cursor: pointer;
  text-decoration: underline;
}

main {
  padding: 20px;
}

footer {
  margin-top: 30px;
  padding: 20px;
  background-color: #343a40;
  color: white;
}
</style>
