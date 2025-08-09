import { beforeEach, vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { Quasar } from 'quasar'

// Mock Quasar plugins and global properties
config.global.plugins = [
  [
    Quasar,
    {
      plugins: {}
    }
  ],
  createTestingPinia({
    createSpy: vi.fn,
    stubActions: false
  })
]

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})

// Mock WebSocket globally for tests
// global.WebSocket = vi.fn().mockImplementation(() => ({
//   readyState: 1, // OPEN
//   send: vi.fn(),
//   close: vi.fn(),
//   addEventListener: vi.fn(),
//   removeEventListener: vi.fn(),
// }))

// Mock window.location for tests that might need it
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000'
  },
  writable: true
})
