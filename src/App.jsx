import { useEffect, useState } from 'react'
import { fetchLatestVersion, fetchChampions, championIconUrl } from './services/ddragon'

function App() {
  const [version, setVersion] = useState(null)
  const [champions, setChampions] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    async function load() {
      try {
        const latestVersion = await fetchLatestVersion()
        const championList = await fetchChampions(latestVersion)
        setVersion(latestVersion)
        setChampions(championList)
        setStatus('ready')
      } catch {
        setStatus('error')
      }
    }
    load()
  }, [])

  if (status === 'loading') return <div>Loading...</div>
  if (status === 'error') return <div>Failed to load champion data.</div>

  return (
    <div>
      {champions.map((champion) => (
        <div key={champion.id}>
          <img src={championIconUrl(version, champion.id)} alt={champion.name} width={24} height={24} />
          {champion.name}
        </div>
      ))}
    </div>
  )
}

export default App
