// The player's pick pool: the few champions they actually play. Stored in
// the browser only — no account, no backend.

const STORAGE_KEY = 'lol-coach:pick-pool'

export const MAX_POOL_SIZE = 5

// localStorage can be unavailable (private mode, blocked storage) or hold
// something unexpected, so both functions fail quietly: the pool is a
// convenience, never a reason to break the page.
export function loadPool() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!Array.isArray(stored)) return []
    return stored
      .filter((id) => typeof id === 'string')
      .slice(0, MAX_POOL_SIZE)
  } catch {
    return []
  }
}

export function savePool(pool) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pool))
  } catch {
    // Not saved; the pool still works for this visit.
  }
}
