<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Note } from '../types'
import { useNotes } from '../composables/useNotes'
import { useTags } from '../composables/useTags'
import { useMemory } from '../composables/useMemory'
import TagBadge from '../components/TagBadge.vue'

const { notes, deleteNote, deleteNotes, clearAll, importNotes, exportNotes } = useNotes()
const { allTags } = useTags()
const { clearMemory } = useMemory()

const searchQuery = ref('')
const filterTag = ref<string | null>(null)
const selectedIds = ref<Set<string>>(new Set())
const showConfirmClear = ref(false)

const filteredNotes = computed(() => {
  let result = [...notes.value].sort((a, b) => b.createdAt - a.createdAt)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(n =>
      n.content.toLowerCase().includes(q) ||
      n.annotation.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    )
  }
  if (filterTag.value) {
    result = result.filter(n => n.tags.includes(filterTag.value!))
  }
  return result
})

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

function selectAll() {
  if (selectedIds.value.size === filteredNotes.value.length) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(filteredNotes.value.map(n => n.id))
  }
}

function batchDelete() {
  if (selectedIds.value.size === 0) return
  if (!confirm(`確定要刪除 ${selectedIds.value.size} 則筆記？`)) return
  deleteNotes([...selectedIds.value])
  selectedIds.value = new Set()
}

function handleExport() {
  const data = exportNotes()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nonote-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as Note[]
      if (!Array.isArray(data)) {
        alert('檔案格式不正確')
        return
      }
      if (!confirm(`確定要匯入 ${data.length} 則筆記？（將取代現有資料）`)) return
      importNotes(data)
      alert('匯入成功！')
    } catch {
      alert('讀取檔案失敗')
    }
  }
  input.click()
}

function handleClearAll() {
  clearAll()
  clearMemory()
  localStorage.removeItem('nonote-custom-tags')
  localStorage.removeItem('nonote-pomodoro-today')
  showConfirmClear.value = false
  alert('已清除所有資料')
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="settings-view">
    <h1 class="page-title">設定</h1>

    <!-- Search & Filter -->
    <div class="card search-section">
      <h2 class="section-title">搜尋筆記</h2>
      <input
        v-model="searchQuery"
        class="input"
        placeholder="搜尋內容、備註或標籤..."
      />
      <div v-if="allTags.length > 0" class="filter-tags">
        <TagBadge
          v-for="tag in allTags"
          :key="tag"
          :tag="tag"
          :active="filterTag === tag"
          @click="filterTag = filterTag === tag ? null : tag"
        />
      </div>
    </div>

    <!-- Note list with batch operations -->
    <div class="card notes-section">
      <div class="notes-header">
        <h2 class="section-title" style="margin-bottom: 0">
          筆記列表（{{ filteredNotes.length }}）
        </h2>
        <div class="notes-actions">
          <button class="btn btn-secondary btn-sm" @click="selectAll">
            {{ selectedIds.size === filteredNotes.length && filteredNotes.length > 0 ? '取消全選' : '全選' }}
          </button>
          <button
            v-if="selectedIds.size > 0"
            class="btn btn-danger btn-sm"
            @click="batchDelete"
          >
            刪除 ({{ selectedIds.size }})
          </button>
        </div>
      </div>
      <div class="notes-list">
        <div
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-row"
          :class="{ selected: selectedIds.has(note.id) }"
          @click="toggleSelect(note.id)"
        >
          <input
            type="checkbox"
            :checked="selectedIds.has(note.id)"
            class="note-checkbox"
            @click.stop
            @change="toggleSelect(note.id)"
          />
          <div class="note-info">
            <span class="note-text">{{ note.content }}</span>
            <div class="note-meta">
              <span class="note-date">{{ formatDate(note.createdAt) }}</span>
              <TagBadge v-for="tag in note.tags" :key="tag" :tag="tag" />
            </div>
          </div>
          <button class="delete-single" @click.stop="deleteNote(note.id)">🗑️</button>
        </div>
        <div v-if="filteredNotes.length === 0" class="no-results">
          沒有找到符合的筆記
        </div>
      </div>
    </div>

    <!-- Data management -->
    <div class="card data-section">
      <h2 class="section-title">資料管理</h2>
      <div class="data-actions">
        <button class="btn btn-secondary" @click="handleExport">
          匯出 JSON
        </button>
        <button class="btn btn-secondary" @click="handleImport">
          匯入 JSON
        </button>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="card danger-section">
      <h2 class="section-title" style="color: var(--color-danger)">危險區域</h2>
      <p class="danger-hint">清除所有資料後無法復原，請先匯出備份。</p>
      <button
        v-if="!showConfirmClear"
        class="btn btn-danger"
        @click="showConfirmClear = true"
      >
        清除所有資料
      </button>
      <div v-else class="confirm-clear">
        <span>確定要清除所有資料嗎？</span>
        <button class="btn btn-danger btn-sm" @click="handleClearAll">確定清除</button>
        <button class="btn btn-secondary btn-sm" @click="showConfirmClear = false">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.notes-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.notes-actions {
  display: flex;
  gap: 8px;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 400px;
  overflow-y: auto;
}

.note-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
}

.note-row:hover {
  background: rgba(0, 0, 0, 0.03);
}

.note-row.selected {
  background: rgba(0, 122, 255, 0.06);
}

.note-checkbox {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.note-info {
  flex: 1;
  min-width: 0;
}

.note-text {
  font-size: 14px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.note-date {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.delete-single {
  flex-shrink: 0;
  font-size: 14px;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.note-row:hover .delete-single {
  opacity: 0.6;
}

.delete-single:hover {
  opacity: 1 !important;
}

.no-results {
  text-align: center;
  padding: 24px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.data-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-actions {
  display: flex;
  gap: 12px;
}

.danger-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(255, 59, 48, 0.2);
}

.danger-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.confirm-clear {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 14px;
  color: var(--color-danger);
}
</style>
