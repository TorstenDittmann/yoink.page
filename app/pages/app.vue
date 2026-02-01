<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const image = ref('')
const html = ref('')
const isLoading = ref(false)
const error = ref('')
interface UsageResponse {
  count: number
  limit: number
  remaining: number
  hasReachedLimit: boolean
}

const usage = ref<UsageResponse>({ count: 0, limit: 5, remaining: 5, hasReachedLimit: false })

// Fetch usage on mount
onMounted(async () => {
  try {
    const data = await $fetch<UsageResponse>('/api/usage')
    usage.value = data
  } catch {
    // Not authenticated or error
  }
})

function isFetchError(err: unknown): err is { statusMessage: string } {
  return typeof err === 'object' && err !== null && 'statusMessage' in err
}

interface ConvertResponse {
  html: string
}

const handleUpload = async (uploadedImage: string) => {
  image.value = uploadedImage
  isLoading.value = true
  error.value = ''

  try {
    const result = await $fetch<ConvertResponse>('/api/convert', {
      method: 'POST',
      body: { image: uploadedImage, isDemo: false }
    })

    html.value = result.html

    // Refresh usage
    const usageData = await $fetch<UsageResponse>('/api/usage')
    usage.value = usageData
  } catch (err: unknown) {
    error.value = isFetchError(err) ? err.statusMessage : 'Conversion failed'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="app-page">
    <div class="container">
      <div class="header">
        <h1>Screenshot to Code</h1>
        <div class="usage-badge">
          <span
            v-if="usage.hasReachedLimit"
            class="limit-reached"
          >
            Daily limit reached
          </span>
          <span v-else>
            {{ usage.remaining }} conversions remaining today
          </span>
        </div>
      </div>

      <UploadZone
        v-if="!html && !isLoading"
        @upload="handleUpload"
      />

      <div
        v-if="isLoading"
        class="loading"
      >
        <div class="spinner" />
        <p>AI is analyzing your screenshot...</p>
        <p class="hint">
          This usually takes 5-15 seconds
        </p>
      </div>

      <div
        v-if="error"
        class="error"
      >
        {{ error }}
      </div>

      <div
        v-if="html"
        class="results"
      >
        <div class="preview-section">
          <h2>Live Preview</h2>
          <LivePreview :html="html" />
        </div>

        <div class="code-section">
          <CodeViewer :html="html" />
        </div>

        <button
          class="reset-btn"
          @click="image = ''; html = ''"
        >
          Convert Another
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-page {
  min-height: calc(100vh - 200px);
  padding: 40px 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.usage-badge {
  padding: 8px 16px;
  background: #1a1a1a;
  border-radius: 20px;
  font-size: 14px;
  color: #888;
}

.limit-reached {
  color: #ff4444;
}

.loading {
  text-align: center;
  padding: 80px 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #333;
  border-top-color: #f59e0a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading p {
  color: #fff;
  font-size: 16px;
  margin: 0 0 8px;
}

.loading .hint {
  color: #666;
  font-size: 14px;
}

.error {
  padding: 16px;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 8px;
  color: #ff4444;
  margin-bottom: 20px;
}

.results {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.preview-section,
.code-section {
  min-height: 500px;
}

.preview-section h2 {
  font-size: 16px;
  color: #888;
  margin: 0 0 16px;
  font-weight: 500;
}

.reset-btn {
  grid-column: 1 / -1;
  padding: 16px 32px;
  background: #f59e0a;
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.reset-btn:hover {
  opacity: 0.9;
}

@media (max-width: 900px) {
  .results {
    grid-template-columns: 1fr;
  }
}
</style>
