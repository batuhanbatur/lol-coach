import { championIconUrl } from '../../services/ddragon'
import styles from './AnalysisPanel.module.css'

function accentClass(kind, severity) {
  if (kind === 'warning') {
    return severity === 'critical' ? styles.accentCritical : styles.accentWarning
  }
  if (kind === 'advantage') return styles.accentAdvantage
  return styles.accentInfo
}

function AnalysisPanel({ results, champions, version }) {
  if (results.length === 0) {
    return (
      <p className={styles.empty}>No notable interactions yet — add more picks.</p>
    )
  }

  function championName(id) {
    return champions.find((champion) => champion.id === id)?.name ?? id
  }

  return (
    <div className={styles.panel}>
      {results.map(({ entry, kind, involvesMe }) => (
        <article
          key={entry.id}
          className={`${styles.card} ${accentClass(kind, entry.severity)}`}
        >
          <header className={styles.cardHeader}>
            <span className={styles.severityLabel}>{entry.severity}</span>
            <span className={styles.championPair}>
              {entry.champions.map((championId) => (
                <span key={championId} className={styles.champion}>
                  <img
                    src={championIconUrl(version, championId)}
                    alt=""
                    className={styles.championIcon}
                  />
                  {championName(championId)}
                </span>
              ))}
            </span>
            {involvesMe && <span className={styles.youChip}>YOU</span>}
          </header>
          <p className={styles.description}>{entry.description}</p>
          {entry.timing_note && (
            <p className={styles.timingNote}>{entry.timing_note}</p>
          )}
        </article>
      ))}
    </div>
  )
}

export default AnalysisPanel
