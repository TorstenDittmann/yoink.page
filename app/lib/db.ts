import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!db) {
    const config = useRuntimeConfig()
    const url = config.tursoUrl as string
    const token = config.tursoToken as string

    if (!url || !token) {
      throw new Error('Turso configuration missing')
    }

    const client = createClient({
      url,
      authToken: token
    })

    db = drizzle(client, { schema })
  }
  return db
}
