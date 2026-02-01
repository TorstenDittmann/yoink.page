import { z } from 'zod'

const testSchema = z.object({
  message: z.string()
})

export default defineEventHandler(async (event) => {
  console.log('[TEST] Simple test endpoint hit')

  try {
    const body = await readBody(event)
    const { message } = testSchema.parse(body)

    return {
      success: true,
      received: message,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('[TEST] Error:', error)
    return {
      success: false,
      error: 'Invalid request'
    }
  }
})
