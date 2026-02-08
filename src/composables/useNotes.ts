import { ref, computed } from 'vue'
import type { Note } from '../types'

const STORAGE_KEY = 'nonote-notes'

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

const notes = ref<Note[]>(loadNotes())

export function useNotes() {
  function persist() {
    saveNotes(notes.value)
  }

  function addNote(data: { content: string; tags: string[]; annotation: string; createdAt: number; duration?: number; pomodoroType?: 'work' | 'break' }): Note {
    const note: Note = {
      id: crypto.randomUUID(),
      content: data.content,
      tags: data.tags,
      annotation: data.annotation,
      createdAt: data.createdAt,
      updatedAt: Date.now(),
      duration: data.duration,
      pomodoroType: data.pomodoroType,
    }
    notes.value.unshift(note)
    persist()
    return note
  }

  function updateNote(id: string, updates: Partial<Note>) {
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) {
      const current = notes.value[idx]!
      notes.value[idx] = Object.assign({}, current, updates, { updatedAt: Date.now() }) as Note
      persist()
    }
  }

  function deleteNote(id: string) {
    notes.value = notes.value.filter(n => n.id !== id)
    persist()
  }

  function deleteNotes(ids: string[]) {
    const idSet = new Set(ids)
    notes.value = notes.value.filter(n => !idSet.has(n.id))
    persist()
  }

  function clearAll() {
    notes.value = []
    persist()
  }

  function importNotes(imported: Note[]) {
    notes.value = imported
    persist()
  }

  function exportNotes(): Note[] {
    return JSON.parse(JSON.stringify(notes.value))
  }

  const sortedNotes = computed(() =>
    [...notes.value].sort((a, b) => b.createdAt - a.createdAt)
  )

  const groupedByDate = computed(() => {
    const groups: Record<string, Note[]> = {}
    for (const note of sortedNotes.value) {
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

  return {
    notes,
    sortedNotes,
    groupedByDate,
    addNote,
    updateNote,
    deleteNote,
    deleteNotes,
    clearAll,
    importNotes,
    exportNotes,
  }
}
