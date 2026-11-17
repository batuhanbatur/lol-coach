import { useEffect, useMemo, useState } from 'react'
import { fetchLatestVersion, fetchChampions } from './services/ddragon'
import { analyzeInteractions } from './engine/matchInteractions'
import { analyzeCompWarnings } from './engine/compWarnings'
import { suggestPicks } from './engine/suggestPicks'
import { buildCoverageSet } from './utils/coverage'
import { loadPool, savePool } from './utils/pickPool'
import { latestVerifiedPatch } from './utils/dataStats'
import interactions from './data/interactions.json'
import championTags from './data/champion_tags.json'
import championPositions from './data/champion_positions.json'
import ultStealTiers from './data/ult_steal_tiers.json'
import Header from './components/Header/Header'
import PickInput, { ROLES } from './components/PickInput/PickInput'
import BanRow from './components/BanRow/BanRow'
import PickSuggestions from './components/PickSuggestions/PickSuggestions'
import AnalysisPanel from './components/AnalysisPanel/AnalysisPanel'
import Footer from './components/Footer/Footer'
import styles from './components/PickInput/PickInput.module.css'

const coveredChampions = buildCoverageSet(interactions)

// Shown in the footer as a real example of what the app surfaces.
const EXAMPLE_ENTRY_ID = 'morde-r-kalista-r'
const exampleEntry =
  interactions.find((entry) => entry.id === EXAMPLE_ENTRY_ID) ?? interactions[0]
const latestPatch = latestVerifiedPatch(interactions)

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
  const [pool, setPool] = useState(loadPool)

  const interactionResults = useMemo(
    () => analyzeInteractions({ ...picks, bans, mySlot }, interactions),
    [picks, bans, mySlot]
  )

  const compResults = useMemo(
    () => analyzeCompWarnings({ ...picks, mySlot }, championTags),
    [picks, mySlot]
  )

  const results = [...interactionResults, ...compResults]

  // Champions playable in my role, so suggestions from outside my pool
  // are at least ones I could plausibly pick in this slot.
  const myRole = mySlot ? picks[mySlot.team][mySlot.index].role : null
  const roleCandidates = useMemo(
    () =>
      Object.keys(championPositions).filter((championId) =>
        championPositions[championId].includes(myRole)
      ),
    [myRole]
  )

  const suggestions = useMemo(
    () =>
      suggestPicks({ ...picks, bans, mySlot }, pool, {
        interactions,
        championTags,
        roleCandidates,
        ultStealTiers,
      }),
    [picks, bans, mySlot, pool, roleCandidates]
  )

  const hasPicked = mySlot != null && picks[mySlot.team][mySlot.index].championId != null

  function handlePoolChange(nextPool) {
    setPool(nextPool)
    savePool(nextPool)
  }

  // Locks a suggested champion into the player's own slot.
  function handlePickSuggestion(championId) {
    if (!mySlot) return
    setPicks({
      ...picks,
      [mySlot.team]: picks[mySlot.team].map((slot, index) =>
        index === mySlot.index ? { ...slot, championId } : slot
      ),
    })
  }

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
      <PickSuggestions
        champions={champions}
        version={version}
        pool={pool}
        onPoolChange={handlePoolChange}
        suggestions={suggestions}
        mySlot={mySlot}
        hasPicked={hasPicked}
        onPick={handlePickSuggestion}
      />
      <section aria-label="analysis" className={styles.analysisSection}>
        <AnalysisPanel results={results} champions={champions} version={version} />
      </section>
      <Footer
        exampleEntry={exampleEntry}
        champions={champions}
        version={version}
        entryCount={interactions.length}
        latestPatch={latestPatch}
      />
    </div>
  )
}

export default App
