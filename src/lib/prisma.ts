import { PrismaClient } from '../../prisma/generated/client'

declare global {
  var prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  })

  // Add middleware for logging
  client.$use(async (params, next) => {
    const before = Date.now()
    const result = await next(params)
    const after = Date.now()
    console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
    return result
  })

  // Test the connection
  client.$connect()
    .then(() => {
      console.log('Successfully connected to the database')
    })
    .catch((error) => {
      console.error('Failed to connect to the database:', error)
    })

  return client
}

export const prisma = globalThis.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
} 