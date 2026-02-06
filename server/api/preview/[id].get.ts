import { getDb } from '~/lib/db'
import { conversions } from '~/lib/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Missing preview ID' })
    }

    const conversion = await getDb().query.conversions.findFirst({
      where: eq(conversions.id, id)
    })

    if (!conversion) {
      throw createError({ statusCode: 404, statusMessage: 'Preview not found' })
    }

    // Sanitize the HTML - only allow safe content
    const sanitizedHtml = conversion.htmlOutput
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
      padding: 0;
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

    setHeader(event, 'Content-Type', 'text/html')
    return fullHtml
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    console.error('Preview error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to generate preview' })
  }
})
