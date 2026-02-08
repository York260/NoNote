<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js'

Chart.register(ArcElement, Tooltip, Legend, PieController)

const props = defineProps<{
  data: Record<string, number>
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const colors = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE',
  '#5856D6', '#FF2D55', '#00C7BE', '#30B0C7', '#A2845E',
]

const hasData = computed(() => Object.keys(props.data).length > 0)

function renderChart() {
  if (!canvasRef.value || !hasData.value) return
  if (chartInstance) chartInstance.destroy()

  const labels = Object.keys(props.data)
  const values = Object.values(props.data)

  chartInstance = new Chart(canvasRef.value, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { size: 13, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.7)',
          cornerRadius: 8,
          padding: 10,
          titleFont: { size: 13 },
          bodyFont: { size: 13 },
        },
      },
    },
  })
}

onMounted(renderChart)
watch(() => props.data, renderChart, { deep: true })
</script>

<template>
  <div class="pie-chart">
    <div v-if="!hasData" class="no-data">
      <p>尚無標籤資料</p>
    </div>
    <canvas v-show="hasData" ref="canvasRef" />
  </div>
</template>

<style scoped>
.pie-chart {
  max-width: 360px;
  margin: 0 auto;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
