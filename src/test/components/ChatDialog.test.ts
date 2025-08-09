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
          'transition-group': { template: '<div><slot /></div>' },
          'q-tooltip': { template: '<span class="q-tooltip" style="display: none;"><slot /></span>' }
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

  it('should display message time in 24-hour format', () => {
    const testTimestamp = Date.now()
    mockChatStore.activeContact = {
      name: 'Alice',
      messages: [
        {
          id: '1',
          from: 'Alice',
          message: 'Hello!',
          timestamp: testTimestamp,
          isOwn: false
        }
      ]
    }
    const wrapper = createWrapper()

    const messageTime = wrapper.find('.message-time')
    expect(messageTime.exists()).toBe(true)

    // Should contain time in HH:MM format (24-hour)
    const timeText = messageTime.text()
    expect(timeText).toMatch(/\d{2}:\d{2}/)

    // Should not contain AM or PM
    expect(timeText).not.toMatch(/AM|PM/i)
  })

  it('should contain tooltip with formatted date and time', () => {
    // Use a fixed timestamp to ensure consistent test results
    const testDate = new Date('2025-08-09T14:30:00')
    const testTimestamp = testDate.getTime()

    mockChatStore.activeContact = {
      name: 'Alice',
      messages: [
        {
          id: '1',
          from: 'Alice',
          message: 'Hello!',
          timestamp: testTimestamp,
          isOwn: false
        }
      ]
    }
    const wrapper = createWrapper()

    const tooltip = wrapper.find('.q-tooltip')
    expect(tooltip.exists()).toBe(true)

    // Extract expected format from the actual date
    const expectedText = `9 Aug 2025 at ${testDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`
    expect(tooltip.text()).toBe(expectedText)
  })

  it('should show tooltip for multiple messages with correct timestamps', () => {
    const date1 = new Date('2025-08-09T14:30:00')
    const date2 = new Date('2025-12-25T09:15:00')
    const timestamp1 = date1.getTime()
    const timestamp2 = date2.getTime()

    mockChatStore.activeContact = {
      name: 'Alice',
      messages: [
        {
          id: '1',
          from: 'Alice',
          message: 'First message',
          timestamp: timestamp1,
          isOwn: false
        },
        {
          id: '2',
          from: 'You',
          message: 'Second message',
          timestamp: timestamp2,
          isOwn: true
        }
      ]
    }
    const wrapper = createWrapper()

    const tooltips = wrapper.findAll('.q-tooltip')
    expect(tooltips).toHaveLength(2)

    const expected1 = `9 Aug 2025 at ${date1.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`
    const expected2 = `25 Dec 2025 at ${date2.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`

    expect(tooltips[0]?.text()).toBe(expected1)
    expect(tooltips[1]?.text()).toBe(expected2)
  })

  it('should format tooltip correctly for different months', () => {
    const januaryDate = new Date('2025-01-15T10:05:00')
    const decemberDate = new Date('2025-12-31T23:59:00')
    const januaryTimestamp = januaryDate.getTime()
    const decemberTimestamp = decemberDate.getTime()

    mockChatStore.activeContact = {
      name: 'Bob',
      messages: [
        {
          id: '1',
          from: 'Bob',
          message: 'January message',
          timestamp: januaryTimestamp,
          isOwn: false
        },
        {
          id: '2',
          from: 'Bob',
          message: 'December message',
          timestamp: decemberTimestamp,
          isOwn: false
        }
      ]
    }
    const wrapper = createWrapper()

    const tooltips = wrapper.findAll('.q-tooltip')

    const expectedJan = `15 Jan 2025 at ${januaryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`
    const expectedDec = `31 Dec 2025 at ${decemberDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`

    expect(tooltips[0]?.text()).toBe(expectedJan)
    expect(tooltips[1]?.text()).toBe(expectedDec)
  })
})
