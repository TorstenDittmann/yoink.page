import { z } from 'zod'

const previewSchema = z.object({
  html: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { html } = previewSchema.parse(body)

    // Sanitize the HTML - only allow safe content
    // Remove any script tags for security
    const sanitizedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      background: white;
    }
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  ${sanitizedHtml}
</body>
</html>`

    return fullHtml
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid HTML provided' })
    }

    console.error('Preview error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to generate preview' })
  }
})
