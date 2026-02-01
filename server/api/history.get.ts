import { getDb } from '~/lib/db'
import { conversions } from '~/lib/schema'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    // Get all conversions (no auth required)
    const userConversions = await getDb().query.conversions.findMany({
      orderBy: desc(conversions.createdAt),
      limit: 50
    })

    return {
      conversions: userConversions.map(conv => ({
        id: conv.id,
        htmlOutput: conv.htmlOutput,
        createdAt: conv.createdAt
      }))
    }
  } catch (error) {
    console.error('History error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to get history' })
  }
})
