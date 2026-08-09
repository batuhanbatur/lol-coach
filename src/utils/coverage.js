// Builds the set of champion ids that appear in at least one
// interactions.json entry. Case-sensitive, exact-string match — same
// convention the matching engine uses for champion ids.
export function buildCoverageSet(interactions) {
  const covered = new Set()
  for (const entry of interactions) {
    for (const championId of entry.champions) {
      covered.add(championId)
    }
  }
  return covered
}
