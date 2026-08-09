import { useState } from 'react'
import { searchChampions } from '../../utils/championSearch'
import { championIconUrl } from '../../services/ddragon'
import styles from './PickInput.module.css'

const ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']

function PickInput({ champions, version, picks, onPicksChange, mySlot, onMySlotChange, excludedIds, coveredChampions }) {
  const [activeSlot, setActiveSlot] = useState(null)
  const [query, setQuery] = useState('')
  const [dragSlot, setDragSlot] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  const results = activeSlot ? searchChampions(query, champions, excludedIds) : []

  function championById(id) {
    return champions.find((champion) => champion.id === id)
  }

  function openSlot(team, index) {
    setActiveSlot({ team, index })
    setQuery('')
  }

  function closeSlot() {
    setActiveSlot(null)
    setQuery('')
  }

  function assignChampion(team, index, championId) {
    const nextTeamSlots = picks[team].map((slot, i) =>
      i === index ? { ...slot, championId } : slot
    )
    onPicksChange({ ...picks, [team]: nextTeamSlots })
  }

  function selectChampion(championId) {
    if (!activeSlot) return
    assignChampion(activeSlot.team, activeSlot.index, championId)
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

  function handleDragStart(team, index, event) {
    setDragSlot({ team, index })
    event.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnd() {
    setDragSlot(null)
    setDropTarget(null)
  }

  function handleDragOver(team, index, event) {
    event.preventDefault()
    setDropTarget({ team, index })
  }

  function handleDrop(team, index, event) {
    event.preventDefault()
    setDropTarget(null)
    if (!dragSlot) return
    if (dragSlot.team === team && dragSlot.index === index) return

    const source = picks[dragSlot.team][dragSlot.index]
    const target = picks[team][index]

    const next = { blue: [...picks.blue], red: [...picks.red] }
    next[dragSlot.team][dragSlot.index] = { ...source, championId: target.championId }
    next[team][index] = { ...target, championId: source.championId }
    onPicksChange(next)
    setDragSlot(null)
  }

  function renderSlot(team, index, slot) {
    const champion = championById(slot.championId)
    const isActive = activeSlot?.team === team && activeSlot?.index === index
    const isDragging = dragSlot?.team === team && dragSlot?.index === index
    const isDropTarget = dropTarget?.team === team && dropTarget?.index === index
    const isMe = mySlot?.team === team && mySlot?.index === index

    const slotClassName = [
      styles.slot,
      champion ? styles.filled : styles.empty,
      isDragging ? styles.dragging : '',
      isDropTarget ? styles.dropTarget : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div key={slot.role} className={styles.slotRow}>
        <span className={styles.roleLabel}>
          {isMe && (
            <button
              type="button"
              className={styles.meBadge}
              title="Untag yourself"
              onClick={() => onMySlotChange(null)}
            >
              ME
            </button>
          )}
          {slot.role}
        </span>
        <div
          className={slotClassName}
          draggable={Boolean(champion)}
          onDragStart={champion ? (event) => handleDragStart(team, index, event) : undefined}
          onDragEnd={handleDragEnd}
          onDragOver={(event) => handleDragOver(team, index, event)}
          onDragLeave={() =>
            setDropTarget((current) =>
              current?.team === team && current?.index === index ? null : current
            )
          }
          onDrop={(event) => handleDrop(team, index, event)}
        >
          {isActive ? (
            <>
              {champion && query.length === 0 && (
                <span className={styles.previousChampion}>
                  <img
                    src={championIconUrl(version, champion.id)}
                    alt={champion.name}
                    className={styles.filledIcon}
                  />
                  <span className={styles.championName}>{champion.name}</span>
                </span>
              )}
              <input
                autoFocus
                className={styles.searchInput}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                onBlur={closeSlot}
                placeholder="Search..."
              />
            </>
          ) : champion ? (
            <button
              type="button"
              className={styles.filledSlotButton}
              onClick={() => openSlot(team, index)}
            >
              <img
                src={championIconUrl(version, champion.id)}
                alt={champion.name}
                className={styles.filledIcon}
              />
              <span className={styles.championName}>{champion.name}</span>
              {!coveredChampions.has(champion.id) && (
                <span className={styles.noDataBadge} title="No curated interactions yet">
                  no data yet
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              className={styles.emptySlotButton}
              onClick={() => openSlot(team, index)}
            >
              +
            </button>
          )}

          {!isActive && !isMe && (
            <button
              type="button"
              className={styles.meButton}
              title="Tag this pick as you"
              onClick={() => onMySlotChange({ team, index })}
            >
              ME
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
      </div>
    )
  }

  function renderTeam(team, label) {
    return (
      <div className={styles.team}>
        <h2 className={styles.teamLabel}>{label}</h2>
        <div className={styles.slots}>
          {picks[team].map((slot, index) => renderSlot(team, index, slot))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.columns}>
      {renderTeam('blue', 'Blue Team')}
      {renderTeam('red', 'Red Team')}
    </div>
  )
}

export { ROLES }
export default PickInput
