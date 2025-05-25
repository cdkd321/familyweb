import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import { useAuthStore } from './stores/authStore' // Import the auth store

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store and check authentication status before mounting
const authStore = useAuthStore(); // Get the store instance
authStore.checkAuth().then(() => {
  app.mount('#app'); // Mount the app after auth check is complete
}).catch(error => {
  console.error("Error during auth check on app load:", error);
  app.mount('#app'); // Still mount the app, router guards will handle redirects
});
