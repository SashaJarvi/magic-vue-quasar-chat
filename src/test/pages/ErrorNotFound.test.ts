import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorNotFound from 'src/pages/ErrorNotFound.vue'

describe('ErrorNotFound', () => {
  it('should render the error page with correct title and message', () => {
    const wrapper = mount(ErrorNotFound)

    expect(wrapper.text()).toContain('404')
    expect(wrapper.text()).toContain('Oops. Nothing here...')
  })

  it('should have a link to go back to home', () => {
    const wrapper = mount(ErrorNotFound)
    const findQBtn = wrapper.findComponent('.q-btn')

    expect(findQBtn.exists()).toBe(true)
    expect(findQBtn.text()).toContain('Go Home')
  })
})
