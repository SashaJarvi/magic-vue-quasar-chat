import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useChatStore } from 'src/stores/chat-store'
import { useWebSocketStore } from 'src/stores/websocket-store'
import type { Contact } from 'src/types/chat'
import type { ConnectionStatus } from 'src/types/websocket'
import ChatLayout from 'src/layouts/ChatLayout.vue'

type ChatLayoutExposed = {
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => string
  getStatusLabel: (status: string) => string
  backButtonClickHandler: () => void
  reconnectionHandler: () => void
  activeContact: Partial<Contact> | null
  activeContactName: string | null
  activeContactNameFirstLetter: string
  connectionStatus: string
  isWebSocketConnected: boolean
  webSocketError: string | null
}

// Mock the stores
vi.mock('src/stores/chat-store', () => ({
  useChatStore: vi.fn()
}))

vi.mock('src/stores/websocket-store', () => ({
  useWebSocketStore: vi.fn()
}))

// Mock utility function
vi.mock('src/utils/get-uppercased-first-letter', () => ({
  default: vi.fn((name: string) => name.charAt(0).toUpperCase())
}))

describe('ChatLayout Component', () => {
  let mockChatStore: {
    activeContact: Partial<Contact> | null
    activeContactName: string | null
    clearActiveContact: ReturnType<typeof vi.fn>
    webSocketInitializationHandler: ReturnType<typeof vi.fn>
    webSocketDisconnectionHandler: ReturnType<typeof vi.fn>
  }

  let mockWebSocketStore: {
    status: ConnectionStatus
    isConnected: boolean
    lastError: string | null
    forceReconnect: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockChatStore = {
      activeContact: null,
      activeContactName: null,
      clearActiveContact: vi.fn(),
      webSocketInitializationHandler: vi.fn(),
      webSocketDisconnectionHandler: vi.fn()
    }

    mockWebSocketStore = {
      status: 'connected',
      isConnected: true,
      lastError: null,
      forceReconnect: vi.fn()
    }

    vi.mocked(useChatStore).mockReturnValue(mockChatStore as unknown as ReturnType<typeof useChatStore>)
    vi.mocked(useWebSocketStore).mockReturnValue(mockWebSocketStore as unknown as ReturnType<typeof useWebSocketStore>)
  })

  const createWrapper = (options = {}) => {
    return mount(ChatLayout, {
      global: {
        stubs: {
          ContactsList: true,
          ChatDialog: true
        }
      },
      ...options
    })
  }

  describe('Basic Rendering', () => {
    it('should render without errors', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Status Helper Functions', () => {
    it('should return correct status colors', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      expect(vm.getStatusColor('connected')).toBe('positive')
      expect(vm.getStatusColor('connecting')).toBe('warning')
      expect(vm.getStatusColor('reconnecting')).toBe('warning')
      expect(vm.getStatusColor('error')).toBe('negative')
      expect(vm.getStatusColor('unknown')).toBe('grey')
    })

    it('should return correct status icons', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      expect(vm.getStatusIcon('connected')).toBe('wifi')
      expect(vm.getStatusIcon('connecting')).toBe('sync')
      expect(vm.getStatusIcon('reconnecting')).toBe('sync')
      expect(vm.getStatusIcon('error')).toBe('wifi_off')
      expect(vm.getStatusIcon('unknown')).toBe('signal_wifi_off')
    })

    it('should return correct status labels', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      expect(vm.getStatusLabel('connected')).toBe('Online')
      expect(vm.getStatusLabel('connecting')).toBe('Connecting')
      expect(vm.getStatusLabel('reconnecting')).toBe('Reconnecting')
      expect(vm.getStatusLabel('error')).toBe('Error')
      expect(vm.getStatusLabel('unknown')).toBe('Offline')
    })
  })

  describe('Component Methods', () => {
    it('should call clearActiveContact when back button handler is triggered', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      vm.backButtonClickHandler()

      expect(mockChatStore.clearActiveContact).toHaveBeenCalled()
    })

    it('should call forceReconnect when reconnection handler is triggered', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      vm.reconnectionHandler()

      expect(mockWebSocketStore.forceReconnect).toHaveBeenCalled()
    })
  })

  describe('Computed Properties', () => {
    it('should return active contact from store', () => {
      const testContact: Partial<Contact> = { name: 'Alice', messages: [] }
      mockChatStore.activeContact = testContact

      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      expect(vm.activeContact).toBe(testContact)
    })

    it('should return active contact name from store', () => {
      mockChatStore.activeContactName = 'Bob'

      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      expect(vm.activeContactName).toBe('Bob')
    })

    it('should return first letter of active contact name', () => {
      mockChatStore.activeContactName = 'Charlie'

      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      expect(vm.activeContactNameFirstLetter).toBe('C')
    })

    it('should return empty string when no active contact name', () => {
      mockChatStore.activeContactName = null

      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      expect(vm.activeContactNameFirstLetter).toBe('')
    })

    it('should return connection status from WebSocket store', () => {
      mockWebSocketStore.status = 'connecting'

      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      expect(vm.connectionStatus).toBe('connecting')
    })

    it('should return connection state from WebSocket store', () => {
      mockWebSocketStore.isConnected = false

      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      expect(vm.isWebSocketConnected).toBe(false)
    })

    it('should return error from WebSocket store', () => {
      mockWebSocketStore.lastError = 'Connection timeout'

      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as ChatLayoutExposed

      expect(vm.webSocketError).toBe('Connection timeout')
    })
  })

  describe('Lifecycle Methods', () => {
    it('should call webSocketInitializationHandler on mount', () => {
      createWrapper()

      expect(mockChatStore.webSocketInitializationHandler).toHaveBeenCalled()
    })

    it('should handle WebSocket initialization errors gracefully', () => {
      mockChatStore.webSocketInitializationHandler.mockImplementation(() => {
        throw new Error('WebSocket not available')
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      createWrapper()

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket not available, will connect when available')

      consoleSpy.mockRestore()
    })

    it('should call webSocketDisconnectionHandler on unmount', () => {
      const wrapper = createWrapper()

      wrapper.unmount()

      expect(mockChatStore.webSocketDisconnectionHandler).toHaveBeenCalled()
    })
  })
})
