<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from '../types'
import { useNotes } from '../composables/useNotes'
import NoteCard from './NoteCard.vue'

const props = defineProps<{
  filterTag?: string | null
}>()

const { sortedNotes } = useNotes()

const filtered = computed(() => {
  if (!props.filterTag) return sortedNotes.value
  return sortedNotes.value.filter(n => n.tags.includes(props.filterTag!))
})

const groupedByDate = computed(() => {
  const groups: Record<string, Note[]> = {}
  for (const note of filtered.value) {
    const dateKey = new Date(note.createdAt).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(note)
  }
  return groups
})

async function copyDayNotes(dateLabel: string, notes: Note[]) {
  const lines = notes.map(n => {
    const time = new Date(n.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    let line = `${time} ${n.content}`
    if (n.tags.length) line += ` [${n.tags.join(', ')}]`
    if (n.annotation) line += `\n  備註：${n.annotation}`
    if (n.duration) line += `\n  ${n.pomodoroType === 'break' ? '休息' : '專注'} ${n.duration} 分鐘`
    return line
  })
  const text = `${dateLabel}\n${'─'.repeat(20)}\n${lines.join('\n')}`
  await navigator.clipboard.writeText(text)
}
</script>

<template>
  <div class="timeline">
    <div v-if="Object.keys(groupedByDate).length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <p>還沒有任何筆記</p>
      <p class="empty-hint">在上方輸入框開始記錄吧！</p>
    </div>
    <div v-for="(notes, dateLabel) in groupedByDate" :key="dateLabel" class="day-group">
      <div class="day-header">
        <span class="day-label">{{ dateLabel }}</span>
        <span class="day-count">{{ notes.length }} 則</span>
        <button
          class="copy-btn"
          title="複製當日記錄"
          @click="copyDayNotes(dateLabel as string, notes)"
        >
          📋
        </button>
      </div>
      <TransitionGroup name="slide-up" tag="div" class="notes-list">
        <NoteCard v-for="note in notes" :key="note.id" :note="note" />
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 14px;
  margin-top: 4px;
}

.day-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.day-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
}

.day-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.day-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: rgba(0, 0, 0, 0.04);
  padding: 2px 8px;
  border-radius: 10px;
}

.copy-btn {
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 6px;
  opacity: 0.5;
  transition: opacity 0.2s, background 0.15s;
}

.copy-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.04);
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
