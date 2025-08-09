import { getHashOfString, normalizeHash } from './string-hash'

type ColorRange = [number, number]
type HSL = [number, number, number]

const hRange: ColorRange = [0, 360]
const sRange: ColorRange = [50, 75]
const lRange: ColorRange = [25, 60]

const generateHSL = (name: string): HSL => {
  const hash = getHashOfString(name)
  const h = normalizeHash(hash, hRange[0], hRange[1])
  const s = normalizeHash(hash, sRange[0], sRange[1])
  const l = normalizeHash(hash, lRange[0], lRange[1])
  return [h, s, l]
}

const HSLtoString = (hsl: HSL) => {
  return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`
}

export const generateUniqueColor = (name: string): string => {
  const hsl = generateHSL(name)
  return HSLtoString(hsl)
}
