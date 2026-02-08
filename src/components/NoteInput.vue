<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMemory } from '../composables/useMemory'
import { useTags } from '../composables/useTags'
import TagBadge from './TagBadge.vue'

const emit = defineEmits<{
  submit: [data: { content: string; tags: string[]; annotation: string }]
}>()

const props = defineProps<{
  prefillContent?: string
  prefillTags?: string[]
  showAnnotation?: boolean
}>()

const { getSuggestions, recordMemory } = useMemory()
const { allTags, addCustomTag } = useTags()

const content = ref(props.prefillContent ?? '')
const selectedTags = ref<string[]>(props.prefillTags ? [...props.prefillTags] : [])
const annotation = ref('')
const showAnnotationField = ref(props.showAnnotation ?? false)
const newTagInput = ref('')
const showSuggestions = ref(false)
const showTagDropdown = ref(false)

watch(() => props.prefillContent, (val) => {
  if (val !== undefined) content.value = val
})
watch(() => props.prefillTags, (val) => {
  if (val) selectedTags.value = [...val]
})

const suggestions = computed(() => getSuggestions(content.value))
const availableTags = computed(() =>
  allTags.value.filter(t => !selectedTags.value.includes(t))
)

function selectSuggestion(s: { content: string; tags: string[] }) {
  content.value = s.content
  selectedTags.value = [...s.tags]
  showSuggestions.value = false
}

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx !== -1) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

function addNewTag() {
  const tag = newTagInput.value.trim()
  if (tag && !selectedTags.value.includes(tag)) {
    addCustomTag(tag)
    selectedTags.value.push(tag)
    newTagInput.value = ''
  }
}

function handleSubmit() {
  const trimmed = content.value.trim()
  if (!trimmed) return
  recordMemory(trimmed, selectedTags.value)
  emit('submit', {
    content: trimmed,
    tags: [...selectedTags.value],
    annotation: annotation.value.trim(),
  })
  content.value = ''
  selectedTags.value = []
  annotation.value = ''
  showAnnotationField.value = false
}

function onInputFocus() {
  if (content.value.trim()) showSuggestions.value = true
}

function onInputBlur() {
  setTimeout(() => { showSuggestions.value = false }, 200)
}
</script>

<template>
  <div class="note-input card">
    <div class="input-row">
      <div class="input-wrapper">
        <input
          v-model="content"
          class="input content-input"
          placeholder="記錄一則筆記..."
          @focus="onInputFocus"
          @blur="onInputBlur"
          @input="showSuggestions = true"
          @keydown.enter.prevent="handleSubmit"
        />
        <Transition name="fade">
          <div v-if="showSuggestions && suggestions.length > 0" class="suggestions">
            <div
              v-for="s in suggestions"
              :key="s.content"
              class="suggestion-item"
              @mousedown.prevent="selectSuggestion(s)"
            >
              <span class="suggestion-content">{{ s.content }}</span>
              <span v-for="tag in s.tags" :key="tag" class="suggestion-tag">{{ tag }}</span>
            </div>
          </div>
        </Transition>
      </div>
      <button class="btn btn-primary submit-btn" @click="handleSubmit">新增</button>
    </div>

    <div class="tags-section">
      <div class="selected-tags">
        <TagBadge
          v-for="tag in selectedTags"
          :key="tag"
          :tag="tag"
          :removable="true"
          @remove="toggleTag(tag)"
        />
      </div>
      <div class="tag-actions">
        <button class="btn btn-secondary btn-sm" @click="showTagDropdown = !showTagDropdown">
          + 標籤
        </button>
        <button
          class="btn btn-secondary btn-sm"
          @click="showAnnotationField = !showAnnotationField"
        >
          {{ showAnnotationField ? '收起備註' : '+ 備註' }}
        </button>
      </div>
    </div>

    <Transition name="slide-up">
      <div v-if="showTagDropdown" class="tag-dropdown">
        <div class="tag-list">
          <TagBadge
            v-for="tag in availableTags"
            :key="tag"
            :tag="tag"
            @click="toggleTag(tag)"
          />
          <span v-if="availableTags.length === 0 && allTags.length > 0" class="no-tags">
            已全選
          </span>
        </div>
        <div class="new-tag-row">
          <input
            v-model="newTagInput"
            class="input new-tag-input"
            placeholder="新增標籤..."
            @keydown.enter.prevent="addNewTag"
          />
          <button class="btn btn-secondary btn-sm" @click="addNewTag">新增</button>
        </div>
      </div>
    </Transition>

    <Transition name="slide-up">
      <textarea
        v-if="showAnnotationField"
        v-model="annotation"
        class="input annotation-input"
        placeholder="補充備註..."
        rows="2"
      />
    </Transition>
  </div>
</template>

<style scoped>
.note-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.content-input {
  width: 100%;
}

.submit-btn {
  flex-shrink: 0;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-card);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.suggestion-item:hover {
  background: rgba(0, 122, 255, 0.06);
}

.suggestion-content {
  flex: 1;
  font-size: 14px;
}

.suggestion-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(0, 122, 255, 0.1);
  color: var(--color-primary);
}

.tags-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.selected-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-actions {
  display: flex;
  gap: 6px;
}

.tag-dropdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.tag-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.no-tags {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.new-tag-row {
  display: flex;
  gap: 8px;
}

.new-tag-input {
  flex: 1;
  padding: 6px 10px;
  font-size: 13px;
}

.annotation-input {
  resize: vertical;
  min-height: 60px;
}
</style>
