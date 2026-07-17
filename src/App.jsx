import { useEffect, useState } from 'react'
import { fetchLatestVersion, fetchChampions } from './services/ddragon'
import PickInput, { ROLES } from './components/PickInput/PickInput'
import styles from './components/PickInput/PickInput.module.css'

function emptyTeam() {
  return ROLES.map((role) => ({ championId: null, role }))
}

function App() {
  const [version, setVersion] = useState(null)
  const [champions, setChampions] = useState([])
  const [status, setStatus] = useState('loading')
  const [picks, setPicks] = useState({ ally: emptyTeam(), enemy: emptyTeam() })

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
    <div className={styles.page}>
      <PickInput champions={champions} version={version} picks={picks} onPicksChange={setPicks} />
      <section aria-label="analysis" className={styles.analysisSection} />
    </div>
  )
}

export default App
