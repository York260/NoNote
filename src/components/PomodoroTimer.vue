<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  progress: number
  timeDisplay: string
  phase: 'idle' | 'work' | 'break'
  isRunning: boolean
  isOvertime?: boolean
}>()

const circumference = 2 * Math.PI * 120
const strokeDashoffset = computed(() => circumference * (1 - props.progress))
const strokeColor = computed(() => {
  if (props.isOvertime) return '#FF9500'
  return props.phase === 'break' ? '#34C759' : '#007AFF'
})
const bgStrokeColor = computed(() => {
  if (props.isOvertime) return 'rgba(255,149,0,0.12)'
  return props.phase === 'break' ? 'rgba(52,199,89,0.12)' : 'rgba(0,122,255,0.12)'
})
</script>

<template>
  <div class="timer-container">
    <svg class="timer-svg" viewBox="0 0 260 260">
      <circle
        cx="130" cy="130" r="120"
        fill="none"
        :stroke="bgStrokeColor"
        stroke-width="8"
      />
      <circle
        cx="130" cy="130" r="120"
        fill="none"
        :stroke="strokeColor"
        stroke-width="8"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        class="progress-ring"
        transform="rotate(-90 130 130)"
      />
    </svg>
    <div class="timer-display">
      <div class="timer-time">{{ timeDisplay }}</div>
      <div class="timer-label" :class="{ overtime: isOvertime }">
        {{ isOvertime ? '已超時' : phase === 'work' ? '專注中' : phase === 'break' ? '休息中' : '' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer-container {
  position: relative;
  width: 260px;
  height: 260px;
  margin: 0 auto;
}

.timer-svg {
  width: 100%;
  height: 100%;
}

.progress-ring {
  transition: stroke-dashoffset 0.5s ease;
}

.timer-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.timer-time {
  font-size: 48px;
  font-weight: 200;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}

.timer-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.timer-label.overtime {
  color: #FF9500;
  font-weight: 500;
}
</style>
