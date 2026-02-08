<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Note } from '../types'
import { useNotes } from '../composables/useNotes'
import { useTags } from '../composables/useTags'
import TagBadge from './TagBadge.vue'

const props = defineProps<{
  note: Note
  calculatedDuration?: number
}>()

const { updateNote, deleteNote } = useNotes()
const { allTags, addCustomTag } = useTags()

const isEditing = ref(false)
const editContent = ref('')
const editAnnotation = ref('')
const editTags = ref<string[]>([])
const editTime = ref('')
const editManualDuration = ref<string>('')
const newTagInput = ref('')
const showAddTag = ref(false)
const isEditingDuration = ref(false)
const inlineDurationInput = ref('')

// Display duration: manualDuration > calculatedDuration
const displayDuration = computed(() => {
  if (props.note.manualDuration != null) return props.note.manualDuration
  if (props.calculatedDuration != null) return props.calculatedDuration
  return undefined
})

const isManual = computed(() => props.note.manualDuration != null)

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} 分鐘`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} 小時 ${m} 分鐘` : `${h} 小時`
}

function startEditDuration() {
  inlineDurationInput.value = displayDuration.value != null ? String(displayDuration.value) : ''
  isEditingDuration.value = true
}

function saveDurationInline() {
  const val = inlineDurationInput.value.trim()
  if (val === '') {
    // Clear manual duration
    updateNote(props.note.id, { manualDuration: undefined })
  } else {
    const num = parseInt(val, 10)
    if (!isNaN(num) && num >= 0) {
      updateNote(props.note.id, { manualDuration: num })
    }
  }
  isEditingDuration.value = false
}

function cancelDurationInline() {
  isEditingDuration.value = false
}

function startEdit() {
  editContent.value = props.note.content
  editAnnotation.value = props.note.annotation
  editTags.value = [...props.note.tags]
  editTime.value = toLocalDatetime(props.note.createdAt)
  editManualDuration.value = props.note.manualDuration != null ? String(props.note.manualDuration) : ''
  isEditing.value = true
}

function saveEdit() {
  const manualDur = editManualDuration.value.trim()
  const manualDuration = manualDur !== '' ? parseInt(manualDur, 10) : undefined
  updateNote(props.note.id, {
    content: editContent.value.trim() || props.note.content,
    annotation: editAnnotation.value.trim(),
    tags: editTags.value,
    createdAt: new Date(editTime.value).getTime() || props.note.createdAt,
    manualDuration: manualDuration != null && !isNaN(manualDuration) ? manualDuration : undefined,
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
      <!-- Interval duration (auto-calculated or manual) -->
      <div v-if="displayDuration != null && !isEditingDuration" class="note-interval" @click="startEditDuration" title="點擊修改持續時間">
        ⏱ {{ formatDuration(displayDuration) }}
        <span v-if="isManual" class="manual-badge">(手動)</span>
      </div>
      <div v-else-if="calculatedDuration == null && note.manualDuration == null && !isEditingDuration" class="note-interval last-note" @click="startEditDuration" title="當天最後一筆，點擊可手動設定">
        ⏱ —
      </div>
      <!-- Inline duration edit -->
      <div v-if="isEditingDuration" class="duration-edit-inline">
        <span>⏱</span>
        <input
          v-model="inlineDurationInput"
          type="number"
          min="0"
          class="input duration-inline-input"
          placeholder="分鐘（留空清除）"
          @keydown.enter.prevent="saveDurationInline"
          @keydown.escape="cancelDurationInline"
        />
        <button class="btn btn-primary btn-sm" @click="saveDurationInline">確定</button>
        <button class="btn btn-secondary btn-sm" @click="cancelDurationInline">取消</button>
      </div>
      <!-- Pomodoro duration (separate display) -->
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
        <div class="edit-time-row">
          <label class="edit-label">持續時間</label>
          <input
            v-model="editManualDuration"
            type="number"
            min="0"
            class="input duration-input"
            placeholder="自動計算（留空）"
          />
          <span class="edit-label">分鐘</span>
        </div>
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

.note-interval {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 6px;
  transition: background 0.15s;
}

.note-interval:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--color-primary);
}

.note-interval.last-note {
  opacity: 0.4;
}

.manual-badge {
  font-size: 11px;
  color: var(--color-warning);
}

.duration-edit-inline {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.duration-inline-input {
  width: 120px;
  padding: 4px 8px;
  font-size: 13px;
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

.duration-input {
  width: 120px;
  font-size: 13px;
  padding: 8px;
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
