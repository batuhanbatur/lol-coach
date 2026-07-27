import { useState } from 'react'
import { searchChampions } from '../../utils/championSearch'
import { championIconUrl } from '../../services/ddragon'
import styles from './BanRow.module.css'

function BanRow({ champions, version, bans, onBansChange, excludedIds }) {
  const [activeIndex, setActiveIndex] = useState(null)
  const [query, setQuery] = useState('')

  const results = activeIndex !== null ? searchChampions(query, champions, excludedIds) : []

  function championById(id) {
    return champions.find((champion) => champion.id === id)
  }

  function openSlot(index) {
    setActiveIndex(index)
    setQuery('')
  }

  function closeSlot() {
    setActiveIndex(null)
    setQuery('')
  }

  function selectChampion(championId) {
    if (activeIndex === null) return
    onBansChange(bans.map((ban, i) => (i === activeIndex ? championId : ban)))
    closeSlot()
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
      if (results.length > 0) selectChampion(results[0].id)
    } else if (event.key === 'Escape') {
      event.currentTarget.blur()
      closeSlot()
    }
  }

  function renderSlot(championId, index) {
    const champion = championById(championId)
    const isActive = activeIndex === index

    return (
      <div key={index} className={`${styles.slot} ${isActive ? styles.active : ''}`}>
        {isActive ? (
          <input
            autoFocus
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={closeSlot}
            placeholder="Ban..."
          />
        ) : champion ? (
          <button
            type="button"
            className={styles.filledButton}
            title={champion.name}
            onClick={() => openSlot(index)}
          >
            <img
              src={championIconUrl(version, champion.id)}
              alt={champion.name}
              className={styles.icon}
            />
          </button>
        ) : (
          <button
            type="button"
            className={styles.emptyButton}
            onClick={() => openSlot(index)}
          >
            +
          </button>
        )}

        {isActive && results.length > 0 && (
          <ul className={styles.results}>
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  className={styles.resultItem}
                  onMouseDown={() => selectChampion(result.id)}
                >
                  <img
                    src={championIconUrl(version, result.id)}
                    alt={result.name}
                    className={styles.resultIcon}
                  />
                  {result.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className={styles.banRow}>
      <span className={styles.label}>Bans</span>
      <div className={styles.slots}>{bans.map(renderSlot)}</div>
    </div>
  )
}

export default BanRow
