import arcjet, { tokenBucket } from '@arcjet/node'

const config = useRuntimeConfig()

export const aj = arcjet({
  key: config.arcjetKey as string,
  rules: [
    tokenBucket({
      mode: 'LIVE',
      refillRate: 5,
      interval: 86400, // 24 hours = 5 per day
      capacity: 5
    })
  ]
})
