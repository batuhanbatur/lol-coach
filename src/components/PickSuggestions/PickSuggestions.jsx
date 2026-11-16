import { useState } from 'react'
import { searchChampions } from '../../utils/championSearch'
import { championIconUrl } from '../../services/ddragon'
import { MAX_POOL_SIZE } from '../../utils/pickPool'
import styles from './PickSuggestions.module.css'

const UNAVAILABLE_LABELS = {
  banned: 'Banned',
  picked: 'Already picked',
}

function formatScore(score) {
  if (score > 0) return `+${score}`
  if (score < 0) return `−${Math.abs(score)}`
  return '0'
}

function reasonDotClass(kind, severity) {
  if (kind === 'advantage') return styles.dotAdvantage
  if (kind === 'warning') {
    return severity === 'critical' ? styles.dotCritical : styles.dotWarning
  }
  return styles.dotInfo
}

// Shows the player's pick pool and, once they have marked their slot,
// ranks the pool against the current draft. All ranking logic lives in
// engine/suggestPicks.js; this component only edits the pool and renders
// the result.
function PickSuggestions({
  champions,
  version,
  pool,
  onPoolChange,
  suggestions,
  mySlot,
  hasPicked,
  onPick,
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [query, setQuery] = useState('')

  const searchResults = isAdding ? searchChampions(query, champions, pool) : []
  const poolIsFull = pool.length >= MAX_POOL_SIZE

  function championById(id) {
    return champions.find((champion) => champion.id === id)
  }

  function closeSearch() {
    setIsAdding(false)
    setQuery('')
  }

  function addToPool(championId) {
    onPoolChange([...pool, championId])
    closeSearch()
  }

  function removeFromPool(championId) {
    onPoolChange(pool.filter((id) => id !== championId))
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
      if (searchResults.length > 0) addToPool(searchResults[0].id)
    } else if (event.key === 'Escape') {
      event.currentTarget.blur()
      closeSearch()
    }
  }

  function renderPoolEditor() {
    return (
      <div className={styles.poolRow}>
        <span className={styles.label}>Your picks</span>
        <div className={styles.pool}>
          {pool.map((championId) => {
            const champion = championById(championId)
            const name = champion?.name ?? championId
            return (
              <button
                key={championId}
                type="button"
                className={styles.poolChip}
                title={`Remove ${name}`}
                aria-label={`Remove ${name} from your picks`}
                onClick={() => removeFromPool(championId)}
              >
                <img
                  src={championIconUrl(version, championId)}
                  alt=""
                  className={styles.poolIcon}
                />
                <span className={styles.poolName}>{name}</span>
                <span className={styles.removeMark} aria-hidden="true">
                  ×
                </span>
              </button>
            )
          })}

          {!poolIsFull && (
            <div className={`${styles.addSlot} ${isAdding ? styles.addSlotActive : ''}`}>
              {isAdding ? (
                <input
                  autoFocus
                  className={styles.searchInput}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onBlur={closeSearch}
                  placeholder="Add a champion..."
                  aria-label="Add a champion to your picks"
                />
              ) : (
                <button
                  type="button"
                  className={styles.addButton}
                  aria-label="Add a champion to your picks"
                  onClick={() => setIsAdding(true)}
                >
                  +
                </button>
              )}

              {isAdding && searchResults.length > 0 && (
                <ul className={styles.results}>
                  {searchResults.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        className={styles.resultItem}
                        onMouseDown={() => addToPool(result.id)}
                      >
                        <img
                          src={championIconUrl(version, result.id)}
                          alt=""
                          className={styles.resultIcon}
                        />
                        {result.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // The description is always shown; the ME hint only appears once there
  // is a pool to rank but no slot to rank it for.
  function renderHint() {
    return (
      <>
        <p className={styles.hint}>
          Add the champions you play most to get suggestions on what to pick.
        </p>
        {pool.length > 0 && !mySlot && (
          <p className={styles.hint}>
            Hover your slot and select ME to rank them against this draft.
          </p>
        )}
      </>
    )
  }

  function renderSuggestion(suggestion, index) {
    const champion = championById(suggestion.championId)
    const name = champion?.name ?? suggestion.championId

    if (!suggestion.available) {
      return (
        <li key={suggestion.championId} className={`${styles.suggestion} ${styles.unavailable}`}>
          <span className={styles.rank} aria-hidden="true">
            –
          </span>
          <img
            src={championIconUrl(version, suggestion.championId)}
            alt=""
            className={styles.suggestionIcon}
          />
          <div className={styles.suggestionBody}>
            <span className={styles.suggestionName}>{name}</span>
            <p className={styles.noData}>
              {UNAVAILABLE_LABELS[suggestion.unavailableReason]}
            </p>
          </div>
        </li>
      )
    }

    const hasReasons =
      suggestion.interactionCards.length > 0 || suggestion.compGaps.length > 0

    return (
      <li key={suggestion.championId} className={styles.suggestion}>
        <span className={styles.rank}>{index + 1}</span>
        <img
          src={championIconUrl(version, suggestion.championId)}
          alt=""
          className={styles.suggestionIcon}
        />
        <div className={styles.suggestionBody}>
          <div className={styles.suggestionHeader}>
            <span className={styles.suggestionName}>{name}</span>
            <span className={styles.score} title="Advantages minus warnings, weighted by severity">
              {formatScore(suggestion.score)}
            </span>
          </div>

          {hasReasons ? (
            <ul className={styles.reasons}>
              {suggestion.interactionCards.map(({ entry, kind }) => (
                <li key={entry.id} className={styles.reason}>
                  <span
                    className={`${styles.dot} ${reasonDotClass(kind, entry.severity)}`}
                    aria-hidden="true"
                  />
                  {entry.description}
                </li>
              ))}
              {suggestion.compGaps.map(({ entry }) => (
                <li key={entry.id} className={styles.reason}>
                  <span className={`${styles.dot} ${styles.dotWarning}`} aria-hidden="true" />
                  {entry.description}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noData}>Nothing notable against this draft yet.</p>
          )}
        </div>
        <button
          type="button"
          className={styles.pickButton}
          onClick={() => onPick(suggestion.championId)}
        >
          Pick
        </button>
      </li>
    )
  }

  const showSuggestions = !hasPicked && suggestions.length > 0

  return (
    <section aria-label="pick suggestions" className={styles.section}>
      {renderPoolEditor()}
      {renderHint()}
      {showSuggestions && (
        <ol className={styles.suggestions}>{suggestions.map(renderSuggestion)}</ol>
      )}
    </section>
  )
}

export default PickSuggestions
