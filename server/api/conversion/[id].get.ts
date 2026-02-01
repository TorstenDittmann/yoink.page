import { getDb } from '~/lib/db'
import { conversions } from '~/lib/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Missing conversion ID' })
    }

    const conversion = await getDb().query.conversions.findFirst({
      where: eq(conversions.id, id)
    })

    if (!conversion) {
      throw createError({ statusCode: 404, statusMessage: 'Conversion not found' })
    }

    return {
      conversion: {
        id: conversion.id,
        htmlOutput: conversion.htmlOutput,
        createdAt: conversion.createdAt
      }
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    console.error('Get conversion error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to get conversion' })
  }
})
