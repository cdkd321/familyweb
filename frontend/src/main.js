import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia' // Import Pinia
import router from './router' // Import the router

const app = createApp(App)

app.use(createPinia()) // Use Pinia
app.use(router) // Use the router

app.mount('#app')
