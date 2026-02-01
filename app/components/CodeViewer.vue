<script setup lang="ts">
import { ref, watch } from 'vue'
import { codeToHtml } from 'shiki'

const props = defineProps<{
  html: string
}>()

const highlightedCode = ref('')
const isHighlighting = ref(false)

const copyCode = async () => {
  await navigator.clipboard.writeText(props.html)
}

const highlightCode = async () => {
  if (!props.html || isHighlighting.value) return

  isHighlighting.value = true
  try {
    highlightedCode.value = await codeToHtml(props.html, {
      lang: 'html',
      theme: 'github-dark',
      transformers: [
        {
          code(node) {
            // Ensure proper HTML escaping
            return node
          }
        }
      ]
    })
  } catch (err) {
    console.error('Highlighting error:', err)
    highlightedCode.value = `<pre><code>${escapeHtml(props.html)}</code></pre>`
  } finally {
    isHighlighting.value = false
  }
}

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

watch(() => props.html, highlightCode, { immediate: true })
</script>

<template>
  <div class="code-viewer">
    <div class="header">
      <span class="label">HTML</span>
      <button
        class="copy-btn"
        @click="copyCode"
      >
        Copy
      </button>
    </div>
    <div
      v-if="highlightedCode"
      class="code-content"
      v-html="highlightedCode"
    />
    <pre
      v-else
      class="code-block"
    ><code>{{ html }}</code></pre>
  </div>
</template>

<style scoped>
.code-viewer {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
}

.label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.copy-btn {
  padding: 6px 16px;
  background: transparent;
  border: 1px solid #f59e0a;
  border-radius: 6px;
  color: #f59e0a;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: rgba(245, 158, 10, 0.1);
}

.code-content {
  flex: 1;
  overflow: auto;
  background: #0d0d0d;
}

.code-content :deep(pre) {
  margin: 0;
  padding: 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.code-content :deep(code) {
  font-family: 'JetBrains Mono', monospace;
}

.code-block {
  margin: 0;
  padding: 20px;
  background: #0d0d0d;
  color: #e4e4e4;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
  overflow-y: auto;
  flex: 1;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
