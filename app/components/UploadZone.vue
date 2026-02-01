<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  upload: [image: string]
}>()

const isDragging = ref(false)
const isPasting = ref(false)

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  console.log('[UPLOADZONE] Drop event, files:', e.dataTransfer?.files?.length)

  const files = e.dataTransfer?.files
  if (files && files[0]) {
    processFile(files[0])
  } else {
    console.log('[UPLOADZONE] No files in drop event')
  }
}

const handleFileSelect = (e: Event) => {
  console.log('[UPLOADZONE] File select event')
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files[0]) {
    processFile(files[0])
  } else {
    console.log('[UPLOADZONE] No files selected')
  }
}

const processFile = (file: File) => {
  console.log('[UPLOADZONE] Processing file:', file.name, 'type:', file.type)

  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    console.log('[UPLOADZONE] File read complete, emitting upload event, data length:', result?.length)
    emit('upload', result)
  }
  reader.onerror = (e) => {
    console.error('[UPLOADZONE] FileReader error:', e)
  }
  reader.readAsDataURL(file)
}

const handlePaste = (e: ClipboardEvent) => {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      if (blob) {
        isPasting.value = true
        processFile(blob)
        setTimeout(() => isPasting.value = false, 500)
      }
    }
  }
}

onMounted(() => {
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)
})
</script>

<template>
  <div
    class="upload-zone"
    :class="{ dragging: isDragging, pasting: isPasting }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <input
      type="file"
      accept="image/*"
      class="file-input"
      @change="handleFileSelect"
    >
    <div class="content">
      <svg
        class="icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
          stroke-width="2"
        />
        <polyline
          points="17 8 12 3 7 8"
          stroke-width="2"
        />
        <line
          x1="12"
          y1="3"
          x2="12"
          y2="15"
          stroke-width="2"
        />
      </svg>
      <p class="title">
        Drop your screenshot here
      </p>
      <p class="subtitle">
        or click to browse
      </p>
      <p class="hint">
        Supports: PNG, JPG, GIF (Cmd+V to paste)
      </p>
    </div>
  </div>
</template>

<style scoped>
.upload-zone {
  position: relative;
  border: 2px dashed #333;
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
  background: #0d0d0d;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-zone:hover,
.upload-zone.dragging {
  border-color: #f59e0a;
  background: rgba(245, 158, 10, 0.05);
}

.upload-zone.pasting {
  border-color: #f59e0a;
  background: rgba(245, 158, 10, 0.05);
  transform: scale(0.98);
}

.file-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.content {
  pointer-events: none;
}

.icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 20px;
  color: #666;
}

.title {
  font-size: 18px;
  font-weight: 500;
  color: #fff;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: #888;
  margin: 0 0 16px;
}

.hint {
  font-size: 12px;
  color: #555;
  margin: 0;
}
</style>
