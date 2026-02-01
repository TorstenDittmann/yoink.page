<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'yoink - Screenshot to Code'
const description = 'Transform your UI screenshots into clean, production-ready code.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://fromscreen.dev/og-image.png',
  twitterImage: 'https://fromscreen.dev/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <main class="app-main">
      <NuxtPage />
    </main>
  </UApp>
</template>

<style>
.app-main {
  min-height: 100vh;
  background: #0a0a0a;
}
</style>
