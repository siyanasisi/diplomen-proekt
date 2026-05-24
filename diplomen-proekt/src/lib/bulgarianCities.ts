import { BULGARIAN_CITIES } from '../constants/bulgarianCities'

const citySet = new Set<string>(BULGARIAN_CITIES)

export function isBulgarianCity(name: string): boolean {
  return citySet.has(name.trim())
}

export function filterBulgarianCities(query: string, limit = 12): string[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const normalized = trimmed.toLocaleLowerCase('bg')
  const startsWith: string[] = []
  const contains: string[] = []

  for (const city of BULGARIAN_CITIES) {
    const cityLower = city.toLocaleLowerCase('bg')
    if (cityLower.startsWith(normalized)) {
      startsWith.push(city)
    } else if (cityLower.includes(normalized)) {
      contains.push(city)
    }
  }

  return [...startsWith, ...contains].slice(0, limit)
}
