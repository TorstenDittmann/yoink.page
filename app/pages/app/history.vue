<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

interface Conversion {
  id: string
  htmlOutput: string
  createdAt: string
}

const conversions = ref<Conversion[]>([])
const isLoading = ref(true)
const error = ref('')
const selectedConversion = ref<Conversion | null>(null)

function isFetchError(err: unknown): err is { statusMessage: string } {
  return typeof err === 'object' && err !== null && 'statusMessage' in err
}

interface HistoryResponse {
  conversions: Conversion[]
}

const fetchHistory = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const data = await $fetch<HistoryResponse>('/api/history')
    conversions.value = data.conversions
  } catch (err: unknown) {
    error.value = isFetchError(err) ? err.statusMessage : 'Failed to load history'
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const viewConversion = (conversion: Conversion) => {
  selectedConversion.value = conversion
}

const closeModal = () => {
  selectedConversion.value = null
}

const goBack = () => {
  navigateTo('/app')
}

onMounted(() => {
  fetchHistory()
})
</script>

<template>
  <div class="history-page">
    <div class="container">
      <div class="header">
        <div class="header-left">
          <button
            class="back-btn"
            @click="goBack"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Converter
          </button>
          <h1>Conversion History</h1>
        </div>
        <div class="history-count">
          {{ conversions.length }} conversions
        </div>
      </div>

      <div
        v-if="isLoading"
        class="loading"
      >
        <div class="spinner" />
        <p>Loading your history...</p>
      </div>

      <div
        v-else-if="error"
        class="error"
      >
        {{ error }}
      </div>

      <div
        v-else-if="conversions.length === 0"
        class="empty-state"
      >
        <svg
          class="empty-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3>No conversions yet</h3>
        <p>Start converting screenshots to code and they will appear here.</p>
        <button
          class="cta-btn"
          @click="goBack"
        >
          Convert Your First Screenshot
        </button>
      </div>

      <div
        v-else
        class="conversions-grid"
      >
        <div
          v-for="conversion in conversions"
          :key="conversion.id"
          class="conversion-card"
          @click="viewConversion(conversion)"
        >
          <div class="preview-wrapper">
            <div
              class="preview-content"
              v-html="conversion.htmlOutput.slice(0, 500) + '...'"
            />
          </div>
          <div class="card-footer">
            <span class="date">{{ formatDate(conversion.createdAt) }}</span>
            <button class="view-btn">
              View Code
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for viewing conversion -->
    <div
      v-if="selectedConversion"
      class="modal-overlay"
      @click="closeModal"
    >
      <div
        class="modal"
        @click.stop
      >
        <div class="modal-header">
          <h2>Converted {{ formatDate(selectedConversion.createdAt) }}</h2>
          <button
            class="close-btn"
            @click="closeModal"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="preview-section">
            <h3>Live Preview</h3>
            <LivePreview :html="selectedConversion.htmlOutput" />
          </div>
          <div class="code-section">
            <CodeViewer :html="selectedConversion.htmlOutput" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-page {
  min-height: calc(100vh - 200px);
  padding: 40px 20px;
  background: #0a0a0a;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #333;
  border-radius: 8px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  width: fit-content;
}

.back-btn:hover {
  border-color: #f59e0a;
  color: #f59e0a;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.history-count {
  padding: 8px 16px;
  background: #1a1a1a;
  border-radius: 20px;
  font-size: 14px;
  color: #888;
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
  color: #666;
  font-size: 16px;
}

.error {
  padding: 16px;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 8px;
  color: #ff4444;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  color: #333;
}

.empty-state h3 {
  font-size: 20px;
  color: #fff;
  margin: 0 0 8px;
}

.empty-state p {
  color: #666;
  margin: 0 0 24px;
}

.cta-btn {
  padding: 12px 24px;
  background: #f59e0a;
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.cta-btn:hover {
  opacity: 0.9;
}

.conversions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.conversion-card {
  background: #111;
  border: 1px solid #222;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.conversion-card:hover {
  border-color: #f59e0a;
  transform: translateY(-2px);
}

.preview-wrapper {
  height: 200px;
  overflow: hidden;
  background: #fff;
  position: relative;
}

.preview-content {
  padding: 20px;
  transform: scale(0.5);
  transform-origin: top left;
  width: 200%;
}

.preview-wrapper::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, transparent, #fff);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #111;
}

.date {
  font-size: 13px;
  color: #666;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #333;
  border-radius: 6px;
  color: #f59e0a;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background: rgba(245, 158, 10, 0.1);
  border-color: #f59e0a;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  z-index: 100;
}

.modal {
  background: #111;
  border: 1px solid #333;
  border-radius: 16px;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #222;
}

.modal-header h2 {
  font-size: 18px;
  color: #fff;
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid #333;
  border-radius: 8px;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  border-color: #ff4444;
  color: #ff4444;
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px;
  overflow-y: auto;
}

.preview-section h3 {
  font-size: 14px;
  color: #888;
  margin: 0 0 12px;
  font-weight: 500;
}

.code-section {
  min-height: 400px;
}

@media (max-width: 900px) {
  .modal-body {
    grid-template-columns: 1fr;
  }

  .conversions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
