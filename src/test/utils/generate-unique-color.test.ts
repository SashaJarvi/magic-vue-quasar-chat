import { describe, expect, it } from 'vitest'
import generateUniqueColor from 'src/utils/generate-unique-color'

describe('Generating unique colors', () => {
  it('should generate a color in the expected format', () => {
    const color = generateUniqueColor('testUser')
    expect(color).toMatch(/hsl\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*\)/)
  })

  it('should generate different colors on subsequent calls', () => {
    const color1 = generateUniqueColor('testUser1')
    const color2 = generateUniqueColor('testUser2')
    expect(color1).not.toBe(color2)
  })

  it('should generate a color that is not black or white', () => {
    const color = generateUniqueColor('testUser')
    expect(color).not.toBe('#000000') // Black
    expect(color).not.toBe('#FFFFFF') // White
  })
})
