import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { fetch, Headers, Request, Response } from 'cross-fetch'

// Add fetch to global scope
global.fetch = fetch
global.Headers = Headers
global.Request = Request
global.Response = Response

// Add TextEncoder/TextDecoder to global scope
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // Add other models as needed
  },
}))

// Mock environment variables
process.env.JWT_SECRET = 'test-secret'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.STRIPE_SECRET_KEY = 'test-stripe-key'
process.env.RESEND_API_KEY = 'test-resend-key'

// Mock cookies
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
}) 