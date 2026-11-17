import AnalysisPanel from '../AnalysisPanel/AnalysisPanel'
import styles from './Footer.module.css'

const REPO_URL = 'https://github.com/batuhanbatur/lol-coach'

// "What you get" shows one real card from the data instead of describing
// the product. "About" says why the data can be trusted and who built it.
// The entry count and patch are passed in so the copy never goes stale.
function Footer({ exampleEntry, champions, version, entryCount, latestPatch }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <section id="what-you-get" className={styles.section}>
          <h2 className={styles.heading}>What you get</h2>
          {exampleEntry && (
            <div className={styles.example}>
              <AnalysisPanel
                results={[{ entry: exampleEntry, kind: 'info', involvesMe: false }]}
                champions={champions}
                version={version}
              />
            </div>
          )}
          <p className={styles.body}>
            Add picks as champ select unfolds. Mark your slot and list the
            champions you play to see which one fits this draft.
          </p>
        </section>

        <section id="about" className={styles.section}>
          <h2 className={styles.heading}>About</h2>
          <p className={styles.body}>
            <strong className={styles.lead}>Checked by hand.</strong> Every
            interaction is verified before it ships, against the League wiki
            or in game. {entryCount} interactions, last verified on patch{' '}
            {latestPatch}.
          </p>
          <p className={styles.body}>
            <strong className={styles.lead}>What it isn't.</strong> No win
            rates, no tier lists. Only the things that are easy to miss
            during champ select but obvious in hindsight.
          </p>
          <p className={styles.body}>
            <strong className={styles.lead}>Built by Batuhan Batur.</strong>{' '}
            <a
              href={REPO_URL}
              className={styles.link}
              target="_blank"
              rel="noreferrer"
            >
              Source on GitHub
            </a>
          </p>
        </section>
      </div>

      <p className={styles.legal}>
        lol-coach was created under Riot Games' "Legal Jibber Jabber" policy
        using assets owned by Riot Games. Riot Games does not endorse or
        sponsor this project.
      </p>
    </footer>
  )
}

export default Footer
