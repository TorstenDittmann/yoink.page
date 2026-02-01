// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/hints'],

  ssr: false,

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    openrouterApiKey: process.env.NUXT_OPENROUTER_API_KEY,
    openrouterModel: process.env.NUXT_OPENROUTER_MODEL,
    tursoUrl: process.env.NUXT_TURSO_URL,
    tursoToken: process.env.NUXT_TURSO_TOKEN,
    arcjetKey: process.env.NUXT_ARCJET_KEY,
    public: {
      siteUrl: process.env.NUXT_SITE_URL
    }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
