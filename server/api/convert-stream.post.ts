import { z } from 'zod'
import { getDb } from '~/lib/db'
import { conversions } from '~/lib/schema'
import { format } from 'prettier'
import { aj } from '~/lib/arcjet'
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
- Output valid HTML with Tailwind classes.
- Use standard Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
- Include Bunny Fonts in the head: <link rel="stylesheet" href="https://fonts.bunny.net/css2?family=Inter:wght@400;500;600;700&display=swap">
- Apply fonts with Tailwind's font-['FontName'] syntax: font-['Inter'] or font-['Space_Grotesk']
- For custom colors, use Tailwind's arbitrary values: bg-[#f59e0a], text-[#1a1a1a]
- Common Bunny Fonts: Inter, Roboto, Playfair Display, Space Grotesk, DM Sans, Plus Jakarta Sans`

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  console.log('[CONVERT-STREAM] Request started at:', new Date().toISOString())

  // Check Arcjet rate limit (deduct 1 token per conversion)
  const decision = await aj.protect(event.node.req, { requested: 1 })
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

    const model = 'moonshotai/kimi-k2.5'

    // Set up SSE headers
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')

    // Create conversion ID early
    const conversionId = crypto.randomUUID()

    // Send initial event with ID
    event.node.res.write(`data: ${JSON.stringify({ type: 'id', id: conversionId })}\n\n`)

    // Initialize OpenRouter client
    const client = new OpenRouter({
      apiKey,
      xTitle: 'yoink.page',
      httpReferer: 'https://yoink.page'
    })

    // Call OpenRouter API with streaming using SDK
    const stream = await client.chat.send({
      model,
      provider: {
        sort: 'throughput'
      },
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
      ],
      stream: true
    })

    let fullHtml = ''

    // Process the streaming response
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || ''
      if (content) {
        fullHtml += content
        // Send chunk to client
        event.node.res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`)
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
