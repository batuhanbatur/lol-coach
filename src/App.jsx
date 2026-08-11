import { useEffect, useMemo, useState } from 'react'
import { fetchLatestVersion, fetchChampions } from './services/ddragon'
import { analyzeInteractions } from './engine/matchInteractions'
import { analyzeCompWarnings } from './engine/compWarnings'
import { buildCoverageSet } from './utils/coverage'
import interactions from './data/interactions.json'
import championTags from './data/champion_tags.json'
import Header from './components/Header/Header'
import PickInput, { ROLES } from './components/PickInput/PickInput'
import BanRow from './components/BanRow/BanRow'
import AnalysisPanel from './components/AnalysisPanel/AnalysisPanel'
import styles from './components/PickInput/PickInput.module.css'

const coveredChampions = buildCoverageSet(interactions)

function emptyTeam() {
  return ROLES.map((role) => ({ championId: null, role }))
}

function App() {
  const [version, setVersion] = useState(null)
  const [champions, setChampions] = useState([])
  const [status, setStatus] = useState('loading')
  const [picks, setPicks] = useState({ blue: emptyTeam(), red: emptyTeam() })
  const [bans, setBans] = useState(Array(10).fill(null))
  const [mySlot, setMySlot] = useState(null)

  const interactionResults = useMemo(
    () => analyzeInteractions({ ...picks, bans, mySlot }, interactions),
    [picks, bans, mySlot]
  )

  const compResults = useMemo(
    () => analyzeCompWarnings({ ...picks, mySlot }, championTags),
    [picks, mySlot]
  )

  const results = [...interactionResults, ...compResults]

  const excludedIds = [...picks.blue, ...picks.red]
    .map((slot) => slot.championId)
    .concat(bans)
    .filter(Boolean)

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
      <Header />
      <PickInput
        champions={champions}
        version={version}
        picks={picks}
        onPicksChange={setPicks}
        mySlot={mySlot}
        onMySlotChange={setMySlot}
        excludedIds={excludedIds}
        coveredChampions={coveredChampions}
      />
      <BanRow
        champions={champions}
        version={version}
        bans={bans}
        onBansChange={setBans}
        excludedIds={excludedIds}
      />
      <section aria-label="analysis" className={styles.analysisSection}>
        <AnalysisPanel results={results} champions={champions} version={version} />
      </section>
    </div>
  )
}

export default App
