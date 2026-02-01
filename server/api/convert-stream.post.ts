import { z } from 'zod'
import { getDb } from '~/lib/db'
import { conversions } from '~/lib/schema'
import { format } from 'prettier'
import { aj } from '~/lib/arcjet'

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
  console.log('[CONVERT-STREAM] Request started at:', new Date().toISOString())

  // Check Arcjet rate limit
  const decision = await aj.protect(event.node.req)
  if (decision.isDenied()) {
    throw createError({ statusCode: 429, statusMessage: 'Rate limit exceeded. Try again later.' })
  }

  try {
    const body = await readBody(event)
    const { image } = convertSchema.parse(body)
    const base64Data = image.split(',')[1]

    const config = useRuntimeConfig()
    const apiKey = config.openrouterApiKey

    if (typeof apiKey !== 'string') {
      throw createError({ statusCode: 500, statusMessage: 'API key not configured' })
    }

    const model = config.openrouterModel
    const resolvedModel = typeof model === 'string' && model.trim() ? model : 'moonshotai/kimi-k2.5'

    // Set up SSE headers
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')

    // Create conversion ID early
    const conversionId = crypto.randomUUID()

    // Send initial event with ID
    event.node.res.write(`data: ${JSON.stringify({ type: 'id', id: conversionId })}\n\n`)

    // Call OpenRouter API with streaming
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.public.siteUrl || 'http://localhost:3000',
        'X-Title': 'fromscreen.dev'
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: SYSTEM_PROMPT },
              {
                type: 'image_url',
                image_url: { url: `data:image/png;base64,${base64Data}` }
              }
            ]
          }
        ],
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    let fullHtml = ''
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) {
              fullHtml += content
              // Send chunk to client
              event.node.res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`)
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }

    // Format HTML with prettier
    const formattedHtml = await format(fullHtml.trim(), {
      parser: 'html',
      printWidth: 120,
      tabWidth: 2,
      useTabs: false
    })

    // Save to database
    await getDb().insert(conversions).values({
      id: conversionId,
      userId: 'anonymous',
      htmlOutput: formattedHtml
    })

    // Send completion event with formatted HTML
    event.node.res.write(`data: ${JSON.stringify({ type: 'done', html: formattedHtml, id: conversionId })}\n\n`)
    event.node.res.end()

    console.log(`[CONVERT-STREAM] SUCCESS! Total time: ${Date.now() - startTime}ms`)
  } catch (error) {
    console.error('[CONVERT-STREAM] ERROR:', error)
    event.node.res.write(`data: ${JSON.stringify({ type: 'error', message: 'Conversion failed' })}\n\n`)
    event.node.res.end()
  }
})
