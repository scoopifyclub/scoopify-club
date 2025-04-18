const {
  prisma,
  login,
  verifyToken,
  refreshToken,
  logout,
  hash,
  rateLimiter,
} = require('./test-setup')

async function cleanup() {
  await prisma.user.deleteMany({
    where: { email: 'test@example.com' },
  })
}

async function runTests() {
  try {
    console.log('🚀 Starting authentication system tests...\n')

    // Initial cleanup
    await cleanup()
    console.log('✅ Initial cleanup completed\n')

    // Create test user
    console.log('Creating test user...')
    const hashedPassword = await hash('testpassword123', 12)
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'CUSTOMER',
      },
    })
    console.log('✅ Test user created\n')

    // Test login
    console.log('Testing login...')
    const loginResult = await login('test@example.com', 'testpassword123')
    console.log('✅ Login successful')
    console.log('Access Token:', loginResult.accessToken.substring(0, 20) + '...')
    console.log('Refresh Token:', loginResult.refreshToken.substring(0, 20) + '...\n')

    // Test token verification
    console.log('Testing token verification...')
    const accessTokenPayload = await verifyToken(loginResult.accessToken)
    const refreshTokenPayload = await verifyToken(loginResult.refreshToken, true)
    console.log('✅ Tokens verified\n')

    // Test token refresh
    console.log('Testing token refresh...')
    const refreshResult = await refreshToken(loginResult.refreshToken)
    console.log('✅ Token refreshed')
    console.log('New Access Token:', refreshResult.accessToken.substring(0, 20) + '...\n')

    // Test rate limiting
    console.log('Testing rate limiting...')
    rateLimiter.reset()
    let rateLimitHit = false
    try {
      for (let i = 0; i < 6; i++) {
        await login('test@example.com', 'testpassword123')
      }
    } catch (error) {
      if (error.message.includes('Too many login attempts')) {
        rateLimitHit = true
      }
    }
    if (rateLimitHit) {
      console.log('✅ Rate limiting working\n')
    } else {
      throw new Error('Rate limiting failed')
    }

    // Test logout
    console.log('Testing logout...')
    await logout(testUser.id)
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    })
    if (!updatedUser.refreshToken) {
      console.log('✅ Logout successful\n')
    } else {
      throw new Error('Refresh token not cleared')
    }

    // Final cleanup
    await cleanup()
    console.log('✅ Final cleanup completed\n')

    console.log('🎉 All tests passed successfully!')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    // Ensure cleanup on failure
    await cleanup()
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runTests() 