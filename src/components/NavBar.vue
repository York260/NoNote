<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { path: '/', label: '筆記', icon: '📝' },
  { path: '/pomodoro', label: '番茄鐘', icon: '🍅' },
  { path: '/analysis', label: '分析', icon: '📊' },
  { path: '/settings', label: '設定', icon: '⚙️' },
]
</script>

<template>
  <nav class="navbar">
    <router-link
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="nav-tab"
      :class="{ active: route.path === tab.path }"
    >
      <span class="nav-icon">{{ tab.icon }}</span>
      <span class="nav-label">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding: 8px 0;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  z-index: 1000;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 16px;
  text-decoration: none;
  color: #86868b;
  font-size: 10px;
  transition: color 0.2s;
  border-radius: 8px;
}

.nav-tab.active {
  color: #007AFF;
}

.nav-icon {
  font-size: 22px;
}

.nav-label {
  font-weight: 500;
}
</style>
