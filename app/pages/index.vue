<script setup lang="ts">
interface StreamMessage {
  type: "id" | "chunk" | "done" | "error";
  id?: string;
  content?: string;
  html?: string;
  message?: string;
}

interface FetchError {
  statusMessage?: string;
  message?: string;
}

const uploadedImage = ref("");
const generatedHtml = ref("");
const isLoading = ref(false);
const error = ref("");
const isResultsVisible = ref(false);
const activeView = ref<"preview" | "code">("preview");
const conversionId = ref("");

// Streaming progress tracking
const streamProgress = ref(0);
const receivedChars = ref(0);
const estimatedTotalChars = ref(5000); // Initial estimate, will adjust
const isStreaming = ref(false);
const hasReceivedContent = ref(false);

const router = useRouter();

// Update page title during streaming
watch([isStreaming, hasReceivedContent], ([streaming, hasContent]) => {
  if (streaming && hasContent) {
    document.title = "Generating code... - yoink";
  } else if (streaming && !hasContent) {
    document.title = "Processing image... - yoink";
  } else {
    document.title = "yoink - Screenshot to Code";
  }
});

const isFetchError = (err: unknown): err is FetchError => {
  return (
    typeof err === "object" &&
    err !== null &&
    ("statusMessage" in err || "message" in err)
  );
};

const handleUpload = async (image: string) => {
  console.log("[CLIENT] handleUpload called, image length:", image?.length);
  uploadedImage.value = image;
  isLoading.value = true;
  isStreaming.value = true;
  error.value = "";
  isResultsVisible.value = false;
  conversionId.value = "";
  generatedHtml.value = "";
  streamProgress.value = 0;
  receivedChars.value = 0;
  estimatedTotalChars.value = 5000;
  hasReceivedContent.value = false;

  try {
    console.log("[CLIENT] Starting streaming API call to /api/convert-stream");

    const response = await fetch("/api/convert-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body available");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        try {
          const data: StreamMessage = JSON.parse(line.slice(6));
          console.log("[CLIENT] Received message:", data.type);

          switch (data.type) {
            case "id":
              if (data.id) {
                conversionId.value = data.id;
                console.log("[CLIENT] Conversion ID received:", data.id);
              }
              break;
            case "chunk":
              if (data.content) {
                generatedHtml.value += data.content;
                receivedChars.value += data.content.length;
                hasReceivedContent.value = true;
                // Estimate progress based on received chars vs expected total
                // We expect HTML to be roughly 3-5x the size of a typical response
                streamProgress.value = Math.min(
                  95,
                  Math.round(
                    (receivedChars.value / estimatedTotalChars.value) * 100,
                  ),
                );
                scrollToBottom();
              }
              break;
            case "done":
              streamProgress.value = 100;
              if (data.html) {
                generatedHtml.value = data.html;
              }
              console.log(
                "[CLIENT] Streaming complete, redirecting to result page",
              );
              // Redirect to result page after a brief delay to show 100% completion
              setTimeout(() => {
                if (conversionId.value) {
                  router.push(`/result/${conversionId.value}`);
                }
              }, 500);
              break;
            case "error":
              throw new Error(data.message || "Conversion failed");
          }
        } catch (parseErr) {
          console.error(
            "[CLIENT] Failed to parse stream message:",
            line,
            parseErr,
          );
        }
      }
    }

    if (buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith("data: ")) {
        try {
          const data: StreamMessage = JSON.parse(line.slice(6));
          if (data.type === "done" && data.html) {
            generatedHtml.value = data.html;
            streamProgress.value = 100;
            if (conversionId.value) {
              router.push(`/result/${conversionId.value}`);
            }
          } else if (data.type === "error") {
            throw new Error(data.message || "Conversion failed");
          }
        } catch (parseErr) {
          console.error("[CLIENT] Failed to parse final buffer:", parseErr);
        }
      }
    }
  } catch (err: unknown) {
    console.error("[CLIENT] API call failed:", err);
    error.value = isFetchError(err)
      ? err.statusMessage || err.message || "Conversion failed"
      : "Conversion failed";
  } finally {
    isLoading.value = false;
    isStreaming.value = false;
    console.log("[CLIENT] handleUpload completed");
  }
};

const share = () => {
  if (conversionId.value) {
    router.push(`/result/${conversionId.value}`);
  }
};

const reset = () => {
  uploadedImage.value = "";
  generatedHtml.value = "";
  error.value = "";
  isResultsVisible.value = false;
  isStreaming.value = false;
  conversionId.value = "";
  streamProgress.value = 0;
  receivedChars.value = 0;
};

const scrollToResults = () => {
  nextTick(() => {
    const resultsEl = document.querySelector(".results-section");
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
};

const outputContainer = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  nextTick(() => {
    if (outputContainer.value) {
      outputContainer.value.scrollTop = outputContainer.value.scrollHeight;
    }
  });
};

watch(isResultsVisible, (visible) => {
  if (visible) {
    scrollToResults();
  }
});
</script>

<template>
  <div class="landing-page">
    <section class="hero">
      <div class="hero-glow" />
      <div class="grid-bg" />

      <div class="hero-content">
        <h1 class="hero-title">yoink.page</h1>

        <p class="hero-subtitle">
          Drop any UI screenshot. Get your copy in seconds.
          <br />
          <span class="powered-by">Powered by Kimi K2.5 Vision</span>
        </p>
      </div>
    </section>

    <section class="converter-section">
      <div class="converter-container">
        <div class="drop-zone-wrapper">
          <UploadZone
            v-if="!uploadedImage && !isLoading && !isResultsVisible"
            @upload="handleUpload"
          />

          <!-- Streaming States Container -->
          <div v-if="isStreaming" class="streaming-container">
            <!-- Image Processing -->
            <Transition name="fade-scale" mode="out-in">
              <div
                v-if="!hasReceivedContent"
                key="processing"
                class="processing-state"
              >
                <div class="scanning-container">
                  <img :src="uploadedImage" class="uploaded-image" />
                  <div class="scanner-line" />
                  <div class="scanner-glow" />
                </div>
                <div class="processing-text">
                  <span class="pulse-dot" />
                  Processing the image...
                </div>
              </div>

              <!-- Code Generation -->
              <div v-else key="generating" class="streaming-state">
                <div class="streaming-header">
                  <div class="streaming-status">
                    <span class="pulse-dot" />
                    <span class="status-text"
                      >Generating code<span class="dots">...</span></span
                    >
                  </div>
                </div>

                <div class="streaming-output">
                  <div ref="outputContainer" class="output-container">
                    <pre class="raw-output">{{ generatedHtml }}<span
v-if="isStreaming"
                                                                     class="typing-cursor"
                    /></pre>
                  </div>
                </div>

                <div class="streaming-stats">
                  <span class="stat-item"
                    >{{ receivedChars.toLocaleString() }} characters
                    generated</span
                  >
                  <span v-if="conversionId" class="stat-item"
                    >Conversion ID: {{ conversionId.slice(0, 8) }}...</span
                  >
                </div>
              </div>
            </Transition>
          </div>

          <!-- Error State -->
          <div v-if="error" class="error-state">
            <svg
              class="error-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" stroke-width="2" />
              <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" />
              <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2" />
            </svg>
            <p class="error-text">
              {{ error }}
            </p>
            <UButton size="sm" color="neutral" variant="outline" @click="reset">
              Try Again
            </UButton>
          </div>

          <!-- Upload Preview State -->
          <div
            v-if="uploadedImage && !isLoading && !isResultsVisible && !error"
            class="upload-preview"
          >
            <img :src="uploadedImage" alt="Uploaded screenshot" />
            <div class="preview-overlay">
              <UButton
                size="sm"
                color="primary"
                @click="handleUpload(uploadedImage)"
              >
                Convert Now
              </UButton>
              <UButton size="sm" color="neutral" variant="ghost" @click="reset">
                Change Image
              </UButton>
            </div>
          </div>
        </div>

        <!-- Results Section (shown if user manually navigates back) -->
        <div v-if="isResultsVisible && generatedHtml" class="results-section">
          <div class="results-header">
            <div class="results-header-left">
              <h2>Conversion Complete</h2>
              <div class="view-toggle">
                <button
                  class="toggle-btn"
                  :class="{ active: activeView === 'preview' }"
                  @click="activeView = 'preview'"
                >
                  <UIcon name="i-lucide-eye" class="toggle-icon" />
                  Preview
                </button>
                <button
                  class="toggle-btn"
                  :class="{ active: activeView === 'code' }"
                  @click="activeView = 'code'"
                >
                  <UIcon name="i-lucide-code" class="toggle-icon" />
                  Code
                </button>
              </div>
            </div>
            <div class="results-actions">
              <UButton
                v-if="conversionId"
                size="sm"
                color="primary"
                variant="soft"
                trailing-icon="i-lucide-share-2"
                @click="share"
              >
                Share
              </UButton>
              <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                trailing-icon="i-lucide-refresh-cw"
                @click="reset"
              >
                New Conversion
              </UButton>
            </div>
          </div>

          <div class="result-panel-large">
            <div class="panel-content-large" :class="activeView">
              <LivePreview
                v-if="activeView === 'preview'"
                :html="generatedHtml"
              />
              <CodeViewer v-else :html="generatedHtml" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <a
        href="https://twitter.com/DittmannTorsten"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      >
        made by Torsten Dittmann
      </a>
    </footer>
  </div>
</template>

<style>
/* Global styles */
html,
body {
  min-height: 100vh;
}
</style>

<style scoped>
.landing-page {
  background: #0a0a0a;
  min-height: 100vh;
}

.hero {
  padding: 40px 24px;
  text-align: center;
  background: #0a0a0a;
}

/* Vue Transition classes */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Processing State - Image Scanning */
.processing-state {
  margin: 0 auto 20px;
  max-width: 600px;
  background: linear-gradient(135deg, #111 0%, #1a1205 100%);
  border: 2px solid rgba(245, 158, 10, 0.2);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
}

.scanning-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 24px;
  border-radius: 12px;
  overflow: hidden;
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
}

.uploaded-image {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  display: block;
}

.scanner-line {
  position: absolute;
  left: -10%;
  right: -10%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(245, 158, 10, 0.1) 20%,
    #f59e0a 50%,
    rgba(245, 158, 10, 0.1) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 10px rgba(245, 158, 10, 0.8),
    0 0 30px rgba(245, 158, 10, 0.4),
    0 0 50px rgba(245, 158, 10, 0.2);
  animation: scanVertical 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  z-index: 10;
}

.scanner-glow {
  position: absolute;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(245, 158, 10, 0.05) 30%,
    rgba(245, 158, 10, 0.2) 50%,
    rgba(245, 158, 10, 0.05) 70%,
    transparent 100%
  );
  filter: blur(20px);
  animation: scanGlow 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  pointer-events: none;
  z-index: 9;
}

@keyframes scanVertical {
  0% {
    top: -5%;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    top: 105%;
    opacity: 0;
  }
}

@keyframes scanGlow {
  0% {
    top: -10%;
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    top: 110%;
    opacity: 0;
  }
}

.processing-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

.processing-text .pulse-dot {
  width: 10px;
  height: 10px;
  background: #f59e0a;
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
}

.hero-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(
    circle,
    rgba(245, 158, 10, 0.15) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(245, 158, 10, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245, 158, 10, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: clamp(48px, 10vw, 80px);
  font-weight: 800;
  color: #fff;
  line-height: 1;
  margin: 0 0 24px;
  letter-spacing: -0.03em;
  background: linear-gradient(180deg, #fff 0%, #888 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 18px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.powered-by {
  color: #f59e0a;
  font-weight: 500;
}

.converter-section {
  padding: 0 24px 40px;
}

.converter-container {
  max-width: 1200px;
  margin: 0 auto;
}

.drop-zone-wrapper {
  max-width: 700px;
  margin: 0 auto;
}

.streaming-container {
  margin: 20px auto;
  max-width: 800px;
}

/* Streaming State Styles */
.streaming-state {
  margin: 0 auto;
  max-width: 800px;
  background: linear-gradient(135deg, #111 0%, #1a1205 100%);
  border: 2px solid rgba(245, 158, 10, 0.2);
  border-radius: 16px;
  padding: 24px;
}

@keyframes glowPulse {
  0%,
  100% {
    border-color: rgba(245, 158, 10, 0.2);
    box-shadow: 0 0 0 rgba(245, 158, 10, 0);
  }
  50% {
    border-color: rgba(245, 158, 10, 0.4);
    box-shadow: 0 0 30px rgba(245, 158, 10, 0.1);
  }
}

.streaming-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.streaming-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #f59e0a;
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.status-text {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

.dots {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
  animation: dots 1.5s steps(4, end) infinite;
  width: 0;
}

.dots::after {
  content: "...";
}

@keyframes dots {
  0% {
    width: 0;
  }
  100% {
    width: 1em;
  }
}

.streaming-output {
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
}

.output-label {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #1a1a1a;
}

.output-container {
  position: relative;
  height: 400px;
  overflow: hidden;
  background: #0d0d0d;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.output-container::-webkit-scrollbar {
  display: none;
}

.raw-output {
  margin: 0;
  padding: 20px;
  background: #0d0d0d;
  color: #e4e4e4;
  font-family: "JetBrains Mono", "Fira Code", "SF Mono", monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: none;
  pointer-events: none;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background: #f59e0a;
  animation: typing 0.8s ease-in-out infinite;
}

@keyframes typing {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.streaming-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  font-size: 12px;
  color: #666;
}

.error-state {
  background: rgba(255, 68, 68, 0.05);
  border: 2px dashed rgba(255, 68, 68, 0.3);
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: #ff4444;
  margin: 0 auto 16px;
}

.error-text {
  font-size: 16px;
  color: #ff6666;
  margin: 0 0 20px;
}

.upload-preview {
  position: relative;
  background: #111;
  border: 2px dashed #333;
  border-radius: 16px;
  overflow: hidden;
}

.upload-preview img {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  display: block;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.upload-preview:hover .preview-overlay {
  opacity: 1;
}

.results-section {
  margin-top: 60px;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.results-header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.results-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.results-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.view-toggle {
  display: flex;
  align-items: center;
  background: #111;
  border: 1px solid #1a1a1a;
  border-radius: 8px;
  padding: 4px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #888;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: #fff;
}

.toggle-btn.active {
  background: #1a1a1a;
  color: #fff;
}

.toggle-icon {
  width: 16px;
  height: 16px;
}

.result-panel-large {
  background: #111;
  border: 1px solid #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
}

.panel-content-large {
  min-height: 600px;
  height: 70vh;
  max-height: 800px;
}

.panel-content-large.preview {
  padding: 40px;
  background: #f5f5f5;
}

.panel-content-large.code {
  background: #0d0d0d;
}

.footer {
  padding: 40px 24px;
  text-align: center;
  margin-top: 60px;
}

.footer-link {
  font-size: 14px;
  color: #666;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #f59e0a;
}
</style>
