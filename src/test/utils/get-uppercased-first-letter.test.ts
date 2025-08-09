import { describe, expect, it } from 'vitest'
import getUppercasedFirstLetter from 'src/utils/get-uppercased-first-letter'

describe('getUppercasedFirstLetter', () => {
  it('should return the first letter of a string in uppercase', () => {
    expect(getUppercasedFirstLetter('Sophia')).toBe('S')
  })

  it('should handle empty strings', () => {
    expect(getUppercasedFirstLetter('')).toBe('')
  })

  it('should handle single character strings', () => {
    expect(getUppercasedFirstLetter('a')).toBe('A')
    expect(getUppercasedFirstLetter('Z')).toBe('Z')
  })

  it('should handle strings with special characters', () => {
    expect(getUppercasedFirstLetter('@hello')).toBe('@')
    expect(getUppercasedFirstLetter('#world')).toBe('#')
  })
})
