<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePomodoro } from '../composables/usePomodoro'
import { useNotes } from '../composables/useNotes'
import { useMemory } from '../composables/useMemory'
import { useTags } from '../composables/useTags'
import PomodoroTimer from '../components/PomodoroTimer.vue'
import TagBadge from '../components/TagBadge.vue'

const {
  settings, phase, isRunning, completedToday, progress, timeDisplay, isOvertime,
  startWork, pause, resume, cancel, complete, skipToNext,
} = usePomodoro()
const { addNote } = useNotes()
const { getSuggestions, recordMemory } = useMemory()
const { allTags, addCustomTag } = useTags()

const showSettings = ref(false)
const noteContent = ref('')
const noteTags = ref<string[]>([])
const noteAnnotation = ref('')
const showAnnotation = ref(false)
const showTagPicker = ref(false)
const newTagInput = ref('')
const showSuggestions = ref(false)

const suggestions = computed(() => getSuggestions(noteContent.value))
const availableTags = computed(() => allTags.value.filter(t => !noteTags.value.includes(t)))

function selectSuggestion(s: { content: string; tags: string[] }) {
  noteContent.value = s.content
  noteTags.value = [...s.tags]
  showSuggestions.value = false
}

function toggleTag(tag: string) {
  const idx = noteTags.value.indexOf(tag)
  if (idx !== -1) noteTags.value.splice(idx, 1)
  else noteTags.value.push(tag)
}

function hideSuggestionsDelayed() {
  globalThis.setTimeout(() => { showSuggestions.value = false }, 200)
}

function addNewTag() {
  const tag = newTagInput.value.trim()
  if (tag && !noteTags.value.includes(tag)) {
    addCustomTag(tag)
    noteTags.value.push(tag)
    newTagInput.value = ''
  }
}

watch(phase, (val) => {
  if (val === 'break') {
    noteContent.value = '休息'
    noteTags.value = ['休息']
  } else if (val === 'work') {
    noteContent.value = ''
    noteTags.value = []
  }
})

function handleStart() {
  startWork()
}

function handleCancel() {
  cancel()
  noteContent.value = ''
  noteTags.value = []
  noteAnnotation.value = ''
}

function handleComplete() {
  const result = complete()
  saveNote(result)
}

function handleSkip() {
  const result = skipToNext()
  saveNote(result)
}

function saveNote(result: { phase: string; startTime: number; duration: number }) {
  const content = noteContent.value.trim() || (result.phase === 'break' ? '休息' : '番茄鐘')
  const tags = noteTags.value.length > 0 ? [...noteTags.value] : (result.phase === 'break' ? ['休息'] : ['番茄鐘'])
  recordMemory(content, tags)
  addNote({
    content,
    tags,
    annotation: noteAnnotation.value.trim(),
    createdAt: result.startTime,
    duration: result.duration,
    pomodoroType: result.phase as 'work' | 'break',
  })
  noteContent.value = ''
  noteTags.value = []
  noteAnnotation.value = ''
}

</script>

<template>
  <div class="pomodoro-view">
    <div class="pomodoro-header">
      <h1 class="page-title">番茄鐘</h1>
      <button class="settings-btn" @click="showSettings = !showSettings">
        ⚙️
      </button>
    </div>

    <!-- Settings Panel -->
    <Transition name="slide-up">
      <div v-if="showSettings" class="card settings-panel">
        <h3 class="section-title">計時設定</h3>
        <div class="setting-row">
          <label>工作時長（分鐘）</label>
          <input v-model.number="settings.workMinutes" type="number" min="1" max="120" class="input setting-input" />
        </div>
        <div class="setting-row">
          <label>短休息時長（分鐘）</label>
          <input v-model.number="settings.breakMinutes" type="number" min="1" max="60" class="input setting-input" />
        </div>
        <div class="setting-row">
          <label>長休息間隔（番茄數）</label>
          <input v-model.number="settings.longBreakInterval" type="number" min="1" max="10" class="input setting-input" />
        </div>
        <div class="setting-row">
          <label>長休息時長（分鐘）</label>
          <input v-model.number="settings.longBreakMinutes" type="number" min="1" max="60" class="input setting-input" />
        </div>
      </div>
    </Transition>

    <!-- Today's count -->
    <div class="today-count">
      今日完成 <strong>{{ completedToday }}</strong> 個番茄鐘
    </div>

    <!-- Timer -->
    <div class="timer-section">
      <PomodoroTimer
        v-if="phase !== 'idle'"
        :progress="progress"
        :time-display="timeDisplay"
        :phase="phase"
        :is-running="isRunning"
        :is-overtime="isOvertime"
      />

      <!-- Idle: Start button -->
      <div v-if="phase === 'idle'" class="start-section">
        <button class="start-btn" @click="handleStart">
          <span class="start-icon">▶</span>
          <span class="start-label">開始專注</span>
        </button>
        <div class="start-hint">{{ settings.workMinutes }} 分鐘</div>
      </div>
    </div>

    <!-- Note input during timing -->
    <div v-if="phase !== 'idle'" class="timing-input card">
      <div class="input-wrapper">
        <input
          v-model="noteContent"
          class="input"
          placeholder="這段時間在做什麼..."
          @focus="showSuggestions = true"
          @blur="hideSuggestionsDelayed"
          @input="showSuggestions = true"
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
      <div class="pomo-tags-row">
        <TagBadge
          v-for="tag in noteTags"
          :key="tag"
          :tag="tag"
          :removable="true"
          @remove="toggleTag(tag)"
        />
        <button class="btn btn-secondary btn-sm" @click="showTagPicker = !showTagPicker">+ 標籤</button>
        <button class="btn btn-secondary btn-sm" @click="showAnnotation = !showAnnotation">
          {{ showAnnotation ? '收起' : '+ 備註' }}
        </button>
      </div>
      <div v-if="showTagPicker" class="tag-picker">
        <div class="tag-list">
          <TagBadge v-for="tag in availableTags" :key="tag" :tag="tag" @click="toggleTag(tag)" />
        </div>
        <div class="new-tag-row">
          <input v-model="newTagInput" class="input" style="flex:1;padding:6px 10px;font-size:13px" placeholder="新標籤" @keydown.enter.prevent="addNewTag" />
          <button class="btn btn-secondary btn-sm" @click="addNewTag">新增</button>
        </div>
      </div>
      <textarea
        v-if="showAnnotation"
        v-model="noteAnnotation"
        class="input"
        placeholder="備註..."
        rows="2"
        style="resize: vertical; min-height: 50px"
      />
    </div>

    <!-- Controls during timing -->
    <div v-if="phase !== 'idle'" class="controls">
      <button class="control-btn cancel" @click="handleCancel" title="取消">
        ✕
      </button>
      <button
        class="control-btn"
        @click="isRunning ? pause() : resume()"
        :title="isRunning ? '暫停' : '繼續'"
      >
        {{ isRunning ? '⏸' : '▶' }}
      </button>
      <button class="control-btn" @click="handleSkip" title="下一階段">
        ⏭
      </button>
      <button class="control-btn complete" @click="handleComplete" title="完成">
        ✓
      </button>
    </div>
  </div>
</template>

<style scoped>
.pomodoro-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pomodoro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-btn {
  font-size: 24px;
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.settings-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.setting-row label {
  font-size: 14px;
  color: var(--color-text);
}

.setting-input {
  width: 80px;
  text-align: center;
  padding: 8px;
}

.today-count {
  text-align: center;
  font-size: 15px;
  color: var(--color-text-secondary);
}

.today-count strong {
  color: var(--color-primary);
  font-size: 18px;
}

.timer-section {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.start-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.start-btn {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007AFF, #409CFF);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 24px rgba(0, 122, 255, 0.3);
  transition: all 0.3s;
}

.start-btn:hover {
  transform: scale(1.04);
  box-shadow: 0 6px 32px rgba(0, 122, 255, 0.4);
}

.start-btn:active {
  transform: scale(0.98);
}

.start-icon {
  font-size: 36px;
}

.start-label {
  font-size: 18px;
  font-weight: 600;
}

.start-hint {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.timing-input {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-wrapper {
  position: relative;
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
  max-height: 160px;
  overflow-y: auto;
  margin-top: 4px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
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

.pomo-tags-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.tag-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.new-tag-row {
  display: flex;
  gap: 8px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
}

.control-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-card);
  box-shadow: var(--shadow-sm);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  box-shadow: var(--shadow-md);
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}

.control-btn.cancel {
  color: var(--color-danger);
}

.control-btn.complete {
  background: var(--color-success);
  color: #fff;
}
</style>
