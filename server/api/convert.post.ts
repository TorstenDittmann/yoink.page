import { z } from 'zod'
import { getDb } from '~/lib/db'
import { conversions } from '~/lib/schema'
import { OpenRouter } from '@openrouter/sdk'

const convertSchema = z.object({
  image: z.string().regex(/^data:image\/[a-zA-Z]+;base64,/)
})

const SYSTEM_PROMPT = `You are an expert frontend developer. Recreate this UI screenshot as clean, production-ready code.

Rules:
- Tailwind CSS only. No inline styles, no custom CSS.
- Match colors, spacing, and layout closely. Use arbitrary values like bg-[#1a2b3c] when needed.
- Semantic HTML. Placeholder divs for images. Suggest Lucide icon names in comments.
- Make it responsive.
- Return ONLY the code. No markdown fences, no explanation.
- No JavaScript
- Output valid HTML with Tailwind classes.`

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  console.log('[CONVERT] Request started at:', new Date().toISOString())

  try {
    console.log('[CONVERT] Step 1: Reading request body')
    const body = await readBody(event)
    console.log('[CONVERT] Image length:', body?.image?.length || 'undefined')

    console.log('[CONVERT] Step 2: Validating schema')
    const { image } = convertSchema.parse(body)
    console.log('[CONVERT] Image data URL prefix:', image.substring(0, 50))

    console.log('[CONVERT] Step 3: Getting runtime config')
    const config = useRuntimeConfig()
    console.log('[CONVERT] openrouterApiKey exists:', !!config.openrouterApiKey)

    // Call OpenRouter API
    console.log('[CONVERT] Step 4: Preparing OpenRouter API call')
    const apiKey = config.openrouterApiKey
    if (typeof apiKey !== 'string') {
      throw createError({ statusCode: 500, statusMessage: 'API key not configured' })
    }

    const client = new OpenRouter({ apiKey })
    const model = config.openrouterModel
    const base64Data = image.split(',')[1]

    const resolvedModel = typeof model === 'string' && model.trim() ? model : 'moonshotai/kimi-k2.5'
    console.log('[CONVERT] Step 5: Calling OpenRouter API with model:', resolvedModel)
    const apiStartTime = Date.now()

    const response = await client.chat.send({
      model: resolvedModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: SYSTEM_PROMPT },
            {
              type: 'image_url',
              imageUrl: { url: `data:image/png;base64,${base64Data}` }
            }
          ]
        }
      ]
    })

    console.log(`[CONVERT] OpenRouter API call completed in ${Date.now() - apiStartTime}ms`)

    // Validate response
    if (!response.choices || response.choices.length === 0) {
      throw createError({ statusCode: 500, statusMessage: 'AI response missing choices' })
    }

    const content = response.choices[0]?.message?.content
    if (!content || typeof content !== 'string') {
      throw createError({ statusCode: 500, statusMessage: 'AI response missing content' })
    }

    const html = content.trim()
    if (!html || !html.includes('<') || !html.includes('>')) {
      throw createError({ statusCode: 500, statusMessage: 'Invalid response from AI - no HTML detected' })
    }

    // Save to database with anonymous user
    const conversionId = crypto.randomUUID()
    await getDb().insert(conversions).values({
      id: conversionId,
      userId: 'anonymous',
      htmlOutput: html
    })

    console.log(`[CONVERT] SUCCESS! Total time: ${Date.now() - startTime}ms`)
    return { html, success: true }
  } catch (error) {
    console.log(`[CONVERT] FAILED after ${Date.now() - startTime}ms`)

    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
    }

    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('[CONVERT] ERROR:', error)
    throw createError({ statusCode: 500, statusMessage: 'Conversion failed' })
  }
})
