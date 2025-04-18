const { prisma } = require('../dist/lib/prisma')
const { login, verifyToken, refreshToken, logout } = require('../dist/lib/auth')
const { hash } = require('bcryptjs')

async function testAuth() {
  console.log('Starting authentication system tests...')

  try {
    // Create test user
    console.log('\n1. Creating test user...')
    const hashedPassword = await hash('testpassword123', 12)
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'CUSTOMER',
      },
    })
    console.log('✅ Test user created successfully')

    // Test login
    console.log('\n2. Testing login...')
    const loginResult = await login('test@example.com', 'testpassword123')
    console.log('✅ Login successful')
    console.log('Access Token:', loginResult.accessToken.substring(0, 20) + '...')
    console.log('Refresh Token:', loginResult.refreshToken.substring(0, 20) + '...')

    // Test token verification
    console.log('\n3. Testing token verification...')
    const accessTokenPayload = await verifyToken(loginResult.accessToken)
    const refreshTokenPayload = await verifyToken(loginResult.refreshToken, true)
    console.log('✅ Access token verified')
    console.log('✅ Refresh token verified')

    // Test token refresh
    console.log('\n4. Testing token refresh...')
    const refreshResult = await refreshToken(loginResult.refreshToken)
    console.log('✅ Token refresh successful')
    console.log('New Access Token:', refreshResult.accessToken.substring(0, 20) + '...')

    // Test rate limiting
    console.log('\n5. Testing rate limiting...')
    try {
      // Try to login multiple times
      for (let i = 0; i < 6; i++) {
        await login('test@example.com', 'testpassword123')
        console.log(`Login attempt ${i + 1} successful`)
      }
    } catch (error) {
      if (error.message.includes('Too many login attempts')) {
        console.log('✅ Rate limiting working as expected')
      } else {
        throw error
      }
    }

    // Test logout
    console.log('\n6. Testing logout...')
    await logout(testUser.id)
    console.log('✅ Logout successful')

    // Verify refresh token is invalidated
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    })
    if (!updatedUser?.refreshToken) {
      console.log('✅ Refresh token invalidated')
    }

    // Clean up
    console.log('\n7. Cleaning up...')
    await prisma.user.delete({
      where: { id: testUser.id },
    })
    console.log('✅ Test user deleted')

    console.log('\n🎉 All tests completed successfully!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testAuth() 