import { describe, expect, it, vi } from 'vitest'
import generateRandomId from 'src/utils/generate-random-id'

const isUUID = (str: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(str)
}

describe('Generating of the random ID', () => {
  it('should create valid randomUUID, if environment supports crypto.randomUUID', () => {
    const randomId = generateRandomId()
    expect(isUUID(randomId)).toBe(true)
  })

  it('should create valid randomUUID using fallback functionality for environments without crypto.randomUUID', () => {
    vi.stubGlobal('crypto', undefined)

    const randomId = generateRandomId()
    expect(isUUID(randomId)).toBe(true)
  })
})
