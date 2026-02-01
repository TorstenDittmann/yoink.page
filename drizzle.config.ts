import type { Config } from 'drizzle-kit'

const url = process.env.NUXT_TURSO_URL
const authToken = process.env.NUXT_TURSO_TOKEN

if (!url || !authToken) {
  throw new Error('Missing TURSO_URL or TURSO_TOKEN environment variables')
}

export default {
  schema: './app/lib/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url,
    authToken
  }
} satisfies Config
