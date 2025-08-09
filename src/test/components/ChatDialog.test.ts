import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatDialog from 'src/components/ChatDialog.vue'
import { useChatStore } from 'src/stores/chat-store'

// Mock the chat store
vi.mock('src/stores/chat-store', () => ({
  useChatStore: vi.fn()
}))

describe('ChatDialog Component', () => {
  let mockChatStore: {
    activeContact: { name: string; messages: unknown[] } | null
    sendMessage: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockChatStore = {
      activeContact: null,
      sendMessage: vi.fn()
    }
    vi.mocked(useChatStore).mockReturnValue(mockChatStore as unknown as ReturnType<typeof useChatStore>)
  })

  const createWrapper = (options = {}) => {
    return mount(ChatDialog, {
      global: {
        stubs: {
          'q-icon': { template: '<div class="q-icon"><slot /></div>' },
          'q-form': { template: '<form @submit="$emit(\'submit\', $event)"><slot /></form>' },
          'q-input': { template: '<div class="q-input"><slot name="append" /></div>' },
          'q-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          'transition-group': { template: '<div><slot /></div>' }
        }
      },
      ...options
    })
  }

  it('should render without errors', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should show no-chat-selected when no active contact', () => {
    mockChatStore.activeContact = null
    const wrapper = createWrapper()

    const noChatDiv = wrapper.find('.no-chat-selected')
    expect(noChatDiv.exists()).toBe(true)
    expect(noChatDiv.text()).toContain('Select a contact to start chatting')
  })

  it('should show chat content when active contact exists', () => {
    mockChatStore.activeContact = {
      name: 'Alice',
      messages: []
    }
    const wrapper = createWrapper()

    const chatContent = wrapper.find('.chat-content')
    expect(chatContent.exists()).toBe(true)
  })
})
