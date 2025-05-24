<template>
  <div id="app">
    <header>
      <nav>
        <router-link to="/">Home (Placeholder)</router-link> |
        <router-link to="/about-family">About Our Family</router-link>
        <!-- Add other global navigation links here -->
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
// No specific script needed for this basic App.vue layout
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
  margin: 0 15px;
  text-decoration: none;
}

nav a.router-link-exact-active {
  color: #42b983;
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
