<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: Record<string, number>
}>()

const weeks = computed(() => {
  const today = new Date()
  const result: Array<Array<{ date: string; count: number; dayLabel: string }>> = []
  // Show 20 weeks (roughly 5 months)
  const totalDays = 20 * 7
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - totalDays + 1)
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay())

  let currentWeek: Array<{ date: string; count: number; dayLabel: string }> = []
  const d = new Date(startDate)

  while (d <= today) {
    const key = d.toISOString().slice(0, 10)
    currentWeek.push({
      date: key,
      count: props.data[key] || 0,
      dayLabel: d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
    })
    if (currentWeek.length === 7) {
      result.push(currentWeek)
      currentWeek = []
    }
    d.setDate(d.getDate() + 1)
  }
  if (currentWeek.length > 0) result.push(currentWeek)

  return result
})

const maxCount = computed(() => {
  const values = Object.values(props.data)
  return values.length > 0 ? Math.max(...values) : 1
})

function getColor(count: number): string {
  if (count === 0) return '#ebedf0'
  const ratio = count / maxCount.value
  if (ratio <= 0.25) return '#c6e48b'
  if (ratio <= 0.5) return '#7bc96f'
  if (ratio <= 0.75) return '#239a3b'
  return '#196127'
}

const dayLabels = ['日', '一', '二', '三', '四', '五', '六']
</script>

<template>
  <div class="heatmap">
    <div class="heatmap-wrapper">
      <div class="day-labels">
        <span v-for="(label, i) in dayLabels" :key="i" class="day-label">
          {{ i % 2 === 1 ? label : '' }}
        </span>
      </div>
      <div class="heatmap-grid">
        <div v-for="(week, wi) in weeks" :key="wi" class="week-col">
          <div
            v-for="day in week"
            :key="day.date"
            class="day-cell"
            :style="{ background: getColor(day.count) }"
            :title="`${day.dayLabel}: ${day.count} 則筆記`"
          />
        </div>
      </div>
    </div>
    <div class="heatmap-legend">
      <span class="legend-label">少</span>
      <span class="legend-cell" style="background: #ebedf0" />
      <span class="legend-cell" style="background: #c6e48b" />
      <span class="legend-cell" style="background: #7bc96f" />
      <span class="legend-cell" style="background: #239a3b" />
      <span class="legend-cell" style="background: #196127" />
      <span class="legend-label">多</span>
    </div>
  </div>
</template>

<style scoped>
.heatmap {
  overflow-x: auto;
}

.heatmap-wrapper {
  display: flex;
  gap: 4px;
}

.day-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 0;
}

.day-label {
  height: 14px;
  font-size: 10px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
}

.heatmap-grid {
  display: flex;
  gap: 2px;
}

.week-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  cursor: default;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  justify-content: flex-end;
}

.legend-label {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
</style>
