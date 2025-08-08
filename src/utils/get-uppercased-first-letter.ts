const getUpppercasedFirstLetter = (str: string): string => {
  if (!str || str.length === 0) {
    return ''
  }
  return str.charAt(0).toUpperCase()
}

export default getUpppercasedFirstLetter
