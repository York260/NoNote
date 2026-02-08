<script setup lang="ts">
import { ref } from 'vue'
import type { Note } from '../types'
import { useNotes } from '../composables/useNotes'
import { useTags } from '../composables/useTags'
import TagBadge from './TagBadge.vue'

const props = defineProps<{ note: Note }>()
const { updateNote, deleteNote } = useNotes()
const { allTags, addCustomTag } = useTags()

const isEditing = ref(false)
const editContent = ref('')
const editAnnotation = ref('')
const editTags = ref<string[]>([])
const editTime = ref('')
const newTagInput = ref('')
const showAddTag = ref(false)

function startEdit() {
  editContent.value = props.note.content
  editAnnotation.value = props.note.annotation
  editTags.value = [...props.note.tags]
  editTime.value = toLocalDatetime(props.note.createdAt)
  isEditing.value = true
}

function saveEdit() {
  updateNote(props.note.id, {
    content: editContent.value.trim() || props.note.content,
    annotation: editAnnotation.value.trim(),
    tags: editTags.value,
    createdAt: new Date(editTime.value).getTime() || props.note.createdAt,
  })
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}

function removeEditTag(tag: string) {
  editTags.value = editTags.value.filter(t => t !== tag)
}

function addEditTag(tag: string) {
  if (!editTags.value.includes(tag)) {
    editTags.value.push(tag)
  }
}

function addNewEditTag() {
  const tag = newTagInput.value.trim()
  if (tag && !editTags.value.includes(tag)) {
    addCustomTag(tag)
    editTags.value.push(tag)
    newTagInput.value = ''
    showAddTag.value = false
  }
}

function handleEditTime() {
  const el = document.getElementById(`time-edit-${props.note.id}`) as HTMLInputElement | null
  el?.showPicker?.()
}

function toLocalDatetime(ts: number): string {
  const d = new Date(ts)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="note-card card">
    <template v-if="!isEditing">
      <div class="note-header">
        <span class="note-time" @click="startEdit" title="點擊編輯">
          {{ formatTime(note.createdAt) }}
        </span>
        <div class="note-tags">
          <TagBadge v-for="tag in note.tags" :key="tag" :tag="tag" />
        </div>
        <div class="note-actions">
          <button class="action-btn" @click="startEdit" title="編輯">✏️</button>
          <button class="action-btn" @click="deleteNote(note.id)" title="刪除">🗑️</button>
        </div>
      </div>
      <div class="note-content">{{ note.content }}</div>
      <div v-if="note.annotation" class="note-annotation">{{ note.annotation }}</div>
      <div v-if="note.duration" class="note-duration">
        {{ note.pomodoroType === 'break' ? '🔵 休息' : '🍅 專注' }}
        {{ note.duration }} 分鐘
      </div>
    </template>

    <template v-else>
      <div class="edit-form">
        <div class="edit-time-row">
          <label class="edit-label">時間</label>
          <input
            :id="`time-edit-${note.id}`"
            v-model="editTime"
            type="datetime-local"
            class="input time-input"
            @click="handleEditTime"
          />
        </div>
        <input v-model="editContent" class="input" placeholder="筆記內容" />
        <textarea
          v-model="editAnnotation"
          class="input annotation-edit"
          placeholder="備註"
          rows="2"
        />
        <div class="edit-tags">
          <TagBadge
            v-for="tag in editTags"
            :key="tag"
            :tag="tag"
            :removable="true"
            @remove="removeEditTag(tag)"
          />
          <button class="btn btn-secondary btn-sm" @click="showAddTag = !showAddTag">+ 標籤</button>
        </div>
        <div v-if="showAddTag" class="add-tag-section">
          <div class="tag-options">
            <TagBadge
              v-for="tag in allTags.filter(t => !editTags.includes(t))"
              :key="tag"
              :tag="tag"
              @click="addEditTag(tag)"
            />
          </div>
          <div class="new-tag-row">
            <input
              v-model="newTagInput"
              class="input new-tag-input"
              placeholder="新標籤名稱"
              @keydown.enter.prevent="addNewEditTag"
            />
            <button class="btn btn-secondary btn-sm" @click="addNewEditTag">新增</button>
          </div>
        </div>
        <div class="edit-actions">
          <button class="btn btn-secondary btn-sm" @click="cancelEdit">取消</button>
          <button class="btn btn-primary btn-sm" @click="saveEdit">儲存</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.note-card {
  transition: box-shadow 0.2s;
}

.note-card:hover {
  box-shadow: var(--shadow-md);
}

.note-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.note-time {
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.note-time:hover {
  color: var(--color-primary);
}

.note-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  flex: 1;
}

.note-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.note-card:hover .note-actions {
  opacity: 1;
}

.action-btn {
  font-size: 14px;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.15s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.note-content {
  font-size: 15px;
  line-height: 1.6;
}

.note-annotation {
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  padding-left: 12px;
  border-left: 2px solid var(--color-border);
}

.note-duration {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-time-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.time-input {
  flex: 1;
  font-size: 13px;
}

.annotation-edit {
  resize: vertical;
  min-height: 50px;
}

.edit-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.add-tag-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-options {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
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

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
