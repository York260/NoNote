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
  const remainingSeconds = ref(0)
  const isRunning = ref(false)
  const completedToday = ref(loadTodayCount())
  const pomodoroCount = ref(0)
  const startTime = ref<number | null>(null)

  let timer: ReturnType<typeof setInterval> | null = null

  watch(settings, (val) => saveSettings(val), { deep: true })

  function startWork() {
    const minutes = settings.value.workMinutes
    totalSeconds.value = minutes * 60
    remainingSeconds.value = totalSeconds.value
    phase.value = 'work'
    isRunning.value = true
    startTime.value = Date.now()
    tick()
  }

  function startBreak() {
    const isLong = pomodoroCount.value > 0 && pomodoroCount.value % settings.value.longBreakInterval === 0
    const minutes = isLong ? settings.value.longBreakMinutes : settings.value.breakMinutes
    totalSeconds.value = minutes * 60
    remainingSeconds.value = totalSeconds.value
    phase.value = 'break'
    isRunning.value = true
    startTime.value = Date.now()
    tick()
  }

  function tick() {
    stopTimer()
    timer = setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--
      } else {
        stopTimer()
        isRunning.value = false
      }
    }, 1000)
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function pause() {
    stopTimer()
    isRunning.value = false
  }

  function resume() {
    isRunning.value = true
    tick()
  }

  function cancel() {
    stopTimer()
    phase.value = 'idle'
    isRunning.value = false
    remainingSeconds.value = 0
    totalSeconds.value = 0
    startTime.value = null
  }

  function complete() {
    stopTimer()
    if (phase.value === 'work') {
      pomodoroCount.value++
      completedToday.value++
      saveTodayCount(completedToday.value)
    }
    const elapsed = totalSeconds.value - remainingSeconds.value
    const result = {
      phase: phase.value,
      startTime: startTime.value!,
      duration: Math.round(elapsed / 60),
    }
    phase.value = 'idle'
    isRunning.value = false
    remainingSeconds.value = 0
    totalSeconds.value = 0
    startTime.value = null
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
    return 1 - remainingSeconds.value / totalSeconds.value
  })

  const displayMinutes = computed(() => Math.floor(remainingSeconds.value / 60))
  const displaySeconds = computed(() => remainingSeconds.value % 60)

  const timeDisplay = computed(() => {
    const m = String(displayMinutes.value).padStart(2, '0')
    const s = String(displaySeconds.value).padStart(2, '0')
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
    startWork,
    startBreak,
    pause,
    resume,
    cancel,
    complete,
    skipToNext,
  }
}
