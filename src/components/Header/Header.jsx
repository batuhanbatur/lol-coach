import { CURRENT_PATCH } from '../../config/patch'
import styles from './Header.module.css'

function Header() {
  return (
    <header className={styles.header}>
      <span className={styles.wordmark}>lol-coach</span>
      <span className={styles.patch}>Patch {CURRENT_PATCH}</span>
    </header>
  )
}

export default Header
