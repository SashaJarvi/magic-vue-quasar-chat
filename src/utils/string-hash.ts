export const getHashOfString = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char // hash * 31 + char
    hash |= 0 // Convert to 32-bit integer
  }
  return hash
}

export const normalizeHash = (hash: number, min: number, max: number) => Math.floor((hash % (max - min)) + min)
