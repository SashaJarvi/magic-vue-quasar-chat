const generateRandomId = (length: number = 10): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // fallback for environments without crypto.randomUUID
  return Date.now().toString() + Math.random().toString(36).substring(2, length)
}

export default generateRandomId
