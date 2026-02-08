import { createRouter, createWebHashHistory } from 'vue-router'
import NotesView from './views/NotesView.vue'
import PomodoroView from './views/PomodoroView.vue'
import AnalysisView from './views/AnalysisView.vue'
import SettingsView from './views/SettingsView.vue'

const routes = [
  { path: '/', component: NotesView },
  { path: '/pomodoro', component: PomodoroView },
  { path: '/analysis', component: AnalysisView },
  { path: '/settings', component: SettingsView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
