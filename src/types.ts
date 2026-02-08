export interface Note {
  id: string
  content: string
  tags: string[]
  annotation: string
  createdAt: number
  updatedAt: number
  duration?: number
  pomodoroType?: 'work' | 'break'
}

export interface PomodoroSettings {
  workMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
}

export interface NoteMemory {
  content: string
  tags: string[]
  useCount: number
}
