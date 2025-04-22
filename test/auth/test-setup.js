const { PrismaClient } = require('@prisma/client')
const { sign, verify } = require('jsonwebtoken')
const { compare, hash } = require('bcryptjs')

// Initialize Prisma
const prisma = new PrismaClient()

// Rate limiting using PostgreSQL
async function rateLimit(key) {
  const now = new Date()
  const windowStart = new Date(now.getTime() - 60000) // 1 minute window
  
  try {
    const rateLimit = await prisma.rateLimit.upsert({
      where: { key },
      update: {
        count: {
          increment: 1
        },
        resetTime: new Date(now.getTime() + 60000)
      },
      create: {
        key,
        count: 1,
        resetTime: new Date(now.getTime() + 60000)
      }
    })
    
    return { success: rateLimit.count <= 5 }
  } catch (error) {
    console.error('Rate limit error:', error)
    return { success: true }
  }
}

const JWT_SECRET = 'test_jwt_secret'
const REFRESH_TOKEN_SECRET = JWT_SECRET + '_refresh'

// Auth functions
async function login(email, password) {
  const { success } = await rateLimit(email)
  if (!success) {
    throw new Error('Too many login attempts. Please try again later.')
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      customer: true,
      employee: true,
    },
  })

  if (!user) {
    throw new Error('Invalid email or password')
  }

  const isValid = await compare(password, user.password)
  if (!isValid) {
    throw new Error('Invalid email or password')
  }

  const accessToken = sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id,
      employeeId: user.employee?.id,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  )

  const refreshToken = sign(
    {
      id: user.id,
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  )

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  })

  return { accessToken, refreshToken, user }
}

async function verifyToken(token, isRefreshToken = false) {
  try {
    return verify(token, isRefreshToken ? REFRESH_TOKEN_SECRET : JWT_SECRET)
  } catch (error) {
    return null
  }
}

async function refreshToken(token) {
  const payload = await verifyToken(token, true)
  if (!payload) {
    throw new Error('Invalid refresh token')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: {
      customer: true,
      employee: true,
    },
  })

  if (!user || user.refreshToken !== token) {
    throw new Error('Invalid refresh token')
  }

  const accessToken = sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id,
      employeeId: user.employee?.id,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  )

  return { accessToken, user }
}

async function logout(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  })
  return true
}

module.exports = {
  prisma,
  login,
  verifyToken,
  refreshToken,
  logout,
  hash,
  rateLimit,
} 