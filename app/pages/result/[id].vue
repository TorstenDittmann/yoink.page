<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const conversion = ref<{ id: string, htmlOutput: string, createdAt: string } | null>(null)
const isLoading = ref(true)
const error = ref('')
const activeView = ref<'preview' | 'code'>('preview')

const fetchConversion = async () => {
  try {
    const data = await $fetch(`/api/conversion/${id}`)
    conversion.value = data.conversion
  } catch (err: unknown) {
    const message = err instanceof Error && 'statusMessage' in err
      ? (err as { statusMessage: string }).statusMessage
      : 'Failed to load conversion'
    error.value = message
  } finally {
    isLoading.value = false
  }
}

const copyUrl = () => {
  navigator.clipboard.writeText(window.location.href)
}

onMounted(() => {
  fetchConversion()
})

useHead({
  title: 'Shared Result - yoink',
  meta: [
    { property: 'og:title', content: 'UI Screenshot converted to code' },
    { property: 'og:description', content: 'View this UI conversion on fromscreen.dev' }
  ]
})
</script>

<template>
  <div class="result-page">
    <div
      v-if="isLoading"
      class="loading"
    >
      <div class="spinner" />
      <p>Loading...</p>
    </div>

    <div
      v-else-if="error"
      class="error"
    >
      {{ error }}
    </div>

    <div
      v-else-if="conversion"
      class="result-container"
    >
      <div class="result-header">
        <NuxtLink to="/" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </NuxtLink>

        <div class="view-toggle">
          <button :class="{ active: activeView === 'preview' }" @click="activeView = 'preview'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Preview
          </button>
          <button :class="{ active: activeView === 'code' }" @click="activeView = 'code'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Code
          </button>
        </div>

        <button class="action-btn" @click="copyUrl">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </button>
      </div>

      <div class="result-content">
        <div
          class="preview-panel"
          :class="{ active: activeView === 'preview' }"
        >
          <LivePreview :html="conversion.htmlOutput" />
        </div>
        <div
          class="code-panel"
          :class="{ active: activeView === 'code' }"
        >
          <CodeViewer :html="conversion.htmlOutput" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-page {
  height: 100vh;
  background: #0a0a0a;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #888;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top-color: #f59e0a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: #ff4444;
}

.result-container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-shrink: 0;
  gap: 12px;
}

.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #888;
  text-decoration: none;
  transition: color 0.2s;
  flex-shrink: 0;
}

.back-link:hover {
  color: #f59e0a;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #f59e0a;
  color: #f59e0a;
}

.view-toggle {
  display: flex;
  gap: 8px;
  background: #1a1a1a;
  padding: 6px;
  border-radius: 12px;
  flex-shrink: 0;
}

.view-toggle button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #888;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-toggle button.active {
  background: #252525;
  color: #f59e0a;
}

.view-toggle button:hover:not(.active) {
  color: #fff;
}

.result-content {
  background: #111;
  border: 1px solid #222;
  border-radius: 16px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.preview-panel, .code-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: absolute;
  inset: 0;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease;
}

.preview-panel.active, .code-panel.active {
  opacity: 1;
  visibility: visible;
}
</style>
