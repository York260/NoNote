import { ref } from 'vue'
import type { NoteMemory } from '../types'

const STORAGE_KEY = 'nonote-memory'

function loadMemory(): NoteMemory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveMemory(memories: NoteMemory[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memories))
}

const memories = ref<NoteMemory[]>(loadMemory())

export function useMemory() {
  function recordMemory(content: string, tags: string[]) {
    const trimmed = content.trim()
    if (!trimmed) return

    const idx = memories.value.findIndex(m => m.content === trimmed)
    if (idx !== -1) {
      const existing = memories.value[idx]!
      existing.tags = tags
      existing.useCount++
    } else {
      memories.value.push({ content: trimmed, tags, useCount: 1 })
    }
    saveMemory(memories.value)
  }

  function getSuggestions(query: string): NoteMemory[] {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return memories.value
      .filter(m => m.content.toLowerCase().includes(q))
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 8)
  }

  function clearMemory() {
    memories.value = []
    saveMemory([])
  }

  return { memories, recordMemory, getSuggestions, clearMemory }
}
