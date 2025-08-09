import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from 'src/stores/chat-store'
import { useWebSocketStore } from 'src/stores/websocket-store'

// Mock the WebSocket store
vi.mock('src/stores/websocket-store', () => ({
  useWebSocketStore: vi.fn(() => ({
    onMessage: vi.fn((callback) => {
      mockWebSocketCallbacks.push(callback)
      return () => {
        const index = mockWebSocketCallbacks.indexOf(callback)
        if (index > -1) mockWebSocketCallbacks.splice(index, 1)
      }
    }),
    updateConfig: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn()
  }))
}))

// Mock constants
vi.mock('src/constants', () => ({
  WS_PORT: 8181
}))

// Mock utilities
vi.mock('src/utils/generate-random-id', () => ({
  default: vi.fn(() => 'mock-id-123')
}))

// Global mock callbacks for WebSocket
let mockWebSocketCallbacks: Array<
  (data: { message: { from: string; message: string } } | Record<string, unknown>) => void
> = []

describe('Chat Store', () => {
  let mockWebSocketStore: {
    onMessage: ReturnType<typeof vi.fn>
    updateConfig: ReturnType<typeof vi.fn>
    connect: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    mockWebSocketCallbacks = []

    mockWebSocketStore = {
      onMessage: vi.fn((callback) => {
        mockWebSocketCallbacks.push(callback)
        return () => {
          const index = mockWebSocketCallbacks.indexOf(callback)
          if (index > -1) mockWebSocketCallbacks.splice(index, 1)
        }
      }),
      updateConfig: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn()
    }

    vi.mocked(useWebSocketStore).mockReturnValue(mockWebSocketStore as unknown as ReturnType<typeof useWebSocketStore>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Store Initialization', () => {
    it('should initialize with empty state', () => {
      const store = useChatStore()

      expect(store.contacts).toEqual([])
      expect(store.activeContactName).toBeNull()
      expect(store.currentUserName).toBe('You')
    })

    it('should have correct initial computed values', () => {
      const store = useChatStore()

      expect(store.sortedContacts).toEqual([])
      expect(store.activeContact).toBeUndefined()
    })
  })

  describe('Contact Management', () => {
    it('should add new contact when receiving message', () => {
      const store = useChatStore()

      const incomingMessage = {
        message: {
          from: 'Alice',
          message: 'Hello world!'
        }
      }

      store.receiveMessage(incomingMessage)

      expect(store.contacts).toHaveLength(1)
      expect(store.contacts[0]?.name).toBe('Alice')
      expect(store.contacts[0]?.lastMessage).toBe('Hello world!')
      expect(store.contacts[0]?.unreadCount).toBe(1)
      expect(store.contacts[0]?.messages).toHaveLength(1)
    })

    it('should update existing contact when receiving new message', () => {
      const store = useChatStore()

      // First message
      store.receiveMessage({
        message: { from: 'Alice', message: 'Hello!' }
      })

      // Second message from same contact
      store.receiveMessage({
        message: { from: 'Alice', message: 'How are you?' }
      })

      expect(store.contacts).toHaveLength(1)
      expect(store.contacts[0]?.messages).toHaveLength(2)
      expect(store.contacts[0]?.lastMessage).toBe('How are you?')
      expect(store.contacts[0]?.unreadCount).toBe(2)
    })

    it('should handle invalid incoming messages', () => {
      const store = useChatStore()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Message without required structure
      // @ts-expect-error - Testing invalid message format
      store.receiveMessage({ invalid: 'message' })

      expect(store.contacts).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalledWith('Incoming message is not a chat message', { invalid: 'message' })

      consoleSpy.mockRestore()
    })

    it('should not increment unread count for active contact', () => {
      const store = useChatStore()

      // Set active contact first
      store.receiveMessage({
        message: { from: 'Alice', message: 'Hello!' }
      })
      store.setActiveContact('Alice')

      // Receive another message from active contact
      store.receiveMessage({
        message: { from: 'Alice', message: 'How are you?' }
      })

      expect(store.contacts[0]?.unreadCount).toBe(0)
    })
  })

  describe('Message Sending', () => {
    it('should send message to active contact', () => {
      const store = useChatStore()

      // Add contact and set as active
      store.receiveMessage({
        message: { from: 'Alice', message: 'Hello!' }
      })
      store.setActiveContact('Alice')

      store.sendMessage('Hi Alice!')

      // Should add own message to contact
      const aliceContact = store.contacts[0]
      expect(aliceContact).toBeDefined()
      const ownMessages = aliceContact!.messages.filter((m) => m.isOwn)
      expect(ownMessages).toHaveLength(1)
      expect(ownMessages[0]?.message).toBe('Hi Alice!')
    })

    it('should not send message when no active contact', () => {
      const store = useChatStore()

      store.sendMessage('Hello!')

      // Verify no messages were added since no active contact
      expect(store.contacts).toHaveLength(0)
    })
  })

  describe('Active Contact Management', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should set active contact', () => {
      const store = useChatStore()

      // Add contact
      store.receiveMessage({
        message: { from: 'Alice', message: 'Hello!' }
      })

      store.setActiveContact('Alice')

      expect(store.activeContactName).toBe('Alice')
      expect(store.activeContact?.name).toBe('Alice')
    })

    it('should clear unread count when setting active contact', () => {
      const store = useChatStore()

      // Add contact with unread messages
      store.receiveMessage({
        message: { from: 'Alice', message: 'Hello!' }
      })
      store.receiveMessage({
        message: { from: 'Alice', message: 'How are you?' }
      })

      expect(store.contacts[0]?.unreadCount).toBe(2)

      store.setActiveContact('Alice')

      expect(store.contacts[0]?.unreadCount).toBe(0)
    })

    it('should clear active contact', () => {
      const store = useChatStore()

      store.receiveMessage({
        message: { from: 'Alice', message: 'Hello!' }
      })
      store.setActiveContact('Alice')

      expect(store.activeContactName).toBe('Alice')

      store.clearActiveContact()

      expect(store.activeContactName).toBeNull()
    })

    it('should handle setting active contact that does not exist', () => {
      const store = useChatStore()

      store.setActiveContact('NonExistentContact')

      expect(store.activeContactName).toBe('NonExistentContact')
      expect(store.activeContact).toBeUndefined()
    })
  })

  describe('Sorted Contacts', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should sort contacts by last message time (newest first)', () => {
      const store = useChatStore()
      const baseTime = Date.now()

      // Add contacts at different times
      vi.setSystemTime(baseTime)
      store.receiveMessage({
        message: { from: 'Alice', message: 'First message' }
      })

      vi.setSystemTime(baseTime + 1000)
      store.receiveMessage({
        message: { from: 'Bob', message: 'Second message' }
      })

      vi.setSystemTime(baseTime + 2000)
      store.receiveMessage({
        message: { from: 'Charlie', message: 'Third message' }
      })

      const sorted = store.sortedContacts

      expect(sorted[0]?.name).toBe('Charlie') // Most recent
      expect(sorted[1]?.name).toBe('Bob')
      expect(sorted[2]?.name).toBe('Alice') // Oldest
    })

    it('should update sort order when contact receives new message', () => {
      const store = useChatStore()
      const baseTime = Date.now()

      vi.setSystemTime(baseTime)
      store.receiveMessage({
        message: { from: 'Alice', message: 'First' }
      })

      vi.setSystemTime(baseTime + 1000)
      store.receiveMessage({
        message: { from: 'Bob', message: 'Second' }
      })

      expect(store.sortedContacts[0]?.name).toBe('Bob')

      // Alice sends new message (should move to top)
      vi.setSystemTime(baseTime + 2000)
      store.receiveMessage({
        message: { from: 'Alice', message: 'Latest' }
      })

      expect(store.sortedContacts[0]?.name).toBe('Alice')
    })
  })

  describe('WebSocket Integration', () => {
    it('should initialize WebSocket connection', () => {
      const store = useChatStore()

      store.webSocketInitializationHandler()

      expect(mockWebSocketStore.onMessage).toHaveBeenCalled()
      expect(mockWebSocketStore.updateConfig).toHaveBeenCalledWith({
        url: 'ws://localhost:8181'
      })
      expect(mockWebSocketStore.connect).toHaveBeenCalled()
    })

    it('should clean up existing listener before setting new one', () => {
      const store = useChatStore()

      // First initialization
      store.webSocketInitializationHandler()
      const firstCallCount = mockWebSocketStore.onMessage.mock.calls.length

      // Second initialization should clean up first listener
      store.webSocketInitializationHandler()

      expect(mockWebSocketStore.onMessage).toHaveBeenCalledTimes(firstCallCount + 1)
    })

    it('should handle incoming messages through WebSocket listener', () => {
      const store = useChatStore()

      store.webSocketInitializationHandler()

      // Simulate receiving message through WebSocket
      const messageData = {
        message: {
          from: 'Alice',
          message: 'Hello from WebSocket!'
        }
      }

      // Call the registered callback
      mockWebSocketCallbacks.forEach((callback) => callback(messageData))

      expect(store.contacts).toHaveLength(1)
      expect(store.contacts[0]?.name).toBe('Alice')
      expect(store.contacts[0]?.lastMessage).toBe('Hello from WebSocket!')
    })

    it('should ignore invalid WebSocket messages', () => {
      const store = useChatStore()

      store.webSocketInitializationHandler()

      // Simulate invalid message
      const invalidData = { invalid: 'data' }

      mockWebSocketCallbacks.forEach((callback) => callback(invalidData))

      expect(store.contacts).toHaveLength(0)
    })

    it('should disconnect WebSocket properly', () => {
      const store = useChatStore()

      store.webSocketInitializationHandler()
      store.webSocketDisconnectionHandler()

      expect(mockWebSocketStore.disconnect).toHaveBeenCalled()
    })

    it('should cleanup message listener on disconnection', () => {
      const store = useChatStore()

      store.webSocketInitializationHandler()

      // Should have registered a callback
      expect(mockWebSocketCallbacks).toHaveLength(1)

      store.webSocketDisconnectionHandler()

      // Callback should be cleaned up
      expect(mockWebSocketCallbacks).toHaveLength(0)
    })
  })

  describe('Message Structure and Properties', () => {
    it('should create messages with correct structure', () => {
      const store = useChatStore()

      store.receiveMessage({
        message: { from: 'Alice', message: 'Hello!' }
      })

      const message = store.contacts[0]?.messages[0]
      expect(message).toBeDefined()

      expect(message).toHaveProperty('id')
      expect(message).toHaveProperty('from')
      expect(message).toHaveProperty('message')
      expect(message).toHaveProperty('timestamp')
      expect(message).toHaveProperty('isOwn')

      expect(message!.id).toBe('mock-id-123')
      expect(message!.from).toBe('Alice')
      expect(message!.message).toBe('Hello!')
      expect(message!.isOwn).toBe(false)
      expect(typeof message!.timestamp).toBe('number')
    })

    it('should mark own messages correctly', () => {
      const store = useChatStore()

      store.receiveMessage({
        message: { from: 'Alice', message: 'Hello!' }
      })
      store.setActiveContact('Alice')
      store.sendMessage('Hi back!')

      const aliceContact = store.contacts[0]
      expect(aliceContact).toBeDefined()
      const incomingMessage = aliceContact!.messages[0]
      const outgoingMessage = aliceContact!.messages[1]

      expect(incomingMessage?.isOwn).toBe(false)
      expect(incomingMessage?.from).toBe('Alice')

      expect(outgoingMessage?.isOwn).toBe(true)
      expect(outgoingMessage?.from).toBe('You')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty message content', () => {
      const store = useChatStore()

      store.receiveMessage({
        message: { from: 'Alice', message: '' }
      })

      expect(store.contacts).toHaveLength(1)
      expect(store.contacts[0]?.lastMessage).toBe('')
    })

    it('should handle special characters in contact names', () => {
      const store = useChatStore()

      store.receiveMessage({
        message: { from: 'Alice@domain.com', message: 'Hello!' }
      })

      expect(store.contacts[0]?.name).toBe('Alice@domain.com')
    })

    it('should handle very long messages', () => {
      const store = useChatStore()
      const longMessage = 'A'.repeat(1000)

      store.receiveMessage({
        message: { from: 'Alice', message: longMessage }
      })

      expect(store.contacts[0]?.lastMessage).toBe(longMessage)
    })

    it('should maintain message order within contact', () => {
      const store = useChatStore()

      store.receiveMessage({
        message: { from: 'Alice', message: 'First' }
      })

      store.receiveMessage({
        message: { from: 'Alice', message: 'Second' }
      })

      store.receiveMessage({
        message: { from: 'Alice', message: 'Third' }
      })

      const alice = store.contacts[0]
      expect(alice).toBeDefined()
      expect(alice!.messages[0]?.message).toBe('First')
      expect(alice!.messages[1]?.message).toBe('Second')
      expect(alice!.messages[2]?.message).toBe('Third')
    })
  })

  describe('Real-time Updates', () => {
    it('should update lastMessageTime when receiving new message', () => {
      const store = useChatStore()
      const firstTime = Date.now()
      const secondTime = firstTime + 1000

      vi.useFakeTimers()
      vi.setSystemTime(firstTime)

      store.receiveMessage({
        message: { from: 'Alice', message: 'First' }
      })

      const firstTimestamp = store.contacts[0]?.lastMessageTime
      expect(firstTimestamp).toBeDefined()

      vi.setSystemTime(secondTime)

      store.receiveMessage({
        message: { from: 'Alice', message: 'Second' }
      })

      const secondTimestamp = store.contacts[0]?.lastMessageTime
      expect(secondTimestamp).toBeDefined()

      expect(secondTimestamp!).toBeGreaterThan(firstTimestamp!)

      vi.useRealTimers()
    })
  })
})
