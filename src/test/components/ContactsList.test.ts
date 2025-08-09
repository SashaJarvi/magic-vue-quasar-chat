import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Contact } from 'src/types/chat'
import { useChatStore } from 'src/stores/chat-store'
import ContactsList from 'src/components/ContactsList.vue'

type ContactsListExposed = {
  formatTime: (timestamp: number) => string
}

// Mock the chat store
vi.mock('src/stores/chat-store', () => ({
  useChatStore: vi.fn()
}))

// Mock utility functions
vi.mock('src/utils/get-uppercased-first-letter', () => ({
  default: vi.fn((name: string) => name.charAt(0).toUpperCase())
}))

vi.mock('src/utils/generate-unique-color', () => ({
  default: vi.fn(() => 'rgb(221, 60, 73)')
}))

describe('ContactsList Component', () => {
  let mockChatStore: {
    sortedContacts: Contact[]
    activeContactName: string | null
    setActiveContact: ReturnType<typeof vi.fn>
    sendMessage: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockChatStore = {
      sortedContacts: [],
      activeContactName: null,
      setActiveContact: vi.fn(),
      sendMessage: vi.fn()
    }
    vi.mocked(useChatStore).mockReturnValue(mockChatStore as unknown as ReturnType<typeof useChatStore>)
  })

  const createWrapper = (options = {}) => {
    return mount(ContactsList, {
      global: {
        stubs: {
          'q-list': { template: '<div class="q-list"><slot /></div>' },
          'q-item-label': { template: '<div class="q-item-label"><slot /></div>' },
          'q-item': {
            template: '<div class="q-item" @click="$emit(\'click\')" :class="{ active: active }"><slot /></div>',
            props: ['clickable', 'active'],
            emits: ['click']
          },
          'q-item-section': { template: '<div class="q-item-section"><slot /></div>' },
          'q-avatar': { template: '<div class="q-avatar"><slot /></div>' },
          'q-badge': { template: '<div class="q-badge"><slot /></div>' },
          'unread-badge': { template: '<div class="unread-badge"><slot /></div>' }
        }
      },
      ...options
    })
  }

  it('should render without errors', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should display the correct title', () => {
    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('Contacts')
  })

  it('should show empty state when no contacts', () => {
    mockChatStore.sortedContacts = []
    const wrapper = mount(ContactsList)

    expect(wrapper.text()).toContain('No conversations yet')
  })

  it('should display contacts when available', () => {
    const testContacts: Contact[] = [
      {
        name: 'Alice',
        lastMessage: 'Hello there!',
        lastMessageTime: Date.now(),
        unreadCount: 2,
        messages: []
      },
      {
        name: 'Bob',
        lastMessage: 'How are you?',
        lastMessageTime: Date.now() - 1000,
        unreadCount: 0,
        messages: []
      }
    ]

    mockChatStore.sortedContacts = testContacts
    const wrapper = mount(ContactsList)

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
    expect(wrapper.text()).toContain('Hello there!')
    expect(wrapper.text()).toContain('How are you?')
  })

  it('should call selectContact when contact is clicked', async () => {
    const testContacts: Contact[] = [
      {
        name: 'Alice',
        lastMessage: 'Hello!',
        lastMessageTime: Date.now(),
        unreadCount: 1,
        messages: []
      }
    ]

    mockChatStore.sortedContacts = testContacts

    const wrapper = mount(ContactsList)
    const contactItem = wrapper.find('.q-item')
    await contactItem.trigger('click')

    expect(mockChatStore.setActiveContact).toHaveBeenCalledWith('Alice')
  })

  it('should format time correctly for recent messages (< 24 hours)', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as ContactsListExposed

    // Test time within last 24 hours
    const recentTime = Date.now() - 12 * 60 * 60 * 1000 // 12 hours ago
    const formattedTime = vm.formatTime(recentTime)

    // Should return HH:MM format (with or without AM/PM)
    expect(formattedTime).toMatch(/^\d{1,2}:\d{2}(\s?(AM|PM))?$/)
  })

  it('should format time correctly for messages within a week', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as ContactsListExposed

    // Test time within last week but more than 24 hours
    const weekTime = Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 days ago
    const formattedTime = vm.formatTime(weekTime)

    // Should return weekday (e.g., "Mon", "Tue", etc.)
    expect(formattedTime).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/)
  })

  it('should format time correctly for older messages (> 7 days)', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as ContactsListExposed

    // Test time older than 7 days
    const oldTime = Date.now() - 10 * 24 * 60 * 60 * 1000 // 10 days ago
    const formattedTime = vm.formatTime(oldTime)

    // Should return month and day format (e.g., "Jan 1", "Dec 25")
    expect(formattedTime).toMatch(/^[A-Za-z]{3} \d{1,2}$/)
  })

  it('should show active state for active contact', () => {
    const testContacts: Contact[] = [
      {
        name: 'Alice',
        lastMessage: 'Hello!',
        lastMessageTime: Date.now(),
        unreadCount: 0,
        messages: []
      }
    ]

    mockChatStore.sortedContacts = testContacts
    mockChatStore.activeContactName = 'Alice'

    const wrapper = mount(ContactsList)
    const activeContact = wrapper.find('.q-item.q-item--active')

    expect(activeContact.exists()).toBe(true)
  })

  it('should display unread badge for contacts with unread messages', () => {
    const testContacts: Contact[] = [
      {
        name: 'Alice',
        lastMessage: 'Hello!',
        lastMessageTime: Date.now(),
        unreadCount: 3,
        messages: []
      }
    ]

    mockChatStore.sortedContacts = testContacts

    const wrapper = mount(ContactsList)
    const unreadBadge = wrapper.find('.q-badge.unread-badge')

    expect(unreadBadge.exists()).toBe(true)
    expect(unreadBadge.text()).toContain('3')
  })
})
