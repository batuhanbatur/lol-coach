// Facts about the shipped data, computed so the page copy never goes stale.

// Compares patch strings like "26.9" and "26.14" numerically, part by
// part. (As plain strings, "26.9" would sort after "26.14".)
function comparePatches(a, b) {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const difference = (partsA[i] ?? 0) - (partsB[i] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

// The newest patch any entry was verified on, or null if there is none.
export function latestVerifiedPatch(interactions) {
  let latest = null
  for (const entry of interactions) {
    const patch = entry.patch_verified
    if (typeof patch !== 'string' || patch.trim() === '') continue
    if (latest === null || comparePatches(patch, latest) > 0) latest = patch
  }
  return latest
}
