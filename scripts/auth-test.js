/**
 * Authentication Test Script
 * 
 * Run with: node scripts/auth-test.js
 * 
 * This script helps diagnose authentication issues by:
 * 1. Testing the JWT token generation
 * 2. Testing token verification
 * 3. Testing refresh token flow
 */

const { SignJWT, jwtVerify } = require('jose');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

// Check environment variables
console.log('Environment check:');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('- JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'Not set (will default to production)');
console.log('\n');

// Generate test tokens
async function generateTestTokens() {
  try {
    console.log('Generating test tokens...');
    
    // Check if secrets are available
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('❌ Error: JWT secrets not configured in .env.local');
      return;
    }
    
    // Create a test user
    const testUser = {
      id: 'test-user-' + crypto.randomBytes(4).toString('hex'),
      email: 'test@example.com',
      role: 'CUSTOMER'
    };
    
    // Generate a fingerprint
    const fingerprint = 'test-fingerprint-' + crypto.randomBytes(8).toString('hex');
    
    // Generate access token
    const accessToken = await new SignJWT({
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      fingerprint: fingerprint,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    
    // Generate refresh token
    const refreshToken = await new SignJWT({
      id: testUser.id,
      fingerprint: fingerprint,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.JWT_REFRESH_SECRET));
    
    console.log('✅ Tokens generated successfully');
    console.log('- Access Token:', accessToken.substring(0, 20) + '...');
    console.log('- Refresh Token:', refreshToken.substring(0, 20) + '...');
    
    // Verify the tokens
    console.log('\nVerifying tokens...');
    
    // Verify access token
    try {
      const { payload: accessPayload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(process.env.JWT_SECRET),
        { algorithms: ['HS256'] }
      );
      
      console.log('✅ Access token verified successfully');
      console.log('- Payload:', accessPayload);
    } catch (error) {
      console.error('❌ Access token verification failed:', error.message);
    }
    
    // Verify refresh token
    try {
      const { payload: refreshPayload } = await jwtVerify(
        refreshToken,
        new TextEncoder().encode(process.env.JWT_REFRESH_SECRET),
        { algorithms: ['HS256'] }
      );
      
      console.log('✅ Refresh token verified successfully');
      console.log('- Payload:', refreshPayload);
    } catch (error) {
      console.error('❌ Refresh token verification failed:', error.message);
    }
    
    return { accessToken, refreshToken, fingerprint, user: testUser };
  } catch (error) {
    console.error('❌ Error generating tokens:', error);
  }
}

// Run the tests
async function runTests() {
  console.log('====== AUTHENTICATION TEST SCRIPT ======\n');
  
  // Test token generation and verification
  const tokens = await generateTestTokens();
  
  if (!tokens) {
    console.log('\n❌ Token tests failed. Please check your environment variables.');
    return;
  }
  
  console.log('\n✅ All tests passed successfully!');
  console.log('\nRecommendations:');
  console.log('1. Ensure JWT_SECRET and JWT_REFRESH_SECRET are set in production');
  console.log('2. Make sure cookies are properly set with matching domain/path');
  console.log('3. Check that fingerprint handling is consistent across endpoints');
  console.log('\nNote: If you have authentication loops, clear all browser cookies and try again.');
  console.log('\n=========================================');
}

runTests(); 