import { computed } from 'vue'
import { useNotes } from './useNotes'

const CUSTOM_TAGS_KEY = 'nonote-custom-tags'

function loadCustomTags(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TAGS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCustomTags(tags: string[]) {
  localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags))
}

export function useTags() {
  const { notes } = useNotes()

  const allTags = computed(() => {
    const tagSet = new Set<string>()
    for (const note of notes.value) {
      for (const tag of note.tags) {
        tagSet.add(tag)
      }
    }
    for (const tag of loadCustomTags()) {
      tagSet.add(tag)
    }
    return [...tagSet].sort()
  })

  function addCustomTag(tag: string) {
    const tags = loadCustomTags()
    if (!tags.includes(tag)) {
      tags.push(tag)
      saveCustomTags(tags)
    }
  }

  return { allTags, addCustomTag }
}
