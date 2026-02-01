<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  html: string
}>()

const previewUrl = ref('')
const isLoading = ref(false)
const error = ref('')

const generatePreview = async () => {
  if (!props.html) return

  isLoading.value = true
  error.value = ''

  try {
    const htmlContent = await $fetch('/api/preview', {
      method: 'POST',
      body: { html: props.html }
    })

    // Create a blob URL from the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' })
    previewUrl.value = URL.createObjectURL(blob)
  } catch (err) {
    error.value = 'Failed to generate preview'
    console.error('Preview generation error:', err)
  } finally {
    isLoading.value = false
  }
}

// Generate preview when html changes
watch(() => props.html, generatePreview, { immediate: true })

// Clean up blob URL on unmount
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="preview-container">
    <div
      v-if="isLoading"
      class="loading-state"
    >
      <div class="spinner" />
      <p>Generating preview...</p>
    </div>

    <div
      v-else-if="error"
      class="error-state"
    >
      <p>{{ error }}</p>
    </div>

    <iframe
      v-else-if="previewUrl"
      :src="previewUrl"
      class="preview-iframe"
      sandbox="allow-scripts"
      title="Component Preview"
    />
  </div>
</template>

<style scoped>
.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  flex: 1;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #333;
  border-top-color: #f59e0a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  color: #ff4444;
}
</style>
