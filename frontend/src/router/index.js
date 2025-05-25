import { createRouter, createWebHistory } from 'vue-router';
import FamilyTreeInfoView from '../views/FamilyTreeInfoView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
// If you have a HomeView or other views, import them here
// import HomeView from '../views/HomeView.vue'; 
import { useAuthStore } from '@/stores/authStore';

const routes = [
  // Example of a home route if you have one
  // {
  //   path: '/',
  //   name: 'Home',
  //   component: HomeView,
  //   meta: { requiresAuth: true } // Example of a protected route
  // },
  {
    path: '/about-family',
    name: 'FamilyTreeInfo',
    component: FamilyTreeInfoView,
    meta: { requiresAuth: true } // Protecting this route as an example
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true } // For routes only accessible to unauthenticated users
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { guestOnly: true } // For routes only accessible to unauthenticated users
  },
  // Member Routes
  {
    path: '/members',
    name: 'MemberList',
    component: () => import('../views/members/MemberListView.vue'), // Lazy load
    meta: { requiresAuth: true }
  },
  {
    path: '/members/new',
    name: 'MemberCreate',
    component: () => import('../views/members/MemberEditView.vue'), // Lazy load
    meta: { requiresAuth: true } // Further role checks can be done in component
  },
  {
    path: '/members/:id',
    name: 'MemberDetail',
    component: () => import('../views/members/MemberDetailView.vue'), // Lazy load
    props: true, // Pass route params as props
    meta: { requiresAuth: true }
  },
  {
    path: '/members/edit/:id',
    name: 'MemberEdit',
    component: () => import('../views/members/MemberEditView.vue'), // Lazy load
    props: true,
    meta: { requiresAuth: true } // Further role checks can be done in component
  },
  {
    path: '/family-tree',
    name: 'FamilyTree',
    component: () => import('../views/FamilyTreeView.vue'), // Lazy load
    meta: { requiresAuth: true }
  },
  {
    path: '/account',
    name: 'AccountView',
    component: () => import('../views/AccountView.vue'), // Lazy load
    meta: { requiresAuth: true }
  },
  // Add other routes here
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Ensure checkAuth has completed, especially on initial load.
  // If user state is not yet determined (e.g. checkAuth is async and running)
  // you might need a loading state or a way to await authStore.checkAuth()
  // For simplicity here, we assume checkAuth has run or its effect is reflected in token/user state.
  // A common pattern is to call checkAuth in main.js and let it complete.
  
  if (authStore.token && !authStore.user) {
    // If there's a token but no user object, it means checkAuth might still be fetching user
    // or fetchUser needs to be called. This depends on your authStore.checkAuth implementation.
    // For this example, let's assume if token exists, checkAuth will populate user or clear token.
    // If using a simple checkAuth that only loads token, you might need to await fetchUser here.
    // await authStore.fetchUser(); // Uncomment if your checkAuth doesn't fully resolve user state
  }

  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    // If route requires auth and user is not authenticated, redirect to login
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (to.meta.guestOnly && isAuthenticated) {
    // If route is for guests only (like login/register) and user is authenticated,
    // redirect to a default authenticated route (e.g., home or /about-family)
    next({ name: 'FamilyTreeInfo' }); // Or your main authenticated page
  } else {
    // Otherwise, allow navigation
    next();
  }
});

export default router;
