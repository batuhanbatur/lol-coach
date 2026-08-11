const BASE_URL = 'https://ddragon.leagueoflegends.com'

export async function fetchLatestVersion() {
  const response = await fetch(`${BASE_URL}/api/versions.json`)
  const versions = await response.json()
  return versions[0]
}

export async function fetchChampions(version) {
  const response = await fetch(`${BASE_URL}/cdn/${version}/data/en_US/champion.json`)
  const { data } = await response.json()
  return Object.values(data)
    .filter(({ id }) => !id.startsWith('Jade_'))
    .map(({ id, name, title, tags }) => ({ id, name, title, tags }))
}

export function championIconUrl(version, championId) {
  return `${BASE_URL}/cdn/${version}/img/champion/${championId}.png`
}
