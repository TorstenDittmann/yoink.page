<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps({
  error: Object as () => NuxtError
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="error-page">
    <div class="error-container">
      <h1 class="error-code">
        {{ error?.statusCode || 500 }}
      </h1>
      <p class="error-message">
        {{ error?.statusMessage || 'Something went wrong' }}
      </p>
      <p
        v-if="error?.message"
        class="error-details"
      >
        {{ error.message }}
      </p>
      <button
        class="home-button"
        @click="handleError"
      >
        Back to Home
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}

.error-container {
  text-align: center;
  padding: 2rem;
}

.error-code {
  font-size: 6rem;
  font-weight: 700;
  color: #f59e0a;
  margin: 0 0 1rem;
  line-height: 1;
}

.error-message {
  font-size: 1.5rem;
  color: #888;
  margin: 0 0 1rem;
}

.error-details {
  font-size: 1rem;
  color: #666;
  margin: 0 0 2rem;
  max-width: 500px;
  word-break: break-word;
}

.home-button {
  padding: 12px 24px;
  background: #f59e0a;
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.home-button:hover {
  opacity: 0.9;
}
</style>
