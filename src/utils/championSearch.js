function normalize(str) {
  return str.toLowerCase().replace(/['\s]/g, '')
}

function subsequenceMatch(query, name) {
  let queryIndex = 0
  let firstIndex = -1
  let lastIndex = -1
  let totalGap = 0

  for (let nameIndex = 0; nameIndex < name.length && queryIndex < query.length; nameIndex++) {
    if (name[nameIndex] === query[queryIndex]) {
      if (firstIndex === -1) firstIndex = nameIndex
      if (lastIndex !== -1) totalGap += nameIndex - lastIndex - 1
      lastIndex = nameIndex
      queryIndex++
    }
  }

  if (queryIndex < query.length) return null
  return { firstIndex, totalGap }
}

export function searchChampions(query, champions, excludeIds = []) {
  const excluded = new Set(excludeIds)
  const candidates = champions.filter((champion) => !excluded.has(champion.id))
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) return []

  const scored = []
  for (const champion of candidates) {
    const normalizedName = normalize(champion.name)
    const match = subsequenceMatch(normalizedQuery, normalizedName)
    if (!match) continue
    scored.push({
      champion,
      startsWith: normalizedName.startsWith(normalizedQuery),
      totalGap: match.totalGap,
      firstIndex: match.firstIndex,
    })
  }

  scored.sort((a, b) => {
    if (a.startsWith !== b.startsWith) return a.startsWith ? -1 : 1
    if (a.totalGap !== b.totalGap) return a.totalGap - b.totalGap
    if (a.firstIndex !== b.firstIndex) return a.firstIndex - b.firstIndex
    return a.champion.name.localeCompare(b.champion.name)
  })

  return scored.slice(0, 8).map((entry) => entry.champion)
}
