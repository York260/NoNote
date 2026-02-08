<script setup lang="ts">
import { computed } from 'vue'
import { useNotes } from '../composables/useNotes'
import PieChart from '../components/PieChart.vue'
import HeatmapCalendar from '../components/HeatmapCalendar.vue'

const { notes } = useNotes()

// Tag distribution
const tagDistribution = computed(() => {
  const counts: Record<string, number> = {}
  for (const note of notes.value) {
    for (const tag of note.tags) {
      counts[tag] = (counts[tag] || 0) + 1
    }
  }
  return counts
})

// Daily note counts for heatmap
const dailyCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const note of notes.value) {
    const key = new Date(note.createdAt).toISOString().slice(0, 10)
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
})

// Weekly/monthly trends
const weeklyTrend = computed(() => {
  const weeks: Record<string, number> = {}
  for (const note of notes.value) {
    const d = new Date(note.createdAt)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    weeks[key] = (weeks[key] || 0) + 1
  }
  // Return last 8 weeks
  const sorted = Object.entries(weeks).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8).reverse()
  return sorted.map(([week, count]) => {
    const d = new Date(week)
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count,
    }
  })
})

const maxWeeklyCount = computed(() => {
  if (weeklyTrend.value.length === 0) return 1
  return Math.max(...weeklyTrend.value.map(w => w.count))
})

// Stats
const totalNotes = computed(() => notes.value.length)
const totalTags = computed(() => Object.keys(tagDistribution.value).length)
const thisWeekNotes = computed(() => {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return notes.value.filter(n => n.createdAt >= weekStart.getTime()).length
})
</script>

<template>
  <div class="analysis-view">
    <h1 class="page-title">分析</h1>

    <!-- Stats cards -->
    <div class="stats-row">
      <div class="stat-card card">
        <div class="stat-value">{{ totalNotes }}</div>
        <div class="stat-label">總筆記數</div>
      </div>
      <div class="stat-card card">
        <div class="stat-value">{{ thisWeekNotes }}</div>
        <div class="stat-label">本週筆記</div>
      </div>
      <div class="stat-card card">
        <div class="stat-value">{{ totalTags }}</div>
        <div class="stat-label">標籤數量</div>
      </div>
    </div>

    <!-- Tag distribution pie chart -->
    <div class="card chart-section">
      <h2 class="section-title">標籤分布</h2>
      <PieChart :data="tagDistribution" />
    </div>

    <!-- Heatmap calendar -->
    <div class="card chart-section">
      <h2 class="section-title">活動熱力圖</h2>
      <HeatmapCalendar :data="dailyCounts" />
    </div>

    <!-- Weekly trend -->
    <div class="card chart-section">
      <h2 class="section-title">每週趨勢</h2>
      <div v-if="weeklyTrend.length === 0" class="no-data">尚無資料</div>
      <div v-else class="bar-chart">
        <div v-for="week in weeklyTrend" :key="week.label" class="bar-item">
          <div class="bar-value">{{ week.count }}</div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{ height: `${(week.count / maxWeeklyCount) * 100}%` }"
            />
          </div>
          <div class="bar-label">{{ week.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analysis-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  text-align: center;
  padding: 16px 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.chart-section {
  padding: 20px;
}

.no-data {
  text-align: center;
  padding: 30px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 180px;
  padding-top: 20px;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.bar-track {
  flex: 1;
  width: 100%;
  max-width: 40px;
  background: rgba(0, 122, 255, 0.08);
  border-radius: 6px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(to top, #007AFF, #409CFF);
  border-radius: 6px;
  transition: height 0.5s ease;
  min-height: 4px;
}

.bar-label {
  font-size: 11px;
  color: var(--color-text-secondary);
}
</style>
