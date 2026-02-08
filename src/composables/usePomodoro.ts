import { ref, computed, watch, onUnmounted } from 'vue'
import type { PomodoroSettings } from '../types'

const SETTINGS_KEY = 'nonote-pomodoro-settings'
const TODAY_COUNT_KEY = 'nonote-pomodoro-today'

function loadSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, longBreakInterval: 4 }
}

function saveSettings(settings: PomodoroSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadTodayCount(): number {
  try {
    const raw = localStorage.getItem(TODAY_COUNT_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.date === getTodayKey()) return data.count
    }
  } catch {}
  return 0
}

function saveTodayCount(count: number) {
  localStorage.setItem(TODAY_COUNT_KEY, JSON.stringify({ date: getTodayKey(), count }))
}

export function usePomodoro() {
  const settings = ref<PomodoroSettings>(loadSettings())
  const phase = ref<'idle' | 'work' | 'break'>('idle')
  const totalSeconds = ref(0)
  const isRunning = ref(false)
  const completedToday = ref(loadTodayCount())
  const pomodoroCount = ref(0)
  const startTime = ref<number | null>(null)
  // Track paused time to exclude from elapsed calculation
  const pausedAt = ref<number | null>(null)
  const accumulatedPauseMs = ref(0)
  // Reactive tick counter (updated by interval to trigger re-computation)
  const now = ref(Date.now())

  let timer: ReturnType<typeof setInterval> | null = null

  watch(settings, (val) => saveSettings(val), { deep: true })

  // Elapsed seconds based on real clock time
  const elapsedSeconds = computed(() => {
    if (!startTime.value) return 0
    const currentTime = pausedAt.value ?? now.value
    const realElapsed = currentTime - startTime.value - accumulatedPauseMs.value
    return Math.max(0, Math.floor(realElapsed / 1000))
  })

  // Remaining can go negative (overtime)
  const remainingSeconds = computed(() => totalSeconds.value - elapsedSeconds.value)

  // Whether we've passed the target time
  const isOvertime = computed(() => remainingSeconds.value < 0)

  // Overtime seconds (positive value)
  const overtimeSeconds = computed(() => Math.max(0, -remainingSeconds.value))

  function startWork() {
    const minutes = settings.value.workMinutes
    totalSeconds.value = minutes * 60
    phase.value = 'work'
    isRunning.value = true
    startTime.value = Date.now()
    pausedAt.value = null
    accumulatedPauseMs.value = 0
    startTick()
  }

  function startBreak() {
    const isLong = pomodoroCount.value > 0 && pomodoroCount.value % settings.value.longBreakInterval === 0
    const minutes = isLong ? settings.value.longBreakMinutes : settings.value.breakMinutes
    totalSeconds.value = minutes * 60
    phase.value = 'break'
    isRunning.value = true
    startTime.value = Date.now()
    pausedAt.value = null
    accumulatedPauseMs.value = 0
    startTick()
  }

  function startTick() {
    stopTimer()
    timer = setInterval(() => {
      now.value = Date.now()
    }, 500)
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function pause() {
    stopTimer()
    pausedAt.value = Date.now()
    isRunning.value = false
  }

  function resume() {
    if (pausedAt.value) {
      accumulatedPauseMs.value += Date.now() - pausedAt.value
      pausedAt.value = null
    }
    isRunning.value = true
    startTick()
  }

  function cancel() {
    stopTimer()
    phase.value = 'idle'
    isRunning.value = false
    totalSeconds.value = 0
    startTime.value = null
    pausedAt.value = null
    accumulatedPauseMs.value = 0
  }

  function complete() {
    stopTimer()
    if (phase.value === 'work') {
      pomodoroCount.value++
      completedToday.value++
      saveTodayCount(completedToday.value)
    }
    const result = {
      phase: phase.value,
      startTime: startTime.value!,
      duration: Math.round(elapsedSeconds.value / 60),
    }
    phase.value = 'idle'
    isRunning.value = false
    totalSeconds.value = 0
    startTime.value = null
    pausedAt.value = null
    accumulatedPauseMs.value = 0
    return result
  }

  function skipToNext() {
    const result = complete()
    if (result.phase === 'work') {
      startBreak()
    } else {
      startWork()
    }
    return result
  }

  const progress = computed(() => {
    if (totalSeconds.value === 0) return 0
    // Clamp at 1 so the circle fills completely, overtime doesn't wrap
    return Math.min(1, elapsedSeconds.value / totalSeconds.value)
  })

  const timeDisplay = computed(() => {
    if (isOvertime.value) {
      const os = overtimeSeconds.value
      const m = String(Math.floor(os / 60)).padStart(2, '0')
      const s = String(os % 60).padStart(2, '0')
      return `+${m}:${s}`
    }
    const r = remainingSeconds.value
    const m = String(Math.floor(r / 60)).padStart(2, '0')
    const s = String(r % 60).padStart(2, '0')
    return `${m}:${s}`
  })

  onUnmounted(() => stopTimer())

  return {
    settings,
    phase,
    totalSeconds,
    remainingSeconds,
    isRunning,
    completedToday,
    pomodoroCount,
    startTime,
    progress,
    timeDisplay,
    isOvertime,
    startWork,
    startBreak,
    pause,
    resume,
    cancel,
    complete,
    skipToNext,
  }
}
