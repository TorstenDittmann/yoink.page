import { getDb } from '~/lib/db'
import { usage } from '~/lib/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Get or create anonymous session ID from cookie
    let sessionId = getCookie(event, 'session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      setCookie(event, 'session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
    }

    const today: string = new Date().toISOString().split('T')[0] as string

    // Get today's usage for this session using select query
    const db = getDb()
    const usageResults = await db.select().from(usage).where(
      and(
        eq(usage.userId, sessionId),
        eq(usage.date, today)
      )
    ).limit(1)

    const count = usageResults[0]?.count || 0
    const limit = 5

    return {
      count,
      limit,
      remaining: Math.max(0, limit - count),
      hasReachedLimit: count >= limit
    }
  } catch (error) {
    console.error('Usage error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to get usage' })
  }
})
