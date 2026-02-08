<script setup lang="ts">
defineProps<{
  tag: string
  removable?: boolean
  active?: boolean
}>()

defineEmits<{
  remove: []
  click: []
}>()

const tagColors: Record<string, string> = {}
const colorPool = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE',
  '#5856D6', '#FF2D55', '#00C7BE', '#30B0C7', '#A2845E',
]

function getColor(tag: string): string {
  let color = tagColors[tag]
  if (!color) {
    const idx = Object.keys(tagColors).length % colorPool.length
    color = colorPool[idx] ?? colorPool[0]!
    tagColors[tag] = color
  }
  return color
}
</script>

<template>
  <span
    class="tag-badge"
    :class="{ active }"
    :style="{ '--tag-color': getColor(tag) }"
    @click="$emit('click')"
  >
    {{ tag }}
    <button v-if="removable" class="remove-btn" @click.stop="$emit('remove')">×</button>
  </span>
</template>

<style scoped>
.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: color-mix(in srgb, var(--tag-color) 12%, transparent);
  color: var(--tag-color);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tag-badge.active {
  background: var(--tag-color);
  color: #fff;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
  color: inherit;
  opacity: 0.7;
}

.remove-btn:hover {
  opacity: 1;
}
</style>
