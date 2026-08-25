import styles from './Footer.module.css'

function Footer() {
  return (
    <footer className={styles.footer}>
      <section id="how-it-works" className={styles.section}>
        <h2 className={styles.heading}>How it works</h2>
        <ol className={styles.steps}>
          <li>
            <strong className={styles.stepTitle}>Enter the champions.</strong>{' '}
            Add picks as champ select develops.
          </li>
          <li>
            <strong className={styles.stepTitle}>lol-coach checks the matchup.</strong>{' '}
            It looks for notable champion interactions and composition
            characteristics.
          </li>
          <li>
            <strong className={styles.stepTitle}>Get the things worth remembering.</strong>{' '}
            Not a matchup encyclopedia — just what's useful before loading
            into the game.
          </li>
        </ol>
      </section>
      <section id="about" className={styles.section}>
        <h2 className={styles.heading}>About</h2>
        <p className={styles.body}>
          lol-coach is an independent project, not affiliated with or
          endorsed by Riot Games. It surfaces non-obvious ability
          interactions and comp gaps — the kind of thing that's easy to
          miss during champ select but obvious in hindsight.
        </p>
      </section>
    </footer>
  )
}

export default Footer
