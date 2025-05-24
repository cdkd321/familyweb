import { createRouter, createWebHistory } from 'vue-router';
import FamilyTreeInfoView from '../views/FamilyTreeInfoView.vue';
// If you have a HomeView or other views, import them here
// import HomeView from '../views/HomeView.vue'; 

const routes = [
  // Example of a home route if you have one
  // {
  //   path: '/',
  //   name: 'Home',
  //   component: HomeView 
  // },
  {
    path: '/about-family',
    name: 'FamilyTreeInfo',
    component: FamilyTreeInfoView
  },
  // Add other routes here
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Make sure BASE_URL is configured in vite.config.js if needed
  routes
});

export default router;
