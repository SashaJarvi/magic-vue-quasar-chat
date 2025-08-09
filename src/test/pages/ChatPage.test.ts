import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatPage from 'src/pages/ChatPage.vue'

describe('ChatPage', () => {
  it('renders ChatLayout content', () => {
    const wrapper = mount(ChatPage)

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toContain('ChatLayout')
  })
})
