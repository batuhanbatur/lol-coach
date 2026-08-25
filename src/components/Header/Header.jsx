import { CURRENT_PATCH } from '../../config/patch'
import styles from './Header.module.css'

function Header() {
  return (
    <header className={styles.header}>
      <span className={styles.wordmark}>lol-coach</span>
      <nav className={styles.nav}>
        <a href="#how-it-works" className={styles.navLink}>How it works</a>
        <a href="#about" className={styles.navLink}>About</a>
      </nav>
      <span className={styles.patch}>Patch {CURRENT_PATCH}</span>
    </header>
  )
}

export default Header
