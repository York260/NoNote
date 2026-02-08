<script setup lang="ts">
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="app-container">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px 100px;
}
</style>
