<script setup lang="ts">
import { ref } from 'vue'
import { useNotes } from '../composables/useNotes'
import { useTags } from '../composables/useTags'
import NoteInput from '../components/NoteInput.vue'
import NoteTimeline from '../components/NoteTimeline.vue'
import TagBadge from '../components/TagBadge.vue'

const { addNote } = useNotes()
const { allTags } = useTags()

const filterTag = ref<string | null>(null)

function handleSubmit(data: { content: string; tags: string[]; annotation: string }) {
  addNote({
    content: data.content,
    tags: data.tags,
    annotation: data.annotation,
    createdAt: Date.now(),
  })
}

function toggleFilter(tag: string) {
  filterTag.value = filterTag.value === tag ? null : tag
}
</script>

<template>
  <div class="notes-view">
    <h1 class="page-title">筆記</h1>

    <NoteInput @submit="handleSubmit" />

    <div v-if="allTags.length > 0" class="filter-section">
      <span class="filter-label">篩選</span>
      <div class="filter-tags">
        <TagBadge
          v-for="tag in allTags"
          :key="tag"
          :tag="tag"
          :active="filterTag === tag"
          @click="toggleFilter(tag)"
        />
      </div>
    </div>

    <NoteTimeline :filter-tag="filterTag" />
  </div>
</template>

<style scoped>
.notes-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.filter-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
</style>
