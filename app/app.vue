<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#f59e0a' },
    { name: 'author', content: 'yoink' },
    { name: 'keywords', content: 'screenshot to code, UI to code, image to HTML, visual to code, AI code generation, frontend development, design to code' },
    { name: 'robots', content: 'index, follow' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
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
  ogUrl: 'https://yoink.page',
  ogImage: 'https://yoink.page/og-image.png',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: 'https://yoink.page/og-image.png'
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
