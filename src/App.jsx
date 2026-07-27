import { useEffect, useMemo, useState } from 'react'
import { fetchLatestVersion, fetchChampions } from './services/ddragon'
import { analyzeInteractions } from './engine/matchInteractions'
import interactions from './data/interactions.json'
import PickInput, { ROLES } from './components/PickInput/PickInput'
import AnalysisPanel from './components/AnalysisPanel/AnalysisPanel'
import styles from './components/PickInput/PickInput.module.css'

function emptyTeam() {
  return ROLES.map((role) => ({ championId: null, role }))
}

function App() {
  const [version, setVersion] = useState(null)
  const [champions, setChampions] = useState([])
  const [status, setStatus] = useState('loading')
  const [picks, setPicks] = useState({ ally: emptyTeam(), enemy: emptyTeam() })

  // Engine speaks blue/red; ally maps to blue, so the default perspective
  // (mySlot null → blue) is the user's team.
  const results = useMemo(
    () =>
      analyzeInteractions(
        { blue: picks.ally, red: picks.enemy, bans: [], mySlot: null },
        interactions
      ),
    [picks]
  )

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
      <section aria-label="analysis" className={styles.analysisSection}>
        <AnalysisPanel results={results} champions={champions} version={version} />
      </section>
    </div>
  )
}

export default App
